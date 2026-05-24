# Core System Implementation Plan

## Goal

Build the shared table core without turning the app into a large framework. The first implementation should preserve the current Next.js App Router shape, add a small repository boundary, and support live campaign state, lightweight table joining, seat selection, rolls, rules, and local cache fallback.

## Next.js Principles

- Keep routes thin. Use `app/page.jsx` and small route-level components for composition, not domain logic.
- Keep domain state plain JSON so it can move between local storage, server actions, route handlers, and a hosted realtime store.
- Put all persistence behind one repository API. UI code should not know whether data comes from local storage, a hosted database, or a test fixture.
- Prefer client components for live table interaction. Add server code only when persistence, seeding, or deployment requires it.
- Avoid premature auth. MVP identity is a device-local seat choice, not an account.
- Make sync operations small and obvious: save one character, save one rule, append one roll, update session metadata.

## Proposed Low-LOC File Structure

```text
app/
  page.jsx                  current shell, later mostly composition
  layout.jsx
  globals.css

lib/
  campaign/
    schema.js               defaults, normalize/migrate helpers, ids
    repository.js           repository interface docs/types by convention
    localRepository.js      localStorage implementation
    realtimeRepository.js   hosted adapter when selected
  seats.js                  seat derivation and local seat persistence
  rolls.js                  dice and success calculation

components/
  JoinTable.jsx
  SeatSwitcher.jsx
  TableView.jsx
  SheetView.jsx
  DicePanel.jsx
  RulesPanel.jsx
```

Initial implementation can be smaller than this:

```text
lib/campaign/schema.js
lib/campaign/localRepository.js
lib/seats.js
lib/rolls.js
```

Only split `components/` out when `app/page.jsx` becomes difficult to scan.

## Repository API Pseudocode

```js
function createCampaignRepository({ mode }) {
  return mode === "realtime" ? realtimeRepository() : localRepository();
}

const CampaignRepository = {
  async listTables() {},
  async createTable(seed) {},
  async joinTable(codeOrId) {},
  subscribeTable(tableId, onChange) {
    return () => unsubscribe();
  },
  async saveSession(tableId, patch) {},
  async saveCharacter(tableId, characterId, patch) {},
  async saveRule(tableId, ruleId, patch) {},
  async appendRoll(tableId, roll) {},
  async appendLog(tableId, entry) {},
  async exportTable(tableId) {},
  async importTable(snapshot) {}
};
```

Expected state shape:

```js
{
  schemaVersion: 1,
  id,
  code,
  name,
  session: {
    name,
    status,
    sceneNotes,
    updatedAt
  },
  seats: [
    { id: "storyteller", label: "Storyteller", kind: "storyteller" },
    { id: "char_1", label: "Sparkle", kind: "character", characterId: "char_1" },
    { id: "observer", label: "Observer", kind: "observer" }
  ],
  characters: [],
  rules: [],
  rolls: [],
  log: [],
  updatedAt
}
```

## Join And Seat Flow

```text
Open table link or enter table code
  -> repository.joinTable(code)
  -> subscribeTable(table.id)
  -> derive seats from Storyteller + characters + Observer
  -> choose seat
  -> save selected seat id in localStorage for this device
  -> route default view from seat kind
```

Seat behavior:

- `Storyteller`: opens table view, can inspect every character.
- `Character`: opens that character sheet first, can still switch views.
- `Observer`: opens table view, read-mostly by table convention.

For MVP, the seat is not an authorization boundary. It controls defaults, attribution, and roll/log labels.

## Branching Design Options

| Decision | Option | Probability | Notes |
| --- | --- | ---: | --- |
| First persistence step | Local repository plus repository API | 80% | Lowest risk; lets UI refactor happen before choosing hosted sync. |
| First persistence step | Hosted realtime store immediately | 20% | Faster to prove multi-device sync, but adds deployment and schema pressure early. |
| Realtime backend | Supabase realtime/Postgres | 45% | Good fit if tables, history, and future auth matter. |
| Realtime backend | Firebase/Firestore | 35% | Very fast document sync; natural match for campaign document shape. |
| Realtime backend | PartyKit/room server | 20% | Strong live-room model; more custom persistence choices. |
| State granularity | One campaign document with append-only rolls/log | 70% | Simple MVP mental model and easy export/import. |
| State granularity | Split collections per entity | 30% | Better scaling and conflict isolation, more adapter code. |

Recommended path: start with local repository parity, then swap in one realtime adapter behind the same API.

## Implementation Phases

1. Extract domain helpers
   - Move default campaign creation, ids, migrations, dice math, and seat derivation into `lib/`.
   - Keep behavior identical to the current local app.

2. Add repository boundary
   - Implement `localRepository` over localStorage.
   - Update UI calls to use repository methods and subscriptions.
   - Preserve JSON export/import as repository operations.

3. Add join state
   - Introduce join-by-code/link screen for unknown tables.
   - Add seat selector and device-local selected seat.
   - Use seat to choose default tab and roll attribution.

4. Prepare live sync
   - Keep writes narrow: session patch, character patch, rule patch, append roll/log.
   - Add `updatedAt` consistently.
   - Normalize imported snapshots through schema migration.

5. Add realtime adapter
   - Implement the selected hosted adapter behind `CampaignRepository`.
   - Keep local cache as offline/fallback snapshot.
   - Verify two-device sync for sheet edits, resource changes, rules, rolls, and log.

6. Stabilize MVP
   - Add focused tests for schema migration, dice math, seat derivation, and repository contract behavior.
   - Add manual QA pass for mobile join, seat switching, and simultaneous edits.

## Non-Goals

- Accounts, passwords, ownership enforcement, private notes, and role permissions.
- Full collaborative text editing.
- Campaign marketplace or generated story content.
- Large state-management libraries unless local component state becomes a proven bottleneck.
