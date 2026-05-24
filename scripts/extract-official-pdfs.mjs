import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data/official/sources.json");
const OUT_DIR = path.join(ROOT, "data/official");

const KNOWN_CHARACTER_LABELS = [
  "Name",
  "Player",
  "Childhood",
  "Trait",
  "Cattribute",
  "Strong",
  "Smart",
  "Cute",
  "Heart",
  "Furr-endship",
  "Backpack",
  "Spellbook",
  "Notes"
];

async function loadPdfTools() {
  try {
    const [pdfjs, pdfLib] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdf-lib")
    ]);

    return { pdfjs, PDFDocument: pdfLib.PDFDocument };
  } catch (error) {
    if (process.env.PDF_TOOLS_NODE_MODULES) {
      const moduleRoot = process.env.PDF_TOOLS_NODE_MODULES;
      const pdfjs = await import(pathToFileURL(path.join(moduleRoot, "pdfjs-dist/legacy/build/pdf.mjs")).href);
      const require = createRequire(pathToFileURL(path.join(moduleRoot, "package.json")).href);
      const pdfLib = require(path.join(moduleRoot, "pdf-lib/cjs/index.js"));

      return { pdfjs, PDFDocument: pdfLib.PDFDocument };
    }

    throw new Error(
      "PDF extraction requires pdfjs-dist and pdf-lib. Install them as dev dependencies or set PDF_TOOLS_NODE_MODULES before running this script."
    );
  }
}

async function readSources() {
  const parsed = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
  return parsed.sources;
}

async function fetchPdf(source) {
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`${source.id}: failed to download PDF (${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  return { bytes, sha256 };
}

async function extractPages(pdfjs, bytes) {
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const text = await page.getTextContent();

    const items = text.items
      .map((item) => {
        const [, , , , x, y] = item.transform;
        return {
          text: item.str.trim(),
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          width: Math.round((item.width || 0) * 100) / 100,
          height: Math.round((item.height || 0) * 100) / 100,
          fontName: item.fontName
        };
      })
      .filter((item) => item.text);

    pages.push({
      page: pageNumber,
      width: Math.round(viewport.width * 100) / 100,
      height: Math.round(viewport.height * 100) / 100,
      items
    });
  }

  return pages;
}

async function extractFormFields(PDFDocument, bytes) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();

  return form.getFields().map((field) => ({
    name: field.getName(),
    type: field.constructor.name
  }));
}

function normalizeId(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapLabel(label) {
  const id = normalizeId(label);

  if (["strong", "smart", "cute"].includes(id)) {
    return {
      id,
      label,
      section: "abilities",
      kind: "number",
      min: 1,
      max: 6,
      appPath: `character.abilities.${label}`
    };
  }

  if (["heart", "furr-endship"].includes(id)) {
    return {
      id,
      label,
      section: "resources",
      kind: "resource",
      appPath: `character.resources.${label}`
    };
  }

  return {
    id,
    label,
    section: ["backpack", "spellbook", "notes"].includes(id) ? "inventory-notes" : "identity",
    kind: "text",
    appPath: `character.${id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`
  };
}

function detectCharacterFields(source, pages, formFields) {
  const detected = new Map();

  for (const page of pages) {
    for (const item of page.items) {
      const label = KNOWN_CHARACTER_LABELS.find((candidate) => item.text.toLowerCase() === candidate.toLowerCase());
      if (!label) continue;

      const field = mapLabel(label);
      detected.set(`${source.id}:${field.id}`, {
        ...field,
        source: {
          sourceId: source.id,
          page: page.page,
          bbox: [item.x, item.y, item.width, item.height],
          confidence: 0.9
        }
      });
    }
  }

  for (const field of formFields) {
    const label = field.name;
    const mapped = mapLabel(label);
    detected.set(`${source.id}:${mapped.id}`, {
      ...mapped,
      formType: field.type,
      source: {
        sourceId: source.id,
        confidence: 0.95
      }
    });
  }

  return [...detected.values()];
}

function groupLines(items) {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];

  for (const item of sorted) {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) < 3);
    if (line) {
      line.items.push(item);
      line.y = (line.y + item.y) / 2;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines.map((line) => {
    const lineItems = line.items.sort((a, b) => a.x - b.x);
    const text = lineItems.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim();
    const minX = Math.min(...lineItems.map((item) => item.x));
    const minY = Math.min(...lineItems.map((item) => item.y));
    const maxX = Math.max(...lineItems.map((item) => item.x + item.width));
    const maxY = Math.max(...lineItems.map((item) => item.y + item.height));

    return {
      text,
      bbox: [minX, minY, Math.round((maxX - minX) * 100) / 100, Math.round((maxY - minY) * 100) / 100]
    };
  });
}

function looksLikeRuleHeading(text) {
  if (text.length < 3 || text.length > 80) return false;
  if (/^\d+$/.test(text)) return false;
  if (text.split(" ").length > 8) return false;
  return /^[A-Z][A-Za-z0-9 '\-/&]+$/.test(text);
}

function detectRuleCandidates(source, pages) {
  return pages.flatMap((page) =>
    groupLines(page.items)
      .filter((line) => looksLikeRuleHeading(line.text))
      .slice(0, 25)
      .map((line) => ({
        id: normalizeId(`${source.id}-${line.text}`),
        title: line.text,
        summary: "",
        details: "",
        tags: [],
        pinned: false,
        reviewed: false,
        source: {
          sourceId: source.id,
          page: page.page,
          bbox: line.bbox
        }
      }))
  );
}

function deriveStyleCues(source, pages) {
  const pageSizes = pages.map((page) => ({
    page: page.page,
    width: page.width,
    height: page.height
  }));

  const fontNames = [...new Set(pages.flatMap((page) => page.items.map((item) => item.fontName)).filter(Boolean))];

  return {
    sourceId: source.id,
    pageSizes,
    fontNames,
    notes: ["Derived metrics only; no source artwork, screenshots, or full text stored."]
  };
}

async function writeJson(fileName, value) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const { pdfjs, PDFDocument } = await loadPdfTools();
  const sources = await readSources();
  const report = [];
  const fields = [];
  const ruleCandidates = [];
  const styleCues = [];

  for (const source of sources) {
    const { bytes, sha256 } = await fetchPdf(source);
    const pages = await extractPages(pdfjs, bytes);
    const formFields = await extractFormFields(PDFDocument, bytes);

    report.push({
      sourceId: source.id,
      title: source.title,
      type: source.type,
      url: source.url,
      sha256,
      pageCount: pages.length,
      formFieldCount: formFields.length
    });

    if (source.type === "character-sheet") {
      fields.push(...detectCharacterFields(source, pages, formFields));
    }

    if (["rules", "quick-reference"].includes(source.type)) {
      ruleCandidates.push(...detectRuleCandidates(source, pages));
    }

    styleCues.push(deriveStyleCues(source, pages));
  }

  await writeJson("extraction-report.json", { schemaVersion: 1, sources: report });
  await writeJson("character-sheet.fields.json", { schemaVersion: 1, fields });
  await writeJson("rules.quick-reference.candidates.json", { schemaVersion: 1, rules: ruleCandidates });
  await writeJson("style-cues.json", { schemaVersion: 1, cues: styleCues });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
