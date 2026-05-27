import * as THREE from "three";
import type { Vec2 } from "../game/types";

const TEXT_POOL_SIZE = 16;
const TEXT_CANVAS_W = 128;
const TEXT_CANVAS_H = 64;
const TEXT_LIFETIME = 0.75;

type PooledText = {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  material: THREE.SpriteMaterial;
  velocity: THREE.Vector3;
  life: number;
  active: boolean;
};

type Spark = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
  grow: number;
};

const SHARED_SPARK_GEO = new THREE.SphereGeometry(0.045, 8, 6);
const ORBIT_CHIP_GEO = new THREE.TetrahedronGeometry(0.07, 0);
const ORBIT_MOTE_GEO = new THREE.SphereGeometry(0.035, 8, 6);
const ORBIT_PULSE_GEO = new THREE.TorusGeometry(0.28, 0.012, 8, 36);

export class Effects {
  private readonly group = new THREE.Group();
  private readonly textPool: PooledText[];
  private readonly sparks: Spark[] = [];

  constructor(private readonly scene: THREE.Object3D, private readonly skinId = "default") {
    scene.add(this.group);

    this.textPool = Array.from({ length: TEXT_POOL_SIZE }, () => {
      const canvas = document.createElement("canvas");
      canvas.width = TEXT_CANVAS_W;
      canvas.height = TEXT_CANVAS_H;
      const ctx = canvas.getContext("2d")!;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.15, 0.58, 1);
      sprite.visible = false;
      scene.add(sprite);
      return { sprite, canvas, ctx, texture, material, velocity: new THREE.Vector3(), life: 0, active: false };
    });
  }

  damageText(text: string, position: Vec2, color = "#fff2c0"): void {
    const item = this.textPool.find((t) => !t.active);
    if (!item) {
      return; // 池满时静默丢弃（高频战斗期间极少发生）
    }
    const { ctx, canvas, texture, sprite } = item;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "800 34px Arial";
    ctx.textAlign = "center";
    ctx.lineWidth = 7;
    ctx.strokeStyle = this.skinId === "toem" ? "#ffffff" : "#4c2019";
    ctx.strokeText(text, 64, 42);
    ctx.fillStyle = this.skinId === "toem" ? "#111111" : color;
    ctx.fillText(text, 64, 42);
    texture.needsUpdate = true;

    sprite.position.set(position.x, 1.25, position.z);
    sprite.material.opacity = 1;
    sprite.visible = true;
    item.velocity.set(0, 1.2, 0);
    item.life = TEXT_LIFETIME;
    item.active = true;
  }

  update(dt: number): void {
    for (const item of this.textPool) {
      if (!item.active) {
        continue;
      }
      item.life -= dt;
      item.sprite.position.addScaledVector(item.velocity, dt);
      item.sprite.material.opacity = Math.max(0, item.life / TEXT_LIFETIME);
      if (item.life <= 0) {
        item.sprite.visible = false;
        item.active = false;
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
      const spark = this.sparks[i];
      spark.life -= dt;
      spark.mesh.position.addScaledVector(spark.velocity, dt);
      spark.velocity.y -= spark.gravity * dt;
      spark.mesh.rotation.x += spark.spin.x * dt;
      spark.mesh.rotation.y += spark.spin.y * dt;
      spark.mesh.rotation.z += spark.spin.z * dt;
      if (spark.grow !== 0) {
        spark.mesh.scale.addScalar(spark.grow * dt);
      }
      const material = spark.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = Math.max(0, spark.life / spark.maxLife);
      }
      if (spark.life <= 0) {
        this.group.remove(spark.mesh);
        if (spark.mesh.material instanceof THREE.Material) {
          spark.mesh.material.dispose();
        }
        this.sparks.splice(i, 1);
      }
    }
  }

  spark(position: Vec2, color = 0xffe08a, count = 10): void {
    if (this.skinId === "orbit-ruins") {
      this.orbitRuinsSpark(position, color, count);
      return;
    }
    if (this.skinId === "toem") {
      this.toemSpark(position, count);
      return;
    }

    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(
        SHARED_SPARK_GEO,
        new THREE.MeshBasicMaterial({ color, transparent: true }),
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.2;
      mesh.position.set(position.x, 0.35, position.z);
      this.group.add(mesh);
      this.sparks.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.0 + Math.random() * 1.6, Math.sin(angle) * speed),
        spin: new THREE.Vector3(),
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        gravity: 4.5,
        grow: 0,
      });
    }
  }

  private toemSpark(position: Vec2, count: number): void {
    const burstCount = Math.min(54, Math.ceil(count * 0.95));
    for (let i = 0; i < burstCount; i += 1) {
      const ink = i % 4 === 0 ? 0x777777 : 0x111111;
      const mesh = new THREE.Mesh(
        SHARED_SPARK_GEO,
        new THREE.MeshBasicMaterial({
          color: ink,
          transparent: true,
          opacity: i % 4 === 0 ? 0.46 : 0.72,
          depthWrite: false,
        }),
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.85 + Math.random() * 1.75;
      mesh.position.set(position.x, 0.24, position.z);
      mesh.scale.setScalar(i % 5 === 0 ? 0.66 : 0.92);
      this.group.add(mesh);
      const life = 0.26 + Math.random() * 0.2;
      this.sparks.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.16 + Math.random() * 0.48, Math.sin(angle) * speed),
        spin: new THREE.Vector3(),
        life,
        maxLife: life,
        gravity: 2.2,
        grow: -0.02,
      });
    }

    const ring = new THREE.Mesh(
      ORBIT_PULSE_GEO,
      new THREE.MeshBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(position.x, 0.07, position.z);
    this.group.add(ring);
    this.sparks.push({
      mesh: ring,
      velocity: new THREE.Vector3(),
      spin: new THREE.Vector3(0, 0, 0.8),
      life: 0.24,
      maxLife: 0.24,
      gravity: 0,
      grow: 2.0,
    });
  }

  private orbitRuinsSpark(position: Vec2, color: number, count: number): void {
    const tuned = this.orbitRuinsSparkColor(color);
    const burstCount = Math.min(64, Math.ceil(count * 1.15));
    for (let i = 0; i < burstCount; i += 1) {
      const signalMote = i % 4 === 0;
      const mesh = new THREE.Mesh(
        signalMote ? ORBIT_MOTE_GEO : ORBIT_CHIP_GEO,
        new THREE.MeshBasicMaterial({
          color: signalMote ? tuned.signal : tuned.chip,
          transparent: true,
          opacity: signalMote ? 0.92 : 0.86,
          depthWrite: false,
          blending: signalMote ? THREE.AdditiveBlending : THREE.NormalBlending,
        }),
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = signalMote ? 1.0 + Math.random() * 2.4 : 0.75 + Math.random() * 2.0;
      const startY = signalMote ? 0.28 + Math.random() * 0.18 : 0.18 + Math.random() * 0.14;
      mesh.position.set(position.x, startY, position.z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(signalMote ? 0.8 + Math.random() * 1.5 : 0.75 + Math.random() * 1.25);
      this.group.add(mesh);
      const life = signalMote ? 0.42 + Math.random() * 0.24 : 0.32 + Math.random() * 0.28;
      this.sparks.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, 0.35 + Math.random() * 0.85, Math.sin(angle) * speed),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ),
        life,
        maxLife: life,
        gravity: signalMote ? 1.8 : 3.2,
        grow: signalMote ? 0.08 : -0.04,
      });
    }

    const pulseCount = Math.min(3, Math.max(1, Math.floor(count / 16)));
    for (let i = 0; i < pulseCount; i += 1) {
      const mesh = new THREE.Mesh(
        ORBIT_PULSE_GEO,
        new THREE.MeshBasicMaterial({
          color: tuned.signal,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(position.x, 0.08 + i * 0.01, position.z);
      mesh.scale.setScalar(0.32 + i * 0.18);
      this.group.add(mesh);
      const life = 0.28 + i * 0.08;
      this.sparks.push({
        mesh,
        velocity: new THREE.Vector3(),
        spin: new THREE.Vector3(0, 0, 0.7 + i * 0.25),
        life,
        maxLife: life,
        gravity: 0,
        grow: 2.25 + i * 0.35,
      });
    }
  }

  private orbitRuinsSparkColor(color: number): { chip: number; signal: number } {
    const input = new THREE.Color(color);
    const { r, g, b } = input;
    if (r > 0.75 && b > 0.55) {
      return { chip: 0x9c73d6, signal: 0xc49aff };
    }
    if (g > 0.62 && b > 0.62) {
      return { chip: 0x67c8cf, signal: 0x9ff6ff };
    }
    if (r > 0.7 && g < 0.35 && b < 0.35) {
      return { chip: 0xc66f52, signal: 0xffa071 };
    }
    if (g > 0.5 && r < 0.55) {
      return { chip: 0x79b983, signal: 0xb5f0bd };
    }
    if (r > 0.82 && g > 0.82 && b > 0.82) {
      return { chip: 0xd8b775, signal: 0xfff1b8 };
    }
    return { chip: 0xc0914f, signal: 0xffcf7a };
  }
}
