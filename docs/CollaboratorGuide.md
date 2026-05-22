# Collaborator Guide

This guide is for teammates and AI coding agents joining the Cannonball Relic project.

## Project Intent

Cannonball Relic is a PC browser game prototype for the internal game creation contest. The base game is a 2.5D top-down rogue-lite where the player moves a character, fires a marble, uses wall and obstacle bounces to stack damage, recalls the marble, clears waves, and chooses upgrades.

Important design note: **Human Cannon is a later rare/special card, not the default core mechanic.** Do not convert the base game into "launch the player" without explicit team approval.

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

## Collaboration Rules

- Keep core gameplay decisions in `docs/GameDesign.md` before large code changes.
- Put tunable values in `src/game/config.ts`.
- Keep renderer code out of score/damage/wave decisions.
- Avoid commercial or internal IP assets. Use original placeholders or generated assets with clear provenance.
- Update `docs/AIProcess.md` when AI materially contributes code, art, copy, tuning, or video planning.
- Update `Tasklist.md` as tasks change.

## Good Next Tasks

- Add a real rare-card implementation for Human Cannon.
- Add more monster types and room layouts.
- Improve aiming preview with segmented bounce markers.
- Replace placeholder geometry with generated original art assets.
- Add sound effects and a short PV capture plan.
