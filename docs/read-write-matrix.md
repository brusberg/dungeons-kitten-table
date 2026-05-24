# Character Sheet Read / Write Matrix

## Current MVP Boundary

Seats are a table convention, not authentication. Anyone who joins can choose the Storyteller seat or any character seat. The matrix below describes the intended UI behavior for the MVP and the future permission shape for Supabase RLS or another auth layer.

## PDF Pass Notes

The official character sheets reinforce the current core fields: player, childhood, character trait, cattribute, Strong, Smart, Cute, Heart, Furr-endship, skills, backpack, spellbook, and character prose. The app also needs editable name, status, conditions, and notes because those are table-operation fields even when they are not presented as the same blank boxes in every PDF.

The official quick references add rules that should be first-class in the app:

| Rule Area | MVP Treatment |
| --- | --- |
| Action test | Dice roller supports 2d6, 3d6, 4d6 and compares dice to an ability target. |
| Difficulty | Rules reference keeps Easy 1, Medium 2, Difficult 3, Legendary 4. |
| Skills | Skills explain when advantage applies; later they can wire directly into roll setup. |
| Useful items | Dice roller allows one Storyteller-approved reroll. |
| Character trait | Positive use grants advantage; negative use can gift Furr-endship once per session. |
| Cattribute | Editable character-specific effect; Storyteller adjudicates the exact benefit. |
| Heart | Track current/max and notes; later add a resource ledger. |
| Furr-endship | Track current/max and notes; later add transfer/spend buttons. |
| Catfights | Rules reference covers initiative, attack, defend, help, hinder, move, and interact. |

## Character Sheet Matrix

| Data Area | Storyteller Seat | Matching Character Seat | Other Character Seats |
| --- | --- | --- | --- |
| Character identity | Read/write | Read/write | Read |
| Abilities | Read/write | Read/write | Read |
| Heart and Furr-endship | Read/write | Read/write own | Read |
| Conditions/status | Read/write | Read/write own | Read |
| Skills | Read/write | Read/write own | Read |
| Backpack | Read/write | Read/write own | Read |
| Spellbook | Read/write | Read/write own | Read |
| Player notes | Read/write | Read/write own | Read |
| Storyteller notes | Read/write | Hidden | Hidden |
| Rolls | Roll as anyone | Roll as own by default | Read, or roll after selecting a different seat |
| Rules | Read/write | Read | Read |
| Shared log | Append/read | Append/read | Append/read |

## Storyteller Tracking Backlog

Keep the core MVP lean, but these are the next DM-facing things worth modeling:

| Area | Why It Matters |
| --- | --- |
| Resource ledger | Explains why Heart or Furr-endship changed during a busy scene. |
| Active scene/location | Gives all players the same current context without story-authoring tools. |
| Catfight tracker | Tracks participants, initiative state, targets, and current action. |
| Private character notes | Holds secrets, consequences, future hooks, or rulings per character. |
| Public recap/objectives | Gives players a shared memory without exposing private notes. |
| NPC/adversary rows | Lets Storyteller track non-player Heart, actions, and conditions separately from PCs. |
| Rule-use log | Makes rulings searchable after the session. |
| Structured items/spells | Lets useful item rerolls and spell recasts become buttons later. |

## UI Rule

Rules should be editable as one readable text block per rule. The previous title, summary, details, and tags shape is useful for data import, but it feels too much like database maintenance at the table. Keep the public UI simple: title plus rule text, with pin/log/delete controls.
