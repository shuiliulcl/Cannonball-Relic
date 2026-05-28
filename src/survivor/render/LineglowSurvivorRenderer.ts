import type { Drop, Enemy, EnemyShot, EnemyType, Particle, PlayerAfterimage, Projectile, Turret, Vec2 } from "../VoiceSurvivorGame";
import { LINEGLOW_ENEMY_ART } from "./lineglowTheme";

const LINEGLOW_ENEMY_SPRITE_BASE = "/assets/skins/orbit-ruins/survivor/enemies";
const LINEGLOW_ENEMY_VARIANTS = 4;
const LINEGLOW_ENEMY_DRAW_SCALE: Record<EnemyType, number> = {
  runner: 5,
  brute: 3.85,
  pouncer: 4.85,
  ranged: 4.75,
  repeater: 4.55,
  silencer: 4.25,
  target: 4.35,
};

export type SurvivorRenderPlayer = {
  position: Vec2;
  radius: number;
  shield: number;
  cannonTime: number;
};

export type SurvivorRenderActiveMods = {
  explosionTime: number;
  freezeTime: number;
  lightningTime: number;
  splitTime: number;
  pierceTime: number;
  ricochetTime: number;
  focusTime: number;
  seriousTime: number;
  damageBoost: number;
};

export type SurvivorRenderState = {
  width: number;
  height: number;
  elapsed: number;
  player: SurvivorRenderPlayer;
  enemies: readonly Enemy[];
  projectiles: readonly Projectile[];
  enemyShots: readonly EnemyShot[];
  drops: readonly Drop[];
  particles: readonly Particle[];
  afterimages: readonly PlayerAfterimage[];
  turrets: readonly Turret[];
  activeMods: SurvivorRenderActiveMods;
  cannonTarget: Vec2 | null;
  cannonCharge: number;
  splitAngle: number;
  magnetRadius: number;
  guardTurretCount: number;
  bladeCount: number;
  bladeAngle: number;
  bladeRadius: number;
  playerSilenced: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(v: Vec2): Vec2 {
  const length = Math.hypot(v.x, v.y);
  if (length < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / length, y: v.y / length };
}

export class LineglowSurvivorRenderer {
  private state!: SurvivorRenderState;
  private readonly enemySprites = new Map<string, HTMLImageElement>();

  render(ctx: CanvasRenderingContext2D, state: SurvivorRenderState): void {
    this.state = state;
    this.renderArena(ctx);
    this.renderDrops(ctx);
    this.renderOrbitWeapons(ctx);
    this.renderTurrets(ctx);
    this.renderProjectiles(ctx);
    this.renderEnemies(ctx);
    this.renderEnemyShots(ctx);
    this.renderPlayerAfterimages(ctx);
    this.renderPlayer(ctx);
    this.renderParticles(ctx);
  }

  private get width(): number { return this.state.width; }
  private get height(): number { return this.state.height; }
  private get elapsed(): number { return this.state.elapsed; }
  private get player(): SurvivorRenderPlayer { return this.state.player; }
  private get enemies(): readonly Enemy[] { return this.state.enemies; }
  private get projectiles(): readonly Projectile[] { return this.state.projectiles; }
  private get enemyShots(): readonly EnemyShot[] { return this.state.enemyShots; }
  private get drops(): readonly Drop[] { return this.state.drops; }
  private get particles(): readonly Particle[] { return this.state.particles; }
  private get afterimages(): readonly PlayerAfterimage[] { return this.state.afterimages; }
  private get turrets(): readonly Turret[] { return this.state.turrets; }
  private get activeMods(): SurvivorRenderActiveMods { return this.state.activeMods; }
  private get cannonTarget(): Vec2 | null { return this.state.cannonTarget; }
  private get cannonCharge(): number { return this.state.cannonCharge; }
  private get splitAngle(): number { return this.state.splitAngle; }
  private get magnetRadius(): number { return this.state.magnetRadius; }
  private get guardTurretCount(): number { return this.state.guardTurretCount; }
  private get bladeCount(): number { return this.state.bladeCount; }
  private get bladeAngle(): number { return this.state.bladeAngle; }
  private get bladeRadius(): number { return this.state.bladeRadius; }

  private isPlayerSilenced(): boolean {
    return this.state.playerSilenced;
  }

  private guardTurretPosition(index: number): Vec2 {
    const count = Math.max(1, this.guardTurretCount);
    const angle = this.elapsed * 0.9 + (Math.PI * 2 * index) / count;
    const radius = this.player.radius + 28;
    return {
      x: clamp(this.player.position.x + Math.cos(angle) * radius, 18, this.width - 18),
      y: clamp(this.player.position.y + Math.sin(angle) * radius, 18, this.height - 18),
    };
  }

  private guardTurretAimAngle(position: Vec2): number {
    let target: Enemy | null = null;
    let targetDistance = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = distance(position, enemy.position);
      if (dist < targetDistance) {
        target = enemy;
        targetDistance = dist;
      }
    }
    if (target) {
      return Math.atan2(target.position.y - position.y, target.position.x - position.x);
    }
    return Math.atan2(position.y - this.player.position.y, position.x - this.player.position.x);
  }

  private bladePosition(index: number): Vec2 {
    const count = Math.max(1, this.bladeCount);
    const angle = this.bladeAngle + (Math.PI * 2 * index) / count;
    return {
      x: this.player.position.x + Math.cos(angle) * this.bladeRadius,
      y: this.player.position.y + Math.sin(angle) * this.bladeRadius,
    };
  }

  private renderArena(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(this.width * 0.42, this.height * 0.42, 40, this.width / 2, this.height / 2, this.width * 0.82);
    gradient.addColorStop(0, "#132129");
    gradient.addColorStop(0.5, "#0c121a");
    gradient.addColorStop(1, "#05070c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.setLineDash([]);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < 76; i += 1) {
      const startX = (i * 149 + 37) % Math.max(1, this.width);
      const startY = (i * 83 + 91) % Math.max(1, this.height);
      const length = 36 + ((i * 19) % 96);
      const angle = ((i * 47) % 360) * (Math.PI / 180);
      const bend = ((i % 5) - 2) * 8;
      ctx.strokeStyle = i % 11 === 0 ? "rgba(117, 238, 226, 0.09)" : "rgba(154, 179, 188, 0.055)";
      ctx.lineWidth = i % 11 === 0 ? 1.15 : 0.8;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        startX + Math.cos(angle + 0.7) * length * 0.44 + bend,
        startY + Math.sin(angle + 0.7) * length * 0.44 - bend,
        startX + Math.cos(angle) * length,
        startY + Math.sin(angle) * length,
      );
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(117, 238, 226, 0.045)";
    ctx.lineWidth = 1.2;
    for (let x = -24; x < this.width + 60; x += 164) {
      ctx.beginPath();
      ctx.moveTo(x, -18);
      ctx.bezierCurveTo(x + 30, this.height * 0.25, x - 46, this.height * 0.62, x + 18, this.height + 20);
      ctx.stroke();
    }

    const beacon = ctx.createRadialGradient(this.player.position.x, this.player.position.y, 0, this.player.position.x, this.player.position.y, 180);
    beacon.addColorStop(0, "rgba(117, 238, 226, 0.13)");
    beacon.addColorStop(0.36, "rgba(177, 108, 255, 0.045)");
    beacon.addColorStop(1, "rgba(117, 238, 226, 0)");
    ctx.fillStyle = beacon;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.isPlayerSilenced()) {
      ctx.fillStyle = "rgba(128, 112, 196, 0.12)";
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (this.cannonTarget) {
      const target = this.cannonTarget;
      ctx.strokeStyle = "rgba(117, 238, 226, 0.78)";
      ctx.lineWidth = 1.5 + this.cannonCharge * 0.7;
      ctx.setLineDash([16, 9, 3, 9]);
      ctx.beginPath();
      ctx.moveTo(this.player.position.x, this.player.position.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 154, 61, 0.12)";
      ctx.strokeStyle = "rgba(255, 154, 61, 0.86)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 18 + this.cannonCharge * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(this.player.position.x, this.player.position.y);
    const cannon = this.player.cannonTime > 0;
    const pulse = 1 + Math.sin(this.elapsed * 7) * 0.08;
    const pressure = this.playerEnemyPressure();
    const focusRadius = this.player.radius + 34 + pressure * 18 + (cannon ? 8 : 0);
    const focus = ctx.createRadialGradient(0, 0, 0, 0, 0, focusRadius);
    focus.addColorStop(0, `rgba(2, 8, 12, ${0.72 + pressure * 0.16})`);
    focus.addColorStop(0.42, `rgba(3, 10, 16, ${0.34 + pressure * 0.18})`);
    focus.addColorStop(1, "rgba(3, 10, 16, 0)");
    ctx.fillStyle = focus;
    ctx.beginPath();
    ctx.arc(0, 0, focusRadius, 0, Math.PI * 2);
    ctx.fill();

    this.renderPlayerBuffSignatures(ctx, cannon, pressure);

    if (this.cannonCharge > 0) {
      for (let i = 0; i < this.cannonCharge; i += 1) {
        const angle = -Math.PI / 2 + i * 0.58;
        ctx.fillStyle = "#ff9a3d";
        ctx.shadowColor = "rgba(255, 154, 61, 0.75)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * (this.player.radius + 16), Math.sin(angle) * (this.player.radius + 16), 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    const locatorRadius = this.player.radius + 18 + pressure * 5;
    ctx.strokeStyle = cannon ? `rgba(255, 248, 214, ${0.42 + pressure * 0.32})` : `rgba(226, 255, 255, ${0.44 + pressure * 0.34})`;
    ctx.shadowColor = cannon ? "rgba(255, 207, 90, 0.65)" : "rgba(117, 238, 226, 0.7)";
    ctx.shadowBlur = 8 + pressure * 14;
    ctx.lineWidth = 1.35 + pressure * 0.75;
    for (let i = 0; i < 4; i += 1) {
      const angle = this.elapsed * 0.22 + i * (Math.PI / 2);
      ctx.beginPath();
      ctx.arc(0, 0, locatorRadius, angle - 0.22 - pressure * 0.04, angle + 0.22 + pressure * 0.04);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = cannon ? "rgba(255, 207, 90, 0.7)" : "rgba(226, 255, 255, 0.68)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI / 4 + i * (Math.PI / 2);
      const inner = this.player.radius + 9 + pressure * 2;
      const outer = this.player.radius + 15 + pressure * 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.shadowColor = cannon ? "#ff9a3d" : "#75eee2";
    ctx.shadowBlur = cannon ? 26 : 18 + pressure * 10;
    ctx.fillStyle = "#071017";
    ctx.strokeStyle = cannon ? "rgba(255, 154, 61, 0.94)" : `rgba(190, 252, 255, ${0.9 + pressure * 0.08})`;
    ctx.lineWidth = 2.35 + pressure * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = cannon ? "rgba(255, 207, 90, 0.5)" : "rgba(117, 238, 226, 0.46)";
    ctx.lineWidth = 1.35;
    for (let i = 0; i < 4; i += 1) {
      const angle = this.elapsed * 0.35 + i * (Math.PI / 2);
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius * 1.16, angle + 0.18, angle + 0.82);
      ctx.stroke();
    }
    ctx.strokeStyle = cannon ? "rgba(255, 154, 61, 0.66)" : "rgba(117, 238, 226, 0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius * 0.56, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI / 4 + i * (Math.PI / 2);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * this.player.radius * 0.72, Math.sin(angle) * this.player.radius * 0.72, 1.45, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = cannon ? "#ffcf5a" : "#75eee2";
    ctx.shadowColor = cannon ? "rgba(255, 207, 90, 0.9)" : "rgba(117, 238, 226, 0.9)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, -1, (cannon ? 6.4 : 5.2) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.fillStyle = cannon ? "#fff8d6" : "#ecffff";
    ctx.beginPath();
    ctx.arc(0, -1, (cannon ? 2.4 : 2.1) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private renderPlayerBuffSignatures(ctx: CanvasRenderingContext2D, cannon: boolean, pressure: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.player.shield > 0) {
      this.drawShieldSignature(ctx, pressure);
    }
    if (this.activeMods.freezeTime > 0) {
      this.drawFreezeSignature(ctx, pressure);
    }
    if (this.activeMods.ricochetTime > 0) {
      this.drawRicochetSignature(ctx, pressure);
    }
    if (this.activeMods.splitTime > 0) {
      this.drawSplitSignature(ctx);
    }
    if (this.activeMods.pierceTime > 0) {
      this.drawPierceSignature(ctx);
    }
    if (this.activeMods.lightningTime > 0) {
      this.drawLightningSignature(ctx);
    }
    if (this.activeMods.explosionTime > 0 || cannon) {
      this.drawExplosionSignature(ctx, cannon);
    }
    if (this.activeMods.damageBoost > 0) {
      this.drawDamageSignature(ctx);
    }
    if (this.activeMods.focusTime > 0 || this.activeMods.seriousTime > 0) {
      this.drawFocusSignature(ctx, pressure);
    }

    ctx.restore();
  }

  private drawShieldSignature(ctx: CanvasRenderingContext2D, pressure: number): void {
    const r = this.player.radius + 17 + pressure * 3;
    const pulse = Math.sin(this.elapsed * 4.2) * 1.6;
    ctx.strokeStyle = "rgba(226, 255, 255, 0.82)";
    ctx.shadowColor = "rgba(117, 238, 226, 0.72)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.35;
    ctx.beginPath();
    ctx.arc(0, 0, r + pulse, Math.PI * 0.08, Math.PI * 0.92);
    ctx.arc(0, 0, r + pulse, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();

    ctx.lineWidth = 1.35;
    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI / 4 + i * (Math.PI / 2);
      const x = Math.cos(angle) * (r + 1);
      const y = Math.sin(angle) * (r + 1);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * 5, y - Math.sin(angle) * 5);
      ctx.lineTo(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6);
      ctx.stroke();
    }
  }

  private drawFreezeSignature(ctx: CanvasRenderingContext2D, pressure: number): void {
    const r = this.player.radius + 30 + pressure * 3;
    const spin = -this.elapsed * 0.28;
    ctx.strokeStyle = "rgba(182, 242, 255, 0.72)";
    ctx.shadowColor = "rgba(168, 236, 255, 0.68)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 1.75;
    for (let i = 0; i < 6; i += 1) {
      const angle = spin + Math.PI / 6 + i * (Math.PI / 3);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5.5, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-5.5, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(247, 253, 255, 0.58)";
    ctx.lineWidth = 1.15;
    for (let i = 0; i < 12; i += 1) {
      const angle = -spin * 1.4 + i * (Math.PI * 2 / 12);
      const inner = this.player.radius + 18 + (i % 3) * 2;
      const outer = this.player.radius + 42 + Math.sin(this.elapsed * 5 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle + 0.08) * outer, Math.sin(angle + 0.08) * outer);
      ctx.stroke();
    }
  }

  private drawRicochetSignature(ctx: CanvasRenderingContext2D, pressure: number): void {
    const r = this.player.radius + 33 + pressure * 4;
    const spin = this.elapsed * 0.42;
    ctx.strokeStyle = "rgba(124, 255, 155, 0.72)";
    ctx.shadowColor = "rgba(124, 255, 155, 0.6)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 4; i += 1) {
      const angle = spin + i * (Math.PI / 2);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-7, 4);
      ctx.lineTo(-1, -5);
      ctx.lineTo(8, -1);
      ctx.moveTo(-1, -5);
      ctx.lineTo(2, -9);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawSplitSignature(ctx: CanvasRenderingContext2D): void {
    const baseAngle = this.cannonTarget ? Math.atan2(this.cannonTarget.y - this.player.position.y, this.cannonTarget.x - this.player.position.x) : this.elapsed * 0.38 - Math.PI / 2;
    ctx.strokeStyle = "rgba(117, 238, 226, 0.58)";
    ctx.shadowColor = "rgba(117, 238, 226, 0.52)";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.45;
    for (let side = 0; side < 2; side += 1) {
      const origin = baseAngle + side * Math.PI;
      for (let i = -1; i <= 1; i += 1) {
        const angle = origin + i * Math.max(0.26, this.splitAngle);
        const inner = this.player.radius + 18;
        const outer = this.player.radius + (i === 0 ? 43 : 36);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.stroke();
      }
    }
  }

  private drawPierceSignature(ctx: CanvasRenderingContext2D): void {
    const angle = this.cannonTarget ? Math.atan2(this.cannonTarget.y - this.player.position.y, this.cannonTarget.x - this.player.position.x) : this.elapsed * 0.5;
    const inner = this.player.radius + 14;
    const outer = this.player.radius + 45;
    ctx.strokeStyle = "rgba(255, 248, 214, 0.76)";
    ctx.shadowColor = "rgba(255, 207, 90, 0.62)";
    ctx.shadowBlur = 13;
    ctx.lineWidth = 1.9;
    for (let side = 0; side < 2; side += 1) {
      const a = angle + side * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.moveTo(Math.cos(a + 0.16) * (outer - 8), Math.sin(a + 0.16) * (outer - 8));
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.lineTo(Math.cos(a - 0.16) * (outer - 8), Math.sin(a - 0.16) * (outer - 8));
      ctx.stroke();
    }
  }

  private drawLightningSignature(ctx: CanvasRenderingContext2D): void {
    const spin = this.elapsed * 0.86;
    const r = this.player.radius + 31;
    ctx.strokeStyle = "rgba(229, 255, 102, 0.86)";
    ctx.fillStyle = "rgba(12, 24, 23, 0.88)";
    ctx.shadowColor = "rgba(229, 255, 102, 0.82)";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 1.9;
    for (let i = 0; i < 3; i += 1) {
      const angle = spin + i * (Math.PI * 2 / 3);
      ctx.save();
      ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 6.4, -Math.PI * 0.72, Math.PI * 0.1);
      ctx.stroke();
      ctx.strokeStyle = "rgba(247, 253, 255, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-1.8, -4.2);
      ctx.lineTo(1.4, -0.8);
      ctx.lineTo(-0.8, 0.9);
      ctx.lineTo(2.0, 4.4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = "rgba(143, 248, 255, 0.72)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 5; i += 1) {
      const angle = -spin * 1.7 + i * (Math.PI * 2 / 5);
      const inner = this.player.radius + 20 + (i % 2) * 3;
      const mid = inner + 8;
      const outer = inner + 17;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle + 0.18) * mid, Math.sin(angle + 0.18) * mid);
      ctx.lineTo(Math.cos(angle - 0.12) * outer, Math.sin(angle - 0.12) * outer);
      ctx.stroke();
    }
  }

  private drawExplosionSignature(ctx: CanvasRenderingContext2D, cannon: boolean): void {
    const r = this.player.radius + 22 + Math.sin(this.elapsed * 8.5) * 2;
    const points = cannon ? 8 : 6;
    ctx.strokeStyle = cannon ? "rgba(255, 207, 90, 0.84)" : "rgba(255, 122, 47, 0.74)";
    ctx.shadowColor = cannon ? "rgba(255, 207, 90, 0.8)" : "rgba(255, 122, 47, 0.72)";
    ctx.shadowBlur = cannon ? 18 : 14;
    ctx.lineWidth = cannon ? 2.15 : 1.8;
    for (let i = 0; i < points; i += 1) {
      const angle = this.elapsed * -0.3 + i * (Math.PI * 2 / points);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (r - 7), Math.sin(angle) * (r - 7));
      ctx.lineTo(Math.cos(angle) * (r + (cannon ? 11 : 8)), Math.sin(angle) * (r + (cannon ? 11 : 8)));
      ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius + 15, 0.18, Math.PI * 1.72);
    ctx.stroke();
  }

  private drawDamageSignature(ctx: CanvasRenderingContext2D): void {
    const r = this.player.radius + 27;
    const spin = this.elapsed * 1.1;
    ctx.strokeStyle = "rgba(255, 226, 120, 0.76)";
    ctx.fillStyle = "rgba(45, 18, 4, 0.84)";
    ctx.shadowColor = "rgba(255, 154, 61, 0.64)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.55;
    for (let i = 0; i < 3; i += 1) {
      const angle = spin + i * (Math.PI * 2 / 3);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-3.5, 6);
      ctx.quadraticCurveTo(-7, 0, -3.5, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 248, 214, 0.7)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-1.5, 0);
      ctx.lineTo(4.6, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawFocusSignature(ctx: CanvasRenderingContext2D, pressure: number): void {
    const serious = this.activeMods.seriousTime > 0;
    const r = this.player.radius + 27 + pressure * 4;
    ctx.strokeStyle = serious ? "rgba(255, 74, 95, 0.78)" : "rgba(226, 255, 255, 0.72)";
    ctx.shadowColor = serious ? "rgba(255, 74, 95, 0.66)" : "rgba(117, 238, 226, 0.58)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.65;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 0.05, Math.PI * 0.45);
    ctx.arc(0, 0, r, Math.PI * 0.55, Math.PI * 0.95);
    ctx.arc(0, 0, r, Math.PI * 1.05, Math.PI * 1.45);
    ctx.arc(0, 0, r, Math.PI * 1.55, Math.PI * 1.95);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const angle = i * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (r - 7), Math.sin(angle) * (r - 7));
      ctx.lineTo(Math.cos(angle) * (r + 8), Math.sin(angle) * (r + 8));
      ctx.stroke();
    }
  }

  private playerEnemyPressure(): number {
    let nearby = 0;
    for (const enemy of this.enemies) {
      const range = 112 + enemy.radius;
      if (distance(enemy.position, this.player.position) < range) nearby += enemy.type === "brute" || enemy.type === "target" ? 1.4 : 1;
    }
    return clamp(nearby / 8, 0, 1);
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      if (enemy.type === "silencer") {
        ctx.fillStyle = "rgba(128, 112, 196, 0.1)";
        ctx.beginPath();
        ctx.arc(0, 0, 145, 0, Math.PI * 2);
        ctx.fill();
      }
      this.renderOrbitRuinsEnemy(ctx, enemy);
      const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      if (hpRatio < 0.985) {
        const hpY = -this.enemyVisualHalfSize(enemy) - 6;
        ctx.fillStyle = "rgba(19, 20, 24, 0.72)";
        ctx.fillRect(-enemy.radius, hpY, enemy.radius * 2, 4);
        ctx.fillStyle = "#a9e888";
        ctx.fillRect(-enemy.radius, hpY, enemy.radius * 2 * hpRatio, 4);
      }
      ctx.restore();
    }
  }

  private renderOrbitRuinsEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    const art = LINEGLOW_ENEMY_ART[enemy.type];
    const radius = enemy.radius;
    const enemyImage = this.readyEnemySprite(enemy);
    if (enemyImage) {
      this.renderEnemyReadabilityCue(ctx, enemy);
      this.renderOrbitRuinsEnemySprite(ctx, enemy, enemyImage);
      if (enemy.type === "target") {
        ctx.strokeStyle = art.outline;
        ctx.lineWidth = 2;
        ctx.shadowColor = art.glow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        const ringRadius = radius * 1.36 + Math.sin(this.elapsed * 5) * 2;
        ctx.arc(0, 0, ringRadius, Math.PI * 0.08, Math.PI * 0.46);
        ctx.moveTo(Math.cos(Math.PI * 0.54) * ringRadius, Math.sin(Math.PI * 0.54) * ringRadius);
        ctx.arc(0, 0, ringRadius, Math.PI * 0.54, Math.PI * 0.92);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (enemy.frozen > 0) {
        this.renderFrozenShell(ctx, radius);
      }
      return;
    }

    const rim = enemy.frozen > 0 ? "#a8ecff" : art.outline;
    const core = enemy.frozen > 0 ? "#e8fbff" : art.accent;
    ctx.shadowColor = enemy.frozen > 0 ? "rgba(168, 236, 255, 0.58)" : art.glow;
    ctx.shadowBlur = enemy.type === "target" ? 20 : enemy.type === "silencer" ? 18 : 12;
    ctx.fillStyle = art.base;
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (enemy.type) {
      case "runner":
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.98, radius * 0.64, 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.42, -radius * 0.14);
        ctx.lineTo(radius * 0.46, radius * 0.1);
        ctx.stroke();
        break;
      case "brute":
        ctx.beginPath();
        for (let i = 0; i < 7; i += 1) {
          const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 7;
          const x = Math.cos(angle) * radius * (i % 2 === 0 ? 1.06 : 0.9);
          const y = Math.sin(angle) * radius * (i % 2 === 0 ? 1.06 : 0.9);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.48, -radius * 0.34);
        ctx.lineTo(-radius * 0.1, radius * 0.04);
        ctx.lineTo(radius * 0.38, -radius * 0.22);
        ctx.moveTo(-radius * 0.28, radius * 0.46);
        ctx.lineTo(radius * 0.2, radius * 0.16);
        ctx.lineTo(radius * 0.5, radius * 0.48);
        ctx.stroke();
        break;
      case "pouncer":
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.2);
        ctx.lineTo(radius * 0.96, radius * 0.82);
        ctx.lineTo(0, radius * 0.46);
        ctx.lineTo(-radius * 0.96, radius * 0.82);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.78);
        ctx.lineTo(0, radius * 0.34);
        ctx.stroke();
        break;
      case "ranged":
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.92, radius * 0.76, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(radius * 0.2, 0);
        ctx.lineTo(radius * 1.26, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "repeater":
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 2.1;
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI * 2 * i) / 6 + this.elapsed * 0.8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * radius * 0.34, Math.sin(angle) * radius * 0.34);
          ctx.lineTo(Math.cos(angle) * radius * 1.02, Math.sin(angle) * radius * 1.02);
          ctx.stroke();
        }
        ctx.fillStyle = art.base;
        ctx.strokeStyle = rim;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case "silencer":
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "rgba(177, 108, 255, 0.58)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.52, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = rim;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.78, radius * 0.94, 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.42, Math.PI * 0.15, Math.PI * 1.85);
        ctx.stroke();
        break;
      case "target":
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.08);
        ctx.lineTo(radius * 1.05, 0);
        ctx.lineTo(0, radius * 1.08);
        ctx.lineTo(-radius * 1.05, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = art.plate;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        const ringRadius = radius * 1.34 + Math.sin(this.elapsed * 5) * 2;
        ctx.arc(0, 0, ringRadius, Math.PI * 0.08, Math.PI * 0.46);
        ctx.moveTo(Math.cos(Math.PI * 0.54) * ringRadius, Math.sin(Math.PI * 0.54) * ringRadius);
        ctx.arc(0, 0, ringRadius, Math.PI * 0.54, Math.PI * 0.92);
        ctx.stroke();
        break;
    }

    if (enemy.frozen > 0) {
      this.renderFrozenShell(ctx, radius);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = core;
    ctx.shadowColor = core;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3.2, radius * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private renderFrozenShell(ctx: CanvasRenderingContext2D, radius: number): void {
    const pulse = 1 + Math.sin(this.elapsed * 7.2) * 0.035;
    const shellRadius = radius * 1.16 * pulse;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(189, 242, 255, 0.92)";
    ctx.fillStyle = "rgba(168, 236, 255, 0.12)";
    ctx.shadowColor = "rgba(168, 236, 255, 0.74)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 8;
      const pointRadius = shellRadius * (i % 2 === 0 ? 1.08 : 0.94);
      const x = Math.cos(angle) * pointRadius;
      const y = Math.sin(angle) * pointRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(247, 253, 255, 0.86)";
    ctx.lineWidth = 1.25;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i += 1) {
      const angle = this.elapsed * 0.18 + i * (Math.PI * 2 / 5);
      const inner = radius * (0.18 + (i % 2) * 0.1);
      const mid = radius * 0.62;
      const outer = shellRadius * 0.94;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle + 0.22) * mid, Math.sin(angle + 0.22) * mid);
      ctx.lineTo(Math.cos(angle - 0.12) * outer, Math.sin(angle - 0.12) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderOrbitRuinsEnemySprite(ctx: CanvasRenderingContext2D, enemy: Enemy, image: HTMLImageElement): void {
    const art = LINEGLOW_ENEMY_ART[enemy.type];
    const size = enemy.radius * LINEGLOW_ENEMY_DRAW_SCALE[enemy.type];
    const pulse = enemy.type === "target" ? 1 + Math.sin(this.elapsed * 5) * 0.035 : 1;
    const squash = enemy.type === "runner" ? 1.08 : 1;
    const rotation = enemy.type === "ranged"
      ? this.enemyAimFacing(enemy)
      : enemy.type === "runner" || enemy.type === "pouncer"
        ? this.enemyMoveFacing(enemy)
        : 0;

    ctx.save();
    ctx.rotate(rotation);
    ctx.scale(pulse, pulse * squash);
    ctx.shadowColor = enemy.frozen > 0 ? "rgba(168, 236, 255, 0.58)" : art.glow;
    ctx.shadowBlur = enemy.type === "target" ? 18 : enemy.type === "silencer" ? 16 : 11;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  private enemyVisualHalfSize(enemy: Enemy): number {
    return enemy.radius * (LINEGLOW_ENEMY_DRAW_SCALE[enemy.type] / 2);
  }

  private enemyMoveFacing(enemy: Enemy): number {
    const move = normalize(enemy.velocity);
    if (Math.hypot(move.x, move.y) > 0.05) return Math.atan2(move.y, move.x);
    return this.enemyAimFacing(enemy);
  }

  private enemyAimFacing(enemy: Enemy): number {
    const toPlayer = normalize({
      x: this.player.position.x - enemy.position.x,
      y: this.player.position.y - enemy.position.y,
    });
    return Math.atan2(toPlayer.y, toPlayer.x);
  }

  private enemySprite(enemy: Enemy): HTMLImageElement {
    const variant = (enemy.id % LINEGLOW_ENEMY_VARIANTS) + 1;
    const key = `${enemy.type}_${String(variant).padStart(2, "0")}`;
    let image = this.enemySprites.get(key);
    if (!image) {
      image = new Image();
      image.decoding = "async";
      image.src = `${LINEGLOW_ENEMY_SPRITE_BASE}/${key}.png`;
      this.enemySprites.set(key, image);
    }
    return image;
  }

  private readyEnemySprite(enemy: Enemy): HTMLImageElement | null {
    const image = this.enemySprite(enemy);
    return image.complete && image.naturalWidth > 0 ? image : null;
  }

  private renderEnemyReadabilityCue(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    const art = LINEGLOW_ENEMY_ART[enemy.type];
    const radius = enemy.radius;
    const moveFacing = this.enemyMoveFacing(enemy);
    const aimFacing = this.enemyAimFacing(enemy);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = art.glow;
    ctx.shadowBlur = 5;
    ctx.globalAlpha = 0.68;

    switch (enemy.type) {
      case "runner":
        ctx.rotate(moveFacing);
        ctx.strokeStyle = "rgba(255, 194, 71, 0.26)";
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(-radius * 1.1, -radius * 0.32);
        ctx.quadraticCurveTo(-radius * 1.55, -radius * 0.5, -radius * 1.95, -radius * 0.36);
        ctx.moveTo(-radius * 1.1, radius * 0.32);
        ctx.quadraticCurveTo(-radius * 1.55, radius * 0.5, -radius * 1.95, radius * 0.36);
        ctx.stroke();
        break;
      case "brute":
        ctx.strokeStyle = "rgba(255, 154, 61, 0.52)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.42, Math.PI * 0.12, Math.PI * 0.42);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.42, Math.PI * 0.58, Math.PI * 0.88);
        ctx.stroke();
        break;
      case "pouncer":
        ctx.rotate(moveFacing);
        ctx.strokeStyle = enemy.windup > 0 ? "rgba(255, 232, 114, 0.78)" : "rgba(255, 194, 71, 0.5)";
        ctx.lineWidth = enemy.windup > 0 ? 2.2 : 1.55;
        ctx.beginPath();
        ctx.moveTo(-radius * 1.28, -radius * 0.62);
        ctx.quadraticCurveTo(-radius * 1.88, 0, -radius * 1.28, radius * 0.62);
        ctx.moveTo(-radius * 0.9, -radius * 0.42);
        ctx.quadraticCurveTo(-radius * 1.28, 0, -radius * 0.9, radius * 0.42);
        ctx.stroke();
        break;
      case "ranged": {
        ctx.rotate(aimFacing);
        ctx.strokeStyle = "rgba(117, 238, 226, 0.56)";
        ctx.lineWidth = 1.55;
        ctx.beginPath();
        ctx.moveTo(radius * 1.1, 0);
        ctx.lineTo(radius * 1.54, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.2, Math.PI * 1.72, Math.PI * 0.28);
        ctx.moveTo(Math.cos(Math.PI * 0.72) * radius * 1.2, Math.sin(Math.PI * 0.72) * radius * 1.2);
        ctx.arc(0, 0, radius * 1.2, Math.PI * 0.72, Math.PI * 1.28);
        ctx.stroke();
        break;
      }
      case "repeater":
        ctx.strokeStyle = "rgba(156, 255, 138, 0.5)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 4; i += 1) {
          const angle = this.elapsed * 1.45 + i * (Math.PI / 2);
          ctx.beginPath();
          ctx.arc(0, 0, radius * 1.36, angle, angle + Math.PI * 0.18);
          ctx.stroke();
        }
        break;
      case "silencer":
        ctx.strokeStyle = "rgba(177, 108, 255, 0.54)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.58 + Math.sin(this.elapsed * 4) * 1.6, Math.PI * 0.16, Math.PI * 0.84);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.92 + Math.sin(this.elapsed * 3) * 2, Math.PI * 0.34, Math.PI * 0.66);
        ctx.stroke();
        break;
      case "target":
        break;
    }

    ctx.restore();
  }

  private drawLeafFin(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, fill: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.quadraticCurveTo(14, -5, 18, 0);
    ctx.quadraticCurveTo(14, 5, 0, 7);
    ctx.quadraticCurveTo(4, 0, 0, -7);
    ctx.fill();
    ctx.restore();
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const projectile of this.projectiles) {
      const color = projectile.explosion ? "#ff9a3d" : projectile.freeze ? "#a8ecff" : projectile.lightning ? "#e5ff66" : "#75eee2";
      const tail = normalize({ x: -projectile.velocity.x, y: -projectile.velocity.y });
      ctx.strokeStyle = projectile.explosion
        ? "rgba(255, 154, 61, 0.38)"
        : projectile.lightning
          ? "rgba(229, 255, 102, 0.48)"
          : projectile.freeze
            ? "rgba(168, 236, 255, 0.38)"
            : "rgba(117, 238, 226, 0.34)";
      ctx.lineWidth = Math.max(2, projectile.radius * 0.72);
      ctx.beginPath();
      ctx.moveTo(projectile.position.x, projectile.position.y);
      ctx.lineTo(projectile.position.x + tail.x * 24, projectile.position.y + tail.y * 24);
      ctx.stroke();
      if (projectile.lightning) {
        ctx.strokeStyle = "rgba(247, 253, 255, 0.78)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(projectile.position.x + tail.y * 6, projectile.position.y - tail.x * 6);
        ctx.lineTo(projectile.position.x + tail.x * 10, projectile.position.y + tail.y * 10);
        ctx.lineTo(projectile.position.x - tail.y * 7, projectile.position.y + tail.x * 7);
        ctx.moveTo(projectile.position.x - tail.x * 7 + tail.y * 4, projectile.position.y - tail.y * 7 - tail.x * 4);
        ctx.lineTo(projectile.position.x - tail.x * 18 - tail.y * 8, projectile.position.y - tail.y * 18 + tail.x * 8);
        ctx.stroke();
      }
      if (projectile.pierce > 0) {
        ctx.strokeStyle = "rgba(117, 238, 226, 0.72)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(projectile.position.x + tail.y * 5, projectile.position.y - tail.x * 5);
        ctx.lineTo(projectile.position.x - tail.x * 18 + tail.y * 5, projectile.position.y - tail.y * 18 - tail.x * 5);
        ctx.moveTo(projectile.position.x - tail.y * 5, projectile.position.y + tail.x * 5);
        ctx.lineTo(projectile.position.x - tail.x * 18 - tail.y * 5, projectile.position.y - tail.y * 18 + tail.x * 5);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(34, 41, 46, 0.58)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  private renderEnemyShots(ctx: CanvasRenderingContext2D): void {
    for (const shot of this.enemyShots) {
      ctx.fillStyle = "#ff4a5f";
      ctx.shadowColor = "rgba(255, 74, 95, 0.56)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(shot.position.x, shot.position.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private renderPlayerAfterimages(ctx: CanvasRenderingContext2D): void {
    if (this.afterimages.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const image of this.afterimages) {
      const alpha = clamp(image.life / image.maxLife, 0, 1);
      const progress = 1 - alpha;
      ctx.save();
      ctx.globalAlpha = alpha * 0.34;
      ctx.translate(image.position.x, image.position.y);
      ctx.rotate(image.angle);
      ctx.scale(image.stretch + progress * 0.24, 1 / Math.max(1, image.stretch * 0.78));
      ctx.fillStyle = image.color;
      ctx.shadowColor = image.color;
      ctx.shadowBlur = 18 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, image.radius * (1 + progress * 0.42), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.46;
      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private renderDrops(ctx: CanvasRenderingContext2D): void {
    for (const drop of this.drops) {
      const pullDistance = distance(drop.position, this.player.position);
      if (pullDistance < Math.min(150, this.magnetRadius + drop.magnet)) {
        const alpha = clamp(1 - pullDistance / 150, 0, 1) * 0.32;
        ctx.strokeStyle = `rgba(117, 238, 226, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drop.position.x, drop.position.y);
        ctx.quadraticCurveTo(
          (drop.position.x + this.player.position.x) / 2,
          (drop.position.y + this.player.position.y) / 2 - 12,
          this.player.position.x,
          this.player.position.y,
        );
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(drop.position.x, drop.position.y);
      ctx.rotate(Math.PI / 4 + this.elapsed * 0.8);
      ctx.fillStyle = "#9cff8a";
      ctx.shadowColor = "rgba(156, 255, 138, 0.5)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.rect(-drop.radius * 0.68, -drop.radius * 0.68, drop.radius * 1.36, drop.radius * 1.36);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(216, 255, 246, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderTurrets(ctx: CanvasRenderingContext2D): void {
    for (const turret of this.turrets) {
      ctx.save();
      ctx.translate(turret.position.x, turret.position.y);
      ctx.fillStyle = "#10191d";
      ctx.strokeStyle = "rgba(117, 238, 226, 0.86)";
      ctx.shadowColor = "rgba(117, 238, 226, 0.5)";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(156, 255, 138, 0.76)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-8, 0);
      ctx.moveTo(8, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.fillStyle = "#9cff8a";
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private renderOrbitWeapons(ctx: CanvasRenderingContext2D): void {
    if (this.guardTurretCount > 0) {
      for (let i = 0; i < this.guardTurretCount; i += 1) {
        const position = this.guardTurretPosition(i);
        const aimAngle = this.guardTurretAimAngle(position);
        const pulse = 0.85 + Math.sin(this.elapsed * 5.2 + i) * 0.15;
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(aimAngle);
        ctx.fillStyle = "#10191d";
        ctx.strokeStyle = "rgba(117, 238, 226, 0.84)";
        ctx.shadowColor = "rgba(117, 238, 226, 0.5)";
        ctx.shadowBlur = 11;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(156, 255, 138, 0.72)";
        ctx.shadowColor = "rgba(156, 255, 138, 0.42)";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-2, 0, 6.5 * pulse, Math.PI * 0.56, Math.PI * 1.44);
        ctx.stroke();

        ctx.lineCap = "round";
        ctx.lineWidth = 2.3;
        ctx.strokeStyle = "rgba(156, 255, 138, 0.82)";
        ctx.beginPath();
        ctx.moveTo(7.5, 0);
        ctx.lineTo(17.5, 0);
        ctx.stroke();

        ctx.fillStyle = "#dff9ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(18.5, 0, 2.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#9cff8a";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 3.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(226, 255, 255, 0.86)";
        ctx.beginPath();
        ctx.arc(1.1, -1, 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
    if (this.bladeCount > 0) {
      ctx.strokeStyle = "rgba(117, 238, 226, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.player.position.x, this.player.position.y, this.bladeRadius, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < this.bladeCount; i += 1) {
        const position = this.bladePosition(i);
        const angle = this.bladeAngle + (Math.PI * 2 * i) / Math.max(1, this.bladeCount);
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.strokeStyle = "rgba(177, 108, 255, 0.92)";
        ctx.shadowColor = "rgba(177, 108, 255, 0.72)";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 11, -Math.PI * 0.82, Math.PI * 0.28);
        ctx.stroke();
        ctx.strokeStyle = "rgba(117, 238, 226, 0.72)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-7, 8);
        ctx.lineTo(7, -8);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
