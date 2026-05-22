import type { Upgrade } from "./types";

export const UPGRADES: Upgrade[] = [
  {
    id: "extraDamage",
    rarity: "common",
    title: "强力反弹",
    description: "每次撞墙后的弹珠伤害 +1。",
    weight: 10,
  },
  {
    id: "longerRange",
    rarity: "common",
    title: "远程弹射",
    description: "弹珠飞行距离 +25%。",
    weight: 10,
  },
  {
    id: "recallBlade",
    rarity: "rare",
    title: "回收刀锋",
    description: "弹珠回收时造成额外伤害。",
    weight: 5,
  },
  {
    id: "quickDash",
    rarity: "common",
    title: "轻盈步伐",
    description: "冲刺冷却 -18%。",
    weight: 8,
  },
  {
    id: "vitality",
    rarity: "common",
    title: "生命强化",
    description: "立即 +1 HP，本局 HP 上限 +1。",
    weight: 7,
  },
  {
    id: "humanCannon",
    rarity: "special",
    title: "人间大炮",
    description: "特殊爆发：短时间把自己发射出去，撞击造成高伤害。",
    weight: 2,
  },
];

export function draftUpgrades(count: number, wave: number): Upgrade[] {
  const pool = UPGRADES.filter((upgrade) => upgrade.rarity !== "special" || wave >= 2);
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
