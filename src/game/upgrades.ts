import { MARBLE, PLAYER } from "./config";
import type { Upgrade, UpgradeId } from "./types";

export const UPGRADES: Upgrade[] = [
  {
    id: "extraDamage",
    rarity: "bronze",
    title: "强力反弹",
    description: "每次撞墙后的弹珠伤害 +1。",
    weight: 10,
    apply: (stats) => { stats.bounceBonusDamage += 1; },
  },
  {
    id: "longerRange",
    rarity: "bronze",
    title: "长程校准",
    description: "弹珠最大飞行距离 +6m。",
    weight: 10,
    apply: (stats) => { stats.rangeBonus += 6; },
  },
  {
    id: "recallBlade",
    rarity: "gold",
    title: "回收刀锋",
    description: "弹珠回收时造成额外伤害。",
    weight: 5,
    apply: (stats) => { stats.recallDamageBonus += 1; },
  },
  {
    id: "quickDash",
    rarity: "bronze",
    title: "瞬闪熟练",
    description: "瞬闪冷却 -0.25s。",
    weight: 8,
    apply: (_stats, player) => { player.dashCooldown = Math.max(0.4, player.dashCooldown - 0.25); },
  },
  {
    id: "vitality",
    rarity: "bronze",
    title: "生命强化",
    description: "立即 +1 HP，本局 HP 上限 +1。",
    weight: 7,
    apply: (stats, player) => {
      stats.maxHp += 1;
      player.hp = Math.min(stats.maxHp, player.hp + 1);
    },
  },
  {
    id: "humanCannon",
    rarity: "diamond",
    title: "人间大炮",
    description: "特殊爆发：短时间把自己发射出去，撞击造成高伤害。",
    weight: 2,
    uniquePerRun: true,
    apply: () => {},
  },
  {
    id: "piercingMarble",
    rarity: "gold",
    title: "穿透弹珠",
    description: "弹珠血量 +1，可穿透多个敌人再回收。",
    weight: 4,
    apply: (stats) => { stats.marbleHp += 1; },
  },
  // ── 青铜卡 ──
  {
    id: "sprintTraining",
    rarity: "bronze",
    title: "疾跑训练",
    description: "移动速度 +0.4。",
    weight: 9,
    apply: (stats) => { stats.speedBonus += 0.4; },
  },
  {
    id: "rollMastery",
    rarity: "bronze",
    title: "翻滚精进",
    description: "翻滚位移距离 +2。",
    weight: 8,
    apply: (stats) => { stats.dashDistanceBonus += 2; },
  },
  {
    id: "lightMarble",
    rarity: "bronze",
    title: "轻量弹珠",
    description: "弹珠飞行速度 +20%。",
    weight: 9,
    apply: (stats) => { stats.marbleSpeedMultiplier += 0.2; },
  },
  {
    id: "multiBounce",
    rarity: "bronze",
    title: "多段弹跳",
    description: "弹珠最大弹跳次数 +1。",
    weight: 8,
    apply: (stats) => { stats.maxBouncesBonus += 1; },
  },
  {
    id: "sizeAmplify",
    rarity: "bronze",
    title: "尺寸增幅",
    description: "弹珠半径 +0.12，命中范围更大。",
    weight: 7,
    apply: (stats) => { stats.marbleRadiusBonus += 0.12; },
  },
  {
    id: "expandedPouch",
    rarity: "bronze",
    title: "腰包扩容",
    description: "HP 上限 +1，立即回复 1 HP，基础伤害 +1。",
    weight: 6,
    apply: (stats, player) => {
      stats.maxHp += 1;
      player.hp = Math.min(stats.maxHp, player.hp + 1);
      stats.baseDamageBonus += 1;
    },
  },
  {
    id: "trajectoryFamiliarity",
    rarity: "bronze",
    title: "轨迹熟悉",
    description: "预瞄额外显示 1 段反弹轨迹。",
    weight: 7,
    apply: (stats) => { stats.trajectoryBonusBounces += 1; },
  },
  {
    id: "steadyGrip",
    rarity: "bronze",
    title: "稳定握持",
    description: "弹珠辅助瞄准角度 +3°。",
    weight: 8,
    apply: (stats) => { stats.homingAngle += 3; },
  },
  // ── 黄金卡 ──
  {
    id: "hunterCalibration",
    rarity: "gold",
    title: "猎手校准",
    description: "基础伤害 +2，更快清除目标。",
    weight: 5,
    apply: (stats) => { stats.baseDamageBonus += 2; },
  },
  {
    id: "swiftRecall",
    rarity: "gold",
    title: "迅捷回收",
    description: "弹珠回收速度 +60%。",
    weight: 5,
    apply: (stats) => { stats.recallSpeedMultiplier += 0.6; },
  },
  {
    id: "rapidThrow",
    rarity: "gold",
    title: "速射抛投",
    description: "弹珠飞行速度 +30%，最大弹跳 +1。",
    weight: 4,
    apply: (stats) => {
      stats.marbleSpeedMultiplier += 0.3;
      stats.maxBouncesBonus += 1;
    },
  },
  {
    id: "crisisConcentration",
    rarity: "gold",
    title: "绝境专注",
    description: "辅助瞄准锥角 +15°，更容易命中敌人。",
    weight: 4,
    apply: (stats) => { stats.homingAngle += 15; },
  },
  // ── 黄金卡·复杂系统 ──
  {
    id: "shieldTrait",
    rarity: "gold",
    title: "护盾特性",
    description: "击杀怪物获得 1 层护盾（最多 3 层）。护盾优先抵挡伤害。",
    weight: 4,
    apply: (stats) => { stats.hasShieldTrait = true; },
  },
  {
    id: "vampirism",
    rarity: "gold",
    title: "吸血特性",
    description: "每次击杀怪物后恢复 1 HP（不超过上限）。",
    weight: 4,
    apply: (stats) => { stats.hasVampirism = true; },
  },
  {
    id: "momentumContinue",
    rarity: "gold",
    title: "余势不止",
    description: "弹珠击杀怪物后恢复 1 点弹珠耐久。",
    weight: 4,
    apply: (stats) => { stats.hasMomentumContinue = true; },
  },
  {
    id: "chainLoading",
    rarity: "gold",
    title: "连锁装填",
    description: "每次击杀敌人后，下次蓄力时间 -15%（最多叠加至 -50%）。",
    weight: 4,
    apply: (stats) => { stats.hasChainLoading = true; },
  },
  {
    id: "fragmentTrajectory",
    rarity: "gold",
    title: "破片弹道",
    description: "弹珠首次击杀时，向两侧各派生一枚辅助弹珠。",
    weight: 3,
    apply: (stats) => { stats.hasFragment = true; },
  },
  {
    id: "shockKnockback",
    rarity: "gold",
    title: "强震击退",
    description: "弹珠撞墙时，对附近敌人造成 1 点伤害。",
    weight: 4,
    apply: (stats) => { stats.hasShockKnockback = true; },
  },
  {
    id: "perfectRecallDamage",
    rarity: "gold",
    title: "完美回收",
    description: "精准回收命中敌人后，下次发射伤害 +50%。",
    weight: 3,
    apply: (stats) => { stats.hasPerfectRecallDamage = true; },
  },
  // ── 钻石卡 ──
  {
    id: "tripleShot",
    rarity: "diamond",
    title: "一键三连",
    description: "每次发射时，同时向两侧各派生一枚辅助弹珠。",
    weight: 2,
    uniquePerRun: true,
    apply: (stats) => { stats.hasTripleShot = true; },
  },
  {
    id: "freezeHit",
    rarity: "diamond",
    title: "冻住不许走",
    description: "弹珠弹射命中冻结 2 秒；直线命中减速 1 秒。",
    weight: 2,
    uniquePerRun: true,
    apply: (stats) => { stats.hasFreezeHit = true; },
  },
  {
    id: "growingMarble",
    rarity: "diamond",
    title: "是你吗沙师弟",
    description: "弹珠每次弹射后半径增大，命中范围越来越大。",
    weight: 2,
    uniquePerRun: true,
    apply: (stats) => { stats.hasGrowingMarble = true; },
  },
  {
    id: "drillMarble",
    rarity: "diamond",
    title: "我的钻头",
    description: "弹珠血量 +2，可穿透所有敌人，无冷却命中。",
    weight: 2,
    uniquePerRun: true,
    apply: (stats) => { stats.marbleHp += 2; stats.hasDrillMarble = true; },
  },
];

export function findUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export const DEFAULT_UPGRADE_STATS = () => ({
  bounceBonusDamage: 0,
  rangeMultiplier: 1,
  rangeBonus: 0,
  recallDamageBonus: 0,
  maxHp: PLAYER.hp,
  marbleHp: MARBLE.hp,
  homingAngle: MARBLE.homingAngle,
  speedBonus: 0,
  dashDistanceBonus: 0,
  marbleSpeedMultiplier: 1,
  maxBouncesBonus: 0,
  trajectoryBonusBounces: 0,
  marbleRadiusBonus: 0,
  baseDamageBonus: 0,
  recallSpeedMultiplier: 1,
  hasShieldTrait: false,
  hasVampirism: false,
  hasMomentumContinue: false,
  hasChainLoading: false,
  hasFragment: false,
  hasShockKnockback: false,
  hasTripleShot: false,
  hasFreezeHit: false,
  hasGrowingMarble: false,
  hasDrillMarble: false,
  hasPerfectRecallDamage: false,
});

/**
 * 两阶段抽卡：
 * 1. 按波次和连铜保底计算稀有度概率，先抽出目标稀有度。
 * 2. 再从该稀有度的可用牌中按 weight 加权抽牌。
 *    若目标稀有度池耗尽，则退回到全池加权抽取。
 *
 * 波次权重（%）：
 *   波次 1-3  → 铜 75 / 金 20 / 钻 5
 *   波次 4+   → 铜 55 / 金 35 / 钻 10
 * 连铜保底：连续 2 次（含）以上选铜卡后，金卡权重 +20，铜卡权重 -20。
 */
export function draftUpgrades(count: number, wave: number, blockedIds: ReadonlySet<UpgradeId> = new Set(), bronzeStreak = 0): Upgrade[] {
  const earlyWave = wave <= 3;
  let bronzeW = earlyWave ? 75 : 55;
  let goldW = earlyWave ? 20 : 35;
  const diamondW = earlyWave ? 5 : 10;

  // 连铜保底：+20 金卡权重
  if (bronzeStreak >= 2) {
    const boost = Math.min(bronzeW - 5, 20);
    bronzeW -= boost;
    goldW += boost;
  }

  const pickRarity = (): "bronze" | "gold" | "diamond" => {
    const total = bronzeW + goldW + diamondW;
    const r = Math.random() * total;
    if (r < bronzeW) return "bronze";
    if (r < bronzeW + goldW) return "gold";
    return "diamond";
  };

  const pool = UPGRADES.filter((upgrade) => {
    if (blockedIds.has(upgrade.id)) return false;
    return upgrade.rarity !== "diamond" || wave >= 2;
  });

  const weightedPick = (candidates: Upgrade[]): Upgrade | null => {
    const total = candidates.reduce((sum, u) => sum + u.weight, 0);
    if (total <= 0) return null;
    let roll = Math.random() * total;
    for (const u of candidates) {
      roll -= u.weight;
      if (roll <= 0) return u;
    }
    return candidates[candidates.length - 1] ?? null;
  };

  const choices: Upgrade[] = [];
  const used = new Set<string>();

  while (choices.length < count) {
    const available = pool.filter((u) => !used.has(u.id));
    if (available.length === 0) break;

    const rarity = pickRarity();
    const rarityAvailable = available.filter((u) => u.rarity === rarity);
    const pick = rarityAvailable.length > 0 ? weightedPick(rarityAvailable) : weightedPick(available);
    if (!pick) break;
    choices.push(pick);
    used.add(pick.id);
  }

  return choices;
}
