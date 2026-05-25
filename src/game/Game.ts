import { ARENA, HUMAN_CANNON, MARBLE, MONSTER, OBSTACLES, PLAYER, RUN } from "./config";
import { draftUpgrades, findUpgrade, DEFAULT_UPGRADE_STATS } from "./upgrades";
import { playFire, playBounce, playHit, startCharge, updateCharge, stopCharge, playWaveClear, playCardSelect, playDefeat, resumeAudio } from "./Audio";
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

type GameOptions = {
  campaignLevels?: RuntimeLevel[];
  noMonsters?: boolean;
  noObstacles?: boolean;
};

type PerfLongMoveState = {
  active: boolean;
  finished: boolean;
  speed: number;
  currentIndex: number;
  distanceTraveled: number;
  startedAt: number;
  finishedAt: number | null;
  waypoints: Vec2[];
};

type PerfFrameDiag = {
  frameMs: number;
  dt: number;
  updateMs: number;
  syncMs: number;
  effectsMs: number;
  renderMs: number;
  syncParts: Record<string, number>;
  renderer: { calls: number; triangles: number; textures: number; geometries: number };
};

const CHARGE_WORLD_TIME_SCALE = 0.38;
const AIM_ASSIST_ANGLE = Math.PI / 14;
const AIM_ASSIST_STRENGTH = 0.42;
const AIM_ASSIST_RANGE = 13;
const TRAJECTORY_PREVIEW_BOUNCES = 2;
const MANUAL_RECALL_DAMAGE_BONUS = 2;
const MANUAL_RECALL_SPEED_MULTIPLIER = 1.45;
const AUTO_RECALL_DELAY_SECONDS = 3;

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
  private pendingChainBonus = 0;
  private fragmentUsedThisShot = false;
  private manualRecallActive = false;
  private manualRecallRewarded = false;
  private autoRecallDelayTimer = 0;
  private pausedForBuffPanel = false;
  private wasPausedBeforeBuffPanel = false;
  private baseObstacles: Obstacle[];
  private obstacles: Obstacle[];
  private solidObstacles: Obstacle[] = [];
  // Flat boolean lookup for void cells — O(1) vs O(N) voids.some() in isVoidCell
  private voidCells: boolean[] = [];
  private voidGridWidth = 0;
  private interactables: RuntimeInteractable[];
  private levelSpawns: RuntimeSpawn[] = [];
  private levelMaxWave = RUN.maxWaves;
  private readonly campaignLevels: RuntimeLevel[];
  private campaignIndex = 0;
  private pendingCampaignAdvance = false;
  private readonly campaignMode: boolean;
  private readonly godMode = new URLSearchParams(window.location.search).get("god") === "1";
  private readonly noMonsters: boolean;
  private readonly noObstacles: boolean;
  private perfLongMove: PerfLongMoveState | null = null;
  private readonly perfDiagEnabled = new URLSearchParams(window.location.search).get("perfdiag") === "1";
  private readonly perfDiagFrames: PerfFrameDiag[] = [];
  private perfSyncParts: Record<string, number> = {};

  constructor(
    private readonly input: Input,
    private readonly view: SceneView,
    private readonly hud: Hud,
    private runtimeLevel?: RuntimeLevel,
    options: GameOptions = {},
  ) {
    this.campaignLevels = options.campaignLevels ?? [];
    this.campaignMode = this.campaignLevels.length > 0;
    this.noMonsters = options.noMonsters ?? false;
    this.noObstacles = options.noObstacles ?? false;
    this.runtimeLevel = this.campaignMode ? this.campaignLevels[0] : runtimeLevel;
    this.baseObstacles = this.noObstacles ? [] : this.cloneBaseObstacles(this.runtimeLevel);
    this.obstacles = this.cloneObstacles();
    this.solidObstacles = this.rebuildSolidObstacles();
    this.interactables = this.cloneInteractables(this.runtimeLevel);
    this.levelSpawns = this.runtimeLevel?.spawns ?? [];
    this.levelMaxWave = this.maxWaveForLevel(this.runtimeLevel);
    this.rebuildVoidCells();
  }

  private get arena() {
    return {
      halfWidth: this.runtimeLevel?.arenaHalfWidth ?? ARENA.halfWidth,
      halfDepth: this.runtimeLevel?.arenaHalfDepth ?? ARENA.halfDepth,
    };
  }

  start(): void {
    if (this.campaignMode) {
      this.campaignIndex = 0;
      this.configureRuntimeLevel(this.campaignLevels[0]);
    }
    this.player = this.createPlayer();
    this.marble = this.createMarble();
    this.auxiliaryMarbles = [];
    this.monsters = [];
    this.enemyProjectiles = [];
    this.spawnQueue = [];
    this.obstacles = this.cloneObstacles();
    this.solidObstacles = this.rebuildSolidObstacles();
    this.view.clearTransientObjects();
    this.view.setObstacles(this.obstacles);
    this.view.setInteractables(this.interactables);
    this.view.warmupGPU();
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
    this.pendingChainBonus = 0;
    this.fragmentUsedThisShot = false;
    this.manualRecallActive = false;
    this.manualRecallRewarded = false;
    this.autoRecallDelayTimer = 0;
    this.pendingCampaignAdvance = false;
    this.pausedForBuffPanel = false;
    this.wasPausedBeforeBuffPanel = false;
    resumeAudio();
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

    playCardSelect();
    this.pausedForUpgrade = false;
    this.hud.hideUpgrades();
    this.marble = this.createMarble();
    if (this.pendingCampaignAdvance) {
      this.pendingCampaignAdvance = false;
      this.advanceCampaignLevel();
      return;
    }
    this.wave += 1;
    this.spawnWave();
  }

  private loop(time: number): void {
    const dt = Math.min((time - this.lastTime) / 1000, 0.033);
    const frameStart = this.perfDiagEnabled ? performance.now() : 0;
    this.lastTime = time;
    let updateMs = 0;
    let syncMs = 0;
    let effectsMs = 0;
    let renderMs = 0;
    if (this.running && this.input.consumePausePress()) {
      this.togglePause();
    }
    if (this.running && !this.paused && !this.pausedForUpgrade) {
      const start = this.perfDiagEnabled ? performance.now() : 0;
      this.update(dt);
      if (this.perfDiagEnabled) updateMs = performance.now() - start;
    }
    let start = this.perfDiagEnabled ? performance.now() : 0;
    this.sync();
    if (this.perfDiagEnabled) syncMs = performance.now() - start;
    start = this.perfDiagEnabled ? performance.now() : 0;
    this.view.updateEffects(dt);
    if (this.perfDiagEnabled) effectsMs = performance.now() - start;
    start = this.perfDiagEnabled ? performance.now() : 0;
    this.view.render();
    if (this.perfDiagEnabled) {
      renderMs = performance.now() - start;
      const frameMs = performance.now() - frameStart;
      this.perfDiagFrames.push({
        frameMs: Number(frameMs.toFixed(2)),
        dt: Number(dt.toFixed(4)),
        updateMs: Number(updateMs.toFixed(2)),
        syncMs: Number(syncMs.toFixed(2)),
        effectsMs: Number(effectsMs.toFixed(2)),
        renderMs: Number(renderMs.toFixed(2)),
        syncParts: { ...this.perfSyncParts },
        renderer: this.view.rendererInfo(),
      });
      if (this.perfDiagFrames.length > 360) this.perfDiagFrames.shift();
    }
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

  startLongMovePerfTest(speed = 14): { waypoints: Vec2[]; speed: number } {
    const inset = 1.2;
    const hw = Math.max(inset, this.arena.halfWidth - inset);
    const hd = Math.max(inset, this.arena.halfDepth - inset);
    const start = { ...this.player.position };
    const waypoints = [
      start,
      { x: -hw, z: -hd },
      { x: hw, z: -hd },
      { x: hw, z: hd },
      { x: -hw, z: hd },
      { x: 0, z: 0 },
    ];

    this.perfLongMove = {
      active: true,
      finished: false,
      speed,
      currentIndex: 1,
      distanceTraveled: 0,
      startedAt: performance.now(),
      finishedAt: null,
      waypoints,
    };
    this.player.mode = "normal";
    this.player.velocity = { x: 0, z: 0 };
    this.player.rollTimer = 0;
    this.player.rollVelocity = { x: 0, z: 0 };
    this.player.invulnTimer = 999;
    return { waypoints, speed };
  }

  getLongMovePerfStatus(): {
    active: boolean;
    finished: boolean;
    currentIndex: number;
    waypointCount: number;
    distanceTraveled: number;
    elapsedMs: number;
  } {
    if (!this.perfLongMove) {
      return { active: false, finished: false, currentIndex: 0, waypointCount: 0, distanceTraveled: 0, elapsedMs: 0 };
    }
    const endTime = this.perfLongMove.finishedAt ?? performance.now();
    return {
      active: this.perfLongMove.active,
      finished: this.perfLongMove.finished,
      currentIndex: this.perfLongMove.currentIndex,
      waypointCount: this.perfLongMove.waypoints.length,
      distanceTraveled: Number(this.perfLongMove.distanceTraveled.toFixed(2)),
      elapsedMs: Number((endTime - this.perfLongMove.startedAt).toFixed(1)),
    };
  }

  getPerfDiagnostics(): PerfFrameDiag[] {
    return [...this.perfDiagFrames];
  }

  private update(dt: number): void {
    this.updatePlayer(dt);
    const worldDt = dt * this.worldTimeScale();
    this.updateMarble(worldDt);
    this.updateAuxiliaryMarbles(worldDt);
    this.updateSpawnQueue(worldDt);
    this.updateMonsters(worldDt);
    this.updateEnemyProjectiles(worldDt);
    this.handleHits();

    if (!this.noMonsters && this.monsters.length === 0 && !this.hasPendingSpawns()) {
      if (this.campaignMode) {
        this.handleCampaignRoomClear();
        return;
      }
      if (this.wave >= this.levelMaxWave) {
        this.endRun("victory");
        return;
      }
      this.pausedForUpgrade = true;
      playWaveClear();
      this.hud.showUpgrades(draftUpgrades(3, this.wave, this.blockedDiamondUpgrades, this.bronzeStreakCount));
    }
  }

  private worldTimeScale(): number {
    return this.marble.state === "charging" ? CHARGE_WORLD_TIME_SCALE : 1;
  }

  private handleCampaignRoomClear(): void {
    if (this.wave < this.levelMaxWave) {
      this.wave += 1;
      this.spawnWave();
      return;
    }
    if (this.campaignIndex >= this.campaignLevels.length - 1) {
      this.endRun("victory");
      return;
    }
    this.pendingCampaignAdvance = true;
    this.pausedForUpgrade = true;
    playWaveClear();
    this.hud.showUpgrades(draftUpgrades(3, this.campaignIndex + 1, this.blockedDiamondUpgrades, this.bronzeStreakCount));
  }

  private advanceCampaignLevel(): void {
    this.campaignIndex += 1;
    this.configureRuntimeLevel(this.campaignLevels[this.campaignIndex]);
    this.wave = 1;
    this.nextMonsterId = 1;
    this.nextProjectileId = 1;
    this.waveSpawnTotal = 0;
    this.monsters = [];
    this.enemyProjectiles = [];
    this.auxiliaryMarbles = [];
    this.spawnQueue = [];
    this.obstacles = this.cloneObstacles();
    this.solidObstacles = this.rebuildSolidObstacles();
    this.player.position = this.runtimeLevel?.playerStart ?? { x: 0, z: 3.9 };
    this.player.velocity = { x: 0, z: 0 };
    this.player.mode = "normal";
    this.player.cannonTimeLeft = 0;
    this.player.cannonBounces = 0;
    this.player.cannonHitIds.clear();
    this.player.rollTimer = 0;
    this.player.rollVelocity = { x: 0, z: 0 };
    this.marble = this.createMarble();
    this.manualRecallActive = false;
    this.manualRecallRewarded = false;
    this.autoRecallDelayTimer = 0;
    this.view.clearTransientObjects();
    this.view.warmupGPU();
    this.spawnWave();
    this.lastTime = performance.now();
  }

  private moveActorWithCollision(
    position: Vec2,
    velocity: Vec2,
    radius: number,
    dt: number,
  ): { position: Vec2; velocity: Vec2; collided: boolean } {
    let resolvedPosition = { ...position };
    let resolvedVelocity = { ...velocity };
    let collided = false;

    for (const axis of ["x", "z"] as const) {
      const stepVelocity = axis === "x" ? { x: resolvedVelocity.x, z: 0 } : { x: 0, z: resolvedVelocity.z };
      const candidate = clampToArena(add(resolvedPosition, scale(stepVelocity, dt)), radius, this.arena);
      if (!this.canActorOccupy(candidate, radius)) {
        resolvedVelocity = axis === "x" ? { ...resolvedVelocity, x: 0 } : { ...resolvedVelocity, z: 0 };
        collided = true;
        continue;
      }

      resolvedPosition = candidate;
      for (const obstacle of this.solidObstacles) {
        // AABB broad-phase: skip if circle cannot possibly overlap obstacle
        if (
          resolvedPosition.x < obstacle.position.x - obstacle.halfSize.x - radius ||
          resolvedPosition.x > obstacle.position.x + obstacle.halfSize.x + radius ||
          resolvedPosition.z < obstacle.position.z - obstacle.halfSize.z - radius ||
          resolvedPosition.z > obstacle.position.z + obstacle.halfSize.z + radius
        ) {
          continue;
        }
        const obstacleBounce = bounceCircleFromObstacle(resolvedPosition, stepVelocity, radius, obstacle);
        if (!obstacleBounce.bounced) {
          continue;
        }
        const pushedPosition = clampToArena(obstacleBounce.position, radius, this.arena);
        if (this.canActorOccupy(pushedPosition, radius)) {
          resolvedPosition = pushedPosition;
        }
        resolvedVelocity = axis === "x" ? { ...resolvedVelocity, x: 0 } : { ...resolvedVelocity, z: 0 };
        collided = true;
      }
    }

    return { position: resolvedPosition, velocity: resolvedVelocity, collided };
  }

  private pushActor(position: Vec2, delta: Vec2, radius: number): Vec2 {
    return this.moveActorWithCollision(position, delta, radius, 1).position;
  }

  private updatePlayer(dt: number): void {
    if (this.perfLongMove?.active) {
      this.updateLongMovePerfPlayer(dt);
      return;
    }

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
      const movementResult = this.moveActorWithCollision(this.player.position, this.player.rollVelocity, this.player.radius, dt);
      this.player.position = movementResult.position;
      this.player.rollVelocity = movementResult.velocity;
      this.player.rollTimer = Math.max(0, this.player.rollTimer - dt);
      this.player.invulnTimer = Math.max(this.player.invulnTimer, this.player.rollTimer);
    } else if (floor === "ice") {
      const desiredVelocity = scale(movement, (this.player.speed + this.stats.speedBonus) * speedMultiplier);
      this.player.velocity = add(scale(this.player.velocity, 0.9), scale(desiredVelocity, 0.1));
      const movementResult = this.moveActorWithCollision(this.player.position, this.player.velocity, this.player.radius, dt);
      this.player.position = movementResult.position;
      this.player.velocity = movementResult.velocity;
    } else {
      this.player.velocity = scale(movement, (this.player.speed + this.stats.speedBonus) * speedMultiplier);
      const movementResult = this.moveActorWithCollision(this.player.position, this.player.velocity, this.player.radius, dt);
      this.player.position = movementResult.position;
      this.player.velocity = movementResult.velocity;
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
      // 持有人间大炮时按发射键直接激活大炮模式，不走普通蓄力流程
      if (this.ownedUpgrades.has("humanCannon")) {
        this.activateHumanCannon();
        return;
      }
      this.marble.state = "charging";
      this.chargeSeconds = 0;
      startCharge();
    }

    if (this.marble.state === "charging") {
      this.chargeSeconds = Math.min(MARBLE.maxChargeSeconds, this.chargeSeconds + dt);
      const chargeRatio = this.chargeSeconds / MARBLE.maxChargeSeconds;
      updateCharge(chargeRatio);
      const direction = this.aimDirection();
      const previewBounces = Math.min(TRAJECTORY_PREVIEW_BOUNCES, MARBLE.maxBounces + this.stats.maxBouncesBonus);
      this.view.showTrajectory(makeTrajectory(this.player.position, direction, previewBounces, this.obstacles, 0.2, MARBLE.radius + this.stats.marbleRadiusBonus, this.arena), chargeRatio);
    }

    if (this.input.consumeLeftRelease() && this.marble.state === "charging") {
      const direction = this.aimDirection();
      stopCharge();
      playFire();
      this.marble.state = "flying";
      this.marble.position = { ...this.player.position };
      this.marble.velocity = scale(direction, MARBLE.baseSpeed * this.stats.marbleSpeedMultiplier);
      this.marble.distanceLeft = MARBLE.baseRange * this.stats.rangeMultiplier;
      this.marble.bounces = 0;
      this.marble.hitIds.clear();
      this.marble.bonusDamage = this.pendingChainBonus;
      this.pendingChainBonus = 0;
      this.fragmentUsedThisShot = false;
      this.manualRecallActive = false;
      this.manualRecallRewarded = false;
      this.autoRecallDelayTimer = 0;
      if (this.stats.hasTripleShot) {
        this.spawnFragmentMarbles(this.marble.position, this.marble.velocity, this.marble);
      }
      this.chargeSeconds = 0;
      this.view.hideTrajectory();
    }

    if (this.input.consumeRightPress()) {
      if (this.marble.state === "flying" || this.marble.state === "awaitingRecall") {
        this.startManualRecall();
      } else if (this.marble.state === "charging") {
        this.cancelCharge();
      }
    }
  }

  private updateLongMovePerfPlayer(dt: number): void {
    const state = this.perfLongMove;
    if (!state || state.finished) return;

    let remainingStep = state.speed * dt;
    while (remainingStep > 0 && state.currentIndex < state.waypoints.length) {
      const target = state.waypoints[state.currentIndex];
      const toTarget = sub(target, this.player.position);
      const remainingDistance = distance(this.player.position, target);

      if (remainingDistance <= 0.001) {
        state.currentIndex += 1;
        continue;
      }

      const stepDistance = Math.min(remainingStep, remainingDistance);
      const direction = normalize(toTarget);
      this.player.position = clampToArena(add(this.player.position, scale(direction, stepDistance)), this.player.radius, this.arena);
      this.player.velocity = scale(direction, state.speed);
      state.distanceTraveled += stepDistance;
      remainingStep -= stepDistance;

      if (stepDistance >= remainingDistance - 0.001) {
        this.player.position = { ...target };
        state.currentIndex += 1;
      }
    }

    this.player.dashTimer = 0;
    this.player.invulnTimer = 999;
    this.player.rollTimer = 0;
    this.marble.position = { ...this.player.position };
    this.view.hideTrajectory();

    if (state.currentIndex >= state.waypoints.length) {
      state.active = false;
      state.finished = true;
      state.finishedAt = performance.now();
      this.player.velocity = { x: 0, z: 0 };
    }
  }

  private updateMarble(dt: number): void {
    if (this.marble.state === "ready" || this.marble.state === "charging") {
      this.marble.position = { ...this.player.position };
      return;
    }

    if (this.marble.state === "awaitingRecall") {
      this.marble.velocity = { x: 0, z: 0 };
      this.autoRecallDelayTimer = Math.max(0, this.autoRecallDelayTimer - dt);
      this.view.showTrajectory(this.recallTrajectoryPoints(), 0.45);
      if (this.autoRecallDelayTimer <= 0) {
        this.startAutoRecall();
      }
      return;
    }

    if (this.marble.state === "recalling") {
      const toPlayer = sub(this.player.position, this.marble.position);
      if (distance(this.player.position, this.marble.position) < this.player.radius + this.marble.radius) {
        this.marble = this.createMarble();
        this.manualRecallActive = false;
        this.manualRecallRewarded = false;
        this.autoRecallDelayTimer = 0;
        this.view.hideTrajectory();
        return;
      }
      const recallSpeedMultiplier = this.manualRecallActive ? MANUAL_RECALL_SPEED_MULTIPLIER : 1;
      this.marble.velocity = scale(normalize(toPlayer), MARBLE.recallSpeed * this.stats.recallSpeedMultiplier * recallSpeedMultiplier);
      if (this.manualRecallActive) {
        this.view.showTrajectory(this.recallTrajectoryPoints(), 1);
      }
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
      playBounce();
      if (this.stats.hasGrowingMarble) {
        this.marble.radius += 0.08;
      }
      if (bounce.bounced && this.stats.hasShockKnockback) {
        this.damageMonstersInRadius(this.marble.position, 1.8, 1, 0);
      }
      if (this.marble.bounces >= MARBLE.maxBounces + this.stats.maxBouncesBonus) {
        this.beginRecallDelay();
      }
    }

    if (this.marble.distanceLeft <= 0 && this.marble.state === "flying") {
      this.beginRecallDelay();
    }
  }

  private beginRecallDelay(): void {
    if (this.marble.state !== "flying") {
      return;
    }
    this.marble.state = "awaitingRecall";
    this.marble.velocity = { x: 0, z: 0 };
    this.marble.hitIds.clear();
    this.autoRecallDelayTimer = AUTO_RECALL_DELAY_SECONDS;
    this.manualRecallActive = false;
    this.manualRecallRewarded = false;
    this.view.showTrajectory(this.recallTrajectoryPoints(), 0.45);
    this.view.spark(this.marble.position, 0x8eeaff, 12);
  }

  private startManualRecall(): void {
    this.marble.state = "recalling";
    this.marble.hitIds.clear();
    this.manualRecallActive = true;
    this.manualRecallRewarded = false;
    this.autoRecallDelayTimer = 0;
    this.view.showTrajectory(this.recallTrajectoryPoints(), 1);
    this.view.spark(this.marble.position, 0x8eeaff, 18);
  }

  private startAutoRecall(): void {
    this.marble.state = "recalling";
    this.marble.hitIds.clear();
    this.manualRecallActive = false;
    this.manualRecallRewarded = false;
    this.autoRecallDelayTimer = 0;
    this.view.showTrajectory(this.recallTrajectoryPoints(), 0.75);
    this.view.spark(this.marble.position, 0x8eeaff, 10);
  }

  private recallTrajectoryPoints(): Vec2[] {
    const points: Vec2[] = [];
    const steps = 18;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      points.push({
        x: this.marble.position.x + (this.player.position.x - this.marble.position.x) * t,
        z: this.marble.position.z + (this.player.position.z - this.marble.position.z) * t,
      });
    }
    return points;
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
      const chargeMultiplier = (monster.chargeTimer ?? 0) > 0 ? 2.05 : 1;
      const jumpMultiplier = (monster.jumpTimer ?? 0) > 0 ? 2.65 : 1;
      const velocity = scale(direction, monster.speed * speedMultiplier * chargeMultiplier * jumpMultiplier);
      const movementResult = this.moveActorWithCollision(monster.position, velocity, monster.radius, dt);
      monster.position = this.canActorOccupy(movementResult.position, monster.radius) ? movementResult.position : monster.position;
      if (movementResult.collided && (monster.chargeTimer ?? 0) > 0) {
        monster.chargeTimer = 0;
      }
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
        this.applyDamageToPlayer(1);
        this.player.invulnTimer = 1;
        this.view.damageText("-1", this.player.position);
        this.view.spark(this.player.position, 0xff4f4f, 16);
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
        this.applyDamageToPlayer(projectile.damage);
        this.player.invulnTimer = 0.8;
        this.view.damageText(`-${projectile.damage}`, this.player.position);
        this.view.spark(this.player.position, 0xff4f4f, 14);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateHumanCannon(dt: number): void {
    this.player.cannonTimeLeft -= dt;
    const collisionRadius = this.player.radius + HUMAN_CANNON.radiusBonus;
    const previousPosition = { ...this.player.position };
    const step = scale(this.player.velocity, dt);
    this.player.position = add(this.player.position, step);
    let didBounce = false;

    if (!this.canActorOccupy(this.player.position, collisionRadius)) {
      this.player.position = previousPosition;
      if (Math.abs(this.player.velocity.x) >= Math.abs(this.player.velocity.z)) {
        this.player.velocity.x *= -1;
      } else {
        this.player.velocity.z *= -1;
      }
      didBounce = true;
    }

    const bounce = bounceInArena(this.player.position, this.player.velocity, collisionRadius, this.arena);
    this.player.position = bounce.position;
    this.player.velocity = bounce.velocity;
    didBounce = bounce.bounced || didBounce;

    for (const obstacle of this.obstacles) {
      const obstacleBounce = bounceCircleFromObstacle(
        this.player.position,
        this.player.velocity,
        collisionRadius,
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
      const manualRecallBonus = marble === this.marble && this.manualRecallActive && marble.state === "recalling" ? MANUAL_RECALL_DAMAGE_BONUS : 0;
      const damage = marble.state === "recalling" ? baseDamage + this.stats.recallDamageBonus + manualRecallBonus : baseDamage;

      const isDrill = this.stats.hasDrillMarble && marble === this.marble;
      for (let i = this.monsters.length - 1; i >= 0; i -= 1) {
        const monster = this.monsters[i];
        if (!isDrill && marble.hitIds.has(monster.id)) {
          continue;
        }
        if (distance(marble.position, monster.position) <= marble.radius + monster.radius) {
          const finalDamage = this.mitigatedMonsterDamage(monster, marble.position, damage);
          monster.hp -= finalDamage;
          if (!isDrill) {
            marble.hitIds.add(monster.id);
          }
          if (marble.state === "recalling" && this.stats.hasChainLoading) {
            this.pendingChainBonus += 3;
          }
          if (this.stats.hasFreezeHit) {
            monster.frozenTimer = (monster.frozenTimer ?? 0) + 2.0;
            monster.aiState = "idle";
          }
          if (manualRecallBonus > 0) {
            this.rewardManualRecallHit(monster.position);
          }
          if (marble === this.marble) playHit();
          this.view.damageText(String(finalDamage), monster.position);
          this.view.spark(monster.position, finalDamage < damage ? 0x8edcff : 0x9de7ff, finalDamage < damage ? 20 : 14);
          if (!monster.noKnockback && monster.hp > 0) {
            const knockDir = normalize(sub(monster.position, marble.position));
            monster.position = this.pushActor(monster.position, scale(knockDir, MARBLE.knockback), monster.radius);
          }
          if (monster.hp <= 0) {
            if (this.stats.hasMomentumContinue && marble === this.marble) {
              marble.hp = Math.min(this.stats.marbleHp, marble.hp + 1);
            }
            this.defeatMonster(i, 10 + marble.bounces * 5);
          }
          if (marble === this.marble && marble.state === "flying" && !this.fragmentUsedThisShot && this.stats.hasFragment) {
            this.fragmentUsedThisShot = true;
            this.spawnFragmentMarbles(marble.position, marble.velocity, marble);
          }
          if (marble.state === "flying") {
            marble.hp -= 1;
            if (marble.hp <= 0 && marble === this.marble) {
              this.beginRecallDelay();
            }
          }
        }
      }
    }
  }

  private sync(): void {
    this.perfSyncParts = {};
    const mark = (label: string, fn: () => void) => {
      if (!this.perfDiagEnabled) {
        fn();
        return;
      }
      const start = performance.now();
      fn();
      this.perfSyncParts[label] = Number((performance.now() - start).toFixed(2));
    };

    mark("syncPlayer", () => this.view.syncPlayer(this.player));
    mark("syncMarble", () => this.view.syncMarble(this.marble));
    mark("syncAuxiliaryMarbles", () => this.view.syncAuxiliaryMarbles(this.auxiliaryMarbles));
    mark("syncMonsters", () => this.view.syncMonsters(this.monsters));
    mark("syncEnemyProjectiles", () => this.view.syncEnemyProjectiles(this.enemyProjectiles));
    mark("hud", () => this.hud.update({
      score: this.score,
      wave: this.wave,
      marbleState: this.player.mode === "humanCannon" ? "cannon" : this.marble.state,
      damageScale: calcBounceDamage(this.marble.bounces, MARBLE.baseDamage + this.stats.baseDamageBonus, this.stats.bounceBonusDamage),
      chargeRatio: this.marble.state === "charging" ? this.chargeSeconds / MARBLE.maxChargeSeconds : 0,
      hp: this.player.hp,
      maxHp: this.stats.maxHp,
      shields: this.player.shields,
      waveProgress: this.waveProgress(),
      dashCooldownRatio: this.player.dashCooldown > 0 ? 1 - this.player.dashTimer / this.player.dashCooldown : 1,
      dashCooldownText: this.player.dashTimer > 0 ? `${this.player.dashTimer.toFixed(1)}s` : "就绪",
      ownedBuffs: this.ownedBuffs(),
    }));
  }

  private aimDirection(): Vec2 {
    const target = this.view.pointerToPlane(this.input.pointer);
    return this.assistAimDirection(normalize(sub(target, this.player.position)));
  }

  private assistAimDirection(direction: Vec2): Vec2 {
    if (this.monsters.length === 0 || (direction.x === 0 && direction.z === 0)) {
      return direction;
    }
    let bestDirection: Vec2 | undefined;
    let bestScore = -Infinity;
    const cosLimit = Math.cos(AIM_ASSIST_ANGLE);
    for (const monster of this.monsters) {
      const toMonster = sub(monster.position, this.player.position);
      const targetDistance = Math.hypot(toMonster.x, toMonster.z);
      if (targetDistance < 0.001 || targetDistance > AIM_ASSIST_RANGE) {
        continue;
      }
      const targetDirection = scale(toMonster, 1 / targetDistance);
      const dot = direction.x * targetDirection.x + direction.z * targetDirection.z;
      const forgivingLimit = Math.cos(AIM_ASSIST_ANGLE + Math.min(0.18, monster.radius / targetDistance));
      if (dot < Math.min(cosLimit, forgivingLimit) || !this.hasLineOfSight(this.player.position, monster.position)) {
        continue;
      }
      const score = dot * 3 - targetDistance * 0.05 + (monster.monsterType === "octopus" || monster.monsterType === "eyeCannon" ? 0.25 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestDirection = targetDirection;
      }
    }
    if (!bestDirection) {
      return direction;
    }
    return normalize(add(scale(direction, 1 - AIM_ASSIST_STRENGTH), scale(bestDirection, AIM_ASSIST_STRENGTH)));
  }

  private spawnWave(): void {
    if (this.noMonsters) return;
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
    const stationary = spawn?.stationary ?? false;
    this.monsters.push({
      id: this.nextMonsterId,
      position: { ...position },
      spawnPosition: { ...position },
      radius: stats.radius,
      hp,
      maxHp: overrides.maxHp ?? hp,
      speed: stationary ? 0 : overrides.speed ?? stats.speed + this.wave * 0.06,
      monsterType,
      patrolPath: spawn?.patrolPath,
      patrolIndex: 0,
      aiState: stationary ? "idle" : spawn?.aiState ?? (spawn?.patrolPath?.length ? "patrol" : "alert"),
      attackCooldown: monsterType === "octopus" ? 1.2 : 0,
      jumpCooldown: monsterType === "rabbit" ? 0.8 : undefined,
      splitLevel: monsterType === "slime" ? 0 : undefined,
      supportCooldown: monsterType === "voodooFlower" || monsterType === "priest" ? 1.2 : undefined,
      noKnockback: monsterType === "shieldCrab" ? true : undefined,
      aggroRange: stationary ? 0 : spawn?.aggroRange ?? 15,
      disengageRange: stationary ? 0 : spawn?.disengageRange ?? 25,
      ...overrides,
    });
    this.nextMonsterId += 1;
  }

  private monsterStats(monsterType: MonsterType): { radius: number; hp: number; speed: number } {
    if (monsterType === "runner") {
      return { radius: MONSTER.radius * 0.86, hp: Math.max(1, MONSTER.hp - 1), speed: MONSTER.speed * 1.45 };
    }
    if (monsterType === "hound") {
      return { radius: MONSTER.radius * 0.95, hp: MONSTER.hp, speed: MONSTER.speed * 1.35 };
    }
    if (monsterType === "boar") {
      return { radius: MONSTER.radius * 1.08, hp: MONSTER.hp + 1, speed: MONSTER.speed * 1.05 };
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
      return { radius: MONSTER.radius * 0.82, hp: MONSTER.hp, speed: MONSTER.speed * 1.05 };
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

  private rewardManualRecallHit(position: Vec2): void {
    if (this.manualRecallRewarded) {
      return;
    }
    this.manualRecallRewarded = true;
    if (this.player.shields < 2) {
      this.player.shields += 1;
      this.view.damageText("+SH", this.player.position);
      this.view.spark(this.player.position, 0x8eeaff, 18);
      return;
    }
    if (this.player.hp < this.stats.maxHp) {
      this.player.hp = Math.min(this.stats.maxHp, this.player.hp + 1);
      this.view.damageText("+1", this.player.position);
      this.view.spark(this.player.position, 0x7ecf88, 18);
      return;
    }
    this.view.spark(position, 0x8eeaff, 12);
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
    if (monster.monsterType === "boar" && monster.aiState === "alert" && (monster.chargeTimer ?? 0) <= 0 && (monster.attackCooldown ?? 0) <= 0 && distToPlayer <= 7) {
      monster.chargeVelocity = scale(normalize(sub(this.player.position, monster.position)), monster.speed * 2.05);
      monster.chargeTimer = 0.62;
      monster.attackCooldown = 1.45;
      monster.aiState = "alert";
      this.view.spark(monster.position, 0xffa23a, 12);
    }
    if (monster.monsterType === "rabbit") {
      monster.jumpCooldown = Math.max(0, (monster.jumpCooldown ?? 0) - dt);
      monster.jumpTimer = Math.max(0, (monster.jumpTimer ?? 0) - dt);
      if (monster.aiState === "alert" && (monster.jumpCooldown ?? 0) <= 0 && distToPlayer >= 1.2 && distToPlayer <= 6) {
        monster.jumpVelocity = scale(normalize(sub(this.player.position, monster.position)), monster.speed * 2.65);
        monster.jumpTimer = 0.36;
        monster.jumpCooldown = 1.65;
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
      velocity: scale(direction, isEyeCannon ? 6.4 : 4.45),
      radius: isEyeCannon ? 0.2 : 0.16,
      damage: isEyeCannon ? 2 : 1,
      ttl: isEyeCannon ? 3.6 : 4.4,
    });
    this.nextProjectileId += 1;
    monster.attackCooldown = isEyeCannon ? 2.55 : 2.2;
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
    this.applyDamageToPlayer(1);
    this.player.invulnTimer = 0.75;
    this.view.damageText("-1", this.player.position);
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
      this.applyDamageToPlayer(2);
      this.player.invulnTimer = 0.85;
      this.view.damageText("-2", this.player.position);
      this.view.spark(this.player.position, 0xff4f4f, 18);
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
      shields: 0,
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

  /** 护盾优先吸收伤害，剩余才扣 HP。若被完全吸收返回 0。 */
  private applyDamageToPlayer(amount: number): number {
    if (this.godMode) return 0;
    if (this.stats.hasShieldTrait && this.player.shields > 0) {
      const absorbed = Math.min(amount, this.player.shields);
      this.player.shields -= absorbed;
      amount -= absorbed;
      if (absorbed > 0) {
        this.view.spark(this.player.position, 0x4488ff, 12);
      }
    }
    if (amount > 0) {
      this.player.hp -= amount;
      if (this.player.hp <= 0) {
        this.endRun("defeat");
      }
    }
    return amount;
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
    this.manualRecallActive = false;
    this.manualRecallRewarded = false;
    this.autoRecallDelayTimer = 0;
    this.view.hideTrajectory();
    this.view.spark(this.player.position, 0xffa23a, 24);
  }

  private cancelCharge(): void {
    if (this.marble.state === "charging") {
      this.marble.state = "ready";
      this.chargeSeconds = 0;
      stopCharge();
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

  private spawnFragmentMarbles(position: Vec2, velocity: Vec2, source: Marble): void {
    const angle = 30 * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const vLeft: Vec2 = { x: velocity.x * cos - velocity.z * sin, z: velocity.x * sin + velocity.z * cos };
    const vRight: Vec2 = { x: velocity.x * cos + velocity.z * sin, z: -velocity.x * sin + velocity.z * cos };
    this.auxiliaryMarbles.push(this.createAuxiliaryMarble(position, vLeft, source));
    this.auxiliaryMarbles.push(this.createAuxiliaryMarble(position, vRight, source));
    this.view.spark(position, 0xffe066, 20);
  }

  private configureRuntimeLevel(runtimeLevel: RuntimeLevel | undefined): void {
    this.runtimeLevel = runtimeLevel;
    this.baseObstacles = this.noObstacles ? [] : this.cloneBaseObstacles(runtimeLevel);
    this.interactables = this.cloneInteractables(runtimeLevel);
    this.levelSpawns = runtimeLevel?.spawns ?? [];
    this.levelMaxWave = this.maxWaveForLevel(runtimeLevel);
    this.rebuildVoidCells();
    this.view.setRuntimeLevel(runtimeLevel, this.baseObstacles);
  }

  private rebuildVoidCells(): void {
    const level = this.runtimeLevel;
    if (!level?.voids.length) {
      this.voidCells = [];
      this.voidGridWidth = 0;
      return;
    }
    const { width, height } = level.grid;
    this.voidGridWidth = width;
    this.voidCells = new Array(width * height).fill(false);
    for (const cell of level.voids) {
      this.voidCells[cell.z * width + cell.x] = true;
    }
  }

  private cloneBaseObstacles(runtimeLevel: RuntimeLevel | undefined): Obstacle[] {
    return (runtimeLevel?.obstacles ?? OBSTACLES).map((obstacle) => ({
      ...obstacle,
      position: { ...obstacle.position },
      halfSize: { ...obstacle.halfSize },
    }));
  }

  private cloneInteractables(runtimeLevel: RuntimeLevel | undefined): RuntimeInteractable[] {
    return (runtimeLevel?.interactables ?? []).map((interactable) => ({
      ...interactable,
      position: { ...interactable.position },
    }));
  }

  private maxWaveForLevel(runtimeLevel: RuntimeLevel | undefined): number {
    if (!runtimeLevel) {
      return RUN.maxWaves;
    }
    if (runtimeLevel.maxWaves !== undefined) {
      return Math.max(1, runtimeLevel.maxWaves);
    }
    if (runtimeLevel.spawns.length === 0) {
      return RUN.maxWaves;
    }
    return Math.max(1, ...runtimeLevel.spawns.map((spawn) => spawn.wave));
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

  private canActorOccupy(position: Vec2, radius: number): boolean {
    if (!this.runtimeLevel?.voids.length) {
      return true;
    }

    const { grid, arenaHalfWidth, arenaHalfDepth } = this.runtimeLevel;
    const cellSize = grid.cellSize || 1;
    const minX = Math.max(0, Math.floor((position.x - radius + arenaHalfWidth) / cellSize));
    const maxX = Math.min(grid.width - 1, Math.floor((position.x + radius + arenaHalfWidth) / cellSize));
    const minZ = Math.max(0, Math.floor((position.z - radius + arenaHalfDepth) / cellSize));
    const maxZ = Math.min(grid.height - 1, Math.floor((position.z + radius + arenaHalfDepth) / cellSize));

    for (let z = minZ; z <= maxZ; z += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (!this.isVoidCell(x, z)) {
          continue;
        }
        if (this.circleIntersectsGridCell(position, radius, x, z)) {
          return false;
        }
      }
    }
    return true;
  }

  private isVoidCell(x: number, z: number): boolean {
    if (!this.voidCells.length) return false;
    return this.voidCells[z * this.voidGridWidth + x] === true;
  }

  private circleIntersectsGridCell(position: Vec2, radius: number, x: number, z: number): boolean {
    if (!this.runtimeLevel) {
      return false;
    }
    const { grid, arenaHalfWidth, arenaHalfDepth } = this.runtimeLevel;
    const cellSize = grid.cellSize || 1;
    const minX = -arenaHalfWidth + x * cellSize;
    const maxX = minX + cellSize;
    const minZ = -arenaHalfDepth + z * cellSize;
    const maxZ = minZ + cellSize;
    const closestX = Math.max(minX, Math.min(maxX, position.x));
    const closestZ = Math.max(minZ, Math.min(maxZ, position.z));
    return Math.hypot(position.x - closestX, position.z - closestZ) <= radius;
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
    this.applyDamageToPlayer(1);
    this.player.invulnTimer = 0.4;
    this.view.damageText("-1", this.player.position);
    this.view.spark(this.player.position, 0xff4f4f, 12);
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

  private blocksActorMovement(obstacle: Obstacle): boolean {
    const behavior = this.obstacleBehavior(obstacle);
    return (
      behavior === "solid" ||
      behavior === "breakable" ||
      behavior === "reflectBack" ||
      behavior === "speedUp" ||
      behavior === "pierceDamage" ||
      behavior === "oneWay" ||
      behavior === "explosive"
    );
  }

  private rebuildSolidObstacles(): Obstacle[] {
    return this.obstacles.filter((o) => this.blocksActorMovement(o));
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
    this.solidObstacles = this.rebuildSolidObstacles();
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
      this.applyDamageToPlayer(2);
      this.player.invulnTimer = 0.6;
      this.view.damageText("-2", this.player.position);
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
    if (this.stats.hasShieldTrait) {
      this.player.shields = Math.min(3, this.player.shields + 1);
    }
    if (this.stats.hasVampirism) {
      this.player.hp = Math.min(this.stats.maxHp, this.player.hp + 1);
    }
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
        this.pushActor(monster.position, offset, childRadius),
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
    stopCharge();
    if (kind === "defeat") playDefeat();
    else playWaveClear();
    this.view.hideTrajectory();
    this.hud.hidePause();
    this.hud.hideBuffs();
    this.hud.showResult(kind, this.score, this.wave);
  }
}
