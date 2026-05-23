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
    title: "远程弹射",
    description: "弹珠飞行距离 +25%。",
    weight: 10,
    apply: (stats) => { stats.rangeMultiplier += 0.25; },
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
    title: "轻盈步伐",
    description: "翻滚冷却 -18%。",
    weight: 8,
    apply: (_stats, player) => { player.dashCooldown *= 0.82; },
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
];

export function findUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export const DEFAULT_UPGRADE_STATS = () => ({
  bounceBonusDamage: 0,
  rangeMultiplier: 1,
  recallDamageBonus: 0,
  maxHp: PLAYER.hp,
  marbleHp: MARBLE.hp,
  homingAngle: MARBLE.homingAngle,
});

export function draftUpgrades(count: number, wave: number, blockedIds: ReadonlySet<UpgradeId> = new Set()): Upgrade[] {
  const pool = UPGRADES.filter((upgrade) => {
    if (blockedIds.has(upgrade.id)) {
      return false;
    }
    return upgrade.rarity !== "diamond" || wave >= 2;
  });
  const choices: Upgrade[] = [];
  const used = new Set<string>();

  while (choices.length < count && used.size < pool.length) {
    const totalWeight = pool.reduce((sum, upgrade) => sum + (used.has(upgrade.id) ? 0 : upgrade.weight), 0);
    let roll = Math.random() * totalWeight;
    for (const upgrade of pool) {
      if (used.has(upgrade.id)) {
        continue;
      }
      roll -= upgrade.weight;
      if (roll <= 0) {
        choices.push(upgrade);
        used.add(upgrade.id);
        break;
      }
    }
  }

  return choices;
}
