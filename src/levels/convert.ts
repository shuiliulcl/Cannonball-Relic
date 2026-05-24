import type { LevelDefinition, RuntimeLevel } from "./types";

export function levelToRuntime(level: LevelDefinition): RuntimeLevel {
  const cellSize = level.grid.cellSize || 1;
  const arenaHalfWidth = (level.grid.width * cellSize) / 2;
  const arenaHalfDepth = (level.grid.height * cellSize) / 2;
  const originX = -arenaHalfWidth + cellSize / 2;
  const originZ = -arenaHalfDepth + cellSize / 2;
  const gridToWorld = (x: number, z: number) => ({
    x: originX + x * cellSize,
    z: originZ + z * cellSize,
  });
  const playerStart = level.playerStart ?? { x: 0, z: 0 };

  return {
    name: level.name,
    description: level.description,
    grid: level.grid,
    arenaHalfWidth,
    arenaHalfDepth,
    playerStart: gridToWorld(playerStart.x, playerStart.z),
    floors: level.floors,
    voids: level.voids ?? [],
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
