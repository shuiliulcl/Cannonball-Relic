import { VoiceInput } from "../game/voice";

type Vec2 = {
  x: number;
  y: number;
};

type SpellConfig = {
  name: string;
  cost: number;
  category: "持续战斗 Buff" | "通用操作/救场" | "强力/乐子技能" | "人间大炮核心";
  stage: string;
  effect: string;
  links?: readonly string[];
  aliases: readonly string[];
};

const SPELL_CONFIG = {
  explode: {
    name: "爆炸",
    cost: 26,
    category: "持续战斗 Buff",
    stage: "早期基础咒语",
    effect: "自动攻击附带范围爆破，持续约 8.5 秒，可被爆炸续唱延长。",
    links: ["冻结", "弹射", "雷电", "刀刃"],
    aliases: ["爆炸", "爆破", "爆发", "爆了", "报炸", "暴炸", "暴躁", "爆照", "抱炸", "爆", "炸", "boom", "boom boom"],
  },
  freeze: {
    name: "冻结",
    cost: 24,
    category: "持续战斗 Buff",
    stage: "早期基础咒语",
    effect: "立刻冻结周围敌人，并让攻击短时间附带冻结。",
    links: ["爆炸", "刀刃", "冰裂弹片"],
    aliases: ["冻结", "冻住", "冰冻", "冰霜", "冷冻", "冰封", "冻洁", "东结", "东洁", "冰住", "冰一下", "冰", "冻", "封", "冷"],
  },
  lightning: {
    name: "雷电",
    cost: 30,
    category: "持续战斗 Buff",
    stage: "中期咒语",
    effect: "立刻连锁电击，并让攻击短时间附带雷链。",
    links: ["弹射", "爆炸", "雷爆导火"],
    aliases: ["雷电", "闪电", "电击", "来电", "连电", "雷霆", "雷击", "放电", "链电", "雷", "电", "闪", "lightning"],
  },
  split: {
    name: "分裂",
    cost: 22,
    category: "持续战斗 Buff",
    stage: "早期基础咒语",
    effect: "自动攻击分裂成多路弹幕，持续约 8.5 秒。",
    links: ["弹射", "分裂数量", "分裂角度"],
    aliases: ["分裂", "散开", "散射", "裂开", "分身", "分列", "分烈", "分开", "分散", "扩散", "散", "分", "裂"],
  },
  pierce: {
    name: "穿透",
    cost: 24,
    category: "持续战斗 Buff",
    stage: "中期咒语",
    effect: "子弹短时间贯穿怪潮。",
    links: ["弹射", "折线贯穿"],
    aliases: ["穿透", "贯穿", "刺穿", "串透", "穿头", "穿偷", "传透", "穿过", "穿", "透", "串", "刺"],
  },
  ricochet: {
    name: "弹射",
    cost: 24,
    category: "持续战斗 Buff",
    stage: "早期基础咒语",
    effect: "子弹命中后跳向附近未命中的敌人。",
    links: ["雷电", "爆炸", "分裂", "炮塔"],
    aliases: ["弹射", "跳弹", "反弹", "弹跳", "谈射", "蛋射", "弹社", "弹设", "反射", "回弹", "弹", "跳", "反"],
  },
  evade: {
    name: "闪避",
    cost: 20,
    category: "通用操作/救场",
    stage: "早期基础咒语",
    effect: "自动向安全方向位移，并获得短暂无敌。",
    aliases: ["闪避", "闪开", "闪一下", "躲避", "躲开", "避开", "冲刺", "闪闭", "闪币", "闪壁", "闪必", "躲一下", "跑位", "位移", "闪", "躲", "避", "冲", "dash", "dodge", "evade"],
  },
  shield: {
    name: "护盾",
    cost: 24,
    category: "通用操作/救场",
    stage: "早期基础咒语",
    effect: "获得护盾，并获得短暂无敌。",
    aliases: ["护盾", "保护", "防护", "套盾", "开盾", "户盾", "护顿", "互盾", "糊盾", "加盾", "盾牌", "盾", "护", "防"],
  },
  gather: {
    name: "聚拢",
    cost: 18,
    category: "通用操作/救场",
    stage: "早期基础咒语",
    effect: "吸取周围掉落经验。",
    aliases: ["聚拢", "聚集", "吸过来", "收集", "吸收", "聚龙", "巨龙", "聚笼", "聚过来", "捡起来", "吸起来", "吸经验", "聚", "拢", "吸", "收"],
  },
  focus: {
    name: "锁定",
    cost: 16,
    category: "通用操作/救场",
    stage: "中期战术咒语",
    effect: "自动攻击优先处理静音、远程、高血量等危险目标。",
    links: ["当个事儿办"],
    aliases: ["锁定", "集火", "集中", "瞄准", "盯住", "锁住", "锁敌", "锁头", "索定", "所定", "锁", "瞄", "盯"],
  },
  cannon: {
    name: "人间大炮",
    cost: 0,
    category: "人间大炮核心",
    stage: "锁定",
    effect: "锁定敌群或进入手动瞄准，鼠标可调整方向。",
    aliases: ["人间大炮", "人体大炮", "人间大抱", "人间大爆", "大炮", "炮弹", "本人就是弹药", "我是炮弹", "上大炮", "炮", "弹"],
  },
  cannonPrep: {
    name: "一级准备",
    cost: 0,
    category: "人间大炮核心",
    stage: "充能",
    effect: "消耗声能增加 1 层大炮充能，最多 3 层。",
    aliases: ["一级准备", "一集准备", "一击准备", "已经准备", "已准备", "准备", "预备", "充能", "装弹", "上膛", "蓄力", "备弹", "装填", "准", "备"],
  },
  cannonFire: {
    name: "发射",
    cost: 0,
    category: "人间大炮核心",
    stage: "爆发",
    effect: "把玩家发射出去，充能越高，速度、伤害、弹射、落地冲击越强。",
    aliases: ["发射", "开火", "开炮", "发社", "发设", "发涉", "发誓", "法射", "射击", "设计", "开伙", "开活", "开跑", "发", "开", "射", "打", "放", "fire", "shoot"],
  },
  bang: {
    name: "梆梆不梆梆",
    cost: 28,
    category: "强力/乐子技能",
    stage: "后期强力咒语",
    effect: "对附近敌人打冲击拳，命中返声能和大炮槽。",
    aliases: ["梆梆不梆梆", "梆梆两拳", "你就说梆不梆", "梆不梆", "邦邦不邦邦", "棒棒不棒棒", "邦邦", "棒棒", "帮帮", "梆梆", "梆", "邦", "棒"],
  },
  skillGo: {
    name: "技能五子棋",
    cost: 38,
    category: "强力/乐子技能",
    stage: "后期钻石咒语",
    effect: "放出短时棋子炮台阵，等级提高后可带爆炸/雷电。",
    aliases: ["技能五子棋", "技能五指棋", "技能无子棋", "五子棋", "五指棋", "棋来", "落子无悔", "下棋", "下子", "落子", "五子", "棋"],
  },
  xiexiu: {
    name: "邪修",
    cost: 18,
    category: "强力/乐子技能",
    stage: "后期强力咒语",
    effect: "随机施放已有攻击咒语，并提高爆发，有概率受伤。",
    aliases: ["邪修", "野路子", "歪门", "邪术", "斜修", "协修", "写修", "邪门", "野", "邪", "修"],
  },
  serious: {
    name: "当个事儿办",
    cost: 26,
    category: "强力/乐子技能",
    stage: "后期战术咒语",
    effect: "强化锁敌和自动攻击处理危险目标。",
    aliases: ["当个事儿办", "当回事办", "认真模式", "办一下", "认真处理", "认真", "办事", "办", "事儿", "当回事"],
  },
  wealth: {
    name: "来财",
    cost: 18,
    category: "通用操作/救场",
    stage: "中期功能咒语",
    effect: "大范围吸取经验，强化经验返能节奏。",
    aliases: ["来财", "发财", "收钱", "来钱", "招财", "财来", "来才", "莱财", "理财", "捡钱", "钱来", "财", "钱"],
  },
  calm: {
    name: "从容",
    cost: 18,
    category: "通用操作/救场",
    stage: "中期功能咒语",
    effect: "优雅闪避，位移更短但偏冷静返能。",
    aliases: ["从容", "游刃有余", "稳住", "冷静", "从荣", "葱蓉", "从容一点", "淡定", "稳", "从", "静"],
  },
  scramble: {
    name: "连滚带爬",
    cost: 26,
    category: "通用操作/救场",
    stage: "后期救场咒语",
    effect: "残血逃生，获得更强位移和生存窗口。",
    aliases: ["连滚带爬", "救命", "跑路", "快跑", "逃命", "溜了", "快逃", "保命", "救", "跑", "逃", "爬", "溜"],
  },
} as const satisfies Record<string, SpellConfig>;

type SpellKey = keyof typeof SPELL_CONFIG;

type EnemyType = "runner" | "brute" | "pouncer" | "ranged" | "repeater" | "silencer" | "target";

type Enemy = {
  id: number;
  type: EnemyType;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  cooldown: number;
  windup: number;
  frozen: number;
  lastSpellHit?: SpellKey;
};

type Projectile = {
  id: number;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  life: number;
  pierce: number;
  ricochet: number;
  hitIds: number[];
  explosion: boolean;
  freeze: boolean;
  lightning: boolean;
};

type EnemyShot = {
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  life: number;
};

type Drop = {
  position: Vec2;
  value: number;
  radius: number;
  magnet: number;
};

type Particle = {
  position: Vec2;
  velocity: Vec2;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
};

type Turret = {
  position: Vec2;
  cooldown: number;
  life: number;
};

type Buff = {
  id: string;
  title: string;
  description: string;
  rarity: "bronze" | "gold" | "diamond";
  spell?: SpellKey;
  phase?: "starter" | "branch" | "combo" | "late";
  maxStacks?: number;
  apply: () => void;
};

const SPELL_NAMES = Object.fromEntries(
  Object.entries(SPELL_CONFIG).map(([key, config]) => [key, config.name]),
) as Record<SpellKey, string>;

const SPELL_COSTS = Object.fromEntries(
  Object.entries(SPELL_CONFIG).map(([key, config]) => [key, config.cost]),
) as Record<SpellKey, number>;

const SPELL_COMMAND_ALIASES = Object.entries(SPELL_CONFIG).map(([key, config]) => ({
  key: key as SpellKey,
  aliases: config.aliases,
}));

const BASE_ENERGY_REGEN = 5.4;
const CANNON_PREP_COSTS = [34, 48, 62] as const;

const ENEMY_CONFIG: Record<EnemyType, { hp: number; speed: number; radius: number; color: string; label: string; xp: number }> = {
  runner: { hp: 12, speed: 68, radius: 13, color: "#ffbd4a", label: "跑", xp: 5 },
  brute: { hp: 34, speed: 38, radius: 20, color: "#c491ff", label: "胖", xp: 12 },
  pouncer: { hp: 18, speed: 50, radius: 15, color: "#ff6f91", label: "扑", xp: 8 },
  ranged: { hp: 16, speed: 34, radius: 14, color: "#66e0ff", label: "射", xp: 9 },
  repeater: { hp: 22, speed: 46, radius: 16, color: "#9cff8a", label: "复", xp: 11 },
  silencer: { hp: 26, speed: 32, radius: 18, color: "#7a78ff", label: "静", xp: 14 },
  target: { hp: 30, speed: 28, radius: 18, color: "#ff4a4a", label: "靶", xp: 18 },
};

const ENEMY_DAMAGE: Record<EnemyType, number> = {
  runner: 8,
  brute: 14,
  pouncer: 11,
  ranged: 7,
  repeater: 9,
  silencer: 10,
  target: 12,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(v: Vec2): Vec2 {
  const length = Math.hypot(v.x, v.y);
  if (length < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / length, y: v.y / length };
}

function normalizeVoiceText(text: string): string {
  return text.toLowerCase().replace(/[\s,.;:!?，。；：！？、'"`~()[\]{}<>《》【】]/g, "");
}

function matchSpells(text: string): SpellKey[] {
  const normalized = normalizeVoiceText(text);
  if (!normalized) return [];
  const matches: Array<{ key: SpellKey; position: number; length: number }> = [];
  for (const command of SPELL_COMMAND_ALIASES) {
    let bestMatch: { key: SpellKey; position: number; length: number } | undefined;
    for (const alias of command.aliases) {
      const aliasForm = normalizeVoiceText(alias);
      const position = normalized.indexOf(aliasForm);
      if (position >= 0) {
        const match = { key: command.key, position, length: aliasForm.length };
        if (
          !bestMatch ||
          match.position < bestMatch.position ||
          (match.position === bestMatch.position && match.length > bestMatch.length)
        ) {
          bestMatch = match;
        }
      }
    }
    if (bestMatch) {
      matches.push(bestMatch);
    }
  }
  const selected: Array<{ key: SpellKey; position: number; length: number }> = [];
  for (const match of matches.sort((a, b) => a.position - b.position || b.length - a.length)) {
    const end = match.position + match.length;
    const overlaps = selected.some((item) => match.position < item.position + item.length && end > item.position);
    if (!overlaps && !selected.some((item) => item.key === match.key)) {
      selected.push(match);
    }
  }

  return selected.map((match) => match.key);
}

export class VoiceSurvivorGame {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private statusLine!: HTMLElement;
  private statLine!: HTMLElement;
  private chainLine!: HTMLElement;
  private lastStatSignature = "";
  private voiceButton!: HTMLButtonElement;
  private startOverlay!: HTMLElement;
  private upgradeOverlay!: HTMLElement;
  private upgradeChoices!: HTMLElement;
  private commandDock!: HTMLElement;
  private activeSpellPanel!: HTMLElement;
  private hpFill!: HTMLElement;
  private hpText!: HTMLElement;
  private energyFill!: HTMLElement;
  private energyText!: HTMLElement;
  private xpFill!: HTMLElement;
  private xpText!: HTMLElement;

  private voiceInput!: VoiceInput<SpellKey>;
  private voiceActive = false;
  private lastFrame = 0;
  private rafId = 0;
  private running = false;
  private selectingBuff = false;
  private gameOver = false;
  private width = 1280;
  private height = 720;
  private nextEnemyId = 1;
  private nextProjectileId = 1;
  private keys = new Set<string>();
  private pointer: Vec2 = { x: 0, y: 0 };
  private player = {
    position: { x: 640, y: 360 },
    velocity: { x: 0, y: 0 },
    radius: 16,
    hp: 100,
    maxHp: 100,
    invuln: 0,
    shield: 0,
    fireCooldown: 0,
    dodgeCooldown: 0,
    cannonTime: 0,
    cannonVelocity: { x: 0, y: 0 },
  };
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyShots: EnemyShot[] = [];
  private drops: Drop[] = [];
  private particles: Particle[] = [];
  private turrets: Turret[] = [];
  private unlockedSpells = new Set<SpellKey>(["cannon", "cannonPrep", "cannonFire"]);
  private ownedBuffs = new Map<string, number>();
  private spellChain: SpellKey[] = [];
  private spellFatigue = new Map<SpellKey, { count: number; lastAt: number }>();
  private chainEnergyBonus = 0;
  private lastSpell: SpellKey | null = null;
  private activeMods = {
    explosionTime: 0,
    freezeTime: 0,
    lightningTime: 0,
    splitTime: 0,
    pierceTime: 0,
    ricochetTime: 0,
    focusTime: 0,
    seriousTime: 0,
    damageBoost: 0,
  };
  private score = 0;
  private kills = 0;
  private level = 1;
  private xp = 0;
  private xpGoal = 14;
  private elapsed = 0;
  private spawnTimer = 1.2;
  private spawnBudget = 0.45;
  private surgeTimer = 34;
  private energy = 100;
  private maxEnergy = 100;
  private energyRegen = BASE_ENERGY_REGEN;
  private dropEnergyRatio = 0.16;
  private cannonMeter = 0;
  private cannonCharge = 0;
  private cannonTarget: Vec2 | null = null;
  private cannonAiming = false;
  private cannonBouncesLeft = 0;
  private cannonDamage = 0;
  private cannonLaunchCharge = 0;
  private attackDamage = 10;
  private attackRate = 0.54;
  private bonusProjectiles = 0;
  private armor = 0;
  private hpRegen = 0;
  private projectileSpeed = 560;
  private ricochetBounces = 1;
  private ricochetRange = 280;
  private ricochetDamageMultiplier = 0.92;
  private ricochetPierceBonus = 0;
  private splitRicochetProjectiles = 0;
  private splitExtraPairs = 0;
  private splitAngle = 0.32;
  private splitDurationBonus = 0;
  private splitDamageBonus = 0;
  private lightningBurstRadius = 0;
  private freezeShatterRadius = 0;
  private cannonShardCount = 0;
  private guardTurretCount = 0;
  private guardTurretCooldown = 0;
  private guardTurretDamage = 6;
  private guardTurretRate = 0.72;
  private guardTurretRange = 430;
  private bladeCount = 0;
  private bladeAngle = 0;
  private bladeCooldown = 0;
  private bladeDamage = 7;
  private bladeRadius = 54;
  private bladeSpinSpeed = 3.2;
  private moveSpeed = 210;
  private magnetRadius = 70;
  private explosionRadius = 82;
  private explosionDamageScale = 0.48;
  private explosionDurationBonus = 0;
  private freezeDuration = 1.7;
  private freezePulseRadius = 140;
  private lightningJumps = 3;
  private lightningDamageScale = 0.55;
  private bangLevel = 1;
  private skillGoLevel = 1;

  constructor(private readonly root: HTMLElement) {}

  mount(): void {
    this.root.innerHTML = `
      <section class="survivor-shell">
        <canvas class="survivor-canvas" aria-label="人间大炮一级准备"></canvas>
        <section class="survivor-hud" aria-label="战斗状态">
          <div class="survivor-title">
            <strong>人间大炮一级准备</strong>
            <a href="?game=relic">旧版 Cannonball Relic</a>
          </div>
          <div class="survivor-bars">
            <span id="survivorChain"></span>
          </div>
          <div class="survivor-voice">
            <button id="survivorVoiceButton" type="button">开启语音</button>
            <span id="survivorStatus">WASD 移动，自动攻击会成长；咒语负责救场和爆发。</span>
          </div>
          <div id="survivorActiveSpells" class="survivor-active-spells" aria-label="持续咒语倒计时"></div>
          <div class="survivor-detail-panel" aria-label="角色数值">
            <span id="survivorStats"></span>
          </div>
        </section>
        <section class="survivor-resource-panel" aria-label="生命和声能">
          <div class="survivor-resource-row">
            <span>HP</span>
            <i><b id="survivorHpFill"></b></i>
            <strong id="survivorHpText">100/100</strong>
          </div>
          <div class="survivor-resource-row">
            <span>声能</span>
            <i><b id="survivorEnergyFill"></b></i>
            <strong id="survivorEnergyText">100/100</strong>
          </div>
          <div class="survivor-resource-row survivor-resource-row--xp">
            <span>EXP</span>
            <i><b id="survivorXpFill"></b></i>
            <strong id="survivorXpText">差 14</strong>
          </div>
        </section>
        <section id="survivorCommandDock" class="survivor-command-dock" aria-label="可用咒语"></section>
        <div id="survivorStart" class="survivor-overlay">
          <span class="survivor-kicker">语音幸存者肉鸽</span>
          <h1>人间大炮一级准备</h1>
          <p>自动攻击怪潮，升级既能强化武器和生存，也能抽取咒语 Buff。喊“爆炸”“冻结”“梆梆不梆梆”“人间大炮 一级准备 发射”，把自己也变成弹药。</p>
          <button type="button" data-action="start">开始整活</button>
        </div>
        <div id="survivorUpgrade" class="survivor-overlay survivor-upgrade" hidden>
          <span class="survivor-kicker">选择一个 Buff</span>
          <h1>新咒语入库</h1>
          <div id="survivorUpgradeChoices" class="survivor-upgrade-choices"></div>
        </div>
      </section>
    `;

    this.canvas = this.root.querySelector<HTMLCanvasElement>(".survivor-canvas") ?? this.fail("Missing survivor canvas.");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is not available.");
    this.ctx = ctx;
    this.statusLine = this.root.querySelector<HTMLElement>("#survivorStatus") ?? this.fail("Missing survivor status.");
    this.statLine = this.root.querySelector<HTMLElement>("#survivorStats") ?? this.fail("Missing survivor stats.");
    this.chainLine = this.root.querySelector<HTMLElement>("#survivorChain") ?? this.fail("Missing survivor chain.");
    this.voiceButton = this.root.querySelector<HTMLButtonElement>("#survivorVoiceButton") ?? this.fail("Missing survivor voice button.");
    this.startOverlay = this.root.querySelector<HTMLElement>("#survivorStart") ?? this.fail("Missing survivor start overlay.");
    this.upgradeOverlay = this.root.querySelector<HTMLElement>("#survivorUpgrade") ?? this.fail("Missing survivor upgrade overlay.");
    this.upgradeChoices = this.root.querySelector<HTMLElement>("#survivorUpgradeChoices") ?? this.fail("Missing survivor upgrade choices.");
    this.commandDock = this.root.querySelector<HTMLElement>("#survivorCommandDock") ?? this.fail("Missing survivor command dock.");
    this.activeSpellPanel = this.root.querySelector<HTMLElement>("#survivorActiveSpells") ?? this.fail("Missing survivor active spell panel.");
    this.hpFill = this.root.querySelector<HTMLElement>("#survivorHpFill") ?? this.fail("Missing survivor HP fill.");
    this.hpText = this.root.querySelector<HTMLElement>("#survivorHpText") ?? this.fail("Missing survivor HP text.");
    this.energyFill = this.root.querySelector<HTMLElement>("#survivorEnergyFill") ?? this.fail("Missing survivor energy fill.");
    this.energyText = this.root.querySelector<HTMLElement>("#survivorEnergyText") ?? this.fail("Missing survivor energy text.");
    this.xpFill = this.root.querySelector<HTMLElement>("#survivorXpFill") ?? this.fail("Missing survivor XP fill.");
    this.xpText = this.root.querySelector<HTMLElement>("#survivorXpText") ?? this.fail("Missing survivor XP text.");

    this.resize();
    this.installEvents();
    this.setupVoice();
    this.renderCommandDock();
    this.render();
  }

  private fail(message: string): never {
    throw new Error(message);
  }

  private installEvents(): void {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.key.toLowerCase());
      if (event.code === "Space") {
        event.preventDefault();
        this.castSpell("evade");
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    this.canvas.addEventListener("pointermove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer = {
        x: (event.clientX - rect.left) * (this.width / rect.width),
        y: (event.clientY - rect.top) * (this.height / rect.height),
      };
      if (this.cannonAiming) {
        this.cannonTarget = { ...this.pointer };
      }
    });
    this.root.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", () => this.start());
    this.voiceButton.addEventListener("click", () => {
      if (this.voiceActive) this.stopVoice();
      else this.startVoice();
    });
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    this.width = Math.max(720, Math.floor(rect.width));
    this.height = Math.max(420, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * scale);
    this.canvas.height = Math.floor(this.height * scale);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.player.position.x = clamp(this.player.position.x, 30, this.width - 30);
    this.player.position.y = clamp(this.player.position.y, 30, this.height - 30);
  }

  private setupVoice(): void {
    this.voiceInput = new VoiceInput<SpellKey>(
      (spells) => {
        for (const spell of spells) {
          this.castSpell(spell);
        }
      },
      matchSpells,
      (spell) => spell,
    );

    if (!this.voiceInput.isSupported()) {
      this.voiceButton.disabled = true;
      this.voiceButton.textContent = "语音不可用";
      return;
    }

    this.voiceInput.observe(({ status, transcript, actions, error }) => {
      if (status === "unsupported") {
        this.voiceButton.disabled = true;
        this.voiceButton.textContent = "语音不可用";
        this.voiceActive = false;
        return;
      }
      if (status === "error") {
        this.voiceActive = false;
        this.voiceButton.textContent = "开启语音";
        this.say(`语音出错：${error ?? "unknown"}`);
        return;
      }
      if (status === "idle") {
        this.voiceActive = false;
        this.voiceButton.textContent = "开启语音";
        return;
      }

      this.voiceActive = true;
      this.voiceButton.textContent = "语音中";
      if (actions.length > 0) {
        this.say(`听见了：${transcript} -> ${actions.map((spell) => SPELL_NAMES[spell]).join(" / ")}`);
      } else if (transcript) {
        this.say(`听见了：${transcript}`);
      }
    });
  }

  private startVoice(): void {
    if (this.voiceActive) return;
    this.voiceActive = true;
    this.voiceButton.textContent = "语音中";
    this.voiceInput.start();
    this.say("正在听：爆炸、冻结、闪避、护盾、人间大炮、梆梆不梆梆。");
  }

  private stopVoice(): void {
    if (!this.voiceActive) return;
    this.voiceActive = false;
    this.voiceButton.textContent = "开启语音";
    this.voiceInput.stop();
  }

  private start(): void {
    this.running = true;
    this.selectingBuff = false;
    this.gameOver = false;
    this.startOverlay.hidden = true;
    this.resetRun();
    this.lastFrame = performance.now();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  private resetRun(): void {
    this.player = {
      position: { x: this.width / 2, y: this.height / 2 },
      velocity: { x: 0, y: 0 },
      radius: 16,
      hp: 100,
      maxHp: 100,
      invuln: 0,
      shield: 0,
      fireCooldown: 0,
      dodgeCooldown: 0,
      cannonTime: 0,
      cannonVelocity: { x: 0, y: 0 },
    };
    this.enemies = [];
    this.projectiles = [];
    this.enemyShots = [];
    this.drops = [];
    this.particles = [];
    this.turrets = [];
    this.unlockedSpells = new Set(["cannon", "cannonPrep", "cannonFire"]);
    this.ownedBuffs.clear();
    this.spellChain = [];
    this.spellFatigue.clear();
    this.chainEnergyBonus = 0;
    this.lastSpell = null;
    this.activeMods = {
      explosionTime: 0,
      freezeTime: 0,
      lightningTime: 0,
      splitTime: 0,
      pierceTime: 0,
      ricochetTime: 0,
      focusTime: 0,
      seriousTime: 0,
      damageBoost: 0,
    };
    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.xpGoal = 14;
    this.elapsed = 0;
    this.spawnTimer = 1.2;
    this.spawnBudget = 0.45;
    this.surgeTimer = 34;
    this.energy = 100;
    this.maxEnergy = 100;
    this.energyRegen = BASE_ENERGY_REGEN;
    this.dropEnergyRatio = 0.16;
    this.cannonMeter = 0;
    this.cannonCharge = 0;
    this.cannonTarget = null;
    this.cannonAiming = false;
    this.cannonBouncesLeft = 0;
    this.cannonDamage = 0;
    this.cannonLaunchCharge = 0;
    this.attackDamage = 10;
    this.attackRate = 0.54;
    this.bonusProjectiles = 0;
    this.armor = 0;
    this.hpRegen = 0;
    this.projectileSpeed = 560;
    this.ricochetBounces = 1;
    this.ricochetRange = 280;
    this.ricochetDamageMultiplier = 0.92;
    this.ricochetPierceBonus = 0;
    this.splitRicochetProjectiles = 0;
    this.splitExtraPairs = 0;
    this.splitAngle = 0.32;
    this.splitDurationBonus = 0;
    this.splitDamageBonus = 0;
    this.lightningBurstRadius = 0;
    this.freezeShatterRadius = 0;
    this.cannonShardCount = 0;
    this.guardTurretCount = 0;
    this.guardTurretCooldown = 0;
    this.guardTurretDamage = 6;
    this.guardTurretRate = 0.72;
    this.guardTurretRange = 430;
    this.bladeCount = 0;
    this.bladeAngle = 0;
    this.bladeCooldown = 0;
    this.bladeDamage = 7;
    this.bladeRadius = 54;
    this.bladeSpinSpeed = 3.2;
    this.moveSpeed = 210;
    this.magnetRadius = 70;
    this.explosionRadius = 82;
    this.explosionDamageScale = 0.48;
    this.explosionDurationBonus = 0;
    this.freezeDuration = 1.7;
    this.freezePulseRadius = 140;
    this.lightningJumps = 3;
    this.lightningDamageScale = 0.55;
    this.bangLevel = 1;
    this.skillGoLevel = 1;
    this.renderCommandDock();
    this.say("开局：先活下来，升级后抽咒语。");
  }

  private loop(time: number): void {
    const dt = Math.min(0.033, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    if (this.running && !this.selectingBuff && !this.gameOver) {
      this.update(dt);
    }
    this.render();
    this.rafId = requestAnimationFrame((next) => this.loop(next));
  }

  private update(dt: number): void {
    this.elapsed += dt;
    const pressure = this.enemyPressure();
    const ramp = this.elapsed < 20 ? 1.45 : this.elapsed < 70 ? 1 : 0.72;
    this.spawnBudget += dt * 0.085 * ramp * (1 - pressure * 0.62);
    const inSilence = this.isPlayerSilenced();
    this.energy = clamp(this.energy + dt * this.energyRegen * (inSilence ? 0.35 : 1), 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + dt * 4 + this.kills * 0.0005, 0, 100);
    this.player.invuln = Math.max(0, this.player.invuln - dt);
    this.player.dodgeCooldown = Math.max(0, this.player.dodgeCooldown - dt);
    this.activeMods.explosionTime = Math.max(0, this.activeMods.explosionTime - dt);
    this.activeMods.freezeTime = Math.max(0, this.activeMods.freezeTime - dt);
    this.activeMods.lightningTime = Math.max(0, this.activeMods.lightningTime - dt);
    this.activeMods.splitTime = Math.max(0, this.activeMods.splitTime - dt);
    this.activeMods.pierceTime = Math.max(0, this.activeMods.pierceTime - dt);
    this.activeMods.ricochetTime = Math.max(0, this.activeMods.ricochetTime - dt);
    this.activeMods.focusTime = Math.max(0, this.activeMods.focusTime - dt);
    this.activeMods.seriousTime = Math.max(0, this.activeMods.seriousTime - dt);
    this.activeMods.damageBoost = Math.max(0, this.activeMods.damageBoost - dt);
    if (this.hpRegen > 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.hpRegen * dt);
    }

    this.updatePlayer(dt);
    this.updateAutoFire(dt);
    this.updateGuardTurrets(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateBlades(dt);
    this.updateEnemyShots(dt);
    this.updateDrops(dt);
    this.updateTurrets(dt);
    this.updateParticles(dt);
    this.updateSurges(dt);
    this.spawnEnemies(dt);
    this.checkLevelUp();
  }

  private updatePlayer(dt: number): void {
    if (this.player.cannonTime > 0) {
      this.player.cannonTime -= dt;
      this.player.invuln = Math.max(this.player.invuln, 0.12);
      this.player.position.x += this.player.cannonVelocity.x * dt;
      this.player.position.y += this.player.cannonVelocity.y * dt;
      if (this.player.position.x < this.player.radius || this.player.position.x > this.width - this.player.radius) {
        this.player.cannonVelocity.x *= -0.9;
        this.cannonBouncesLeft -= 1;
        this.addBurst(this.player.position, "#ffd25a", 16);
      }
      if (this.player.position.y < this.player.radius || this.player.position.y > this.height - this.player.radius) {
        this.player.cannonVelocity.y *= -0.9;
        this.cannonBouncesLeft -= 1;
        this.addBurst(this.player.position, "#ffd25a", 16);
      }
      this.player.position.x = clamp(this.player.position.x, this.player.radius, this.width - this.player.radius);
      this.player.position.y = clamp(this.player.position.y, this.player.radius, this.height - this.player.radius);
      for (const enemy of this.enemies) {
        if (distance(this.player.position, enemy.position) < this.player.radius + enemy.radius + 8) {
          const targetBonus = enemy.type === "target" ? 2.4 : 1;
          this.damageEnemy(enemy, this.cannonDamage * targetBonus, "cannon");
          this.knockEnemyAway(enemy, this.player.position, 34 + this.cannonLaunchCharge * 10);
          this.addBurst(enemy.position, enemy.type === "target" ? "#ff4a4a" : "#ffe27a", enemy.type === "target" ? 34 : 14);
        }
      }
      if (this.cannonBouncesLeft < 0 || this.player.cannonTime <= 0) {
        this.finishCannonLaunch();
      }
      return;
    }

    const input = {
      x: (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0),
      y: (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) - (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0),
    };
    const move = normalize(input);
    this.player.velocity = { x: move.x * this.moveSpeed, y: move.y * this.moveSpeed };
    this.player.position.x = clamp(this.player.position.x + this.player.velocity.x * dt, this.player.radius, this.width - this.player.radius);
    this.player.position.y = clamp(this.player.position.y + this.player.velocity.y * dt, this.player.radius, this.height - this.player.radius);
  }

  private updateAutoFire(dt: number): void {
    this.player.fireCooldown -= dt;
    if (this.player.fireCooldown > 0) return;
    const target = this.pickTarget();
    if (!target) return;
    this.player.fireCooldown = Math.max(0.12, this.attackRate * (this.activeMods.seriousTime > 0 ? 0.72 : 1));
    const direction = normalize({ x: target.position.x - this.player.position.x, y: target.position.y - this.player.position.y });
    const baseDamage = this.attackDamage + (this.activeMods.damageBoost > 0 ? 5 : 0) + (this.activeMods.splitTime > 0 ? this.splitDamageBonus : 0);
    const makeProjectile = (angle: number): void => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const vx = direction.x * cos - direction.y * sin;
      const vy = direction.x * sin + direction.y * cos;
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...this.player.position },
        velocity: { x: vx * this.projectileSpeed, y: vy * this.projectileSpeed },
        radius: 5,
        damage: baseDamage,
        life: 1.8,
        pierce: this.currentPierceCount(),
        ricochet: this.activeMods.ricochetTime > 0 ? this.currentRicochetBounces() : 0,
        hitIds: [],
        explosion: this.activeMods.explosionTime > 0,
        freeze: this.activeMods.freezeTime > 0,
        lightning: this.activeMods.lightningTime > 0,
      });
      this.nextProjectileId += 1;
    };
    makeProjectile(0);
    if (this.bonusProjectiles >= 1) {
      makeProjectile(-0.18);
      makeProjectile(0.18);
    }
    if (this.bonusProjectiles >= 2) {
      makeProjectile(-0.42);
      makeProjectile(0.42);
    }
    if (this.activeMods.splitTime > 0) {
      makeProjectile(-this.splitAngle);
      makeProjectile(this.splitAngle);
      for (let i = 0; i < this.splitExtraPairs; i += 1) {
        const angle = this.splitAngle + 0.18 * (i + 1);
        makeProjectile(-angle);
        makeProjectile(angle);
      }
      for (let i = 0; i < this.splitRicochetProjectiles && this.activeMods.ricochetTime > 0; i += 1) {
        const angle = 0.5 + i * 0.22;
        makeProjectile(-angle);
        makeProjectile(angle);
      }
    }
  }

  private updateGuardTurrets(dt: number): void {
    if (this.guardTurretCount <= 0) return;
    this.guardTurretCooldown -= dt;
    if (this.guardTurretCooldown > 0) return;
    for (let i = 0; i < this.guardTurretCount; i += 1) {
      const position = this.guardTurretPosition(i);
      const target = this.nearestEnemy(position, this.guardTurretRange);
      if (!target) continue;
      const direction = normalize({ x: target.position.x - position.x, y: target.position.y - position.y });
      this.projectiles.push({
        id: this.nextProjectileId,
        position,
        velocity: { x: direction.x * (this.projectileSpeed * 0.82), y: direction.y * (this.projectileSpeed * 0.82) },
        radius: 4,
        damage: this.guardTurretDamage + this.attackDamage * 0.22,
        life: 1.35,
        pierce: this.activeMods.pierceTime > 0 ? 1 : 0,
        ricochet: this.activeMods.ricochetTime > 0 ? Math.max(1, this.currentRicochetBounces() - 1) : 0,
        hitIds: [],
        explosion: this.activeMods.explosionTime > 0,
        freeze: this.activeMods.freezeTime > 0,
        lightning: this.activeMods.lightningTime > 0,
      });
      this.nextProjectileId += 1;
    }
    this.guardTurretCooldown = Math.max(0.24, this.guardTurretRate);
  }

  private updateBlades(dt: number): void {
    if (this.bladeCount <= 0) return;
    this.bladeAngle += dt * this.bladeSpinSpeed;
    this.bladeCooldown -= dt;
    if (this.bladeCooldown > 0) return;
    this.bladeCooldown = 0.16;
    for (let i = 0; i < this.bladeCount; i += 1) {
      const position = this.bladePosition(i);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || distance(position, enemy.position) > enemy.radius + 12) continue;
        this.damageEnemy(enemy, this.bladeDamage + this.attackDamage * 0.34, "pierce");
        if (this.activeMods.freezeTime > 0) enemy.frozen = Math.max(enemy.frozen, this.freezeDuration * 0.45);
        if (this.activeMods.explosionTime > 0 && Math.random() < 0.24) {
          this.explode(enemy.position, this.explosionRadius * 0.55, this.bladeDamage, this.activeMods.freezeTime > 0);
        }
        this.knockEnemyAway(enemy, this.player.position, 12);
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      enemy.frozen = Math.max(0, enemy.frozen - dt);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.windup = Math.max(0, enemy.windup - dt);
      if (enemy.frozen > 0) continue;

      const toPlayer = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
      if (enemy.type === "pouncer") {
        if (enemy.cooldown <= 0) {
          enemy.windup = 0.48;
          enemy.cooldown = Math.max(1.65, 2.7 - this.threatTier() * 0.18);
        }
        const speed = enemy.windup > 0 ? 8 : enemy.speed * 2.8;
        enemy.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
      } else if (enemy.type === "ranged") {
        const dist = distance(enemy.position, this.player.position);
        const backing = dist < 170 ? -0.55 : 0.45;
        enemy.velocity = { x: toPlayer.x * enemy.speed * backing, y: toPlayer.y * enemy.speed * backing };
        if (enemy.cooldown <= 0 && dist < 520) {
          this.enemyShots.push({
            position: { ...enemy.position },
            velocity: { x: toPlayer.x * (230 + this.threatTier() * 22), y: toPlayer.y * (230 + this.threatTier() * 22) },
            radius: 5,
            damage: this.scaledEnemyDamage(enemy.type),
            life: 3,
          });
          enemy.cooldown = Math.max(0.95, 1.65 - this.threatTier() * 0.12);
        }
      } else {
        enemy.velocity = { x: toPlayer.x * enemy.speed, y: toPlayer.y * enemy.speed };
      }

      enemy.position.x += enemy.velocity.x * dt;
      enemy.position.y += enemy.velocity.y * dt;
      enemy.position.x = clamp(enemy.position.x, enemy.radius, this.width - enemy.radius);
      enemy.position.y = clamp(enemy.position.y, enemy.radius, this.height - enemy.radius);

      if (distance(enemy.position, this.player.position) < enemy.radius + this.player.radius) {
        this.hurtPlayer(this.scaledEnemyDamage(enemy.type));
        const away = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
        this.player.position.x = clamp(this.player.position.x + away.x * 18, this.player.radius, this.width - this.player.radius);
        this.player.position.y = clamp(this.player.position.y + away.y * 18, this.player.radius, this.height - this.player.radius);
      }
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles) {
      projectile.life -= dt;
      projectile.position.x += projectile.velocity.x * dt;
      projectile.position.y += projectile.velocity.y * dt;
      if (
        projectile.position.x < -40 ||
        projectile.position.x > this.width + 40 ||
        projectile.position.y < -40 ||
        projectile.position.y > this.height + 40
      ) {
        projectile.life = 0;
      }
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || distance(projectile.position, enemy.position) > enemy.radius + projectile.radius) continue;
        const hitSpell = projectile.explosion ? "explode" : projectile.freeze ? "freeze" : projectile.lightning ? "lightning" : projectile.ricochet > 0 ? "ricochet" : undefined;
        this.damageEnemy(enemy, projectile.damage, hitSpell);
        projectile.hitIds.push(enemy.id);
        if (projectile.freeze) enemy.frozen = Math.max(enemy.frozen, this.freezeDuration);
        if (projectile.explosion) this.explode(projectile.position, this.explosionRadius, projectile.damage * this.explosionDamageScale, projectile.freeze);
        if (projectile.lightning) this.chainLightning(enemy.position, projectile.damage * this.lightningDamageScale);
        if (projectile.ricochet > 0 && this.redirectRicochet(projectile, enemy)) {
          break;
        }
        projectile.pierce -= 1;
        if (projectile.pierce < 0) {
          projectile.life = 0;
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);
  }

  private redirectRicochet(projectile: Projectile, fromEnemy: Enemy): boolean {
    const target = this.nearestRicochetTarget(fromEnemy.position, projectile.hitIds, this.ricochetRange);
    if (!target) return false;
    const speed = Math.max(260, Math.hypot(projectile.velocity.x, projectile.velocity.y) * 1.02);
    const direction = normalize({ x: target.position.x - fromEnemy.position.x, y: target.position.y - fromEnemy.position.y });
    projectile.position = { ...fromEnemy.position };
    projectile.velocity = { x: direction.x * speed, y: direction.y * speed };
    projectile.life = Math.max(projectile.life, 0.45);
    projectile.damage *= this.ricochetDamageMultiplier;
    projectile.ricochet -= 1;
    this.addParticle(fromEnemy.position, target.position, "#fff06a");
    return true;
  }

  private nearestRicochetTarget(position: Vec2, hitIds: number[], maxDistance: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = maxDistance;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || hitIds.includes(enemy.id)) continue;
      const dist = distance(position, enemy.position);
      if (dist < bestDist) {
        best = enemy;
        bestDist = dist;
      }
    }
    return best;
  }

  private updateEnemyShots(dt: number): void {
    for (const shot of this.enemyShots) {
      shot.life -= dt;
      shot.position.x += shot.velocity.x * dt;
      shot.position.y += shot.velocity.y * dt;
      if (distance(shot.position, this.player.position) < shot.radius + this.player.radius) {
        this.hurtPlayer(shot.damage);
        shot.life = 0;
      }
    }
    this.enemyShots = this.enemyShots.filter((shot) => shot.life > 0);
  }

  private updateDrops(dt: number): void {
    for (const drop of this.drops) {
      const dist = distance(drop.position, this.player.position);
      if (dist < this.player.radius + drop.radius) {
        this.xp += drop.value;
        this.restoreEnergyFromDrop(drop.value);
        drop.value = 0;
        continue;
      }
      const magnetRange = this.magnetRadius + drop.magnet;
      if (dist < magnetRange) {
        const pull = normalize({ x: this.player.position.x - drop.position.x, y: this.player.position.y - drop.position.y });
        const speed = 120 + (1 - dist / magnetRange) * 520;
        drop.position.x += pull.x * speed * dt;
        drop.position.y += pull.y * speed * dt;
      }
    }
    this.drops = this.drops.filter((drop) => drop.value > 0);
  }

  private restoreEnergyFromDrop(value: number): void {
    const missingRatio = 1 - clamp(this.energy / this.maxEnergy, 0, 1);
    const restore = value * this.dropEnergyRatio * (1 + missingRatio * 0.35);
    this.energy = clamp(this.energy + restore, 0, this.maxEnergy);
  }

  private updateTurrets(dt: number): void {
    for (const turret of this.turrets) {
      turret.life -= dt;
      turret.cooldown -= dt;
      if (turret.cooldown > 0) continue;
      const target = this.nearestEnemy(turret.position, 360);
      if (!target) continue;
      const direction = normalize({ x: target.position.x - turret.position.x, y: target.position.y - turret.position.y });
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...turret.position },
        velocity: { x: direction.x * 430, y: direction.y * 430 },
        radius: 4,
        damage: 5 + this.skillGoLevel * 2,
        life: 1.4,
        pierce: 0,
        ricochet: this.activeMods.ricochetTime > 0 ? Math.max(1, this.currentRicochetBounces() - 1) : 0,
        hitIds: [],
        explosion: this.skillGoLevel >= 2,
        freeze: false,
        lightning: this.skillGoLevel >= 3,
      });
      this.nextProjectileId += 1;
      turret.cooldown = 0.58;
    }
    this.turrets = this.turrets.filter((turret) => turret.life > 0);
  }

  private updateParticles(dt: number): void {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  private updateSurges(dt: number): void {
    if (this.threatTier() < 2) {
      return;
    }
    this.surgeTimer -= dt;
    if (this.surgeTimer > 0) {
      return;
    }
    this.spawnSurge();
    this.surgeTimer = Math.max(18, 34 - this.threatTier() * 3.5);
  }

  private spawnSurge(): void {
    const tier = this.threatTier();
    const roomLeft = Math.max(0, this.targetEnemyCount() + 6 - this.enemies.length);
    const count = Math.min(roomLeft, 4 + tier * 2);
    for (let i = 0; i < count; i += 1) {
      const type: EnemyType =
        i === 0 && tier >= 3 ? "target" :
        i % 4 === 0 && tier >= 2 ? "silencer" :
        i % 3 === 0 ? "ranged" :
        i % 2 === 0 ? "pouncer" :
        "brute";
      this.spawnEnemy(type, 1.22 + tier * 0.18);
    }
    this.cannonMeter = clamp(this.cannonMeter + 12, 0, 100);
    this.say("压力波来了：这波值得开大。");
  }

  private spawnEnemies(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const wave = Math.floor(this.elapsed / 28);
    const pressure = this.enemyPressure();
    const targetCount = this.targetEnemyCount();
    const tier = this.threatTier();
    const pressureLimit = tier >= 3 ? 1.12 : 1;
    if (pressure >= pressureLimit) {
      this.spawnTimer = tier >= 3 ? 0.62 : 0.9;
      this.spawnBudget = Math.min(this.spawnBudget, tier >= 3 ? 1.8 : 1.2);
      return;
    }
    const earlyRush = this.elapsed < 20;
    const maxBatch = earlyRush ? 3 : this.elapsed < 80 ? 6 + tier : 5 + tier;
    const roomLeft = Math.max(0, targetCount - this.enemies.length);
    const count = Math.min(maxBatch, roomLeft, (earlyRush ? 2 : 1) + Math.floor(this.spawnBudget));
    for (let i = 0; i < count; i += 1) {
      this.spawnEnemy(this.pickEnemyType(wave));
    }
    this.spawnBudget = Math.max(earlyRush ? 0.85 : 0.7, this.spawnBudget - count * 0.62);
    this.spawnTimer = this.nextSpawnInterval(pressure);
  }

  private targetEnemyCount(): number {
    const tier = this.threatTier();
    if (this.elapsed < 20) return 16;
    if (this.elapsed < 55) return 24 + tier * 2;
    if (this.elapsed < 100) return 30 + tier * 3;
    return 34 + tier * 4;
  }

  private enemyPressure(): number {
    return clamp(this.enemies.length / this.targetEnemyCount(), 0, 1.2);
  }

  private nextSpawnInterval(pressure: number): number {
    const tier = this.threatTier();
    const base = this.elapsed < 20 ? 0.86 : this.elapsed < 70 ? 1.08 : 1.28;
    const pressureDelay = pressure * (0.74 - tier * 0.07);
    return clamp(base + pressureDelay - tier * 0.08, 0.42, 1.95);
  }

  private threatTier(): number {
    const buffCount = [...this.ownedBuffs.values()].reduce((sum, count) => sum + count, 0);
    const byBuffs = buffCount >= 7 ? 4 : buffCount >= 5 ? 3 : buffCount >= 3 ? 2 : buffCount >= 1 ? 1 : 0;
    const byLevel = this.level >= 8 ? 4 : this.level >= 6 ? 3 : this.level >= 4 ? 2 : this.level >= 2 ? 1 : 0;
    const byTime = this.elapsed >= 130 ? 4 : this.elapsed >= 90 ? 3 : this.elapsed >= 55 ? 2 : this.elapsed >= 28 ? 1 : 0;
    return Math.max(byBuffs, byLevel, byTime);
  }

  private pickEnemyType(wave: number): EnemyType {
    const tier = this.threatTier();
    const pool: EnemyType[] = ["runner", "runner", "runner", "brute"];
    if (wave >= 1) pool.push("pouncer", "ranged");
    if (wave >= 2) pool.push("repeater", "repeater");
    if (wave >= 3) pool.push("silencer");
    if (wave >= 4) pool.push("target");
    if (tier >= 2) pool.push("pouncer", "ranged", "repeater");
    if (tier >= 3) pool.push("silencer", "target", "brute");
    if (tier >= 4) pool.push("target", "silencer", "ranged");
    return pool[Math.floor(Math.random() * pool.length)] ?? "runner";
  }

  private spawnEnemy(type: EnemyType, strength = 1): void {
    const cfg = ENEMY_CONFIG[type];
    const scaling = this.enemyScaling();
    const baseHp = cfg.hp + this.elapsed * (0.18 + scaling.tier * 0.04);
    const hp = baseHp * scaling.hpMultiplier * strength;
    const edge = Math.floor(Math.random() * 4);
    const position = {
      x: edge === 0 ? -30 : edge === 1 ? this.width + 30 : Math.random() * this.width,
      y: edge === 2 ? -30 : edge === 3 ? this.height + 30 : Math.random() * this.height,
    };
    this.enemies.push({
      id: this.nextEnemyId,
      type,
      position,
      velocity: { x: 0, y: 0 },
      radius: cfg.radius,
      hp,
      maxHp: hp,
      speed: (cfg.speed + Math.min(24, this.elapsed * 0.055)) * scaling.speedMultiplier,
      cooldown: Math.random(),
      windup: 0,
      frozen: 0,
    });
    this.nextEnemyId += 1;
  }

  private enemyScaling(): { tier: number; hpMultiplier: number; speedMultiplier: number; damageMultiplier: number } {
    const tier = this.threatTier();
    const minutes = this.elapsed / 60;
    return {
      tier,
      hpMultiplier: 1 + tier * 0.28 + Math.max(0, minutes - 1) * 0.18,
      speedMultiplier: 1 + tier * 0.045 + Math.max(0, minutes - 1.3) * 0.025,
      damageMultiplier: 1 + tier * 0.16 + Math.max(0, minutes - 1) * 0.08,
    };
  }

  private scaledEnemyDamage(type: EnemyType): number {
    const scaling = this.enemyScaling();
    return Math.round(ENEMY_DAMAGE[type] * scaling.damageMultiplier);
  }

  private castSpell(spell: SpellKey): void {
    if (!this.running || this.selectingBuff || this.gameOver) return;
    if (!this.unlockedSpells.has(spell) && !["cannonPrep", "cannonFire", "cannon"].includes(spell)) {
      this.say(`${SPELL_NAMES[spell]}还没抽到，先升级找它。`);
      return;
    }

    if (spell === "cannonPrep") {
      this.prepareCannon();
      return;
    }
    if (spell === "cannon") {
      this.lockCannonTarget();
      return;
    }
    if (spell === "cannonFire") {
      this.fireCannon();
      return;
    }

    const fatigue = this.spellFatigueMultiplier(spell);
    const silenceCost = this.isPlayerSilenced() ? 1.6 : 1;
    const cost = Math.round(SPELL_COSTS[spell] * (1 + (1 - fatigue) * 1.1) * silenceCost);
    if (this.energy < cost) {
      this.say(`${SPELL_NAMES[spell]}声能不够，还差 ${cost - Math.floor(this.energy)}。`);
      return;
    }
    this.energy -= cost;
    this.recordSpell(spell);

    const power = fatigue * this.diversityBonus();
    switch (spell) {
      case "explode":
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, (8.5 + this.explosionDurationBonus) * power);
        if (this.recentChainIncludes("freeze")) this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 4.5 * power);
        this.say(`爆炸 Buff 开启 ${Math.ceil(this.activeMods.explosionTime)} 秒，记得续。`);
        break;
      case "freeze":
        this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 8 * power);
        this.freezeAround(this.player.position, this.freezePulseRadius, this.freezeDuration * power);
        this.say(`冻结 Buff 开启 ${Math.ceil(this.activeMods.freezeTime)} 秒。`);
        break;
      case "lightning":
        this.chainLightning(this.player.position, 10 * power);
        this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 7 * power);
        this.say(`雷电 Buff 开启 ${Math.ceil(this.activeMods.lightningTime)} 秒。`);
        break;
      case "split":
        this.activeMods.splitTime = Math.max(this.activeMods.splitTime, (8.5 + this.splitDurationBonus) * power);
        this.say(`分裂 Buff 开启 ${Math.ceil(this.activeMods.splitTime)} 秒。`);
        break;
      case "pierce":
        this.activeMods.pierceTime = Math.max(this.activeMods.pierceTime, 8 * power);
        this.say(`穿透 Buff 开启 ${Math.ceil(this.activeMods.pierceTime)} 秒。`);
        break;
      case "ricochet":
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 8 * power);
        if (this.recentChainIncludes("lightning")) this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 3.5 * power);
        this.say(`弹射 Buff 开启 ${Math.ceil(this.activeMods.ricochetTime)} 秒，子弹会跳向附近敌人。`);
        break;
      case "evade":
      case "calm":
      case "scramble":
        this.evade(spell);
        break;
      case "shield":
        this.player.shield = Math.min(70, this.player.shield + 24 * power);
        this.player.invuln = Math.max(this.player.invuln, 0.3);
        this.say("护盾展开。");
        break;
      case "gather":
      case "wealth":
        this.gatherDrops(spell === "wealth" ? 520 : 300);
        this.say(spell === "wealth" ? "来财，掉落物自己懂事。" : "聚拢资源。");
        break;
      case "focus":
        this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 6 * power);
        this.say("自动攻击开始盯重点目标。");
        break;
      case "bang":
        this.bangBang(power);
        break;
      case "skillGo":
        this.castSkillGo();
        break;
      case "xiexiu":
        this.castXiexiu();
        break;
      case "serious":
        this.activeMods.seriousTime = Math.max(this.activeMods.seriousTime, 5.5 * power);
        this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 5.5 * power);
        this.say("当个事儿办：辅助瞄准上线。");
        break;
      default:
        break;
    }
    this.renderCommandDock();
  }

  private prepareCannon(): void {
    if (this.cannonCharge >= 3) {
      this.say("一级准备已经三层，够离谱了。喊人间大炮锁定，再喊发射。");
      return;
    }
    const cost = this.nextCannonPrepCost();
    if (this.energy < cost) {
      this.say(`第 ${this.cannonCharge + 1} 层一级准备需要 ${cost} 声能，还差 ${Math.ceil(cost - this.energy)}。`);
      return;
    }
    this.energy -= cost;
    this.cannonCharge += 1;
    this.cannonMeter = clamp(this.cannonMeter + 18, 0, 100);
    this.recordSpell("cannonPrep");
    this.say(`一级准备 x${this.cannonCharge}。充能越高，弹射越多、伤害越高。`);
  }

  private nextCannonPrepCost(): number {
    return CANNON_PREP_COSTS[Math.min(this.cannonCharge, CANNON_PREP_COSTS.length - 1)];
  }

  private lockCannonTarget(): void {
    const target = this.densestEnemyPoint();
    this.cannonAiming = true;
    if (!target) {
      this.cannonTarget = { ...this.pointer };
      this.say("人间大炮：进入瞄准，移动鼠标调整方向。");
      return;
    }
    this.cannonTarget = { ...target };
    this.recordSpell("cannon");
    this.say("人间大炮：已对准敌群，也可以移动鼠标改方向。");
  }

  private fireCannon(): void {
    if (this.cannonCharge <= 0) {
      this.say("还没一级准备，先充能再发射。");
      return;
    }
    if (!this.cannonTarget) {
      this.lockCannonTarget();
      if (!this.cannonTarget) {
        return;
      }
    }
    const meterCost = this.cannonFireMeterCost();
    if (this.cannonMeter < meterCost) {
      this.say(`大炮槽还差 ${Math.ceil(meterCost - this.cannonMeter)}，再等一下或打靶心怪。`);
      return;
    }
    const direction = normalize({ x: this.cannonTarget.x - this.player.position.x, y: this.cannonTarget.y - this.player.position.y });
    const charge = this.cannonCharge;
    const bangBoost = this.recentChainIncludes("bang") ? 1.16 : 1;
    const speed = (760 + charge * 130) * bangBoost;
    this.player.cannonVelocity = { x: direction.x * speed, y: direction.y * speed };
    this.player.cannonTime = 1.05 + charge * 0.46;
    this.player.invuln = this.player.cannonTime + 0.25;
    this.cannonBouncesLeft = charge;
    this.cannonDamage = 44 + charge * 34 + this.level * 3;
    this.cannonLaunchCharge = charge;
    this.cannonMeter = Math.max(0, this.cannonMeter - meterCost);
    this.cannonCharge = 0;
    this.cannonTarget = null;
    this.cannonAiming = false;
    this.recordSpell("cannonFire");
    this.addBurst(this.player.position, "#ffe27a", 40);
    this.cannonShockwave(this.player.position, 92 + charge * 18, 14 + charge * 8, 28 + charge * 10, false);
    this.say(`发射！${charge} 层充能，${charge} 次弹射。`);
  }

  private finishCannonLaunch(): void {
    const charge = Math.max(1, this.cannonLaunchCharge);
    const radius = 145 + charge * 48;
    const damage = 30 + charge * 30 + this.level * 2;
    const knockback = 70 + charge * 30;
    this.player.cannonTime = 0;
    this.player.invuln = Math.max(this.player.invuln, 0.75 + charge * 0.18);
    this.player.shield = Math.min(70, this.player.shield + 8 + charge * 4);
    this.cannonShockwave(this.player.position, radius, damage, knockback, true);
    this.fireCannonShards(charge);
    this.clearEnemyShotsNear(this.player.position, radius + 70);
    this.cannonDamage = 0;
    this.cannonLaunchCharge = 0;
    this.say(`落地冲击！清场半径 ${Math.round(radius)}，短暂无敌。`);
  }

  private fireCannonShards(charge: number): void {
    const count = this.cannonShardCount + (this.activeMods.ricochetTime > 0 ? charge : 0);
    if (count <= 0) return;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.elapsed * 0.6;
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...this.player.position },
        velocity: { x: Math.cos(angle) * 520, y: Math.sin(angle) * 520 },
        radius: 5,
        damage: 12 + charge * 5 + this.level,
        life: 1.15,
        pierce: this.activeMods.pierceTime > 0 ? 1 : 0,
        ricochet: this.activeMods.ricochetTime > 0 ? Math.max(1, this.currentRicochetBounces() - 1) : 0,
        hitIds: [],
        explosion: this.activeMods.explosionTime > 0,
        freeze: this.activeMods.freezeTime > 0,
        lightning: this.activeMods.lightningTime > 0,
      });
      this.nextProjectileId += 1;
    }
  }

  private spellFatigueMultiplier(spell: SpellKey): number {
    const now = this.elapsed;
    const entry = this.spellFatigue.get(spell);
    if (!entry || now - entry.lastAt > 8 || this.lastSpell !== spell) {
      return 1;
    }
    return clamp(1 - entry.count * 0.2, 0.38, 1);
  }

  private recordSpell(spell: SpellKey): void {
    const now = this.elapsed;
    const entry = this.spellFatigue.get(spell);
    const count = entry && now - entry.lastAt < 8 && this.lastSpell === spell ? entry.count + 1 : 0;
    this.spellFatigue.set(spell, { count, lastAt: now });
    this.lastSpell = spell;
    this.spellChain.push(spell);
    this.spellChain = this.spellChain.slice(-5);
    if (new Set(this.spellChain).size >= 4) {
      this.energy = clamp(this.energy + 3 + this.chainEnergyBonus, 0, this.maxEnergy);
      this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 4);
    }
  }

  private diversityBonus(): number {
    return 1 + (new Set(this.spellChain).size - 1) * 0.08;
  }

  private currentRicochetBounces(): number {
    const comboBonus = (this.activeMods.splitTime > 0 ? 1 : 0) + (this.activeMods.lightningTime > 0 ? 1 : 0);
    return this.ricochetBounces + comboBonus;
  }

  private currentPierceCount(): number {
    if (this.activeMods.pierceTime <= 0) return 0;
    return 3 + (this.activeMods.ricochetTime > 0 ? this.ricochetPierceBonus : 0);
  }

  private recentChainIncludes(spell: SpellKey): boolean {
    return this.spellChain.slice(-4).includes(spell);
  }

  private evade(spell: SpellKey): void {
    if (this.player.dodgeCooldown > 0 && spell !== "scramble") {
      this.say("闪避还在冷却。");
      return;
    }
    const safe = this.safeDirection();
    const distanceBoost = spell === "scramble" ? 160 : spell === "calm" ? 112 : 126;
    this.player.position.x = clamp(this.player.position.x + safe.x * distanceBoost, this.player.radius, this.width - this.player.radius);
    this.player.position.y = clamp(this.player.position.y + safe.y * distanceBoost, this.player.radius, this.height - this.player.radius);
    this.player.invuln = Math.max(this.player.invuln, spell === "scramble" ? 0.75 : 0.45);
    this.player.dodgeCooldown = spell === "scramble" ? 5.4 : 3.2;
    if (spell === "scramble") this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.5);
    this.addBurst(this.player.position, spell === "calm" ? "#9cffd0" : "#66e0ff", 18);
    this.say(spell === "scramble" ? "连滚带爬，但是有效。" : spell === "calm" ? "从容闪过。" : "闪避。");
  }

  private bangBang(power: number): void {
    let hits = 0;
    const targets = [...this.enemies]
      .sort((a, b) => distance(a.position, this.player.position) - distance(b.position, this.player.position))
      .slice(0, 2 + Math.floor(this.bangLevel / 2));
    for (const enemy of targets) {
      if (distance(enemy.position, this.player.position) > 210) continue;
      hits += 1;
      this.damageEnemy(enemy, (18 + this.bangLevel * 4) * power, "bang");
      const away = normalize({ x: enemy.position.x - this.player.position.x, y: enemy.position.y - this.player.position.y });
      enemy.position.x = clamp(enemy.position.x + away.x * 32, enemy.radius, this.width - enemy.radius);
      enemy.position.y = clamp(enemy.position.y + away.y * 32, enemy.radius, this.height - enemy.radius);
      this.addBurst(enemy.position, "#ffcf5a", 10);
    }
    if (hits === 0) {
      this.player.shield = Math.min(70, this.player.shield + 8);
      this.say("不太梆，但给了点护盾。");
    } else {
      this.energy = clamp(this.energy + hits * 5, 0, this.maxEnergy);
      this.cannonMeter = clamp(this.cannonMeter + hits * 4, 0, 100);
      this.say(hits >= 2 ? "很梆，梆梆两下。" : "梆了一下。");
    }
  }

  private castSkillGo(): void {
    const count = 5;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.elapsed;
      this.turrets.push({
        position: {
          x: clamp(this.player.position.x + Math.cos(angle) * 84, 34, this.width - 34),
          y: clamp(this.player.position.y + Math.sin(angle) * 84, 34, this.height - 34),
        },
        cooldown: i * 0.08,
        life: 7 + this.skillGoLevel,
      });
    }
    this.cannonMeter = clamp(this.cannonMeter + 8 + this.skillGoLevel * 2, 0, 100);
    this.say("技能五子棋，落子无悔。");
  }

  private castXiexiu(): void {
    const options = [...this.unlockedSpells].filter((spell) =>
      ["explode", "freeze", "lightning", "split", "pierce", "ricochet", "bang", "skillGo"].includes(spell),
    );
    const pick = options[Math.floor(Math.random() * options.length)] ?? "explode";
    this.energy = clamp(this.energy + SPELL_COSTS[pick] * 0.7, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 6, 0, 100);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 3.2);
    this.castSpell(pick);
    if (Math.random() < 0.28) {
      this.hurtPlayer(4, true);
      this.say(`邪修成功，但多少有点副作用：${SPELL_NAMES[pick]}。`);
    } else {
      this.say(`邪修路线：${SPELL_NAMES[pick]}。`);
    }
  }

  private gatherDrops(radius: number): void {
    for (const drop of this.drops) {
      drop.magnet = Math.max(drop.magnet, radius);
    }
    if (this.recentChainIncludes("explode")) {
      for (const enemy of this.enemies) {
        if (distance(enemy.position, this.player.position) < radius * 0.65) {
          const pull = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
          enemy.position.x += pull.x * 45;
          enemy.position.y += pull.y * 45;
        }
      }
    }
  }

  private explode(position: Vec2, radius: number, damage: number, freezes: boolean): void {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = distance(position, enemy.position);
      if (dist > radius) continue;
      this.damageEnemy(enemy, damage * (1 - dist / radius * 0.45), "explode");
      if (freezes) enemy.frozen = Math.max(enemy.frozen, this.freezeDuration * 0.75);
    }
    this.addBurst(position, freezes ? "#9be7ff" : "#ff9b4a", 24);
  }

  private cannonShockwave(position: Vec2, radius: number, damage: number, knockback: number, freezes: boolean): void {
    for (const enemy of this.enemies) {
      const dist = distance(position, enemy.position);
      if (dist > radius) continue;
      const falloff = 1 - dist / radius * 0.32;
      this.damageEnemy(enemy, damage * falloff, "cannon");
      this.knockEnemyAway(enemy, position, knockback * falloff);
      if (freezes) enemy.frozen = Math.max(enemy.frozen, 0.28);
    }
    this.addBurst(position, freezes ? "#fff1a6" : "#ffe27a", freezes ? 52 : 28);
  }

  private knockEnemyAway(enemy: Enemy, origin: Vec2, amount: number): void {
    const away = normalize({ x: enemy.position.x - origin.x, y: enemy.position.y - origin.y });
    enemy.position.x = clamp(enemy.position.x + away.x * amount, enemy.radius, this.width - enemy.radius);
    enemy.position.y = clamp(enemy.position.y + away.y * amount, enemy.radius, this.height - enemy.radius);
  }

  private clearEnemyShotsNear(position: Vec2, radius: number): void {
    const before = this.enemyShots.length;
    this.enemyShots = this.enemyShots.filter((shot) => distance(position, shot.position) > radius);
    if (this.enemyShots.length < before) {
      this.addBurst(position, "#8ee8ff", 16);
    }
  }

  private freezeAround(position: Vec2, radius: number, duration: number): void {
    for (const enemy of this.enemies) {
      if (distance(position, enemy.position) <= radius) {
        enemy.frozen = Math.max(enemy.frozen, duration);
      }
    }
    this.addBurst(position, "#9be7ff", 18);
  }

  private chainLightning(position: Vec2, damage: number): void {
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => distance(a.position, position) - distance(b.position, position))
      .slice(0, this.lightningJumps);
    for (const enemy of targets) {
      this.damageEnemy(enemy, damage, "lightning");
      if (this.lightningBurstRadius > 0) {
        this.explode(enemy.position, this.lightningBurstRadius, damage * 0.34, false);
      }
      this.addParticle(position, enemy.position, "#d8ff5a");
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, spell?: SpellKey): void {
    if (enemy.hp <= 0) return;
    const shatters = enemy.frozen > 0 && this.freezeShatterRadius > 0;
    if (spell && enemy.type === "repeater" && enemy.lastSpellHit === spell) {
      amount *= 0.45;
      this.say("复读怪抗住了同一句，换个咒语。");
    }
    if (spell) enemy.lastSpellHit = spell;
    enemy.hp -= amount;
    if (enemy.hp > 0) return;
    this.kills += 1;
    this.score += Math.round(ENEMY_CONFIG[enemy.type].xp * 10 + this.elapsed);
    this.cannonMeter = clamp(this.cannonMeter + (enemy.type === "target" ? 14 : 3), 0, 100);
    this.drops.push({
      position: { ...enemy.position },
      value: ENEMY_CONFIG[enemy.type].xp,
      radius: 7,
      magnet: 0,
    });
    this.addBurst(enemy.position, ENEMY_CONFIG[enemy.type].color, enemy.type === "target" ? 28 : 10);
    if (shatters) {
      this.explode(enemy.position, this.freezeShatterRadius, 8 + this.freezeDuration * 4, true);
    }
  }

  private hurtPlayer(amount: number, ignoreInvuln = false): void {
    if (!ignoreInvuln && this.player.invuln > 0) return;
    let remaining = Math.max(1, amount - this.armor);
    if (this.player.shield > 0) {
      const absorbed = Math.min(this.player.shield, remaining);
      this.player.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      this.player.hp -= remaining;
      this.player.invuln = 0.65;
      this.addBurst(this.player.position, "#ff4f6d", 16);
    }
    if (this.player.hp <= 0) {
      this.endRun();
    }
  }

  private endRun(): void {
    this.gameOver = true;
    this.running = false;
    this.startOverlay.hidden = false;
    this.startOverlay.querySelector("h1")!.textContent = "本局结束";
    this.startOverlay.querySelector("p")!.textContent = `分数 ${this.score}，击杀 ${this.kills}。再来一局，争取更梆。`;
    this.startOverlay.querySelector("button")!.textContent = "重新开始";
  }

  private checkLevelUp(): void {
    if (this.xp < this.xpGoal) return;
    this.xp -= this.xpGoal;
    this.level += 1;
    this.xpGoal = this.level <= 6 ? Math.round(this.xpGoal * 1.12 + 6) : Math.round(this.xpGoal * 1.18 + 12);
    this.applyBaselineLevelReward();
    this.selectingBuff = true;
    this.showBuffChoices();
  }

  private applyBaselineLevelReward(): void {
    this.attackDamage += 0.7;
    if (this.level % 3 === 0) this.maxEnergy += 2;
    this.player.maxHp += 2;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
  }

  private showBuffChoices(): void {
    const choices = this.draftBuffs(3);
    this.upgradeChoices.replaceChildren();
    for (const buff of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.rarity = buff.rarity;
      button.innerHTML = `
        <span>${buff.rarity === "diamond" ? "钻石" : buff.rarity === "gold" ? "黄金" : "青铜"}</span>
        <strong>${buff.title}</strong>
        <em>${buff.description}</em>
      `;
      button.addEventListener("click", () => {
        buff.apply();
        this.ownedBuffs.set(buff.id, (this.ownedBuffs.get(buff.id) ?? 0) + 1);
        if (buff.spell) this.unlockedSpells.add(buff.spell);
        this.selectingBuff = false;
        this.upgradeOverlay.hidden = true;
        this.renderCommandDock();
        this.say(`获得：${buff.title}`);
      });
      this.upgradeChoices.append(button);
    }
    this.upgradeOverlay.hidden = false;
  }

  private draftBuffs(count: number): Buff[] {
    const pool = this.createBuffPool();
    const choices: Buff[] = [];

    for (const phase of this.draftPhaseOrder()) {
      if (choices.length >= count) break;
      this.takeDraftBuffWhere(pool, choices, (buff) => this.buffPhase(buff) === phase);
    }

    while (choices.length < count && pool.length > 0) {
      const source = pool.filter((buff) => this.isPhaseAllowed(buff));
      choices.push(this.takeDraftBuff(source.length > 0 ? source : pool, pool));
    }
    return choices;
  }

  private draftPhaseOrder(): Array<"starter" | "branch" | "combo" | "late"> {
    if (this.level <= 3) return ["starter", "starter", "branch"];
    if (this.level <= 7) return ["starter", "branch", "branch"];
    if (this.threatTier() < 2) return ["branch", "branch", "combo"];
    return ["combo", "late", "branch"];
  }

  private takeDraftBuffWhere(pool: Buff[], choices: Buff[], predicate: (buff: Buff) => boolean): void {
    const source = pool.filter((buff) => this.isPhaseAllowed(buff) && predicate(buff));
    if (source.length === 0) return;
    choices.push(this.takeDraftBuff(source, pool));
  }

  private takeDraftBuff(source: Buff[], pool: Buff[]): Buff {
    const index = Math.floor(Math.random() * source.length);
    const [buff] = source.splice(index, 1);
    const poolIndex = pool.findIndex((candidate) => candidate.id === buff.id);
    if (poolIndex >= 0) pool.splice(poolIndex, 1);
    return buff;
  }

  private isPassiveBuff(buff: Buff): boolean {
    return buff.id.startsWith("stat-") || buff.id.startsWith("weapon-") || buff.id.startsWith("survive-");
  }

  private buffPhase(buff: Buff): "starter" | "branch" | "combo" | "late" {
    if (buff.phase) return buff.phase;
    if (this.isEarlyAbilityBuff(buff)) return "starter";
    if (["weapon-damage", "weapon-rate", "weapon-speed", "weapon-guard-turret", "weapon-blade", "survive-hp", "stat-energy", "stat-damage", "stat-rate"].includes(buff.id)) {
      return "starter";
    }
    if (buff.id.startsWith("combo-") || buff.id === "stat-chain") return buff.rarity === "diamond" ? "late" : "combo";
    if (buff.rarity === "diamond" || this.isLatePowerBuff(buff)) return "late";
    if (this.isPassiveBuff(buff) || buff.rarity === "gold") return "branch";
    return "starter";
  }

  private isPhaseAllowed(buff: Buff): boolean {
    const phase = this.buffPhase(buff);
    if (phase === "late") return this.threatTier() >= 2 || this.level >= 7;
    if (phase === "combo") return this.threatTier() >= 1 || this.level >= 5;
    return true;
  }

  private buffMaxStacks(buff: Buff): number {
    if (buff.maxStacks) return buff.maxStacks;
    if (buff.spell) return 1;
    if (buff.id.startsWith("combo-")) return buff.rarity === "diamond" ? 1 : 2;
    if (buff.id.startsWith("survive-")) return 4;
    if (buff.id === "stat-chain") return 3;
    if (buff.id.startsWith("weapon-")) return 5;
    return 6;
  }

  private isEarlyAbilityBuff(buff: Buff): boolean {
    return [
      "spell-evade",
      "spell-shield",
      "spell-gather",
      "spell-explode",
      "spell-freeze",
      "spell-split",
      "spell-ricochet",
    ].includes(buff.id);
  }

  private hasSpell(spell: SpellKey): boolean {
    return this.unlockedSpells.has(spell);
  }

  private createBuffPool(): Buff[] {
    const buffs: Buff[] = [
      { id: "spell-evade", title: "基础咒语：闪避", description: "解锁语音“闪避”，操作忙不过来时自动脱离危险。", rarity: "bronze", spell: "evade", apply: () => { this.moveSpeed += 8; } },
      { id: "spell-shield", title: "基础咒语：护盾", description: "解锁语音“护盾”，获得短暂容错。", rarity: "bronze", spell: "shield", apply: () => { this.player.maxHp += 4; this.player.hp += 4; } },
      { id: "spell-gather", title: "基础咒语：聚拢", description: "解锁语音“聚拢”，把掉落经验吸过来，经验返能小幅提高。", rarity: "bronze", spell: "gather", apply: () => { this.magnetRadius += 12; this.dropEnergyRatio += 0.03; } },
      { id: "spell-explode", title: "咒语：爆炸", description: "解锁语音“爆炸”，让后续攻击范围爆破。", rarity: "bronze", spell: "explode", apply: () => { this.explosionRadius += 4; } },
      { id: "spell-freeze", title: "咒语：冻结", description: "解锁语音“冻结”，控住近身敌人并附魔子弹。", rarity: "bronze", spell: "freeze", apply: () => { this.freezeDuration += 0.15; } },
      { id: "spell-lightning", title: "咒语：雷电", description: "解锁语音“雷电”，对多个目标连锁电击。", rarity: "gold", spell: "lightning", apply: () => { this.lightningJumps += 1; } },
      { id: "spell-split", title: "咒语：分裂", description: "解锁语音“分裂”，把自动攻击拆成三路。", rarity: "bronze", spell: "split", apply: () => { this.attackDamage += 1; } },
      { id: "spell-pierce", title: "咒语：穿透", description: "解锁语音“穿透”，短时间贯穿怪潮。", rarity: "gold", spell: "pierce", apply: () => { this.projectileSpeed += 25; } },
      { id: "spell-ricochet", title: "咒语：弹射", description: "解锁语音“弹射”，命中后跳向附近敌人。", rarity: "bronze", spell: "ricochet", apply: () => { this.ricochetRange += 24; } },
      { id: "spell-focus", title: "战术锁定", description: "解锁语音“锁定”，优先处理静音、远程和高血量目标。", rarity: "gold", spell: "focus", apply: () => { this.attackDamage += 1; } },
      { id: "spell-bang", title: "咒语：梆梆不梆梆", description: "解锁两段冲击拳，命中越多越梆。", rarity: "gold", spell: "bang", apply: () => { this.bangLevel += 1; } },
      { id: "spell-skillgo", title: "咒语：技能五子棋", description: "解锁五枚短时棋子炮台，落子无悔。", rarity: "diamond", spell: "skillGo", apply: () => { this.skillGoLevel += 1; } },
      { id: "spell-xiexiu", title: "邪修路线", description: "解锁“邪修”，随机施放已拥有攻击咒语，声能恢复 +1.6。", rarity: "gold", spell: "xiexiu", apply: () => { this.energyRegen += 1.6; } },
      { id: "spell-serious", title: "当个事儿办", description: "解锁辅助锁敌，短时间认真处理危险目标。", rarity: "bronze", spell: "serious", apply: () => { this.attackRate *= 0.96; } },
      { id: "spell-wealth", title: "来财", description: "解锁“来财”，大范围吸取经验，经验返能明显提高。", rarity: "bronze", spell: "wealth", apply: () => { this.magnetRadius += 20; this.dropEnergyRatio += 0.06; } },
      { id: "spell-calm", title: "从容", description: "解锁优雅闪避，位移更短但冷静返能，声能恢复 +2。", rarity: "bronze", spell: "calm", apply: () => { this.energyRegen += 2; } },
      { id: "spell-scramble", title: "连滚带爬", description: "解锁残血逃生咒语，狼狈但很有效。", rarity: "gold", spell: "scramble", apply: () => { this.player.maxHp += 6; this.player.hp += 6; } },
      { id: "stat-explode-radius", title: "爆炸半径", description: "爆炸范围 +18。", rarity: "bronze", phase: "branch", maxStacks: 6, apply: () => { this.explosionRadius += 18; } },
      { id: "stat-explode-damage", title: "爆炸伤害", description: "爆炸伤害系数提高。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.explosionDamageScale += 0.07; } },
      { id: "stat-explode-duration", title: "爆炸续唱", description: "爆炸 Buff 持续时间 +1.5 秒。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.explosionDurationBonus += 1.5; } },
      { id: "stat-explode-chain", title: "连锁引爆", description: "爆炸范围 +10，自动攻击伤害 +2。", rarity: "gold", phase: "combo", maxStacks: 3, apply: () => { this.explosionRadius += 10; this.attackDamage += 2; } },
      { id: "stat-freeze-duration", title: "低温延长", description: "冻结时长 +0.45 秒。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.freezeDuration += 0.45; } },
      { id: "stat-freeze-radius", title: "冷气外扩", description: "喊冻结时的控场半径 +24。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.freezePulseRadius += 24; } },
      { id: "stat-freeze-brittle", title: "冻裂反应", description: "冻结更久，爆炸范围 +8。", rarity: "gold", phase: "combo", maxStacks: 3, apply: () => { this.freezeDuration += 0.3; this.explosionRadius += 8; } },
      { id: "stat-split-count", title: "分裂数量", description: "分裂 Buff 开启时额外增加一对侧向弹。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.splitExtraPairs += 1; } },
      { id: "stat-split-angle", title: "分裂角度", description: "分裂弹角度更宽，覆盖侧翼怪潮。", rarity: "bronze", phase: "branch", maxStacks: 3, apply: () => { this.splitAngle += 0.08; } },
      { id: "stat-split-duration", title: "分裂续唱", description: "分裂 Buff 持续时间 +1.5 秒。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.splitDurationBonus += 1.5; } },
      { id: "stat-split-damage", title: "裂片加压", description: "分裂 Buff 开启时，自动攻击伤害 +2。", rarity: "gold", phase: "branch", maxStacks: 4, apply: () => { this.splitDamageBonus += 2; } },
      { id: "stat-split-speed", title: "裂片飞行", description: "弹速 +12%，自动攻击频率 +6%。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.projectileSpeed += 70; this.attackRate *= 0.94; } },
      { id: "stat-lightning-jump", title: "雷链跳数", description: "雷电跳跃 +2。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.lightningJumps += 2; } },
      { id: "stat-lightning-damage", title: "雷链电压", description: "雷电伤害系数提高，声能上限 +6。", rarity: "gold", phase: "branch", maxStacks: 4, apply: () => { this.lightningDamageScale += 0.08; this.maxEnergy += 6; } },
      { id: "stat-pierce-drill", title: "钻透弹道", description: "弹速 +8%，自动攻击伤害 +2。", rarity: "gold", apply: () => { this.projectileSpeed += 45; this.attackDamage += 2; } },
      { id: "stat-ricochet-count", title: "弹射次数", description: "弹射次数 +1，更适合清散怪。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.ricochetBounces += 1; } },
      { id: "stat-ricochet-range", title: "弹射距离", description: "弹射寻找目标距离 +70。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.ricochetRange += 70; } },
      { id: "stat-ricochet-damage", title: "弹射伤害", description: "弹射后伤害保留提高，跳得越多越不刮痧。", rarity: "gold", phase: "branch", maxStacks: 4, apply: () => { this.ricochetDamageMultiplier = Math.min(1.12, this.ricochetDamageMultiplier + 0.06); } },
      { id: "stat-ricochet-spark", title: "跳弹导电", description: "弹射 + 雷电：弹射次数 +1，雷电跳跃 +1。", rarity: "gold", phase: "combo", maxStacks: 3, apply: () => { this.ricochetBounces += 1; this.lightningJumps += 1; } },
      { id: "stat-ricochet-bloom", title: "弹跳开花", description: "弹射 + 爆炸：弹射距离 +35，爆炸半径 +12。", rarity: "gold", phase: "combo", maxStacks: 3, apply: () => { this.ricochetRange += 35; this.explosionRadius += 12; } },
      { id: "combo-lightning-burst", title: "雷爆导火", description: "雷电命中会追加小范围爆破，适合雷电 + 爆炸流。", rarity: "diamond", apply: () => { this.lightningBurstRadius += 72; this.explosionRadius += 8; } },
      { id: "combo-frozen-shatter", title: "冰裂弹片", description: "被冻结的敌人死亡会碎裂爆开，适合冻结 + 爆炸流。", rarity: "gold", apply: () => { this.freezeShatterRadius += 78; this.freezeDuration += 0.2; } },
      { id: "combo-pierce-ricochet", title: "折线贯穿", description: "穿透和弹射同时开启时，子弹额外贯穿 +2，弹射范围 +30。", rarity: "gold", apply: () => { this.ricochetPierceBonus += 2; this.ricochetRange += 30; } },
      { id: "combo-split-ricochet", title: "散射跳弹", description: "分裂和弹射同时开启时，额外发射两枚宽角跳弹。", rarity: "gold", apply: () => { this.splitRicochetProjectiles += 1; this.ricochetBounces += 1; } },
      { id: "combo-cannon-shards", title: "炮弹开花", description: "人间大炮落地后喷出弹片，若弹射 Buff 开启则弹片也会跳弹。", rarity: "diamond", apply: () => { this.cannonShardCount += 6; this.cannonMeter = Math.min(100, this.cannonMeter + 18); } },
      { id: "stat-bang-plus", title: "不止两拳", description: "梆梆不梆梆追加段数，命中返还更多大炮槽。", rarity: "gold", apply: () => { this.bangLevel += 1; } },
      { id: "stat-skillgo-plus", title: "棋子会玩技能", description: "技能五子棋等级 +1，棋子炮台更猛。", rarity: "diamond", apply: () => { this.skillGoLevel += 1; } },
      { id: "weapon-damage", title: "稳稳补刀", description: "自动攻击伤害 +3。就算不喊，也能稳定清怪。", rarity: "bronze", apply: () => { this.attackDamage += 3; } },
      { id: "weapon-rate", title: "自动连发", description: "自动攻击频率 +12%。", rarity: "bronze", apply: () => { this.attackRate *= 0.88; } },
      { id: "weapon-fan", title: "备用炮口", description: "自动攻击额外发射两枚小角度弹。", rarity: "gold", apply: () => { this.bonusProjectiles = Math.min(2, this.bonusProjectiles + 1); this.attackDamage += 1; } },
      { id: "weapon-speed", title: "弹速校准", description: "自动攻击弹速 +15%，拾取范围 +20，经验返能小幅提高。", rarity: "bronze", apply: () => { this.projectileSpeed += 84; this.magnetRadius += 20; this.dropEnergyRatio += 0.02; } },
      { id: "weapon-guard-turret", title: "护身小炮塔", description: "小炮塔数量 +1，自动向附近敌人开火。", rarity: "bronze", phase: "starter", maxStacks: 4, apply: () => { this.guardTurretCount += 1; this.guardTurretDamage += 1; } },
      { id: "weapon-guard-damage", title: "炮塔火力", description: "小炮塔子弹伤害 +3。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.guardTurretCount = Math.max(1, this.guardTurretCount); this.guardTurretDamage += 3; } },
      { id: "weapon-guard-rate", title: "炮塔连发", description: "小炮塔射速提高。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.guardTurretCount = Math.max(1, this.guardTurretCount); this.guardTurretRate *= 0.86; } },
      { id: "weapon-guard-range", title: "炮塔射程", description: "小炮塔索敌范围 +70。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.guardTurretCount = Math.max(1, this.guardTurretCount); this.guardTurretRange += 70; } },
      { id: "weapon-guard-ricochet", title: "哨戒跳弹", description: "小炮塔数量 +1，弹射范围 +20，开启弹射时炮塔子弹也会跳。", rarity: "gold", phase: "combo", maxStacks: 3, apply: () => { this.guardTurretCount += 1; this.ricochetRange += 20; } },
      { id: "weapon-blade", title: "旋转刀刃", description: "刀刃数量 +2，贴身切开怪潮。", rarity: "bronze", phase: "starter", maxStacks: 3, apply: () => { this.bladeCount += 2; this.bladeDamage += 1; } },
      { id: "weapon-blade-count", title: "刀刃数量", description: "刀刃 +1，近身覆盖更稳定。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.bladeCount += 1; } },
      { id: "weapon-blade-radius", title: "刀圈外扩", description: "刀刃旋转半径 +10。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.bladeCount = Math.max(2, this.bladeCount); this.bladeRadius += 10; } },
      { id: "weapon-blade-damage", title: "刀刃锋利", description: "刀刃伤害 +3。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.bladeCount = Math.max(2, this.bladeCount); this.bladeDamage += 3; } },
      { id: "weapon-blade-motor", title: "高速刀盘", description: "刀刃转速提高。", rarity: "gold", phase: "branch", maxStacks: 4, apply: () => { this.bladeCount = Math.max(2, this.bladeCount); this.bladeSpinSpeed += 0.9; } },
      { id: "combo-blade-freeze", title: "冰刀护身", description: "刀刃伤害提高；冻结 Buff 开启时，刀刃会短暂冻住命中的敌人。", rarity: "gold", apply: () => { this.bladeCount = Math.max(2, this.bladeCount); this.bladeDamage += 2; this.freezeDuration += 0.15; } },
      { id: "combo-blade-boom", title: "爆裂刀盘", description: "刀刃伤害提高；爆炸 Buff 开启时，刀刃偶尔触发小爆破。", rarity: "gold", apply: () => { this.bladeCount = Math.max(2, this.bladeCount); this.bladeDamage += 2; this.explosionRadius += 8; } },
      { id: "survive-hp", title: "先把血抬上来", description: "生命上限 +18，并立即回复 18。", rarity: "bronze", apply: () => { this.player.maxHp += 18; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 18); } },
      { id: "survive-armor", title: "安全帽", description: "受到的每次伤害 -2，落地也体面一点。", rarity: "gold", apply: () => { this.armor += 2; } },
      { id: "survive-regen", title: "慢慢缓过来", description: "每秒恢复少量 HP，适合操作不过来时稳住。", rarity: "gold", apply: () => { this.hpRegen += 0.75; } },
      { id: "stat-energy", title: "气口变长", description: "声能上限 +24，声能恢复 +3.5，经验返能提高，并立即回复 18。", rarity: "bronze", apply: () => { this.maxEnergy += 24; this.energyRegen += 3.5; this.dropEnergyRatio += 0.04; this.energy = clamp(this.energy + 18, 0, this.maxEnergy); } },
      { id: "stat-damage", title: "嘴比炮快", description: "自动攻击伤害 +2，声能上限 +4。", rarity: "bronze", apply: () => { this.attackDamage += 2; this.maxEnergy += 4; } },
      { id: "stat-rate", title: "急促咏唱", description: "自动攻击更快，并附带一点移动速度。", rarity: "bronze", apply: () => { this.attackRate *= 0.9; this.moveSpeed += 12; } },
      { id: "stat-cannon", title: "炮弹保修", description: "人间大炮充能更快，靶心怪奖励更多。", rarity: "gold", apply: () => { this.cannonMeter = Math.min(100, this.cannonMeter + 35); this.spawnBudget += 1.2; } },
      { id: "stat-chain", title: "终音爆破", description: "四个不同咒语链返能大幅提高，爆炸范围 +16。", rarity: "diamond", apply: () => { this.maxEnergy += 12; this.chainEnergyBonus += 10; this.explosionRadius += 16; } },
    ];
    return buffs.filter((buff) => {
      if (!this.isBuffPrerequisiteMet(buff)) {
        return false;
      }
      const owned = this.ownedBuffs.get(buff.id) ?? 0;
      if (owned >= this.buffMaxStacks(buff)) {
        return false;
      }
      return !buff.spell || !this.unlockedSpells.has(buff.spell);
    });
  }

  private isBuffPrerequisiteMet(buff: Buff): boolean {
    const requirements: Record<string, SpellKey | SpellKey[]> = {
      "stat-explode-radius": "explode",
      "stat-explode-damage": "explode",
      "stat-explode-duration": "explode",
      "stat-explode-chain": "explode",
      "stat-freeze-duration": "freeze",
      "stat-freeze-radius": "freeze",
      "stat-freeze-brittle": "freeze",
      "stat-split-count": "split",
      "stat-split-angle": "split",
      "stat-split-duration": "split",
      "stat-split-damage": "split",
      "stat-split-speed": "split",
      "stat-lightning-jump": "lightning",
      "stat-lightning-damage": "lightning",
      "stat-pierce-drill": "pierce",
      "stat-ricochet-count": "ricochet",
      "stat-ricochet-range": "ricochet",
      "stat-ricochet-damage": "ricochet",
      "stat-ricochet-spark": ["ricochet", "lightning"],
      "stat-ricochet-bloom": ["ricochet", "explode"],
      "combo-lightning-burst": ["lightning", "explode"],
      "combo-frozen-shatter": ["freeze", "explode"],
      "combo-pierce-ricochet": ["pierce", "ricochet"],
      "combo-split-ricochet": ["split", "ricochet"],
      "combo-cannon-shards": "ricochet",
      "combo-blade-freeze": "freeze",
      "combo-blade-boom": "explode",
      "stat-bang-plus": "bang",
      "stat-skillgo-plus": "skillGo",
    };
    const required = requirements[buff.id];
    if (!required) return true;
    return Array.isArray(required) ? required.every((spell) => this.hasSpell(spell)) : this.hasSpell(required);
  }

  private isMidPowerBuff(buff: Buff): boolean {
    return ["spell-lightning", "spell-pierce", "spell-focus", "spell-wealth", "spell-calm", "stat-ricochet-count", "stat-ricochet-range", "stat-ricochet-damage", "stat-ricochet-spark", "stat-ricochet-bloom", "combo-frozen-shatter", "combo-pierce-ricochet", "combo-split-ricochet", "weapon-guard-damage", "weapon-guard-rate", "weapon-guard-range", "weapon-guard-ricochet", "weapon-blade-count", "weapon-blade-radius", "weapon-blade-damage", "weapon-blade-motor", "combo-blade-freeze", "combo-blade-boom"].includes(buff.id);
  }

  private isLatePowerBuff(buff: Buff): boolean {
    return ["spell-bang", "spell-skillgo", "spell-xiexiu", "spell-serious", "spell-scramble", "stat-chain", "combo-lightning-burst", "combo-cannon-shards"].includes(buff.id);
  }

  private pickTarget(): Enemy | null {
    if (this.activeMods.focusTime > 0 || this.activeMods.seriousTime > 0) {
      const priority = [...this.enemies].sort((a, b) => {
        const scoreA = (a.type === "silencer" ? 3 : 0) + (a.type === "ranged" ? 2 : 0) + a.hp / 30;
        const scoreB = (b.type === "silencer" ? 3 : 0) + (b.type === "ranged" ? 2 : 0) + b.hp / 30;
        return scoreB - scoreA;
      })[0];
      if (priority) return priority;
    }
    return this.nearestEnemy(this.player.position, Infinity);
  }

  private nearestEnemy(position: Vec2, maxDistance: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = maxDistance;
    for (const enemy of this.enemies) {
      const dist = distance(position, enemy.position);
      if (dist < bestDist) {
        best = enemy;
        bestDist = dist;
      }
    }
    return best;
  }

  private guardTurretPosition(index: number): Vec2 {
    const count = Math.max(1, this.guardTurretCount);
    const angle = this.elapsed * 0.9 + (Math.PI * 2 * index) / count;
    const radius = this.player.radius + 28;
    return {
      x: clamp(this.player.position.x + Math.cos(angle) * radius, 18, this.width - 18),
      y: clamp(this.player.position.y + Math.sin(angle) * radius, 18, this.height - 18),
    };
  }

  private bladePosition(index: number): Vec2 {
    const count = Math.max(1, this.bladeCount);
    const angle = this.bladeAngle + (Math.PI * 2 * index) / count;
    return {
      x: this.player.position.x + Math.cos(angle) * this.bladeRadius,
      y: this.player.position.y + Math.sin(angle) * this.bladeRadius,
    };
  }

  private densestEnemyPoint(): Vec2 | null {
    let best: Enemy | null = null;
    let bestScore = 0;
    for (const enemy of this.enemies) {
      let score = enemy.type === "target" ? 6 : 1;
      for (const other of this.enemies) {
        if (enemy !== other && distance(enemy.position, other.position) < 140) score += 1;
      }
      if (score > bestScore) {
        best = enemy;
        bestScore = score;
      }
    }
    return best?.position ?? null;
  }

  private safeDirection(): Vec2 {
    const threat = this.enemies.reduce(
      (sum, enemy) => {
        const dist = Math.max(1, distance(enemy.position, this.player.position));
        const away = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
        const weight = enemy.type === "pouncer" ? 2.2 : enemy.type === "brute" ? 1.4 : 1;
        return { x: sum.x + away.x * weight / dist, y: sum.y + away.y * weight / dist };
      },
      { x: 0, y: 0 },
    );
    const centerBias = normalize({ x: this.width / 2 - this.player.position.x, y: this.height / 2 - this.player.position.y });
    return normalize({ x: threat.x * 180 + centerBias.x * 0.35, y: threat.y * 180 + centerBias.y * 0.35 });
  }

  private isPlayerSilenced(): boolean {
    return this.enemies.some((enemy) => enemy.type === "silencer" && distance(enemy.position, this.player.position) < 145);
  }

  private addBurst(position: Vec2, color: string, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 190;
      this.particles.push({
        position: { ...position },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: 2 + Math.random() * 4,
        color,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
      });
    }
  }

  private addParticle(from: Vec2, to: Vec2, color: string): void {
    this.particles.push({
      position: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
      velocity: { x: 0, y: 0 },
      radius: Math.max(3, distance(from, to) / 24),
      color,
      life: 0.14,
      maxLife: 0.14,
    });
  }

  private say(message: string): void {
    this.statusLine.textContent = message;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.renderArena(ctx);
    this.renderDrops(ctx);
    this.renderOrbitWeapons(ctx);
    this.renderTurrets(ctx);
    this.renderProjectiles(ctx);
    this.renderEnemies(ctx);
    this.renderEnemyShots(ctx);
    this.renderPlayer(ctx);
    this.renderParticles(ctx);
    this.renderHudText();
  }

  private renderArena(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(this.width / 2, this.height / 2, 80, this.width / 2, this.height / 2, this.width * 0.75);
    gradient.addColorStop(0, "#171929");
    gradient.addColorStop(1, "#090a12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = "rgba(99, 224, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    if (this.isPlayerSilenced()) {
      ctx.fillStyle = "rgba(122, 120, 255, 0.08)";
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (this.cannonTarget) {
      const target = this.cannonTarget;
      ctx.strokeStyle = "rgba(255, 226, 122, 0.8)";
      ctx.lineWidth = 2 + this.cannonCharge;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(this.player.position.x, this.player.position.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 226, 122, 0.18)";
      ctx.strokeStyle = "rgba(255, 226, 122, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 18 + this.cannonCharge * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(this.player.position.x, this.player.position.y);
    const cannon = this.player.cannonTime > 0;
    ctx.fillStyle = cannon ? "#ffe27a" : "#ffffff";
    ctx.shadowColor = cannon ? "#ff9b4a" : "#66e0ff";
    ctx.shadowBlur = cannon ? 22 : 14;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius + (cannon ? 5 : 0), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#101626";
    ctx.font = "900 14px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cannon ? "炮" : this.cannonCharge > 0 ? String(this.cannonCharge) : "我", 0, 1);
    if (this.player.shield > 0) {
      ctx.strokeStyle = "rgba(102, 224, 255, 0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      const cfg = ENEMY_CONFIG[enemy.type];
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      if (enemy.type === "silencer") {
        ctx.fillStyle = "rgba(122, 120, 255, 0.09)";
        ctx.beginPath();
        ctx.arc(0, 0, 145, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = enemy.frozen > 0 ? "#bdf2ff" : cfg.color;
      ctx.shadowColor = cfg.color;
      ctx.shadowBlur = enemy.type === "target" ? 18 : 8;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#101018";
      ctx.font = "900 13px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cfg.label, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(-enemy.radius, -enemy.radius - 10, enemy.radius * 2, 4);
      ctx.fillStyle = "#8aff94";
      ctx.fillRect(-enemy.radius, -enemy.radius - 10, enemy.radius * 2 * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const projectile of this.projectiles) {
      ctx.fillStyle = projectile.explosion ? "#ffb15a" : projectile.freeze ? "#a8ecff" : projectile.lightning ? "#e5ff66" : "#66e0ff";
      ctx.beginPath();
      ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderEnemyShots(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#ff5f7f";
    for (const shot of this.enemyShots) {
      ctx.beginPath();
      ctx.arc(shot.position.x, shot.position.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderDrops(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#7cff9b";
    for (const drop of this.drops) {
      ctx.beginPath();
      ctx.arc(drop.position.x, drop.position.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderTurrets(ctx: CanvasRenderingContext2D): void {
    for (const turret of this.turrets) {
      ctx.fillStyle = "#f8f1d1";
      ctx.strokeStyle = "#2c2840";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(turret.position.x - 10, turret.position.y - 10, 20, 20);
      ctx.fill();
      ctx.stroke();
    }
  }

  private renderOrbitWeapons(ctx: CanvasRenderingContext2D): void {
    if (this.guardTurretCount > 0) {
      for (let i = 0; i < this.guardTurretCount; i += 1) {
        const position = this.guardTurretPosition(i);
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(this.elapsed * 1.8 + i);
        ctx.fillStyle = "#dff9ff";
        ctx.strokeStyle = "#16324a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-8, -7, 16, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffcf5a";
        ctx.fillRect(4, -3, 10, 6);
        ctx.restore();
      }
    }
    if (this.bladeCount > 0) {
      ctx.strokeStyle = "rgba(142, 232, 255, 0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.player.position.x, this.player.position.y, this.bladeRadius, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < this.bladeCount; i += 1) {
        const position = this.bladePosition(i);
        const angle = this.bladeAngle + (Math.PI * 2 * i) / Math.max(1, this.bladeCount);
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = "#e9fbff";
        ctx.strokeStyle = "#66e0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(8, 9);
        ctx.lineTo(0, 5);
        ctx.lineTo(-8, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private renderHudText(): void {
    const hp = Math.max(0, Math.ceil(this.player.hp));
    const xpMissing = Math.max(0, Math.ceil(this.xpGoal - this.xp));
    const hpRatio = clamp(this.player.hp / this.player.maxHp, 0, 1);
    const energyRatio = clamp(this.energy / this.maxEnergy, 0, 1);
    const xpRatio = clamp(this.xp / this.xpGoal, 0, 1);
    this.hpFill.style.width = `${Math.round(hpRatio * 100)}%`;
    this.energyFill.style.width = `${Math.round(energyRatio * 100)}%`;
    this.xpFill.style.width = `${Math.round(xpRatio * 100)}%`;
    this.hpText.textContent = `${hp}/${this.player.maxHp}`;
    this.energyText.textContent = `${Math.round(this.energy)}/${this.maxEnergy}`;
    this.xpText.textContent = `差 ${xpMissing}`;
    const statEntries: Array<{ label: string; value: string; wide?: boolean }> = [
      { label: "火力", value: String(Math.round(this.attackDamage)) },
      { label: "回能", value: `${this.energyRegen.toFixed(1)}/秒` },
      { label: "拾能", value: `${Math.round(this.dropEnergyRatio * 100)}%` },
      { label: "弹射", value: `${this.ricochetBounces}次/${this.ricochetRange}/${Math.round(this.ricochetDamageMultiplier * 100)}%` },
      { label: "减伤", value: String(this.armor) },
      { label: "护盾", value: String(Math.round(this.player.shield)) },
      { label: "大炮", value: `${Math.round(this.cannonMeter)}%` },
      { label: "准备", value: `${this.cannonCharge}/3` },
      { label: "下次准备", value: this.cannonCharge >= 3 ? "已满" : `${this.nextCannonPrepCost()} 声能` },
      { label: "等级", value: `Lv.${this.level}` },
      { label: "分数", value: String(this.score) },
    ];
    if (this.cannonAiming) {
      statEntries.splice(5, 0, { label: "瞄准", value: "锁定中", wide: true });
    }
    if (this.unlockedSpells.has("split") || this.splitExtraPairs > 0) {
      statEntries.splice(5, 0, { label: "分裂", value: `${2 + this.splitExtraPairs * 2}发/${Math.round(this.splitAngle * 100)}` });
    }
    if (this.guardTurretCount > 0) {
      statEntries.splice(5, 0, { label: "炮塔", value: `${this.guardTurretCount}` });
    }
    if (this.bladeCount > 0) {
      statEntries.splice(5, 0, { label: "刀刃", value: `${this.bladeCount}` });
    }
    if (this.chainEnergyBonus > 0) {
      statEntries.splice(6, 0, { label: "链返", value: `+${3 + this.chainEnergyBonus}` });
    }
    const statSignature = statEntries.map((entry) => `${entry.label}:${entry.value}:${entry.wide ? "1" : "0"}`).join("|");
    if (statSignature !== this.lastStatSignature) {
      this.lastStatSignature = statSignature;
      this.statLine.replaceChildren(
        ...statEntries.map((entry) => {
          const item = document.createElement("span");
          item.className = `survivor-stat-chip${entry.wide ? " is-wide" : ""}`;

          const label = document.createElement("b");
          label.textContent = entry.label;

          const value = document.createElement("em");
          value.textContent = entry.value;

          item.append(label, value);
          return item;
        }),
      );
    }
    const chain = this.spellChain.map((spell) => SPELL_NAMES[spell]).join(" -> ");
    this.chainLine.textContent = chain ? `咒语链：${chain}` : "咒语链：先喊点不一样的。";
    this.updateCommandDockState();
    this.renderActiveSpellPanel();
  }

  private renderActiveSpellPanel(): void {
    const allTracked: Array<{ spell: SpellKey; time: number; duration: number }> = [
      { spell: "explode", time: this.activeMods.explosionTime, duration: 8.5 },
      { spell: "freeze", time: this.activeMods.freezeTime, duration: 8 },
      { spell: "lightning", time: this.activeMods.lightningTime, duration: 7 },
      { spell: "split", time: this.activeMods.splitTime, duration: 8.5 },
      { spell: "pierce", time: this.activeMods.pierceTime, duration: 8 },
      { spell: "ricochet", time: this.activeMods.ricochetTime, duration: 8 },
      { spell: "focus", time: this.activeMods.focusTime, duration: 6 },
    ];
    const tracked = allTracked.filter((item) => this.unlockedSpells.has(item.spell));

    this.activeSpellPanel.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "持续咒语";
    this.activeSpellPanel.append(title);

    if (tracked.length === 0) {
      const empty = document.createElement("span");
      empty.className = "survivor-active-empty";
      empty.textContent = "升级后解锁爆炸、冻结、分裂等 Buff。";
      this.activeSpellPanel.append(empty);
      return;
    }

    for (const item of tracked) {
      const row = document.createElement("div");
      row.className = "survivor-active-row";
      row.dataset.state = item.time > 0 ? "on" : "off";

      const name = document.createElement("span");
      name.textContent = SPELL_NAMES[item.spell];

      const track = document.createElement("i");
      track.style.setProperty("--spell-fill", `${Math.round(clamp(item.time / item.duration, 0, 1) * 100)}%`);

      const time = document.createElement("em");
      time.textContent = item.time > 0 ? `${item.time.toFixed(1)}s` : "待补";

      row.append(name, track, time);
      this.activeSpellPanel.append(row);
    }
  }

  private renderCommandDock(): void {
    this.commandDock.replaceChildren();
    const visible = [...this.unlockedSpells].filter((spell) => !["cannonPrep", "cannonFire"].includes(spell));
    for (const spell of visible) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.spell = spell;
      button.textContent = SPELL_NAMES[spell];
      button.title = `点击模拟语音：${SPELL_NAMES[spell]}`;
      button.addEventListener("click", () => this.castSpell(spell));
      this.commandDock.append(button);
    }
    const prep = document.createElement("button");
    prep.type = "button";
    prep.dataset.spell = "cannonPrep";
    prep.textContent = "一级准备";
    prep.addEventListener("click", () => this.castSpell("cannonPrep"));
    this.commandDock.append(prep);
    const fire = document.createElement("button");
    fire.type = "button";
    fire.dataset.spell = "cannonFire";
    fire.textContent = "发射";
    fire.addEventListener("click", () => this.castSpell("cannonFire"));
    this.commandDock.append(fire);
    this.updateCommandDockState();
  }

  private updateCommandDockState(): void {
    const buttons = this.commandDock.querySelectorAll<HTMLButtonElement>("button[data-spell]");
    for (const button of buttons) {
      const spell = button.dataset.spell as SpellKey | undefined;
      if (!spell) continue;
      const state = this.commandState(spell);
      button.textContent = state.label;
      button.title = state.title;
      button.dataset.state = state.state;
      button.setAttribute("aria-disabled", state.state === "ready" ? "false" : "true");
    }
  }

  private commandState(spell: SpellKey): { label: string; title: string; state: "ready" | "empty" | "blocked" } {
    if (spell === "cannonPrep") {
      if (this.cannonCharge >= 3) {
        return { label: "一级准备 已满", title: "一级准备已经三层，喊人间大炮锁定，再喊发射。", state: "blocked" };
      }
      const cost = this.nextCannonPrepCost();
      const enough = this.energy >= cost;
      return {
        label: `一级准备 ${cost}`,
        title: enough ? `消耗 ${cost} 声能，增加 1 层大炮充能。` : `声能不足：第 ${this.cannonCharge + 1} 层一级准备需要 ${cost}，当前 ${Math.floor(this.energy)}。`,
        state: enough ? "ready" : "empty",
      };
    }
    if (spell === "cannonFire") {
      if (this.cannonCharge <= 0) {
        return { label: "发射", title: "需要先喊一级准备获得至少 1 层充能。", state: "blocked" };
      }
      const meterCost = this.cannonFireMeterCost();
      const enough = this.cannonMeter >= meterCost;
      return {
        label: `发射 ${meterCost}%`,
        title: enough ? `消耗 ${meterCost}% 大炮槽，按 ${this.cannonCharge} 层充能发射。` : `大炮槽不足：需要 ${meterCost}%，当前 ${Math.floor(this.cannonMeter)}%。`,
        state: enough ? "ready" : "empty",
      };
    }
    if (spell === "cannon") {
      return { label: SPELL_NAMES[spell], title: "锁定敌群或进入瞄准，移动鼠标调整方向。", state: "ready" };
    }
    const cost = this.currentSpellCost(spell);
    const enough = this.energy >= cost;
    return {
      label: `${SPELL_NAMES[spell]} ${cost}`,
      title: enough ? `消耗 ${cost} 声能。` : `声能不足：${SPELL_NAMES[spell]}需要 ${cost}，当前 ${Math.floor(this.energy)}。`,
      state: enough ? "ready" : "empty",
    };
  }

  private currentSpellCost(spell: SpellKey): number {
    if (spell === "cannonPrep") return this.nextCannonPrepCost();
    if (spell === "cannon" || spell === "cannonFire") return 0;
    const fatigue = this.spellFatigueMultiplier(spell);
    const silenceCost = this.isPlayerSilenced() ? 1.6 : 1;
    return Math.round(SPELL_COSTS[spell] * (1 + (1 - fatigue) * 1.1) * silenceCost);
  }

  private cannonFireMeterCost(): number {
    return 15 + this.cannonCharge * 8;
  }
}
