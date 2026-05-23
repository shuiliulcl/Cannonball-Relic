# Level Editor Guide

Open the editor with:

```text
http://127.0.0.1:5176/?mode=editor
```

The editor is a standalone tool page. It does not change the normal game route.

## Current Capabilities

- Paint floor materials on a 17 x 13 arena grid.
- Place obstacle blocks with different materials.
- Place monster spawn points with wave, count, monster type, and interval settings.
- Export the level as JSON.
- Import a JSON level back into the editor.
- Reset to a sample relic training arena.

## Data Model

The exported JSON contains:

- `version`: schema version.
- `name`: display name for the level.
- `grid`: width, height, and cell size.
- `floors`: one material value per grid cell.
- `obstacles`: placed blocking objects.
- `spawns`: monster spawn logic.

Example object types:

```json
{
  "obstacles": [
    { "id": "left-block", "x": 5, "z": 5, "w": 2, "h": 1, "material": "wood" }
  ],
  "spawns": [
    { "id": "wave-1-a", "x": 7, "z": 3, "wave": 1, "count": 3, "monsterType": "grunt", "interval": 0.7 }
  ]
}
```

## Next Integration Step

The first version is an authoring tool. The game runtime still uses `src/game/config.ts` for the live arena. To play exported levels, add a level loader that converts editor cells into:

- floor skin/material selection for the renderer,
- obstacle rectangles for physics,
- spawn definitions for `Game.spawnWave`.

Keep this bridge in `src/game/` or a dedicated `src/levels/` module so editor UI code does not leak into gameplay logic.
