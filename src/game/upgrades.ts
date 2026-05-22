import type { Upgrade } from "./types";

export const UPGRADES: Upgrade[] = [
  {
    id: "extraDamage",
    rarity: "common",
    title: "Sharper Bounce",
    description: "+1 damage per wall bounce.",
    weight: 10,
  },
  {
    id: "longerRange",
    rarity: "common",
    title: "Longer Shot",
    description: "+25% marble travel range.",
    weight: 10,
  },
  {
    id: "recallBlade",
    rarity: "rare",
    title: "Recall Blade",
    description: "Recall deals bonus damage.",
    weight: 5,
  },
  {
    id: "quickDash",
    rarity: "common",
    title: "Quick Dash",
    description: "-18% dash cooldown.",
    weight: 8,
  },
  {
    id: "vitality",
    rarity: "common",
    title: "Vitality",
    description: "+1 HP now and +1 max HP this run.",
    weight: 7,
  },
  {
    id: "humanCannon",
    rarity: "special",
    title: "Human Cannon",
    description: "Rare burst card: launch yourself as the projectile for one high-risk charge.",
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
