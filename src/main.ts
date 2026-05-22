import "./styles.css";
import { Game } from "./game/Game";
import { Input } from "./game/input";
import { SceneView } from "./render/SceneView";
import { Hud } from "./ui/Hud";

const sceneRoot = document.querySelector<HTMLDivElement>("#sceneRoot");
const stageShell = document.querySelector<HTMLElement>("#stageShell");
const startButton = document.querySelector<HTMLButtonElement>("#startButton");
const restartButton = document.querySelector<HTMLButtonElement>("#restartButton");
const startOverlay = document.querySelector<HTMLDivElement>("#startOverlay");
const resultOverlay = document.querySelector<HTMLDivElement>("#resultOverlay");
const upgradePanel = document.querySelector<HTMLElement>("#upgradePanel");
const upgradeChoices = document.querySelector<HTMLDivElement>("#upgradeChoices");

if (!sceneRoot || !stageShell || !startButton || !restartButton || !startOverlay || !resultOverlay || !upgradePanel || !upgradeChoices) {
  throw new Error("Missing required DOM nodes.");
}

const input = new Input(sceneRoot);
const view = new SceneView(sceneRoot);
const hud = new Hud(stageShell, upgradePanel, upgradeChoices, resultOverlay);
const game = new Game(input, view, hud);

startButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  game.start();
});

restartButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  game.start();
});

hud.onUpgrade((upgradeId) => {
  game.chooseUpgrade(upgradeId);
});

game.renderIdle();
