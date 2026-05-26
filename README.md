# 人间大炮一级准备

Voice-driven survivor rogue-lite built on the original Cannonball Relic project.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Submit the generated `dist` folder as the HTML5 resource package after final polishing.

## Routes

- `/`: new voice survivor game, "人间大炮一级准备".
- `/?game=relic`: preserved Cannonball Relic marble rogue-lite.
- `/?mode=editor`: preserved level editor for Cannonball Relic.

## Cannonball Relic View Modes

- Default / `?view=2d`: experimental pure 2D top-down arena, flat obstacle visuals, and top-down camera.
- `?view=2.5d`: preserved 2.5D arena, walls, props, and sprite obstacle presentation.

## Level Routes

- `/`: default 10-room campaign, loading `zodiac-01` through `zodiac-10` in order.
- `/?level=<file-id>`: single-level debug route, for example `/?level=zodiac-03`.
- `/?level=local`: validates the current level-editor draft from localStorage.

## Controls

- `WASD`: move.
- `Space`: dash toward movement direction.
- Hold left mouse: charge and preview trajectory.
- Release left mouse: fire marble.
- Right mouse: recall marble.

## Important Docs

- `docs/DevelopmentStandards.md`: required development rules for teammates and AI agents.
- `docs/GameDesign.md`: gameplay and visual direction.
- `docs/DesignRevisionPlan.md`: staged implementation plan for the Zodiac revision design.
- `docs/LevelEditor.md`: level editor usage and exported JSON format.
- `docs/TechPlan.md`: architecture, module ownership, and handoff notes.
- `docs/AIProcess.md`: AI-assisted creation notes for competition submission.
- `docs/CollaboratorGuide.md`: onboarding guide for teammates and their AI agents.
