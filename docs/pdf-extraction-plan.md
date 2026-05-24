# PDF Extraction Plan

The app should not render or reproduce the official PDFs as its primary UI. It should use app-native HTML controls, backed by curated data derived from official sources.

## Principle

Extraction creates candidates. Humans curate what ships.

```text
official PDFs
  -> script extracts structure/provenance
  -> candidate JSON
  -> manual review
  -> compact app-native defaults
```

Do not commit:

- downloaded PDFs
- full PDF text dumps
- page screenshots
- embedded artwork
- long copied rule passages

Commit:

- source URLs and hashes
- field names and app mappings
- short reviewed rule summaries
- derived styling cues
- extraction reports

## Outputs

```text
data/official/sources.json
data/official/extraction-report.json
data/official/character-sheet.fields.json
data/official/rules.quick-reference.candidates.json
data/official/style-cues.json
```

Only `sources.json` is hand-maintained. The rest are generated or curated.

## Script

```text
scripts/extract-official-pdfs.mjs
```

Responsibilities:

- download each source PDF at run time
- compute SHA-256
- inspect page count and dimensions
- inspect AcroForm field names when present
- extract text items with page coordinates
- detect known character sheet labels
- detect short rule heading candidates
- emit derived layout/style cues

The script intentionally stores only short candidates and provenance. Rule summaries remain blank until reviewed and rewritten for table use.

## Styling

Use derived styling cues only:

```text
paper feel
ink/accent palette
compact boxed sections
thin borders
small dense labels
clear resource/stat grouping
```

Avoid using the PDF as a background image. Mobile controls should be easier to tap than the original sheet.
