export type Vec2 = {
  x: number;
  z: number;
};

export type MarbleState = "ready" | "charging" | "flying" | "recalling" | "cannon";

export type PlayerMode = "normal" | "humanCannon";

export type FloorMaterial = "sandstone" | "cracked" | "moss" | "danger" | "fire" | "mud" | "ice" | "blood";

export type ObstacleMaterial =
  | "wood"
  | "stone"
  | "metal"
  | "glass"
  | "reflector"
  | "accelerator"
  | "thorns"
  | "oneWay"
  | "bomb";

export type ObstacleBehavior = "solid" | "breakable" | "reflectBack" | "speedUp" | "pierceDamage" | "oneWay" | "explosive";

export type InteractableType = "brazier" | "pinball" | "iceBall" | "alarmPost" | "doorSwitch";

export type MonsterType =
  | "grunt"
  | "runner"
  | "tank"
  | "octopus"
  | "hound"
  | "boar"
  | "slime"
  | "rabbit"
  | "bombBug"
  | "shieldCrab"
  | "voodooFlower"
  | "eyeCannon"
  | "priest";

export type MonsterAiState = "idle" | "patrol" | "alert" | "returning";

export type Monster = {
  id: number;
  position: Vec2;
  spawnPosition?: Vec2;
  patrolPath?: Vec2[];
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  monsterType: MonsterType;
  aiState?: MonsterAiState;
  aggroRange?: number;
  disengageRange?: number;
  noKnockback?: boolean;
};

export type Obstacle = {
  id: string;
  position: Vec2;
  halfSize: Vec2;
  material?: ObstacleMaterial;
  behavior?: ObstacleBehavior;
  facing?: "up" | "right" | "down" | "left";
  hp?: number;
};

export type Marble = {
  id: string;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  state: MarbleState;
  bounces: number;
  distanceLeft: number;
  hitIds: Set<number>;
  obstacleHitIds: Set<string>;
  interactableHitIds: Set<string>;
  bonusDamage: number;
  hp: number;
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
  rollTimer: number;
  rollDuration: number;
  rollVelocity: Vec2;
  invulnTimer: number;
};

export type OwnedBuff = {
  id: UpgradeId;
  title: string;
  description: string;
  rarity: UpgradeRarity;
  count: number;
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
  dashCooldownRatio: number;
  dashCooldownText: string;
  ownedBuffs: OwnedBuff[];
};

export type UpgradeId =
  | "extraDamage"
  | "longerRange"
  | "recallBlade"
  | "quickDash"
  | "vitality"
  | "humanCannon"
  | "piercingMarble";

export type UpgradeRarity = "bronze" | "gold" | "diamond";

export type UpgradeStats = {
  bounceBonusDamage: number;
  rangeMultiplier: number;
  recallDamageBonus: number;
  maxHp: number;
  marbleHp: number;
  homingAngle: number;
};

export type Upgrade = {
  id: UpgradeId;
  rarity: UpgradeRarity;
  title: string;
  description: string;
  weight: number;
  uniquePerRun?: boolean;
  apply: (stats: UpgradeStats, player: Player) => void;
};
