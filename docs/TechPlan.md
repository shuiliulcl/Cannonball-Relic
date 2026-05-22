# Technical Plan

## Stack

- Runtime: browser.
- Build: Vite.
- Language: TypeScript.
- Rendering: Three.js.
- Game simulation: custom 2D plane logic projected into a 3D scene.
- Submission target: production `dist` folder zipped as an HTML5 game resource package.

## Why Custom Plane Physics

The game needs predictable arcade behavior more than realistic rigid-body simulation. Custom physics keeps bounce angles, preview lines, recall, homing assist, and damage scaling easy to tune. A full physics engine can be added later only if level geometry becomes complex.

## Coordinate Model

- Gameplay plane uses `{ x, z }`.
- Three.js uses `{ x, y, z }`, with `y` as height.
- Camera is orthographic and angled downward.
- Collisions are circles against axis-aligned arena walls and simple rectangular obstacles.

## Proposed Source Layout

```text
src/
  main.ts              App bootstrap.
  styles.css           UI and page styles.
  game/
    Game.ts            Main loop and state orchestration.
    config.ts          Tuning constants.
    types.ts           Shared game types.
    input.ts           Keyboard and mouse state.
    physics.ts         Plane movement, bounce, ray/trajectory helpers.
    upgrades.ts        Upgrade definitions and application.
  render/
    SceneView.ts       Three.js scene, camera, lights, resize.
    factories.ts       Mesh/material factory helpers.
    effects.ts         Particles, damage numbers, screen shake.
  ui/
    Hud.ts             HUD binding and upgrade panel events.
```

## Collaboration Boundaries

- Gameplay engineer: `src/game/*`.
- Rendering engineer: `src/render/*`.
- UI engineer: `src/ui/*` and `src/styles.css`.
- Designer/tuning owner: `src/game/config.ts` and `docs/GameDesign.md`.
- AI process/document owner: `docs/AIProcess.md`.

## First Playable Slice Architecture

`Game` owns pure gameplay state and calls `SceneView` to sync visible objects. The renderer should not decide score, damage, bounce count, or wave progression. UI reads game snapshots and sends explicit commands such as `start`, `chooseUpgrade`, or `restart`.

## Build And Run

```bash
npm install
npm run dev
npm run build
```

## Handoff Notes

- Keep gameplay constants in `config.ts` so non-rendering teammates can tune quickly.
- Avoid commercial or internal IP assets. Use generated placeholders or original simple geometry.
- Record meaningful AI usage in `docs/AIProcess.md` as we work.
