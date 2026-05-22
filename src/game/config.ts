export const ARENA = {
  halfWidth: 8.5,
  halfDepth: 6.25,
  wallHeight: 1.5,
};

export const PLAYER = {
  radius: 0.32,
  hp: 5,
  speed: 4.8,
  dashDistance: 1.9,
  dashCooldown: 1.2,
};

export const MARBLE = {
  radius: 0.18,
  baseSpeed: 8.4,
  maxChargeSeconds: 0.9,
  baseRange: 18,
  baseDamage: 1,
  bounceBonusDamage: 1,
  recallSpeed: 10,
};

export const MONSTER = {
  radius: 0.36,
  hp: 3,
  speed: 1.15,
};

export const CAMERA = {
  size: 9.5,
};

export const OBSTACLES = [
  { id: "left-block", position: { x: -3.2, z: -0.85 }, halfSize: { x: 0.85, z: 0.48 } },
  { id: "right-block", position: { x: 3.2, z: -0.85 }, halfSize: { x: 0.85, z: 0.48 } },
  { id: "center-low", position: { x: 0, z: 1.0 }, halfSize: { x: 0.72, z: 0.42 } },
] as const;
