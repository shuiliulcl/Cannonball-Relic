export type Vec2 = {
  x: number;
  z: number;
};

export type MarbleState = "ready" | "charging" | "flying" | "recalling";

export type Monster = {
  id: number;
  position: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
};

export type Obstacle = {
  id: string;
  position: Vec2;
  halfSize: Vec2;
};

export type Marble = {
  position: Vec2;
  velocity: Vec2;
  radius: number;
  state: MarbleState;
  bounces: number;
  distanceLeft: number;
  hitIds: Set<number>;
};

export type Player = {
  position: Vec2;
  radius: number;
  hp: number;
  speed: number;
  dashCooldown: number;
  dashTimer: number;
  invulnTimer: number;
};

export type GameSnapshot = {
  score: number;
  wave: number;
  marbleState: MarbleState;
  damageScale: number;
  chargeRatio: number;
  hp: number;
};

export type UpgradeId = "extraDamage" | "longerRange" | "recallBlade";

export type Upgrade = {
  id: UpgradeId;
  title: string;
  description: string;
};
