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

Useful supporting sheets:

- Player Buff Expression Sheet: base player and layered Buff states, no readable text.
- Enemy Density Scale Sheet: multiple runtime-size enemy tokens shown in sparse/mid/dense combat clusters, no readable text.

These are source concept sheets. They should not be extracted directly as final sprites until the Canvas renderer has explicit image slots or a procedural mapping plan.
