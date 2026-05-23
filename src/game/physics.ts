import { ARENA } from "./config";
import type { Obstacle, Vec2 } from "./types";

/**
 * 分段弹射增伤（对齐设计文档）：
 *   0 次弹射  → +0
 *   1~3 次    → 每次 +2
 *   3~5 次    → 每次 +3
 *   5 次以上  → 每次 +5
 * bonusPerBounce 为升级卡的额外加成（叠加在分段基础值上）。
 */
export function calcBounceDamage(bounces: number, baseDamage: number, bonusPerBounce = 0): number {
  let extra = 0;
  for (let i = 1; i <= bounces; i += 1) {
    const tier = i <= 3 ? 2 : i <= 5 ? 3 : 5;
    extra += tier + bonusPerBounce;
  }
  return baseDamage + extra;
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.z);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  return len > 0 ? { x: v.x / len, z: v.z / len } : { x: 0, z: 0 };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, z: a.z - b.z };
}

export function scale(v: Vec2, amount: number): Vec2 {
  return { x: v.x * amount, z: v.z * amount };
}

export function clampToArena(position: Vec2, radius: number): Vec2 {
  return {
    x: Math.max(-ARENA.halfWidth + radius, Math.min(ARENA.halfWidth - radius, position.x)),
    z: Math.max(-ARENA.halfDepth + radius, Math.min(ARENA.halfDepth - radius, position.z)),
  };
}

export function bounceInArena(position: Vec2, velocity: Vec2, radius: number): { position: Vec2; velocity: Vec2; bounced: boolean } {
  const nextPosition = { ...position };
  const nextVelocity = { ...velocity };
  let bounced = false;

  if (nextPosition.x < -ARENA.halfWidth + radius) {
    nextPosition.x = -ARENA.halfWidth + radius;
    nextVelocity.x = Math.abs(nextVelocity.x);
    bounced = true;
  } else if (nextPosition.x > ARENA.halfWidth - radius) {
    nextPosition.x = ARENA.halfWidth - radius;
    nextVelocity.x = -Math.abs(nextVelocity.x);
    bounced = true;
  }

  if (nextPosition.z < -ARENA.halfDepth + radius) {
    nextPosition.z = -ARENA.halfDepth + radius;
    nextVelocity.z = Math.abs(nextVelocity.z);
    bounced = true;
  } else if (nextPosition.z > ARENA.halfDepth - radius) {
    nextPosition.z = ARENA.halfDepth - radius;
    nextVelocity.z = -Math.abs(nextVelocity.z);
    bounced = true;
  }

  return { position: nextPosition, velocity: nextVelocity, bounced };
}

export function bounceCircleFromObstacle(
  position: Vec2,
  velocity: Vec2,
  radius: number,
  obstacle: Obstacle,
): { position: Vec2; velocity: Vec2; bounced: boolean } {
  const minX = obstacle.position.x - obstacle.halfSize.x;
  const maxX = obstacle.position.x + obstacle.halfSize.x;
  const minZ = obstacle.position.z - obstacle.halfSize.z;
  const maxZ = obstacle.position.z + obstacle.halfSize.z;
  const closestX = Math.max(minX, Math.min(maxX, position.x));
  const closestZ = Math.max(minZ, Math.min(maxZ, position.z));
  const delta = { x: position.x - closestX, z: position.z - closestZ };
  const dist = length(delta);

  if (dist > radius) {
    return { position, velocity, bounced: false };
  }

  if (dist > 0.0001) {
    const normal = { x: delta.x / dist, z: delta.z / dist };
    const dot = velocity.x * normal.x + velocity.z * normal.z;
    return {
      position: add(position, scale(normal, radius - dist + 0.01)),
      velocity: { x: velocity.x - 2 * dot * normal.x, z: velocity.z - 2 * dot * normal.z },
      bounced: true,
    };
  }

  const overlapX = Math.min(Math.abs(position.x - minX), Math.abs(maxX - position.x));
  const overlapZ = Math.min(Math.abs(position.z - minZ), Math.abs(maxZ - position.z));
  if (overlapX < overlapZ) {
    const normalX = position.x < obstacle.position.x ? -1 : 1;
    return {
      position: { x: position.x + normalX * (radius + overlapX + 0.01), z: position.z },
      velocity: { x: Math.abs(velocity.x) * normalX, z: velocity.z },
      bounced: true,
    };
  }

  const normalZ = position.z < obstacle.position.z ? -1 : 1;
  return {
    position: { x: position.x, z: position.z + normalZ * (radius + overlapZ + 0.01) },
    velocity: { x: velocity.x, z: Math.abs(velocity.z) * normalZ },
    bounced: true,
  };
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

/**
 * 弹珠辅助瞄准：若最近目标在 homingAngle（度）锥角内，将速度方向小幅偏转朝向目标。
 * 返回新速度（大小不变），若无需偏转则返回原速度。
 */
export function applyHoming(velocity: Vec2, marblePos: Vec2, targets: ReadonlyArray<{ position: Vec2 }>, homingAngleDeg: number): Vec2 {
  if (homingAngleDeg <= 0 || targets.length === 0) {
    return velocity;
  }
  const speed = length(velocity);
  if (speed < 0.0001) {
    return velocity;
  }
  const dir = { x: velocity.x / speed, z: velocity.z / speed };
  const cosThreshold = Math.cos((homingAngleDeg * Math.PI) / 180);

  let bestTarget: { position: Vec2 } | null = null;
  let bestDist = Infinity;
  for (const target of targets) {
    const toTarget = sub(target.position, marblePos);
    const dist = length(toTarget);
    if (dist < 0.0001) {
      continue;
    }
    const toDir = { x: toTarget.x / dist, z: toTarget.z / dist };
    const dot = dir.x * toDir.x + dir.z * toDir.z;
    if (dot >= cosThreshold && dist < bestDist) {
      bestDist = dist;
      bestTarget = target;
    }
  }

  if (!bestTarget) {
    return velocity;
  }

  const toTarget = normalize(sub(bestTarget.position, marblePos));
  // 每帧最多偏转 2°，保证手感平滑
  const maxTurn = (2 * Math.PI) / 180;
  const blendedX = dir.x + toTarget.x * Math.tan(maxTurn);
  const blendedZ = dir.z + toTarget.z * Math.tan(maxTurn);
  const blendedLen = Math.hypot(blendedX, blendedZ);
  return { x: (blendedX / blendedLen) * speed, z: (blendedZ / blendedLen) * speed };
}

export function makeTrajectory(origin: Vec2, direction: Vec2, bounces: number, obstacles: readonly Obstacle[] = [], step = 0.2, marbleRadius = 0.18): Vec2[] {
  const points: Vec2[] = [{ ...origin }];
  let position = { ...origin };
  let velocity = scale(normalize(direction), step);
  let bounceCount = 0;
  let safety = 0;

  while (bounceCount <= bounces && safety < 240) {
    safety += 1;
    position = add(position, velocity);
    let bounced = bounceInArena(position, velocity, marbleRadius);
    position = bounced.position;
    velocity = bounced.velocity;
    for (const obstacle of obstacles) {
      const obstacleBounce = bounceCircleFromObstacle(position, velocity, marbleRadius, obstacle);
      if (obstacleBounce.bounced) {
        bounced = obstacleBounce;
        position = obstacleBounce.position;
        velocity = obstacleBounce.velocity;
        break;
      }
    }
    points.push({ ...position });
    if (bounced.bounced) {
      bounceCount += 1;
    }
  }

  return points;
}
