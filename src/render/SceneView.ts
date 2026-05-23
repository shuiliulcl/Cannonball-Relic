import * as THREE from "three";
import { ARENA, CAMERA, OBSTACLES } from "../game/config";
import type { Marble, Monster, Obstacle, Player, Vec2 } from "../game/types";
import type { FloorMaterial, ObstacleMaterial, RuntimeLevel } from "../levels/types";
import { makeBox, makeCylinder, makeToonMaterial } from "./factories";
import { Effects } from "./effects";
import { preparePixelTexture, resolveSkinAssets } from "./skin";

export class SceneView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly skin = resolveSkinAssets();
  private readonly playerMesh = makeCylinder(0.34, 0.65, 0x346c86);
  private readonly playerSprite = this.createSprite(this.skin.player, 1.25, 1.1);
  private readonly marbleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x9de7ff, emissive: 0x55d4ff, emissiveIntensity: 1.1 }),
  );
  private readonly marbleSprite = this.createSprite(this.skin.marble, 0.58, 0.58);
  private readonly monsterMeshes = new Map<number, THREE.Group>();
  private readonly obstacleMeshes = new Map<string, THREE.Group>();
  private readonly trajectoryGroup = new THREE.Group();
  private readonly trajectoryPulseItems: Array<{ mesh: THREE.Mesh; baseScale: number; phase: number }> = [];
  private trajectoryPulseTime = 0;
  private readonly effects: Effects;

  constructor(
    private readonly root: HTMLElement,
    initialObstacles: readonly Obstacle[] = OBSTACLES,
    private readonly runtimeLevel?: RuntimeLevel,
  ) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x171720);
    this.renderer.shadowMap.enabled = true;
    root.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x171720);
    this.effects = new Effects(this.scene);

    this.trajectoryGroup.visible = false;
    this.scene.add(this.trajectoryGroup);

    this.setupCamera();
    this.setupLights();
    this.buildArena();
    this.applyLevelFloors();
    this.setObstacles(initialObstacles);

    this.playerMesh.position.y = 0.34;
    this.playerMesh.visible = false;
    this.scene.add(this.playerMesh);
    this.scene.add(this.playerSprite);

    this.marbleMesh.position.y = 0.28;
    this.marbleMesh.scale.setScalar(0.55);
    this.scene.add(this.marbleMesh);
    this.scene.add(this.marbleSprite);

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  updateEffects(dt: number): void {
    this.effects.update(dt);
    this.updateTrajectoryPulse(dt);
  }

  syncPlayer(player: Player): void {
    this.playerMesh.position.set(player.position.x, 0.34, player.position.z);
    this.playerSprite.position.set(player.position.x, 0.9, player.position.z);
    const cannonScale = player.mode === "humanCannon" ? 1.35 : 1;
    this.playerMesh.scale.set(cannonScale, cannonScale, cannonScale);
    this.playerSprite.scale.set(1.25 * cannonScale, 1.1 * cannonScale, 1);
  }

  syncMarble(marble: Marble): void {
    const visible = marble.state !== "ready" && marble.state !== "charging";
    this.marbleMesh.visible = visible;
    this.marbleSprite.visible = visible;
    this.marbleMesh.position.set(marble.position.x, 0.28, marble.position.z);
    this.marbleSprite.position.set(marble.position.x, 0.52, marble.position.z);
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

  clearTransientObjects(): void {
    for (const mesh of this.monsterMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.monsterMeshes.clear();
    this.hideTrajectory();
  }

  showTrajectory(points: Vec2[], chargeRatio: number): void {
    this.clearTrajectoryObjects();
    if (points.length <= 1) {
      this.trajectoryGroup.visible = false;
      return;
    }

    const power = THREE.MathUtils.clamp(chargeRatio, 0, 1);
    const color = power > 0.72 ? 0xffe38a : 0x8eeaff;
    const coreColor = power > 0.72 ? 0xff9d42 : 0x55d4ff;
    const sampleStride = power > 0.7 ? 3 : 4;
    let index = 0;

    for (let i = 0; i < points.length; i += sampleStride) {
      const point = points[i];
      const size = THREE.MathUtils.lerp(0.035, 0.07, power) * (index % 2 === 0 ? 1 : 0.72);
      const dot = this.createTrajectoryOrb(size, color, 0.3 + power * 0.28);
      dot.position.set(point.x, 0.22, point.z);
      this.trajectoryGroup.add(dot);
      this.trajectoryPulseItems.push({ mesh: dot, baseScale: 1, phase: index * 0.42 });
      index += 1;
    }

    for (let i = 2; i < points.length - 2; i += 1) {
      const before = points[i - 2];
      const current = points[i];
      const after = points[i + 2];
      const a = new THREE.Vector2(current.x - before.x, current.z - before.z).normalize();
      const b = new THREE.Vector2(after.x - current.x, after.z - current.z).normalize();
      if (a.dot(b) < 0.82) {
        this.addTrajectoryRing(current, coreColor, 0.28 + power * 0.14, 0.52);
        i += 6;
      }
    }

    const end = points[points.length - 1];
    this.addTrajectoryRing(end, coreColor, 0.36 + power * 0.16, 0.75);
    const glow = this.createTrajectoryOrb(0.12 + power * 0.06, coreColor, 0.34 + power * 0.24);
    glow.position.set(end.x, 0.26, end.z);
    this.trajectoryGroup.add(glow);
    this.trajectoryPulseItems.push({ mesh: glow, baseScale: 1, phase: index * 0.42 });
    this.trajectoryGroup.visible = true;
  }

  hideTrajectory(): void {
    this.trajectoryGroup.visible = false;
    this.clearTrajectoryObjects();
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
      const group = new THREE.Group();
      group.position.set(obstacle.position.x, 0, obstacle.position.z);

      const material = obstacle.material ?? "wood";
      const mesh = makeBox(obstacle.halfSize.x * 2, 0.72, obstacle.halfSize.z * 2, 0x9a6431);
      mesh.position.y = 0.36;
      mesh.visible = false;
      group.add(mesh);

      if (material === "wood") {
        const crate = this.createSprite(this.skin.obstacleCrate, obstacle.halfSize.x * 2.2, 1.25);
        crate.position.y = 0.85;
        group.add(crate);
      } else {
        const sprite = this.createObstacleSprite(material, obstacle);
        group.add(sprite);
      }

      this.obstacleMeshes.set(obstacle.id, group);
      this.scene.add(group);
    }
  }

  setObstacles(obstacles: readonly Obstacle[]): void {
    for (const mesh of this.obstacleMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.obstacleMeshes.clear();
    this.syncObstacles(obstacles);
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
    this.camera.position.set(0, 8.2, 7.2);
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
    const floorTexture = preparePixelTexture(this.textureLoader.load(this.skin.floor));
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(5, 4);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.halfWidth * 2, ARENA.halfDepth * 2),
      new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.04;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const backWall = this.createTexturedBox(ARENA.halfWidth * 2 + 1, ARENA.wallHeight, 0.35, this.skin.wallBorder, 4, 1);
    backWall.position.set(0, ARENA.wallHeight / 2, -ARENA.halfDepth - 0.2);
    this.scene.add(backWall);

    const frontWall = backWall.clone();
    frontWall.position.z = ARENA.halfDepth + 0.2;
    this.scene.add(frontWall);

    const leftWall = this.createTexturedBox(0.35, ARENA.wallHeight, ARENA.halfDepth * 2 + 1, this.skin.wallBorder, 1, 4);
    leftWall.position.set(-ARENA.halfWidth - 0.2, ARENA.wallHeight / 2, 0);
    this.scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = ARENA.halfWidth + 0.2;
    this.scene.add(rightWall);

    for (const x of [-ARENA.halfWidth - 0.45, ARENA.halfWidth + 0.45]) {
      for (const z of [-4, 0, 4]) {
        const pillar = this.createSprite(this.skin.pillar, 1.0, 1.9);
        pillar.position.set(x, 1.05, z);
        this.scene.add(pillar);
      }
    }

    for (const x of [-7.3, 7.3]) {
      for (const z of [-5.15, 5.15]) {
        const brazier = this.createSprite(this.skin.brazier, 0.46, 0.62);
        brazier.position.set(x, 0.43, z);
        this.scene.add(brazier);
      }
    }
  }

  private applyLevelFloors(): void {
    if (!this.runtimeLevel) {
      return;
    }
    const { grid, floors } = this.runtimeLevel;
    const cellSize = grid.cellSize || 1;
    const originX = -ARENA.halfWidth + cellSize / 2;
    const originZ = -ARENA.halfDepth + cellSize / 2;
    const materials = new Map<FloorMaterial, THREE.MeshBasicMaterial>();
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const materialName = floors[y * grid.width + x] ?? "sandstone";
        if (materialName === "sandstone") {
          continue;
        }
        let material = materials.get(materialName);
        if (!material) {
          const texture = preparePixelTexture(this.textureLoader.load(this.floorTexturePath(materialName)));
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);
          material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          materials.set(materialName, material);
        }
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(cellSize, cellSize), material);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(originX + x * cellSize, -0.018, originZ + y * cellSize);
        this.scene.add(tile);
      }
    }
  }

  private createMonsterMesh(): THREE.Group {
    const group = new THREE.Group();
    const shadow = makeCylinder(0.38, 0.04, 0x2a1b16);
    shadow.position.y = 0.03;
    shadow.scale.z = 0.72;
    const sprite = this.createSprite(this.skin.enemyGrunt, 1.08, 1.35);
    sprite.position.y = 0.92;
    group.add(shadow, sprite);
    return group;
  }

  private createSprite(path: string, width: number, height: number): THREE.Sprite {
    const texture = preparePixelTexture(this.textureLoader.load(path));
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, height, 1);
    return sprite;
  }

  private createTexturedBox(width: number, height: number, depth: number, path: string, repeatX: number, repeatY: number): THREE.Mesh {
    const texture = preparePixelTexture(this.textureLoader.load(path));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createObstacleSprite(material: ObstacleMaterial, obstacle: Obstacle): THREE.Sprite {
    if (material === "stone") {
      const stone = this.createSprite(this.skin.obstacleStone, obstacle.halfSize.x * 2.05, 1.35);
      stone.position.y = 0.86;
      return stone;
    }
    const metal = this.createSprite(this.skin.obstacleMetal, obstacle.halfSize.x * 2.45, 1.18);
    metal.position.y = 0.78;
    return metal;
  }

  private floorTexturePath(material: FloorMaterial): string {
    if (material === "cracked") {
      return this.skin.floorCracked;
    }
    if (material === "moss") {
      return this.skin.floorMoss;
    }
    if (material === "danger") {
      return this.skin.floorDanger;
    }
    return this.skin.floor;
  }

  private createTrajectoryOrb(radius: number, color: number, opacity: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    return mesh;
  }

  private addTrajectoryRing(point: Vec2, color: number, radius: number, opacity: number): void {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018, 8, 32),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(point.x, 0.09, point.z);
    this.trajectoryGroup.add(ring);
    this.trajectoryPulseItems.push({ mesh: ring, baseScale: 1, phase: this.trajectoryPulseItems.length * 0.5 });
  }

  private updateTrajectoryPulse(dt: number): void {
    if (!this.trajectoryGroup.visible) {
      return;
    }
    this.trajectoryPulseTime += dt * 5.5;
    for (const item of this.trajectoryPulseItems) {
      const pulse = 1 + Math.sin(this.trajectoryPulseTime - item.phase) * 0.13;
      item.mesh.scale.setScalar(item.baseScale * pulse);
      const material = item.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = Math.max(0.18, material.opacity);
      }
    }
  }

  private clearTrajectoryObjects(): void {
    for (const item of this.trajectoryPulseItems) {
      this.trajectoryGroup.remove(item.mesh);
      item.mesh.geometry.dispose();
      if (item.mesh.material instanceof THREE.Material) {
        item.mesh.material.dispose();
      }
    }
    this.trajectoryPulseItems.length = 0;
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
