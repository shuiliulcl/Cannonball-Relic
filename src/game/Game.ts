import { ARENA, HUMAN_CANNON, MARBLE, MONSTER, OBSTACLES, PLAYER, RUN } from "./config";
import { draftUpgrades, findUpgrade, DEFAULT_UPGRADE_STATS } from "./upgrades";
import { add, applyHoming, bounceCircleFromObstacle, bounceInArena, calcBounceDamage, clampToArena, distance, makeTrajectory, normalize, scale, sub } from "./physics";
import type { EnemyProjectile, FloorMaterial, Marble, Monster, MonsterType, Obstacle, ObstacleBehavior, OwnedBuff, Player, UpgradeId, UpgradeStats, Vec2 } from "./types";
import type { Input } from "./input";
import type { SceneView } from "../render/SceneView";
import type { Hud } from "../ui/Hud";
import type { RuntimeInteractable, RuntimeLevel, RuntimeSpawn } from "../levels/types";

type SpawnQueueItem = RuntimeSpawn & {
  remaining: number;
  timer: number;
};

export class Game {
  private player: Player = this.createPlayer();
  private stats: UpgradeStats = DEFAULT_UPGRADE_STATS();
  private marble: Marble = this.createMarble();
  private auxiliaryMarbles: Marble[] = [];
  private monsters: Monster[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private chargeSeconds = 0;
  private running = false;
  private paused = false;
  private pausedForUpgrade = false;
  private gameOver = false;
  private score = 0;
  private wave = 1;
  private lastTime = 0;
  private rafId = 0;
  private nextMonsterId = 1;
  private nextProjectileId = 1;
  private spawnQueue: SpawnQueueItem[] = [];
  private waveSpawnTotal = 0;
  private readonly ownedUpgrades = new Map<UpgradeId, number>();
  private readonly blockedDiamondUpgrades = new Set<UpgradeId>();
  private terrainDamageTimer = 0;
  private bronzeStreakCount = 0;
  private pausedForBuffPanel = false;
  private wasPausedBeforeBuffPanel = false;
  private readonly baseObstacles: Obstacle[];
  private obstacles: Obstacle[];
  private interactables: RuntimeInteractable[];
  private readonly levelSpawns;

  constructor(
    private readonly input: Input,
    private readonly view: SceneView,
    private readonly hud: Hud,
    private readonly runtimeLevel?: RuntimeLevel,
  ) {
    this.baseObstacles = (runtimeLevel?.obstacles ?? OBSTACLES).map((obstacle) => ({
      ...obstacle,
      position: { ...obstacle.position },
      halfSize: { ...obstacle.halfSize },
    }));
    this.obstacles = this.cloneObstacles();
    this.interactables = (runtimeLevel?.interactables ?? []).map((interactable) => ({
      ...interactable,
      position: { ...interactable.position },
    }));
    this.levelSpawns = runtimeLevel?.spawns ?? [];
  }

  private get arena() {
    return {
      halfWidth: this.runtimeLevel?.arenaHalfWidth ?? ARENA.halfWidth,
      halfDepth: this.runtimeLevel?.arenaHalfDepth ?? ARENA.halfDepth,
    };
  }

  start(): void {
    this.player = this.createPlayer();
    this.marble = this.createMarble();
    this.auxiliaryMarbles = [];
    this.monsters = [];
    this.enemyProjectiles = [];
    this.spawnQueue = [];
    this.obstacles = this.cloneObstacles();
    this.view.clearTransientObjects();
    this.view.setObstacles(this.obstacles);
    this.view.setInteractables(this.interactables);
    this.score = 0;
    this.wave = 1;
    this.nextMonsterId = 1;
    this.nextProjectileId = 1;
    this.waveSpawnTotal = 0;
    this.stats = DEFAULT_UPGRADE_STATS();
    this.ownedUpgrades.clear();
    this.blockedDiamondUpgrades.clear();
    this.terrainDamageTimer = 0;
    this.bronzeStreakCount = 0;
    this.pausedForBuffPanel = false;
    this.wasPausedBeforeBuffPanel = false;
    this.spawnWave();
    this.running = true;
    this.paused = false;
    this.pausedForUpgrade = false;
    this.gameOver = false;
    this.hud.hideUpgrades();
    this.hud.hideResult();
    this.hud.hidePause();
    this.hud.hideBuffs();
    this.lastTime = performance.now();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  renderIdle(): void {
    this.spawnWave();
    this.sync();
    this.view.render();
    this.monsters = [];
    this.spawnQueue = [];
  }

  chooseUpgrade(upgradeId: UpgradeId): void {
    const upgrade = findUpgrade(upgradeId);
    if (upgrade) {
      upgrade.apply(this.stats, this.player);
      this.ownedUpgrades.set(upgrade.id, (this.ownedUpgrades.get(upgrade.id) ?? 0) + 1);
      if (upgrade.rarity === "diamond") {
        this.blockedDiamondUpgrades.add(upgrade.id);
      }
      // 连铜保底计数：选了铜卡 streak+1，金/钻 streak 归零
      if (upgrade.rarity === "bronze") {
        this.bronzeStreakCount += 1;
      } else {
        this.bronzeStreakCount = 0;
      }
    }
    if (upgradeId === "humanCannon") {
      this.activateHumanCannon();
    }

    this.wave += 1;
    this.pausedForUpgrade = false;
    this.hud.hideUpgrades();
    this.marble = this.createMarble();
    this.spawnWave();
  }

  private loop(time: number): void {
    const dt = Math.min((time - this.lastTime) / 1000, 0.033);
    this.lastTime = time;
    if (this.running && this.input.consumePausePress()) {
      this.togglePause();
    }
    if (this.running && !this.paused && !this.pausedForUpgrade) {
      this.update(dt);
    }
    this.sync();
    this.view.updateEffects(dt);
    this.view.render();
    if (this.running) {
      this.rafId = requestAnimationFrame((nextTime) => this.loop(nextTime));
    }
  }

  resume(): void {
    if (!this.running || this.gameOver || this.pausedForUpgrade || this.pausedForBuffPanel) {
      return;
    }
    this.paused = false;
    this.hud.hidePause();
    this.lastTime = performance.now();
  }

  togglePause(): void {
    if (!this.running || this.gameOver || this.pausedForUpgrade || this.pausedForBuffPanel) {
      return;
    }
    if (this.paused) {
      this.resume();
      return;
    }
    this.paused = true;
    this.cancelCharge();
    this.hud.showPause();
  }

  openBuffPanel(): void {
    if (!this.running || this.gameOver || this.pausedForUpgrade || this.pausedForBuffPanel) {
      return;
    }
    this.wasPausedBeforeBuffPanel = this.paused;
    this.paused = true;
    this.pausedForBuffPanel = true;
    this.cancelCharge();
    this.hud.showBuffs(this.ownedBuffs());
  }

  closeBuffPanel(): void {
    if (!this.pausedForBuffPanel) {
      this.hud.hideBuffs();
      return;
    }
    this.pausedForBuffPanel = false;
    this.paused = this.wasPausedBeforeBuffPanel;
    this.wasPausedBeforeBuffPanel = false;
    this.hud.hideBuffs();
    this.lastTime = performance.now();
  }

  private update(dt: number): void {
    this.updatePlayer(dt);
    this.updateMarble(dt);
    this.updateAuxiliaryMarbles(dt);
    this.updateSpawnQueue(dt);
    this.updateMonsters(dt);
    this.updateEnemyProjectiles(dt);
    this.handleHits();

    if (this.monsters.length === 0 && !this.hasPendingSpawns()) {
      if (this.wave >= RUN.maxWaves) {
        this.endRun("victory");
        return;
      }
      this.pausedForUpgrade = true;
      this.hud.showUpgrades(draftUpgrades(3, this.wave, this.blockedDiamondUpgrades, this.bronzeStreakCount));
    }
  }

  private updatePlayer(dt: number): void {
    if (this.player.mode === "humanCannon") {
      this.updateHumanCannon(dt);
      return;
    }

    const movement = this.input.movement();
    this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
    this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);
    const floor = this.floorAt(this.player.position);
    const speedMultiplier = floor === "mud" ? 0.5 : 1;

    if (this.player.rollTimer > 0) {
      this.player.position = clampToArena(add(this.player.position, scale(this.player.rollVelocity, dt)), this.player.radius, this.arena);
      this.player.rollTimer = Math.max(0, this.player.rollTimer - dt);
      this.player.invulnTimer = Math.max(this.player.invulnTimer, this.player.rollTimer);
    } else if (floor === "ice") {
      const desiredVelocity = scale(movement, (this.player.speed + this.stats.speedBonus) * speedMultiplier);
      this.player.velocity = add(scale(this.player.velocity, 0.9), scale(desiredVelocity, 0.1));
      this.player.position = clampToArena(add(this.player.position, scale(this.player.velocity, dt)), this.player.radius, this.arena);
    } else {
      this.player.velocity = scale(movement, (this.player.speed + this.stats.speedBonus) * speedMultiplier);
      const delta = scale(this.player.velocity, dt);
      this.player.position = clampToArena(add(this.player.position, delta), this.player.radius, this.arena);
    }
    this.applyPlayerTerrainEffects(dt);

    if (this.input.keys.has(" ") && this.player.dashTimer <= 0 && this.player.rollTimer <= 0 && (movement.x !== 0 || movement.z !== 0)) {
      this.player.rollTimer = PLAYER.rollDuration;
      this.player.rollDuration = PLAYER.rollDuration;
      this.player.rollVelocity = scale(movement, (PLAYER.dashDistance + this.stats.dashDistanceBonus) / PLAYER.rollDuration);
      this.player.invulnTimer = PLAYER.rollDuration;
      this.player.dashTimer = this.player.dashCooldown;
    }

    if (this.input.leftDown && this.marble.state === "ready") {
      this.marble.state = "charging";
      this.chargeSeconds = 0;
    }

    if (this.marble.state === "charging") {
      this.chargeSeconds = Math.min(MARBLE.maxChargeSeconds, this.chargeSeconds + dt);
      const direction = this.aimDirection();
      this.view.showTrajectory(makeTrajectory(this.player.position, direction, MARBLE.maxBounces + this.stats.maxBouncesBonus, this.obstacles, 0.2, MARBLE.radius + this.stats.marbleRadiusBonus, this.arena), this.chargeSeconds / MARBLE.maxChargeSeconds);
    }

    if (this.input.consumeLeftRelease() && this.marble.state === "charging") {
      const direction = this.aimDirection();
      this.marble.state = "flying";
      this.marble.position = { ...this.player.position };
      this.marble.velocity = scale(direction, MARBLE.baseSpeed * this.stats.marbleSpeedMultiplier);
      this.marble.distanceLeft = MARBLE.baseRange * this.stats.rangeMultiplier;
      this.marble.bounces = 0;
      this.marble.hitIds.clear();
      this.chargeSeconds = 0;
      this.view.hideTrajectory();
    }

    if (this.input.consumeRightPress() && (this.marble.state === "flying" || this.marble.state === "charging")) {
      this.marble.state = "recalling";
      this.view.hideTrajectory();
      this.marble.hitIds.clear();
    }
  }

  private updateMarble(dt: number): void {
    if (this.marble.state === "ready" || this.marble.state === "charging") {
      this.marble.position = { ...this.player.position };
      return;
    }

    if (this.marble.state === "recalling") {
      const toPlayer = sub(this.player.position, this.marble.position);
      if (distance(this.player.position, this.marble.position) < this.player.radius + this.marble.radius) {
        this.marble = this.createMarble();
        return;
      }
      this.marble.velocity = scale(normalize(toPlayer), MARBLE.recallSpeed * this.stats.recallSpeedMultiplier);
    }

    if (this.marble.state === "flying" && this.stats.homingAngle > 0) {
      this.marble.velocity = applyHoming(this.marble.velocity, this.marble.position, this.monsters, this.stats.homingAngle);
    }

    const step = scale(this.marble.velocity, dt);
    this.marble.position = add(this.marble.position, step);
    this.marble.distanceLeft -= Math.hypot(step.x, step.z);

    const bounce = bounceInArena(this.marble.position, this.marble.velocity, this.marble.radius, this.arena);
    this.marble.position = bounce.position;
    this.marble.velocity = bounce.velocity;
    let didBounce = bounce.bounced;

    for (const obstacle of [...this.obstacles]) {
      if (this.shouldSkipOneWayObstacle(obstacle, this.marble.velocity)) {
        continue;
      }
      const obstacleBounce = bounceCircleFromObstacle(this.marble.position, this.marble.velocity, this.marble.radius, obstacle);
      if (obstacleBounce.bounced) {
        const result = this.applyMarbleObstacleBehavior(obstacle, obstacleBounce.position, obstacleBounce.velocity);
        didBounce = result.bounced || didBounce;
        break;
      }
    }
    this.handleMarbleInteractables(this.marble);

    if (didBounce && this.marble.state === "flying") {
      this.marble.bounces += 1;
      this.marble.hitIds.clear();
      this.view.spark(this.marble.position, 0xffdf72, 12);
      if (this.marble.bounces >= MARBLE.maxBounces + this.stats.maxBouncesBonus) {
        this.marble.state = "recalling";
        this.marble.hitIds.clear();
      }
    }

    if (this.marble.distanceLeft <= 0 && this.marble.state === "flying") {
      this.marble.state = "recalling";
      this.marble.hitIds.clear();
    }
  }

  private updateAuxiliaryMarbles(dt: number): void {
    for (let i = this.auxiliaryMarbles.length - 1; i >= 0; i -= 1) {
      const marble = this.auxiliaryMarbles[i];
      const step = scale(marble.velocity, dt);
      marble.position = add(marble.position, step);
      marble.distanceLeft -= Math.hypot(step.x, step.z);

      const bounce = bounceInArena(marble.position, marble.velocity, marble.radius, this.arena);
      marble.position = bounce.position;
      marble.velocity = bounce.velocity;
      if (bounce.bounced) {
        marble.bounces += 1;
        marble.hitIds.clear();
      }
      for (const obstacle of [...this.obstacles]) {
        if (this.shouldSkipOneWayObstacle(obstacle, marble.velocity)) {
          continue;
        }
        const obstacleBounce = bounceCircleFromObstacle(marble.position, marble.velocity, marble.radius, obstacle);
        if (obstacleBounce.bounced) {
          const original = this.marble;
          this.marble = marble;
          const result = this.applyMarbleObstacleBehavior(obstacle, obstacleBounce.position, obstacleBounce.velocity);
          this.marble = original;
          if (result.bounced) {
            marble.bounces += 1;
            marble.hitIds.clear();
          }
          break;
        }
      }
      this.handleMarbleInteractables(marble);
      if (marble.distanceLeft <= 0 || marble.hp <= 0) {
        this.auxiliaryMarbles.splice(i, 1);
      }
    }
  }

  private updateMonsters(dt: number): void {
    for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
      const monster = this.monsters[i];
      monster.frozenTimer = Math.max(0, (monster.frozenTimer ?? 0) - dt);
      monster.attackCooldown = Math.max(0, (monster.attackCooldown ?? 0) - dt);
      if ((monster.frozenTimer ?? 0) > 0) {
        continue;
      }
      this.updateMonsterAiState(monster, dt);
      if (this.updateBombBugFuse(monster, i, dt)) {
        continue;
      }
      const direction = this.monsterMoveDirection(monster, dt);
      const floor = this.floorAt(monster.position);
      const speedMultiplier = floor === "mud" ? 0.5 : 1;
      const chargeMultiplier = (monster.chargeTimer ?? 0) > 0 ? 2.4 : 1;
      const jumpMultiplier = (monster.jumpTimer ?? 0) > 0 ? 3.2 : 1;
      monster.position = clampToArena(
        add(monster.position, scale(direction, monster.speed * speedMultiplier * chargeMultiplier * jumpMultiplier * dt)),
        monster.radius,
        this.arena,
      );
      this.updateMonsterAttack(monster);
      if (floor === "blood") {
        monster.hp = Math.min(monster.maxHp, monster.hp + dt);
      }
      if (
        this.player.mode === "normal" &&
        this.marble.state !== "flying" &&
        this.player.invulnTimer <= 0 &&
        distance(monster.position, this.player.position) <= monster.radius + this.player.radius
      ) {
        this.player.hp -= 1;
        this.player.invulnTimer = 1;
        this.view.damageText("-1", this.player.position);
        this.view.spark(this.player.position, 0xff4f4f, 16);
        if (this.player.hp <= 0) {
          this.endRun("defeat");
        }
      }
    }
  }

  private updateEnemyProjectiles(dt: number): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.enemyProjectiles[i];
      projectile.ttl -= dt;
      projectile.position = add(projectile.position, scale(projectile.velocity, dt));
      if (projectile.ttl <= 0) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }
      if (distance(projectile.position, this.player.position) <= projectile.radius + this.player.radius && this.player.invulnTimer <= 0) {
        this.player.hp -= projectile.damage;
        this.player.invulnTimer = 0.8;
        this.view.damageText(`-${projectile.damage}`, this.player.position);
        this.view.spark(this.player.position, 0xff4f4f, 14);
        this.enemyProjectiles.splice(i, 1);
        if (this.player.hp <= 0) {
          this.endRun("defeat");
        }
      }
    }
  }

  private updateHumanCannon(dt: number): void {
    this.player.cannonTimeLeft -= dt;
    const step = scale(this.player.velocity, dt);
    this.player.position = add(this.player.position, step);

    const bounce = bounceInArena(this.player.position, this.player.velocity, this.player.radius + HUMAN_CANNON.radiusBonus, this.arena);
    this.player.position = bounce.position;
    this.player.velocity = bounce.velocity;
    let didBounce = bounce.bounced;

    for (const obstacle of this.obstacles) {
      const obstacleBounce = bounceCircleFromObstacle(
        this.player.position,
        this.player.velocity,
        this.player.radius + HUMAN_CANNON.radiusBonus,
        obstacle,
      );
      if (obstacleBounce.bounced) {
        this.player.position = obstacleBounce.position;
        this.player.velocity = obstacleBounce.velocity;
        didBounce = true;
        break;
      }
    }

    if (didBounce) {
      this.player.cannonBounces += 1;
      this.player.cannonHitIds.clear();
      this.view.spark(this.player.position, 0xffa23a, 18);
    }

    const damage = HUMAN_CANNON.baseDamage + this.player.cannonBounces * HUMAN_CANNON.bounceBonusDamage;
    for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
      const monster = this.monsters[i];
      if (this.player.cannonHitIds.has(monster.id)) {
        continue;
      }
      if (distance(this.player.position, monster.position) <= this.player.radius + HUMAN_CANNON.radiusBonus + monster.radius) {
        monster.hp -= damage;
        this.player.cannonHitIds.add(monster.id);
        this.view.damageText(String(damage), monster.position);
        this.view.spark(monster.position, 0xffa23a, 18);
        if (monster.hp <= 0) {
          this.defeatMonster(i, 18 + this.player.cannonBounces * 8);
        }
      }
    }

    if (this.input.consumeRightPress() || this.player.cannonTimeLeft <= 0) {
      this.player.mode = "normal";
      this.player.velocity = { x: 0, z: 0 };
      this.player.cannonTimeLeft = 0;
      this.player.cannonBounces = 0;
      this.player.cannonHitIds.clear();
      this.view.spark(this.player.position, 0xffffff, 12);
    }
  }

  private handleHits(): void {
    const activeMarbles = this.activeDamageMarbles();

    if (activeMarbles.length === 0) {
      return;
    }

    for (const marble of activeMarbles) {
      const baseDamage = calcBounceDamage(marble.bounces, MARBLE.baseDamage + this.stats.baseDamageBonus, this.stats.bounceBonusDamage) + marble.bonusDamage;
      const damage = marble.state === "recalling" ? baseDamage + this.stats.recallDamageBonus : baseDamage;

      for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
        const monster = this.monsters[i];
        if (marble.hitIds.has(monster.id)) {
          continue;
        }
        if (distance(marble.position, monster.position) <= marble.radius + monster.radius) {
          const finalDamage = this.mitigatedMonsterDamage(monster, marble.position, damage);
          monster.hp -= finalDamage;
          marble.hitIds.add(monster.id);
          this.view.damageText(String(finalDamage), monster.position);
          this.view.spark(monster.position, finalDamage < damage ? 0x8edcff : 0x9de7ff, finalDamage < damage ? 20 : 14);
          if (!monster.noKnockback && monster.hp > 0) {
            const knockDir = normalize(sub(monster.position, marble.position));
            monster.position = clampToArena(add(monster.position, scale(knockDir, MARBLE.knockback)), monster.radius, this.arena);
          }
          if (monster.hp <= 0) {
            this.defeatMonster(i, 10 + marble.bounces * 5);
          }
          if (marble.state === "flying") {
            marble.hp -= 1;
            if (marble.hp <= 0 && marble === this.marble) {
              this.marble.state = "recalling";
              this.marble.hitIds.clear();
            }
          }
        }
      }
    }
  }

  private sync(): void {
    this.view.syncPlayer(this.player);
    this.view.syncMarble(this.marble);
    this.view.syncAuxiliaryMarbles(this.auxiliaryMarbles);
    this.view.syncMonsters(this.monsters);
    this.view.syncEnemyProjectiles(this.enemyProjectiles);
    this.hud.update({
      score: this.score,
      wave: this.wave,
      marbleState: this.player.mode === "humanCannon" ? "cannon" : this.marble.state,
      damageScale: calcBounceDamage(this.marble.bounces, MARBLE.baseDamage + this.stats.baseDamageBonus, this.stats.bounceBonusDamage),
      chargeRatio: this.marble.state === "charging" ? this.chargeSeconds / MARBLE.maxChargeSeconds : 0,
      hp: this.player.hp,
      maxHp: this.stats.maxHp,
      waveProgress: this.waveProgress(),
      dashCooldownRatio: this.player.dashCooldown > 0 ? 1 - this.player.dashTimer / this.player.dashCooldown : 1,
      dashCooldownText: this.player.dashTimer > 0 ? `${this.player.dashTimer.toFixed(1)}s` : "就绪",
      ownedBuffs: this.ownedBuffs(),
    });
  }

  private aimDirection(): Vec2 {
    const target = this.view.pointerToPlane(this.input.pointer);
    return normalize(sub(target, this.player.position));
  }

  private spawnWave(): void {
    const spawns = this.levelSpawns.length > 0
      ? this.levelSpawns.filter((spawn) => spawn.wave === this.wave)
      : this.defaultSpawnsForWave();

    this.waveSpawnTotal = spawns.reduce((sum, s) => sum + s.count, 0);

    for (const spawn of spawns) {
      this.spawnQueue.push({ ...spawn, remaining: spawn.count, timer: 0 });
    }
    this.updateSpawnQueue(0);
  }

  private defaultSpawnsForWave(): Array<SpawnQueueItem> {
    const count = 4 + this.wave * 2;
    const items: SpawnQueueItem[] = [];
    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      items.push({
        id: `default-${i}`,
        position: { x: -3.2 + col * 2.1, z: -3.8 - row * 0.72 },
        wave: this.wave,
        count: 1,
        monsterType: "grunt",
        interval: 0,
        remaining: 1,
        timer: 0,
      });
    }
    return items;
  }

  private updateSpawnQueue(dt: number): void {
    for (let i = this.spawnQueue.length - 1; i >= 0; i -= 1) {
      const item = this.spawnQueue[i];
      item.timer -= dt;
      while (item.remaining > 0 && item.timer <= 0) {
        this.spawnMonster(item.position, item.monsterType, item);
        item.remaining -= 1;
        item.timer += Math.max(0.05, item.interval);
      }
      if (item.remaining <= 0) {
        this.spawnQueue.splice(i, 1);
      }
    }
  }

  private spawnMonster(position: Vec2, monsterType: MonsterType, spawn?: RuntimeSpawn, overrides: Partial<Monster> = {}): void {
    const stats = this.monsterStats(monsterType);
    const hp = overrides.hp ?? stats.hp + Math.floor(this.wave / 2);
    this.monsters.push({
      id: this.nextMonsterId,
      position: { ...position },
      spawnPosition: { ...position },
      radius: stats.radius,
      hp,
      maxHp: overrides.maxHp ?? hp,
      speed: overrides.speed ?? stats.speed + this.wave * 0.06,
      monsterType,
      patrolPath: spawn?.patrolPath,
      patrolIndex: 0,
      aiState: spawn?.patrolPath?.length ? "patrol" : "alert",
      attackCooldown: monsterType === "octopus" ? 1.2 : 0,
      jumpCooldown: monsterType === "rabbit" ? 0.8 : undefined,
      splitLevel: monsterType === "slime" ? 0 : undefined,
      supportCooldown: monsterType === "voodooFlower" || monsterType === "priest" ? 1.2 : undefined,
      noKnockback: monsterType === "shieldCrab" ? true : undefined,
      aggroRange: spawn?.aggroRange ?? 15,
      disengageRange: spawn?.disengageRange ?? 25,
      ...overrides,
    });
    this.nextMonsterId += 1;
  }

  private monsterStats(monsterType: MonsterType): { radius: number; hp: number; speed: number } {
    if (monsterType === "runner") {
      return { radius: MONSTER.radius * 0.86, hp: Math.max(1, MONSTER.hp - 1), speed: MONSTER.speed * 1.45 };
    }
    if (monsterType === "hound") {
      return { radius: MONSTER.radius * 0.95, hp: MONSTER.hp, speed: MONSTER.speed * 1.55 };
    }
    if (monsterType === "boar") {
      return { radius: MONSTER.radius * 1.08, hp: MONSTER.hp + 1, speed: MONSTER.speed * 1.25 };
    }
    if (monsterType === "octopus") {
      return { radius: MONSTER.radius * 0.9, hp: MONSTER.hp, speed: 0 };
    }
    if (monsterType === "tank") {
      return { radius: MONSTER.radius * 1.18, hp: MONSTER.hp + 3, speed: MONSTER.speed * 0.72 };
    }
    if (monsterType === "slime") {
      return { radius: MONSTER.radius * 1.05, hp: MONSTER.hp + 1, speed: MONSTER.speed * 0.76 };
    }
    if (monsterType === "rabbit") {
      return { radius: MONSTER.radius * 0.82, hp: MONSTER.hp, speed: MONSTER.speed * 1.18 };
    }
    if (monsterType === "bombBug") {
      return { radius: MONSTER.radius * 0.86, hp: Math.max(2, MONSTER.hp - 1), speed: MONSTER.speed * 1.35 };
    }
    if (monsterType === "shieldCrab") {
      return { radius: MONSTER.radius * 1.08, hp: MONSTER.hp + 3, speed: MONSTER.speed * 0.62 };
    }
    if (monsterType === "voodooFlower") {
      return { radius: MONSTER.radius * 0.96, hp: MONSTER.hp + 1, speed: 0 };
    }
    if (monsterType === "eyeCannon") {
      return { radius: MONSTER.radius * 1.0, hp: MONSTER.hp + 2, speed: 0 };
    }
    if (monsterType === "priest") {
      return { radius: MONSTER.radius * 0.9, hp: MONSTER.hp + 1, speed: MONSTER.speed * 0.82 };
    }
    return { radius: MONSTER.radius, hp: MONSTER.hp, speed: MONSTER.speed };
  }

  private activeDamageMarbles(): Marble[] {
    const marbles = [...this.auxiliaryMarbles];
    if (this.marble.state === "flying" || this.marble.state === "recalling") {
      marbles.unshift(this.marble);
    }
    return marbles;
  }

  private mitigatedMonsterDamage(monster: Monster, sourcePosition: Vec2, damage: number): number {
    if (monster.monsterType !== "shieldCrab") {
      return damage;
    }
    const facing = monster.shieldFacing ?? normalize(sub(this.player.position, monster.position));
    const incomingSide = normalize(sub(sourcePosition, monster.position));
    const isShieldedHit = facing.x * incomingSide.x + facing.z * incomingSide.z > 0.2;
    if (!isShieldedHit) {
      return damage;
    }
    return Math.max(1, Math.ceil(damage * 0.35));
  }

  private updateMonsterAiState(monster: Monster, dt: number): void {
    const aggroRange = monster.aggroRange ?? 15;
    const disengageRange = monster.disengageRange ?? 25;
    const distToPlayer = distance(monster.position, this.player.position);
    if ((monster.aiState === "idle" || monster.aiState === "patrol") && distToPlayer <= aggroRange && this.hasLineOfSight(monster.position, this.player.position)) {
      monster.aiState = "alert";
    }
    if (monster.aiState === "alert" && distToPlayer > disengageRange) {
      monster.aiState = "returning";
    }
    if (monster.aiState === "returning" && monster.spawnPosition && distance(monster.position, monster.spawnPosition) < 0.2) {
      monster.aiState = monster.patrolPath?.length ? "patrol" : "idle";
    }
    if (monster.monsterType === "shieldCrab" && monster.aiState === "alert") {
      monster.shieldFacing = normalize(sub(this.player.position, monster.position));
    }
    if (monster.monsterType === "boar" && monster.aiState === "alert" && (monster.chargeTimer ?? 0) <= 0 && distToPlayer <= 7) {
      monster.chargeVelocity = scale(normalize(sub(this.player.position, monster.position)), monster.speed * 2.4);
      monster.chargeTimer = 0.75;
      monster.aiState = "alert";
      this.view.spark(monster.position, 0xffa23a, 12);
    }
    if (monster.monsterType === "rabbit") {
      monster.jumpCooldown = Math.max(0, (monster.jumpCooldown ?? 0) - dt);
      monster.jumpTimer = Math.max(0, (monster.jumpTimer ?? 0) - dt);
      if (monster.aiState === "alert" && (monster.jumpCooldown ?? 0) <= 0 && distToPlayer >= 1.2 && distToPlayer <= 6) {
        monster.jumpVelocity = scale(normalize(sub(this.player.position, monster.position)), monster.speed * 3.2);
        monster.jumpTimer = 0.36;
        monster.jumpCooldown = 1.35;
        this.view.spark(monster.position, 0xd9f3ff, 10);
      }
    }
    if ((monster.chargeTimer ?? 0) > 0) {
      monster.chargeTimer = Math.max(0, (monster.chargeTimer ?? 0) - dt);
    }
    if (monster.supportCooldown !== undefined) {
      monster.supportCooldown = Math.max(0, monster.supportCooldown - dt);
    }
  }

  private monsterMoveDirection(monster: Monster, dt: number): Vec2 {
    if ((monster.jumpTimer ?? 0) > 0 && monster.jumpVelocity) {
      return normalize(monster.jumpVelocity);
    }
    if ((monster.chargeTimer ?? 0) > 0 && monster.chargeVelocity) {
      return normalize(monster.chargeVelocity);
    }
    if (monster.monsterType === "octopus" || monster.monsterType === "voodooFlower" || monster.monsterType === "eyeCannon") {
      return { x: 0, z: 0 };
    }
    if (monster.aiState === "alert") {
      return normalize(sub(this.player.position, monster.position));
    }
    if (monster.aiState === "returning" && monster.spawnPosition) {
      return normalize(sub(monster.spawnPosition, monster.position));
    }
    if (monster.aiState === "patrol" && monster.patrolPath?.length) {
      const index = monster.patrolIndex ?? 0;
      const target = monster.patrolPath[index % monster.patrolPath.length];
      if (distance(monster.position, target) < 0.18) {
        monster.patrolIndex = (index + 1) % monster.patrolPath.length;
      }
      const nextTarget = monster.patrolPath[(monster.patrolIndex ?? 0) % monster.patrolPath.length];
      monster.aiTimer = (monster.aiTimer ?? 0) + dt;
      return normalize(sub(nextTarget, monster.position));
    }
    return { x: 0, z: 0 };
  }

  private updateMonsterAttack(monster: Monster): void {
    if (monster.aiState !== "alert") {
      return;
    }
    if (monster.monsterType === "voodooFlower") {
      this.updateVoodooFlowerAttack(monster);
      return;
    }
    if (monster.monsterType === "priest") {
      this.updatePriestSupport(monster);
      return;
    }
    if (monster.monsterType !== "octopus" && monster.monsterType !== "eyeCannon") {
      return;
    }
    if ((monster.attackCooldown ?? 0) > 0 || !this.hasLineOfSight(monster.position, this.player.position)) {
      return;
    }
    const direction = normalize(sub(this.player.position, monster.position));
    const isEyeCannon = monster.monsterType === "eyeCannon";
    this.enemyProjectiles.push({
      id: this.nextProjectileId,
      position: { ...monster.position },
      velocity: scale(direction, isEyeCannon ? 7.4 : 5.4),
      radius: isEyeCannon ? 0.2 : 0.16,
      damage: isEyeCannon ? 2 : 1,
      ttl: isEyeCannon ? 3.2 : 4,
    });
    this.nextProjectileId += 1;
    monster.attackCooldown = isEyeCannon ? 2.15 : 1.55;
    this.view.spark(monster.position, isEyeCannon ? 0xff4fdf : 0xffdf72, isEyeCannon ? 14 : 8);
  }

  private updateVoodooFlowerAttack(monster: Monster): void {
    if ((monster.supportCooldown ?? 0) > 0 || distance(monster.position, this.player.position) > 4.6) {
      return;
    }
    monster.supportCooldown = 2.35;
    this.view.spark(this.player.position, 0xb86cff, 18);
    if (this.player.invulnTimer > 0) {
      return;
    }
    this.player.hp -= 1;
    this.player.invulnTimer = 0.75;
    this.view.damageText("-1", this.player.position);
    if (this.player.hp <= 0) {
      this.endRun("defeat");
    }
  }

  private updatePriestSupport(monster: Monster): void {
    if ((monster.supportCooldown ?? 0) > 0) {
      return;
    }
    const candidates = this.monsters
      .filter((target) => target.id !== monster.id && target.hp < target.maxHp && distance(target.position, monster.position) <= 4.2)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const target = candidates[0];
    if (!target) {
      return;
    }
    target.hp = Math.min(target.maxHp, target.hp + 2);
    monster.supportCooldown = 2.1;
    this.view.damageText("+2", target.position);
    this.view.spark(target.position, 0xfff1a6, 16);
  }

  private updateBombBugFuse(monster: Monster, index: number, dt: number): boolean {
    if (monster.monsterType !== "bombBug") {
      return false;
    }
    const distToPlayer = distance(monster.position, this.player.position);
    if (monster.aiState === "alert" && monster.fuseTimer === undefined && distToPlayer <= 1.35) {
      monster.fuseTimer = 0.72;
      monster.speed *= 0.35;
      this.view.spark(monster.position, 0xff4f4f, 16);
    }
    if (monster.fuseTimer === undefined) {
      return false;
    }
    monster.fuseTimer -= dt;
    if (monster.fuseTimer > 0) {
      return false;
    }
    const position = { ...monster.position };
    this.monsters.splice(index, 1);
    this.view.damageText("爆", position);
    this.view.spark(position, 0xff3b22, 42);
    if (distance(this.player.position, position) <= 1.65 && this.player.invulnTimer <= 0) {
      this.player.hp -= 2;
      this.player.invulnTimer = 0.85;
      this.view.damageText("-2", this.player.position);
      this.view.spark(this.player.position, 0xff4f4f, 18);
      if (this.player.hp <= 0) {
        this.endRun("defeat");
      }
    }
    this.damageMonstersInRadius(position, 1.6, 3, 10);
    return true;
  }

  private hasLineOfSight(from: Vec2, to: Vec2): boolean {
    const ray = sub(to, from);
    const distanceToTarget = Math.max(0.0001, Math.hypot(ray.x, ray.z));
    const direction = scale(ray, 1 / distanceToTarget);
    for (const obstacle of this.obstacles) {
      const behavior = this.obstacleBehavior(obstacle);
      if (behavior !== "solid" && behavior !== "oneWay" && behavior !== "breakable") {
        continue;
      }
      const hit = this.rayIntersectsObstacle(from, direction, distanceToTarget, obstacle);
      if (hit) {
        return false;
      }
    }
    return true;
  }

  private rayIntersectsObstacle(origin: Vec2, direction: Vec2, maxDistance: number, obstacle: Obstacle): boolean {
    const minX = obstacle.position.x - obstacle.halfSize.x;
    const maxX = obstacle.position.x + obstacle.halfSize.x;
    const minZ = obstacle.position.z - obstacle.halfSize.z;
    const maxZ = obstacle.position.z + obstacle.halfSize.z;
    const invX = Math.abs(direction.x) < 0.0001 ? Infinity : 1 / direction.x;
    const invZ = Math.abs(direction.z) < 0.0001 ? Infinity : 1 / direction.z;
    const t1 = (minX - origin.x) * invX;
    const t2 = (maxX - origin.x) * invX;
    const t3 = (minZ - origin.z) * invZ;
    const t4 = (maxZ - origin.z) * invZ;
    const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
    return tMax >= 0 && tMin <= tMax && tMin <= maxDistance;
  }

  private hasPendingSpawns(): boolean {
    return this.spawnQueue.some((item) => item.remaining > 0);
  }

  private waveProgress(): number {
    if (this.waveSpawnTotal <= 0) {
      return 1;
    }
    const remainingQueued = this.spawnQueue.reduce((sum, item) => sum + item.remaining, 0);
    return Math.max(0, Math.min(1, 1 - (this.monsters.length + remainingQueued) / this.waveSpawnTotal));
  }

  private createPlayer(): Player {
    return {
      position: this.runtimeLevel?.playerStart ?? { x: 0, z: 3.9 },
      velocity: { x: 0, z: 0 },
      radius: PLAYER.radius,
      hp: PLAYER.hp,
      mode: "normal",
      cannonTimeLeft: 0,
      cannonBounces: 0,
      cannonHitIds: new Set<number>(),
      speed: PLAYER.speed,
      dashCooldown: PLAYER.dashCooldown,
      dashTimer: 0,
      rollTimer: 0,
      rollDuration: PLAYER.rollDuration,
      rollVelocity: { x: 0, z: 0 },
      invulnTimer: 0,
    };
  }

  private ownedBuffs(): OwnedBuff[] {
    const buffs: OwnedBuff[] = [];
    for (const [id, count] of this.ownedUpgrades) {
      const upgrade = findUpgrade(id);
      if (!upgrade) {
        continue;
      }
      buffs.push({
        id,
        title: upgrade.title,
        description: upgrade.description,
        rarity: upgrade.rarity,
        count,
      });
    }
    return buffs;
  }

  private activateHumanCannon(): void {
    const direction = this.aimDirection();
    const fallback = direction.x === 0 && direction.z === 0 ? { x: 0, z: -1 } : direction;
    this.player.mode = "humanCannon";
    this.player.velocity = scale(fallback, HUMAN_CANNON.speed);
    this.player.cannonTimeLeft = HUMAN_CANNON.duration;
    this.player.cannonBounces = 0;
    this.player.cannonHitIds.clear();
    this.marble = this.createMarble();
    this.view.hideTrajectory();
    this.view.spark(this.player.position, 0xffa23a, 24);
  }

  private cancelCharge(): void {
    if (this.marble.state === "charging") {
      this.marble.state = "ready";
      this.chargeSeconds = 0;
      this.view.hideTrajectory();
    }
    this.input.clearPointerActions();
  }

  private createMarble(): Marble {
    return {
      id: "main",
      position: { ...this.player.position },
      velocity: { x: 0, z: 0 },
      radius: MARBLE.radius + this.stats.marbleRadiusBonus,
      state: "ready",
      bounces: 0,
      distanceLeft: 0,
      hitIds: new Set<number>(),
      obstacleHitIds: new Set<string>(),
      interactableHitIds: new Set<string>(),
      bonusDamage: 0,
      hp: this.stats.marbleHp,
    };
  }

  private createAuxiliaryMarble(position: Vec2, velocity: Vec2, source: Marble): Marble {
    return {
      id: `aux-${performance.now()}-${this.auxiliaryMarbles.length}`,
      position: { ...position },
      velocity: { ...velocity },
      radius: source.radius,
      state: "flying",
      bounces: source.bounces,
      distanceLeft: Math.min(source.distanceLeft, 12),
      hitIds: new Set<number>(),
      obstacleHitIds: new Set<string>(),
      interactableHitIds: new Set<string>(),
      bonusDamage: source.bonusDamage,
      hp: Math.max(1, source.hp),
    };
  }

  private cloneObstacles(): Obstacle[] {
    return this.baseObstacles.map((obstacle) => ({
      ...obstacle,
      position: { ...obstacle.position },
      halfSize: { ...obstacle.halfSize },
    }));
  }

  private floorAt(position: Vec2): FloorMaterial {
    if (!this.runtimeLevel) {
      return "sandstone";
    }
    const { grid, floors, arenaHalfWidth, arenaHalfDepth } = this.runtimeLevel;
    const cellSize = grid.cellSize || 1;
    const x = Math.floor((position.x + arenaHalfWidth) / cellSize);
    const z = Math.floor((position.z + arenaHalfDepth) / cellSize);
    if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) {
      return "sandstone";
    }
    return floors[z * grid.width + x] ?? "sandstone";
  }

  private applyPlayerTerrainEffects(dt: number): void {
    const floor = this.floorAt(this.player.position);
    if (floor !== "fire" && floor !== "danger") {
      this.terrainDamageTimer = 0;
      return;
    }
    if (this.player.invulnTimer > 0) {
      return;
    }
    this.terrainDamageTimer += dt;
    if (this.terrainDamageTimer < 0.65) {
      return;
    }
    this.terrainDamageTimer = 0;
    this.player.hp -= 1;
    this.player.invulnTimer = 0.4;
    this.view.damageText("-1", this.player.position);
    this.view.spark(this.player.position, 0xff4f4f, 12);
    if (this.player.hp <= 0) {
      this.endRun("defeat");
    }
  }

  private applyMarbleObstacleBehavior(obstacle: Obstacle, bouncedPosition: Vec2, bouncedVelocity: Vec2): { bounced: boolean } {
    const behavior = this.obstacleBehavior(obstacle);
    if (behavior === "breakable") {
      obstacle.hp = (obstacle.hp ?? 1) - 1;
      this.view.spark(obstacle.position, 0x9de7ff, 18);
      if (obstacle.hp <= 0) {
        this.removeObstacle(obstacle.id);
      }
      return { bounced: false };
    }
    if (behavior === "pierceDamage") {
      if (!this.marble.obstacleHitIds.has(obstacle.id)) {
        this.marble.obstacleHitIds.add(obstacle.id);
        this.marble.bonusDamage += 1;
        this.view.spark(obstacle.position, 0xff6f6f, 14);
      }
      return { bounced: false };
    }
    if (behavior === "explosive") {
      this.explodeObstacle(obstacle);
      return { bounced: false };
    }
    this.marble.position = bouncedPosition;
    this.marble.velocity = behavior === "reflectBack" ? scale(this.marble.velocity, -1) : bouncedVelocity;
    if (behavior === "speedUp") {
      const speed = Math.hypot(this.marble.velocity.x, this.marble.velocity.z);
      this.marble.velocity = scale(normalize(this.marble.velocity), Math.min(18, Math.max(MARBLE.baseSpeed, speed * 2)));
    }
    return { bounced: true };
  }

  private obstacleBehavior(obstacle: Obstacle): ObstacleBehavior {
    if (obstacle.behavior) {
      return obstacle.behavior;
    }
    if (obstacle.material === "glass") {
      return "breakable";
    }
    if (obstacle.material === "reflector") {
      return "reflectBack";
    }
    if (obstacle.material === "accelerator") {
      return "speedUp";
    }
    if (obstacle.material === "thorns") {
      return "pierceDamage";
    }
    if (obstacle.material === "oneWay") {
      return "oneWay";
    }
    if (obstacle.material === "bomb") {
      return "explosive";
    }
    return "solid";
  }

  private shouldSkipOneWayObstacle(obstacle: Obstacle, velocity: Vec2): boolean {
    if (this.obstacleBehavior(obstacle) !== "oneWay") {
      return false;
    }
    const direction = obstacle.facing ?? "right";
    if (direction === "right") {
      return velocity.x > 0;
    }
    if (direction === "left") {
      return velocity.x < 0;
    }
    if (direction === "down") {
      return velocity.z > 0;
    }
    return velocity.z < 0;
  }

  private removeObstacle(id: string): void {
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.id !== id);
    this.view.setObstacles(this.obstacles);
  }

  private explodeObstacle(obstacle: Obstacle): void {
    this.removeObstacle(obstacle.id);
    this.view.spark(obstacle.position, 0xffa23a, 36);
    for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
      const monster = this.monsters[i];
      if (distance(monster.position, obstacle.position) <= 1.5) {
        monster.hp -= 4;
        this.view.damageText("4", monster.position);
        if (monster.hp <= 0) {
          this.defeatMonster(i, 12);
        }
      }
    }
    if (distance(this.player.position, obstacle.position) <= 1.5 && this.player.invulnTimer <= 0) {
      this.player.hp -= 2;
      this.player.invulnTimer = 0.6;
      this.view.damageText("-2", this.player.position);
      if (this.player.hp <= 0) {
        this.endRun("defeat");
      }
    }
  }

  private handleMarbleInteractables(marble: Marble): void {
    if (marble.state !== "flying") {
      return;
    }
    for (const interactable of this.interactables) {
      if (marble.interactableHitIds.has(interactable.id)) {
        continue;
      }
      if (distance(marble.position, interactable.position) > marble.radius + 0.42) {
        continue;
      }
      marble.interactableHitIds.add(interactable.id);
      this.triggerInteractable(interactable, marble);
    }
  }

  private triggerInteractable(interactable: RuntimeInteractable, source: Marble): void {
    if (interactable.type === "brazier") {
      this.damageMonstersInRadius(interactable.position, 1.5, 5, 16);
      this.view.spark(interactable.position, 0xff7a24, 34);
      return;
    }
    if (interactable.type === "pinball") {
      this.auxiliaryMarbles.push(this.createAuxiliaryMarble(interactable.position, source.velocity, source));
      this.view.spark(interactable.position, 0x9de7ff, 24);
      return;
    }
    if (interactable.type === "iceBall") {
      for (const monster of this.monsters) {
        if (distance(monster.position, interactable.position) <= 1.8) {
          monster.aiState = "idle";
          monster.frozenTimer = 2.5;
        }
      }
      this.view.spark(interactable.position, 0x8edcff, 32);
      return;
    }
    if (interactable.type === "alarmPost") {
      for (const monster of this.monsters) {
        monster.aiState = "alert";
      }
      this.view.spark(interactable.position, 0xffdf72, 28);
      return;
    }
    this.toggleDoorObstacles();
    this.view.spark(interactable.position, 0x7ecf88, 24);
  }

  private damageMonstersInRadius(position: Vec2, radius: number, damage: number, scoreValue: number): void {
    for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
      const monster = this.monsters[i];
      if (distance(monster.position, position) > radius) {
        continue;
      }
      monster.hp -= damage;
      this.view.damageText(String(damage), monster.position);
      if (monster.hp <= 0) {
        this.defeatMonster(i, scoreValue);
      }
    }
  }

  private defeatMonster(index: number, scoreValue: number): void {
    const monster = this.monsters[index];
    if (!monster) {
      return;
    }
    this.score += scoreValue;
    this.monsters.splice(index, 1);
    if (monster.monsterType !== "slime") {
      return;
    }
    const splitLevel = monster.splitLevel ?? 0;
    if (splitLevel >= 2 || monster.radius < MONSTER.radius * 0.55) {
      return;
    }
    const childRadius = monster.radius * 0.72;
    const childHp = Math.max(1, Math.ceil(monster.maxHp * 0.45));
    const childSpeed = monster.speed * 1.18;
    const offsets: Vec2[] = [
      { x: -childRadius * 1.15, z: childRadius * 0.65 },
      { x: childRadius * 1.15, z: -childRadius * 0.65 },
    ];
    for (const offset of offsets) {
      this.spawnMonster(
        clampToArena(add(monster.position, offset), childRadius, this.arena),
        "slime",
        undefined,
        {
          radius: childRadius,
          hp: childHp,
          maxHp: childHp,
          speed: childSpeed,
          splitLevel: splitLevel + 1,
          aiState: "alert",
          aggroRange: monster.aggroRange,
          disengageRange: monster.disengageRange,
        },
      );
    }
    this.view.spark(monster.position, 0x7ecf88, 18);
  }

  private toggleDoorObstacles(): void {
    let changed = false;
    for (const obstacle of this.obstacles) {
      if (obstacle.behavior !== "oneWay" && obstacle.material !== "oneWay") {
        continue;
      }
      obstacle.behavior = obstacle.behavior === "oneWay" ? "solid" : "oneWay";
      changed = true;
    }
    if (changed) {
      this.view.setObstacles(this.obstacles);
    }
  }

  private endRun(kind: "victory" | "defeat"): void {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.running = false;
    this.paused = false;
    this.pausedForUpgrade = false;
    this.pausedForBuffPanel = false;
    this.view.hideTrajectory();
    this.hud.hidePause();
    this.hud.hideBuffs();
    this.hud.showResult(kind, this.score, this.wave);
  }
}
