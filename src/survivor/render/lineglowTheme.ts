import type { EnemyType, SpellKey } from "../VoiceSurvivorGame";

export type LineglowTone = "cyan" | "orange" | "violet" | "green" | "red" | "amber";

export type LineglowEnemyArt = {
  base: string;
  plate: string;
  accent: string;
  outline: string;
  glow: string;
};

export type LineglowSpellArt = {
  glyph: string;
  tone: LineglowTone;
};

export const LINEGLOW_ENEMY_ART: Record<EnemyType, LineglowEnemyArt> = {
  runner: { base: "#171216", plate: "#ff8a2f", accent: "#ffd16a", outline: "#ff8a2f", glow: "rgba(255, 138, 47, 0.48)" },
  brute: { base: "#1d1412", plate: "#ff6b2a", accent: "#ffd16a", outline: "#ff9a3d", glow: "rgba(255, 107, 42, 0.52)" },
  pouncer: { base: "#19161a", plate: "#ffc247", accent: "#ff7f36", outline: "#ffc247", glow: "rgba(255, 194, 71, 0.48)" },
  ranged: { base: "#10191d", plate: "#75eee2", accent: "#d8ffff", outline: "#75eee2", glow: "rgba(117, 238, 226, 0.5)" },
  repeater: { base: "#111a15", plate: "#9cff8a", accent: "#e2ffd8", outline: "#9cff8a", glow: "rgba(156, 255, 138, 0.42)" },
  silencer: { base: "#151225", plate: "#b16cff", accent: "#f0d9ff", outline: "#b16cff", glow: "rgba(177, 108, 255, 0.48)" },
  target: { base: "#1c1114", plate: "#ff4a5f", accent: "#ffd3d8", outline: "#ff4a5f", glow: "rgba(255, 74, 95, 0.55)" },
};

export const LINEGLOW_SPELL_ART: Partial<Record<SpellKey, LineglowSpellArt>> = {
  explode: { glyph: "*", tone: "orange" },
  freeze: { glyph: "F", tone: "cyan" },
  lightning: { glyph: "L", tone: "violet" },
  split: { glyph: "Y", tone: "cyan" },
  pierce: { glyph: "I", tone: "cyan" },
  ricochet: { glyph: "R", tone: "amber" },
  evade: { glyph: ">", tone: "cyan" },
  shield: { glyph: "O", tone: "cyan" },
  gather: { glyph: "+", tone: "green" },
  focus: { glyph: ".", tone: "red" },
  cannon: { glyph: "C", tone: "orange" },
  cannonPrep: { glyph: "3", tone: "amber" },
  cannonFire: { glyph: "!", tone: "orange" },
  bang: { glyph: "B", tone: "orange" },
  skillGo: { glyph: "#", tone: "green" },
  xiexiu: { glyph: "?", tone: "violet" },
  serious: { glyph: "S", tone: "red" },
  wealth: { glyph: "$", tone: "green" },
  calm: { glyph: "~", tone: "cyan" },
  scramble: { glyph: "/", tone: "violet" },
};

export function getLineglowSpellArt(spell: SpellKey): LineglowSpellArt {
  return LINEGLOW_SPELL_ART[spell] ?? { glyph: "•", tone: "cyan" };
}
