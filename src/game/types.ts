export type Vec2 = {
  x: number;
  z: number;
};

export type MarbleState = "ready" | "charging" | "flying" | "recalling" | "cannon";

export type PlayerMode = "normal" | "humanCannon";

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
  velocity: Vec2;
  radius: number;
  hp: number;
  mode: PlayerMode;
  cannonTimeLeft: number;
  cannonBounces: number;
  cannonHitIds: Set<number>;
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
  maxHp: number;
  waveProgress: number;
};

export type UpgradeId =
  | "extraDamage"
  | "longerRange"
  | "recallBlade"
  | "quickDash"
  | "vitality"
  | "humanCannon";

export type UpgradeRarity = "common" | "rare" | "special";

export type Upgrade = {
  id: UpgradeId;
  rarity: UpgradeRarity;
  title: string;
  description: string;
  weight: number;
};
