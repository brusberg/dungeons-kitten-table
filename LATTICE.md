# Lattice

System-wide coordination notes for this project.

## Workspace

- Project path: `/Users/Brenden_Brusberg/Documents/Codex/2026-05-23/i-need-a-next-js-app`
- Default branch: `main`
- App shape: Next.js App Router, local cached campaign document first, database adapter later.

## Agent Operating Model

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
- The app does not generate story, character backstory, or campaign content.
- The app may seed official/public reference fields and example pregens for convenience.
- Current persistence is browser cache plus JSON import/export.
- Future persistence should keep the same campaign document shape behind a repository adapter.
