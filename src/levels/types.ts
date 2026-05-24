import type { FloorMaterial, InteractableType, MonsterType, Obstacle, ObstacleBehavior, ObstacleMaterial, Vec2 } from "../game/types";

export type { FloorMaterial, InteractableType, MonsterType, ObstacleBehavior, ObstacleMaterial };

export type GridDirection = "up" | "right" | "down" | "left";

export type LevelObstacle = {
  id: string;
  x: number;
  z: number;
  w: number;
  h: number;
  material: ObstacleMaterial;
  behavior?: ObstacleBehavior;
  facing?: GridDirection;
  hp?: number;
};

export type LevelInteractable = {
  id: string;
  x: number;
  z: number;
  type: InteractableType;
  wave?: number;
  cooldown?: number;
};

export type LevelSpawn = {
  id: string;
  x: number;
  z: number;
  wave: number;
  count: number;
  monsterType: MonsterType;
  interval: number;
  patrolPath?: Array<{ x: number; z: number }>;
  aggroRange?: number;
  disengageRange?: number;
};

export type LevelVoidCell = {
  x: number;
  z: number;
};

export type LevelDefinition = {
  version: 1 | 2;
  name: string;
  description?: string;
  grid: {
    width: number;
    height: number;
    cellSize: number;
  };
  playerStart?: { x: number; z: number };
  floors: FloorMaterial[];
  voids?: LevelVoidCell[];
  obstacles: LevelObstacle[];
  interactables?: LevelInteractable[];
  spawns: LevelSpawn[];
};

export type RuntimeInteractable = {
  id: string;
  position: Vec2;
  type: InteractableType;
  wave?: number;
  cooldown?: number;
};

export type RuntimeSpawn = {
  id: string;
  position: Vec2;
  wave: number;
  count: number;
  monsterType: MonsterType;
  interval: number;
  patrolPath?: Vec2[];
  aggroRange?: number;
  disengageRange?: number;
};

export type RuntimeLevel = {
  name: string;
  description?: string;
  grid: LevelDefinition["grid"];
  arenaHalfWidth: number;
  arenaHalfDepth: number;
  playerStart?: Vec2;
  floors: FloorMaterial[];
  voids: LevelVoidCell[];
  obstacles: Obstacle[];
  interactables: RuntimeInteractable[];
  spawns: RuntimeSpawn[];
};
