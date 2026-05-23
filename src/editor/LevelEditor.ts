type FloorMaterial = "sandstone" | "cracked" | "moss" | "danger";
type ObstacleMaterial = "wood" | "stone" | "metal";
type MonsterType = "grunt" | "runner" | "tank";
type Tool = "floor" | "obstacle" | "spawn" | "erase";

type ObstacleDraft = {
  id: string;
  x: number;
  z: number;
  w: number;
  h: number;
  material: ObstacleMaterial;
};

type SpawnDraft = {
  id: string;
  x: number;
  z: number;
  wave: number;
  count: number;
  monsterType: MonsterType;
  interval: number;
};

type LevelDraft = {
  version: 1;
  name: string;
  grid: {
    width: number;
    height: number;
    cellSize: number;
  };
  floors: FloorMaterial[];
  obstacles: ObstacleDraft[];
  spawns: SpawnDraft[];
};

const FLOOR_LABEL: Record<FloorMaterial, string> = {
  sandstone: "砂岩",
  cracked: "碎石",
  moss: "苔痕",
  danger: "危险",
};

const OBSTACLE_LABEL: Record<ObstacleMaterial, string> = {
  wood: "木箱",
  stone: "石柱",
  metal: "铁砧",
};

const MONSTER_LABEL: Record<MonsterType, string> = {
  grunt: "木偶兵",
  runner: "疾行怪",
  tank: "重甲怪",
};

export class LevelEditor {
  private readonly level: LevelDraft = this.createInitialLevel();
  private tool: Tool = "floor";
  private floorMaterial: FloorMaterial = "sandstone";
  private obstacleMaterial: ObstacleMaterial = "wood";
  private spawnWave = 1;
  private spawnCount = 4;
  private spawnInterval = 0.7;
  private monsterType: MonsterType = "grunt";
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
            <button id="editorCopy" type="button">复制 JSON</button>
          </nav>
        </header>
        <aside class="editor-toolbar" aria-label="编辑工具">
          <button type="button" data-tool="floor">地面</button>
          <button type="button" data-tool="obstacle">障碍</button>
          <button type="button" data-tool="spawn">刷怪</button>
          <button type="button" data-tool="erase">擦除</button>
        </aside>
        <main class="editor-board-wrap">
          <div class="editor-board-frame">
            <div id="editorGrid" class="editor-grid" aria-label="关卡网格"></div>
          </div>
          <div class="editor-hint">点击格子布置。地面会覆盖当前格，障碍和刷怪点再次点击可替换，擦除会优先删除对象。</div>
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

    this.root.querySelector<HTMLButtonElement>("#editorImport")?.addEventListener("click", () => {
      if (!this.outputElement) {
        return;
      }
      try {
        const imported = JSON.parse(this.outputElement.value) as LevelDraft;
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
        if (obstacle) {
          cell.classList.add("has-obstacle", `obstacle-${obstacle.material}`);
          cell.dataset.objectId = obstacle.id;
          cell.innerHTML = `<span>${OBSTACLE_LABEL[obstacle.material]}</span>`;
        }
        if (spawn) {
          cell.classList.add("has-spawn", `spawn-${spawn.monsterType}`);
          cell.dataset.objectId = spawn.id;
          cell.innerHTML = `<span>${MONSTER_LABEL[spawn.monsterType]}</span><em>第${spawn.wave}波 x${spawn.count}</em>`;
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

    this.inspectorElement.innerHTML = `
      <section class="editor-panel">
        <h2>当前工具</h2>
        <strong>${this.toolLabel()}</strong>
      </section>
      <section class="editor-panel">
        <h2>地面材质</h2>
        <div class="editor-segments" data-control="floorMaterial">
          ${this.optionButtons(FLOOR_LABEL, this.floorMaterial)}
        </div>
      </section>
      <section class="editor-panel">
        <h2>障碍材质</h2>
        <div class="editor-segments" data-control="obstacleMaterial">
          ${this.optionButtons(OBSTACLE_LABEL, this.obstacleMaterial)}
        </div>
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
        <p>${this.level.obstacles.length} 个障碍，${this.level.spawns.length} 个刷怪点</p>
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

    if (this.tool === "erase") {
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== obstacle?.id);
      this.level.spawns = this.level.spawns.filter((item) => item.id !== spawn?.id);
      this.selectedId = "";
    }

    if (this.tool === "floor") {
      this.level.floors[this.indexOf(x, y)] = this.floorMaterial;
    }

    if (this.tool === "obstacle") {
      this.level.spawns = this.level.spawns.filter((item) => item.id !== spawn?.id);
      const id = obstacle?.id ?? `obstacle-${Date.now()}`;
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== id);
      this.level.obstacles.push({ id, x, z: y, w: 1, h: 1, material: this.obstacleMaterial });
      this.selectedId = id;
    }

    if (this.tool === "spawn") {
      this.level.obstacles = this.level.obstacles.filter((item) => item.id !== obstacle?.id);
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

  private optionButtons<T extends string>(labels: Record<T, string>, active: T): string {
    return Object.entries(labels)
      .map(([value, label]) => `<button type="button" data-option="${value}" class="${value === active ? "is-active" : ""}">${label}</button>`)
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
      spawn: `刷怪：${MONSTER_LABEL[this.monsterType]}`,
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

  private applyImport(imported: LevelDraft): void {
    if (!imported.grid || !Array.isArray(imported.floors)) {
      throw new Error("Invalid level.");
    }
    Object.assign(this.level, imported);
  }

  private findObstacle(x: number, y: number): ObstacleDraft | undefined {
    return this.level.obstacles.find((item) => x >= item.x && x < item.x + item.w && y >= item.z && y < item.z + item.h);
  }

  private findSpawn(x: number, y: number): SpawnDraft | undefined {
    return this.level.spawns.find((item) => item.x === x && item.z === y);
  }

  private indexOf(x: number, y: number): number {
    return y * this.level.grid.width + x;
  }

  private createInitialLevel(): LevelDraft {
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
      spawns: [
        { id: "wave-1-a", x: 7, z: 3, wave: 1, count: 3, monsterType: "grunt", interval: 0.7 },
        { id: "wave-1-b", x: 10, z: 3, wave: 1, count: 3, monsterType: "grunt", interval: 0.7 },
      ],
    };
  }
}
