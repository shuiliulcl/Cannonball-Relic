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

## Phase 24 - 2D View Experiment

- [x] Keep the original 2.5D arena, sprite obstacles, and camera available.
- [x] Add a separate default 2D arena map, flat obstacle visuals, and top-down camera.
- [x] Add URL switching: default / `?view=2d` for 2D, `?view=2.5d` for the preserved 2.5D view.
- [x] Make monster health bars readable in the 2D top-down view.
- [x] Build and Playwright screenshot verify both view modes.

## Phase 25 - Zodiac Design Revision Planning

- [x] Read the new Feishu Wiki design document.
- [x] Summarize gaps between the current prototype and the Zodiac revision.
- [x] Write a staged implementation plan for data, terrain, obstacles, interactables, monsters, cards, and 10-level content.
- [x] Add the required plan/develop/verify/submit workflow to the development standards.
- [x] Start Phase 1 implementation: data model and numeric baseline.

## Phase 26 - Zodiac Data Model Baseline

- [x] Extend shared gameplay types for new terrain materials, obstacle behaviors, interactables, monster types, and monster AI states.
- [x] Extend level schema with player start, interactables, patrol paths, aggro/disengage ranges, obstacle behavior, facing, and HP.
- [x] Preserve old level compatibility while converting new fields into runtime data.
- [x] Add direct `?level=<file-id>` loading from `public/levels/<file-id>.json`.
- [x] Add `zodiac-schema-smoke.json` as a minimal new-schema validation level.
- [x] Align core numeric constants with the Zodiac baseline for movement, roll, marble speed, range, and radius.
- [x] Implement runtime effects for the new terrain and core obstacle behaviors.
- [x] Implement runtime effects for interactable behaviors.

## Phase 27 - Zodiac Terrain And Obstacle Runtime

- [x] Apply fire/danger terrain damage to the player.
- [x] Apply mud slowdown and ice inertia to player movement.
- [x] Let blood terrain regenerate monsters standing on it.
- [x] Implement glass break, reflector return, accelerator speed-up, thorn pierce damage, one-way pass direction, and bomb explosion behavior.
- [x] Refresh obstacle visuals after breakable or explosive obstacles are removed.
- [x] Add visible terrain color overlays and distinct 2D obstacle colors for new materials.
- [x] Expand the smoke level to include every Phase 2 obstacle behavior.
- [ ] Add dedicated editor controls for every new terrain and obstacle type.

## Phase 28 - Zodiac Interactable Runtime

- [x] Render level interactables in both 2D and 2.5D view modes.
- [x] Trigger brazier area damage when hit by a marble.
- [x] Trigger pinball interactables to spawn temporary auxiliary marbles.
- [x] Trigger ice balls to slow/freeze nearby monsters.
- [x] Trigger alarm posts to put all active monsters into alert state.
- [x] Trigger door switches to toggle one-way door obstacles between passable behavior and solid blocking.
- [x] Keep removed/toggled obstacles restorable on restart.
- [x] Expand the smoke level to include every Phase 3 interactable type.
- [ ] Add editor UI for placing and configuring interactables.

## Phase 29 - Monster AI First Batch

- [x] Add runtime monster AI fields for patrol, alert, return, cooldown, freeze, and charge state.
- [x] Add enemy projectile runtime and rendering support.
- [x] Implement generic patrol, aggro, disengage, and return-to-spawn behavior.
- [x] Implement line-of-sight checks against solid/breakable/one-way obstacles.
- [x] Implement octopus as a stationary ranged shooter.
- [x] Implement hound as a patrol-to-chase melee pressure enemy.
- [x] Implement boar as a telegraphed straight-line charger.
- [x] Expand the smoke level to include octopus, hound, and boar.
- [x] Implement second batch: slime, rabbit, bomb bug.
- [x] Implement third batch: shield crab, voodoo flower, eye cannon, priest.
- [ ] Replace placeholder monster tints with dedicated pixel sprites for all Zodiac enemies.

## Phase 30 - Documentation Cleanup

- [x] Update CollaboratorGuide.md card rarity from common/rare/special to bronze/gold/diamond.
- [x] Update Cannonball-Relic-Development-Guide.md card rarity and card authoring flow.
- [x] Tick Phase 26 interactable behaviors checkbox (completed in Phase 28/29).
- [ ] Screenshot verify Phase 19 art pass and push.

## Phase 31 - Editor Completion

- [ ] Add obstacle behavior, facing, and HP controls to the level editor inspector.
- [ ] Add interactable placement tool with type, wave, and cooldown configuration.
- [x] Build verify and test in ?mode=editor.

## Phase 32 - Dynamic Arena Size

- [x] Add arenaHalfWidth and arenaHalfDepth to RuntimeLevel (derived from grid dimensions).
- [x] Update physics.ts bounceInArena and clampToArena to accept optional arena dimensions.
- [x] Update Game.ts to use runtime arena dimensions for physics, spawn, and floor lookups.
- [x] Update SceneView.ts arena construction to use runtime arena dimensions.
- [x] Build verify with existing smoke level and default mode.

## Phase 33 - Card Pool Expansion: Stat Cards

- [x] Extend UpgradeStats with speedBonus, dashDistanceBonus, marbleSpeedMultiplier, maxBouncesBonus, marbleRadiusBonus, baseDamageBonus, recallSpeedMultiplier.
- [x] Wire new stats into Game.ts movement, marble creation, and physics calls.
- [x] Add bronze cards: 疾跑训练, 翻滚精进, 轻量弹珠, 多段弹跳, 尺寸增幅, 腰包扩容 (placeholder).
- [x] Add gold cards: 猎手校准, 迅捷回收, 速射抛投, 绝境专注.
- [x] Update Hud.ts cardIcon and types.ts UpgradeId.
- [x] Build verify.

## Phase 34 - Wave Rarity Weights

- [x] Update draftUpgrades to apply wave-based rarity weights (bronze/gold/diamond).
- [x] Implement pity counter in Game.ts: two consecutive bronze-only waves increase gold chance.
- [x] Build verify.

## Phase 35 - Ten Level Content

- [x] Create public/levels/zodiac-01.json through zodiac-10.json from design document.
- [x] Verify each level loads via ?level=zodiac-0X, can start, and win/lose correctly.

## Phase 36 - Gold Card Complex Systems

- [x] 护盾特性: kill grants 1 shield (max 3), shields absorb damage before HP.
- [x] 吸血特性: kill restores 1 HP.
- [x] 余势不止: kill restores 1 marble HP.
- [x] 连锁装填: recall hit boosts next shot damage.
- [x] 破片弹道: first hit spawns two angled auxiliary marbles.
- [x] 强震击退: wall bounce damages nearby monsters.
- [x] Build verify.

## Phase 37 - Diamond Card Complex Systems

- [x] 一键三连: fire three marbles in a spread.
- [x] 冻住不许走: hits apply freeze to monsters.
- [x] 是你吗沙师弟: marble grows in radius on each bounce.
- [x] 我的钻头: marble HP +2 and full pierce (ignore hitIds).
- [x] Build verify.

## Phase 38 - Monster Pixel Sprites

- [x] Add per-monster sprite slots to SkinAssets and skin.ts.
- [ ] Generate pixel sprites for all 10+ Zodiac monster types. (pending art generation)
- [x] Wire sprites into SceneView.createMonsterMesh (auto-switches tint→sprite when dedicated art added).
- [x] Build verify both view modes.

## Phase 39 - Polish and Submission Materials

- [ ] Add sound effects (charge, fire, bounce, hit, wave clear, card select).
- [ ] Optimize defeat/victory restart flow.
- [ ] Prepare cover image (1920x1080).
- [ ] Record PV (16:9, 1080p, under 2 min).
- [ ] Update docs/AIProcess.md with all AI contributions.
- [ ] Final build and dist package.
