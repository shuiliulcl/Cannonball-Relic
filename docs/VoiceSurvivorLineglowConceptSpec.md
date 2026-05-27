# Voice Survivor Lineglow Concept Spec

Target route: `http://127.0.0.1:5177/`

This spec revises the orbit-ruins direction for the current root survivor gameplay. The new direction is closer to dark arena + luminous contour readability: line art, self-glow, strong functional colors, and less uniform brass metal.

## Gameplay Constraints

The game is dense and fast:

- Early target enemy count: 16.
- Mid game target count: 24-36 depending on threat tier.
- Late game target count: 34-50 depending on threat tier.
- Spawn batches can reach 6+ enemies, with pressure surges adding mixed specials.
- Enemy runtime radii are small: runner 13, ranged 14, pouncer 15, repeater 16, silencer/target 18, brute 20.

So enemies should read as small tokens, not character illustrations. Most detail must live in silhouette, glow rim, and one inner signal mark.

## Arena Scope

The current root gameplay does not communicate a fixed terrain island, ring, or arena edge. Concept slices should not imply an oval platform boundary unless the game later adds explicit terrain limits.

Prefer:

- Continuous dark cracked ground extending beyond the viewport.
- Soft vignette, fog, star parallax, or low-contrast floor texture for depth.
- Sparse local landmarks such as beacons, relic cracks, signal glyphs, or stone seams.
- HUD framing at screen edges, not terrain framing.

Avoid:

- Oval/circular island silhouettes.
- Cliff edges around the whole play area.
- Torches evenly marking a closed arena boundary.
- Strong border walls that imply collision or level limits.

## Player Expression Space

The player must reserve visual layers for all Buff families:

1. Core identity: tiny dark explorer body, cyan voice core, readable center dot.
2. Voice/action halo: short cyan pulse rings for casting and command feedback.
3. Defensive layer: shield ring, armor plates, HP regen sparkle, scramble warning.
4. Movement layer: evade/calm/scramble afterimage arcs.
5. Cannon layer: charge pips, aim line, landing shockwave, cannon shard burst.
6. Projectile modifiers:
   - explode: orange ember core and impact bloom.
   - freeze: icy cyan starburst and frost ring.
   - lightning: violet-blue zigzag links.
   - split: fan-angle ghost lines.
   - pierce: straight drill-like beam tip.
   - ricochet: angular bounce nodes.
   - focus/serious: target reticle line to priority enemy.
7. Passive weapons:
   - guard turret: small orbiting signal drone.
   - blade: crescent orbit weapons, radius visibly expands with upgrades.
   - skillGo: short-lived placed glyph/turret tokens.
8. Economy/magnet:
   - gather/wealth: green-cyan pickup pull lines.
   - energy upgrades: longer cyan breath/core meter.
9. Risk/late routes:
   - xiexiu: unstable random-color glyph flickers.
   - bang: orange close-range impact fists/shock arcs.
   - stat-chain: four-color terminal burst marker.

Rule: the player body stays simple. Buff expression happens in rings, pips, orbiting objects, projectile trails, and temporary pulses so multiple upgrades can stack without hiding the player.

## Enemy Scale And Detail Budget

Common enemies should remain 26-32 px diameter at runtime. They get:

- 1 closed silhouette.
- 1 glow rim color.
- 1 inner crack/core/eye mark.
- No tiny limbs that must be read to understand the type.

Special enemies can reach 34-42 px visual diameter:

- brute: orange cracked stone mass, slow and chunky.
- silencer: violet ring is larger than body, because its gameplay area matters.
- target: red danger core/ring, readable as priority objective.
- ranged: cyan lens beam/direction cue.

Avoid:

- uniform brass armor across all enemies.
- black silhouettes without colored rim.
- hollow interior cutouts that disappear at small size.
- wispy roots, fur, smoke, or hairline appendages.

## Enemy Family Visual Map

- runner: dark small body, orange eye slash, fastest read.
- brute: largest body, cracked orange lava lines, slow.
- pouncer: triangular amber outline, forward point and leap cue.
- ranged: cyan lens drone, obvious firing direction.
- repeater: green rotating leaf-wheel or segmented signal gear.
- silencer: violet ghost/cantor body with orbit ring, area denial.
- target: red relic core with concentric danger ring.

## Concept Output Plan

Current selected concept direction:

- Primary target: `lineglow-buff-showcase-12-implementation-target.png`
- Clean reference: `lineglow-buff-showcase-09-clean-runtime.png`
- Original direction seed: `lineglow-scene-slice-04-buff-showcase.png`

Why:

- Player body stays visible under stacked Buff effects.
- Buffs live in rings, pips, pull lines, orbit blades, drones, projectiles, and bursts.
- Continuous ground scope avoids a false terrain boundary.
- Enemies are mostly glowing tokens rather than detailed characters.

Risks to avoid from later stress slices:

- Green gather lines must not become a full-screen radial fan.
- HP bars must remain selective; full-health enemies should not carry bars.
- Floor cracks and cyan seams should be low contrast enough not to fight projectiles.

## Runtime Implementation Pass v2

Implemented first in Canvas/CSS for the root route before extracting raster assets. This keeps the pass tied to the current gameplay density and avoids spending production time on sprites before the renderer has image slots.

Changes made:

- Arena: removed the previous ellipse/orbit-ring platform read. The field is now a continuous dark cracked floor with low-contrast cyan seams and local player glow.
- Player: body is a small dark explorer token with a cyan core. Buff space is reserved through shield rings, cannon pips/aim line, explosion arc, freeze ring, lightning sparks, split fan lines, ricochet nodes, and focus reticle.
- Enemies: replaced brass/stone bodies with abstract lineglow tokens. Runner is orange eye slash, brute is cracked orange mass, pouncer is amber triangle, ranged is cyan lens drone, repeater is green segmented wheel, silencer is violet area token, target is red danger core.
- VFX: projectiles, drops, turrets, orbit blades, enemy shots, and pickup pull lines now use functional glow colors. Pickup pull lines are capped to nearby drops so gather/wealth does not become a full-screen radial fan.
- HUD: survivor panels and upgrade cards moved from warm brass expedition cards toward dark translucent instrument panels with cyan, violet, orange, and green line accents.

Validation screenshots:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-runtime-v2-start.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-runtime-v2-early.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-runtime-v2-density.png`

## Runtime Architecture Pass v3

Canvas art logic is now split from the gameplay class:

- `src/survivor/VoiceSurvivorGame.ts`: gameplay state, voice input, upgrades, collisions, HUD state, and a small `getRenderState()` bridge.
- `src/survivor/render/LineglowSurvivorRenderer.ts`: arena, player token, enemy tokens, projectiles, drops, turrets, orbit weapons, and particles.

Future art style iterations should edit renderer/theme modules first. Gameplay files should only change when a style needs a new explicit state value or asset slot.

Validation screenshot:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-runtime-v3-renderer-split-check.png`

## Runtime Resource Pass v4

Lineglow art resources now have a shared theme entry point:

- `src/survivor/render/lineglowTheme.ts`: enemy token palette and spell HUD glyph/tone map.
- `src/survivor/render/LineglowSurvivorRenderer.ts`: consumes the enemy token palette instead of owning hard-coded enemy colors.
- `src/survivor/VoiceSurvivorGame.ts`: uses the spell HUD glyph/tone map when building command buttons and active Buff rows.

This is still procedural UI art, not final raster icon production. The purpose is to reserve a stable resource contract before generating or extracting PNG sheets.

Validation screenshot:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-runtime-v4-hud-glyphs.png`

Useful supporting sheets:

- Player Buff Expression Sheet: base player and layered Buff states, no readable text.
- Enemy Density Scale Sheet: multiple runtime-size enemy tokens shown in sparse/mid/dense combat clusters, no readable text.

These are source concept sheets. They should not be extracted directly as final sprites until the Canvas renderer has explicit image slots or a procedural mapping plan.

## Production Source Sheets v1

Generated production-oriented source sheets for the selected lineglow direction:

- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-hud-icons-v1.png`
  - Status: usable review source.
  - Layout: 5x4 grid.
  - Use: command/HUD icon extraction candidate.
  - Notes: symbols avoid readable text and have consistent circular frames, so conservative grid crops should preserve the glow.
- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-enemy-tokens-v1.png`
  - Status: usable review source.
  - Layout: 7x4 grid.
  - Use: enemy family shape reference and possible extraction test.
  - Notes: families read clearly by size, silhouette, and functional color. The red target core may need a more filled center if it disappears at runtime size.
- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-player-vfx-v3-loose-clean.png`
  - Status: preferred VFX source.
  - Layout: loose contact sheet on a seamless background.
  - Use: component extraction or manual crop reference for player/VFX overlays.
  - Notes: this replaces earlier VFX attempts that produced rune-like lettering, floor cracks, or visible grid separators.

Rejected or caution-only VFX attempts:

- `lineglow-player-vfx-v1.png`: contains rune/letter-like marks and background cracks.
- `lineglow-player-vfx-v2-clean.png`: removes lettering, but still includes visible grid separators.

Asset use rule:

- Keep runtime on procedural Canvas tokens until the renderer has explicit image slots, sizing rules, fallback behavior, and alpha validation.
- Use these sheets first as visual vocabulary, extraction tests, and icon/token references.
- Do not assume the PNG background is transparent; verify alpha before any sprite export.

## Enemy And Player Skill Extraction Priority

The current production pass should prioritize enemy readability and player skill expression before HUD icon production.

Enemy review outputs:

- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v1-review/`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v1-review/review-contact.png`

Player skill review outputs:

- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-player-vfx-v3-review/`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-player-vfx-v3-review/review-contact.png`

Runtime scale preview:

- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-skills-runtime-scale-preview-v1.png`

Findings:

- Enemy token crops survived extraction better than HUD icons because their dark bodies remain enclosed by stronger colored contour light.
- Runner, pouncer, ranged, repeater, silencer, and target are distinguishable at approximate runtime scale by silhouette and color.
- Brute is readable, but can drift toward a small golem/creature read. A later v2 should make it more abstract and rock-mass-like if that becomes distracting.
- Target core is readable by red ring, but the center should stay filled enough that it does not become a hollow red UI marker at 34-42 px.
- Player skill VFX v3 is clean enough for review extraction. It should be used as player skill vocabulary before generating more HUD assets.
- Player skill overlays need hard runtime scale caps. Rings, reticles, and arcs should surround the player core without covering it; drones, blades, shards, and pips should stay separate from the core silhouette.
- HUD extraction is lower priority for now. The first HUD crop pass over-removed dark instrument-frame pixels, so HUD should wait until enemy/player skill extraction rules are stable.

## Enemy Style Correction v2-v3

Problem found after comparing enemy v1 against the VFX sheet:

- Enemy v1 used dark illustrated bodies with glow accents, while the player/VFX language uses bright glowing strokes as the primary shape.
- At runtime scale, v1 enemies read as black bodies with colored rims, so they felt separate from the skill effects and darker than the selected concept direction.
- The target concept wants enemies to feel like living signal/VFX tokens, not small shaded monster illustrations.

Generated correction attempts:

- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-enemy-tokens-v2-vfx-bright.png`
  - Result: brightness moved in the right direction, but the shapes became too much like HUD/UI icons.
  - Rejected for runtime enemy use.
- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-enemy-tokens-v3-living-bright.png`
  - Result: better balance between living monster silhouette and VFX-like brightness.
  - Caveat: generated as 32 tokens rather than the requested 28, so a selected review set is used.

Selected v3 review set:

- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v3-selected-review/`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v3-selected-review/review-contact.png`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-v3-runtime-scale-preview-v1.png`

v3 findings:

- Better match to VFX brightness and lineglow contour language.
- Runner, pouncer, ranged, repeater, silencer, and target now read more like living signal tokens.
- Brute still needs care: the center should be brightened or simplified so it does not become a dark orange blob at small size.
- Runner should not be scaled too small; the comet body needs enough screen area to avoid vanishing in dense waves.
- Runtime floor cracks must remain lower contrast than the preview. Bright cyan/orange/violet background lines compete directly with the new enemy contours.

Next enemy generation rule:

- Ask for "bright living signal monsters" rather than "enemy icons".
- Keep contour brightness close to VFX, but preserve dark creature centers and irregular living silhouettes.
- Forbid perfect geometric UI symbols, square wall-tile brutes, planet/crosshair silhouettes, and repeated identical rows.

## Enemy Readability Correction v4

User feedback on the v3 scale preview:

- The preview contained strange bright background lines.
- At that scale, enemy identity was still not readable enough.

Correction:

- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-enemy-tokens-v4-procedural-clean.png`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v4-procedural/`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-v4-runtime-scale-preview-clean.png`

v4 is a controlled procedural token pass instead of a free AI sheet:

- Uses real transparent PNG exports.
- Removes all generated UI/webpage/background artifacts.
- Uses a clean dark preview field with no bright cracks or random contour lines.
- Simplifies each enemy to one large silhouette plus one core mark.
- Keeps line weight and glow consistent with the player/VFX language.

Tradeoff:

- v4 is less painterly and less organic than v3.
- It is more reliable as a gameplay-readability baseline because the shapes stay readable at 26-42 px and can be tuned deterministically.

Recommended next step:

- Use v4 as the implementation/readability baseline.
- If more organic flavor is needed, add it back only after the seven enemy families remain readable in the clean runtime-scale preview.

## Enemy Hybrid Exploration v5

User feedback after v4:

- v4 fixed readability and artifact problems, but it became too symbolic.
- The desired direction is non-symbolized enemy design: closer to v3's living-monster feel, with v4's scale discipline.

v5 branch comparison:

- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-v5-ab-runtime-comparison-clean.png`
  - Side-by-side clean runtime preview for v5A and v5B.
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v5a-living-clean/`
  - v5A: v3 cleanup. More organic and living, lower detail, brighter contour.
  - Useful upper bound for monster flavor, but some small forms still read thin in dense clusters.
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v5b-organic-readable/`
  - v5B: v4 organicized. Strong readable shapes, slightly less geometric than v4.
  - Useful lower-detail bound, but still feels more like glyphs than enemies.
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v5c-creature-readable/`
  - v5C: current best midpoint. More creature-like than v5B, more disciplined than v5A.
  - Uses irregular enemy silhouettes while preserving true alpha, no background artifacts, and 26-42 px readability.
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-v5c-runtime-scale-preview-clean.png`
  - Clean v5C runtime scale preview against current player/VFX brightness.

v5 recommendation:

- Continue from v5C as the non-symbolized enemy baseline.
- Treat v5A as the style/flavor ceiling and v5B/v4 as the readability floor.
- Add painterly irregularity only inside the large contour budget: no fine cracks, no tiny roots, no internal texture fields.
- Keep clean no-crack previews as the first acceptance check; only then test over the real arena floor.

## Enemy Clean-Shape Correction v6

User feedback after v5C:

- The irregular line feeling became too strong.
- Thick strokes are acceptable, but the intended shapes should be preserved.
- Avoid strange lineheads or loose short strokes, especially inside pouncer-like wedge shapes.

Correction:

- `docs/concepts/voice-survivor-orbit-ruins/sheets/lineglow-enemy-tokens-v6-clean-shape.png`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v6-clean-shape/`
- `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-v6-runtime-scale-preview-clean.png`

v6 rules:

- Preserve the family silhouette first; do not create life through noisy contour jitter.
- Use thick contours, but keep contour paths stable and intentional.
- Replace open internal line segments with closed shapes: eyes, cores, capsules, dots, or attached plates.
- Keep decorative marks inside the main silhouette unless they are an explicit gameplay cue.
- Avoid loose line endpoints, dangling arcs, scratch marks, and detached strokes.

v6 tradeoff:

- Cleaner and more shape-preserving than v5C.
- Slightly less organic/wild, but better aligned with the requirement that the shape remain readable and intentional.

Current recommendation:

- Use v6 as the clean-shape baseline.
- Reintroduce organic variation through silhouette proportions and animation poses, not through scratchy line noise.

## Runtime Enemy Sprite Pass v6

Implementation:

- Runtime assets: `public/assets/skins/orbit-ruins/survivor/enemies/`
- Source assets: `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v6-clean-shape/`
- Renderer: `src/survivor/render/LineglowSurvivorRenderer.ts`
- Validation screenshot: `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-v6-root-ingame-enlarged.png`

Notes:

- The renderer now tries v6 transparent PNG sprites first and falls back to the procedural Canvas enemy tokens while images are loading or missing.
- Runtime draw scale is intentionally larger than the collision radius. The v6 source PNGs are 192 px with generous transparent/glow margins, so a direct `2x radius` draw made enemies read like tiny symbols.
- First enlarged runtime check has no missing requests or console/page errors. Runner and target reads are stronger in the early wave, but later mixed-wave validation is still needed before locking all family scales.

## Runtime Readability Cue Pass v6.2

Validation screenshot:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-v6-runtime-midwave-cues.png`

Adjustment:

- Kept the v6 PNG sprites as the primary enemy bodies.
- Added small Canvas-drawn functional cues under and outside the sprites:
  - runner: trailing tail tick so the fast enemy reads as a speed token instead of a generic orange dot.
  - brute: outer partial heavy arcs to separate mass from the other orange families.
  - pouncer: forward chevrons aligned to movement, with stronger stroke during windup.
  - ranged: cyan lens tip and short firing line aimed toward the player.
  - repeater: three rotating green pulse dots outside the wheel body.
  - silencer: violet outer arc rings, separate from the larger area aura.

Reason:

- In the first v6 runtime screenshot, orange-family enemies could collapse together under motion and projectile noise.
- Drawing cues above the sprite made the cue/body proportion feel too overlapped, so the cue layer now renders before the sprite and mostly outside the visible body.

## Runtime Readability Cue Pass v6.3

Validation screenshots:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/lineglow-v6-runtime-midwave-cues.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/enemy-cue-v6-3-review/`

Adjustment:

- Damaged enemy HP bars now reserve space above the enlarged sprite footprint, not just above the collision radius. The v6 PNG bodies are intentionally larger than their gameplay hit circles, so the old bar position could cover top-side cue lines.
- Runner and pouncer sprites rotate to their movement direction; ranged rotates to its aim direction. This keeps directional bodies aligned with actual behavior instead of leaving fixed right-facing silhouettes in the world.
- Runner cue changed from an arrowhead/tail tick to two short speed wakes behind the moving body.
- Brute cue changed to lower shoulder arcs so its mass cue does not fight the HP bar area.
- Pouncer cue changed from forward chevrons to rear compression curves, reading as a stored leap rather than an unexplained icon.
- Ranged cue no longer uses stacked arrow language; it uses a short firing glint plus broken lens arcs.
- Repeater cue changed from orbiting dots to segmented pulse arcs so it does not duplicate the body's internal node/dot design.
- Silencer and target keep their accepted body direction, with top-side rings reduced or opened to avoid HP-bar overlap.

Rule added:

- Treat the top of every enlarged enemy sprite as a UI reserve zone. Do not place critical enemy-family cue lines there, and position damaged HP bars from the visual sprite footprint rather than the collision radius.

## Runtime Player / Pouncer Correction v6.4

Validation screenshots:

- `docs/concepts/voice-survivor-orbit-ruins/screenshots/enemy-player-v6-4-review/player-core.png`
- `docs/concepts/voice-survivor-orbit-ruins/screenshots/enemy-player-v6-4-review/pouncer.png`

Adjustment:

- Pouncer body was regenerated as transparent procedural PNGs in `docs/concepts/voice-survivor-orbit-ruins/extracted/lineglow-enemy-tokens-v6-4-pouncer-rebody/` and copied into `public/assets/skins/orbit-ruins/survivor/enemies/`.
- The new pouncer body is a crouched, compressed leap core with tucked hind plates and a blunt forward sensor. It avoids the earlier triangle/arrow symbol language while still rotating with movement in runtime.
- The player body changed from an up-pointing cloak/rocket silhouette to a nondirectional signal core: round dark body, cyan/amber center, symmetric rotating instrument arcs, and no fixed nose or fins.
- Directional meaning for the player is now reserved for the aim line, target marker, projectile path, and cannon state VFX rather than the idle body silhouette.

Rule added:

- If a player body does not rotate in normal movement, keep the base silhouette radially balanced. Directional silhouettes are only acceptable when the renderer also rotates them to an actual movement, aim, or launch vector.
