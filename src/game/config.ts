export const ARENA = {
  halfWidth: 8.5,
  halfDepth: 6.25,
  wallHeight: 1.5,
};

export const DESIGN_UNITS = {
  worldUnitMeters: 1,
  note: "One gameplay world unit maps to one design-meter grid cell.",
};

export const PLAYER = {
  radius: 0.5,
  hp: 20,
  speed: 4.0,
  dashDistance: 8.0,
  dashCooldown: 2.0,
  rollDuration: 0.5,
};

export const HUMAN_CANNON = {
  duration: 3.2,
  speed: 9.4,
  radiusBonus: 0.12,
  baseDamage: 3,
  bounceBonusDamage: 2,
};

export const MARBLE = {
  radius: 0.5,
  baseSpeed: 8,
  maxChargeSeconds: 0.9,
  baseRange: 40,
  baseDamage: 1,
  maxBounces: 3,
  recallSpeed: 10,
  knockback: 1,
  hp: 1,
  homingAngle: 10,
};

export const MONSTER = {
  radius: 0.36,
  hp: 3,
  speed: 1.15,
};

export const CAMERA = {
  size: 6.25,
};

export const RUN = {
  maxWaves: 10,
};

export const OBSTACLES = [
  { id: "left-block", position: { x: -3.2, z: -0.85 }, halfSize: { x: 0.85, z: 0.48 } },
  { id: "right-block", position: { x: 3.2, z: -0.85 }, halfSize: { x: 0.85, z: 0.48 } },
  { id: "center-low", position: { x: 0, z: 1.0 }, halfSize: { x: 0.72, z: 0.42 } },
] as const;
