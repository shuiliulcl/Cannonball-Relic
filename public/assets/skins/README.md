# Cannonball Relic Skin Packs

Each visual skin is a folder under `public/assets/skins/<skin-id>`.

The renderer loads the active skin from the URL query parameter:

```text
http://127.0.0.1:5176/?skin=relic-ruins
```

If no skin is provided, the game uses `relic-ruins`.

## Required Runtime Files

Use these exact paths inside every skin folder:

```text
sprites/player.png
sprites/marble.png
sprites/enemy-grunt.png
sprites/obstacle-crate.png
sprites/obstacle-stone.png
sprites/obstacle-metal.png
sprites/pillar.png
sprites/brazier.png
textures/floor.png
textures/floor-cracked.png
textures/floor-moss.png
textures/floor-danger.png
textures/wall-border.png
manifest.json
```

## Recommended Source Files

Keep AI originals or layered work files here:

```text
source/raw/
source/prompts.md
```

Runtime code does not load `source/`; it is only for teammates and future AI agents.

## Adding A New Skin

1. Copy `relic-ruins` to a new folder, for example `snow-field`.
2. Replace the files in `sprites/` and `textures/` while keeping the same filenames.
3. Update the copied `manifest.json`.
4. Open the game with `?skin=snow-field`.

Good sprite targets: transparent PNG, 1024x1024 source, bold outline, readable at 64-96 px.
