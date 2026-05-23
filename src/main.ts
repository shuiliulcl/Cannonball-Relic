import "./styles.css";
import { Game } from "./game/Game";
import { Input } from "./game/input";
import { SceneView } from "./render/SceneView";
import { Hud } from "./ui/Hud";
import { LevelEditor } from "./editor/LevelEditor";
import { levelToRuntime } from "./levels/convert";
import { loadLocalLevel } from "./levels/storage";

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

if (new URLSearchParams(window.location.search).get("mode") === "editor") {
  if (!app) {
    throw new Error("Missing app root.");
  }
  new LevelEditor(app).mount();
} else {

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
  !upgradeChoices
) {
  throw new Error("Missing required DOM nodes.");
}

const runtimeLevel = new URLSearchParams(window.location.search).get("level") === "local" ? loadLocalLevel() : undefined;
const convertedLevel = runtimeLevel ? levelToRuntime(runtimeLevel) : undefined;
const input = new Input(sceneRoot);
const view = new SceneView(sceneRoot, convertedLevel?.obstacles, convertedLevel);
const hud = new Hud(stageShell, upgradePanel, upgradeChoices, resultOverlay, pauseOverlay);
const game = new Game(input, view, hud, convertedLevel);

startButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  game.start();
});

restartButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  pauseOverlay.hidden = true;
  game.start();
});

resumeButton.addEventListener("click", () => {
  game.resume();
});

pauseRestartButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  pauseOverlay.hidden = true;
  game.start();
});

hud.onUpgrade((upgradeId) => {
  game.chooseUpgrade(upgradeId);
});

game.renderIdle();
}
