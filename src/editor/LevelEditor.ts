import { saveLocalLevel } from "../levels/storage";
import type { FloorMaterial, GridDirection, InteractableType, LevelDefinition, LevelInteractable, LevelObstacle, LevelSpawn, MonsterType, ObstacleBehavior, ObstacleMaterial } from "../levels/types";

type Tool = "floor" | "obstacle" | "spawn" | "interactable" | "erase";

const FLOOR_LABEL: Record<string, string> = {
  sandstone: "砂岩",
  cracked: "碎石",
  moss: "苔痕",
  danger: "危险",
  fire: "火焰",
  mud: "泥沼",
  ice: "冰面",
  blood: "血池",
};

const OBSTACLE_LABEL: Record<string, string> = {
  wood: "木箱",
  stone: "石柱",
  metal: "铁砧",
  glass: "玻璃",
  reflector: "弹反",
  accelerator: "加倍",
  thorns: "荆棘",
  oneWay: "单向门",
  bomb: "爆裂桶",
};

const OBSTACLE_BEHAVIOR_LABEL: Record<string, string> = {
  "": "（按材质自动）",
  solid: "实心阻挡",
  breakable: "可破坏",
  reflectBack: "原路弹反",
  speedUp: "弹珠加速",
  pierceDamage: "穿透加伤",
  oneWay: "单向通过",
  explosive: "爆炸伤害",
};

const FACING_LABEL: Record<GridDirection, string> = {
  up: "上",
  right: "右",
  down: "下",
  left: "左",
};

const INTERACTABLE_LABEL: Record<InteractableType, string> = {
  brazier: "火盆",
  pinball: "弹射滚珠",
  iceBall: "冰球",
  alarmPost: "警报柱",
  doorSwitch: "机关门开关",
};

const INTERACTABLE_ICON: Record<InteractableType, string> = {
  brazier: "火",
  pinball: "弹",
  iceBall: "冰",
  alarmPost: "警",
  doorSwitch: "门",
};

const MONSTER_LABEL: Record<string, string> = {
  grunt: "木偶兵",
  runner: "疾行怪",
  tank: "重甲怪",
  octopus: "章鱼",
  hound: "大狗",
  boar: "突猪",
  slime: "史莱姆",
  rabbit: "兔兔",
  bombBug: "爆爆虫",
  shieldCrab: "盾兵蟹",
  voodooFlower: "巫毒花",
  eyeCannon: "眼球炮",
  priest: "祭司机",
};

const FLOOR_ICON: Record<string, string> = {
  sandstone: "砂",
  cracked: "裂",
  moss: "苔",
  danger: "危",
  fire: "火",
  mud: "泥",
  ice: "冰",
  blood: "血",
};

const OBSTACLE_ICON: Record<string, string> = {
  wood: "箱",
  stone: "柱",
  metal: "砧",
  glass: "璃",
  reflector: "反",
  accelerator: "速",
  thorns: "刺",
  oneWay: "门",
  bomb: "爆",
};

const MONSTER_ICON: Record<string, string> = {
  grunt: "兵",
  runner: "疾",
  tank: "甲",
  octopus: "章",
  hound: "狗",
  boar: "猪",
  slime: "泥",
  rabbit: "兔",
  bombBug: "炸",
  shieldCrab: "盾",
  voodooFlower: "毒",
  eyeCannon: "眼",
  priest: "祭",
};

export class LevelEditor {
  private readonly level: LevelDefinition = this.createInitialLevel();
  private tool: Tool = "floor";
  private floorMaterial: FloorMaterial = "sandstone";
  private obstacleMaterial: ObstacleMaterial = "wood";
  private obstacleBehavior: ObstacleBehavior | "" = "";
  private obstacleFacing: GridDirection = "right";
  private obstacleHp = 1;
  private spawnWave = 1;
  private spawnCount = 4;
  private spawnInterval = 0.7;
  private monsterType: MonsterType = "grunt";
  private interactableType: InteractableType = "brazier";
  private interactableWave: number | undefined = undefined;
  private interactableCooldown: number | undefined = undefined;
  private selectedId = "";
  private gridElement: HTMLElement | undefined;
  private inspectorElement: HTMLElement | undefined;
  private outputElement: HTMLTextAreaElement | undefined;

  constructor(private readonly root: HTMLElement) {}

  mount(): void {
    this.root.className = "editor-app";
    this.root.innerHTML = `
      <section class="editor-shell">
        <header class="editor-topbar">
          <div>
            <span class="editor-kicker">Cannonball Relic</span>
            <h1>关卡编辑器</h1>
          </div>
          <nav class="editor-top-actions">
            <a href="/" class="editor-link">返回游戏</a>
            <button id="editorSaveLocal" type="button">保存本地草稿</button>
            <button id="editorPlaytest" type="button">游戏内验证</button>
            <button id="editorDownload" type="button">下载关卡</button>
            <button id="editorCopy" type="button">复制 JSON</button>
            <a href="https://github.com/shuiliulcl/Cannonball-Relic/tree/main/public/levels" target="_blank" rel="noreferrer" class="editor-link">GitHub 关卡目录</a>
          </nav>
        </header>
        <aside class="editor-toolbar" aria-label="编辑工具">
          <button type="button" data-tool="floor">地面</button>
          <button type="button" data-tool="obstacle">障碍</button>
          <button type="button" data-tool="spawn">刷怪</button>
          <button type="button" data-tool="interactable">交互物</button>
          <button type="button" data-tool="erase">擦除</button>
        </aside>
        <main class="editor-board-wrap">
          <div class="editor-board-frame">
            <div id="editorGrid" class="editor-grid" aria-label="关卡网格"></div>
          </div>
          <div class="editor-hint">点击格子布置。地面会覆盖当前格，障碍、刷怪点和交互物再次点击可替换，擦除会优先删除对象。</div>
        </main>
        <aside class="editor-inspector">
          <div id="editorInspector"></div>
          <label class="editor-field">
            <span>关卡名</span>
            <input id="levelName" value="${this.level.name}">
          </label>
          <label class="editor-field">
            <span>导出 / 导入 JSON</span>
            <textarea id="editorOutput" spellcheck="false"></textarea>
          </label>
          <div class="editor-actions">
            <button id="editorImport" type="button">导入</button>
            <button id="editorReset" type="button">重置</button>
          </div>
          <section class="editor-panel github-help">
            <h2>提交到 GitHub</h2>
            <p>下载关卡 JSON 后，把文件放到 <code>public/levels/</code>，提交并推送到仓库。详见 <code>docs/LevelEditor.md</code>。</p>
          </section>
        </aside>
      </section>
    `;

    this.gridElement = this.root.querySelector<HTMLElement>("#editorGrid") ?? undefined;
    this.inspectorElement = this.root.querySelector<HTMLElement>("#editorInspector") ?? undefined;
    this.outputElement = this.root.querySelector<HTMLTextAreaElement>("#editorOutput") ?? undefined;
    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        this.tool = button.dataset.tool as Tool;
        this.selectedId = "";
        this.render();
      });
    });

    this.root.querySelector<HTMLInputElement>("#levelName")?.addEventListener("input", (event) => {
      this.level.name = (event.target as HTMLInputElement).value || "未命名关卡";
      this.syncOutput();
    });

    this.root.querySelector<HTMLButtonElement>("#editorCopy")?.addEventListener("click", async () => {
      await navigator.clipboard?.writeText(this.toJson());
    });

    this.root.querySelector<HTMLButtonElement>("#editorSaveLocal")?.addEventListener("click", () => {
      saveLocalLevel(this.level);
    });

    this.root.querySelector<HTMLButtonElement>("#editorPlaytest")?.addEventListener("click", () => {
      saveLocalLevel(this.level);
      window.location.href = "/?level=local";
    });

    this.root.querySelector<HTMLButtonElement>("#editorDownload")?.addEventListener("click", () => {
      this.downloadLevel();
    });

    this.root.querySelector<HTMLButtonElement>("#editorImport")?.addEventListener("click", () => {
      if (!this.outputElement) {
        return;
      }
      try {
        const imported = JSON.parse(this.outputElement.value) as LevelDefinition;
        this.applyImport(imported);
        this.render();
      } catch {
        this.outputElement.value = `${this.outputElement.value}\n\n/* 导入失败：JSON 格式不正确 */`;
      }
    });

    this.root.querySelector<HTMLButtonElement>("#editorReset")?.addEventListener("click", () => {
      const fresh = this.createInitialLevel();
      Object.assign(this.level, fresh);
      this.selectedId = "";
      this.render();
    });
  }

  private render(): void {
    this.renderToolbar();
    this.renderGrid();
    this.renderInspector();
    this.syncOutput();
  }

  private renderToolbar(): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tool === this.tool);
    });
  }

  private renderGrid(): void {
    if (!this.gridElement) {
      return;
    }
    this.gridElement.style.gridTemplateColumns = `repeat(${this.level.grid.width}, 1fr)`;
    this.gridElement.replaceChildren();

    for (let y = 0; y < this.level.grid.height; y += 1) {
      for (let x = 0; x < this.level.grid.width; x += 1) {
        const index = this.indexOf(x, y);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `editor-cell floor-${this.level.floors[index]}`;
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);

        const obstacle = this.findObstacle(x, y);
        const spawn = this.findSpawn(x, y);
        const interactable = this.findInteractable(x, y);

        if (obstacle) {
          cell.classList.add("has-obstacle", `obstacle-${obstacle.material}`);
          cell.dataset.objectId = obstacle.id;
          cell.innerHTML = `
            <i class="editor-cell-icon material-obstacle-${obstacle.material}">${OBSTACLE_ICON[obstacle.material]}</i>
            <span>${OBSTACLE_LABEL[obstacle.material]}</span>
          `;
        }
        if (spawn) {
          cell.classList.add("has-spawn", `spawn-${spawn.monsterType}`);
          cell.dataset.objectId = spawn.id;
          cell.innerHTML = `
            <i class="editor-cell-icon material-spawn-${spawn.monsterType}">${MONSTER_ICON[spawn.monsterType] ?? "?"}</i>
            <span>${MONSTER_LABEL[spawn.monsterType] ?? spawn.monsterType}</span>
            <em>第${spawn.wave}波 x${spawn.count}</em>
          `;
        }
        if (interactable) {
          cell.classList.add("has-interactable", `interactable-${interactable.type}`);
          cell.dataset.objectId = interactable.id;
          cell.innerHTML = `
            <i class="editor-cell-icon material-interactable-${interactable.type}">${INTERACTABLE_ICON[interactable.type]}</i>
            <span>${INTERACTABLE_LABEL[interactable.type]}</span>
          `;
        }

        cell.classList.toggle("is-selected", Boolean(cell.dataset.objectId && cell.dataset.objectId === this.selectedId));
        cell.addEventListener("click", () => this.paintCell(x, y));
        this.gridElement.appendChild(cell);
      }
    }
  }

  private renderInspector(): void {
    if (!this.inspectorElement) {
      return;
    }

    const behaviorOptions = Object.entries(OBSTACLE_BEHAVIOR_LABEL)
      .map(([value, label]) => `<option value="${value}" ${value === this.obstacleBehavior ? "selected" : ""}>${label}</option>`)
      .join("");

    const facingOptions = Object.entries(FACING_LABEL)
      .map(([value, label]) => `<option value="${value}" ${value === this.obstacleFacing ? "selected" : ""}>${label}</option>`)
      .join("");

    const interactableTypeOptions = Object.entries(INTERACTABLE_LABEL)
      .map(([value, label]) => `<option value="${value}" ${value === this.interactableType ? "selected" : ""}>${label}</option>`)
      .join("");

    const stats = `${this.level.obstacles.length} 个障碍，${this.level.spawns.length} 个刷怪点，${(this.level.interactables ?? []).length} 个交互物`;

    this.inspectorElement.innerHTML = `
      <section class="editor-panel">
        <h2>当前工具</h2>
        <strong>${this.toolLabel()}</strong>
      </section>
      <section class="editor-panel">
        <h2>地面材质</h2>
        <div class="editor-segments" data-control="floorMaterial">
          ${this.optionButtons(FLOOR_LABEL, this.floorMaterial, "floor")}
        </div>
      </section>
      <section class="editor-panel">
        <h2>障碍材质</h2>
        <div class="editor-segments" data-control="obstacleMaterial">
          ${this.optionButtons(OBSTACLE_LABEL, this.obstacleMaterial, "obstacle")}
        </div>
        <label class="editor-field compact"><span>行为覆盖</span><select id="obstacleBehavior">${behaviorOptions}</select></label>
        <label class="editor-field compact"><span>朝向</span><select id="obstacleFacing">${facingOptions}</select></label>
        <label class="editor-field compact"><span>HP（可破坏时生效）</span><input id="obstacleHp" type="number" min="1" max="99" value="${this.obstacleHp}"></label>
      </section>
      <section class="editor-panel">
        <h2>交互物</h2>
        <label class="editor-field compact"><span>类型</span><select id="interactableType">${interactableTypeOptions}</select></label>
        <label class="editor-field compact"><span>波次限制（空=全程可用）</span><input id="interactableWave" type="number" min="1" max="20" value="${this.interactableWave ?? ""}"></label>
        <label class="editor-field compact"><span>冷却秒</span><input id="interactableCooldown" type="number" min="0" max="60" step="0.5" value="${this.interactableCooldown ?? ""}"></label>
      </section>
      <section class="editor-panel">
        <h2>刷怪逻辑</h2>
        <label class="editor-field compact"><span>怪物</span><select id="monsterType">${this.monsterOptions()}</select></label>
        <label class="editor-field compact"><span>波次</span><input id="spawnWave" type="number" min="1" max="20" value="${this.spawnWave}"></label>
        <label class="editor-field compact"><span>数量</span><input id="spawnCount" type="number" min="1" max="99" value="${this.spawnCount}"></label>
        <label class="editor-field compact"><span>间隔秒</span><input id="spawnInterval" type="number" min="0" max="10" step="0.1" value="${this.spawnInterval}"></label>
      </section>
      <section class="editor-panel">
        <h2>统计</h2>
        <p>${stats}</p>
      </section>
    `;

    this.inspectorElement.querySelectorAll<HTMLButtonElement>("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const parent = button.closest<HTMLElement>("[data-control]");
        if (parent?.dataset.control === "floorMaterial") {
          this.floorMaterial = button.dataset.option as FloorMaterial;
          this.tool = "floor";
        }
        if (parent?.dataset.control === "obstacleMaterial") {
          this.obstacleMaterial = button.dataset.option as ObstacleMaterial;
          this.tool = "obstacle";
        }
        this.render();
      });
    });

    this.inspectorElement.querySelector<HTMLSelectElement>("#obstacleBehavior")?.addEventListener("change", (event) => {
      this.obstacleBehavior = (event.target as HTMLSelectElement).value as ObstacleBehavior | "";
      this.syncOutput();
    });

    this.inspectorElement.querySelector<HTMLSelectElement>("#obstacleFacing")?.addEventListener("change", (event) => {
      this.obstacleFacing = (event.target as HTMLSelectElement).value as GridDirection;
      this.syncOutput();
    });

    this.bindNumberInput("#obstacleHp", (value) => (this.obstacleHp = Math.max(1, Math.round(value))));

    this.inspectorElement.querySelector<HTMLSelectElement>("#interactableType")?.addEventListener("change", (event) => {
      this.interactableType = (event.target as HTMLSelectElement).value as InteractableType;
      this.tool = "interactable";
      this.syncOutput();
    });

    this.inspectorElement.querySelector<HTMLInputElement>("#interactableWave")?.addEventListener("input", (event) => {
      const raw = (event.target as HTMLInputElement).value;
      this.interactableWave = raw ? Math.max(1, Math.round(Number(raw))) : undefined;
      this.syncOutput();
    });

    this.inspectorElement.querySelector<HTMLInputElement>("#interactableCooldown")?.addEventListener("input", (event) => {
      const raw = (event.target as HTMLInputElement).value;
      this.interactableCooldown = raw ? Math.max(0, Number(raw)) : undefined;
      this.syncOutput();
    });

    this.inspectorElement.querySelector<HTMLSelectElement>("#monsterType")?.addEventListener("change", (event) => {
      this.monsterType = (event.target as HTMLSelectElement).value as MonsterType;
      this.tool = "spawn";
      this.render();
    });
    this.bindNumberInput("#spawnWave", (value) => (this.spawnWave = Math.max(1, Math.round(value))));
    this.bindNumberInput("#spawnCount", (value) => (this.spawnCount = Math.max(1, Math.round(value))));
    this.bindNumberInput("#spawnInterval", (value) => (this.spawnInterval = Math.max(0, value)));
  }

  private bindNumberInput(selector: string, apply: (value: number) => void): void {
    this.inspectorElement?.querySelector<HTMLInputElement>(selector)?.addEventListener("input", (event) => {
      apply(Number((event.target as HTMLInputElement).value));
      this.syncOutput();
    });
  }

  private paintCell(x: number, y: number): void {
    const obstacle = this.findObstacle(x, y);
    const spawn = this.findSpawn(x, y);
    const interactable = this.findInteractable(x, y);

    if (this.tool === "erase") {
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== obstacle?.id);
      this.level.spawns = this.level.spawns.filter((item) => item.id !== spawn?.id);
      this.level.interactables = (this.level.interactables ?? []).filter((item) => item.id !== interactable?.id);
      this.selectedId = "";
    }

    if (this.tool === "floor") {
      this.level.floors[this.indexOf(x, y)] = this.floorMaterial;
    }

    if (this.tool === "obstacle") {
      this.level.spawns = this.level.spawns.filter((item) => item.id !== spawn?.id);
      this.level.interactables = (this.level.interactables ?? []).filter((item) => item.id !== interactable?.id);
      const id = obstacle?.id ?? `obstacle-${Date.now()}`;
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== id);
      const newObstacle: LevelObstacle = { id, x, z: y, w: 1, h: 1, material: this.obstacleMaterial };
      if (this.obstacleBehavior !== "") {
        newObstacle.behavior = this.obstacleBehavior as ObstacleBehavior;
      }
      if (this.obstacleBehavior === "oneWay" || this.obstacleMaterial === "oneWay") {
        newObstacle.facing = this.obstacleFacing;
      }
      if (this.obstacleBehavior === "breakable" || this.obstacleMaterial === "glass") {
        newObstacle.hp = this.obstacleHp;
      }
      this.level.obstacles.push(newObstacle);
      this.selectedId = id;
    }

    if (this.tool === "interactable") {
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== obstacle?.id);
      this.level.spawns = this.level.spawns.filter((item) => item.id !== spawn?.id);
      if (!this.level.interactables) {
        this.level.interactables = [];
      }
      const id = interactable?.id ?? `interactable-${Date.now()}`;
      this.level.interactables = this.level.interactables.filter((item) => item.id !== id);
      const newInteractable: LevelInteractable = { id, x, z: y, type: this.interactableType };
      if (this.interactableWave !== undefined) {
        newInteractable.wave = this.interactableWave;
      }
      if (this.interactableCooldown !== undefined) {
        newInteractable.cooldown = this.interactableCooldown;
      }
      this.level.interactables.push(newInteractable);
      this.selectedId = id;
    }

    if (this.tool === "spawn") {
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== obstacle?.id);
      this.level.interactables = (this.level.interactables ?? []).filter((item) => item.id !== interactable?.id);
      const id = spawn?.id ?? `spawn-${Date.now()}`;
      this.level.spawns = this.level.spawns.filter((item) => item.id !== id);
      this.level.spawns.push({
        id,
        x,
        z: y,
        wave: this.spawnWave,
        count: this.spawnCount,
        monsterType: this.monsterType,
        interval: this.spawnInterval,
      });
      this.selectedId = id;
    }

    this.render();
  }

  private optionButtons<T extends FloorMaterial | ObstacleMaterial>(labels: Record<T, string>, active: T, kind: "floor" | "obstacle"): string {
    return Object.entries(labels)
      .map(([value, label]) => {
        const icon = kind === "floor" ? FLOOR_ICON[value as FloorMaterial] : OBSTACLE_ICON[value as ObstacleMaterial];
        return `
          <button type="button" data-option="${value}" class="editor-material-button ${value === active ? "is-active" : ""}">
            <i class="editor-material-icon material-${kind}-${value}">${icon}</i>
            <span>${label}</span>
          </button>
        `;
      })
      .join("");
  }

  private monsterOptions(): string {
    return Object.entries(MONSTER_LABEL)
      .map(([value, label]) => `<option value="${value}" ${value === this.monsterType ? "selected" : ""}>${label}</option>`)
      .join("");
  }

  private toolLabel(): string {
    const labels: Record<Tool, string> = {
      floor: `地面：${FLOOR_LABEL[this.floorMaterial]}`,
      obstacle: `障碍：${OBSTACLE_LABEL[this.obstacleMaterial]}`,
      spawn: `刷怪：${MONSTER_LABEL[this.monsterType] ?? this.monsterType}`,
      interactable: `交互物：${INTERACTABLE_LABEL[this.interactableType]}`,
      erase: "擦除对象",
    };
    return labels[this.tool];
  }

  private syncOutput(): void {
    if (this.outputElement) {
      this.outputElement.value = this.toJson();
    }
  }

  private toJson(): string {
    return JSON.stringify(this.level, null, 2);
  }

  private downloadLevel(): void {
    const blob = new Blob([this.toJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.slugify(this.level.name)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private slugify(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9一-龥]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "level"
    );
  }

  private applyImport(imported: LevelDefinition): void {
    if (!imported.grid || !Array.isArray(imported.floors)) {
      throw new Error("Invalid level.");
    }
    Object.assign(this.level, imported);
    if (!this.level.interactables) {
      this.level.interactables = [];
    }
  }

  private findObstacle(x: number, y: number): LevelObstacle | undefined {
    return this.level.obstacles.find((item) => x >= item.x && x < item.x + item.w && y >= item.z && y < item.z + item.h);
  }

  private findSpawn(x: number, y: number): LevelSpawn | undefined {
    return this.level.spawns.find((item) => item.x === x && item.z === y);
  }

  private findInteractable(x: number, y: number): LevelInteractable | undefined {
    return (this.level.interactables ?? []).find((item) => item.x === x && item.z === y);
  }

  private indexOf(x: number, y: number): number {
    return y * this.level.grid.width + x;
  }

  private createInitialLevel(): LevelDefinition {
    const width = 17;
    const height = 13;
    const floors = Array.from<FloorMaterial>({ length: width * height }).fill("sandstone");
    return {
      version: 1,
      name: "遗迹训练场",
      grid: { width, height, cellSize: 1 },
      floors,
      obstacles: [
        { id: "left-block", x: 5, z: 5, w: 2, h: 1, material: "wood" },
        { id: "right-block", x: 11, z: 5, w: 2, h: 1, material: "wood" },
        { id: "center-low", x: 8, z: 7, w: 1, h: 1, material: "stone" },
      ],
      interactables: [],
      spawns: [
        { id: "wave-1-a", x: 7, z: 3, wave: 1, count: 3, monsterType: "grunt", interval: 0.7 },
        { id: "wave-1-b", x: 10, z: 3, wave: 1, count: 3, monsterType: "grunt", interval: 0.7 },
      ],
    };
  }
}
