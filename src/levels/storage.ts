import type { LevelDefinition } from "./types";

export const LOCAL_LEVEL_KEY = "cannonball-relic.level.local";

export function saveLocalLevel(level: LevelDefinition): void {
  window.localStorage.setItem(LOCAL_LEVEL_KEY, JSON.stringify(level));
}

export function loadLocalLevel(): LevelDefinition | undefined {
  const raw = window.localStorage.getItem(LOCAL_LEVEL_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as LevelDefinition;
  } catch {
    return undefined;
  }
}
