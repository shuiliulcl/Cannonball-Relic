import "./styles.css";
import { Game } from "./game/Game";
import { Input } from "./game/input";
import { SceneView } from "./render/SceneView";
import { Hud } from "./ui/Hud";

const sceneRoot = document.querySelector<HTMLDivElement>("#sceneRoot");
const startButton = document.querySelector<HTMLButtonElement>("#startButton");
const startOverlay = document.querySelector<HTMLDivElement>("#startOverlay");
const upgradePanel = document.querySelector<HTMLElement>("#upgradePanel");
const upgradeChoices = document.querySelector<HTMLDivElement>("#upgradeChoices");

if (!sceneRoot || !startButton || !startOverlay || !upgradePanel || !upgradeChoices) {
  throw new Error("Missing required DOM nodes.");
}

const input = new Input(sceneRoot);
const view = new SceneView(sceneRoot);
const hud = new Hud(upgradePanel, upgradeChoices);
const game = new Game(input, view, hud);

startButton.addEventListener("click", () => {
  startOverlay.hidden = true;
  game.start();
});

hud.onUpgrade((upgradeId) => {
  game.chooseUpgrade(upgradeId);
});

game.renderIdle();
