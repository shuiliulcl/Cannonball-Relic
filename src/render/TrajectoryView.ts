import * as THREE from "three";
import type { Vec2 } from "../game/types";

// 对象池上限：绝大多数情况下不超过这些数量
const POOL_ORBS = 80;
const POOL_RINGS = 12;

type PulseItem = { mesh: THREE.Mesh; baseScale: number; phase: number; active: boolean };

function makeOrbMesh(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

function makeRingMesh(): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.018, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  return ring;
}

export class TrajectoryView {
  readonly group = new THREE.Group();
  private readonly orbPool: PulseItem[];
  private readonly ringPool: PulseItem[];
  private pulseTime = 0;

  constructor(scene: THREE.Scene) {
    this.group.visible = false;
    scene.add(this.group);

    this.orbPool = Array.from({ length: POOL_ORBS }, () => {
      const mesh = makeOrbMesh();
      this.group.add(mesh);
      return { mesh, baseScale: 1, phase: 0, active: false };
    });

    this.ringPool = Array.from({ length: POOL_RINGS }, () => {
      const mesh = makeRingMesh();
      this.group.add(mesh);
      return { mesh, baseScale: 1, phase: 0, active: false };
    });
  }

  show(points: Vec2[], chargeRatio: number): void {
    this.deactivateAll();
    if (points.length <= 1) {
      this.group.visible = false;
      return;
    }

    const power = THREE.MathUtils.clamp(chargeRatio, 0, 1);
    const startColor = new THREE.Color(power > 0.72 ? 0xffe38a : 0x8eeaff);
    const bounceColor = new THREE.Color(0xff4242);
    const colorForBounce = (bounceIndex: number) => startColor.clone().lerp(bounceColor, Math.min(0.85, bounceIndex * 0.22)).getHex();
    const sampleStride = power > 0.7 ? 3 : 4;
    let orbIdx = 0;
    let ringIdx = 0;
    let index = 0;
    let bounceIndex = 0;

    for (let i = 0; i < points.length && orbIdx < POOL_ORBS; i += sampleStride) {
      bounceIndex = this.estimateBounceIndex(points, i);
      const point = points[i];
      const size = THREE.MathUtils.lerp(0.035, 0.07, power) * (index % 2 === 0 ? 1 : 0.72);
      const item = this.orbPool[orbIdx++];
      const mat = item.mesh.material as THREE.MeshBasicMaterial;
      item.mesh.scale.setScalar(size / 0.07);
      mat.color.setHex(colorForBounce(bounceIndex));
      mat.opacity = 0.3 + power * 0.28;
      item.mesh.position.set(point.x, 0.22, point.z);
      item.baseScale = size / 0.07;
      item.phase = index * 0.42;
      item.active = true;
      index += 1;
    }

    for (let i = 2; i < points.length - 2 && ringIdx < POOL_RINGS - 1; i += 1) {
      const before = points[i - 2];
      const current = points[i];
      const after = points[i + 2];
      const a = new THREE.Vector2(current.x - before.x, current.z - before.z).normalize();
      const b = new THREE.Vector2(after.x - current.x, after.z - current.z).normalize();
      if (a.dot(b) < 0.82) {
        const ringColor = colorForBounce(this.estimateBounceIndex(points, i) + 1);
        this.activateRing(ringIdx++, current, ringColor, 0.28 + power * 0.14, 0.52);
        i += 6;
      }
    }

    // 终点 ring + glow orb
    const end = points[points.length - 1];
    const endColor = colorForBounce(this.estimateBounceIndex(points, points.length - 1));
    if (ringIdx < POOL_RINGS) {
      this.activateRing(ringIdx++, end, endColor, 0.36 + power * 0.16, 0.75);
    }
    if (orbIdx < POOL_ORBS) {
      const glowSize = 0.12 + power * 0.06;
      const item = this.orbPool[orbIdx++];
      const mat = item.mesh.material as THREE.MeshBasicMaterial;
      item.mesh.scale.setScalar(glowSize / 0.07);
      mat.color.setHex(endColor);
      mat.opacity = 0.34 + power * 0.24;
      item.mesh.position.set(end.x, 0.26, end.z);
      item.baseScale = glowSize / 0.07;
      item.phase = index * 0.42;
      item.active = true;
    }

    this.group.visible = true;
  }

  hide(): void {
    this.group.visible = false;
    this.deactivateAll();
  }

  update(dt: number): void {
    if (!this.group.visible) {
      return;
    }
    this.pulseTime += dt * 5.5;
    for (const item of this.orbPool) {
      if (!item.active) {
        continue;
      }
      const pulse = 1 + Math.sin(this.pulseTime - item.phase) * 0.13;
      item.mesh.scale.setScalar(item.baseScale * pulse);
    }
    for (const item of this.ringPool) {
      if (!item.active) {
        continue;
      }
      const pulse = 1 + Math.sin(this.pulseTime - item.phase) * 0.13;
      item.mesh.scale.set(item.baseScale * pulse, item.baseScale * pulse, 1);
    }
  }

  private activateRing(idx: number, point: Vec2, color: number, radius: number, opacity: number): void {
    const item = this.ringPool[idx];
    const mat = item.mesh.material as THREE.MeshBasicMaterial;
    item.mesh.scale.setScalar(radius / 0.36);
    mat.color.setHex(color);
    mat.opacity = opacity;
    item.mesh.position.set(point.x, 0.09, point.z);
    item.baseScale = radius / 0.36;
    item.phase = idx * 0.5;
    item.active = true;
  }

  private estimateBounceIndex(points: Vec2[], endIndex: number): number {
    let bounces = 0;
    for (let i = 2; i <= endIndex && i < points.length - 2; i += 1) {
      const before = points[i - 2];
      const current = points[i];
      const after = points[i + 2];
      const a = new THREE.Vector2(current.x - before.x, current.z - before.z).normalize();
      const b = new THREE.Vector2(after.x - current.x, after.z - current.z).normalize();
      if (a.dot(b) < 0.82) {
        bounces += 1;
        i += 6;
      }
    }
    return bounces;
  }

  private deactivateAll(): void {
    for (const item of this.orbPool) {
      if (item.active) {
        (item.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        item.active = false;
      }
    }
    for (const item of this.ringPool) {
      if (item.active) {
        (item.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        item.active = false;
      }
    }
  }
}
