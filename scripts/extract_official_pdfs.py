#!/usr/bin/env python3
import hashlib
import json
import re
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "data" / "official" / "sources.json"
OUT_DIR = ROOT / "data" / "official"

KNOWN_CHARACTER_LABELS = [
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
    "Notes",
]


def slug(value):
    value = value.lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def camel_from_slug(value):
    pieces = value.split("-")
    return pieces[0] + "".join(piece[:1].upper() + piece[1:] for piece in pieces[1:])


def read_sources():
    return json.loads(SOURCE_PATH.read_text())["sources"]


def fetch_pdf(source):
    with urllib.request.urlopen(source["url"], timeout=30) as response:
        data = response.read()
    return data, hashlib.sha256(data).hexdigest()


def map_label(label, source_id, page=None):
    field_id = slug(label)

    if field_id in ["strong", "smart", "cute"]:
        return {
            "id": field_id,
            "label": label,
            "section": "abilities",
            "kind": "number",
            "min": 1,
            "max": 6,
            "appPath": f"character.abilities.{label}",
            "source": {"sourceId": source_id, "page": page, "confidence": 0.75},
        }

    if field_id in ["heart", "furr-endship"]:
        return {
            "id": field_id,
            "label": label,
            "section": "resources",
            "kind": "resource",
            "appPath": f"character.resources.{label}",
            "source": {"sourceId": source_id, "page": page, "confidence": 0.75},
        }

    section = "inventory-notes" if field_id in ["backpack", "spellbook", "notes"] else "identity"
    return {
        "id": field_id,
        "label": label,
        "section": section,
        "kind": "text",
        "appPath": f"character.{camel_from_slug(field_id)}",
        "source": {"sourceId": source_id, "page": page, "confidence": 0.75},
    }


def extract_form_fields(reader, source):
    fields = reader.get_fields() or {}
    detected = []

    for name, field in fields.items():
        field_data = map_label(name, source["id"])
        field_data["formType"] = str(field.get("/FT", "unknown"))
        field_data["source"]["confidence"] = 0.95
        detected.append(field_data)

    return detected


def extract_character_labels(reader, source):
    detected = {}

    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        lower_text = text.lower()

        for label in KNOWN_CHARACTER_LABELS:
            if label.lower() in lower_text:
                field = map_label(label, source["id"], page_index)
                detected[field["id"]] = field

    return list(detected.values())


def looks_like_heading(line):
    if len(line) < 3 or len(line) > 80:
        return False
    if len(line.split()) > 8:
        return False
    if re.fullmatch(r"\d+", line):
        return False
    return re.match(r"^[A-Z][A-Za-z0-9 '&/\-]+$", line) is not None


def extract_rule_candidates(reader, source):
    candidates = []

    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
        page_candidates = []

        for line in lines:
            if looks_like_heading(line):
                page_candidates.append(
                    {
                        "id": slug(f"{source['id']}-{line}"),
                        "title": line,
                        "summary": "",
                        "details": "",
                        "tags": [],
                        "pinned": False,
                        "reviewed": False,
                        "source": {"sourceId": source["id"], "page": page_index},
                    }
                )

        candidates.extend(page_candidates[:25])

    return candidates


def style_cues(reader, source):
    return {
        "sourceId": source["id"],
        "pageSizes": [
            {
                "page": index,
                "width": round(float(page.mediabox.width), 2),
                "height": round(float(page.mediabox.height), 2),
            }
            for index, page in enumerate(reader.pages, start=1)
        ],
        "notes": ["Derived metrics only; no source artwork, screenshots, or full text stored."],
    }


def write_json(name, payload):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / name).write_text(json.dumps(payload, indent=2) + "\n")


def main():
    report = []
    fields = []
    rule_candidates = []
    cues = []

    for source in read_sources():
        data, sha256 = fetch_pdf(source)
        reader = PdfReader(BytesIO(data))
        form_fields = extract_form_fields(reader, source)

        report.append(
            {
                "sourceId": source["id"],
                "title": source["title"],
                "type": source["type"],
                "url": source["url"],
                "sha256": sha256,
                "pageCount": len(reader.pages),
                "formFieldCount": len(form_fields),
            }
        )

        if source["type"] == "character-sheet":
            merged = {field["id"]: field for field in extract_character_labels(reader, source)}
            merged.update({field["id"]: field for field in form_fields})
            fields.extend(merged.values())

        if source["type"] in ["rules", "quick-reference"]:
            rule_candidates.extend(extract_rule_candidates(reader, source))

        cues.append(style_cues(reader, source))

    write_json("extraction-report.json", {"schemaVersion": 1, "sources": report})
    write_json("character-sheet.fields.json", {"schemaVersion": 1, "fields": fields})
    write_json(
        "rules.quick-reference.candidates.json",
        {"schemaVersion": 1, "rules": rule_candidates},
    )
    write_json("style-cues.json", {"schemaVersion": 1, "cues": cues})


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
