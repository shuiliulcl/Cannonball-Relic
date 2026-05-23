# Tasklist

## Phase 0 - Direction And Handoff

- [x] Read competition guide and game concept docs.
- [x] Confirm 2.5D Three.js visual direction.
- [x] Write collaborative game design document.
- [x] Write technical plan and module ownership document.

## Phase 1 - Three.js Playable Slice

- [x] Convert project to Vite + TypeScript + Three.js.
- [x] Build orthographic 2.5D arena scene.
- [x] Implement WASD player movement.
- [x] Implement mouse aim, charge, fire, and recall marble.
- [x] Implement wall bounces and bounce damage scaling.
- [x] Implement monsters, hit damage, and scoring.
- [x] Implement wave clear and upgrade choices.
- [x] Add stylized UI and feedback effects.

## Phase 2 - Delivery Readiness

- [x] Add AI process notes template.
- [x] Add teammate onboarding notes.
- [x] Run type check and production build.
- [x] Start local dev server for review.

## Phase 3 - Visual And Gameplay Polish

- [x] Add bounce obstacles to the arena.
- [x] Make marble collide with obstacles.
- [x] Add charge meter and stronger aiming feedback.
- [x] Add hit particles and bounce flashes.
- [x] Add game over and restart loop.
- [x] Improve 2.5D scene depth with props and side architecture.
- [x] Rebuild and verify after polish.

## Phase 4 - Collaboration And Publishing

- [x] Rename project to Cannonball Relic for repository handoff.
- [x] Add collaborator and AI-agent onboarding guide.
- [x] Add LAN dev server script.
- [x] Start LAN-accessible dev server.
- [x] Initialize standalone project git repository.
- [x] Push to GitHub repository.

## Phase 5 - Core Fun And Cards

- [x] Refactor upgrades into a configurable card pool.
- [x] Add card rarity and weighted draft choices.
- [x] Add Human Cannon as a rare special card without changing base gameplay.
- [x] Add Human Cannon runtime state and damage rules.
- [x] Improve card UI for rarity and descriptions.
- [x] Update docs for card authoring.
- [x] Build, verify, and push Phase 5.

## Phase 6 - HUD Pass

- [x] Reference pixel/hand-drawn HUD layout.
- [x] Move HUD into overlay regions.
- [x] Add HP bar, wave progress bar, controls panel, and buff meter.
- [x] Bind HP, charge, and wave progress to game state.
- [x] Build, verify, and push HUD pass.

## Phase 7 - Framing And Run Flow

- [x] Enlarge arena framing so the map dominates the viewport.
- [x] Move upgrade choices into the stage overlay so they do not resize the map.
- [x] Add dedicated victory/defeat result overlay.
- [x] Add restart flow from result overlay.
- [x] Build, verify, and push framing/run-flow pass.

## Phase 8 - Chinese UI Pass

- [x] Replace in-game visible text with Chinese labels.
- [x] Localize card names, descriptions, rarity, and marble state.
- [x] Fix controls panel text overlap with Chinese font and spacing.
- [x] Build, verify, and push Chinese UI pass.

## Phase 9 - Card Layout Pass

- [x] Redesign upgrade options as vertical card-game style cards.
- [x] Add card icon, rarity, title, description, and action areas.
- [x] Build, verify, and push vertical card layout.

## Phase 10 - Art Skin Pipeline

- [x] Generate first-pass pixel art assets with Nano Banana Pro.
- [x] Organize generated assets into a switchable skin folder.
- [x] Add skin manifest, prompt notes, and raw source archive.
- [x] Write required development standards for teammates and AI agents.
- [x] Add renderer support for `?skin=<skin-id>` runtime switching.
- [x] Build, verify, and push art skin pipeline.

## Phase 11 - Arena Skin Coverage

- [x] Add wall border, side pillar, and brazier skin slots.
- [x] Generate first-pass pixel assets for arena edges and props.
- [x] Replace original wall, pillar, and brazier visuals with skin-driven assets.
- [x] Build, screenshot verify, and push arena skin coverage.

## Phase 12 - Aim VFX Pass

- [x] Replace the single aim line with segmented energy trajectory markers.
- [x] Add bounce-point rings and an endpoint reticle.
- [x] Make aim VFX react to charge strength.
- [x] Screenshot verify and push aim VFX pass.

## Phase 13 - Upgrade UI Polish

- [x] Reduce upgrade card visual weight and improve hierarchy.
- [x] Tighten card title, icon, description, and action button spacing.
- [x] Prevent top HUD overlap on medium-width screens.
- [x] Screenshot verify and push upgrade UI polish.

## Phase 14 - Pause Flow

- [x] Add P / Esc pause toggle.
- [x] Add pause overlay with continue and restart actions.
- [x] Cancel charging safely when pausing.
- [x] Build, interaction verify, and push pause flow.

## Phase 15 - Level Editor

- [x] Add standalone `?mode=editor` route.
- [x] Design editable level JSON for floors, obstacles, and monster spawns.
- [x] Build grid painting tools for floor materials, obstacles, spawns, and erase.
- [x] Add inspector controls for materials and spawn logic.
- [x] Add JSON export, import, reset, and copy actions.
- [x] Add level editor documentation.
- [x] Build, screenshot verify, and push level editor.

## Phase 16 - Level Collaboration Workflow

- [x] Add shared level schema and localStorage draft persistence.
- [x] Add editor actions for local save, game validation, JSON download, and GitHub directory handoff.
- [x] Let the game load `?level=local` from the editor draft.
- [x] Convert editor obstacles into runtime collision and scene obstacles.
- [x] Convert editor spawn points into runtime wave spawn queues.
- [x] Rewrite level editor documentation in Chinese with GitHub submission workflow.
- [x] Build, interaction verify, and push collaboration workflow.
