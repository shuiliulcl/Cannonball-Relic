import "./styles.css";
import { Game } from "./game/Game";
import { Input } from "./game/input";
import { SceneView } from "./render/SceneView";
import { Hud } from "./ui/Hud";
import { LevelEditor } from "./editor/LevelEditor";
import { levelToRuntime } from "./levels/convert";
import { loadLocalLevel } from "./levels/storage";
import type { LevelDefinition } from "./levels/types";

const app = document.querySelector<HTMLElement>("#app");
const sceneRoot = document.querySelector<HTMLDivElement>("#sceneRoot");
const stageShell = document.querySelector<HTMLElement>("#stageShell");
const startButton = document.querySelector<HTMLButtonElement>("#startButton");
const restartButton = document.querySelector<HTMLButtonElement>("#restartButton");
const startOverlay = document.querySelector<HTMLDivElement>("#startOverlay");
const resultOverlay = document.querySelector<HTMLDivElement>("#resultOverlay");
const pauseOverlay = document.querySelector<HTMLDivElement>("#pauseOverlay");
const resumeButton = document.querySelector<HTMLButtonElement>("#resumeButton");
const pauseRestartButton = document.querySelector<HTMLButtonElement>("#pauseRestartButton");
const upgradePanel = document.querySelector<HTMLElement>("#upgradePanel");
const upgradeChoices = document.querySelector<HTMLDivElement>("#upgradeChoices");
const buffOverlay = document.querySelector<HTMLDivElement>("#buffOverlay");
const buffButton = document.querySelector<HTMLButtonElement>("#buffButton");
const buffCloseButton = document.querySelector<HTMLButtonElement>("#buffCloseButton");
const CAMPAIGN_LEVEL_IDS = [
  "zodiac-01",
  "zodiac-02",
  "zodiac-03",
  "zodiac-04",
  "zodiac-05",
  "zodiac-06",
  "zodiac-07",
  "zodiac-08",
  "zodiac-09",
  "zodiac-10",
];

if (new URLSearchParams(window.location.search).get("mode") === "editor") {
  if (!app) {
    throw new Error("Missing app root.");
  }
  new LevelEditor(app).mount();
} else {
  void bootstrapGame();
}

async function bootstrapGame(): Promise<void> {
  if (
    !sceneRoot ||
    !stageShell ||
    !startButton ||
    !restartButton ||
    !startOverlay ||
    !resultOverlay ||
    !pauseOverlay ||
    !resumeButton ||
    !pauseRestartButton ||
    !upgradePanel ||
    !upgradeChoices ||
    !buffOverlay ||
    !buffButton ||
    !buffCloseButton
  ) {
    throw new Error("Missing required DOM nodes.");
  }

async function fetchPublicLevel(levelId: string): Promise<LevelDefinition | undefined> {
  const response = await fetch(`/levels/${levelId}.json`);
  if (!response.ok) {
    console.warn(`Level not found: ${levelId}`);
    return undefined;
  }
  return (await response.json()) as LevelDefinition;
}

async function loadRequestedLevel(): Promise<LevelDefinition | undefined> {
  const levelParam = new URLSearchParams(window.location.search).get("level");
  if (!levelParam) {
    return undefined;
  }
  if (levelParam === "local") {
    return loadLocalLevel();
  }
  if (!/^[a-z0-9-]+$/i.test(levelParam)) {
    console.warn(`Ignored unsafe level id: ${levelParam}`);
    return undefined;
  }
  return fetchPublicLevel(levelParam);
}

async function loadCampaignLevels(): Promise<LevelDefinition[]> {
  const levels = await Promise.all(CAMPAIGN_LEVEL_IDS.map((levelId) => fetchPublicLevel(levelId)));
  return levels.filter((level): level is LevelDefinition => Boolean(level));
}

  const runtimeLevel = await loadRequestedLevel();
  const convertedLevel = runtimeLevel ? levelToRuntime(runtimeLevel) : undefined;
  const campaignLevels = runtimeLevel ? [] : (await loadCampaignLevels()).map(levelToRuntime);
  const input = new Input(sceneRoot);
  const firstCampaignLevel = campaignLevels[0];
  const viewLevel = convertedLevel ?? firstCampaignLevel;
  const view = new SceneView(sceneRoot, viewLevel?.obstacles, viewLevel);
  const hud = new Hud(stageShell, upgradePanel, upgradeChoices, resultOverlay, pauseOverlay, buffOverlay);
  const game = new Game(input, view, hud, convertedLevel, { campaignLevels });

startButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  game.start();
});

restartButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  pauseOverlay.hidden = true;
  buffOverlay.hidden = true;
  game.start();
});

resumeButton.addEventListener("click", () => {
  game.resume();
});

pauseRestartButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  pauseOverlay.hidden = true;
  buffOverlay.hidden = true;
  game.start();
});

hud.onUpgrade((upgradeId) => {
  game.chooseUpgrade(upgradeId);
});

hud.onBuffOpen(() => {
  game.openBuffPanel();
});

hud.onBuffClose(() => {
  game.closeBuffPanel();
});

  game.renderIdle();
}
