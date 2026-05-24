import type { LevelDefinition } from "./types";

export const LOCAL_LEVEL_KEY = "cannonball-relic.level.local";
const EDITOR_LEVELS_KEY = "cannonball-relic.editor.levels";
const CURRENT_EDITOR_LEVEL_ID_KEY = "cannonball-relic.editor.currentLevelId";

export type SavedEditorLevel = {
  id: string;
  name: string;
  updatedAt: number;
  level: LevelDefinition;
};

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

export function loadEditorLevels(): SavedEditorLevel[] {
  const raw = window.localStorage.getItem(EDITOR_LEVELS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as SavedEditorLevel[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isSavedEditorLevel).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveEditorLevel(id: string, level: LevelDefinition): SavedEditorLevel {
  const saved: SavedEditorLevel = {
    id,
    name: level.name || "未命名关卡",
    updatedAt: Date.now(),
    level: structuredClone(level),
  };
  const levels = loadEditorLevels().filter((item) => item.id !== id);
  levels.unshift(saved);
  window.localStorage.setItem(EDITOR_LEVELS_KEY, JSON.stringify(levels));
  setCurrentEditorLevelId(id);
  return saved;
}

export function loadCurrentEditorLevel(): SavedEditorLevel | undefined {
  const levels = loadEditorLevels();
  const currentId = window.localStorage.getItem(CURRENT_EDITOR_LEVEL_ID_KEY);
  return levels.find((item) => item.id === currentId) ?? levels[0];
}

export function setCurrentEditorLevelId(id: string): void {
  window.localStorage.setItem(CURRENT_EDITOR_LEVEL_ID_KEY, id);
}

function isSavedEditorLevel(value: unknown): value is SavedEditorLevel {
  const item = value as SavedEditorLevel;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.updatedAt === "number" &&
      item.level &&
      item.level.grid &&
      Array.isArray(item.level.floors),
  );
}
