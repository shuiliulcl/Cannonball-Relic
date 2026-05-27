# Voice Survivor Art Workflow

This workflow is for the new root gameplay at `http://127.0.0.1:5177/`.

The target gameplay is `src/survivor/VoiceSurvivorGame.ts`, a Canvas 2D survivor game with DOM/CSS HUD panels. Runtime art logic now lives in a separate renderer so style passes do not collide with gameplay and voice-system changes. The old Cannonball Relic route at `?game=relic` is a separate renderer and must not be used as the acceptance target for this mode.

## Runtime Scope

- Route: `/`
- Game class: `VoiceSurvivorGame`
- Runtime art renderer: `src/survivor/render/LineglowSurvivorRenderer.ts`
- Runtime art theme: `src/survivor/render/lineglowTheme.ts`
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
- `src/survivor/render/lineglowTheme.ts`
- `src/survivor/VoiceSurvivorGame.ts` only as gameplay state provider and render-state bridge
- `src/styles.css`

Screenshots:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/start-overlay-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/ingame-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/ingame-density-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/ingame-wave2-v1.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-v6-root-ingame-enlarged.png`

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
- Put reusable visual tokens in `lineglowTheme.ts` before generating or extracting PNG resources.
- Generate category-specific source sheets after the runtime vocabulary is stable. Current first categories are HUD icons, enemy tokens, and player/VFX tokens.
- For HUD and enemy sheets, prefer regular grid layouts with generous spacing and no text so crops can be reviewed consistently.
- For VFX sheets, prefer a seamless loose contact sheet over a visible grid. Generated grid separators, cracks, floor seams, or panel lines can be mistaken for thin runtime effects.
- Regenerate or reject sheets that contain rune alphabets, Latin/Chinese characters, numbers, labels, fake transparency, hollow interiors, or black-only outlines.
- Treat the source PNG as opaque until alpha is inspected. Any transparency or cutout pass must happen in an extracted review folder before production wiring.
- Prioritize enemy and player skill extraction before HUD when gameplay readability is the open question.
- After extraction, generate a runtime-scale preview on a dark gameplay-like field. Large source-sheet images can look good while failing at 26-42 px enemy scale or over-covering the player core.
- For enemy review, check family separation at actual scale: runner speed token, brute mass, pouncer direction, ranged firing cue, repeater wheel, silencer area ring, target priority core.
- For player skill review, check layer roles separately: player core, defense ring, cannon pips/aim, projectile modifiers, orbit weapons, drone, pickup pull, evade/chain afterimage.
- If background removal destroys dark UI frames or bodies, lower the alpha threshold, switch to manual/component review, or regenerate with brighter contour and less background-like body color. Do not accept crops just because the count is correct.
- When correcting enemy style against VFX, watch for overcorrection. "Brighter" can become pure HUD icons; the target is living signal monsters with VFX-grade contours, not UI glyphs.
- If a generated sheet has the right style but the wrong count/layout, extract it as a review source and create a selected family set instead of wiring the raw sheet.
- In runtime previews, background cracks and field lines must stay much dimmer than enemy contours. If the preview field competes with enemies, lower floor contrast before judging enemy readability.
- If AI-generated enemy sheets keep producing artifacts or weak small-scale reads, create a controlled procedural token baseline. This gives real alpha, stable line weight, no background contamination, and deterministic scale tests before returning to painterly variants.
- Runtime-scale previews for enemy readability should include a clean no-crack field first. Add cracked field stress tests only after the clean preview passes.
- For non-symbolized enemy exploration, bracket the target with two controlled variants: a more organic v3-cleanup branch and a more readable v4-organicized branch. Pick the midpoint only after viewing both at gameplay scale.
- The current enemy target is not pure glyph and not illustration: use irregular living silhouettes, one strong contour, one core mark, and one family-specific feature.
- Keep painterly flavor at the contour level rather than texture density. Small-scale enemies should gain character from silhouette wobble and asymmetry, not from fine interior detail.
- Do not overuse irregular strokes to create creature flavor. Thick line art should preserve the intended silhouette, with shape variation coming from broad proportions and pose changes.
- Avoid open internal strokes on tiny enemies. Prefer closed eyes, cores, capsules, dots, or attached plates so small-scale previews do not show strange loose lineheads.
- When wiring extracted enemy PNGs into Canvas, measure the alpha bounding box before choosing draw scale. A 192 px token with a 120-155 px visible box and wide glow margins may need a 4-5x collision-radius draw size to read correctly in the root survivor camera.
- Runtime sprite integration must keep a procedural fallback until image loading, asset paths, and scale rules are proven in a no-overlay gameplay screenshot.
- If a sprite family still collapses under combat density, prefer a tiny runtime cue layer over regenerating the whole sheet immediately. Cues should describe gameplay role: direction, mass, firing lens, repeat pulse, silence aura, or priority ring.
