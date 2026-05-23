# Cannonball Relic

Three.js prototype for a top-down rogue-lite marble game.

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

## View Modes

- Default / `?view=2d`: experimental pure 2D top-down arena, flat obstacle visuals, and top-down camera.
- `?view=2.5d`: preserved 2.5D arena, walls, props, and sprite obstacle presentation.

## Controls

- `WASD`: move.
- `Space`: dash toward movement direction.
- Hold left mouse: charge and preview trajectory.
- Release left mouse: fire marble.
- Right mouse: recall marble.

## Important Docs

- `docs/DevelopmentStandards.md`: required development rules for teammates and AI agents.
- `docs/GameDesign.md`: gameplay and visual direction.
- `docs/LevelEditor.md`: level editor usage and exported JSON format.
- `docs/TechPlan.md`: architecture, module ownership, and handoff notes.
- `docs/AIProcess.md`: AI-assisted creation notes for competition submission.
- `docs/CollaboratorGuide.md`: onboarding guide for teammates and their AI agents.
