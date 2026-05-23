# AI Process Notes

Use this file to record AI-assisted creation for competition submission.

## Template

- Date:
- Tool:
- Purpose:
- Input summary:
- Output used:
- Human edits:
- Screenshot or artifact:

## Log

- 2026-05-22
  - Tool: Codex.
  - Purpose: Read competition/game concept docs, choose Three.js 2.5D direction, plan implementation.
  - Output used: Game design, technical plan, initial project scaffold, English title "Cannonball Relic".
  - Human edits: Pending review.

- 2026-05-22
  - Tool: Nano Banana Pro / Gemini 3 Pro Image through Codex.
  - Purpose: Generate a first-pass pixel-art skin and prove the project can swap visual skins.
  - Input summary: 2.5D top-down pixel-art player, marble, enemy, obstacle, and ancient ruin floor prompts.
  - Output used: `public/assets/skins/relic-ruins/` runtime sprites and texture.
  - Human edits: Codex processed generated preview backgrounds into alpha sprites and organized files into skin slots.
  - Screenshot or artifact: `public/assets/skins/relic-ruins/source/prompts.md`.

- 2026-05-23
  - Tool: Nano Banana Pro / Gemini 3 Pro Image through Codex.
  - Purpose: Replace rough runtime material color blocks with usable pixel-art floor and obstacle assets.
  - Input summary: Tileable cracked, moss, and danger sandstone floor textures; isolated stone block and metal anvil obstacle sprites for the relic-ruins skin.
  - Output used: `textures/floor-cracked.png`, `textures/floor-moss.png`, `textures/floor-danger.png`, `sprites/obstacle-stone.png`, and `sprites/obstacle-metal.png`.
  - Human edits: Codex archived raw outputs, removed fake checkerboard backgrounds from obstacle sprites, cropped transparent margins, and wired the assets into runtime level validation.
  - Screenshot or artifact: `public/assets/skins/relic-ruins/source/prompts.md`.
