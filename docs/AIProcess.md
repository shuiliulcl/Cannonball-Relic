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

- 2026-05-24
  - Tool: Claude Code (Claude Sonnet 4.6).
  - Purpose: Implement Zodiac revision Phases 25–39 — data model, level editor, terrain/obstacle runtime, monster AI (13 types), card pool expansion, 10 campaign levels, and polish.
  - Input summary: Feishu Wiki design document (Phase 25 read), all prior phase Tasklist items, code architecture.
  - Output used:
    - `src/levels/types.ts`, `src/levels/convert.ts` — extended RuntimeLevel, LevelDefinition schema for Zodiac terrain, obstacles, interactables, patrol AI, dynamic arena dimensions.
    - `src/game/physics.ts` — ArenaDims type, updated clampToArena/bounceInArena/makeTrajectory to accept optional arena dimensions.
    - `src/game/Game.ts` — runtime effects for all terrain types (fire, mud, ice, blood, danger), obstacle behaviors (glass, reflector, accelerator, thorns, one-way, bomb), interactable triggers (brazier, pinball, iceBall, alarmPost, doorSwitch), full monster AI for 13 enemy types, all gold card complex systems (shieldTrait, vampirism, momentumContinue, chainLoading, fragmentTrajectory, shockKnockback), all diamond card complex systems (tripleShot, freezeHit, growingMarble, drillMarble), Web Audio API sound effects.
    - `src/game/upgrades.ts` — card pool expanded to 27 cards (10 bronze, 11 gold, 6 diamond), two-stage rarity draft, bronze streak pity counter.
    - `src/game/Audio.ts` — procedural Web Audio synthesis for charge, fire, bounce, hit, wave clear, card select, defeat.
    - `src/render/SceneView.ts` — dynamic arena construction, interactable rendering, per-monster sprite slot lookup, 2D/2.5D mode preservation.
    - `src/render/skin.ts` — per-monster SkinAssets slots (12 new fields).
    - `src/ui/Hud.ts` — shields badge display, cardIcon entries for all 27 upgrade IDs.
    - `public/levels/zodiac-01.json` through `zodiac-10.json` — 10 campaign levels with progressive terrain, obstacles, and monster compositions.
    - `index.html` — shields HUD badge element.
    - `Tasklist.md` — Phases 26–39 ticked.
  - Human edits: None required; all output passed TypeScript type-check and Vite production build.
  - Screenshot or artifact: `Tasklist.md` Phases 26–38 all marked complete.
