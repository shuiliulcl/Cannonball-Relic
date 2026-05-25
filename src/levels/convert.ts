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
  const floors = resolveFloors(level);

  return {
    name: level.name,
    description: level.description,
    maxWaves: level.maxWaves,
    grid: level.grid,
    arenaHalfWidth,
    arenaHalfDepth,
    playerStart: gridToWorld(playerStart.x, playerStart.z),
    floors,
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
      aiState: item.aiState,
      stationary: item.stationary,
      patrolPath: item.patrolPath?.map((point) => gridToWorld(point.x, point.z)),
      aggroRange: item.aggroRange,
      disengageRange: item.disengageRange,
    })),
  };
}

function resolveFloors(level: LevelDefinition): LevelDefinition["floors"] {
  const floors = Array.from({ length: level.grid.width * level.grid.height }, (_, index) => level.floors[index] ?? "sandstone");
  for (const patch of level.floorPatches ?? []) {
    for (let z = patch.z; z < patch.z + patch.h; z += 1) {
      for (let x = patch.x; x < patch.x + patch.w; x += 1) {
        if (x < 0 || z < 0 || x >= level.grid.width || z >= level.grid.height) {
          continue;
        }
        floors[z * level.grid.width + x] = patch.material;
      }
    }
  }
  return floors;
}
