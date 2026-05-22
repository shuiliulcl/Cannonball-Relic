import { HUMAN_CANNON, MARBLE, MONSTER, OBSTACLES, PLAYER } from "./config";
import { draftUpgrades } from "./upgrades";
import { add, bounceCircleFromObstacle, bounceInArena, clampToArena, distance, makeTrajectory, normalize, scale, sub } from "./physics";
import type { Marble, Monster, Player, UpgradeId, Vec2 } from "./types";
import type { Input } from "./input";
import type { SceneView } from "../render/SceneView";
import type { Hud } from "../ui/Hud";

type UpgradeStats = {
  bounceBonusDamage: number;
  rangeMultiplier: number;
  recallDamageBonus: number;
  maxHp: number;
};

export class Game {
  private player: Player = this.createPlayer();
  private marble: Marble = this.createMarble();
  private monsters: Monster[] = [];
  private running = false;
  private pausedForUpgrade = false;
  private gameOver = false;
  private score = 0;
  private wave = 1;
  private lastTime = 0;
  private nextMonsterId = 1;
  private stats: UpgradeStats = {
    bounceBonusDamage: MARBLE.bounceBonusDamage,
    rangeMultiplier: 1,
    recallDamageBonus: 0,
    maxHp: PLAYER.hp,
  };

  constructor(
    private readonly input: Input,
    private readonly view: SceneView,
    private readonly hud: Hud,
  ) {}

  start(): void {
    this.player = this.createPlayer();
    this.marble = this.createMarble();
    this.monsters = [];
    this.score = 0;
    this.wave = 1;
    this.nextMonsterId = 1;
    this.stats = {
      bounceBonusDamage: MARBLE.bounceBonusDamage,
      rangeMultiplier: 1,
      recallDamageBonus: 0,
      maxHp: PLAYER.hp,
    };
    this.spawnWave();
    this.running = true;
    this.pausedForUpgrade = false;
    this.gameOver = false;
    this.hud.hideUpgrades();
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  renderIdle(): void {
    this.spawnWave();
    this.sync();
    this.view.render();
    this.monsters = [];
  }

  chooseUpgrade(upgradeId: UpgradeId): void {
    if (upgradeId === "extraDamage") {
      this.stats.bounceBonusDamage += 1;
    }
    if (upgradeId === "longerRange") {
      this.stats.rangeMultiplier += 0.25;
    }
    if (upgradeId === "recallBlade") {
      this.stats.recallDamageBonus += 1;
    }
    if (upgradeId === "quickDash") {
      this.player.dashCooldown *= 0.82;
    }
    if (upgradeId === "vitality") {
      this.stats.maxHp += 1;
      this.player.hp = Math.min(this.stats.maxHp, this.player.hp + 1);
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
    if (this.running && !this.pausedForUpgrade) {
      this.update(dt);
    }
    this.sync();
    this.view.updateEffects(dt);
    this.view.render();
    if (this.running) {
      requestAnimationFrame((nextTime) => this.loop(nextTime));
    }
  }

  private update(dt: number): void {
    this.updatePlayer(dt);
    this.updateMarble(dt);
    this.updateMonsters(dt);
    this.handleHits();

    if (this.monsters.length === 0) {
      this.pausedForUpgrade = true;
      this.hud.showUpgrades(draftUpgrades(3, this.wave));
    }
  }

  private updatePlayer(dt: number): void {
    if (this.player.mode === "humanCannon") {
      this.updateHumanCannon(dt);
      return;
    }

    const movement = this.input.movement();
    const delta = scale(movement, this.player.speed * dt);
    this.player.position = clampToArena(add(this.player.position, delta), this.player.radius);
    this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
    this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);

    if (this.input.keys.has(" ") && this.player.dashTimer <= 0 && (movement.x !== 0 || movement.z !== 0)) {
      this.player.position = clampToArena(add(this.player.position, scale(movement, PLAYER.dashDistance)), this.player.radius);
      this.player.dashTimer = this.player.dashCooldown;
    }

    if (this.input.leftDown && this.marble.state === "ready") {
      this.marble.state = "charging";
      this.input.chargeSeconds = 0;
    }

    if (this.marble.state === "charging") {
      this.input.chargeSeconds = Math.min(MARBLE.maxChargeSeconds, this.input.chargeSeconds + dt);
      const direction = this.aimDirection();
      this.view.showTrajectory(makeTrajectory(this.player.position, direction, 3, OBSTACLES));
    }

    if (this.input.consumeLeftRelease() && this.marble.state === "charging") {
      const charge = 0.55 + this.input.chargeSeconds / MARBLE.maxChargeSeconds;
      const direction = this.aimDirection();
      this.marble.state = "flying";
      this.marble.position = { ...this.player.position };
      this.marble.velocity = scale(direction, MARBLE.baseSpeed * charge);
      this.marble.distanceLeft = MARBLE.baseRange * this.stats.rangeMultiplier * charge;
      this.marble.bounces = 0;
      this.marble.hitIds.clear();
      this.input.chargeSeconds = 0;
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

    const step = scale(this.marble.velocity, dt);
    this.marble.position = add(this.marble.position, step);
    this.marble.distanceLeft -= Math.hypot(step.x, step.z);

    const bounce = bounceInArena(this.marble.position, this.marble.velocity, this.marble.radius);
    this.marble.position = bounce.position;
    this.marble.velocity = bounce.velocity;
    let didBounce = bounce.bounced;

    for (const obstacle of OBSTACLES) {
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
          this.endGame();
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

    for (const obstacle of OBSTACLES) {
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

    const baseDamage = MARBLE.baseDamage + this.marble.bounces * this.stats.bounceBonusDamage;
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
        if (monster.hp <= 0) {
          this.score += 10 + this.marble.bounces * 5;
          this.monsters.splice(i, 1);
        }
        if (this.marble.state === "flying") {
          this.marble.state = "recalling";
          this.marble.hitIds.clear();
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
      damageScale: MARBLE.baseDamage + this.marble.bounces * this.stats.bounceBonusDamage,
      chargeRatio: this.marble.state === "charging" ? this.input.chargeSeconds / MARBLE.maxChargeSeconds : 0,
      hp: this.player.hp,
    });
  }

  private aimDirection(): Vec2 {
    const target = this.view.pointerToPlane(this.input.pointer);
    return normalize(sub(target, this.player.position));
  }

  private spawnWave(): void {
    const count = 4 + this.wave * 2;
    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      this.monsters.push({
        id: this.nextMonsterId,
        position: {
          x: -3.2 + col * 2.1,
          z: -3.8 - row * 0.72,
        },
        radius: MONSTER.radius,
        hp: MONSTER.hp + Math.floor(this.wave / 2),
        maxHp: MONSTER.hp + Math.floor(this.wave / 2),
        speed: MONSTER.speed + this.wave * 0.06,
      });
      this.nextMonsterId += 1;
    }
  }

  private createPlayer(): Player {
    return {
      position: { x: 0, z: 3.9 },
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
      invulnTimer: 0,
    };
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

  private createMarble(): Marble {
    return {
      position: { ...this.player.position },
      velocity: { x: 0, z: 0 },
      radius: MARBLE.radius,
      state: "ready",
      bounces: 0,
      distanceLeft: 0,
      hitIds: new Set<number>(),
    };
  }

  private endGame(): void {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.running = false;
    this.pausedForUpgrade = false;
    this.hud.showGameOver(this.score, () => this.start());
  }
}
