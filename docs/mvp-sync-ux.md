# MVP Sync UX

The MVP is a shared table companion. Multi-device sync belongs in the first playable version because the useful table moment is multiple phones seeing the same sheet, roll, and table state.

## Product Rule

Anyone can join as anyone.

This is intentional for MVP:

- No hard auth gate.
- No permanent ownership lock.
- A user chooses a table, then chooses a seat.
- Seats can be a character or Storyteller.
- The Storyteller seat is just another selectable role.
- The table can trust itself during MVP playtests.

## Revised MVP

```text
--------------------------------------------------+
| Shared Table Kit MVP                            |
+--------------------------------------------------+
| Join table                                      |
| Choose seat: Storyteller, Sparkle, Dart, Cheesy |
| Sync sheet/rules/rolls/logs across devices      |
+--------------------------------------------------+
| Table | Sheet | Dice | Rules                    |
+--------------------------------------------------+
```

MVP includes:

```text
live campaign/session state
join by table code or link
seat selector
Storyteller all-character view
per-character sheet view
2d6 / 3d6 / 4d6 roller
one-die reroll when enabled
shared roll log
editable rules reference
local cache fallback
JSON export/import backup
```

Not MVP:

```text
accounts
passwords
ownership enforcement
private character data
story generation
character generation
complex permissions
full campaign marketplace
```

## Join Flow

```text
Open link or enter table code
  |
  v
+---------------------------+
| Join Table                |
| Table: Sunday Kittens     |
+---------------------------+
| Choose who you are        |
| [Storyteller]             |
| [Sparkle]                 |
| [Dart]                    |
| [Cheesy]                  |
| [Observer]                |
+---------------------------+
| [Join]                    |
+---------------------------+
  |
  v
Selected seat is saved locally for this device.
```

Seat choice affects the default view, not permission:

```text
Storyteller -> opens Table
Character   -> opens Sheet for that character
Observer    -> opens Table read-mostly by convention
```

## Shared State

```text
Campaign
|
+-- session
|   +-- name
|   +-- current scene/status
|   +-- active seats
|
+-- characters
|   +-- sheet fields
|   +-- abilities
|   +-- resources
|   +-- skills
|   +-- conditions
|   +-- notes
|
+-- rules
|   +-- editable quick cards
|
+-- rolls
|   +-- dice values
|   +-- reroll marker
|   +-- success count
|   +-- selected seat
|
+-- log
    +-- roll entries
    +-- rule references
    +-- notes
```

## Sync Model

```text
Device A                  Shared DB                  Device B
--------                  ---------                  --------
edit Heart 6 -> 5   -->   update character   -->     sees Heart 5
roll 3d6            -->   append roll/log    -->     sees roll result
edit rule text      -->   update rule        -->     sees new rule
```

Use last-write-wins for MVP, plus visible updated timestamps. This keeps the first version simple and table-friendly.

## Conflict Rule

MVP does not need Google Docs-style collaborative editing.

Use this behavior:

```text
small controls       immediate sync
text fields          debounce autosave
rolls/log entries    append-only
rules edits          last save wins
```

If two people edit the same long text field at once, the later save wins. That is acceptable for MVP because the app is a live table tool, not a document editor.

## View Behavior

```text
Storyteller seat
  default: Table
  can open any Sheet
  can roll as any character
  can edit rules

Character seat
  default: own Sheet
  can switch to any Sheet
  can roll as selected character
  can edit rules

Observer seat
  default: Table
  same technical access as everyone
```

## Mobile Flow

```text
+---------------------------+
| Sunday Kittens       Live |
| Seat: Sparkle        Swap |
+---------------------------+
| Sparkle Sheet              |
| Strong [-] 1 [+] [Roll]   |
| Smart  [-] 5 [+] [Roll]   |
| Cute   [-] 2 [+] [Roll]   |
+---------------------------+
| Last table roll            |
| Dart: 2 successes PASS     |
+---------------------------+
| Table | Sheet | Dice |Rules|
+---------------------------+
```

## Table Flow

```text
+-----------------------------------------------+
| Table: Sunday Kittens                    Live |
| Seat: Storyteller                         Swap |
+-----------------------------------------------+
| Sparkle  Heart 6/6  Furr 2/2  Ready           |
| Dart     Heart 4/7  Furr 2/2  Wounded         |
| Cheesy   Heart 6/6  Furr 2/2  Hidden          |
+-----------------------------------------------+
| Shared Log                                     |
| 8:12 Dart rolled Strong: 2/2 PASS              |
| 8:13 Rule used: Advantage                      |
+-----------------------------------------------+
```

## Recommended Persistence Path

Use a repository interface from day one:

```text
CampaignRepository
  listTables()
  joinTable(code)
  subscribeTable(tableId, onChange)
  saveCharacter(character)
  saveRule(rule)
  appendRoll(roll)
  appendLog(entry)
```

Implementations:

```text
LocalCampaignRepository      offline fallback/dev
RealtimeCampaignRepository   MVP shared table
```

The UI should not care which repository is active.
