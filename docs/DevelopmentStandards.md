# Development Standards - 必读

This file is required reading for every teammate and AI agent before changing Cannonball Relic.

## 1. Product Guardrails

- The core game is a 2.5D top-down rogue-lite where the player moves, aims, fires a marble, bounces it off walls or obstacles, recalls it, clears waves, and drafts upgrades.
- Human Cannon / 人间大炮 is a rare late-game or special card. Do not turn it into the default control scheme unless the design document is explicitly updated and approved.
- Keep gameplay changes small and reviewable. If a change alters controls, scoring, wave flow, card rules, or camera framing, update `docs/GameDesign.md` and `Tasklist.md`.
- In-game visible UI text should be Chinese. Code identifiers, file names, and documentation headings may stay English for collaboration clarity.

## 2. Work Order

Before implementation:

1. Read `README.md`, `docs/GameDesign.md`, `docs/CollaboratorGuide.md`, and this file.
2. Check `Tasklist.md` and add or update the relevant phase before starting substantial work.
3. Inspect existing patterns in nearby files before adding new abstractions.

During implementation:

- Prefer focused commits that complete one understandable slice.
- Keep gameplay logic in `src/game/`.
- Keep Three.js scene sync and visual-only logic in `src/render/`.
- Keep DOM/HUD behavior in `src/ui/` and visual styling in `src/styles.css`.
- Put tunable constants in `src/game/config.ts`.
- Do not hide gameplay decisions inside renderer or CSS code.

Before handoff:

- Run `npm run build`.
- If the change affects visuals or interaction, run the dev server and manually verify the game starts, restarts, and can clear or lose a wave.
- Update `Tasklist.md`.
- Update docs when a teammate or future AI agent would otherwise need to rediscover your decision.

## 3. Art Skin System

Runtime art lives under:

```text
public/assets/skins/<skin-id>/
```

Every skin must provide these files:

```text
sprites/player.png
sprites/marble.png
sprites/enemy-grunt.png
sprites/obstacle-crate.png
textures/floor.png
manifest.json
```

Optional source files should live under:

```text
source/raw/
source/prompts.md
```

Rules:

- Do not hardcode a skin's image path in random gameplay files.
- Add new art by creating or replacing files inside a skin folder.
- Preserve the slot names above so switching skins does not require renderer changes.
- Use transparent PNG sprites. If an AI tool returns a fake checkerboard background, process it into real alpha before placing it in `sprites/`.
- Keep AI prompts, raw outputs, and any manual processing notes in `source/prompts.md`.
- Test alternate skins with `?skin=<skin-id>`.

## 4. Visual Direction

- Target style: readable 2.5D pixel art / hand-painted indie game, top-down arena, strong silhouettes, warm ancient ruin or experimental themed skins.
- Gameplay readability wins over decorative detail.
- Player, marble, enemy, obstacle, and floor must remain visually distinct at normal camera zoom.
- Avoid copyrighted, trademarked, or internal IP assets. Use original generated or team-created art only.

## 5. UI Standards

- Keep combat HUD as an overlay, not a web dashboard.
- HP belongs top-left, wave progress top-center, controls bottom-left, buff/marble state bottom-center unless a documented UI pass changes it.
- Result and upgrade screens must offer a restart or continue path. Never leave the game in a dead-end state after victory, defeat, or wave clear.
- All visible player-facing labels should be Chinese.
- Check text fit at desktop and smaller browser sizes. Buttons and panels must not overflow the viewport.

## 6. Code Style

- TypeScript should stay explicit where it clarifies game state and contracts.
- Prefer local helper functions over broad abstractions unless the repeated pattern is stable.
- Avoid unrelated refactors in feature commits.
- Keep comments rare and useful: explain non-obvious intent, not obvious syntax.
- Do not remove existing user or teammate changes unless explicitly asked.

## 7. AI Collaboration Notes

- When AI materially contributes code, art, tuning, copy, or planning, update `docs/AIProcess.md`.
- AI-generated art should include the prompt and destination skin folder.
- If you make assumptions, write them in the relevant doc instead of only in chat.
- If a task touches design, art, and code, leave a short handoff note in `Tasklist.md` or the related doc.
