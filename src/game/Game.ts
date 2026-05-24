import { HUMAN_CANNON, MARBLE, MONSTER, OBSTACLES, PLAYER, RUN } from "./config";
import { draftUpgrades, findUpgrade, DEFAULT_UPGRADE_STATS } from "./upgrades";
import { add, applyHoming, bounceCircleFromObstacle, bounceInArena, calcBounceDamage, clampToArena, distance, makeTrajectory, normalize, scale, sub } from "./physics";
import type { Marble, Monster, MonsterType, OwnedBuff, Player, UpgradeId, UpgradeStats, Vec2 } from "./types";
import type { Input } from "./input";
import type { SceneView } from "../render/SceneView";
import type { Hud } from "../ui/Hud";
import type { RuntimeLevel, RuntimeSpawn } from "../levels/types";

type SpawnQueueItem = RuntimeSpawn & {
  remaining: number;
  timer: number;
};

export class Game {
  private player: Player = this.createPlayer();
  private stats: UpgradeStats = DEFAULT_UPGRADE_STATS();
  private marble: Marble = this.createMarble();
  private monsters: Monster[] = [];
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
  private spawnQueue: SpawnQueueItem[] = [];
  private waveSpawnTotal = 0;
  private readonly ownedUpgrades = new Map<UpgradeId, number>();
  private readonly blockedDiamondUpgrades = new Set<UpgradeId>();
  private pausedForBuffPanel = false;
  private wasPausedBeforeBuffPanel = false;
  private readonly obstacles;
  private readonly levelSpawns;

  constructor(
    private readonly input: Input,
    private readonly view: SceneView,
    private readonly hud: Hud,
    private readonly runtimeLevel?: RuntimeLevel,
  ) {
    this.obstacles = runtimeLevel?.obstacles ?? OBSTACLES;
    this.levelSpawns = runtimeLevel?.spawns ?? [];
  }

  start(): void {
    this.player = this.createPlayer();
    this.marble = this.createMarble();
    this.monsters = [];
    this.spawnQueue = [];
    this.view.clearTransientObjects();
    this.view.setObstacles(this.obstacles);
    this.score = 0;
    this.wave = 1;
    this.nextMonsterId = 1;
    this.waveSpawnTotal = 0;
    this.stats = DEFAULT_UPGRADE_STATS();
    this.ownedUpgrades.clear();
    this.blockedDiamondUpgrades.clear();
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
    this.updateSpawnQueue(dt);
    this.updateMonsters(dt);
    this.handleHits();

    if (this.monsters.length === 0 && !this.hasPendingSpawns()) {
      if (this.wave >= RUN.maxWaves) {
        this.endRun("victory");
        return;
      }
      this.pausedForUpgrade = true;
      this.hud.showUpgrades(draftUpgrades(3, this.wave, this.blockedDiamondUpgrades));
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

    if (this.player.rollTimer > 0) {
      this.player.position = clampToArena(add(this.player.position, scale(this.player.rollVelocity, dt)), this.player.radius);
      this.player.rollTimer = Math.max(0, this.player.rollTimer - dt);
      this.player.invulnTimer = Math.max(this.player.invulnTimer, this.player.rollTimer);
    } else {
      const delta = scale(movement, this.player.speed * dt);
      this.player.position = clampToArena(add(this.player.position, delta), this.player.radius);
    }

    if (this.input.keys.has(" ") && this.player.dashTimer <= 0 && this.player.rollTimer <= 0 && (movement.x !== 0 || movement.z !== 0)) {
      this.player.rollTimer = PLAYER.rollDuration;
      this.player.rollDuration = PLAYER.rollDuration;
      this.player.rollVelocity = scale(movement, PLAYER.dashDistance / PLAYER.rollDuration);
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
      this.view.showTrajectory(makeTrajectory(this.player.position, direction, MARBLE.maxBounces, this.obstacles, 0.2, MARBLE.radius), this.chargeSeconds / MARBLE.maxChargeSeconds);
    }

    if (this.input.consumeLeftRelease() && this.marble.state === "charging") {
      const direction = this.aimDirection();
      this.marble.state = "flying";
      this.marble.position = { ...this.player.position };
      this.marble.velocity = scale(direction, MARBLE.baseSpeed);
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
      this.marble.velocity = scale(normalize(toPlayer), MARBLE.recallSpeed);
    }

    if (this.marble.state === "flying" && this.stats.homingAngle > 0) {
      this.marble.velocity = applyHoming(this.marble.velocity, this.marble.position, this.monsters, this.stats.homingAngle);
    }

    const step = scale(this.marble.velocity, dt);
    this.marble.position = add(this.marble.position, step);
    this.marble.distanceLeft -= Math.hypot(step.x, step.z);

    const bounce = bounceInArena(this.marble.position, this.marble.velocity, this.marble.radius);
    this.marble.position = bounce.position;
    this.marble.velocity = bounce.velocity;
    let didBounce = bounce.bounced;

    for (const obstacle of this.obstacles) {
      const obstacleBounce = bounceCircleFromObstacle(this.marble.position, this.marble.velocity, this.marble.radius, obstacle);
      if (obstacleBounce.bounced) {
        this.marble.position = obstacleBounce.position;
        this.marble.velocity = obstacleBounce.velocity;
        didBounce = true;
        break;
      }
    }

    if (didBounce && this.marble.state === "flying") {
      this.marble.bounces += 1;
      this.marble.hitIds.clear();
      this.view.spark(this.marble.position, 0xffdf72, 12);
      if (this.marble.bounces >= MARBLE.maxBounces) {
        this.marble.state = "recalling";
        this.marble.hitIds.clear();
      }
    }

    if (this.marble.distanceLeft <= 0 && this.marble.state === "flying") {
      this.marble.state = "recalling";
      this.marble.hitIds.clear();
    }
  }

  private updateMonsters(dt: number): void {
    for (const monster of this.monsters) {
      const toPlayer = sub(this.player.position, monster.position);
      const direction = normalize(toPlayer);
      monster.position = add(monster.position, scale(direction, monster.speed * dt));
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

  private updateHumanCannon(dt: number): void {
    this.player.cannonTimeLeft -= dt;
    const step = scale(this.player.velocity, dt);
    this.player.position = add(this.player.position, step);

    const bounce = bounceInArena(this.player.position, this.player.velocity, this.player.radius + HUMAN_CANNON.radiusBonus);
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
          this.score += 18 + this.player.cannonBounces * 8;
          this.monsters.splice(i, 1);
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
    if (this.marble.state !== "flying" && this.marble.state !== "recalling") {
      return;
    }

    const baseDamage = calcBounceDamage(this.marble.bounces, MARBLE.baseDamage, this.stats.bounceBonusDamage);
    const damage = this.marble.state === "recalling" ? baseDamage + this.stats.recallDamageBonus : baseDamage;

    for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
      const monster = this.monsters[i];
      if (this.marble.hitIds.has(monster.id)) {
        continue;
      }
      if (distance(this.marble.position, monster.position) <= this.marble.radius + monster.radius) {
        monster.hp -= damage;
        this.marble.hitIds.add(monster.id);
        this.view.damageText(String(damage), monster.position);
        this.view.spark(monster.position, 0x9de7ff, 14);
        if (!monster.noKnockback && monster.hp > 0) {
          const knockDir = normalize(sub(monster.position, this.marble.position));
          monster.position = clampToArena(add(monster.position, scale(knockDir, MARBLE.knockback)), monster.radius);
        }
        if (monster.hp <= 0) {
          this.score += 10 + this.marble.bounces * 5;
          this.monsters.splice(i, 1);
        }
        if (this.marble.state === "flying") {
          this.marble.hp -= 1;
          if (this.marble.hp <= 0) {
            this.marble.state = "recalling";
            this.marble.hitIds.clear();
          }
        }
      }
    }
  }

  private sync(): void {
    this.view.syncPlayer(this.player);
    this.view.syncMarble(this.marble);
    this.view.syncMonsters(this.monsters);
    this.hud.update({
      score: this.score,
      wave: this.wave,
      marbleState: this.player.mode === "humanCannon" ? "cannon" : this.marble.state,
      damageScale: calcBounceDamage(this.marble.bounces, MARBLE.baseDamage, this.stats.bounceBonusDamage),
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

  private spawnMonster(position: Vec2, monsterType: MonsterType, spawn?: RuntimeSpawn): void {
    const stats = this.monsterStats(monsterType);
    this.monsters.push({
      id: this.nextMonsterId,
      position: { ...position },
      spawnPosition: { ...position },
      radius: stats.radius,
      hp: stats.hp + Math.floor(this.wave / 2),
      maxHp: stats.hp + Math.floor(this.wave / 2),
      speed: stats.speed + this.wave * 0.06,
      monsterType,
      patrolPath: spawn?.patrolPath,
      aiState: spawn?.patrolPath?.length ? "patrol" : "alert",
      aggroRange: spawn?.aggroRange ?? 15,
      disengageRange: spawn?.disengageRange ?? 25,
    });
    this.nextMonsterId += 1;
  }

  private monsterStats(monsterType: MonsterType): { radius: number; hp: number; speed: number } {
    if (monsterType === "runner") {
      return { radius: MONSTER.radius * 0.86, hp: Math.max(1, MONSTER.hp - 1), speed: MONSTER.speed * 1.45 };
    }
    if (monsterType === "tank") {
      return { radius: MONSTER.radius * 1.18, hp: MONSTER.hp + 3, speed: MONSTER.speed * 0.72 };
    }
    return { radius: MONSTER.radius, hp: MONSTER.hp, speed: MONSTER.speed };
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
      position: { ...this.player.position },
      velocity: { x: 0, z: 0 },
      radius: MARBLE.radius,
      state: "ready",
      bounces: 0,
      distanceLeft: 0,
      hitIds: new Set<number>(),
      hp: this.stats.marbleHp,
    };
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
