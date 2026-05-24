import { ARENA } from "../game/config";
import type { LevelDefinition, RuntimeLevel } from "./types";

export function levelToRuntime(level: LevelDefinition): RuntimeLevel {
  const cellSize = level.grid.cellSize || 1;
  const originX = -ARENA.halfWidth + cellSize / 2;
  const originZ = -ARENA.halfDepth + cellSize / 2;
  const gridToWorld = (x: number, z: number) => ({
    x: originX + x * cellSize,
    z: originZ + z * cellSize,
  });

  return {
    name: level.name,
    description: level.description,
    grid: level.grid,
    playerStart: level.playerStart ? gridToWorld(level.playerStart.x, level.playerStart.z) : undefined,
    floors: level.floors,
    obstacles: level.obstacles.map((item) => ({
      id: item.id,
      material: item.material,
      behavior: item.behavior,
      facing: item.facing,
      hp: item.hp,
      position: {
        x: originX + (item.x + item.w / 2 - 0.5) * cellSize,
        z: originZ + (item.z + item.h / 2 - 0.5) * cellSize,
      },
      halfSize: {
        x: (item.w * cellSize) / 2,
        z: (item.h * cellSize) / 2,
      },
    })),
    interactables: (level.interactables ?? []).map((item) => ({
      id: item.id,
      position: gridToWorld(item.x, item.z),
      type: item.type,
      wave: item.wave,
      cooldown: item.cooldown,
    })),
    spawns: level.spawns.map((item) => ({
      id: item.id,
      position: gridToWorld(item.x, item.z),
      wave: item.wave,
      count: item.count,
      monsterType: item.monsterType,
      interval: item.interval,
      patrolPath: item.patrolPath?.map((point) => gridToWorld(point.x, point.z)),
      aggroRange: item.aggroRange,
      disengageRange: item.disengageRange,
    })),
  };
}
