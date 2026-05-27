import "./styles.css";
import { Game } from "./game/Game";
import { Input } from "./game/input";
import { VoiceInput } from "./game/voice";
import { SceneView } from "./render/SceneView";
import { Hud } from "./ui/Hud";
import { resolveSkinTheme } from "./render/skin";
import { LevelEditor } from "./editor/LevelEditor";
import { VoiceSurvivorGame } from "./survivor/VoiceSurvivorGame";
import { levelToRuntime } from "./levels/convert";
import { loadLocalLevel } from "./levels/storage";
import type { LevelDefinition } from "./levels/types";

declare global {
  interface Window {
    __cannonballPerf?: {
      startGame: () => void;
      startLongMove: (speed?: number) => { waypoints: { x: number; z: number }[]; speed: number };
      longMoveStatus: () => {
        active: boolean;
        finished: boolean;
        currentIndex: number;
        waypointCount: number;
        distanceTraveled: number;
        elapsedMs: number;
      };
      diagnostics: () => Array<{
        frameMs: number;
        dt: number;
        updateMs: number;
        syncMs: number;
        effectsMs: number;
        renderMs: number;
        syncParts: Record<string, number>;
        renderer: { calls: number; triangles: number; textures: number; geometries: number };
      }>;
    };
  }
}

// ?perf=1 enables the performance overlay (stats.js FPS/MS + renderer info)
function mountPerfOverlay(view: SceneView): void {
  if (new URLSearchParams(window.location.search).get("perf") !== "1") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import("stats.js").then(({ default: Stats }) => {
    const fps = new Stats(); fps.showPanel(0); fps.dom.style.cssText = "position:fixed;top:0;left:0;z-index:9999;";
    const ms  = new Stats(); ms.showPanel(1);  ms.dom.style.cssText  = "position:fixed;top:0;left:80px;z-index:9999;";
    document.body.appendChild(fps.dom);
    document.body.appendChild(ms.dom);

    const info = document.createElement("div");
    info.style.cssText = "position:fixed;top:0;left:160px;z-index:9999;background:#000a;color:#0f0;font:11px monospace;padding:4px 6px;line-height:1.5;";
    document.body.appendChild(info);

    const origRender = view.render.bind(view);
    view.render = () => {
      fps.begin(); ms.begin();
      origRender();
      const r = view.rendererInfo();
      info.textContent = `draw:${r.calls}  tri:${r.triangles}  tex:${r.textures}  geo:${r.geometries}`;
      ms.end(); fps.end();
    };
  });
}

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
const voiceToggle = document.querySelector<HTMLButtonElement>("#voiceToggle");
const voiceTranscript = document.querySelector<HTMLElement>("#voiceTranscript");
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
const LEVEL_SETS: Record<string, string[]> = {
  design7: [
    "design-01-street-office",
    "design-02-glass-alley",
    "design-03-charge-loop",
    "design-04-broken-glass-block",
    "design-05-accelerator-freight",
    "design-06-blood-altar",
    "design-07-outer-ring",
  ],
};

const bootParams = new URLSearchParams(window.location.search);

if (bootParams.get("mode") === "editor") {
  if (!app) {
    throw new Error("Missing app root.");
  }
  new LevelEditor(app).mount();
} else if (bootParams.get("game") === "relic") {
  void bootstrapGame();
} else {
  if (!app) {
    throw new Error("Missing app root.");
  }
  new VoiceSurvivorGame(app).mount();
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
    !buffCloseButton ||
    !voiceToggle ||
    !voiceTranscript
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
  const setParam = new URLSearchParams(window.location.search).get("set");
  const levelIds = setParam && LEVEL_SETS[setParam] ? LEVEL_SETS[setParam] : CAMPAIGN_LEVEL_IDS;
  const levels = await Promise.all(levelIds.map((levelId) => fetchPublicLevel(levelId)));
  return levels.filter((level): level is LevelDefinition => Boolean(level));
}

  stageShell.classList.add(resolveSkinTheme().cssClass);
  const runtimeLevel = await loadRequestedLevel();
  const convertedLevel = runtimeLevel ? levelToRuntime(runtimeLevel) : undefined;
  const campaignLevels = runtimeLevel ? [] : (await loadCampaignLevels()).map(levelToRuntime);
  const debugParams = new URLSearchParams(window.location.search);
  const godMode = debugParams.get("god") === "1";
  const noObstacles = debugParams.get("noobstacles") === "1";
  const noMonsters = debugParams.get("nomonsters") === "1";
  const input = new Input(sceneRoot);
  const firstCampaignLevel = campaignLevels[0];
  const viewLevel = convertedLevel ?? firstCampaignLevel;
  const view = new SceneView(sceneRoot, noObstacles ? [] : viewLevel?.obstacles, viewLevel);
  mountPerfOverlay(view);
  const hud = new Hud(stageShell, upgradePanel, upgradeChoices, resultOverlay, pauseOverlay, buffOverlay);
  const game = new Game(input, view, hud, convertedLevel, { campaignLevels, godMode, noMonsters, noObstacles });
const voice = new VoiceInput((actions) => {
  for (const action of actions) {
    game.queueVoiceAction(action);
  }
});
const voiceTranscriptElement = voiceTranscript;

  const startGame = () => {
    startOverlay.hidden = true;
    resultOverlay.hidden = true;
    pauseOverlay.hidden = true;
    buffOverlay.hidden = true;
    game.start();
  };

  window.__cannonballPerf = {
    startGame,
    startLongMove: (speed?: number) => game.startLongMovePerfTest(speed),
    longMoveStatus: () => game.getLongMovePerfStatus(),
    diagnostics: () => game.getPerfDiagnostics(),
  };

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  startGame();
});

resumeButton.addEventListener("click", () => {
  game.resume();
});

pauseRestartButton.addEventListener("click", () => {
  startGame();
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

if (voice.isSupported()) {
  voiceToggle.disabled = false;
} else {
  voiceToggle.disabled = true;
  renderVoiceTranscript("Voice not supported in this browser.");
}

function renderVoiceTranscript(message: string, actions: readonly string[] = []): void {
  voiceTranscriptElement.replaceChildren();

  const messageNode = document.createElement("span");
  messageNode.className = "voice-message";
  messageNode.textContent = message;
  voiceTranscriptElement.append(messageNode);

  if (actions.length === 0) {
    return;
  }

  const actionNode = document.createElement("span");
  actionNode.className = "voice-actions";
  actionNode.textContent = actions.join(", ");
  voiceTranscriptElement.append(actionNode);
}

voice.observe(({ status, transcript, actions, error }) => {
  if (status === "unsupported") {
    voiceToggle.disabled = true;
    renderVoiceTranscript("Voice not supported in this browser.");
    return;
  }
  if (status === "error") {
    voiceToggle.dataset.state = "off";
    voiceToggle.textContent = "Voice Off";
    renderVoiceTranscript(`Voice error: ${error ?? "unknown"}`);
    return;
  }
  if (status === "idle") {
    voiceToggle.dataset.state = "off";
    voiceToggle.textContent = "Voice Off";
    renderVoiceTranscript("Voice idle.");
    return;
  }
  voiceToggle.dataset.state = "on";
  voiceToggle.textContent = "Voice On";
  const actionTypes = actions.map((action) => action.type);
  renderVoiceTranscript(transcript ? `Heard: ${transcript}` : "Listening: say 开 / 发 / 回收 / 闪避.", actionTypes);
});

voiceToggle.addEventListener("click", () => {
  if (voiceToggle.dataset.state === "on") {
    voice.stop();
    return;
  }
  voiceToggle.dataset.state = "on";
  voiceToggle.textContent = "Voice On";
  voice.start();
});

  game.renderIdle();
}
