import * as THREE from "three";
import type { Vec2 } from "../game/types";

type FloatingText = {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
};

type Spark = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
};

export class Effects {
  private readonly group = new THREE.Group();
  private readonly texts: FloatingText[] = [];
  private readonly sparks: Spark[] = [];

  constructor(private readonly scene: THREE.Scene) {
    scene.add(this.group);
  }

  damageText(text: string, position: Vec2, color = "#fff2c0"): void {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.font = "800 34px Arial";
    ctx.textAlign = "center";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#4c2019";
    ctx.strokeText(text, 64, 42);
    ctx.fillStyle = color;
    ctx.fillText(text, 64, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position.x, 1.25, position.z);
    sprite.scale.set(1.15, 0.58, 1);
    this.group.add(sprite);
    this.texts.push({ sprite, velocity: new THREE.Vector3(0, 1.2, 0), life: 0.75 });
  }

  update(dt: number): void {
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const item = this.texts[i];
      item.life -= dt;
      item.sprite.position.addScaledVector(item.velocity, dt);
      item.sprite.material.opacity = Math.max(0, item.life / 0.75);
      if (item.life <= 0) {
        this.group.remove(item.sprite);
        item.sprite.material.map?.dispose();
        item.sprite.material.dispose();
        this.texts.splice(i, 1);
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
        spark.mesh.geometry.dispose();
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
        new THREE.SphereGeometry(0.045, 8, 6),
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
