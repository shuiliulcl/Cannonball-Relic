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

## Phase 17 - Editor Material Icons

- [x] Add visual swatches for floor materials.
- [x] Add icon badges for obstacle materials.
- [x] Add icon badges for monster spawn types.
- [x] Improve grid readability for floor, obstacle, and spawn cells.
- [x] Build, screenshot verify, and push editor material icons.

## Phase 18 - Runtime Level Material Display

- [x] Preserve editor floor and obstacle materials in runtime level data.
- [x] Render non-default floor materials in game validation mode.
- [x] Render stone and metal obstacles differently from wood obstacles.
- [x] Build, screenshot verify, and push runtime material display.

## Phase 19 - Runtime Material Art Pass

- [x] Generate pixel-art floor material textures for cracked, moss, and danger tiles.
- [x] Generate stone and metal obstacle sprites and process fake checker backgrounds into alpha.
- [x] Replace runtime material color blocks and badges with skin-driven art assets.
- [x] Correct the four corner brazier scale for the current arena camera.
- [x] Build verify runtime material art pass.
- [ ] Screenshot verify and push runtime material art pass.

## Phase 20 - Collaboration Sync Rule

- [x] Document the rule that every teammate and AI agent must pull the latest GitHub main before making changes.
- [x] Add dirty-worktree safety guidance so parallel agents do not overwrite each other.

## Phase 21 - Supplemental Design Requirements

- [x] Add Buff review panel, pause/resume behavior, and top HUD icon requirements to design docs.
- [x] Add one-time diamond card draft rule and diamond/gold/bronze card visual tiers.
- [x] Add monster health bars, bounce-colored trajectory, tap-fire speed consistency, dodge roll duration/invulnerability, and dodge cooldown HUD requirements.
- [x] Sync supplemental design notes to the Feishu development cloud document after the target document URL is confirmed.

## Phase 22 - Supplemental Feature Implementation

- [x] Implement Buff review HUD icon, panel, pause-on-open, and resume-on-close behavior.
- [x] Implement diamond/gold/bronze card rarity data and visual card frames.
- [x] Ensure diamond cards are removed from the draft pool after being selected once per run.
- [x] Add monster health bars.
- [x] Keep tap-fire and charged-fire projectile speed consistent.
- [x] Make trajectory preview segments redder after each bounce.
- [x] Replace instant dash with 0.5 second invincible roll movement.
- [x] Add lower HUD roll cooldown display.
- [x] Build verify supplemental feature implementation.

## Phase 23 - Development Process Retrospective

- [x] Summarize why recent changes took longer than expected.
- [x] Add pre-change planning, scope-splitting, parallel-work, patching, verification, and cloud-doc sync rules to the required development standards.
