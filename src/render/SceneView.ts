import * as THREE from "three";
import { ARENA, CAMERA, OBSTACLES } from "../game/config";
import type { Marble, Monster, Obstacle, Player, Vec2 } from "../game/types";
import { makeBox, makeCylinder, makeToonMaterial } from "./factories";
import { Effects } from "./effects";

export class SceneView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly playerMesh = makeCylinder(0.34, 0.65, 0x346c86);
  private readonly marbleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x9de7ff, emissive: 0x55d4ff, emissiveIntensity: 1.1 }),
  );
  private readonly monsterMeshes = new Map<number, THREE.Group>();
  private readonly obstacleMeshes = new Map<string, THREE.Mesh>();
  private readonly trajectoryLine: THREE.Line;
  private readonly effects: Effects;

  constructor(private readonly root: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x171720);
    this.renderer.shadowMap.enabled = true;
    root.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x171720);
    this.effects = new Effects(this.scene);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x9de7ff, transparent: true, opacity: 0.7 });
    this.trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(this.trajectoryLine);

    this.setupCamera();
    this.setupLights();
    this.buildArena();
    this.syncObstacles(OBSTACLES);

    this.playerMesh.position.y = 0.34;
    this.scene.add(this.playerMesh);

    this.marbleMesh.position.y = 0.28;
    this.scene.add(this.marbleMesh);

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  updateEffects(dt: number): void {
    this.effects.update(dt);
  }

  syncPlayer(player: Player): void {
    this.playerMesh.position.set(player.position.x, 0.34, player.position.z);
    const cannonScale = player.mode === "humanCannon" ? 1.35 : 1;
    this.playerMesh.scale.set(cannonScale, cannonScale, cannonScale);
  }

  syncMarble(marble: Marble): void {
    this.marbleMesh.visible = marble.state !== "ready" && marble.state !== "charging";
    this.marbleMesh.position.set(marble.position.x, 0.28, marble.position.z);
  }

  syncMonsters(monsters: Monster[]): void {
    const aliveIds = new Set(monsters.map((monster) => monster.id));
    for (const [id, mesh] of this.monsterMeshes) {
      if (!aliveIds.has(id)) {
        this.scene.remove(mesh);
        this.monsterMeshes.delete(id);
      }
    }

    for (const monster of monsters) {
      let group = this.monsterMeshes.get(monster.id);
      if (!group) {
        group = this.createMonsterMesh();
        this.monsterMeshes.set(monster.id, group);
        this.scene.add(group);
      }
      group.position.set(monster.position.x, 0, monster.position.z);
      const healthScale = Math.max(0.35, monster.hp / monster.maxHp);
      group.scale.setScalar(0.85 + healthScale * 0.25);
    }
  }

  showTrajectory(points: Vec2[]): void {
    const vertices = points.map((point) => new THREE.Vector3(point.x, 0.16, point.z));
    this.trajectoryLine.geometry.dispose();
    this.trajectoryLine.geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    this.trajectoryLine.visible = points.length > 1;
  }

  hideTrajectory(): void {
    this.trajectoryLine.visible = false;
  }

  damageText(text: string, position: Vec2): void {
    this.effects.damageText(text, position);
  }

  spark(position: Vec2, color?: number, count?: number): void {
    this.effects.spark(position, color, count);
  }

  syncObstacles(obstacles: readonly Obstacle[]): void {
    for (const obstacle of obstacles) {
      if (this.obstacleMeshes.has(obstacle.id)) {
        continue;
      }
      const mesh = makeBox(obstacle.halfSize.x * 2, 0.72, obstacle.halfSize.z * 2, 0x9a6431);
      mesh.position.set(obstacle.position.x, 0.36, obstacle.position.z);
      this.obstacleMeshes.set(obstacle.id, mesh);
      this.scene.add(mesh);

      const cap = makeBox(obstacle.halfSize.x * 2 + 0.08, 0.08, obstacle.halfSize.z * 2 + 0.08, 0xd4a15a);
      cap.position.set(obstacle.position.x, 0.76, obstacle.position.z);
      this.scene.add(cap);
    }
  }

  pointerToPlane(pointer: THREE.Vector2): Vec2 {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);
    return { x: hit.x, z: hit.z };
  }

  private setupCamera(): void {
    this.camera.position.set(0, 9.5, 8.5);
    this.camera.lookAt(0, 0, 0);
    this.camera.near = 0.1;
    this.camera.far = 100;
  }

  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(0xf3e8ff, 0x33231d, 2.2);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff0cf, 2.3);
    key.position.set(-4, 8, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
  }

  private buildArena(): void {
    const floorGroup = new THREE.Group();
    const tileSize = 1;
    for (let x = -ARENA.halfWidth; x < ARENA.halfWidth; x += tileSize) {
      for (let z = -ARENA.halfDepth; z < ARENA.halfDepth; z += tileSize) {
        const isDark = (Math.round(x + ARENA.halfWidth) + Math.round(z + ARENA.halfDepth)) % 2 === 0;
        const tile = makeBox(tileSize, 0.08, tileSize, isDark ? 0x687085 : 0xaab0c4);
        tile.position.set(x + tileSize / 2, -0.04, z + tileSize / 2);
        floorGroup.add(tile);
      }
    }
    this.scene.add(floorGroup);

    const wallMaterial = makeToonMaterial(0x4f5368);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfWidth * 2 + 1, ARENA.wallHeight, 0.35), wallMaterial);
    backWall.position.set(0, ARENA.wallHeight / 2, -ARENA.halfDepth - 0.2);
    this.scene.add(backWall);

    const frontWall = backWall.clone();
    frontWall.position.z = ARENA.halfDepth + 0.2;
    this.scene.add(frontWall);

    const sideWallGeometry = new THREE.BoxGeometry(0.35, ARENA.wallHeight, ARENA.halfDepth * 2 + 1);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-ARENA.halfWidth - 0.2, ARENA.wallHeight / 2, 0);
    this.scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = ARENA.halfWidth + 0.2;
    this.scene.add(rightWall);

    for (const x of [-ARENA.halfWidth - 0.45, ARENA.halfWidth + 0.45]) {
      for (const z of [-4, 0, 4]) {
        const pillar = makeCylinder(0.34, 2.3, 0x64687b);
        pillar.position.set(x, 1.15, z);
        this.scene.add(pillar);
      }
    }

    for (const x of [-7.2, 7.2]) {
      for (const z of [-5.1, 5.1]) {
        const brazier = makeCylinder(0.22, 0.42, 0x5b351e);
        brazier.position.set(x, 0.22, z);
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 8),
          new THREE.MeshStandardMaterial({ color: 0xffa23a, emissive: 0xff6a00, emissiveIntensity: 1.6 }),
        );
        flame.position.set(x, 0.6, z);
        this.scene.add(brazier, flame);
      }
    }
  }

  private createMonsterMesh(): THREE.Group {
    const group = new THREE.Group();
    const body = makeCylinder(0.36, 0.7, 0xc47a34);
    body.position.y = 0.36;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 12), makeToonMaterial(0xf2d6a2));
    head.position.y = 0.9;
    const hat = makeCylinder(0.25, 0.18, 0x26212b);
    hat.position.y = 1.14;
    group.add(body, head, hat);
    return group;
  }

  private resize(): void {
    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const aspect = width / height;
    this.camera.left = -CAMERA.size * aspect;
    this.camera.right = CAMERA.size * aspect;
    this.camera.top = CAMERA.size;
    this.camera.bottom = -CAMERA.size;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
