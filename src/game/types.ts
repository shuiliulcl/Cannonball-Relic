export type Vec2 = {
  x: number;
  z: number;
};

export type MarbleState = "ready" | "charging" | "flying" | "awaitingRecall" | "recalling" | "cannon";

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
  patrolIndex?: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  monsterType: MonsterType;
  aiState?: MonsterAiState;
  aiTimer?: number;
  attackCooldown?: number;
  frozenTimer?: number;
  chargeVelocity?: Vec2;
  chargeTimer?: number;
  jumpVelocity?: Vec2;
  jumpTimer?: number;
  jumpCooldown?: number;
  splitLevel?: number;
  fuseTimer?: number;
  shieldFacing?: Vec2;
  supportCooldown?: number;
  aggroRange?: number;
  disengageRange?: number;
  noKnockback?: boolean;
};

export type EnemyProjectile = {
  id: number;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  ttl: number;
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
  shields: number;
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
  shields: number;
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
  | "piercingMarble"
  | "sprintTraining"
  | "rollMastery"
  | "lightMarble"
  | "multiBounce"
  | "sizeAmplify"
  | "expandedPouch"
  | "hunterCalibration"
  | "swiftRecall"
  | "rapidThrow"
  | "crisisConcentration"
  | "shieldTrait"
  | "vampirism"
  | "momentumContinue"
  | "chainLoading"
  | "fragmentTrajectory"
  | "shockKnockback"
  | "tripleShot"
  | "freezeHit"
  | "growingMarble"
  | "drillMarble";

export type UpgradeRarity = "bronze" | "gold" | "diamond";

export type UpgradeStats = {
  bounceBonusDamage: number;
  rangeMultiplier: number;
  recallDamageBonus: number;
  maxHp: number;
  marbleHp: number;
  homingAngle: number;
  speedBonus: number;
  dashDistanceBonus: number;
  marbleSpeedMultiplier: number;
  maxBouncesBonus: number;
  marbleRadiusBonus: number;
  baseDamageBonus: number;
  recallSpeedMultiplier: number;
  hasShieldTrait: boolean;
  hasVampirism: boolean;
  hasMomentumContinue: boolean;
  hasChainLoading: boolean;
  hasFragment: boolean;
  hasShockKnockback: boolean;
  hasTripleShot: boolean;
  hasFreezeHit: boolean;
  hasGrowingMarble: boolean;
  hasDrillMarble: boolean;
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
