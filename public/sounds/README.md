# Dice Roll Sound

Generate or download a dice-roll sound effect, then save it here as one of:

- `dice-roll.mp3`
- `dice-roll.wav`
- `dice-roll.webm`
- `dice-roll.ogg`

The app automatically prefers this recorded sound and applies light playback-rate,
gain, and stereo-pan variation so rolls do not sound identical. If no file is
present, it falls back to the synthesized dice clack.

Installed variants:

- `dice-roll.mp3`: wooden-table clatter, used for short rerolls and mixed into normal rolls
- `dice-roll-bouncy.mp3`: livelier mat bounce, mixed into normal rolls
- `dice-roll-cup.mp3`: dice cup shake, mixed into normal rolls

ElevenLabs flow:

1. Open https://elevenlabs.io/sound-effects/dice-roll
2. Generate/download the effect.
3. Rename the downloaded file to `dice-roll.mp3`.
4. Put it in this folder.
5. Commit `public/sounds/dice-roll.mp3` so Vercel deploys it.
