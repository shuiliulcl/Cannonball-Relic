# Collaborator Guide

This guide is for teammates and AI coding agents joining the Cannonball Relic project.

## Project Intent

Cannonball Relic is a PC browser game prototype for the internal game creation contest. The base game is a top-down rogue-lite where the player moves a character, fires a marble, uses wall and obstacle bounces to stack damage, recalls the marble, clears waves, and chooses upgrades.

Important design note: **Human Cannon is a later rare/special card, not the default core mechanic.** Do not convert the base game into "launch the player" without explicit team approval.

Before changing the project, read `docs/DevelopmentStandards.md`. It defines the required work order, art skin structure, UI rules, and handoff expectations for teammates and AI agents.

## Current Stack

- Vite
- TypeScript
- Three.js
- Custom 2D plane gameplay physics rendered in a 3D scene

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For LAN testing, use:

```bash
npm run dev:lan
```

## Build

```bash
npm run build
```

The contest HTML5 package should come from the generated `dist` folder.

## View Modes

The current default view is the experimental 2D presentation:

- Default / `?view=2d`: pure top-down map, flat obstacle visuals, and a vertical camera.
- `?view=2.5d`: preserved 2.5D arena, side props, wall sprites, and original obstacle presentation.

When changing camera framing, map art, or obstacle presentation, verify both URLs so the team can compare styles.

## Controls

- `WASD`: move.
- `Space`: dash.
- Hold left mouse: charge and preview the marble trajectory.
- Release left mouse: fire the marble.
- Right mouse: recall the marble.

## Source Map

- `src/main.ts`: app bootstrap.
- `src/game/Game.ts`: game loop, wave state, scoring, combat.
- `src/game/config.ts`: tuning constants and arena obstacle layout.
- `src/game/physics.ts`: movement, bounce, trajectory helpers.
- `src/game/upgrades.ts`: upgrade definitions.
- `src/render/SceneView.ts`: Three.js camera, arena, mesh synchronization.
- `src/render/effects.ts`: floating damage text and spark particles.
- `src/ui/Hud.ts`: HUD and upgrade panel binding.
- `src/styles.css`: page and UI styling.
- `public/assets/skins/`: switchable art skin packs.

HUD direction: keep important combat information as a game overlay. HP belongs top-left, wave progress top-center, controls bottom-left, and buff/marble state bottom-center.

## Collaboration Rules

- Read `docs/DevelopmentStandards.md` before implementation.
- Before every change, run `git status --short`, then `git pull --ff-only origin main`, then check `git status --short` again. If the workspace is dirty, coordinate first and do not overwrite another teammate or AI agent's files.
- Keep core gameplay decisions in `docs/GameDesign.md` before large code changes.
- Put tunable values in `src/game/config.ts`.
- Keep renderer code out of score/damage/wave decisions.
- Avoid commercial or internal IP assets. Use original placeholders or generated assets with clear provenance.
- Update `docs/AIProcess.md` when AI materially contributes code, art, copy, tuning, or video planning.
- Update `Tasklist.md` as tasks change.

## Art Skins

The active art pack is loaded from `public/assets/skins/<skin-id>/`. Use `?skin=relic-ruins` in the browser to force a skin. New skins should keep the same required slot filenames documented in `public/assets/skins/README.md`.

Current default skin:

- `relic-ruins`: first-pass Nano Banana Pro pixel-art skin with player, marble, enemy, obstacle, and floor slots.

## Current Status

The local prototype now follows the Feishu Wiki design document `弹珠超人_佐迪亚克改版`: default play is a 10-room top-down Zodiac campaign, with terrain effects, obstacle behaviors, interactables, 10 Zodiac enemy types, rarity-based card drafts, monster sprites, sound effects, and campaign chaining.

Most old prototype TODOs are complete. Treat `Tasklist.md` as the source of truth before starting new work.

## Good Next Tasks

- Record the final PV: 16:9, 1080p, under 2 minutes.
- Run a full 10-room campaign pass and tune level pressure against the Wiki design goals: short high-pressure rooms, geometry reads, active recall damage, and build expression.
- Fill remaining optional Wiki card ideas that are not yet implemented, such as curved trajectory, fire trail, nearest-enemy ricochet, timed auto-shot, and one-ball extreme mode.
- Polish readability for support ranges, laser windows, shield-crab facing, breakable glass, explosions, freeze, and interactable triggers.
- Rebuild the submission package after PV/tuning changes.

## Card Authoring

Cards live in `src/game/upgrades.ts`. Add a unique `id`, `rarity`, `title`, `description`, and `weight`. The card `apply(stats, player)` function handles its effect directly — no need to touch `Game.chooseUpgrade`.

- `bronze`: frequent numeric or utility upgrades.
- `gold`: stronger build-shaping upgrades.
- `diamond`: unusual rule-bending cards that change the play model. These should preserve the base game unless selected by the player. Diamond cards can only be drafted once per run.

Implemented diamond cards include `humanCannon`, `tripleShot`, `freezeHit`, `growingMarble`, and `drillMarble`. `humanCannon` is intentionally a card effect, not the default control scheme.
