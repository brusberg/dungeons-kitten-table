# Lattice

System-wide coordination notes for this project.

## Workspace

- Project path: `/Users/Brenden_Brusberg/Documents/Codex/2026-05-23/i-need-a-next-js-app`
- Default branch: `main`
- App shape: Next.js App Router, shared campaign document with live sync first, local cache as fallback.

## Agent Operating Model

- Project agents may only read or edit files inside this repo unless system package tooling is explicitly required.
- Do not inspect or modify user data outside this project path.
- Keep small, independent changes on the current branch.
- Use a worktree and branch when a subagent owns files that may conflict with active work.
- Workers must state their write scope before editing.
- Workers must not revert changes they did not make.
- Explorers return findings only; workers return changed paths and verification.

## Branch Pattern

- `feature/mvp-shell`
- `feature/dice-roller`
- `feature/rules-reference`
- `feature/character-sheet`
- `feature/db-adapter`
- `qa/mobile-pass`

## Handoff Contract

Every agent handoff should include:

- Goal
- Files owned
- Assumptions
- Changes made
- Tests or checks run
- Open risks

## MVP Boundaries

- The app supports editable sheets, rolls, table notes, and rules reference.
- Multi-device player/Storyteller sync is MVP scope.
- Joining a table is lightweight: users pick a campaign/session and choose who they are.
- Identity is intentionally flexible for MVP: anyone can view or act as any character, including Storyteller.
- Live updates should cover sheet edits, resource changes, conditions, rolls, rules edits, and shared log entries.
- The app does not generate story, character backstory, or campaign content.
- The app may seed official/public reference fields and example pregens for convenience.
- Browser cache and JSON import/export are fallback/backup tools, not the primary persistence model.
- Persistence should keep the campaign document shape behind a repository adapter.
