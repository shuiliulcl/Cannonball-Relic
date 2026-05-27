# Voice Survivor Art Workflow

This workflow is for the new root gameplay at `http://127.0.0.1:5177/`.

The target gameplay is `src/survivor/VoiceSurvivorGame.ts`, a Canvas 2D survivor game with DOM/CSS HUD panels. Runtime art logic now lives in a separate renderer so style passes do not collide with gameplay and voice-system changes. The old Cannonball Relic route at `?game=relic` is a separate renderer and must not be used as the acceptance target for this mode.

## Runtime Scope

- Route: `/`
- Game class: `VoiceSurvivorGame`
- Runtime art renderer: `src/survivor/render/LineglowSurvivorRenderer.ts`
- Canvas systems: arena, player token, enemy tokens, projectiles, enemy shots, drops, turrets, orbit weapons, particles
- HUD systems: `.survivor-*` panels in `src/styles.css`
- Current style pass: `survivor-shell--orbit-ruins`

## Style Strategy

Prefer procedural Canvas styling before extracted sprite integration.

This mode has many small moving units and dense survival combat, so first-pass style work should prioritize:

- Shape-coded enemy tokens instead of detailed imported sprites.
- Mid-value enemy bodies with colored cores, avoiding black-only silhouettes.
- Hidden full-health enemy bars so utility lines do not read as map scratches.
- Low-contrast arena texture that does not imply a wrong gameplay grid.
- Runtime-drawn projectile trails and VFX for consistency and scale control.
- HUD CSS skinning that keeps the current gameplay information layout intact.

## Orbit-Ruins Pass

Implemented in:

- `src/survivor/render/LineglowSurvivorRenderer.ts`
- `src/survivor/VoiceSurvivorGame.ts` only as gameplay state provider and render-state bridge
- `src/styles.css`

Screenshots:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/start-overlay-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/ingame-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/ingame-density-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/ingame-wave2-v1.png`

Board:

- `docs/VoiceSurvivorOrbitRuinsBoard.html`

## Acceptance Gates

Before accepting a style pass for this mode:

- Open `http://127.0.0.1:5177/`, not `?game=relic`.
- Confirm `.survivor-shell` exists and has the expected style class.
- Start the game and capture at least one no-overlay gameplay screenshot.
- Capture one later-wave screenshot, but if the upgrade overlay appears, mark it as a UI check rather than enemy readability proof.
- Check console/page errors.
- Check that the canvas is nonblank after start.
- Check enemy visibility at actual runtime scale.
- Check that floor/arena marks do not read as a mismatched grid.
- Check HUD text fit on desktop and mobile widths before locking the style.

## Lessons Added

- Pin the game route and renderer before generating or integrating assets.
- Canvas games need a procedural-token pass before expensive raster extraction.
- Sprite extraction lessons still apply, but only after this mode has explicit asset slots.
- Background maps in this mode should be judged as arena texture, not as old level-grid tiles.
- Keep Canvas art passes in renderer/theme modules. Avoid editing gameplay, voice, or upgrade logic for pure art changes.
