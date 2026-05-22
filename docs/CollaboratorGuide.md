# Collaborator Guide

This guide is for teammates and AI coding agents joining the Cannonball Relic project.

## Project Intent

Cannonball Relic is a PC browser game prototype for the internal game creation contest. The base game is a 2.5D top-down rogue-lite where the player moves a character, fires a marble, uses wall and obstacle bounces to stack damage, recalls the marble, clears waves, and chooses upgrades.

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

## Good Next Tasks

- Add more monster types and room layouts.
- Improve aiming preview with segmented bounce markers.
- Replace placeholder geometry with generated original art assets.
- Add sound effects and a short PV capture plan.

## Card Authoring

Cards live in `src/game/upgrades.ts`. Add a unique `id`, `rarity`, `title`, `description`, and `weight`.

- `common`: frequent numeric upgrades.
- `rare`: stronger build-shaping upgrades.
- `special`: unusual rule-bending cards. These should preserve the base game unless selected by the player.

After adding a new `UpgradeId`, implement its effect in `Game.chooseUpgrade`.

Current special card:

- `humanCannon`: selected after a wave, then launches the player as a temporary projectile. This is intentionally a card effect, not the default control scheme.
