import type { Obstacle } from "../game/types";

export type FloorMaterial = "sandstone" | "cracked" | "moss" | "danger";
export type ObstacleMaterial = "wood" | "stone" | "metal";
export type MonsterType = "grunt" | "runner" | "tank";

export type LevelObstacle = {
  id: string;
  x: number;
  z: number;
  w: number;
  h: number;
  material: ObstacleMaterial;
};

export type LevelSpawn = {
  id: string;
  x: number;
  z: number;
  wave: number;
  count: number;
  monsterType: MonsterType;
  interval: number;
};

export type LevelDefinition = {
  version: 1;
  name: string;
  grid: {
    width: number;
    height: number;
    cellSize: number;
  };
  floors: FloorMaterial[];
  obstacles: LevelObstacle[];
  spawns: LevelSpawn[];
};

export type RuntimeSpawn = {
  id: string;
  position: { x: number; z: number };
  wave: number;
  count: number;
  monsterType: MonsterType;
  interval: number;
};

export type RuntimeLevel = {
  name: string;
  obstacles: Obstacle[];
  spawns: RuntimeSpawn[];
};
