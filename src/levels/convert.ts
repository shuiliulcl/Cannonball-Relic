import { ARENA } from "../game/config";
import type { LevelDefinition, RuntimeLevel } from "./types";

export function levelToRuntime(level: LevelDefinition): RuntimeLevel {
  const cellSize = level.grid.cellSize || 1;
  const originX = -ARENA.halfWidth + cellSize / 2;
  const originZ = -ARENA.halfDepth + cellSize / 2;

  return {
    name: level.name,
    grid: level.grid,
    floors: level.floors,
    obstacles: level.obstacles.map((item) => ({
      id: item.id,
      material: item.material,
      position: {
        x: originX + (item.x + item.w / 2 - 0.5) * cellSize,
        z: originZ + (item.z + item.h / 2 - 0.5) * cellSize,
      },
      halfSize: {
        x: (item.w * cellSize) / 2,
        z: (item.h * cellSize) / 2,
      },
    })),
    spawns: level.spawns.map((item) => ({
      id: item.id,
      position: {
        x: originX + item.x * cellSize,
        z: originZ + item.z * cellSize,
      },
      wave: item.wave,
      count: item.count,
      monsterType: item.monsterType,
      interval: item.interval,
    })),
  };
}
