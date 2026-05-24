import * as THREE from "three";
import { ARENA, CAMERA, OBSTACLES } from "../game/config";
import type { EnemyProjectile, Marble, Monster, MonsterType, Obstacle, Player, Vec2 } from "../game/types";
import type { FloorMaterial, ObstacleMaterial, RuntimeLevel } from "../levels/types";
import { makeBox, makeCylinder, makeToonMaterial } from "./factories";
import { Effects } from "./effects";
import { TrajectoryView } from "./TrajectoryView";
import { preparePixelTexture, resolveSkinAssets } from "./skin";

type ViewMode = "2d" | "2.5d";

function resolveViewMode(): ViewMode {
  const value = new URLSearchParams(window.location.search).get("view");
  return value === "2.5d" ? "2.5d" : "2d";
}

export class SceneView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly skin = resolveSkinAssets();
  private readonly viewMode = resolveViewMode();
  private readonly playerMesh = makeCylinder(0.34, 0.65, 0x346c86);
  private readonly playerSprite = this.createSprite(this.skin.player, 1.25, 1.1);
  private readonly marbleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x9de7ff, emissive: 0x55d4ff, emissiveIntensity: 1.1 }),
  );
  private readonly marbleSprite = this.createSprite(this.skin.marble, 0.58, 0.58);
  private readonly auxiliaryMarbleMeshes = new Map<string, THREE.Sprite>();
  private readonly enemyProjectileMeshes = new Map<number, THREE.Sprite>();
  private readonly monsterMeshes = new Map<number, THREE.Group>();
  private readonly obstacleMeshes = new Map<string, THREE.Group>();
  private readonly interactableMeshes = new Map<string, THREE.Group>();
  private readonly trajectory: TrajectoryView;
  private readonly effects: Effects;
  private readonly _raycaster = new THREE.Raycaster();
  private readonly _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly _planeHit = new THREE.Vector3();

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
    this.trajectory = new TrajectoryView(this.scene);

    this.setupCamera();
    this.setupLights();
    if (this.viewMode === "2d") {
      this.buildTopDownArena();
    } else {
      this.buildArena();
    }
    this.applyLevelFloors();
    this.setObstacles(initialObstacles);
    this.setInteractables(this.runtimeLevel?.interactables ?? []);

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
    this.trajectory.update(dt);
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

  syncAuxiliaryMarbles(marbles: Marble[]): void {
    const liveIds = new Set(marbles.map((marble) => marble.id));
    for (const [id, mesh] of this.auxiliaryMarbleMeshes) {
      if (!liveIds.has(id)) {
        this.scene.remove(mesh);
        this.auxiliaryMarbleMeshes.delete(id);
      }
    }

    for (const marble of marbles) {
      let sprite = this.auxiliaryMarbleMeshes.get(marble.id);
      if (!sprite) {
        sprite = this.createSprite(this.skin.marble, 0.48, 0.48);
        (sprite.material as THREE.SpriteMaterial).color.setHex(0xb8f4ff);
        this.auxiliaryMarbleMeshes.set(marble.id, sprite);
        this.scene.add(sprite);
      }
      sprite.position.set(marble.position.x, 0.52, marble.position.z);
    }
  }

  syncEnemyProjectiles(projectiles: EnemyProjectile[]): void {
    const liveIds = new Set(projectiles.map((projectile) => projectile.id));
    for (const [id, mesh] of this.enemyProjectileMeshes) {
      if (!liveIds.has(id)) {
        this.scene.remove(mesh);
        this.enemyProjectileMeshes.delete(id);
      }
    }

    for (const projectile of projectiles) {
      let sprite = this.enemyProjectileMeshes.get(projectile.id);
      if (!sprite) {
        sprite = this.createGlowSprite(0xffdf72, 0.32);
        this.enemyProjectileMeshes.set(projectile.id, sprite);
        this.scene.add(sprite);
      }
      sprite.position.set(projectile.position.x, 0.48, projectile.position.z);
    }
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
        group = this.createMonsterMesh(monster.monsterType);
        this.monsterMeshes.set(monster.id, group);
        this.scene.add(group);
      }
      group.position.set(monster.position.x, 0, monster.position.z);
      const healthScale = Math.max(0.35, monster.hp / monster.maxHp);
      group.scale.setScalar(0.85 + healthScale * 0.25);
      const hpFill = group.getObjectByName("hp-fill");
      if (hpFill) {
        const hpRatio = Math.max(0, monster.hp / monster.maxHp);
        hpFill.scale.x = hpRatio;
        hpFill.position.x = -0.39 * (1 - hpRatio);
      }
    }
  }

  clearTransientObjects(): void {
    for (const mesh of this.monsterMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.monsterMeshes.clear();
    for (const mesh of this.auxiliaryMarbleMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.auxiliaryMarbleMeshes.clear();
    for (const mesh of this.enemyProjectileMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.enemyProjectileMeshes.clear();
    this.hideTrajectory();
  }

  showTrajectory(points: Vec2[], chargeRatio: number): void {
    this.trajectory.show(points, chargeRatio);
  }

  hideTrajectory(): void {
    this.trajectory.hide();
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
      if (this.viewMode === "2d") {
        group.add(this.createTopDownObstacle(material, obstacle));
      } else {
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

  setInteractables(interactables: ReadonlyArray<RuntimeLevel["interactables"][number]>): void {
    for (const mesh of this.interactableMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.interactableMeshes.clear();
    for (const interactable of interactables) {
      const group = new THREE.Group();
      group.position.set(interactable.position.x, 0, interactable.position.z);
      group.add(this.createInteractableMesh(interactable.type));
      this.interactableMeshes.set(interactable.id, group);
      this.scene.add(group);
    }
  }

  pointerToPlane(pointer: THREE.Vector2): Vec2 {
    this._raycaster.setFromCamera(pointer, this.camera);
    this._raycaster.ray.intersectPlane(this._groundPlane, this._planeHit);
    return { x: this._planeHit.x, z: this._planeHit.z };
  }

  private setupCamera(): void {
    if (this.viewMode === "2d") {
      this.camera.up.set(0, 0, -1);
      this.camera.position.set(0, 12.8, 0.001);
    } else {
      this.camera.up.set(0, 1, 0);
      this.camera.position.set(0, 8.2, 7.2);
    }
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
    const hw = this.arenaHW;
    const hd = this.arenaHD;
    const floorTexture = preparePixelTexture(this.textureLoader.load(this.skin.floor));
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(5, 4);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(hw * 2, hd * 2),
      new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.04;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const backWall = this.createTexturedBox(hw * 2 + 1, ARENA.wallHeight, 0.35, this.skin.wallBorder, 4, 1);
    backWall.position.set(0, ARENA.wallHeight / 2, -hd - 0.2);
    this.scene.add(backWall);

    const frontWall = backWall.clone();
    frontWall.position.z = hd + 0.2;
    this.scene.add(frontWall);

    const leftWall = this.createTexturedBox(0.35, ARENA.wallHeight, hd * 2 + 1, this.skin.wallBorder, 1, 4);
    leftWall.position.set(-hw - 0.2, ARENA.wallHeight / 2, 0);
    this.scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = hw + 0.2;
    this.scene.add(rightWall);

    for (const x of [-hw - 0.45, hw + 0.45]) {
      for (const z of [-4, 0, 4]) {
        const pillar = this.createSprite(this.skin.pillar, 1.0, 1.9);
        pillar.position.set(x, 1.05, z);
        this.scene.add(pillar);
      }
    }

    const bx = Math.max(hw - 1.2, hw * 0.85);
    const bz = Math.max(hd - 1.1, hd * 0.82);
    for (const x of [-bx, bx]) {
      for (const z of [-bz, bz]) {
        const brazier = this.createSprite(this.skin.brazier, 0.46, 0.62);
        brazier.position.set(x, 0.43, z);
        this.scene.add(brazier);
      }
    }
  }

  private buildTopDownArena(): void {
    const hw = this.arenaHW;
    const hd = this.arenaHD;
    const floorTexture = preparePixelTexture(this.textureLoader.load(this.skin.floor));
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(9, 7);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(hw * 2, hd * 2),
      new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.04;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(
      Math.max(hw * 2, hd * 2),
      Math.max(12, Math.round(hw * 2)),
      0x7b6155,
      0x7b6155,
    );
    grid.position.y = 0.012;
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.18;
    this.scene.add(grid);

    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x55475c });
    const lipMaterial = new THREE.MeshBasicMaterial({ color: 0x2f2638 });
    const frontBackWidth = hw * 2 + 0.55;
    const sideDepth = hd * 2 + 0.55;
    const wallThickness = 0.28;

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(frontBackWidth, 0.2, wallThickness), wallMaterial);
    backWall.position.set(0, 0.08, -hd - wallThickness / 2);
    this.scene.add(backWall);

    const frontWall = backWall.clone();
    frontWall.position.z = hd + wallThickness / 2;
    this.scene.add(frontWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 0.2, sideDepth), wallMaterial);
    leftWall.position.set(-hw - wallThickness / 2, 0.08, 0);
    this.scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = hw + wallThickness / 2;
    this.scene.add(rightWall);

    const topLip = new THREE.Mesh(new THREE.BoxGeometry(frontBackWidth, 0.06, 0.08), lipMaterial);
    topLip.position.set(0, 0.16, -hd - 0.08);
    this.scene.add(topLip);

    const bottomLip = topLip.clone();
    bottomLip.position.z = hd + 0.08;
    this.scene.add(bottomLip);

    const leftLip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, sideDepth), lipMaterial);
    leftLip.position.set(-hw - 0.08, 0.16, 0);
    this.scene.add(leftLip);

    const rightLip = leftLip.clone();
    rightLip.position.x = hw + 0.08;
    this.scene.add(rightLip);
  }

  private applyLevelFloors(): void {
    if (!this.runtimeLevel) {
      return;
    }
    const { grid, floors, arenaHalfWidth, arenaHalfDepth } = this.runtimeLevel;
    const cellSize = grid.cellSize || 1;
    const originX = -arenaHalfWidth + cellSize / 2;
    const originZ = -arenaHalfDepth + cellSize / 2;
    const materials = new Map<FloorMaterial, THREE.MeshBasicMaterial>();
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const materialName = floors[y * grid.width + x] ?? "sandstone";
        if (materialName === "sandstone") {
          continue;
        }
        let material = materials.get(materialName);
        if (!material) {
          material = this.createFloorMaterial(materialName);
          materials.set(materialName, material);
        }
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(cellSize, cellSize), material);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(originX + x * cellSize, -0.018, originZ + y * cellSize);
        this.scene.add(tile);
      }
    }
  }

  private createMonsterMesh(monsterType: MonsterType = "grunt"): THREE.Group {
    const group = new THREE.Group();

    // 各类型的视觉参数
    const cfg = monsterType === "runner" || monsterType === "hound"
      ? { shadowR: 0.28, shadowColor: 0x1a1010, spriteW: 0.82, spriteH: 1.1, tint: 0xff6a6a }
      : monsterType === "boar"
      ? { shadowR: 0.44, shadowColor: 0x24100a, spriteW: 1.24, spriteH: 1.28, tint: 0xff8a3a }
      : monsterType === "octopus"
      ? { shadowR: 0.34, shadowColor: 0x101426, spriteW: 1.05, spriteH: 1.22, tint: 0x8edcff }
      : monsterType === "tank"
      ? { shadowR: 0.52, shadowColor: 0x1a1208, spriteW: 1.42, spriteH: 1.72, tint: 0x8866ff }
      : monsterType === "slime"
      ? { shadowR: 0.36, shadowColor: 0x0c2414, spriteW: 1.0, spriteH: 1.02, tint: 0x73d878 }
      : monsterType === "rabbit"
      ? { shadowR: 0.26, shadowColor: 0x16151f, spriteW: 0.78, spriteH: 1.16, tint: 0xd9f3ff }
      : monsterType === "bombBug"
      ? { shadowR: 0.32, shadowColor: 0x2a1008, spriteW: 0.92, spriteH: 1.05, tint: 0xff4f35 }
      : monsterType === "shieldCrab"
      ? { shadowR: 0.46, shadowColor: 0x111725, spriteW: 1.26, spriteH: 1.18, tint: 0x8aa4ff }
      : monsterType === "voodooFlower"
      ? { shadowR: 0.34, shadowColor: 0x1f0d26, spriteW: 0.98, spriteH: 1.36, tint: 0xd86cff }
      : monsterType === "eyeCannon"
      ? { shadowR: 0.4, shadowColor: 0x1c1210, spriteW: 1.14, spriteH: 1.32, tint: 0xffdf72 }
      : monsterType === "priest"
      ? { shadowR: 0.32, shadowColor: 0x211c10, spriteW: 0.94, spriteH: 1.28, tint: 0xfff1a6 }
      : { shadowR: 0.38, shadowColor: 0x2a1b16, spriteW: 1.08, spriteH: 1.35, tint: 0xffffff };

    const shadow = makeCylinder(cfg.shadowR, 0.04, cfg.shadowColor);
    shadow.position.y = 0.03;
    shadow.scale.z = 0.72;

    const sprite = this.createSprite(this.skin.enemyGrunt, cfg.spriteW, cfg.spriteH);
    sprite.position.y = cfg.spriteH * 0.68;

    // runner 偏红色调，tank 偏紫色调（通过颜色叠加区分）
    if (monsterType !== "grunt") {
      (sprite.material as THREE.SpriteMaterial).color.setHex(cfg.tint);
    }

    group.add(shadow, sprite);
    group.add(this.createMonsterHealthBar(cfg.spriteH));
    return group;
  }

  private createMonsterHealthBar(spriteHeight: number): THREE.Group {
    const group = new THREE.Group();
    if (this.viewMode === "2d") {
      group.position.set(0, 0.36, -spriteHeight * 0.42);
    } else {
      group.position.y = spriteHeight + 0.34;
    }

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x2a1110, side: THREE.DoubleSide }),
    );
    back.position.z = 0.01;

    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xe33b2f, side: THREE.DoubleSide }),
    );
    fill.name = "hp-fill";
    fill.position.set(0, 0, 0.02);

    if (this.viewMode === "2d") {
      back.rotation.x = -Math.PI / 2;
      fill.rotation.x = -Math.PI / 2;
      back.position.y = 0.01;
      fill.position.y = 0.02;
      fill.position.z = 0;
    }

    group.add(back, fill);
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

  private createGlowSprite(color: number, size: number): THREE.Sprite {
    const material = new THREE.SpriteMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size, size, 1);
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

  private createTopDownObstacle(material: ObstacleMaterial, obstacle: Obstacle): THREE.Group {
    const group = new THREE.Group();
    const width = obstacle.halfSize.x * 2;
    const depth = obstacle.halfSize.z * 2;
    const colors = this.topDownObstacleColors(material);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.2, depth),
      new THREE.MeshBasicMaterial({ color: colors.side }),
    );
    body.position.y = 0.1;

    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.92, depth * 0.88),
      new THREE.MeshBasicMaterial({ color: colors.top, side: THREE.DoubleSide }),
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.205;

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(width, 0.2, depth)),
      new THREE.LineBasicMaterial({ color: colors.edge }),
    );
    edges.position.y = 0.1;

    group.add(body, top, edges);
    return group;
  }

  private createInteractableMesh(type: RuntimeLevel["interactables"][number]["type"]): THREE.Object3D {
    const color = this.interactableColor(type);
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 0.16, 18),
      new THREE.MeshBasicMaterial({ color: 0x3b2c25 }),
    );
    base.position.y = 0.08;

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
    );
    marker.position.y = 0.34;

    if (this.viewMode === "2.5d" && type === "brazier") {
      const brazier = this.createSprite(this.skin.brazier, 0.5, 0.68);
      brazier.position.y = 0.48;
      group.add(brazier);
      return group;
    }

    group.add(base, marker);
    return group;
  }

  private interactableColor(type: RuntimeLevel["interactables"][number]["type"]): number {
    if (type === "brazier") {
      return 0xff7a24;
    }
    if (type === "pinball") {
      return 0x9de7ff;
    }
    if (type === "iceBall") {
      return 0x8edcff;
    }
    if (type === "alarmPost") {
      return 0xffdf72;
    }
    return 0x7ecf88;
  }

  private topDownObstacleColors(material: ObstacleMaterial): { side: number; top: number; edge: number } {
    if (material === "stone") {
      return { side: 0x7d7069, top: 0xa38f7f, edge: 0x4f4643 };
    }
    if (material === "metal") {
      return { side: 0x4f6972, top: 0x77929a, edge: 0x2d4148 };
    }
    if (material === "glass") {
      return { side: 0x6fb8d8, top: 0xb8ecff, edge: 0x3d7d98 };
    }
    if (material === "reflector") {
      return { side: 0x6d4b9d, top: 0xaa86ec, edge: 0x39275b };
    }
    if (material === "accelerator") {
      return { side: 0xa77a22, top: 0xffd36a, edge: 0x5c3d11 };
    }
    if (material === "thorns") {
      return { side: 0x5e3830, top: 0xc85e54, edge: 0x331b18 };
    }
    if (material === "oneWay") {
      return { side: 0x3b744e, top: 0x7ecf88, edge: 0x21452e };
    }
    if (material === "bomb") {
      return { side: 0x513028, top: 0xe0643a, edge: 0x231412 };
    }
    return { side: 0x8b5a2b, top: 0xc68a3c, edge: 0x5a351d };
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

  private createFloorMaterial(material: FloorMaterial): THREE.MeshBasicMaterial {
    const terrainColor = this.floorTerrainColor(material);
    if (terrainColor !== undefined) {
      return new THREE.MeshBasicMaterial({
        color: terrainColor,
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide,
      });
    }
    const texture = preparePixelTexture(this.textureLoader.load(this.floorTexturePath(material)));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
  }

  private floorTerrainColor(material: FloorMaterial): number | undefined {
    if (material === "fire") {
      return 0xff5638;
    }
    if (material === "mud") {
      return 0x6f5430;
    }
    if (material === "ice") {
      return 0x8edcff;
    }
    if (material === "blood") {
      return 0x8b1632;
    }
    return undefined;
  }

  private get arenaHW(): number {
    return this.runtimeLevel?.arenaHalfWidth ?? ARENA.halfWidth;
  }

  private get arenaHD(): number {
    return this.runtimeLevel?.arenaHalfDepth ?? ARENA.halfDepth;
  }

  private resize(): void {
    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const aspect = width / height;
    // Camera half-height covers the full arena depth with a small margin for walls.
    const camH = this.arenaHD + 0.5;
    // Also ensure full arena width is visible.
    const camW = this.arenaHW + 0.5;
    const size = Math.max(camH, camW / aspect);
    this.camera.left = -size * aspect;
    this.camera.right = size * aspect;
    this.camera.top = size;
    this.camera.bottom = -size;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
