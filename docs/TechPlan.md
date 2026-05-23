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

## Planned Feature Hooks

- Buff review panel:
  - Store owned upgrades/buffs in `Game` state.
  - Expose owned buff data through `GameSnapshot` or a dedicated HUD update method.
  - Let `Hud` own the panel DOM and send `pauseForBuffPanel` / `resumeFromBuffPanel` style commands back to `Game`.
  - Opening the panel pauses simulation; closing resumes only if the game was previously running and not already paused for upgrades/results.
- One-time diamond cards:
  - Extend card rarity data to include `diamond`, `gold`, and `bronze` presentation tiers, or map current rarity values into those tiers.
  - Track selected one-time card IDs in `Game`.
  - Filter selected diamond cards out of future `draftUpgrades` calls.
- Monster health bars:
  - Keep health values in `Monster`.
  - Render a small billboard or HTML-free Three.js bar above each monster in `SceneView.syncMonsters`.
- Tap-fire and charge-fire consistency:
  - Normalize projectile speed in `Game.updatePlayer`.
  - If charge remains, use it for aiming commitment, range, or later card hooks rather than making tap-fire slower by default.
- Bounce-colored trajectory:
  - Return segment/bounce metadata from trajectory generation, or split trajectory points into segments in `SceneView`/`TrajectoryView`.
  - Shift color toward red after each bounce segment.
- Dodge roll:
  - Replace instant dash with a 0.5 second roll state on `Player`.
  - During roll, advance the player at high speed and set invulnerability for the whole roll window.
  - Expose dodge cooldown remaining through HUD state for lower HUD display.

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
