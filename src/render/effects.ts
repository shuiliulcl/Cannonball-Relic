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
  life: number;
  maxLife: number;
};

const SHARED_SPARK_GEO = new THREE.SphereGeometry(0.045, 8, 6);

export class Effects {
  private readonly group = new THREE.Group();
  private readonly textPool: PooledText[];
  private readonly sparks: Spark[] = [];

  constructor(private readonly scene: THREE.Object3D) {
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
    ctx.strokeStyle = "#4c2019";
    ctx.strokeText(text, 64, 42);
    ctx.fillStyle = color;
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
      spark.velocity.y -= 4.5 * dt;
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
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  }
}
