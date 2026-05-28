import { VoiceInput } from "../game/voice";
import { LineglowSurvivorRenderer, type SurvivorRenderState } from "./render/LineglowSurvivorRenderer";
import { getLineglowSpellArt, type LineglowTone } from "./render/lineglowTheme";

export type Vec2 = {
  x: number;
  y: number;
};

type SpellConfig = {
  name: string;
  cost: number;
  category: "持续战斗 Buff" | "通用操作/救场" | "强力/乐子技能" | "技能碎片" | "隐藏 Combo" | "人间大炮核心";
  stage: string;
  effect: string;
  links?: readonly string[];
  hidden?: boolean;
  fragments?: readonly string[];
  aliases?: readonly string[];
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
    aliases: ["冻结", "冻住", "冰冻", "冰霜", "冷冻", "冰封", "冻洁", "东结", "东洁", "冰洞", "冰动", "兵冻", "兵动", "冰住", "冰一下", "冰", "冻", "封", "冷"],
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
    name: "梆梆",
    cost: 18,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "对最近敌人打一次冲击拳，命中返声能和大炮槽。",
    links: ["你就说梆梆不梆梆", "梆梆两拳"],
    aliases: ["梆梆", "邦邦", "棒棒", "帮帮", "磅磅", "蚌蚌", "梆", "邦", "棒", "帮", "磅", "bang"],
  },
  skillGo: {
    name: "技能五子棋",
    cost: 38,
    category: "强力/乐子技能",
    stage: "后期钻石咒语",
    effect: "放出短时棋子炮台阵，等级提高后可带爆炸/雷电。",
    aliases: ["技能五子棋", "技能五指棋", "技能无子棋", "技能五子其", "技能无止棋", "技能无子期", "技能", "开技能", "放技能", "五子棋", "五指棋", "无子棋", "五子其", "五子期", "棋来", "棋子来", "落子无悔", "洛子无悔", "下棋", "下子", "落子", "五子", "棋", "go"],
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
    aliases: ["当个事儿办", "当回事办", "当个事办", "当个事儿", "当回事", "认真模式", "办一下", "认真处理", "认真", "办事", "办", "事儿", "当回事"],
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
    aliases: ["从容", "游刃有余", "稳住", "冷静", "从荣", "葱蓉", "聪容", "从融", "从蓉", "葱容", "葱荣", "纵容", "从容一点", "淡定", "稳", "从", "静"],
  },
  scramble: {
    name: "连滚带爬",
    cost: 26,
    category: "通用操作/救场",
    stage: "后期救场咒语",
    effect: "残血逃生，获得更强位移和生存窗口。",
    aliases: ["连滚带爬", "救命", "跑路", "快跑", "逃命", "溜了", "快逃", "保命", "救", "跑", "逃", "爬", "溜"],
  },
  cardCheck: {
    name: "验牌",
    cost: 16,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "标记当前最危险敌人，使其短时间受到更高伤害。",
    links: ["我要验牌"],
    aliases: ["验牌", "查牌", "看牌", "翻牌", "验一下", "查一下", "看一下", "验盘", "盐牌", "眼牌", "验"],
  },
  woqu: {
    name: "我去",
    cost: 12,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "短促闪避，获得极短无敌。",
    links: ["我去不早说"],
    aliases: ["我去", "我趣", "我靠", "我超", "卧去", "卧趣", "沃去", "卧槽", "我草"],
  },
  tooLate: {
    name: "不早说",
    cost: 16,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "返还最近一次普通咒语的部分声能。",
    links: ["我去不早说"],
    aliases: ["不早说", "你不早说", "咋不早说", "怎么不早说", "早说啊", "早说", "不找说", "补早说", "你早说", "早说呀"],
  },
  noTalk: {
    name: "不讲",
    cost: 16,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "打断最近一个蓄力敌人，并短暂沉默小范围敌人。",
    links: ["不讲不讲"],
    aliases: ["不讲", "别讲", "不说", "别说", "不听", "闭嘴", "住口", "不讲了", "别吵", "闭嘴吧"],
  },
  urgentCry: {
    name: "你已急哭",
    cost: 34,
    category: "强力/乐子技能",
    stage: "中后期强力咒语",
    effect: "让附近敌人集体红温混乱，受到反伤，远程火力被干扰。",
    aliases: ["你已急哭", "你已经急哭", "急哭", "急了", "哭了", "哭哭", "你急了", "你已急了", "红温", "红了", "上头", "破防", "破防了", "你已破防", "破房了"],
  },
  received: {
    name: "收到",
    cost: 14,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "复制上一个普通咒语的一小部分效果；没有上一咒语时回复声能。",
    links: ["收到，收到"],
    aliases: ["收到", "收到收到", "收到啊", "收到了", "收到啦", "收到了啊", "明白", "明白了", "懂了"],
  },
  unknown: {
    name: "不知道",
    cost: 10,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "敌人短暂丢失锁定，玩家获得一点无敌。",
    links: ["不知道，我的身材很曼妙"],
    aliases: ["不知道", "不晓得", "不清楚", "我不知道", "不知道啊", "不懂", "我不懂", "不知", "不晓得啊"],
  },
  bodyShape: {
    name: "身材",
    cost: 10,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "短时间缩小玩家受击判定。",
    links: ["不知道，我的身材很曼妙"],
    aliases: ["身材", "体型", "身形", "我的身材", "身才", "身彩", "身段", "体态"],
  },
  graceful: {
    name: "曼妙",
    cost: 10,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "优雅侧滑，短时间擦弹回复声能。",
    links: ["不知道，我的身材很曼妙"],
    aliases: ["曼妙", "很曼妙", "蛮妙", "慢妙", "美妙", "很美妙", "优雅", "妙", "飘逸"],
  },
  internalDrain: {
    name: "内耗",
    cost: 14,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "消耗一点 HP 或护盾，换取声能和短暂伤害提升。",
    links: ["与其内耗，不如外耗"],
    aliases: ["内耗", "我内耗", "开始内耗", "耗自己", "内好", "内号", "内耗了", "自耗"],
  },
  externalDrain: {
    name: "外耗",
    cost: 16,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "诱导附近敌人互相碰撞，造成少量伤害。",
    links: ["与其内耗，不如外耗"],
    aliases: ["外耗", "出去耗", "耗别人", "外面耗", "外好", "外号", "外耗了", "耗外面"],
  },
  oldSelf: {
    name: "老己",
    cost: 12,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "回复少量 HP，获得一点护盾。",
    links: ["爱你老己，明天见"],
    aliases: ["老己", "爱你老己", "自己", "老几", "老纪", "老姬", "爱你老几", "爱自己"],
  },
  seeTomorrow: {
    name: "明天见",
    cost: 14,
    category: "技能碎片",
    stage: "早期技能碎片",
    effect: "给自己挂一个延迟回复，数秒后生效。",
    links: ["爱你老己，明天见"],
    aliases: ["明天见", "明天再见", "明天", "再见", "明天建", "明天见了", "明天见吧"],
  },
  comboBangFull: {
    name: "你就说梆梆不梆梆",
    cost: 36,
    category: "隐藏 Combo",
    stage: "隐藏单碎片 Combo",
    effect: "需要碎片 梆梆。多段冲击拳清近身怪，命中返声能和大炮槽。",
    hidden: true,
    fragments: ["bang"],
    aliases: ["你就说梆梆不梆梆", "你就说梆不梆", "你就说邦邦不邦邦", "你就说棒棒不棒棒", "梆梆不梆梆", "邦邦不邦邦", "棒棒不棒棒", "帮帮不帮帮", "梆梆不梆", "梆不梆"],
  },
  comboBangTwoFists: {
    name: "梆梆两拳",
    cost: 30,
    category: "隐藏 Combo",
    stage: "隐藏单碎片 Combo",
    effect: "需要碎片 梆梆。两段强打断，第二拳优先处理危险目标。",
    hidden: true,
    fragments: ["bang"],
    aliases: ["梆梆两拳", "邦邦两拳", "棒棒两拳", "帮帮两拳", "磅磅两拳", "邦邦两全", "两拳", "两下"],
  },
  comboCardCheck: {
    name: "我要验牌",
    cost: 36,
    category: "隐藏 Combo",
    stage: "隐藏单碎片 Combo",
    effect: "需要碎片 验牌。全场危险敌人破甲并爆出作弊牌。",
    hidden: true,
    fragments: ["cardCheck"],
    aliases: ["我要验牌", "我想验牌", "给我验牌", "我要查牌", "我要看牌", "给我查牌", "验牌验牌"],
  },
  comboTooLate: {
    name: "我去不早说",
    cost: 44,
    category: "隐藏 Combo",
    stage: "隐藏双碎片 Combo",
    effect: "需要碎片 我去 + 不早说。回溯玩家位置和 HP，并保留敌人已受伤害。",
    hidden: true,
    fragments: ["woqu", "tooLate"],
    aliases: ["我去不早说", "我趣不早说", "我靠不早说", "我超不早说", "卧槽不早说", "我去你不早说", "我去咋不早说"],
  },
  comboNoTalk: {
    name: "不讲不讲",
    cost: 34,
    category: "隐藏 Combo",
    stage: "隐藏单碎片 Combo",
    effect: "需要碎片 不讲。展开拒绝沟通领域，沉默敌人并清除弹幕。",
    hidden: true,
    fragments: ["noTalk"],
    aliases: ["不讲不讲", "不讲了不讲了", "别讲别讲", "不听不听", "不说不说", "别说别说", "闭嘴闭嘴", "住口住口"],
  },
  comboReceived: {
    name: "收到，收到",
    cost: 36,
    category: "隐藏 Combo",
    stage: "隐藏单碎片 Combo",
    effect: "需要碎片 收到。复读最近两个普通咒语，并附加小爆破。",
    hidden: true,
    fragments: ["received"],
    aliases: ["收到收到", "收到，收到", "收到 收到", "收到收到收到"],
  },
  comboGracefulBody: {
    name: "不知道，我的身材很曼妙",
    cost: 58,
    category: "隐藏 Combo",
    stage: "隐藏三碎片 Combo",
    effect: "需要碎片 不知道 + 身材 + 曼妙。进入曼妙判定，擦弹回能并积攒自信光环。",
    hidden: true,
    fragments: ["unknown", "bodyShape", "graceful"],
    aliases: ["不知道我的身材很曼妙", "不知道，我的身材很曼妙", "我不知道我的身材很曼妙", "不知道身材很曼妙", "不知道我的身材很美妙", "不知道我身材很曼妙", "不知道身材曼妙", "我的身材很曼妙"],
  },
  comboExternalize: {
    name: "与其内耗，不如外耗",
    cost: 46,
    category: "隐藏 Combo",
    stage: "隐藏双碎片 Combo",
    effect: "需要碎片 内耗 + 外耗。把玩家压力转嫁给怪群，敌人互相拉扯反伤。",
    hidden: true,
    fragments: ["internalDrain", "externalDrain"],
    aliases: ["与其内耗不如外耗", "与其内耗，不如外耗", "与其内好不如外好", "与其内耗不如外号", "内耗不如外耗", "内好不如外好", "内耗外耗", "别内耗去外耗"],
  },
  comboSeeTomorrow: {
    name: "爱你老己，明天见",
    cost: 48,
    category: "隐藏 Combo",
    stage: "隐藏双碎片 Combo",
    effect: "需要碎片 老己 + 明天见。获得一次今晚不死保险，触发后回复并免下一次普通咒语费用。",
    hidden: true,
    fragments: ["oldSelf", "seeTomorrow"],
    aliases: ["爱你老己明天见", "爱你老己，明天见", "爱你老几明天见", "爱自己明天见", "老己明天见", "老几明天见"],
  },
} as const satisfies Record<string, SpellConfig>;

export type SpellKey = keyof typeof SPELL_CONFIG;
type RunMode = "normal" | "wild";
type UpgradePickMode = "manual" | "safe" | "instant";

const SPELL_KEYS = Object.keys(SPELL_CONFIG) as SpellKey[];
const CORE_VOICE_SPELLS = ["cannon", "cannonPrep", "cannonFire"] as const satisfies readonly SpellKey[];
const EXTRA_COMMAND_SHORTCUTS = ["z", "x", "c", "v", "b", "n", "m"] as const;
const TEST_FUN_SPELLS = [
  "bang",
  "skillGo",
  "xiexiu",
  "serious",
  "cardCheck",
  "woqu",
  "tooLate",
  "noTalk",
  "urgentCry",
  "received",
  "unknown",
  "bodyShape",
  "graceful",
  "internalDrain",
  "externalDrain",
  "oldSelf",
  "seeTomorrow",
  "comboBangFull",
  "comboBangTwoFists",
  "comboCardCheck",
  "comboTooLate",
  "comboNoTalk",
  "comboReceived",
  "comboGracefulBody",
  "comboExternalize",
  "comboSeeTomorrow",
] as const satisfies readonly SpellKey[];
const TEST_COMMAND_SPELLS = [
  "skillGo",
  "xiexiu",
  "serious",
  "urgentCry",
  "comboBangFull",
  "comboBangTwoFists",
  "comboCardCheck",
  "comboTooLate",
  "comboNoTalk",
  "comboReceived",
  "comboGracefulBody",
  "comboExternalize",
  "comboSeeTomorrow",
] as const satisfies readonly SpellKey[];
const MAX_GENERATED_ALIASES_PER_SEED = 36;

type SpellVoiceCommand = {
  key: SpellKey;
  aliases: readonly string[];
  priority: number;
};

const SPELL_VOICE_CONFUSABLES: Record<string, readonly string[]> = {
  爆: ["暴", "报", "抱"],
  炸: ["诈", "榨", "乍"],
  冻: ["动", "东"],
  结: ["洁", "姐"],
  冰: ["兵"],
  雷: ["来"],
  电: ["店", "点"],
  分: ["纷"],
  裂: ["烈", "列"],
  穿: ["传", "串"],
  透: ["偷"],
  弹: ["蛋", "谈"],
  射: ["社", "设", "摄"],
  闪: ["善", "陕"],
  避: ["币", "闭", "壁", "必"],
  护: ["户", "互", "糊"],
  盾: ["顿", "墩"],
  聚: ["巨", "句"],
  拢: ["龙", "笼"],
  锁: ["索", "所"],
  定: ["订"],
  人: ["仁"],
  间: ["尖", "肩"],
  炮: ["跑", "泡", "抱", "爆"],
  级: ["集", "击"],
  准: ["准"],
  备: ["背"],
  发: ["法"],
  开: ["凯", "铠", "楷", "恺"],
  火: ["伙", "活", "霍"],
  梆: ["邦", "棒", "帮", "磅"],
  技: ["计"],
  五: ["午", "无"],
  子: ["指", "止"],
  棋: ["其", "期"],
  邪: ["斜", "协", "写"],
  修: ["休"],
  当: ["挡"],
  事: ["是"],
  办: ["伴"],
  来: ["莱"],
  财: ["才"],
  从: ["葱", "聪", "纵"],
  容: ["荣", "蓉", "融"],
  验: ["眼", "盐"],
  牌: ["排", "盘"],
  去: ["趣"],
  早: ["找"],
  讲: ["奖"],
  收: ["手", "守"],
  到: ["道"],
  知: ["之"],
  道: ["到"],
  身: ["伸", "生"],
  材: ["才", "彩"],
  曼: ["慢", "蛮"],
  妙: ["庙"],
  内: ["那"],
  耗: ["好", "号"],
  外: ["歪"],
  老: ["佬"],
  己: ["几", "纪", "姬"],
  明: ["鸣"],
  天: ["添"],
  见: ["建"],
  急: ["集"],
  哭: ["酷"],
};

const VOICE_COMBO_CONFIG = {
  stormBloom: {
    name: "雷爆跳弹",
    spells: ["lightning", "explode", "ricochet"],
    aliases: ["雷爆跳弹", "雷暴跳弹", "雷爆跳蛋", "雷电爆炸弹射", "雷电弹射爆炸", "爆炸雷电弹射", "雷爆弹射", "闪电爆炸跳弹"],
    effect: "雷电、爆炸、弹射同时接上时，额外触发多点雷爆和跳弹强化。",
  },
  iceBomb: {
    name: "冻结爆炸",
    spells: ["freeze", "explode"],
    aliases: ["冻结爆炸", "冰冻爆炸", "冰动爆炸", "兵冻爆炸", "冰爆", "冻爆", "先冻再炸", "冰封爆破"],
    effect: "冻结和爆炸同时接上时，对近身怪潮造成冰爆冲击。",
  },
  thunderRicochet: {
    name: "跳弹导电",
    spells: ["lightning", "ricochet"],
    aliases: ["跳弹导电", "跳蛋导电", "雷电弹射", "弹射雷电", "电弧跳弹", "连电跳弹"],
    effect: "雷电和弹射同时接上时，雷链跳跃更远，弹射更容易滚起来。",
  },
  scatterRicochet: {
    name: "散射跳弹",
    spells: ["split", "ricochet"],
    aliases: ["散射跳弹", "散射跳蛋", "分裂弹射", "分裂跳弹", "散开弹射", "裂开跳弹"],
    effect: "分裂和弹射同时接上时，追加一圈会跳的散射弹。",
  },
  pierceRicochet: {
    name: "折线贯穿",
    spells: ["pierce", "ricochet"],
    aliases: ["折线贯穿", "折现贯穿", "穿透弹射", "贯穿弹射", "穿透跳弹", "折返穿透"],
    effect: "穿透和弹射同时接上时，发射贯穿折返弹处理密集怪潮。",
  },
  bloomRicochet: {
    name: "弹跳开花",
    spells: ["explode", "ricochet"],
    aliases: ["弹跳开花", "跳弹开花", "弹跳开挂", "爆炸弹射", "弹射爆炸", "跳弹爆炸", "弹跳爆破"],
    effect: "爆炸和弹射同时接上时，在多个敌人身上连续开花。",
  },
  frostBlades: {
    name: "冰刀护身",
    spells: ["freeze"],
    aliases: ["冰刀护身", "冰刀护生", "冰刀护神", "冻结刀刃", "冰霜刀刃", "冰刀", "刀刃冻结"],
    effect: "有刀刃成长时，冻结咒语会让近身刀圈更强；没有刀刃时也能触发一次冰环。",
  },
  boomBlades: {
    name: "爆裂刀盘",
    spells: ["explode"],
    aliases: ["爆裂刀盘", "爆烈刀盘", "爆炸刀刃", "刀刃爆炸", "爆裂刀刃", "刀盘爆破"],
    effect: "有刀刃成长时，爆炸咒语会让刀圈喷出爆裂弹；没有刀刃时触发一次小爆破。",
  },
  cannonBloom: {
    name: "炮弹开花",
    spells: ["cannonPrep", "ricochet", "cannon", "cannonFire"],
    aliases: ["炮弹开花", "炮弹开挂", "人间大炮弹射发射", "弹射人间大炮发射", "大炮弹射发射", "弹射发射", "人间大炮开花"],
    effect: "在人间大炮发射时接上弹射，额外喷出弹片并延长飞行冲击。",
  },
} as const satisfies Record<
  string,
  { name: string; spells: readonly SpellKey[]; aliases: readonly string[]; effect: string }
>;

const VOICE_COMBO_DANMAKU_COLORS: Record<keyof typeof VOICE_COMBO_CONFIG, { color: string; accent: string }> = {
  stormBloom: { color: "#e5ff66", accent: "#ff9b4a" },
  iceBomb: { color: "#9be7ff", accent: "#ff9b4a" },
  thunderRicochet: { color: "#e5ff66", accent: "#fff06a" },
  scatterRicochet: { color: "#8ee8ff", accent: "#fff06a" },
  pierceRicochet: { color: "#ffffff", accent: "#fff06a" },
  bloomRicochet: { color: "#ff9b4a", accent: "#fff06a" },
  frostBlades: { color: "#9be7ff", accent: "#ffffff" },
  boomBlades: { color: "#ff9b4a", accent: "#ffffff" },
  cannonBloom: { color: "#ffe27a", accent: "#ff9b4a" },
};

type VoiceControlAction = {
  type: "voice";
  command: "start" | "stop";
};

type VoiceComboKey = keyof typeof VOICE_COMBO_CONFIG;
type SurvivorVoiceAction =
  | VoiceControlAction
  | { type: "spell"; spell: SpellKey }
  | { type: "combo"; combo: VoiceComboKey; spells: readonly SpellKey[] };

export type EnemyType = "runner" | "brute" | "pouncer" | "ranged" | "repeater" | "silencer" | "target";

export type Enemy = {
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

export type Projectile = {
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
  label?: string;
  color?: string;
};

export type EnemyShot = {
  position: Vec2;
  velocity: Vec2;
  radius: number;
  damage: number;
  life: number;
  grazed?: boolean;
};

export type Drop = {
  position: Vec2;
  value: number;
  radius: number;
  magnet: number;
};

type PlayerSnapshot = {
  time: number;
  position: Vec2;
  hp: number;
};

export type Particle = {
  position: Vec2;
  velocity: Vec2;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
};

type SpellCue = {
  kind: "ring" | "fan" | "glyph" | "fallGlyph" | "punchGlyph" | "slamGlyph" | "weakenGlyph" | "card";
  position: Vec2;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  label?: string;
  angle?: number;
  spread?: number;
  lines?: number;
  delay?: number;
  fallDistance?: number;
  direction?: Vec2;
  amplitude?: number;
  cycles?: number;
  startScale?: number;
  endScale?: number;
  accent?: string;
};

type ComboFlash = {
  label: string;
  sublabel: string;
  color: string;
  accent: string;
  life: number;
  maxLife: number;
};

type VoiceDanmakuKind = "plain" | "spell" | "combo";

type VoiceDanmaku = {
  text: string;
  kind: VoiceDanmakuKind;
  color: string;
  accent: string;
  lane: number;
  x: number;
  y: number;
  speed: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  width: number;
};

type VoiceDanmakuPin = {
  label: string;
  sublabel: string;
  color: string;
  accent: string;
  life: number;
  maxLife: number;
  size: number;
  seed: number;
};

type PendingExternalizeBlast = {
  time: number;
  center: Vec2;
  pushRadius: number;
  damage: number;
  power: number;
  gathered: number;
  missingHpRatio: number;
};

type PendingCardReveal = {
  time: number;
  enemyId: number;
  position: Vec2;
  cardPosition: Vec2;
  damage: number;
  isMain: boolean;
  isDanger: boolean;
};

type PendingTooLateEvent = {
  time: number;
  phase: "rewind" | "blast";
  from: Vec2;
  to: Vec2;
  power: number;
  hp: number;
  healed: number;
  oldPressure: number;
  refundEnergy: number;
};

type TooLateZone = {
  center: Vec2;
  radius: number;
  life: number;
  maxLife: number;
  power: number;
};

type RefusalZone = {
  center: Vec2;
  radius: number;
  life: number;
  maxLife: number;
  power: number;
  tick: number;
  clearedShots: number;
  interrupted: number;
};

type ReceivedCharge = {
  life: number;
  maxLife: number;
  power: number;
  spells: SpellKey[];
  energy: number;
};

type PendingReceivedReceipt = {
  time: number;
  spell: SpellKey | null;
  index: number;
  total: number;
  power: number;
  center: Vec2;
};

type PendingTomorrowInsuranceEvent = {
  time: number;
  phase: "impact" | "settle";
  center: Vec2;
  radius: number;
  damage: number;
  heal: number;
  nearby: number;
};

type PendingBangTwoFistEvent = {
  time: number;
  enemyId: number | null;
  position: Vec2;
  origin: Vec2;
  power: number;
};

type SeriousCase = {
  enemyId: number;
  progress: number;
  life: number;
  maxLife: number;
  power: number;
};

type PendingUrgentCryEvent = {
  time: number;
  phase: "break" | "complaints" | "finale";
  center: Vec2;
  radius: number;
  power: number;
  pressureIndex: number;
  affectedIds: number[];
  shotCount: number;
  missingHpRatio: number;
};

type ImpactLine = {
  position: Vec2;
  angle: number;
  innerRadius: number;
  outerRadius: number;
  drift: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
};

type LightningArc = {
  from: Vec2;
  to: Vec2;
  color: string;
  coreColor: string;
  life: number;
  maxLife: number;
  width: number;
  branches: number;
  seed: number;
};

type FrostWave = {
  position: Vec2;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  spokes: number;
  seed: number;
};

type FrostShard = {
  position: Vec2;
  angle: number;
  length: number;
  width: number;
  drift: number;
  color: string;
  life: number;
  maxLife: number;
};

export type PlayerAfterimage = {
  position: Vec2;
  radius: number;
  color: string;
  angle: number;
  stretch: number;
  life: number;
  maxLife: number;
};

export type Turret = {
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

type ResultRating = {
  label: string;
  score: number;
};

type PersonalLeaderboardEntry = {
  id: string;
  score: number;
  rating: string;
  rawScore: number;
  kills: number;
  level: number;
  survivalTime: number;
  buffCount: number;
  spellCasts: number;
  uniqueSpellCount: number;
  topSpells: Array<{ spell: SpellKey; count: number }>;
  createdAt: string;
};

type CommandButtonState = {
  label: string;
  meta: string;
  title: string;
  badge: string;
  state: "ready" | "empty" | "blocked";
};

type VoiceSurvivorGmApi = {
  start: () => void;
  draw: (count?: number) => void;
  buff: (id: string, count?: number) => boolean;
  spell: (spell: SpellKey) => boolean;
  cast: (spell: SpellKey) => boolean;
  voice: (text: string) => string[];
  guard: (count?: number) => void;
  turrets: (count?: number) => void;
  showcase: () => void;
  end: () => void;
  listBuffs: () => Array<{ id: string; title: string; rarity: Buff["rarity"]; spell?: SpellKey }>;
  state: () => {
    level: number;
    energy: number;
    guardTurretCount: number;
    placedTurretCount: number;
    unlockedSpells: SpellKey[];
    voiceSpells: SpellKey[];
  };
};

declare global {
  interface Window {
    __voiceSurvivorGM?: VoiceSurvivorGmApi;
  }
}

const SPELL_NAMES = Object.fromEntries(
  Object.entries(SPELL_CONFIG).map(([key, config]) => [key, config.name]),
) as Record<SpellKey, string>;

const SPELL_COSTS = Object.fromEntries(
  Object.entries(SPELL_CONFIG).map(([key, config]) => [key, config.cost]),
) as Record<SpellKey, number>;

const SPELL_TONE_COLORS: Record<LineglowTone, string> = {
  cyan: "#75eee2",
  orange: "#ff9a3d",
  violet: "#b16cff",
  green: "#9cff8a",
  red: "#ff4a5f",
  amber: "#ffc247",
};

const getCoreVoiceSpells = (): Set<SpellKey> => new Set<SpellKey>(CORE_VOICE_SPELLS);

function addVoiceAlias(aliases: Set<string>, value: string | undefined): void {
  const normalized = normalizeVoiceText(value ?? "");
  if (normalized) aliases.add(normalized);
}

function buildVoiceShorthands(name: string): string[] {
  const normalized = normalizeVoiceText(name);
  const chars = [...normalized];
  if (chars.length < 3) return [];
  return [chars.slice(0, 2).join(""), chars.slice(-2).join(""), `${chars[0]}${chars[chars.length - 1]}`];
}

function buildConfusableVoiceAliases(seed: string): string[] {
  const normalized = normalizeVoiceText(seed);
  if (!normalized) return [];

  const aliases = new Set<string>([normalized]);
  const chars = [...normalized];
  for (let index = 0; index < chars.length; index += 1) {
    for (const replacement of SPELL_VOICE_CONFUSABLES[chars[index]] ?? []) {
      const variant = [...chars];
      variant[index] = replacement;
      aliases.add(variant.join(""));
      if (aliases.size >= MAX_GENERATED_ALIASES_PER_SEED) {
        return [...aliases];
      }
    }
  }
  return [...aliases];
}

function buildSpellVoiceAliases(config: SpellConfig): string[] {
  const seeds = new Set<string>();
  addVoiceAlias(seeds, config.name);
  for (const alias of config.aliases ?? []) {
    addVoiceAlias(seeds, alias);
  }
  for (const shorthand of buildVoiceShorthands(config.name)) {
    addVoiceAlias(seeds, shorthand);
  }

  const aliases = new Set<string>();
  for (const seed of seeds) {
    for (const alias of buildConfusableVoiceAliases(seed)) {
      addVoiceAlias(aliases, alias);
    }
  }
  return [...aliases].sort((a, b) => b.length - a.length || a.localeCompare(b, "zh-Hans-CN"));
}

function buildSpellVoiceCommands(spells: Iterable<SpellKey>): SpellVoiceCommand[] {
  return [...spells].map((key) => {
    const config = SPELL_CONFIG[key] as SpellConfig;
    return {
      key,
      aliases: buildSpellVoiceAliases(config),
      priority: config.hidden ? 10 : 0,
    };
  });
}

const SPELL_COMMAND_ALIASES = buildSpellVoiceCommands(SPELL_KEYS);

const VOICE_CONTROL_ALIASES: Array<{ command: VoiceControlAction["command"]; aliases: readonly string[] }> = [
  {
    command: "start",
    aliases: ["开启语音", "打开语音", "启动语音", "开始语音", "启用语音", "恢复语音", "继续听", "语音开启", "语音打开", "语音启用", "开语音", "开麦", "打开麦克风", "开麦克风", "开起语音", "开机语音", "开启", "打开", "启动", "开始", "启用", "恢复", "继续听"],
  },
  {
    command: "stop",
    aliases: ["关闭语音", "停止语音", "关掉语音", "语音关闭", "语音停止", "语音暂停", "关闭声音", "停止监听", "停止识别", "暂停语音", "关语音", "关麦", "闭麦", "麦克风关闭", "关麦克风", "不要听了", "别听了", "关机语音", "关起语音", "关闭", "停止", "暂停", "关掉", "别听"],
  },
];

const BASE_ENERGY_REGEN = 5.4;
const CANNON_PREP_COSTS = [34, 48, 62] as const;
const PERSONAL_LEADERBOARD_KEY = "voice-survivor-personal-leaderboard-v1";
const PERSONAL_LEADERBOARD_LIMIT = 20;
const INITIAL_XP_GOAL = 10;

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

function matchSpells(text: string, commands: readonly SpellVoiceCommand[] = SPELL_COMMAND_ALIASES): SpellKey[] {
  const normalized = normalizeVoiceText(text);
  if (!normalized) return [];
  const matches: Array<{ key: SpellKey; position: number; length: number; priority: number }> = [];
  for (const command of commands) {
    let bestMatch: { key: SpellKey; position: number; length: number; priority: number } | undefined;
    for (const alias of command.aliases) {
      const aliasForm = normalizeVoiceText(alias);
      const position = normalized.indexOf(aliasForm);
      if (position >= 0) {
        const match = { key: command.key, position, length: aliasForm.length, priority: command.priority };
        if (
          !bestMatch ||
          match.position < bestMatch.position ||
          (match.position === bestMatch.position && match.priority > bestMatch.priority) ||
          (match.position === bestMatch.position && match.priority === bestMatch.priority && match.length > bestMatch.length)
        ) {
          bestMatch = match;
        }
      }
    }
    if (bestMatch) {
      matches.push(bestMatch);
    }
  }
  const selected: Array<{ key: SpellKey; position: number; length: number; priority: number }> = [];
  for (const match of matches.sort((a, b) => a.position - b.position || b.priority - a.priority || b.length - a.length)) {
    const end = match.position + match.length;
    const overlaps = selected.some((item) => match.position < item.position + item.length && end > item.position);
    if (!overlaps && !selected.some((item) => item.key === match.key)) {
      selected.push(match);
    }
  }

  return selected.map((match) => match.key);
}

function matchVoiceControl(text: string): VoiceControlAction[] {
  const normalized = normalizeVoiceText(text);
  if (!normalized) return [];
  const matches: Array<{ command: VoiceControlAction["command"]; position: number; length: number }> = [];
  for (const control of VOICE_CONTROL_ALIASES) {
    let bestMatch: { command: VoiceControlAction["command"]; position: number; length: number } | undefined;
    for (const alias of control.aliases) {
      const aliasForm = normalizeVoiceText(alias);
      const position = voiceControlAliasPosition(normalized, aliasForm);
      if (position >= 0) {
        const match = { command: control.command, position, length: aliasForm.length };
        if (!bestMatch || match.position > bestMatch.position || (match.position === bestMatch.position && match.length > bestMatch.length)) {
          bestMatch = match;
        }
      }
    }
    if (bestMatch) matches.push(bestMatch);
  }
  const best = matches.sort((a, b) => b.position - a.position || b.length - a.length)[0];
  return best ? [{ type: "voice", command: best.command }] : [];
}

function voiceControlAliasPosition(text: string, alias: string): number {
  if (!alias) return -1;
  if (isExplicitVoiceControlAlias(alias)) {
    return text.lastIndexOf(alias);
  }
  return text === alias ? 0 : -1;
}

function isExplicitVoiceControlAlias(alias: string): boolean {
  return (
    alias.includes("语音") ||
    alias.includes("麦") ||
    alias.includes("麦克风") ||
    alias.includes("监听") ||
    alias.includes("识别") ||
    alias.includes("声音") ||
    alias.includes("听")
  );
}

function hasSpellSequence(spells: readonly SpellKey[], sequence: readonly SpellKey[]): boolean {
  let index = 0;
  for (const spell of spells) {
    if (spell === sequence[index]) {
      index += 1;
      if (index >= sequence.length) return true;
    }
  }
  return false;
}

function matchVoiceCombo(text: string, spells: readonly SpellKey[]): VoiceComboKey | null {
  const normalized = normalizeVoiceText(text);
  const candidates = Object.entries(VOICE_COMBO_CONFIG) as Array<[VoiceComboKey, (typeof VOICE_COMBO_CONFIG)[VoiceComboKey]]>;
  const aliasMatch = candidates
    .filter(([, combo]) => combo.aliases.some((alias) => normalized.includes(normalizeVoiceText(alias))))
    .sort(([, a], [, b]) => b.spells.length - a.spells.length)[0];
  if (aliasMatch) return aliasMatch[0];

  const sequenceMatch = candidates
    .filter(([, combo]) => combo.spells.length > 1 && hasSpellSequence(spells, combo.spells))
    .sort(([, a], [, b]) => b.spells.length - a.spells.length)[0];
  return sequenceMatch?.[0] ?? null;
}

function matchSurvivorVoiceActions(text: string, spellCommands: readonly SpellVoiceCommand[] = SPELL_COMMAND_ALIASES): SurvivorVoiceAction[] {
  const spells = matchSpells(text, spellCommands);
  const combo = matchVoiceCombo(text, spells);
  if (!combo) {
    return spells.map((spell) => ({ type: "spell", spell }));
  }
  const comboSpells = VOICE_COMBO_CONFIG[combo].spells;
  const used = new Set<SpellKey>(comboSpells);
  return [
    { type: "combo", combo, spells: comboSpells },
    ...spells.filter((spell) => !used.has(spell)).map((spell) => ({ type: "spell" as const, spell })),
  ];
}

function voiceActionLabel(action: SurvivorVoiceAction): string {
  if (action.type === "voice") {
    return action.command === "start" ? "开启语音" : "关闭语音";
  }
  return action.type === "combo" ? `组合：${VOICE_COMBO_CONFIG[action.combo].name}` : SPELL_NAMES[action.spell];
}

function voiceErrorText(error: string | undefined): string {
  const value = (error ?? "unknown").toLowerCase();
  if (value.includes("not-allowed") || value.includes("permission")) {
    return "麦克风权限未开启，请在浏览器地址栏允许麦克风后再点语音施法";
  }
  if (value.includes("audio-capture") || value.includes("device") || value.includes("notfound")) {
    return "没有检测到可用麦克风，请检查输入设备后重试";
  }
  if (value.includes("network")) {
    return "语音识别服务连接失败，请稍后重试";
  }
  return error ?? "unknown";
}

export class VoiceSurvivorGame {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private readonly renderer = new LineglowSurvivorRenderer();
  private statusLine!: HTMLElement;
  private statLine!: HTMLElement;
  private chainLine!: HTMLElement;
  private lastStatSignature = "";
  private voiceButton!: HTMLButtonElement;
  private startOverlay!: HTMLElement;
  private startGuide!: HTMLElement;
  private startSettingsPanel!: HTMLElement;
  private startButton!: HTMLButtonElement;
  private startWildButton!: HTMLButtonElement;
  private startExpertButton!: HTMLButtonElement;
  private resultPanel!: HTMLElement;
  private pauseOverlay!: HTMLElement;
  private upgradeOverlay!: HTMLElement;
  private upgradeChoices!: HTMLElement;
  private commandDock!: HTMLElement;
  private commandDockObserver?: ResizeObserver;
  private commandDockHeight = 0;
  private wildSpellbookToggle!: HTMLButtonElement;
  private wildSpellbookPanel!: HTMLElement;
  private guidePanel!: HTMLElement;
  private activeSpellPanel!: HTMLElement;
  private upgradeGuide!: HTMLElement;
  private hpFill!: HTMLElement;
  private hpText!: HTMLElement;
  private energyRow!: HTMLElement;
  private energyFill!: HTMLElement;
  private energyText!: HTMLElement;
  private energyDeniedTimeout = 0;
  private xpFill!: HTMLElement;
  private xpText!: HTMLElement;
  private gmPanel!: HTMLElement;
  private readonly gmEnabled = new URLSearchParams(window.location.search).get("gm") === "1";
  private readonly testEnvironment = new URLSearchParams(window.location.search).get("test") === "1";

  private voiceInput!: VoiceInput<SurvivorVoiceAction>;
  private voiceActive = false;
  private voiceCommandsEnabled = true;
  private voicePausedForUpgrade = false;
  private lastVoiceControlAt = 0;
  private lastVoiceControlCommand: VoiceControlAction["command"] | null = null;
  private lastFrame = 0;
  private rafId = 0;
  private running = false;
  private paused = false;
  private selectingBuff = false;
  private runMode: RunMode = "normal";
  private upgradePickMode: UpgradePickMode = "manual";
  private wildSpellbookOpen = false;
  private wildSpellbookWasPaused = false;
  private pendingUpgradeChoices = 0;
  private manualUpgradeSequenceOpen = false;
  private pauseSelectionIndex = 0;
  private upgradeSelectionIndex = 0;
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
  private spellCues: SpellCue[] = [];
  private comboFlash: ComboFlash | null = null;
  private voiceDanmaku: VoiceDanmaku[] = [];
  private voiceDanmakuPins: VoiceDanmakuPin[] = [];
  private lastVoiceDanmakuText = "";
  private lastVoiceDanmakuAt = 0;
  private nextVoiceDanmakuLane = 0;
  private pendingExternalizeBlasts: PendingExternalizeBlast[] = [];
  private pendingCardReveals: PendingCardReveal[] = [];
  private pendingTooLateEvents: PendingTooLateEvent[] = [];
  private tooLateZones: TooLateZone[] = [];
  private refusalZones: RefusalZone[] = [];
  private receivedCharge: ReceivedCharge | null = null;
  private pendingReceivedReceipts: PendingReceivedReceipt[] = [];
  private receivedAutoReleaseTime = 0;
  private receivedAutoReleasePower = 1;
  private pendingTomorrowInsuranceEvents: PendingTomorrowInsuranceEvent[] = [];
  private pendingBangTwoFistEvents: PendingBangTwoFistEvent[] = [];
  private seriousCases: SeriousCase[] = [];
  private pendingUrgentCryEvents: PendingUrgentCryEvent[] = [];
  private screenShakeTime = 0;
  private screenShakeDuration = 0;
  private screenShakeStrength = 0;
  private screenFlashTime = 0;
  private screenFlashDuration = 0;
  private screenFlashRgb = "255,255,255";
  private screenFlashAlpha = 0;
  private hitStopTime = 0;
  private slowMoTime = 0;
  private slowMoDuration = 0;
  private slowMoScale = 1;
  private zoomPunchTime = 0;
  private zoomPunchDuration = 0;
  private zoomPunchStrength = 0;
  private impactLines: ImpactLine[] = [];
  private lightningArcs: LightningArc[] = [];
  private frostWaves: FrostWave[] = [];
  private frostShards: FrostShard[] = [];
  private playerAfterimages: PlayerAfterimage[] = [];
  private turrets: Turret[] = [];
  private unlockedSpells = new Set<SpellKey>(["cannon", "cannonPrep", "cannonFire"]);
  private voiceRecognizedSpells = getCoreVoiceSpells();
  private voiceSpellCommands = buildSpellVoiceCommands(this.voiceRecognizedSpells);
  private ownedBuffs = new Map<string, number>();
  private spellChain: SpellKey[] = [];
  private repeatableSpellChain: SpellKey[] = [];
  private spellCastCounts = new Map<SpellKey, number>();
  private voiceBarrageLog: Array<{ text: string; tone: "heard" | "spell" | "combo" | "control"; time: number }> = [];
  private lastVoiceBarrageText = "";
  private lastVoiceBarrageAt = -999;
  private tutorial = {
    guideDismissed: false,
    moved: false,
    prepDone: false,
    aimDone: false,
    fireDone: false,
    upgradeSeen: false,
    upgradeChosen: false,
  };
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
    refusalTime: 0,
    slimTime: 0,
    gracefulTime: 0,
  };
  private playerHistory: PlayerSnapshot[] = [];
  private markedEnemyId: number | null = null;
  private cardMarkTime = 0;
  private gracefulConfidence = 0;
  private fatalInsuranceTime = 0;
  private fatalInsuranceMaxTime = 0;
  private delayedHealTime = 0;
  private delayedHealAmount = 0;
  private nextSpellFree = false;
  private score = 0;
  private kills = 0;
  private level = 1;
  private xp = 0;
  private xpGoal = INITIAL_XP_GOAL;
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
  private screenShake = 0;
  private screenShakePower = 0;
  private startOverlayMode: "intro" | "training" | "wild" = "intro";

  constructor(private readonly root: HTMLElement) {}

  mount(): void {
    this.root.innerHTML = `
      <section class="survivor-shell${this.gmEnabled && !this.testEnvironment ? " has-gm" : ""}${this.testEnvironment ? " has-test-env" : ""}">
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
            <button id="survivorVoiceButton" type="button">语音施法</button>
            <span id="survivorStatus">开局默认听咒语；手动施法随时可用。</span>
          </div>
          <div id="survivorActiveSpells" class="survivor-active-spells" aria-label="持续效果状态"></div>
          <section id="survivorGuide" class="survivor-guide-panel" aria-label="新手引导"></section>
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
          <div class="survivor-resource-row survivor-resource-row--energy">
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
        <section id="survivorCommandDock" class="survivor-command-dock" aria-label="手动施法栏"></section>
        <button id="survivorWildSpellbookToggle" class="survivor-wild-spellbook-toggle" type="button" hidden>
          <strong>咒语表</strong>
          <span>Tab 查看细则</span>
        </button>
        <section id="survivorWildSpellbook" class="survivor-wild-spellbook" aria-label="狂野模式咒语细则" hidden></section>
        <section id="survivorGmPanel" class="survivor-gm-panel" aria-label="GM debug tools" hidden></section>
        <div id="survivorStart" class="survivor-overlay">
          <span class="survivor-kicker">语音幸存者肉鸽</span>
          <h1>人间大炮一级准备</h1>
          <p>开局默认听咒语，大声喊出一级准备、人间大炮、发射等咒语施法；键盘 Q/E/R 仍可备用。</p>
          <div class="survivor-start-guide" aria-label="首次进入操作引导" hidden>
            <span><b>W</b><strong>移动保命</strong><em>WASD / 方向键：拉开距离</em></span>
            <span><b>Q</b><strong>一级准备</strong><em>Q / 语音：一级准备</em></span>
            <span><b>E</b><strong>人间大炮</strong><em>E / 语音：人间大炮</em></span>
            <span><b>R</b><strong>发射收割</strong><em>R / 语音：发射、开火</em></span>
          </div>
          <div id="survivorResult" class="survivor-result" hidden></div>
          <div class="survivor-start-actions">
            <button type="button" data-action="wild">狂野模式</button>
            <button type="button" data-action="start">正常模式</button>
            <button type="button" data-action="expert" hidden>我是高手高手高手高高手</button>
          </div>
          <div id="survivorStartSettings" class="survivor-start-settings" hidden></div>
        </div>
        <div id="survivorPause" class="survivor-overlay survivor-pause" hidden>
          <span class="survivor-kicker">PAUSED</span>
          <h1>暂停</h1>
          <p>战斗已冻结，呼吸一下再回场。</p>
          <div class="survivor-pause-actions">
            <button type="button" data-action="resume">继续</button>
            <button type="button" data-action="restart">重新开始</button>
            <button type="button" data-action="finish">结束游戏</button>
          </div>
        </div>
        <div id="survivorUpgrade" class="survivor-overlay survivor-upgrade" hidden>
          <span class="survivor-kicker">选择一个 Buff</span>
          <h1>新咒语入库</h1>
          <div id="survivorUpgradeGuide" class="survivor-upgrade-guide"></div>
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
    this.startGuide = this.startOverlay.querySelector<HTMLElement>(".survivor-start-guide") ?? this.fail("Missing survivor start guide.");
    this.startSettingsPanel = this.root.querySelector<HTMLElement>("#survivorStartSettings") ?? this.fail("Missing survivor start settings.");
    this.startButton = this.root.querySelector<HTMLButtonElement>("[data-action='start']") ?? this.fail("Missing survivor start button.");
    this.startWildButton = this.root.querySelector<HTMLButtonElement>("[data-action='wild']") ?? this.fail("Missing survivor wild mode button.");
    this.startExpertButton = this.root.querySelector<HTMLButtonElement>("[data-action='expert']") ?? this.fail("Missing survivor expert button.");
    this.resultPanel = this.root.querySelector<HTMLElement>("#survivorResult") ?? this.fail("Missing survivor result panel.");
    this.pauseOverlay = this.root.querySelector<HTMLElement>("#survivorPause") ?? this.fail("Missing survivor pause overlay.");
    this.upgradeOverlay = this.root.querySelector<HTMLElement>("#survivorUpgrade") ?? this.fail("Missing survivor upgrade overlay.");
    this.upgradeChoices = this.root.querySelector<HTMLElement>("#survivorUpgradeChoices") ?? this.fail("Missing survivor upgrade choices.");
    this.commandDock = this.root.querySelector<HTMLElement>("#survivorCommandDock") ?? this.fail("Missing survivor command dock.");
    this.wildSpellbookToggle = this.root.querySelector<HTMLButtonElement>("#survivorWildSpellbookToggle") ?? this.fail("Missing survivor wild spellbook toggle.");
    this.wildSpellbookPanel = this.root.querySelector<HTMLElement>("#survivorWildSpellbook") ?? this.fail("Missing survivor wild spellbook.");
    this.guidePanel = this.root.querySelector<HTMLElement>("#survivorGuide") ?? this.fail("Missing survivor guide panel.");
    this.activeSpellPanel = this.root.querySelector<HTMLElement>("#survivorActiveSpells") ?? this.fail("Missing survivor active spell panel.");
    this.upgradeGuide = this.root.querySelector<HTMLElement>("#survivorUpgradeGuide") ?? this.fail("Missing survivor upgrade guide.");
    this.hpFill = this.root.querySelector<HTMLElement>("#survivorHpFill") ?? this.fail("Missing survivor HP fill.");
    this.hpText = this.root.querySelector<HTMLElement>("#survivorHpText") ?? this.fail("Missing survivor HP text.");
    this.energyFill = this.root.querySelector<HTMLElement>("#survivorEnergyFill") ?? this.fail("Missing survivor energy fill.");
    this.energyRow = this.energyFill.closest<HTMLElement>(".survivor-resource-row") ?? this.fail("Missing survivor energy row.");
    this.energyText = this.root.querySelector<HTMLElement>("#survivorEnergyText") ?? this.fail("Missing survivor energy text.");
    this.xpFill = this.root.querySelector<HTMLElement>("#survivorXpFill") ?? this.fail("Missing survivor XP fill.");
    this.xpText = this.root.querySelector<HTMLElement>("#survivorXpText") ?? this.fail("Missing survivor XP text.");
    this.gmPanel = this.root.querySelector<HTMLElement>("#survivorGmPanel") ?? this.fail("Missing survivor GM panel.");
    this.commandDockObserver?.disconnect();
    this.commandDockObserver = new ResizeObserver(() => this.updateCommandDockMetrics());
    this.commandDockObserver.observe(this.commandDock);

    this.resize();
    this.installEvents();
    this.setupVoice();
    this.renderCommandDock();
    this.installGmApi();
    this.renderGmPanel();
    this.render();
  }

  private installGmApi(): void {
    window.__voiceSurvivorGM = {
      start: () => this.gmStart(),
      draw: (count = 3) => this.gmDrawCards(count),
      buff: (id: string, count = 1) => this.gmGrantBuff(id, count),
      spell: (spell: SpellKey) => this.gmUnlockSpell(spell),
      cast: (spell: SpellKey) => this.gmCastSpell(spell),
      voice: (text: string) => this.gmSimulateVoice(text),
      guard: (count = 1) => { this.gmGrantBuff("weapon-guard-turret", count); },
      turrets: (count = 5) => this.gmSpawnPlacedTurrets(count),
      showcase: () => this.gmBuffShowcase(),
      end: () => this.gmEndRun(),
      listBuffs: () => this.createBuffPool({ includeUnavailable: true }).map((buff) => ({
        id: buff.id,
        title: buff.title,
        rarity: buff.rarity,
        spell: buff.spell,
      })),
      state: () => ({
        level: this.level,
        energy: Math.round(this.energy),
        guardTurretCount: this.guardTurretCount,
        placedTurretCount: this.turrets.length,
        unlockedSpells: [...this.unlockedSpells],
        voiceSpells: [...this.voiceRecognizedSpells],
      }),
    };
  }

  private renderGmPanel(): void {
    if (!this.gmEnabled || this.testEnvironment) {
      this.gmPanel.hidden = true;
      return;
    }
    this.gmPanel.hidden = false;
    this.gmPanel.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "GM";
    const hint = document.createElement("span");
    hint.textContent = "cards / buffs";
    this.gmPanel.append(title, hint);

    const actions: Array<[string, () => void]> = [
      ["Start", () => this.gmStart()],
      ["Draw 3", () => this.gmDrawCards(3)],
      ["Draw 6", () => this.gmDrawCards(6)],
      ["Guard +1", () => { this.gmGrantBuff("weapon-guard-turret"); }],
      ["Guard x4", () => { this.gmGrantBuff("weapon-guard-turret", 4); }],
      ["SkillGo", () => { this.gmGrantBuff("spell-skillgo"); }],
      ["你已急哭", () => { this.gmCastSpell("urgentCry"); }],
      ["不讲不讲", () => { this.gmCastSpell("comboNoTalk"); }],
      ["测试不讲领域", () => { this.gmTestNoTalkZone(); }],
      ["测试收到收到", () => { this.gmTestReceivedCharge(); }],
      ["测试明天见", () => { this.gmTestSeeTomorrowInsurance(); }],
      ["测试两拳", () => { this.gmTestBangTwoFists(); }],
      ["测试曼妙", () => { this.gmTestGracefulBody(); }],
      ["测试办事", () => { this.gmTestSeriousCase(); }],
      ["测试邪修", () => { this.gmTestXiexiu(); }],
      ["测试碎片", () => { this.gmTestFunFragments(); }],
      ["我去不早说", () => { this.gmCastSpell("comboTooLate"); }],
      ["与其内耗不如外耗", () => { this.gmCastSpell("comboExternalize"); }],
      ["Place x5", () => this.gmSpawnPlacedTurrets(5)],
      ["All VFX", () => this.gmBuffShowcase()],
      ["End", () => this.gmEndRun()],
    ];

    for (const [label, action] of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        action();
        this.renderGmPanel();
      });
      this.gmPanel.append(button);
    }
  }

  private gmStart(): void {
    if (!this.running || this.gameOver) {
      this.start();
    }
  }

  private gmDrawCards(count: number): void {
    this.gmStart();
    this.selectingBuff = true;
    this.showBuffChoices(clamp(Math.round(count), 1, 9));
    this.say("GM: draft cards");
  }

  private gmGrantBuff(id: string, count = 1): boolean {
    this.gmStart();
    const buff = this.createBuffPool({ includeUnavailable: true }).find((candidate) => candidate.id === id);
    if (!buff) {
      this.say(`GM: missing buff ${id}`);
      return false;
    }
    const times = clamp(Math.round(count), 1, 12);
    for (let i = 0; i < times; i += 1) {
      this.applyBuff(buff, { gm: true });
    }
    this.say(`GM: buff ${id} x${times}`);
    return true;
  }

  private gmUnlockSpell(spell: SpellKey): boolean {
    this.gmStart();
    this.unlockedSpells.add(spell);
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    this.renderCommandDock();
    this.say(`GM: unlock ${spell}`);
    return true;
  }

  private gmCastSpell(spell: SpellKey): boolean {
    this.gmUnlockSpell(spell);
    if (this.isHiddenComboSpell(spell)) {
      for (const fragment of this.comboFragments(spell)) {
        this.unlockedSpells.add(fragment);
      }
      this.refreshVoiceSpellRecognition();
    }
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    this.energy = this.maxEnergy;
    return this.castSpell(spell);
  }

  private gmSimulateVoice(text: string): string[] {
    const actions = this.matchSurvivorVoiceActions(text);
    this.addVoiceTranscriptDanmaku(text, actions);
    if (actions.length > 0) {
      this.handleVoiceActions(actions);
    } else if (text.trim()) {
      this.say(`听见了：${text}`);
    }
    return actions.map((action) => voiceActionLabel(action));
  }

  private gmTestNoTalkZone(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    const center = { ...this.player.position };
    const types: EnemyType[] = ["ranged", "repeater", "silencer", "ranged", "repeater", "silencer", "target", "pouncer"];
    for (let i = 0; i < types.length; i += 1) {
      const type = types[i];
      const cfg = ENEMY_CONFIG[type];
      const angle = (Math.PI * 2 * i) / types.length + 0.18;
      const radius = 190 + (i % 3) * 58;
      const hp = (cfg.hp + 26) * 2.2;
      this.enemies.push({
        id: this.nextEnemyId,
        type,
        position: {
          x: clamp(center.x + Math.cos(angle) * radius, cfg.radius, this.width - cfg.radius),
          y: clamp(center.y + Math.sin(angle) * radius, cfg.radius, this.playerMaxY(cfg.radius)),
        },
        velocity: { x: 0, y: 0 },
        radius: cfg.radius,
        hp,
        maxHp: hp,
        speed: cfg.speed * 1.12,
        cooldown: 0,
        windup: 0.72,
        frozen: 0,
      });
      this.nextEnemyId += 1;
    }
    for (let i = 0; i < 30; i += 1) {
      const angle = (Math.PI * 2 * i) / 30;
      const from = {
        x: clamp(center.x + Math.cos(angle) * 360, 8, this.width - 8),
        y: clamp(center.y + Math.sin(angle) * 240, 8, this.playerMaxY(8)),
      };
      const direction = normalize({ x: center.x - from.x, y: center.y - from.y });
      this.enemyShots.push({
        position: from,
        velocity: { x: direction.x * 260, y: direction.y * 260 },
        radius: 5,
        damage: 6,
        life: 3.4,
      });
    }
    this.addSpellRing(center, 380, "#e9fbff", "测试压力");
    this.say("GM：已生成远程/静音压力，测试不讲不讲。");
    this.gmCastSpell("comboNoTalk");
  }

  private gmTestReceivedCharge(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    (["received", "explode", "freeze", "lightning", "ricochet", "split", "pierce"] as SpellKey[]).forEach((spell) => this.unlockedSpells.add(spell));
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    const center = { ...this.player.position };
    for (let i = 0; i < 10; i += 1) {
      const type: EnemyType = i % 5 === 0 ? "repeater" : i % 4 === 0 ? "ranged" : i % 3 === 0 ? "brute" : "runner";
      const cfg = ENEMY_CONFIG[type];
      const angle = (Math.PI * 2 * i) / 10 + 0.22;
      const radius = 170 + (i % 3) * 64;
      const hp = (cfg.hp + 20) * 2.1;
      this.enemies.push({
        id: this.nextEnemyId,
        type,
        position: {
          x: clamp(center.x + Math.cos(angle) * radius, cfg.radius, this.width - cfg.radius),
          y: clamp(center.y + Math.sin(angle) * radius, cfg.radius, this.playerMaxY(cfg.radius)),
        },
        velocity: { x: 0, y: 0 },
        radius: cfg.radius,
        hp,
        maxHp: hp,
        speed: cfg.speed,
        cooldown: Math.random(),
        windup: 0,
        frozen: 0,
      });
      this.nextEnemyId += 1;
    }
    this.startReceivedCharge(1.25);
    (["explode", "freeze", "lightning", "ricochet", "split"] as SpellKey[]).forEach((spell, index) => {
      this.captureReceivedSpell(spell, true);
      const angle = -Math.PI * 0.72 + index * 0.36;
      this.addSpellCard({
        x: clamp(center.x + Math.cos(angle) * 118, 42, this.width - 42),
        y: clamp(center.y + Math.sin(angle) * 92, 42, this.playerMaxY(42)),
      }, SPELL_NAMES[spell], this.receivedSpellColor(spell), 58, index * 0.08, 0.84, "#e9fbff");
    });
    this.receivedAutoReleaseTime = 1.05;
    this.receivedAutoReleasePower = 1.28;
    this.say("GM：收到开始储能，1 秒后自动确认执行。");
  }

  private gmTestSeeTomorrowInsurance(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    (["oldSelf", "seeTomorrow", "comboSeeTomorrow"] as SpellKey[]).forEach((spell) => this.unlockedSpells.add(spell));
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    const center = { ...this.player.position };
    for (let i = 0; i < 12; i += 1) {
      const type: EnemyType = i % 4 === 0 ? "brute" : i % 3 === 0 ? "pouncer" : i % 2 === 0 ? "ranged" : "runner";
      const cfg = ENEMY_CONFIG[type];
      const angle = (Math.PI * 2 * i) / 12;
      const radius = 145 + (i % 3) * 58;
      const hp = (cfg.hp + 24) * 2.1;
      this.enemies.push({
        id: this.nextEnemyId,
        type,
        position: {
          x: clamp(center.x + Math.cos(angle) * radius, cfg.radius, this.width - cfg.radius),
          y: clamp(center.y + Math.sin(angle) * radius, cfg.radius, this.playerMaxY(cfg.radius)),
        },
        velocity: { x: 0, y: 0 },
        radius: cfg.radius,
        hp,
        maxHp: hp,
        speed: cfg.speed,
        cooldown: 0,
        windup: 0,
        frozen: 0,
      });
      this.nextEnemyId += 1;
    }
    this.gmCastSpell("comboSeeTomorrow");
    window.setTimeout(() => {
      if (!this.running || this.gameOver || this.fatalInsuranceTime <= 0) return;
      this.player.hp = Math.min(this.player.hp, 14);
      this.player.shield = 0;
      this.hurtPlayer(this.player.maxHp + 120, true);
    }, 1800);
    this.say("GM：已签明天见保险，约 1.8 秒后模拟致命伤触发。");
  }

  private gmTestBangTwoFists(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    this.unlockedSpells.add("bang");
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    this.gmSpawnEnemyRing(["runner", "brute", "ranged", "silencer", "pouncer", "target"], 170, 2.2);
    this.gmCastSpell("comboBangTwoFists");
  }

  private gmTestGracefulBody(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    (["unknown", "bodyShape", "graceful", "comboGracefulBody"] as SpellKey[]).forEach((spell) => this.unlockedSpells.add(spell));
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    const center = { ...this.player.position };
    for (let i = 0; i < 24; i += 1) {
      const angle = (Math.PI * 2 * i) / 24;
      const from = {
        x: clamp(center.x + Math.cos(angle) * 330, 8, this.width - 8),
        y: clamp(center.y + Math.sin(angle) * 210, 8, this.playerMaxY(8)),
      };
      const direction = normalize({ x: center.x - from.x, y: center.y - from.y });
      this.enemyShots.push({ position: from, velocity: { x: direction.x * 180, y: direction.y * 180 }, radius: 5, damage: 4, life: 4.2 });
    }
    this.gmCastSpell("comboGracefulBody");
  }

  private gmTestSeriousCase(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    this.unlockedSpells.add("serious");
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    this.gmSpawnEnemyRing(["silencer", "ranged", "target", "brute", "repeater"], 210, 2.8);
    this.gmCastSpell("serious");
  }

  private gmTestXiexiu(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    (["xiexiu", "explode", "freeze", "lightning", "split", "ricochet", "bang", "skillGo"] as SpellKey[]).forEach((spell) => this.unlockedSpells.add(spell));
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    this.skillGoLevel = Math.max(this.skillGoLevel, 2);
    this.gmSpawnEnemyRing(["runner", "brute", "ranged", "repeater", "pouncer", "target"], 210, 2.2);
    this.gmCastSpell("xiexiu");
  }

  private gmTestFunFragments(): void {
    this.gmStart();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    const sequence: SpellKey[] = ["woqu", "tooLate", "unknown", "bodyShape", "graceful", "oldSelf", "seeTomorrow", "internalDrain", "externalDrain"];
    sequence.forEach((spell) => this.unlockedSpells.add(spell));
    this.refreshVoiceSpellRecognition();
    this.energy = this.maxEnergy;
    this.gmSpawnEnemyRing(["runner", "pouncer", "ranged", "brute", "runner"], 180, 1.8);
    sequence.forEach((spell, index) => {
      window.setTimeout(() => {
        if (!this.running || this.gameOver) return;
        this.energy = this.maxEnergy;
        this.castSpell(spell);
      }, index * 520);
    });
    this.say("GM：开始依次测试碎片反馈。");
  }

  private gmSpawnEnemyRing(types: EnemyType[], baseRadius: number, strength: number): void {
    const center = { ...this.player.position };
    for (let i = 0; i < types.length; i += 1) {
      const type = types[i];
      const cfg = ENEMY_CONFIG[type];
      const angle = (Math.PI * 2 * i) / types.length + 0.16;
      const radius = baseRadius + (i % 3) * 54;
      const hp = (cfg.hp + 22) * strength;
      this.enemies.push({
        id: this.nextEnemyId,
        type,
        position: {
          x: clamp(center.x + Math.cos(angle) * radius, cfg.radius, this.width - cfg.radius),
          y: clamp(center.y + Math.sin(angle) * radius, cfg.radius, this.playerMaxY(cfg.radius)),
        },
        velocity: { x: 0, y: 0 },
        radius: cfg.radius,
        hp,
        maxHp: hp,
        speed: cfg.speed,
        cooldown: 0,
        windup: type === "pouncer" || type === "ranged" ? 0.5 : 0,
        frozen: 0,
      });
      this.nextEnemyId += 1;
    }
  }

  private gmSpawnPlacedTurrets(count = 5): void {
    this.gmStart();
    this.unlockedSpells.add("skillGo");
    this.refreshVoiceSpellRecognition();
    this.skillGoLevel = Math.max(this.skillGoLevel, 3);
    const turretCount = clamp(Math.round(count), 1, 12);
    for (let i = 0; i < turretCount; i += 1) {
      const angle = (Math.PI * 2 * i) / turretCount + this.elapsed;
      const radius = 84 + (i % 2) * 26;
      this.turrets.push({
        position: {
          x: clamp(this.player.position.x + Math.cos(angle) * radius, 34, this.width - 34),
          y: clamp(this.player.position.y + Math.sin(angle) * radius, 34, this.playerMaxY(34)),
        },
        cooldown: i * 0.08,
        life: 18,
      });
    }
    this.addSpellRing(this.player.position, 124, "#f8f1d1", "GM turrets");
    this.renderCommandDock();
    this.say(`GM: placed turrets x${turretCount}`);
  }

  private gmBuffShowcase(): void {
    this.gmStart();
    ([
      "explode",
      "freeze",
      "lightning",
      "split",
      "pierce",
      "ricochet",
      "focus",
      "serious",
      "shield",
      "gather",
      "skillGo",
    ] as SpellKey[]).forEach((spell) => this.unlockedSpells.add(spell));
    this.refreshVoiceSpellRecognition();
    this.activeMods.explosionTime = 18;
    this.activeMods.freezeTime = 18;
    this.activeMods.lightningTime = 18;
    this.activeMods.splitTime = 18;
    this.activeMods.pierceTime = 18;
    this.activeMods.ricochetTime = 18;
    this.activeMods.focusTime = 18;
    this.activeMods.seriousTime = 12;
    this.activeMods.damageBoost = 18;
    this.player.shield = Math.max(this.player.shield, 70);
    this.guardTurretCount = Math.max(this.guardTurretCount, 4);
    this.guardTurretDamage = Math.max(this.guardTurretDamage, 12);
    this.bladeCount = Math.max(this.bladeCount, 4);
    this.cannonMeter = 100;
    this.energy = this.maxEnergy;
    this.gmSpawnPlacedTurrets(5);
    this.renderCommandDock();
    this.say("GM: full buff showcase");
  }

  private gmEndRun(): void {
    this.gmStart();
    this.score = Math.max(this.score, 1800 + this.level * 160);
    this.kills = Math.max(this.kills, 18 + this.level * 2);
    this.recordVoiceBarrage("识别：GM 结算预览", "control");
    this.endRun();
  }

  private fail(message: string): never {
    throw new Error(message);
  }

  private installEvents(): void {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      if (this.handleStartKeyboard(event)) {
        event.preventDefault();
        return;
      }
      if (this.handlePendingUpgradeKeyboard(event)) {
        event.preventDefault();
        return;
      }
      if (this.handleWildSpellbookKeyboard(event)) {
        event.preventDefault();
        return;
      }
      if (this.handlePauseMenuKeyboard(event)) {
        event.preventDefault();
        return;
      }
      if (this.handlePauseKeyboard(event)) {
        event.preventDefault();
        return;
      }
      if (this.handleUpgradeKeyboard(event)) {
        event.preventDefault();
        return;
      }
      if (this.castManualShortcut(event)) {
        event.preventDefault();
        return;
      }
      this.keys.add(event.key.toLowerCase());
      this.noteTutorialMovement(event.key);
      if (event.code === "Space") {
        event.preventDefault();
        if (this.runMode !== "wild") {
          this.castSpell("evade");
        }
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
    this.startButton.addEventListener("click", () => this.advanceStartOverlay());
    this.startWildButton.addEventListener("click", () => this.renderStartWildOverlay());
    this.startExpertButton.addEventListener("click", () => this.start({ skipGuide: true }));
    this.pauseActionButtons().forEach((button, index) => {
      button.addEventListener("focus", () => this.selectPauseAction(index, { focus: false }));
      button.addEventListener("pointerenter", () => this.selectPauseAction(index, { focus: false }));
    });
    this.root.querySelector<HTMLButtonElement>("[data-action='resume']")?.addEventListener("click", () => this.resume());
    this.root.querySelector<HTMLButtonElement>("[data-action='restart']")?.addEventListener("click", () => this.start({ mode: this.runMode, skipGuide: this.runMode === "wild" }));
    this.root.querySelector<HTMLButtonElement>("[data-action='finish']")?.addEventListener("click", () => this.finishRunFromPause());
    this.voiceButton.addEventListener("click", () => {
      if (this.voiceActive) this.stopVoice();
      else this.startVoice();
    });
    this.wildSpellbookToggle.addEventListener("click", () => this.openWildSpellbook());
  }

  private handleStartKeyboard(event: KeyboardEvent): boolean {
    if (this.startOverlay.hidden || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }
    if (event.key !== "Enter" && event.code !== "Space") {
      return false;
    }
    if (!event.repeat) {
      this.advanceStartOverlay();
    }
    return true;
  }

  private advanceStartOverlay(): void {
    if (this.startOverlay.classList.contains("is-result")) {
      this.start({ mode: this.runMode, skipGuide: this.runMode === "wild" });
      return;
    }
    if (this.startOverlayMode === "intro") {
      this.renderStartTrainingOverlay();
      return;
    }
    if (this.startOverlayMode === "wild") {
      this.start({ mode: "wild", skipGuide: true });
      return;
    }
    this.start();
  }

  private handlePendingUpgradeKeyboard(event: KeyboardEvent): boolean {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.key !== "Tab") {
      return false;
    }
    if (
      this.runMode !== "normal" ||
      !this.running ||
      this.paused ||
      this.selectingBuff ||
      this.gameOver ||
      this.pendingUpgradeChoices <= 0 ||
      !this.upgradeOverlay.hidden
    ) {
      return false;
    }
    this.openPendingUpgradeChoices();
    return true;
  }

  private handleWildSpellbookKeyboard(event: KeyboardEvent): boolean {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) {
      return false;
    }
    if (this.wildSpellbookOpen) {
      if (event.key === "Escape" || event.key === "Tab") {
        this.closeWildSpellbook();
      }
      return true;
    }
    if (event.key !== "Tab" || this.runMode !== "wild" || !this.running || this.selectingBuff || this.gameOver) {
      return false;
    }
    this.openWildSpellbook();
    return true;
  }

  private renderStartIntroOverlay(): void {
    this.startOverlayMode = "intro";
    this.startOverlay.classList.remove("is-result");
    this.startOverlay.querySelector(".survivor-kicker")!.textContent = "语音幸存者肉鸽";
    this.startOverlay.querySelector("h1")!.textContent = "人间大炮一级准备";
    this.startOverlay.querySelector("p")!.textContent = "开局默认听咒语，大声喊出一级准备、人间大炮、发射等咒语施法；键盘 Q/E/R 仍可备用。";
    this.startGuide.hidden = true;
    this.startGuide.replaceChildren();
    this.startSettingsPanel.hidden = true;
    this.startSettingsPanel.replaceChildren();
    this.startButton.textContent = "正常模式";
    this.startWildButton.hidden = false;
    this.startExpertButton.hidden = true;
  }

  private renderStartTrainingOverlay(): void {
    this.startOverlayMode = "training";
    this.startOverlay.classList.remove("is-result");
    this.startOverlay.querySelector(".survivor-kicker")!.textContent = "首次进入游戏";
    this.startOverlay.querySelector("h1")!.textContent = "新人培训";
    this.startOverlay.querySelector("p")!.textContent = "先学会活下来，再学会喊咒语。自动攻击会持续开火，你只需要走位、蓄力、瞄准、发射。";
    this.renderStartGuide([
      ["W", "移动保命", "WASD / 方向键：拉开距离"],
      ["Q", "一级准备", "Q / 语音：一级准备"],
      ["E", "人间大炮", "E / 语音：人间大炮"],
      ["R", "发射收割", "R / 语音：发射、开火"],
    ]);
    this.renderUpgradePickModeControl();
    this.startGuide.hidden = false;
    this.startSettingsPanel.hidden = false;
    this.startButton.textContent = "我是小白";
    this.startWildButton.hidden = true;
    this.startExpertButton.hidden = false;
  }

  private renderStartWildOverlay(): void {
    this.startOverlayMode = "wild";
    this.startOverlay.classList.remove("is-result");
    this.resultPanel.hidden = true;
    this.resultPanel.replaceChildren();
    this.startOverlay.querySelector(".survivor-kicker")!.textContent = "狂野模式";
    this.startOverlay.querySelector("h1")!.textContent = "只靠嗓子开炮";
    this.startOverlay.querySelector("p")!.textContent = "狂野模式会默认解锁所有咒语，不再抽卡；咒语只能用语音触发，怪物密度和数值都会更高。";
    this.renderStartGuide([
      ["声", "只能语音施法", "键盘和点击不释放咒语，WASD 仍用于走位"],
      ["全", "全咒语开局", "开局获得全部基础咒语、乐子咒语和隐藏 Combo"],
      ["Tab", "暂停查表", "右下角咒语表可按 Tab 呼出，查看细则时游戏暂停"],
      ["压", "高压怪潮", "怪物更多更硬，声能和基础属性也更高"],
    ]);
    this.startGuide.hidden = false;
    this.startSettingsPanel.hidden = true;
    this.startSettingsPanel.replaceChildren();
    this.startButton.textContent = "确认开始狂野模式";
    this.startWildButton.hidden = true;
    this.startExpertButton.hidden = true;
  }

  private renderStartGuide(items: Array<[string, string, string]>): void {
    this.startGuide.replaceChildren();
    for (const [key, title, detail] of items) {
      const row = document.createElement("span");
      const badge = document.createElement("b");
      badge.textContent = key;
      const heading = document.createElement("strong");
      heading.textContent = title;
      const copy = document.createElement("em");
      copy.textContent = detail;
      row.append(badge, heading, copy);
      this.startGuide.append(row);
    }
  }

  private renderUpgradePickModeControl(): void {
    const panel = document.createElement("div");
    panel.className = "survivor-start-setting";
    const title = document.createElement("strong");
    title.textContent = "升级选卡方式选择";
    const options = document.createElement("div");
    options.className = "survivor-start-segments";

    ([
      ["manual", "手动 Tab", "升级先暂存，按 Tab 一次性选完"],
      ["safe", "安全自动", "压力低时自动弹，也可按 Tab"],
      ["instant", "立即弹出", "升级后立刻暂停选卡"],
    ] as const).forEach(([mode, label, description]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mode = mode;
      button.className = mode === this.upgradePickMode ? "is-selected" : "";
      button.setAttribute("aria-pressed", mode === this.upgradePickMode ? "true" : "false");
      button.innerHTML = `<i>${label}</i><small>${description}</small>`;
      button.addEventListener("click", () => {
        this.upgradePickMode = mode;
        this.renderStartTrainingOverlay();
      });
      options.append(button);
    });

    panel.append(title, options);
    this.startSettingsPanel.replaceChildren(panel);
  }

  private handlePauseMenuKeyboard(event: KeyboardEvent): boolean {
    if (!this.paused || this.pauseOverlay.hidden || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }
    const buttons = this.pauseActionButtons();
    if (buttons.length === 0) return false;

    const key = event.key.toLowerCase();
    if (event.key === "Escape" || key === "p") {
      if (!event.repeat) this.resume();
      return true;
    }
    if (event.key === "ArrowLeft" || event.key === "Left" || event.key === "ArrowUp" || event.code === "KeyA" || event.code === "KeyW") {
      this.selectPauseAction(this.pauseSelectionIndex - 1);
      return true;
    }
    if (event.key === "ArrowRight" || event.key === "Right" || event.key === "ArrowDown" || event.code === "KeyD" || event.code === "KeyS") {
      this.selectPauseAction(this.pauseSelectionIndex + 1);
      return true;
    }
    if (event.key === "Enter" || event.code === "Space") {
      if (!event.repeat) {
        const button = buttons[clamp(this.pauseSelectionIndex, 0, buttons.length - 1)];
        button?.click();
      }
      return true;
    }
    return false;
  }

  private handlePauseKeyboard(event: KeyboardEvent): boolean {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) {
      return false;
    }
    const key = event.key.toLowerCase();
    if (key !== "escape" && key !== "p") {
      return false;
    }
    this.togglePause();
    return true;
  }

  private pauseActionButtons(): HTMLButtonElement[] {
    return Array.from(this.pauseOverlay.querySelectorAll<HTMLButtonElement>(".survivor-pause-actions button"));
  }

  private selectPauseAction(index: number, options: { focus?: boolean } = { focus: true }): void {
    const buttons = this.pauseActionButtons();
    if (buttons.length === 0) {
      this.pauseSelectionIndex = 0;
      return;
    }
    const normalized = ((index % buttons.length) + buttons.length) % buttons.length;
    this.pauseSelectionIndex = normalized;
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === normalized;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    });
    if (options.focus !== false) {
      buttons[normalized]?.focus({ preventScroll: true });
    }
  }

  private castManualShortcut(event: KeyboardEvent): boolean {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) {
      return false;
    }
    if (this.isMovementKey(event)) {
      return false;
    }
    if (this.runMode === "wild") {
      return false;
    }
    const shortcuts = this.manualShortcutCandidates(event);
    if (shortcuts.length === 0) return false;
    if (!this.running || this.paused || this.selectingBuff || this.gameOver) {
      return false;
    }
    const button = this.commandButtonForShortcuts(shortcuts);
    const spell = button?.dataset.spell as SpellKey | undefined;
    if (!button || !spell) {
      return false;
    }
    this.pulseCommandButton(button);
    this.castSpell(spell);
    return true;
  }

  private handleUpgradeKeyboard(event: KeyboardEvent): boolean {
    if (!this.selectingBuff || this.upgradeOverlay.hidden || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }
    const buttons = this.upgradeChoiceButtons();
    if (buttons.length === 0) return false;
    const key = event.key.toLowerCase();
    if (event.key === "ArrowLeft" || event.key === "Left" || event.code === "KeyA" || key === "a") {
      this.selectUpgradeChoice(this.upgradeSelectionIndex - 1);
      return true;
    }
    if (event.key === "ArrowRight" || event.key === "Right" || event.code === "KeyD" || key === "d") {
      this.selectUpgradeChoice(this.upgradeSelectionIndex + 1);
      return true;
    }
    if (event.key === "Enter") {
      if (event.repeat) return true;
      const button = buttons[clamp(this.upgradeSelectionIndex, 0, buttons.length - 1)];
      button?.click();
      return true;
    }
    return false;
  }

  private upgradeChoiceButtons(): HTMLButtonElement[] {
    return Array.from(this.upgradeChoices.querySelectorAll<HTMLButtonElement>("button"));
  }

  private selectUpgradeChoice(index: number, options: { focus?: boolean } = { focus: true }): void {
    const buttons = this.upgradeChoiceButtons();
    if (buttons.length === 0) {
      this.upgradeSelectionIndex = 0;
      return;
    }
    const normalized = ((index % buttons.length) + buttons.length) % buttons.length;
    this.upgradeSelectionIndex = normalized;
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === normalized;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    });
    if (options.focus !== false) {
      buttons[normalized]?.focus({ preventScroll: true });
    }
  }

  private isMovementKey(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    return key === "w" || key === "a" || key === "s" || key === "d" || key.startsWith("arrow");
  }

  private manualShortcutCandidates(event: KeyboardEvent): string[] {
    const candidates = new Set<string>();
    const add = (value: string | undefined) => {
      const normalized = this.normalizeManualShortcut(value ?? "");
      if (normalized) candidates.add(normalized);
    };

    add(event.key);

    if (!event.shiftKey && /^Digit[1-9]$/.test(event.code)) {
      add(event.code.slice(5));
    }
    if (!event.shiftKey && /^Key[ZXCVBNM]$/.test(event.code)) {
      add(event.code.slice(3));
    }

    const codeAliases: Record<string, string> = {
      NumpadMultiply: "*",
      NumpadAdd: "+",
      NumpadSubtract: "-",
      NumpadDivide: "/",
      NumpadDecimal: ".",
    };
    add(codeAliases[event.code]);

    return [...candidates];
  }

  private normalizeManualShortcut(value: string): string {
    const normalized = value.trim().toLowerCase();
    const aliases: Record<string, string> = {
      "＊": "*",
      "×": "*",
      "＋": "+",
      "－": "-",
      "／": "/",
      "！": "!",
      "＃": "#",
      "＄": "$",
      "＞": ">",
      "？": "?",
      "～": "~",
      "．": ".",
      "。": ".",
    };
    return aliases[normalized] ?? normalized;
  }

  private commandButtonForShortcuts(shortcuts: readonly string[]): HTMLButtonElement | null {
    const shortcutSet = new Set(shortcuts);
    const buttons = [...this.commandDock.querySelectorAll<HTMLButtonElement>("button[data-spell]")];

    for (const button of buttons) {
      if (shortcutSet.has(this.normalizeManualShortcut(button.dataset.shortcut ?? ""))) {
        return button;
      }
    }

    for (const button of buttons) {
      const spell = button.dataset.spell as SpellKey | undefined;
      if (!spell || (CORE_VOICE_SPELLS as readonly SpellKey[]).includes(spell)) continue;
      const glyph = getLineglowSpellArt(spell).glyph;
      if (shortcutSet.has(this.normalizeManualShortcut(glyph))) {
        return button;
      }
    }

    return null;
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
    this.player.position.y = clamp(this.player.position.y, 30, this.playerMaxY(30));
  }

  private setupVoice(): void {
    this.voiceInput = new VoiceInput<SurvivorVoiceAction>(
      (actions) => this.handleVoiceActions(actions),
      (text) => this.matchSurvivorVoiceActions(text),
      (action) => action.type === "voice" ? `voice:${action.command}` : action.type === "combo" ? `combo:${action.combo}` : `spell:${action.spell}`,
    );

    if (!this.voiceInput.isSupported()) {
      this.voiceButton.disabled = true;
      this.voiceButton.textContent = "语音不可用";
      this.say("语音不可用，手动施法栏仍可完整游玩。");
      return;
    }

    this.voiceInput.observe(({ status, transcript, actions, error }) => {
      if (status === "unsupported") {
        this.voiceButton.disabled = true;
        this.voiceButton.textContent = "语音不可用";
        this.voiceActive = false;
        this.say("语音不可用，手动施法栏仍可完整游玩。");
        return;
      }
      if (status === "error") {
        this.voiceActive = false;
        this.voiceButton.textContent = "语音施法";
        this.say(`语音出错：${voiceErrorText(error)}`);
        return;
      }
      if (status === "idle") {
        this.voiceActive = false;
        this.voiceButton.textContent = "语音施法";
        return;
      }

      this.voiceActive = true;
      this.voiceButton.textContent = this.voiceCommandsEnabled ? "语音中" : "语音待机";
      if (transcript) {
        this.addVoiceTranscriptDanmaku(transcript, actions);
      }
      if (actions.length > 0) {
        return;
      }
      if (!this.voiceCommandsEnabled && transcript) {
        this.say("语音待机：说“开启语音”恢复。");
      } else if (transcript) {
        this.recordVoiceBarrage(`听见：${transcript}`, "heard");
        this.say(`听见了：${transcript}`);
      }
    });
  }

  private matchSurvivorVoiceActions(text: string): SurvivorVoiceAction[] {
    const controls = matchVoiceControl(text);
    if (!this.voiceCommandsEnabled) {
      return controls.filter((action) => action.command === "start");
    }
    return controls.length > 0 ? controls : matchSurvivorVoiceActions(text, this.voiceSpellCommands);
  }

  private addVoiceTranscriptDanmaku(transcript: string, actions: readonly SurvivorVoiceAction[]): void {
    const text = this.compactVoiceDanmakuText(transcript);
    const normalized = normalizeVoiceText(text);
    if (!normalized) return;

    const now = performance.now();
    const isNearDuplicate =
      normalized === this.lastVoiceDanmakuText ||
      (normalized.length <= this.lastVoiceDanmakuText.length && this.lastVoiceDanmakuText.includes(normalized));
    if (isNearDuplicate && now - this.lastVoiceDanmakuAt < 650) {
      return;
    }

    this.lastVoiceDanmakuText = normalized;
    this.lastVoiceDanmakuAt = now;
    this.spawnVoiceDanmaku(text, this.voiceDanmakuStyle(actions));
  }

  private compactVoiceDanmakuText(text: string): string {
    const normalized = text.trim().replace(/\s+/g, " ");
    const chars = [...normalized];
    if (chars.length <= 42) return normalized;
    return `${chars.slice(0, 41).join("")}...`;
  }

  private voiceDanmakuStyle(actions: readonly SurvivorVoiceAction[]): Pick<VoiceDanmaku, "kind" | "color" | "accent" | "speed" | "size" | "alpha"> {
    const comboAction = actions.find((action): action is Extract<SurvivorVoiceAction, { type: "combo" }> => action.type === "combo");
    if (comboAction) {
      const colors = this.voiceComboDanmakuColors(comboAction.combo);
      return { kind: "combo", color: colors.color, accent: colors.accent, speed: 142, size: 25, alpha: 0.86 };
    }

    const spellAction = actions.find((action): action is Extract<SurvivorVoiceAction, { type: "spell" }> => action.type === "spell");
    if (spellAction) {
      if (this.isHiddenComboSpell(spellAction.spell)) {
        const theme = this.funComboTheme(spellAction.spell);
        return { kind: "combo", color: theme.color, accent: theme.accent, speed: 144, size: 26, alpha: 0.88 };
      }
      const color = this.spellDanmakuColor(spellAction.spell);
      return { kind: "spell", color, accent: "#ffffff", speed: 126, size: 22, alpha: 0.78 };
    }

    return { kind: "plain", color: "#ffffff", accent: "#ffffff", speed: 92, size: 15, alpha: 0.34 };
  }

  private spawnVoiceDanmaku(
    text: string,
    style: Pick<VoiceDanmaku, "kind" | "color" | "accent" | "speed" | "size" | "alpha">,
  ): void {
    const laneCount = this.voiceDanmakuLaneCount();
    const lane = this.nextVoiceDanmakuLane % laneCount;
    this.nextVoiceDanmakuLane = (this.nextVoiceDanmakuLane + 1) % laneCount;
    const width = this.measureVoiceDanmakuWidth(text, style.size);
    const travel = this.width + width + 96;
    const maxLife = clamp(travel / style.speed, 4.2, 7.5);

    this.voiceDanmaku.push({
      text,
      kind: style.kind,
      color: style.color,
      accent: style.accent,
      lane,
      x: -width - 28,
      y: this.voiceDanmakuLaneY(lane),
      speed: style.speed,
      life: maxLife,
      maxLife,
      size: style.size,
      alpha: style.alpha,
      width,
    });

    if (this.voiceDanmaku.length > 18) {
      this.voiceDanmaku.splice(0, this.voiceDanmaku.length - 18);
    }
  }

  private addVoiceDanmakuPin(label: string, sublabel: string, color: string, accent: string): void {
    const existing = this.voiceDanmakuPins.find((pin) => pin.label === label);
    if (existing) {
      existing.life = existing.maxLife;
      existing.sublabel = sublabel;
      existing.color = color;
      existing.accent = accent;
      return;
    }

    this.voiceDanmakuPins.push({
      label,
      sublabel,
      color,
      accent,
      life: 2.15,
      maxLife: 2.15,
      size: 38,
      seed: Math.random() * Math.PI * 2,
    });

    if (this.voiceDanmakuPins.length > 3) {
      this.voiceDanmakuPins.splice(0, this.voiceDanmakuPins.length - 3);
    }
  }

  private voiceDanmakuLaneCount(): number {
    return clamp(Math.floor(this.height / 118), 4, 7);
  }

  private voiceDanmakuLaneY(lane: number): number {
    const top = clamp(this.height * 0.1, 52, 82);
    const spacing = clamp(this.height * 0.044, 23, 34);
    return top + lane * spacing;
  }

  private updateVoiceDanmaku(dt: number): void {
    for (const item of this.voiceDanmaku) {
      item.life -= dt;
      item.x += item.speed * dt;
    }
    this.voiceDanmaku = this.voiceDanmaku.filter((item) => item.life > 0 && item.x < this.width + 48);

    for (const pin of this.voiceDanmakuPins) {
      pin.life -= dt;
    }
    this.voiceDanmakuPins = this.voiceDanmakuPins.filter((pin) => pin.life > 0);
  }

  private spellDanmakuColor(spell: SpellKey): string {
    return SPELL_TONE_COLORS[getLineglowSpellArt(spell).tone];
  }

  private voiceComboDanmakuColors(comboKey: VoiceComboKey): { color: string; accent: string } {
    return VOICE_COMBO_DANMAKU_COLORS[comboKey];
  }

  private measureVoiceDanmakuWidth(text: string, size: number): number {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `900 ${size}px Microsoft YaHei, sans-serif`;
    const width = ctx.measureText(text).width;
    ctx.restore();
    return Math.max(24, width);
  }

  private refreshVoiceSpellRecognition(): SpellKey[] {
    const next = getCoreVoiceSpells();
    for (const spell of this.unlockedSpells) {
      next.add(spell);
    }

    for (const spell of SPELL_KEYS) {
      const config = SPELL_CONFIG[spell] as SpellConfig;
      const fragments = (config.fragments ?? []) as readonly SpellKey[];
      if (config.hidden && fragments.length > 0 && fragments.every((fragment) => next.has(fragment))) {
        next.add(spell);
      }
    }

    const added = [...next].filter((spell) => !this.voiceRecognizedSpells.has(spell));
    this.voiceRecognizedSpells = next;
    this.voiceSpellCommands = buildSpellVoiceCommands(this.voiceRecognizedSpells);
    return added;
  }

  private voiceRecognitionUpdateText(spells: readonly SpellKey[]): string {
    if (spells.length === 0) return "";
    return `；语音识别已同步：${spells.map((spell) => SPELL_NAMES[spell]).join("、")}`;
  }

  private handleVoiceControl(action: VoiceControlAction): void {
    const now = performance.now();
    if (this.lastVoiceControlCommand && now - this.lastVoiceControlAt < 900) {
      return;
    }
    this.lastVoiceControlAt = now;
    this.lastVoiceControlCommand = action.command;
    if (action.command === "stop") {
      this.voiceCommandsEnabled = false;
      this.voiceButton.textContent = "语音待机";
      this.say("语音指令已关闭，说“开启语音”恢复。");
      return;
    }
    this.voiceCommandsEnabled = true;
    this.voiceButton.textContent = this.voiceActive ? "语音中" : "语音施法";
    this.say("语音指令已开启。");
  }

  private startVoice(): void {
    this.voicePausedForUpgrade = false;
    this.voiceCommandsEnabled = true;
    if (this.voiceActive) {
      this.voiceButton.textContent = "语音中";
      return;
    }
    this.voiceActive = true;
    this.voiceButton.textContent = "语音中";
    this.voiceInput.start();
    this.say("正在听：爆炸、冻结、闪避、护盾、人间大炮、梆梆不梆梆。");
  }

  private stopVoice(): void {
    if (!this.voiceActive) return;
    this.voicePausedForUpgrade = false;
    this.voiceCommandsEnabled = true;
    this.voiceActive = false;
    this.voiceButton.textContent = "语音施法";
    this.voiceInput.stop();
    this.say("已切回手动施法栏。");
  }

  private pauseVoiceForUpgrade(): void {
    if (!this.voiceActive) {
      this.voicePausedForUpgrade = false;
      return;
    }
    this.voicePausedForUpgrade = true;
    this.voiceInput.stop();
    this.voiceActive = false;
    this.voiceButton.textContent = "语音暂停";
  }

  private resumeVoiceAfterUpgrade(): void {
    if (!this.voicePausedForUpgrade || !this.voiceInput.isSupported()) {
      this.voicePausedForUpgrade = false;
      return;
    }
    this.voicePausedForUpgrade = false;
    this.voiceActive = true;
    this.voiceButton.textContent = this.voiceCommandsEnabled ? "语音中" : "语音待机";
    this.voiceInput.start();
  }

  private showVoiceStartPrompt(): void {
    const center = {
      x: this.width * 0.5,
      y: clamp(this.height * 0.34, 150, 250),
    };
    const headlineSize = clamp(this.width * 0.092, 64, 88);
    const hintSize = clamp(this.width * 0.036, 27, 38);
    const promptLife = 2.18;

    this.flashScreen("#ffe27a", 0.22, 0.16);
    this.shakeScreen(7, 0.32);
    this.playZoomPunch(0.055, 0.34);
    this.addImpactLines(center, "#ffe27a", 18, 230, 0.38);
    this.addSpellRing(center, 240, "#ffe27a", undefined, 1.72);
    this.addSlamSpellGlyph(center, "大声念咒", "#ffe27a", headlineSize, 0, promptLife, 2.15, 0.96);
    this.addSpellGlyph({ x: center.x, y: center.y + headlineSize * 0.98 }, "一级准备 / 人间大炮 / 发射", "#8ee8ff", hintSize, promptLife);
    this.addVoiceDanmakuPin("喊出咒语", "一级准备 / 人间大炮 / 发射", "#ffe27a", "#8ee8ff");
    this.say("大声念出咒语：一级准备、人间大炮、发射都能喊出来。");
  }

  private showWildStartPrompt(): void {
    const center = {
      x: this.width * 0.5,
      y: clamp(this.height * 0.34, 150, 250),
    };
    const headlineSize = clamp(this.width * 0.086, 58, 84);
    const hintSize = clamp(this.width * 0.03, 24, 34);
    const promptLife = 2.6;

    this.flashScreen("#ff6f3c", 0.24, 0.2);
    this.shakeScreen(9, 0.38);
    this.playZoomPunch(0.065, 0.42);
    this.addImpactLines(center, "#ff6f3c", 24, 280, 0.46);
    this.addSpellRing(center, 280, "#ff6f3c", undefined, 1.95);
    this.addSlamSpellGlyph(center, "狂野模式", "#ffcf5a", headlineSize, 0, promptLife, 2.25, 1);
    this.addSpellGlyph({ x: center.x, y: center.y + headlineSize * 0.98 }, "全咒语解锁 / 不抽卡 / 只能语音施法", "#8ee8ff", hintSize, promptLife);
    this.addVoiceDanmakuPin("狂野开局", "喊什么就炸什么", "#ffcf5a", "#8ee8ff");
    this.say("狂野模式：已解锁所有咒语，不再抽卡；咒语只能靠语音喊出来。");
  }

  private start(options: { skipGuide?: boolean; mode?: RunMode } = {}): void {
    this.runMode = options.mode ?? "normal";
    this.running = true;
    this.paused = false;
    this.selectingBuff = false;
    this.pauseSelectionIndex = 0;
    this.voicePausedForUpgrade = false;
    this.voiceCommandsEnabled = true;
    this.gameOver = false;
    this.closeWildSpellbook({ restorePause: false });
    this.restoreStartOverlay();
    this.startOverlay.hidden = true;
    this.pauseOverlay.hidden = true;
    this.upgradeOverlay.hidden = true;
    this.resetRun();
    if (options.skipGuide) {
      this.tutorial.guideDismissed = true;
      this.renderGuidePanel();
    }
    if (this.voiceInput.isSupported()) {
      this.startVoice();
    } else if (this.runMode === "wild") {
      this.say("狂野模式需要语音识别；当前浏览器不可用时只能返回普通模式游玩。");
    }
    if (this.runMode === "wild") {
      this.showWildStartPrompt();
    } else {
      this.showVoiceStartPrompt();
    }
    this.lastFrame = performance.now();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }

  private restoreStartOverlay(): void {
    this.renderStartIntroOverlay();
    this.resultPanel.hidden = true;
    this.resultPanel.replaceChildren();
  }

  private openWildSpellbook(): void {
    if (this.runMode !== "wild" || !this.running || this.selectingBuff || this.gameOver || !this.pauseOverlay.hidden) {
      return;
    }
    this.wildSpellbookWasPaused = this.paused;
    this.wildSpellbookOpen = true;
    this.paused = true;
    this.keys.clear();
    this.renderWildSpellbook();
    this.updateWildSpellbookVisibility();
    this.say("狂野咒语表已展开，战斗暂停；按 Tab 或 Esc 收起。");
  }

  private closeWildSpellbook(options: { restorePause?: boolean } = {}): void {
    const restorePause = options.restorePause ?? true;
    if (this.wildSpellbookOpen && restorePause && this.running && !this.gameOver) {
      this.paused = this.wildSpellbookWasPaused;
      this.lastFrame = performance.now();
    }
    this.wildSpellbookOpen = false;
    this.wildSpellbookWasPaused = false;
    this.updateWildSpellbookVisibility();
    this.syncCommandDockVisibility();
  }

  private updateWildSpellbookVisibility(): void {
    const shouldShowToggle = this.runMode === "wild" && this.running && !this.paused && !this.selectingBuff && !this.gameOver && !this.wildSpellbookOpen;
    this.wildSpellbookToggle.hidden = !shouldShowToggle;
    this.wildSpellbookPanel.hidden = !this.wildSpellbookOpen;
    this.wildSpellbookPanel.setAttribute("aria-hidden", this.wildSpellbookOpen ? "false" : "true");
  }

  private renderWildSpellbook(): void {
    this.wildSpellbookPanel.replaceChildren();

    const header = document.createElement("header");
    const titleWrap = document.createElement("div");
    const eyebrow = document.createElement("span");
    eyebrow.textContent = "狂野模式";
    const title = document.createElement("strong");
    title.textContent = "全咒语细则";
    const note = document.createElement("em");
    note.textContent = "战斗已暂停，按 Tab / Esc 收起";
    titleWrap.append(eyebrow, title, note);

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "收起";
    close.addEventListener("click", () => this.closeWildSpellbook());
    header.append(titleWrap, close);

    const list = document.createElement("div");
    list.className = "survivor-wild-spellbook-list";
    SPELL_KEYS.forEach((spell) => {
      const config = SPELL_CONFIG[spell] as SpellConfig;
      const item = document.createElement("article");
      item.className = "survivor-wild-spellbook-card";

      const top = document.createElement("div");
      top.className = "survivor-wild-spellbook-card-top";
      const name = document.createElement("strong");
      name.textContent = config.name;
      const cost = document.createElement("span");
      cost.textContent = spell === "cannon" || spell === "cannonPrep" || spell === "cannonFire" ? "核心链" : `${config.cost} 声能`;
      top.append(name, cost);

      const meta = document.createElement("p");
      meta.textContent = `${config.category} · ${config.stage}`;
      const effect = document.createElement("p");
      effect.textContent = config.effect;
      item.append(top, meta, effect);

      const details: string[] = [];
      if (config.fragments?.length) details.push(`碎片：${config.fragments.map((fragment) => SPELL_NAMES[fragment as SpellKey] ?? fragment).join(" + ")}`);
      if (config.links?.length) details.push(`联动：${config.links.join(" / ")}`);
      if (config.aliases?.length) details.push(`喊法：${config.aliases.slice(0, 4).join("、")}`);
      if (details.length > 0) {
        const extra = document.createElement("small");
        extra.textContent = details.join("；");
        item.append(extra);
      }

      list.append(item);
    });

    this.wildSpellbookPanel.append(header, list);
  }

  private pause(): void {
    if (!this.running || this.paused || this.selectingBuff || this.gameOver) {
      return;
    }
    this.paused = true;
    this.keys.clear();
    this.pauseOverlay.hidden = false;
    this.selectPauseAction(0);
    this.syncCommandDockVisibility();
    this.renderGuidePanel();
    this.updateWildSpellbookVisibility();
  }

  private resume(): void {
    if (!this.running || !this.paused || this.selectingBuff || this.gameOver) {
      return;
    }
    this.paused = false;
    this.pauseOverlay.hidden = true;
    this.pauseSelectionIndex = 0;
    this.lastFrame = performance.now();
    this.syncCommandDockVisibility();
    this.renderGuidePanel();
    this.updateWildSpellbookVisibility();
  }

  private togglePause(): void {
    if (!this.running || this.selectingBuff || this.gameOver) {
      return;
    }
    if (this.paused) {
      this.resume();
      return;
    }
    this.pause();
  }

  private noteTutorialMovement(key: string): void {
    if (this.tutorial.moved || !this.running || this.paused || this.selectingBuff || this.gameOver) {
      return;
    }
    const normalized = key.toLowerCase();
    if (!["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(normalized)) {
      return;
    }
    this.tutorial.moved = true;
    this.renderGuidePanel();
  }

  private finishRunFromPause(): void {
    if (!this.running || this.selectingBuff || this.gameOver) {
      return;
    }
    this.recordVoiceBarrage("手动结束：进入结算", "control");
    this.endRun();
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
    this.spellCues = [];
    this.comboFlash = null;
    this.voiceDanmaku = [];
    this.voiceDanmakuPins = [];
    this.lastVoiceDanmakuText = "";
    this.lastVoiceDanmakuAt = 0;
    this.nextVoiceDanmakuLane = 0;
    this.pendingExternalizeBlasts = [];
    this.pendingCardReveals = [];
    this.pendingTooLateEvents = [];
    this.tooLateZones = [];
    this.refusalZones = [];
    this.receivedCharge = null;
    this.pendingReceivedReceipts = [];
    this.receivedAutoReleaseTime = 0;
    this.receivedAutoReleasePower = 1;
    this.pendingTomorrowInsuranceEvents = [];
    this.pendingBangTwoFistEvents = [];
    this.seriousCases = [];
    this.pendingUrgentCryEvents = [];
    this.screenShakeTime = 0;
    this.screenShakeDuration = 0;
    this.screenShakeStrength = 0;
    this.screenFlashTime = 0;
    this.screenFlashDuration = 0;
    this.screenFlashAlpha = 0;
    this.hitStopTime = 0;
    this.slowMoTime = 0;
    this.slowMoDuration = 0;
    this.slowMoScale = 1;
    this.zoomPunchTime = 0;
    this.zoomPunchDuration = 0;
    this.zoomPunchStrength = 0;
    this.impactLines = [];
    this.lightningArcs = [];
    this.frostWaves = [];
    this.frostShards = [];
    this.playerAfterimages = [];
    this.turrets = [];
    this.unlockedSpells = new Set(["cannon", "cannonPrep", "cannonFire"]);
    this.refreshVoiceSpellRecognition();
    this.ownedBuffs.clear();
    this.spellChain = [];
    this.repeatableSpellChain = [];
    this.spellCastCounts.clear();
    this.voiceBarrageLog = [];
    this.lastVoiceBarrageText = "";
    this.lastVoiceBarrageAt = -999;
    this.tutorial = {
      guideDismissed: false,
      moved: false,
      prepDone: false,
      aimDone: false,
      fireDone: false,
      upgradeSeen: false,
      upgradeChosen: false,
    };
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
      refusalTime: 0,
      slimTime: 0,
      gracefulTime: 0,
    };
    this.playerHistory = [];
    this.markedEnemyId = null;
    this.cardMarkTime = 0;
    this.gracefulConfidence = 0;
    this.fatalInsuranceTime = 0;
    this.fatalInsuranceMaxTime = 0;
    this.delayedHealTime = 0;
    this.delayedHealAmount = 0;
    this.nextSpellFree = false;
    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.xpGoal = INITIAL_XP_GOAL;
    this.pendingUpgradeChoices = 0;
    this.manualUpgradeSequenceOpen = false;
    this.elapsed = 0;
    this.spawnTimer = 0.72;
    this.spawnBudget = 1.15;
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
    this.magnetRadius = 92;
    this.explosionRadius = 82;
    this.explosionDamageScale = 0.48;
    this.explosionDurationBonus = 0;
    this.freezeDuration = 1.7;
    this.freezePulseRadius = 140;
    this.lightningJumps = 3;
    this.lightningDamageScale = 0.55;
    this.bangLevel = 1;
    this.skillGoLevel = 1;
    if (this.runMode === "wild") {
      this.enableWildMode();
    } else if (this.testEnvironment) {
      this.enableTestEnvironment();
    }
    this.screenShake = 0;
    this.screenShakePower = 0;
    this.renderCommandDock();
    this.renderGuidePanel();
    this.say("开局：按 Q 一级准备，按 E 人间大炮瞄准，按 R 发射；普通咒语从 1 开始。");
  }

  private enableWildMode(): void {
    this.unlockedSpells = new Set<SpellKey>(SPELL_KEYS);
    this.refreshVoiceSpellRecognition();
    this.player.maxHp = 140;
    this.player.hp = this.player.maxHp;
    this.player.shield = 28;
    this.maxEnergy = 220;
    this.energy = this.maxEnergy;
    this.energyRegen = BASE_ENERGY_REGEN * 3.2;
    this.dropEnergyRatio = 0.26;
    this.cannonMeter = 90;
    this.spawnBudget = 7.4;
    this.surgeTimer = 15;
    this.attackDamage += 4;
    this.attackRate *= 0.82;
    this.projectileSpeed += 70;
    this.moveSpeed += 22;
    this.magnetRadius += 54;
    this.cannonShardCount += 4;
    this.guardTurretCount = Math.max(this.guardTurretCount, 1);
    this.guardTurretCooldown = 0.2;
    this.bladeCount = Math.max(this.bladeCount, 1);
    this.tutorial.guideDismissed = true;
    this.tutorial.upgradeSeen = true;
    this.tutorial.upgradeChosen = true;
    this.recordVoiceBarrage("狂野模式：全咒语解锁，升级跳过抽卡，怪潮加压。", "control");
  }

  private enableTestEnvironment(): void {
    this.unlockedSpells = new Set<SpellKey>([...CORE_VOICE_SPELLS, ...TEST_FUN_SPELLS]);
    this.refreshVoiceSpellRecognition();
    this.maxEnergy = 300;
    this.energy = this.maxEnergy;
    this.energyRegen = BASE_ENERGY_REGEN * 4.6;
    this.dropEnergyRatio = 0.34;
    this.cannonMeter = 100;
    this.spawnBudget = 10;
    this.surgeTimer = 9;
    this.attackDamage += 5;
    this.tutorial.upgradeSeen = true;
    this.tutorial.upgradeChosen = true;
    this.say("TEST 环境：已解锁全部乐子咒语，升级不抽卡，声能高速恢复，怪潮大幅提升。");
  }

  private loop(time: number): void {
    const dt = Math.min(0.033, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    const impactPaused = this.hitStopTime > 0;
    if (!this.paused) {
      this.updateScreenEffects(dt);
    }
    const worldDt = dt * this.currentTimeScale();
    if (this.running && !this.paused && !this.selectingBuff && !this.gameOver) {
      if (impactPaused) {
        this.updateParticles(dt * 0.18);
        this.updateSpellCues(dt * 0.18);
      } else {
        this.update(worldDt);
      }
    }
    this.render();
    this.rafId = requestAnimationFrame((next) => this.loop(next));
  }

  private updateScreenEffects(dt: number): void {
    this.screenShakeTime = Math.max(0, this.screenShakeTime - dt);
    this.screenFlashTime = Math.max(0, this.screenFlashTime - dt);
    this.hitStopTime = Math.max(0, this.hitStopTime - dt);
    this.slowMoTime = Math.max(0, this.slowMoTime - dt);
    if (this.slowMoTime <= 0) {
      this.slowMoDuration = 0;
      this.slowMoScale = 1;
    }
    this.zoomPunchTime = Math.max(0, this.zoomPunchTime - dt);
    if (this.zoomPunchTime <= 0) {
      this.zoomPunchDuration = 0;
      this.zoomPunchStrength = 0;
    }
    this.updateImpactLines(dt);
    this.updateLightningArcs(dt);
    this.updateFrostEffects(dt);
    this.updatePlayerAfterimages(dt);
    this.updateVoiceDanmaku(dt);
  }

  private update(dt: number): void {
    this.elapsed += dt;
    this.screenShake = Math.max(0, this.screenShake - dt);
    if (this.comboFlash) {
      this.comboFlash.life -= dt;
      if (this.comboFlash.life <= 0) this.comboFlash = null;
    }
    this.recordPlayerSnapshot();
    const pressure = this.enemyPressure();
    const ramp = this.elapsed < 20 ? 1.45 : this.elapsed < 70 ? 1 : 0.72;
    const spawnGain = this.testEnvironment ? 0.34 : this.runMode === "wild" ? 0.22 : 0.085;
    const pressureDrag = this.testEnvironment ? 0.24 : this.runMode === "wild" ? 0.36 : 0.62;
    this.spawnBudget += dt * spawnGain * ramp * (1 - pressure * pressureDrag);
    const inSilence = this.isPlayerSilenced();
    this.energy = clamp(this.energy + dt * this.energyRegen * (inSilence && !this.testEnvironment ? 0.35 : 1), 0, this.maxEnergy);
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
    this.activeMods.refusalTime = Math.max(0, this.activeMods.refusalTime - dt);
    this.activeMods.slimTime = Math.max(0, this.activeMods.slimTime - dt);
    this.activeMods.gracefulTime = Math.max(0, this.activeMods.gracefulTime - dt);
    this.cardMarkTime = Math.max(0, this.cardMarkTime - dt);
    if (this.cardMarkTime <= 0) this.markedEnemyId = null;
    if (this.fatalInsuranceTime > 0) {
      this.fatalInsuranceTime = Math.max(0, this.fatalInsuranceTime - dt);
      if (this.fatalInsuranceTime <= 0) {
        this.expireTomorrowInsurance();
      }
    }
    if (this.delayedHealTime > 0) {
      this.delayedHealTime = Math.max(0, this.delayedHealTime - dt);
      if (this.delayedHealTime <= 0 && this.delayedHealAmount > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.delayedHealAmount);
        this.addSpellRing(this.player.position, 110, "#f8f1d1", "明天回信");
        this.delayedHealAmount = 0;
      }
    }
    this.updatePendingExternalizeBlasts(dt);
    this.updatePendingCardReveals(dt);
    this.updatePendingTooLateEvents(dt);
    this.updateTooLateZones(dt);
    this.updateRefusalZones(dt);
    this.updateReceivedCharge(dt);
    this.updatePendingReceivedReceipts(dt);
    this.updatePendingTomorrowInsuranceEvents(dt);
    this.updatePendingBangTwoFistEvents(dt);
    this.updateSeriousCases(dt);
    this.updatePendingUrgentCryEvents(dt);
    if (this.activeMods.gracefulTime <= 0 && this.gracefulConfidence > 0) {
      this.releaseGracefulConfidence();
    }
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
    this.updateSpellCues(dt);
    this.updateSurges(dt);
    this.spawnEnemies(dt);
    this.checkLevelUp();
    this.maybeAutoOpenPendingUpgradeChoices();
    this.updateHudPassThroughState();
  }

  private updatePendingExternalizeBlasts(dt: number): void {
    if (this.pendingExternalizeBlasts.length === 0) return;
    const remaining: PendingExternalizeBlast[] = [];
    for (const blast of this.pendingExternalizeBlasts) {
      blast.time -= dt;
      if (blast.time <= 0) {
        this.releaseExternalizeBlast(blast);
      } else {
        remaining.push(blast);
      }
    }
    this.pendingExternalizeBlasts = remaining;
  }

  private updatePendingCardReveals(dt: number): void {
    if (this.pendingCardReveals.length === 0) return;
    const remaining: PendingCardReveal[] = [];
    let resolved = 0;
    for (const reveal of this.pendingCardReveals) {
      reveal.time -= dt;
      if (reveal.time <= 0) {
        this.releaseCardReveal(reveal);
        resolved += 1;
      } else {
        remaining.push(reveal);
      }
    }
    this.pendingCardReveals = remaining;
    if (resolved > 0 && remaining.length === 0) {
      this.say("隐藏 Combo：我要验牌，验牌结束。");
    }
  }

  private updatePendingTooLateEvents(dt: number): void {
    if (this.pendingTooLateEvents.length === 0) return;
    const remaining: PendingTooLateEvent[] = [];
    for (const event of this.pendingTooLateEvents) {
      event.time -= dt;
      if (event.time <= 0) {
        this.releaseTooLateEvent(event);
      } else {
        remaining.push(event);
      }
    }
    this.pendingTooLateEvents = remaining;
  }

  private updateTooLateZones(dt: number): void {
    if (this.tooLateZones.length === 0) return;
    for (const zone of this.tooLateZones) {
      zone.life -= dt;
    }
    this.tooLateZones = this.tooLateZones.filter((zone) => zone.life > 0);
  }

  private activeTooLateZone(position: Vec2): TooLateZone | null {
    let best: TooLateZone | null = null;
    let bestScore = -Infinity;
    for (const zone of this.tooLateZones) {
      const dist = distance(position, zone.center);
      if (dist > zone.radius) continue;
      const score = (1 - dist / zone.radius) * zone.life;
      if (score > bestScore) {
        best = zone;
        bestScore = score;
      }
    }
    return best;
  }

  private updateRefusalZones(dt: number): void {
    if (this.refusalZones.length === 0) return;
    const remaining: RefusalZone[] = [];
    for (const zone of this.refusalZones) {
      zone.life -= dt;
      zone.tick -= dt;
      const cleared = this.clearEnemyShotsNear(zone.center, zone.radius);
      if (cleared > 0) {
        zone.clearedShots += cleared;
        this.energy = clamp(this.energy + cleared * 0.75, 0, this.maxEnergy);
        if (Math.random() < Math.min(0.85, cleared * 0.16)) {
          this.addSpellGlyph(zone.center, "闭麦", "#e9fbff", 38, 0.42);
        }
      }

      if (zone.tick <= 0) {
        zone.tick = 0.42;
        let interruptedNow = 0;
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0 || distance(enemy.position, zone.center) > zone.radius) continue;
          const isTalker = enemy.type === "ranged" || enemy.type === "repeater" || enemy.type === "silencer" || enemy.windup > 0;
          enemy.windup = 0;
          enemy.cooldown = Math.max(enemy.cooldown, isTalker ? 1.15 : 0.62);
          enemy.frozen = Math.max(enemy.frozen, isTalker ? 0.2 : 0.08);
          const damage = (5 + this.attackDamage * 0.18) * zone.power * (isTalker ? 2.4 : 1);
          this.damageEnemy(enemy, damage, "noTalk");
          if (isTalker) {
            interruptedNow += 1;
            zone.interrupted += 1;
            if (interruptedNow <= 5) {
              this.addSpellGlyph(enemy.position, enemy.type === "silencer" ? "闭麦" : "禁言", "#e9fbff", 28, 0.48);
            }
          }
        }
        if (interruptedNow > 0) {
          this.energy = clamp(this.energy + interruptedNow * 1.35, 0, this.maxEnergy);
          this.cannonMeter = clamp(this.cannonMeter + interruptedNow * 0.85, 0, 100);
          this.addImpactLines(zone.center, "#e9fbff", 6 + Math.min(12, interruptedNow), zone.radius * 0.58, 0.24);
        }
      }

      if (zone.life > 0) {
        remaining.push(zone);
      } else {
        this.releaseRefusalZone(zone);
      }
    }
    this.refusalZones = remaining;
  }

  private activeRefusalZone(position: Vec2): RefusalZone | null {
    let best: RefusalZone | null = null;
    let bestLife = -Infinity;
    for (const zone of this.refusalZones) {
      if (distance(position, zone.center) > zone.radius) continue;
      if (zone.life > bestLife) {
        best = zone;
        bestLife = zone.life;
      }
    }
    return best;
  }

  private releaseRefusalZone(zone: RefusalZone): void {
    const count = zone.interrupted + zone.clearedShots;
    const radius = zone.radius * 0.78;
    const damage = (22 + this.attackDamage * 0.72 + count * 0.9) * zone.power;
    let hits = 0;
    this.playSlowMo(0.26, 0.18);
    this.playZoomPunch(0.04, 0.2);
    this.flashScreen("#e9fbff", 0.12, 0.12);
    this.shakeScreen(8 + Math.min(10, count * 0.25), 0.22);
    this.addSlamSpellGlyph(zone.center, "总结陈词", "#e9fbff", 88, 0, 0.72, 2.2, 0.92);
    this.addSpellRing(zone.center, radius, "#e9fbff", "拒绝沟通结算", 0.82);
    this.addImpactLines(zone.center, "#66e0ff", 20 + Math.min(20, count), radius * 0.72, 0.32);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, zone.center) > radius) continue;
      hits += 1;
      this.damageEnemy(enemy, damage, "noTalk");
      this.knockEnemyAway(enemy, zone.center, 44 * zone.power);
      this.addBurst(enemy.position, "#e9fbff", 10);
    }
    this.energy = clamp(this.energy + Math.min(24, count * 0.9) + hits * 1.6, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + Math.min(22, count * 0.7) + hits, 0, 100);
    this.say(`隐藏 Combo：不讲不讲，总结陈词打断 ${zone.interrupted} 次，清掉 ${zone.clearedShots} 发弹幕。`);
  }

  private updateReceivedCharge(dt: number): void {
    if (this.receivedAutoReleaseTime > 0) {
      this.receivedAutoReleaseTime -= dt;
      if (this.receivedAutoReleaseTime <= 0 && this.receivedCharge) {
        this.releaseReceivedCharge(this.receivedAutoReleasePower);
      }
    }
    if (!this.receivedCharge) return;
    this.receivedCharge.life -= dt;
    if (this.receivedCharge.life > 0) return;
    const stored = this.receivedCharge.spells.length;
    this.receivedCharge = null;
    this.receivedAutoReleaseTime = 0;
    this.energy = clamp(this.energy + 6 + stored * 2, 0, this.maxEnergy);
    this.addSpellRing(this.player.position, 112, "#7cff9b", "回执超时");
    this.say(stored > 0 ? `收到：回执超时，退回 ${stored} 条指令声能。` : "收到：回执超时，没有确认执行。");
  }

  private updatePendingReceivedReceipts(dt: number): void {
    if (this.pendingReceivedReceipts.length === 0) return;
    const remaining: PendingReceivedReceipt[] = [];
    for (const receipt of this.pendingReceivedReceipts) {
      receipt.time -= dt;
      if (receipt.time <= 0) {
        this.releaseReceivedReceipt(receipt);
      } else {
        remaining.push(receipt);
      }
    }
    this.pendingReceivedReceipts = remaining;
  }

  private updatePendingTomorrowInsuranceEvents(dt: number): void {
    if (this.pendingTomorrowInsuranceEvents.length === 0) return;
    const remaining: PendingTomorrowInsuranceEvent[] = [];
    for (const event of this.pendingTomorrowInsuranceEvents) {
      event.time -= dt;
      if (event.time <= 0) {
        this.releaseTomorrowInsuranceEvent(event);
      } else {
        remaining.push(event);
      }
    }
    this.pendingTomorrowInsuranceEvents = remaining;
  }

  private updatePendingBangTwoFistEvents(dt: number): void {
    if (this.pendingBangTwoFistEvents.length === 0) return;
    const remaining: PendingBangTwoFistEvent[] = [];
    for (const event of this.pendingBangTwoFistEvents) {
      event.time -= dt;
      if (event.time <= 0) {
        this.releaseBangSecondFist(event);
      } else {
        remaining.push(event);
      }
    }
    this.pendingBangTwoFistEvents = remaining;
  }

  private updateSeriousCases(dt: number): void {
    if (this.seriousCases.length === 0) return;
    const remaining: SeriousCase[] = [];
    for (const item of this.seriousCases) {
      item.life -= dt;
      const enemy = this.enemies.find((candidate) => candidate.id === item.enemyId && candidate.hp > 0);
      if (!enemy) continue;
      item.progress += dt * (enemy.type === "silencer" || enemy.type === "ranged" || enemy.type === "target" ? 0.46 : 0.32) * item.power;
      if (item.progress >= 1 || item.life <= 0) {
        this.releaseSeriousCase(item, enemy);
      } else {
        remaining.push(item);
      }
    }
    this.seriousCases = remaining;
  }

  private updatePendingUrgentCryEvents(dt: number): void {
    if (this.pendingUrgentCryEvents.length === 0) return;
    const remaining: PendingUrgentCryEvent[] = [];
    for (const event of this.pendingUrgentCryEvents) {
      event.time -= dt;
      if (event.time <= 0) {
        this.releaseUrgentCryEvent(event);
      } else {
        remaining.push(event);
      }
    }
    this.pendingUrgentCryEvents = remaining;
  }

  private effectivePlayerRadius(): number {
    if (this.activeMods.slimTime > 0 && this.activeMods.gracefulTime > 0) {
      return Math.max(4.5, this.player.radius * 0.34);
    }
    const slim = this.activeMods.slimTime > 0 ? 0.68 : 1;
    const graceful = this.activeMods.gracefulTime > 0 ? 0.86 : 1;
    return Math.max(7, this.player.radius * slim * graceful);
  }

  private playerMaxY(radius: number): number {
    return Math.max(radius, this.height - radius);
  }

  private clampToPlayableArea(position: Vec2, radius: number): Vec2 {
    return {
      x: clamp(position.x, radius, this.width - radius),
      y: clamp(position.y, radius, this.playerMaxY(radius)),
    };
  }

  private hudPanelBoundsInCanvas(panel: HTMLElement): { left: number; right: number; top: number; bottom: number } | null {
    if (!this.running || panel.hidden) return null;
    const canvasRect = this.canvas.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    if (panelRect.width <= 0 || panelRect.height <= 0) return null;
    return {
      left: panelRect.left - canvasRect.left,
      right: panelRect.right - canvasRect.left,
      top: panelRect.top - canvasRect.top,
      bottom: panelRect.bottom - canvasRect.top,
    };
  }

  private updateHudPassThroughState(): void {
    if (!this.running) {
      this.clearHudPassThroughState();
      return;
    }
    const radius = this.effectivePlayerRadius() + 8;
    const panels = this.root.querySelectorAll<HTMLElement>([
      ".survivor-title",
      ".survivor-bars",
      ".survivor-voice",
      ".survivor-active-spells",
      ".survivor-guide-panel",
      ".survivor-detail-panel",
      ".survivor-resource-panel",
      ".survivor-gm-panel",
      ".survivor-command-dock",
      ".survivor-wild-spellbook-toggle",
    ].join(", "));
    for (const panel of panels) {
      const bounds = this.hudPanelBoundsInCanvas(panel);
      if (!bounds) {
        panel.classList.remove("is-player-behind");
        continue;
      }
      const overlaps =
        this.player.position.x + radius >= bounds.left &&
        this.player.position.x - radius <= bounds.right &&
        this.player.position.y + radius >= bounds.top &&
        this.player.position.y - radius <= bounds.bottom;
      panel.classList.toggle("is-player-behind", overlaps);
    }
  }

  private clearHudPassThroughState(): void {
    const panels = this.root.querySelectorAll<HTMLElement>(".is-player-behind");
    for (const panel of panels) {
      panel.classList.remove("is-player-behind");
    }
  }

  private updatePlayer(dt: number): void {
    if (this.player.cannonTime > 0) {
      this.player.cannonTime -= dt;
      this.player.invuln = Math.max(this.player.invuln, 0.12);
      if (Math.random() < 0.55) {
        this.addBurst(this.player.position, "#ffe27a", 2);
      }
      if (Math.random() < Math.min(1, dt * 22)) {
        this.addPlayerAfterimage(this.player.position, "#ffe27a", this.effectivePlayerRadius() + 5, 0.22, undefined, 1.55);
      }
      if (Math.random() < Math.min(1, dt * 18)) {
        this.addImpactBurst(this.player.position, this.cannonLaunchCharge >= 3 ? "#ff9b4a" : "#ffe27a", 3 + this.cannonLaunchCharge);
      }
      this.player.position.x += this.player.cannonVelocity.x * dt;
      this.player.position.y += this.player.cannonVelocity.y * dt;
      if (this.player.position.x < this.player.radius || this.player.position.x > this.width - this.player.radius) {
        this.player.cannonVelocity.x *= -1.03;
        this.cannonBouncesLeft -= 1;
        this.addBurst(this.player.position, "#ffd25a", 24 + this.cannonLaunchCharge * 7);
        this.addSpellGlyph(this.player.position, "弹", "#ffe27a", 42 + this.cannonLaunchCharge * 8, 0.36);
        this.addImpactLines(this.player.position, "#ffe27a", 10 + this.cannonLaunchCharge * 3, 98 + this.cannonLaunchCharge * 22, 0.22);
        this.cannonShockwave(this.player.position, 72 + this.cannonLaunchCharge * 18, 10 + this.cannonLaunchCharge * 7, 26 + this.cannonLaunchCharge * 9, false);
        this.shakeScreen(5 + this.cannonLaunchCharge * 2, 0.1);
      }
      if (this.player.position.y < this.player.radius || this.player.position.y > this.playerMaxY(this.player.radius)) {
        this.player.cannonVelocity.y *= -1.03;
        this.cannonBouncesLeft -= 1;
        this.addBurst(this.player.position, "#ffd25a", 24 + this.cannonLaunchCharge * 7);
        this.addSpellGlyph(this.player.position, "弹", "#ffe27a", 42 + this.cannonLaunchCharge * 8, 0.36);
        this.addImpactLines(this.player.position, "#ffe27a", 10 + this.cannonLaunchCharge * 3, 98 + this.cannonLaunchCharge * 22, 0.22);
        this.cannonShockwave(this.player.position, 72 + this.cannonLaunchCharge * 18, 10 + this.cannonLaunchCharge * 7, 26 + this.cannonLaunchCharge * 9, false);
        this.shakeScreen(5 + this.cannonLaunchCharge * 2, 0.1);
      }
      this.player.position.x = clamp(this.player.position.x, this.player.radius, this.width - this.player.radius);
      this.player.position.y = clamp(this.player.position.y, this.player.radius, this.playerMaxY(this.player.radius));
      const cannonCollisionRadius = this.player.radius + 18 + this.cannonLaunchCharge * 18 + (this.cannonLaunchCharge >= 3 ? 34 : 0);
      for (const enemy of this.enemies) {
        if (distance(this.player.position, enemy.position) < cannonCollisionRadius + enemy.radius) {
          const priorityBonus = enemy.type === "target" ? 2.8 : enemy.type === "silencer" || enemy.type === "ranged" || enemy.type === "repeater" ? 1.35 : 1;
          const beforeHp = enemy.hp;
          this.damageEnemy(enemy, this.cannonDamage * (1 + this.cannonLaunchCharge * 0.16) * priorityBonus, "cannon");
          this.knockEnemyAway(enemy, this.player.position, 68 + this.cannonLaunchCharge * 24);
          this.addBurst(enemy.position, enemy.type === "target" ? "#ff4a4a" : "#ffe27a", enemy.type === "target" ? 48 : 20 + this.cannonLaunchCharge * 5);
          if (beforeHp > 0 && (enemy.hp <= 0 || Math.random() < 0.28)) {
            this.addSpellGlyph(enemy.position, enemy.hp <= 0 ? "轰" : "撞", enemy.type === "target" ? "#ff4a4a" : "#ffe27a", enemy.hp <= 0 ? 62 : 44, 0.36);
            this.addImpactLines(enemy.position, enemy.type === "target" ? "#ff4a4a" : "#ffe27a", 12 + this.cannonLaunchCharge * 4, 118 + this.cannonLaunchCharge * 28, 0.24);
            this.cannonShockwave(enemy.position, 86 + this.cannonLaunchCharge * 22, 11 + this.cannonLaunchCharge * 8, 34 + this.cannonLaunchCharge * 13, false);
            this.shakeScreen(5 + this.cannonLaunchCharge * 2, 0.12);
          }
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
    if (!this.tutorial.moved && (Math.abs(input.x) > 0 || Math.abs(input.y) > 0)) {
      this.tutorial.moved = true;
      this.renderGuidePanel();
    }
    const playerRadius = this.effectivePlayerRadius();
    const gracefulSpeedBoost =
      this.activeMods.slimTime > 0 && this.activeMods.gracefulTime > 0
        ? 1.46
        : this.activeMods.gracefulTime > 0
          ? 1.12
          : 1;
    this.player.velocity = { x: move.x * this.moveSpeed * gracefulSpeedBoost, y: move.y * this.moveSpeed * gracefulSpeedBoost };
    this.player.position.x = clamp(this.player.position.x + this.player.velocity.x * dt, playerRadius, this.width - playerRadius);
    this.player.position.y = clamp(this.player.position.y + this.player.velocity.y * dt, playerRadius, this.playerMaxY(playerRadius));
  }

  private updateAutoFire(dt: number): void {
    this.player.fireCooldown -= dt;
    if (this.player.fireCooldown > 0) return;
    const target = this.pickTarget();
    if (!target) return;
    this.player.fireCooldown = Math.max(0.12, this.attackRate * (this.activeMods.seriousTime > 0 ? 0.56 : 1));
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
    const playerRadius = this.effectivePlayerRadius();
    const refusal = this.activeMods.refusalTime > 0;
    for (const enemy of this.enemies) {
      enemy.frozen = Math.max(0, enemy.frozen - dt);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.windup = Math.max(0, enemy.windup - dt);
      if (enemy.frozen > 0) continue;

      const delayedZone = this.activeTooLateZone(enemy.position);
      const refusalZone = this.activeRefusalZone(enemy.position);
      const refused = refusal || !!refusalZone;
      if (refusalZone) {
        enemy.windup = 0;
        enemy.cooldown = Math.max(enemy.cooldown, enemy.type === "ranged" || enemy.type === "repeater" || enemy.type === "silencer" ? 0.28 : 0.08);
      }
      const targetPosition = delayedZone?.center ?? this.player.position;
      const delayedDrag = (delayedZone ? 0.36 + 0.18 * (1 - delayedZone.life / delayedZone.maxLife) : 1) * (refusalZone ? 0.64 : 1);
      if (delayedZone) {
        enemy.windup = 0;
        enemy.cooldown = Math.max(enemy.cooldown, 0.18);
      }
      const toPlayer = normalize({ x: targetPosition.x - enemy.position.x, y: targetPosition.y - enemy.position.y });
      if (enemy.type === "pouncer") {
        if (!refused && !delayedZone && enemy.cooldown <= 0) {
          enemy.windup = 0.48;
          enemy.cooldown = Math.max(1.65, 2.7 - this.threatTier() * 0.18);
        }
        const speed = (refused ? enemy.speed * 0.22 : enemy.windup > 0 ? 8 : enemy.speed * 2.8) * delayedDrag;
        enemy.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
      } else if (enemy.type === "ranged") {
        const dist = distance(enemy.position, targetPosition);
        const backing = delayedZone ? 0.72 : dist < 170 ? -0.55 : 0.45;
        enemy.velocity = { x: toPlayer.x * enemy.speed * backing * (refused ? 0.28 : 1) * delayedDrag, y: toPlayer.y * enemy.speed * backing * (refused ? 0.28 : 1) * delayedDrag };
        if (!refused && !delayedZone && enemy.cooldown <= 0 && dist < 520) {
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
        enemy.velocity = { x: toPlayer.x * enemy.speed * (refused ? 0.36 : 1) * delayedDrag, y: toPlayer.y * enemy.speed * (refused ? 0.36 : 1) * delayedDrag };
      }

      enemy.position.x += enemy.velocity.x * dt;
      enemy.position.y += enemy.velocity.y * dt;
      enemy.position.x = clamp(enemy.position.x, enemy.radius, this.width - enemy.radius);
      enemy.position.y = clamp(enemy.position.y, enemy.radius, this.playerMaxY(enemy.radius));

      if (distance(enemy.position, this.player.position) < enemy.radius + playerRadius) {
        this.hurtPlayer(this.scaledEnemyDamage(enemy.type));
        const away = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
        this.player.position.x = clamp(this.player.position.x + away.x * 18, playerRadius, this.width - playerRadius);
        this.player.position.y = clamp(this.player.position.y + away.y * 18, playerRadius, this.playerMaxY(playerRadius));
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
        if (projectile.freeze) {
          enemy.frozen = Math.max(enemy.frozen, this.freezeDuration);
          this.addFrostShards(enemy.position, 3, enemy.radius * 2.2, "#bdf2ff", 0.18);
        }
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
    const playerRadius = this.effectivePlayerRadius();
    for (const shot of this.enemyShots) {
      shot.life -= dt;
      shot.position.x += shot.velocity.x * dt;
      shot.position.y += shot.velocity.y * dt;
      const dist = distance(shot.position, this.player.position);
      if (dist < shot.radius + playerRadius) {
        this.hurtPlayer(shot.damage);
        shot.life = 0;
      } else if (!shot.grazed && this.activeMods.gracefulTime > 0 && dist < shot.radius + this.player.radius + 18) {
        shot.grazed = true;
        this.energy = clamp(this.energy + 3.4, 0, this.maxEnergy);
        this.gracefulConfidence = clamp(this.gracefulConfidence + 0.22, 0, 4);
        this.addParticle(this.player.position, shot.position, "#9cffd0");
        this.addSpellGlyph(shot.position, this.gracefulConfidence >= 1.2 ? "曼妙" : "没碰到", "#9cffd0", 24, 0.42);
      }
    }
    this.enemyShots = this.enemyShots.filter((shot) => shot.life > 0);
  }

  private updateDrops(dt: number): void {
    const playerRadius = this.effectivePlayerRadius();
    for (const drop of this.drops) {
      drop.position = this.clampToPlayableArea(drop.position, drop.radius);
      const dist = distance(drop.position, this.player.position);
      if (dist < playerRadius + drop.radius) {
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
        drop.position = this.clampToPlayableArea(drop.position, drop.radius);
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

  private updateSpellCues(dt: number): void {
    for (const cue of this.spellCues) {
      if (cue.delay && cue.delay > 0) {
        cue.delay -= dt;
        continue;
      }
      cue.life -= dt;
    }
    this.spellCues = this.spellCues.filter((cue) => cue.life > 0 || (cue.delay ?? 0) > 0);
  }

  private updateImpactLines(dt: number): void {
    for (const line of this.impactLines) {
      line.life -= dt;
    }
    this.impactLines = this.impactLines.filter((line) => line.life > 0);
  }

  private updateLightningArcs(dt: number): void {
    for (const arc of this.lightningArcs) {
      arc.life -= dt;
    }
    this.lightningArcs = this.lightningArcs.filter((arc) => arc.life > 0);
  }

  private updateFrostEffects(dt: number): void {
    for (const wave of this.frostWaves) {
      wave.life -= dt;
    }
    for (const shard of this.frostShards) {
      shard.life -= dt;
    }
    this.frostWaves = this.frostWaves.filter((wave) => wave.life > 0);
    this.frostShards = this.frostShards.filter((shard) => shard.life > 0);
  }

  private updatePlayerAfterimages(dt: number): void {
    for (const image of this.playerAfterimages) {
      image.life -= dt;
    }
    this.playerAfterimages = this.playerAfterimages.filter((image) => image.life > 0);
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
    this.surgeTimer = this.runMode === "wild" ? Math.max(16, 28 - this.threatTier() * 2.5) : Math.max(24, 40 - this.threatTier() * 3);
  }

  private spawnSurge(): void {
    const tier = this.threatTier();
    const roomLeft = Math.max(0, this.targetEnemyCount() + 6 - this.enemies.length);
    const count = Math.min(roomLeft, (this.runMode === "wild" ? 7 : 4) + Math.floor(tier * (this.runMode === "wild" ? 2.1 : 1.45)));
    for (let i = 0; i < count; i += 1) {
      const type: EnemyType =
        i === 0 && tier >= 3 ? "target" :
        i % 4 === 0 && tier >= 2 ? "silencer" :
        i % 3 === 0 ? "ranged" :
        i % 2 === 0 ? "pouncer" :
        "brute";
      this.spawnEnemy(type, 1.12 + tier * 0.12);
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
    const pressureLimit = this.testEnvironment ? 1.22 : this.runMode === "wild" ? 1.16 : tier >= 4 ? 1.06 : tier >= 3 ? 1.08 : 1;
    if (pressure >= pressureLimit) {
      this.spawnTimer = this.runMode === "wild" ? 0.48 : tier >= 4 ? 0.78 : tier >= 3 ? 0.72 : 0.9;
      this.spawnBudget = Math.min(this.spawnBudget, this.runMode === "wild" ? 2.25 : tier >= 4 ? 1.45 : tier >= 3 ? 1.6 : 1.2);
      return;
    }
    const earlyRush = this.elapsed < 20;
    const maxBatch = this.testEnvironment
      ? (earlyRush ? 10 : 14 + tier * 2)
      : this.runMode === "wild"
        ? (earlyRush ? 7 : 10 + tier * 2)
        : earlyRush ? 4 : this.elapsed < 80 ? 7 + tier : 4 + tier;
    const roomLeft = Math.max(0, targetCount - this.enemies.length);
    const count = Math.min(maxBatch, roomLeft, (earlyRush ? 2 : 1) + Math.floor(this.spawnBudget));
    for (let i = 0; i < count; i += 1) {
      this.spawnEnemy(this.pickEnemyType(wave));
    }
    this.spawnBudget = Math.max(
      this.testEnvironment ? 3.4 : this.runMode === "wild" ? 2.4 : earlyRush ? 1.05 : 0.7,
      this.spawnBudget - count * (this.testEnvironment ? 0.38 : this.runMode === "wild" ? 0.46 : 0.62),
    );
    this.spawnTimer = this.nextSpawnInterval(pressure);
  }

  private targetEnemyCount(): number {
    const tier = this.threatTier();
    if (this.testEnvironment) {
      if (this.elapsed < 20) return 58;
      if (this.elapsed < 55) return 74 + tier * 5;
      if (this.elapsed < 100) return 88 + tier * 7;
      return 102 + tier * 8;
    }
    if (this.runMode === "wild") {
      if (this.elapsed < 20) return 42;
      if (this.elapsed < 55) return 54 + tier * 4;
      if (this.elapsed < 100) return 66 + tier * 5;
      return 76 + tier * 6;
    }
    if (this.elapsed < 20) return 20;
    if (this.elapsed < 55) return 24 + tier * 2;
    if (this.elapsed < 100) return 29 + tier * 3;
    return 32 + tier * 3;
  }

  private enemyPressure(): number {
    return clamp(this.enemies.length / this.targetEnemyCount(), 0, 1.2);
  }

  private nextSpawnInterval(pressure: number): number {
    const tier = this.threatTier();
    if (this.testEnvironment) {
      return clamp(0.28 + pressure * 0.18 - tier * 0.025, 0.18, 0.52);
    }
    if (this.runMode === "wild") {
      return clamp(0.48 + pressure * 0.28 - tier * 0.045, 0.3, 0.78);
    }
    const base = this.elapsed < 20 ? 0.86 : this.elapsed < 70 ? 1.08 : 1.36;
    const pressureDelay = pressure * (0.78 - tier * 0.06);
    return clamp(base + pressureDelay - tier * 0.065, 0.5, 2.05);
  }

  private threatTier(): number {
    const buffCount = [...this.ownedBuffs.values()].reduce((sum, count) => sum + count, 0);
    const byBuffs = buffCount >= 10 ? 4 : buffCount >= 7 ? 3 : buffCount >= 4 ? 2 : buffCount >= 1 ? 1 : 0;
    const byLevel = this.level >= 10 ? 4 : this.level >= 7 ? 3 : this.level >= 4 ? 2 : this.level >= 2 ? 1 : 0;
    const byTime = this.elapsed >= 175 ? 4 : this.elapsed >= 115 ? 3 : this.elapsed >= 60 ? 2 : this.elapsed >= 28 ? 1 : 0;
    if (this.testEnvironment) return Math.max(2, byBuffs, byLevel, byTime);
    if (this.runMode === "wild") return Math.max(1, byBuffs, byLevel, byTime);
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
    const baseHp = cfg.hp + this.elapsed * (0.15 + scaling.tier * 0.03);
    const hp = baseHp * scaling.hpMultiplier * strength;
    const edge = Math.floor(Math.random() * 4);
    const maxY = this.playerMaxY(cfg.radius);
    const position = {
      x: edge === 0 ? -30 : edge === 1 ? this.width + 30 : Math.random() * this.width,
      y: edge === 2 ? -30 : edge === 3 ? maxY + 30 : Math.random() * maxY,
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
    const wildHpBonus = this.runMode === "wild" ? 0.22 + minutes * 0.05 : 0;
    const wildSpeedBonus = this.runMode === "wild" ? 0.08 + minutes * 0.015 : 0;
    const wildDamageBonus = this.runMode === "wild" ? 0.18 + minutes * 0.035 : 0;
    return {
      tier,
      hpMultiplier: 1 + tier * 0.23 + Math.max(0, minutes - 1) * 0.13 + wildHpBonus,
      speedMultiplier: 1 + tier * 0.04 + Math.max(0, minutes - 1.3) * 0.02 + wildSpeedBonus,
      damageMultiplier: 1 + tier * 0.13 + Math.max(0, minutes - 1) * 0.06 + wildDamageBonus,
    };
  }

  private scaledEnemyDamage(type: EnemyType): number {
    const scaling = this.enemyScaling();
    return Math.round(ENEMY_DAMAGE[type] * scaling.damageMultiplier);
  }

  private handleVoiceActions(actions: SurvivorVoiceAction[]): void {
    if (actions.length > 0) {
      const tone = actions.some((action) => action.type === "combo")
        ? "combo"
        : actions.some((action) => action.type === "voice")
          ? "control"
          : "spell";
      this.recordVoiceBarrage(`识别：${actions.map(voiceActionLabel).join(" / ")}`, tone);
    }
    for (const action of actions) {
      if (action.type === "voice") {
        this.handleVoiceControl(action);
      } else if (action.type === "combo") {
        this.castVoiceCombo(action.combo);
      } else {
        this.castSpell(action.spell);
      }
    }
  }

  private recordVoiceBarrage(text: string, tone: "heard" | "spell" | "combo" | "control"): void {
    const normalized = text.trim();
    if (!normalized) return;
    if (normalized === this.lastVoiceBarrageText && this.elapsed - this.lastVoiceBarrageAt < 2.5) {
      return;
    }
    this.lastVoiceBarrageText = normalized;
    this.lastVoiceBarrageAt = this.elapsed;
    this.voiceBarrageLog.push({ text: normalized, tone, time: this.elapsed });
    if (this.voiceBarrageLog.length > 28) {
      this.voiceBarrageLog.shift();
    }
  }

  private castVoiceCombo(comboKey: VoiceComboKey): boolean {
    if (!this.running || this.paused || this.selectingBuff || this.gameOver) return false;
    const combo = VOICE_COMBO_CONFIG[comboKey];
    let successfulCasts = 0;
    for (const spell of combo.spells) {
      if (this.castSpell(spell)) successfulCasts += 1;
    }

    if (successfulCasts <= 0 || !this.isVoiceComboArmed(comboKey)) {
      this.say(`组合咒语「${combo.name}」没接上：需要 ${combo.spells.map((spell) => SPELL_NAMES[spell]).join(" + ")} 同时生效。`);
      return false;
    }

    this.triggerVoiceCombo(comboKey);
    return true;
  }

  private isVoiceComboArmed(comboKey: VoiceComboKey): boolean {
    switch (comboKey) {
      case "stormBloom":
        return this.activeMods.lightningTime > 0 && this.activeMods.explosionTime > 0 && this.activeMods.ricochetTime > 0;
      case "iceBomb":
        return this.activeMods.freezeTime > 0 && this.activeMods.explosionTime > 0;
      case "thunderRicochet":
        return this.activeMods.lightningTime > 0 && this.activeMods.ricochetTime > 0;
      case "scatterRicochet":
        return this.activeMods.splitTime > 0 && this.activeMods.ricochetTime > 0;
      case "pierceRicochet":
        return this.activeMods.pierceTime > 0 && this.activeMods.ricochetTime > 0;
      case "bloomRicochet":
        return this.activeMods.explosionTime > 0 && this.activeMods.ricochetTime > 0;
      case "frostBlades":
        return this.activeMods.freezeTime > 0;
      case "boomBlades":
        return this.activeMods.explosionTime > 0;
      case "cannonBloom":
        return this.player.cannonTime > 0 && this.activeMods.ricochetTime > 0;
      default:
        return false;
    }
  }

  private voiceComboPower(comboKey: VoiceComboKey): number {
    const buffLinks: Record<VoiceComboKey, string[]> = {
      stormBloom: ["stat-ricochet-spark", "stat-ricochet-bloom", "combo-lightning-burst"],
      iceBomb: ["stat-freeze-brittle", "combo-frozen-shatter"],
      thunderRicochet: ["stat-ricochet-spark"],
      scatterRicochet: ["combo-split-ricochet"],
      pierceRicochet: ["combo-pierce-ricochet"],
      bloomRicochet: ["stat-ricochet-bloom"],
      frostBlades: ["weapon-blade", "weapon-blade-count", "combo-blade-freeze"],
      boomBlades: ["weapon-blade", "weapon-blade-count", "combo-blade-boom"],
      cannonBloom: ["combo-cannon-shards"],
    };
    const stackPower = buffLinks[comboKey].reduce((total, id) => total + (this.ownedBuffs.get(id) ?? 0) * 0.18, 0);
    return 1 + stackPower + Math.min(0.45, new Set(this.spellChain).size * 0.06);
  }

  private triggerVoiceCombo(comboKey: VoiceComboKey): void {
    const combo = VOICE_COMBO_CONFIG[comboKey];
    const power = this.voiceComboPower(comboKey);
    const danmakuColors = this.voiceComboDanmakuColors(comboKey);
    this.addVoiceDanmakuPin(combo.name, "组合咒语接上", danmakuColors.color, danmakuColors.accent);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.8 + power);

    switch (comboKey) {
      case "stormBloom": {
        this.playSlowMo(0.38, 0.26);
        this.playZoomPunch(0.044, 0.24);
        this.addImpactLines(this.player.position, "#e5ff66", 18, 180);
        this.playSpellImpact({ glyph: "爆", glyphCount: 6, glyphSize: 58, color: "#e5ff66", shake: 10, flash: 0.22, hitStop: 0.055, radius: 158, particles: 24 });
        this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 3.5 * power);
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, 3.5 * power);
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 3.5 * power);
        this.chainLightning(this.player.position, (18 + this.level * 1.2) * power);
        for (const enemy of this.nearbyEnemies(this.player.position, this.ricochetRange + 220, 4)) {
          this.explode(enemy.position, this.explosionRadius * 0.9, (14 + this.attackDamage) * power, false);
        }
        this.addVoiceComboBurst("#e5ff66", "#ff9b4a", 58);
        this.say(`组合咒语：${combo.name}！雷链引爆，跳弹扩散。`);
        break;
      }
      case "iceBomb": {
        this.playSlowMo(0.42, 0.24);
        this.playZoomPunch(0.044, 0.24);
        this.addImpactLines(this.player.position, "#9be7ff", 18, 178);
        this.playSpellImpact({ glyph: "冰", glyphCount: 7, glyphSize: 58, color: "#9be7ff", shake: 10, flash: 0.22, hitStop: 0.055, radius: 164, particles: 28 });
        const radius = this.freezePulseRadius + 52;
        this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 3.8 * power);
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, 3.2 * power);
        this.freezeAround(this.player.position, radius, this.freezeDuration * (1.1 + power * 0.18));
        this.addFrostShards(this.player.position, 18, radius * 0.48, "#e8fbff", 0.38);
        this.explode(this.player.position, this.explosionRadius + 46, (18 + this.attackDamage) * power, true);
        this.addVoiceComboBurst("#9be7ff", "#ff9b4a", 54);
        this.say(`组合咒语：${combo.name}！先冻住，再炸开。`);
        break;
      }
      case "thunderRicochet": {
        this.playSlowMo(0.48, 0.2);
        this.playZoomPunch(0.038, 0.22);
        this.addImpactLines(this.player.position, "#e5ff66", 16, 156);
        this.playSpellImpact({ glyph: "电", glyphCount: 5, glyphSize: 66, color: "#e5ff66", shake: 9, flash: 0.2, hitStop: 0.045, radius: 142, particles: 26 });
        this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 3.2 * power);
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 3.2 * power);
        this.chainLightning(this.player.position, (20 + this.lightningJumps * 2) * power);
        this.fireComboFan(4 + Math.min(5, this.currentRicochetBounces()), 12 * power, {
          lightning: true,
          ricochet: true,
          color: "#e5ff66",
        });
        this.addVoiceComboBurst("#e5ff66", "#fff06a", 46);
        this.say(`组合咒语：${combo.name}！弹出去的每一下都带电。`);
        break;
      }
      case "scatterRicochet": {
        this.playSpellImpact({ glyph: "散", glyphCount: 3, glyphSize: 50, color: "#8ee8ff", shake: 4, flash: 0.08, radius: 108, particles: 12 });
        this.activeMods.splitTime = Math.max(this.activeMods.splitTime, 3.6 * power);
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 3.6 * power);
        this.fireComboFan(8 + this.splitExtraPairs * 2, (9 + this.splitDamageBonus) * power, {
          ricochet: true,
          color: "#8ee8ff",
        });
        this.addVoiceComboBurst("#8ee8ff", "#fff06a", 48);
        this.say(`组合咒语：${combo.name}！散开以后继续跳。`);
        break;
      }
      case "pierceRicochet": {
        this.playZoomPunch(0.026, 0.18);
        this.addImpactLines(this.player.position, "#ffffff", 10, 128);
        this.playSpellImpact({ glyph: "穿", glyphSize: 122, color: "#ffffff", shake: 6, flash: 0.12, hitStop: 0.035, radius: 118, particles: 14 });
        this.activeMods.pierceTime = Math.max(this.activeMods.pierceTime, 3.6 * power);
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 3.2 * power);
        this.fireComboFan(6, (14 + this.attackDamage * 0.6) * power, {
          pierce: 3 + this.ricochetPierceBonus,
          ricochet: true,
          color: "#ffffff",
        });
        this.addVoiceComboBurst("#ffffff", "#fff06a", 44);
        this.say(`组合咒语：${combo.name}！穿过去，还会折回来。`);
        break;
      }
      case "bloomRicochet": {
        this.playSlowMo(0.45, 0.22);
        this.playZoomPunch(0.038, 0.22);
        this.addImpactLines(this.player.position, "#ff9b4a", 16, 158);
        this.playSpellImpact({ glyph: "爆", glyphCount: 5, glyphSize: 58, color: "#ff9b4a", shake: 9, flash: 0.2, hitStop: 0.045, radius: 144, particles: 22 });
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, 3.4 * power);
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 3.4 * power);
        for (const enemy of this.nearbyEnemies(this.player.position, this.ricochetRange + 180, 5)) {
          this.explode(enemy.position, this.explosionRadius * 0.85, (13 + this.attackDamage * 0.7) * power, false);
          this.addParticle(this.player.position, enemy.position, "#ffcf5a");
        }
        this.addVoiceComboBurst("#ff9b4a", "#fff06a", 50);
        this.say(`组合咒语：${combo.name}！跳到哪，花开到哪。`);
        break;
      }
      case "frostBlades": {
        const hasBlades = this.bladeCount > 0;
        if (hasBlades) {
          this.playSpellImpact({ glyph: "冰", glyphCount: Math.min(6, this.bladeCount + 1), glyphSize: 52, color: "#9be7ff", shake: 6, flash: 0.13, hitStop: 0.025, radius: 126, particles: 18 });
          this.addFrostShards(this.player.position, 8 + this.bladeCount, this.bladeRadius + 68, "#bdf2ff", 0.32);
        }
        this.freezeAround(this.player.position, this.bladeRadius + (hasBlades ? 92 : 54), this.freezeDuration * power);
        if (hasBlades) {
          this.fireComboFan(this.bladeCount + 2, (8 + this.bladeDamage) * power, {
            freeze: true,
            pierce: 1,
            color: "#9be7ff",
          });
        }
        this.addVoiceComboBurst("#9be7ff", "#ffffff", hasBlades ? 44 : 28);
        this.say(hasBlades ? `组合咒语：${combo.name}！刀圈挂霜。` : "冰刀护身接上了；抽到旋转刀刃后会更离谱。");
        break;
      }
      case "boomBlades": {
        const hasBlades = this.bladeCount > 0;
        if (hasBlades) {
          this.playSlowMo(0.48, 0.2);
          this.playZoomPunch(0.032, 0.2);
          this.addImpactLines(this.player.position, "#ff9b4a", 14, 144);
          this.playSpellImpact({ glyph: "爆", glyphCount: Math.min(5, this.bladeCount + 1), glyphSize: 54, color: "#ff9b4a", shake: 8, flash: 0.16, hitStop: 0.04, radius: 132, particles: 18 });
        }
        this.explode(this.player.position, this.bladeRadius + (hasBlades ? 104 : 58), (12 + this.bladeDamage) * power, false);
        if (hasBlades) {
          this.fireComboFan(this.bladeCount + 3, (10 + this.bladeDamage) * power, {
            explosion: true,
            ricochet: this.activeMods.ricochetTime > 0,
            color: "#ff9b4a",
          });
        }
        this.addVoiceComboBurst("#ff9b4a", "#ffffff", hasBlades ? 46 : 30);
        this.say(hasBlades ? `组合咒语：${combo.name}！刀盘也会爆。` : "爆裂刀盘接上了；抽到旋转刀刃后反馈会更强。");
        break;
      }
      case "cannonBloom": {
        this.playSlowMo(0.34, 0.28);
        this.playZoomPunch(0.052, 0.26);
        this.addImpactLines(this.player.position, "#ffe27a", 22, 196);
        this.playSpellImpact({ glyph: "炮", glyphCount: 6, glyphSize: 64, color: "#ffe27a", shake: 12, flash: 0.24, hitStop: 0.06, radius: 166, particles: 26 });
        const charge = Math.max(1, this.cannonLaunchCharge);
        this.cannonBouncesLeft += 1 + Math.floor(power);
        this.cannonDamage += 18 * power;
        this.fireComboFan(6 + charge * 3, (12 + charge * 7) * power, {
          explosion: this.activeMods.explosionTime > 0,
          freeze: this.activeMods.freezeTime > 0,
          lightning: this.activeMods.lightningTime > 0,
          ricochet: true,
          color: "#ffe27a",
        });
        this.addVoiceComboBurst("#ffe27a", "#ff9b4a", 62);
        this.say(`组合咒语：${combo.name}！人先飞，弹片再开花。`);
        break;
      }
      default:
        break;
    }
    this.renderCommandDock();
  }

  private nearbyEnemies(position: Vec2, radius: number, count: number): Enemy[] {
    return [...this.enemies]
      .filter((enemy) => enemy.hp > 0 && distance(enemy.position, position) <= radius)
      .sort((a, b) => distance(a.position, position) - distance(b.position, position))
      .slice(0, count);
  }

  private fireComboFan(
    count: number,
    damage: number,
    options: { explosion?: boolean; freeze?: boolean; lightning?: boolean; ricochet?: boolean; pierce?: number; color: string },
  ): void {
    const target = this.nearestEnemy(this.player.position, Infinity)?.position ?? {
      x: this.player.position.x + Math.cos(this.elapsed) * 120,
      y: this.player.position.y + Math.sin(this.elapsed) * 120,
    };
    const baseAngle = Math.atan2(target.y - this.player.position.y, target.x - this.player.position.x);
    const spread = Math.min(Math.PI * 1.45, 0.22 * Math.max(1, count - 1));
    for (let i = 0; i < count; i += 1) {
      const ratio = count <= 1 ? 0.5 : i / (count - 1);
      const angle = baseAngle - spread / 2 + spread * ratio;
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...this.player.position },
        velocity: { x: Math.cos(angle) * (this.projectileSpeed + 70), y: Math.sin(angle) * (this.projectileSpeed + 70) },
        radius: 5.2,
        damage,
        life: 1.05,
        pierce: options.pierce ?? 0,
        ricochet: options.ricochet ? Math.max(1, this.currentRicochetBounces()) : 0,
        hitIds: [],
        explosion: Boolean(options.explosion),
        freeze: Boolean(options.freeze),
        lightning: Boolean(options.lightning),
      });
      this.nextProjectileId += 1;
      this.addParticle(this.player.position, {
        x: this.player.position.x + Math.cos(angle) * 120,
        y: this.player.position.y + Math.sin(angle) * 120,
      }, options.color);
    }
  }

  private addVoiceComboBurst(colorA: string, colorB: string, count: number): void {
    this.addBurst(this.player.position, colorA, Math.ceil(count * 0.55));
    this.addBurst(this.player.position, colorB, Math.ceil(count * 0.45));
    for (const enemy of this.nearbyEnemies(this.player.position, 520, 6)) {
      this.addParticle(this.player.position, enemy.position, colorA);
    }
  }

  private castSpell(spell: SpellKey): boolean {
    if (!this.running || this.paused || this.selectingBuff || this.gameOver) return false;
    if (this.isHiddenComboSpell(spell)) {
      return this.castHiddenCombo(spell);
    }
    if (!this.unlockedSpells.has(spell) && !["cannonPrep", "cannonFire", "cannon"].includes(spell)) {
      this.say(`${SPELL_NAMES[spell]}还没抽到，先升级找它。`);
      return false;
    }

    if (spell === "cannonPrep") {
      return this.prepareCannon();
    }
    if (spell === "cannon") {
      return this.lockCannonTarget();
    }
    if (spell === "cannonFire") {
      return this.fireCannon();
    }

    const fatigue = this.spellFatigueMultiplier(spell);
    const silenceCost = this.isPlayerSilenced() ? 1.6 : 1;
    const isFreeCast = this.nextSpellFree && !this.isHiddenComboSpell(spell);
    const cost = isFreeCast ? 0 : Math.round(SPELL_COSTS[spell] * (1 + (1 - fatigue) * 1.1) * silenceCost);
    if (this.energy < cost) {
      this.say(`${SPELL_NAMES[spell]}声能不够，还差 ${cost - Math.floor(this.energy)}。`);
      this.pulseEnergyDenied();
      return false;
    }
    this.energy -= cost;
    if (isFreeCast) this.nextSpellFree = false;
    this.recordSpell(spell);

    const power = fatigue * this.diversityBonus();
    switch (spell) {
      case "explode":
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, (8.5 + this.explosionDurationBonus) * power);
        if (this.recentChainIncludes("freeze")) this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 4.5 * power);
        this.explode(this.player.position, this.explosionRadius * 0.55, this.attackDamage * this.explosionDamageScale * power, false);
        this.addBurst(this.player.position, "#ff9b4a", 30);
        this.playSlowMo(0.58, 0.18);
        this.playZoomPunch(0.026, 0.18);
        this.addImpactLines(this.player.position, "#ff9b4a", 12, 132);
        this.playSpellImpact({ glyph: "爆", glyphCount: 5, glyphSize: 58, color: "#ff9b4a", shake: 7, flash: 0.18, hitStop: 0.035, radius: 116, particles: 18 });
        this.say(`爆炸 Buff 开启 ${Math.ceil(this.activeMods.explosionTime)} 秒，记得续。`);
        break;
      case "freeze":
        this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 8 * power);
        this.freezeAround(this.player.position, this.freezePulseRadius, this.freezeDuration * power);
        this.playSlowMo(0.62, 0.16);
        this.playZoomPunch(0.018, 0.16);
        this.playSpellImpact({ glyph: "冻", glyphCount: 5, glyphSize: 54, color: "#9be7ff", shake: 4.5, flash: 0.12, hitStop: 0.025, radius: 126, particles: 16 });
        this.say(`冻结 Buff 开启 ${Math.ceil(this.activeMods.freezeTime)} 秒。`);
        break;
      case "lightning":
        this.chainLightning(this.player.position, 10 * power);
        this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 7 * power);
        this.addBurst(this.player.position, "#e5ff66", 34);
        this.playSlowMo(0.52, 0.18);
        this.playZoomPunch(0.034, 0.2);
        this.addImpactLines(this.player.position, "#e5ff66", 14, 144);
        this.playSpellImpact({ glyph: "雷", glyphCount: 5, glyphSize: 66, color: "#e5ff66", shake: 7, flash: 0.2, hitStop: 0.04, radius: 132, particles: 24 });
        this.say(`雷电 Buff 开启 ${Math.ceil(this.activeMods.lightningTime)} 秒。`);
        break;
      case "split":
        this.activeMods.splitTime = Math.max(this.activeMods.splitTime, (8.5 + this.splitDurationBonus) * power);
        this.addBurst(this.player.position, "#8ee8ff", 24);
        this.addSpellFan(this.aimAngleToPrimaryTarget(), this.splitAngle + this.splitExtraPairs * 0.18, 3 + this.splitExtraPairs * 2, 190, "#8ee8ff", "多路弹幕");
        this.say(`分裂 Buff 开启 ${Math.ceil(this.activeMods.splitTime)} 秒，接下来自动攻击会变多路。`);
        break;
      case "pierce":
        this.activeMods.pierceTime = Math.max(this.activeMods.pierceTime, 8 * power);
        this.addBurst(this.player.position, "#ffffff", 20);
        this.addSpellRing(this.player.position, 150, "#e9fbff", "穿透弹");
        this.say(`穿透 Buff 开启 ${Math.ceil(this.activeMods.pierceTime)} 秒，接下来子弹会穿怪。`);
        break;
      case "ricochet":
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 8 * power);
        if (this.recentChainIncludes("lightning")) this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 3.5 * power);
        this.addBurst(this.player.position, "#fff06a", 24);
        this.addSpellRing(this.player.position, this.ricochetRange * 0.62, "#ffcf5a", "跳弹范围");
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
        this.addSpellRing(this.player.position, 76, "#66e0ff", "护盾");
        this.say("护盾展开。");
        break;
      case "gather":
      case "wealth":
        {
          const radius = spell === "wealth" ? 520 : 300;
          const pulled = this.gatherDrops(radius);
          const label = spell === "wealth" ? "来财" : "聚拢";
          this.addSpellRing(this.player.position, radius * 0.42, "#7cff9b", pulled > 0 ? `${label} x${pulled}` : `${label}空场`);
          this.say(
            pulled > 0
              ? (spell === "wealth" ? `来财，${pulled} 个掉落物正在靠近。` : `聚拢资源，${pulled} 个掉落物正在靠近。`)
              : (spell === "wealth" ? "来财已展开：附近暂无掉落物，先存住这次吸附节奏。" : "聚拢已展开：附近暂无掉落物。"),
          );
        }
        this.addBurst(this.player.position, "#7cff9b", spell === "wealth" ? 24 : 16);
        break;
      case "focus":
        this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 6 * power);
        this.addBurst(this.player.position, "#8ee8ff", 14);
        this.addSpellRing(this.player.position, 130, "#8ee8ff", "锁定");
        this.say("自动攻击开始盯重点目标。");
        break;
      case "bang":
        this.castBangKeyword(power);
        break;
      case "skillGo":
        this.triggerFunSpellImpact("技能五子棋", "棋阵落位", "#f8f1d1", "#8ee8ff");
        this.castSkillGo();
        break;
      case "xiexiu":
        this.triggerFunSpellImpact("邪修", "野路子启动", "#d28cff", "#ff4f6d");
        this.castXiexiu();
        break;
      case "serious":
        this.castSeriousCase(power);
        break;
      case "cardCheck":
        this.castCardCheck(power);
        break;
      case "woqu":
        this.shortSafeStep(92);
        this.player.invuln = Math.max(this.player.invuln, 0.35);
        this.addPlayerAfterimage(this.player.position, "#9cffd0", this.effectivePlayerRadius() + 4, 0.32, undefined, 1.38);
        this.addSpellGlyph(this.player.position, "我去！", "#9cffd0", 44, 0.56);
        this.addSpellRing(this.player.position, 92, "#9cffd0", "我去");
        this.say("我去：先闪开半步。");
        break;
      case "tooLate":
        this.refundRecentSpell(0.36);
        this.addSpellCard(this.player.position, "退单", "#7cff9b", 58, 0, 0.64, "#f8f1d1");
        this.addSpellRing(this.player.position, 100, "#7cff9b", "不早说");
        this.say("不早说：返还上一句咒语的一点声能。");
        break;
      case "noTalk":
        this.interruptEnemies(3, 170);
        this.clearEnemyShotsNear(this.player.position, 190);
        this.addSpellRing(this.player.position, 130, "#e9fbff", "不讲");
        this.say("不讲：打断附近正在起手的敌人。");
        break;
      case "urgentCry":
        this.castUrgentCry(power);
        break;
      case "received":
        this.castReceivedKeyword(power);
        break;
      case "unknown":
        this.player.invuln = Math.max(this.player.invuln, 0.42);
        this.clearEnemyShotsNear(this.player.position, 120);
        for (const enemy of this.nearbyEnemies(this.player.position, 260, 5)) {
          enemy.windup = 0;
          enemy.cooldown = Math.max(enemy.cooldown, 0.9);
          this.addSpellGlyph(enemy.position, "?", "#d28cff", 34, 0.48);
        }
        this.addPlayerAfterimage(this.player.position, "#d28cff", this.effectivePlayerRadius() + 5, 0.34, undefined, 1.46);
        this.addSpellRing(this.player.position, 94, "#d28cff", "不知道");
        this.say("不知道：敌人短暂丢失节奏。");
        break;
      case "bodyShape":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 4 * power);
        this.addSpellRing(this.player.position, this.player.radius + 28, "#d28cff", "看起来");
        this.addSpellRing(this.player.position, this.effectivePlayerRadius() + 10, "#9cffd0", "实际");
        this.addSpellRing(this.player.position, 82, "#d28cff", "身材");
        this.say("身材：受击判定短暂变窄。");
        break;
      case "graceful":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 2.5 * power);
        this.activeMods.gracefulTime = Math.max(this.activeMods.gracefulTime, 2.2 * power);
        this.shortSafeStep(78);
        this.addSpellGlyph(this.player.position, "曼妙", "#9cffd0", 52, 0.64);
        this.addImpactLines(this.player.position, "#9cffd0", 6, 96, 0.24);
        this.addSpellRing(this.player.position, 98, "#9cffd0", "曼妙");
        this.say("曼妙：擦弹会回声能。");
        break;
      case "internalDrain":
        this.castInternalDrain(power);
        break;
      case "externalDrain":
        this.addPunchSpellGlyph({ x: this.player.position.x - 34, y: this.player.position.y }, "外", "#ffcf5a", 58, { x: -1, y: 0 }, 0, 0.58, 92, 2);
        this.addPunchSpellGlyph({ x: this.player.position.x + 34, y: this.player.position.y }, "耗", "#ffcf5a", 58, { x: 1, y: 0 }, 0.12, 0.58, 92, 2);
        this.knockEnemiesFrom(this.player.position, 250, 46);
        this.addImpactLines(this.player.position, "#ffcf5a", 10, 154, 0.26);
        this.addSpellRing(this.player.position, 150, "#c491ff", "外耗");
        this.say("外耗：把压力推回怪群。");
        break;
      case "oldSelf":
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8 * power);
        this.player.shield = Math.min(70, this.player.shield + 8 * power);
        this.addSpellCard(this.player.position, "爱你老己", "#f8f1d1", 64, 0, 0.72, "#7cff9b");
        this.addParticle({ x: this.player.position.x - 48, y: this.player.position.y - 24 }, this.player.position, "#7cff9b");
        this.addSpellRing(this.player.position, 92, "#f8f1d1", "老己");
        this.say("老己：先爱自己一口。");
        break;
      case "seeTomorrow":
        this.delayedHealTime = 2.2;
        this.delayedHealAmount = Math.max(this.delayedHealAmount, 12 * power);
        this.addSpellCard(this.player.position, "明天回信", "#f8f1d1", 66, 0, 0.78, "#7cff9b");
        this.addParticle(this.player.position, { x: this.player.position.x + 86, y: this.player.position.y - 52 }, "#f8f1d1");
        this.addSpellRing(this.player.position, 106, "#f8f1d1", "明天见");
        this.say("明天见：延迟回复已寄出。");
        break;
      default:
        break;
    }
    this.renderCommandDock();
    return true;
  }

  private isHiddenComboSpell(spell: SpellKey): boolean {
    return (SPELL_CONFIG[spell] as SpellConfig).hidden === true;
  }

  private comboFragments(spell: SpellKey): SpellKey[] {
    return ((SPELL_CONFIG[spell] as SpellConfig).fragments ?? []) as SpellKey[];
  }

  private castHiddenCombo(spell: SpellKey): boolean {
    const fragments = this.comboFragments(spell);
    const missing = fragments.filter((fragment) => !this.unlockedSpells.has(fragment));
    if (missing.length > 0) {
      this.say(`隐藏 Combo「${SPELL_NAMES[spell]}」还差碎片：${missing.map((fragment) => SPELL_NAMES[fragment]).join("、")}。`);
      return false;
    }
    const cost = this.currentSpellCost(spell);
    if (this.energy < cost) {
      this.say(`隐藏 Combo「${SPELL_NAMES[spell]}」声能不够，还差 ${cost - Math.floor(this.energy)}。`);
      this.pulseEnergyDenied();
      return false;
    }

    const fatigue = this.spellFatigueMultiplier(spell);
    const power = fatigue * (1 + fragments.length * 0.22 + Math.min(0.35, this.level * 0.02));
    this.energy -= cost;
    this.recordSpell(spell);
    if (spell !== "comboExternalize") {
      this.triggerFunComboImpact(spell, power);
    }

    switch (spell) {
      case "comboBangFull":
        this.playSlowMo(0.42, 0.24);
        this.playZoomPunch(0.038, 0.22);
        this.addImpactLines(this.player.position, "#ffcf5a", 18, 172);
        this.playHiddenComboImpact(SPELL_NAMES[spell], "#ffcf5a", { glyph: "梆", glyphCount: 5, glyphSize: 58, radius: 138, particles: 30 });
        this.castBangFullCombo(power);
        break;
      case "comboBangTwoFists":
        this.playSlowMo(0.34, 0.2);
        this.playZoomPunch(0.052, 0.24);
        this.addImpactLines(this.player.position, "#ffe27a", 14, 142);
        this.playHiddenComboImpact(SPELL_NAMES[spell], "#ffe27a", { glyph: "拳", glyphSize: 148, shake: 12, flash: 0.24, radius: 118, particles: 26 });
        this.castBangTwoFists(power);
        break;
      case "comboCardCheck":
        this.playHiddenComboImpact(SPELL_NAMES[spell], "#f8f1d1", { glyph: "验", glyphCount: 4, glyphSize: 58, shake: 8, flash: 0.16, radius: 128, particles: 22 });
        this.castCardCheckCombo(power);
        break;
      case "comboTooLate":
        this.castTooLateCombo(power);
        break;
      case "comboNoTalk":
        this.castNoTalkCombo(power);
        break;
      case "comboReceived":
        this.playHiddenComboImpact(SPELL_NAMES[spell], "#7cff9b", { glyph: "收", glyphCount: 3, glyphSize: 60, shake: 6, flash: 0.12, radius: 116, particles: 18 });
        this.castReceivedCombo(power);
        break;
      case "comboGracefulBody":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 8 * power);
        this.activeMods.gracefulTime = Math.max(this.activeMods.gracefulTime, 8 * power);
        this.player.invuln = Math.max(this.player.invuln, 0.7);
        this.clearEnemyShotsNear(this.player.position, 160);
        this.gracefulConfidence = Math.max(this.gracefulConfidence, 1);
        this.energy = clamp(this.energy + 18 * power, 0, this.maxEnergy);
        this.addSpellRing(this.player.position, 260, "#d28cff", "曼妙判定");
        this.say("隐藏 Combo：不知道，我的身材很曼妙。擦弹会攒自信光环。");
        break;
      case "comboExternalize":
        this.castExternalizeCombo(power);
        break;
      case "comboSeeTomorrow":
        this.castSeeTomorrowInsurance(power);
        break;
      default:
        break;
    }
    this.renderCommandDock();
    return true;
  }

  private fireRadialProjectiles(
    count: number,
    damage: number,
    speed: number,
    life: number,
    options: Partial<Pick<Projectile, "pierce" | "ricochet" | "explosion" | "freeze" | "lightning" | "radius">> = {},
  ): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.elapsed * 0.45;
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...this.player.position },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: options.radius ?? 5,
        damage,
        life,
        pierce: options.pierce ?? 0,
        ricochet: options.ricochet ?? 0,
        hitIds: [],
        explosion: options.explosion ?? false,
        freeze: options.freeze ?? false,
        lightning: options.lightning ?? false,
      });
      this.nextProjectileId += 1;
    }
  }

  private triggerFunComboImpact(spell: SpellKey, power: number): void {
    const theme = this.funComboTheme(spell);
    const fragments = Math.max(1, this.comboFragments(spell).length);
    const radius = 300 + fragments * 58 + Math.min(90, this.level * 4);
    this.comboFlash = {
      label: theme.label,
      sublabel: theme.sublabel,
      color: theme.color,
      accent: theme.accent,
      life: 1.05,
      maxLife: 1.05,
    };
    this.screenShake = Math.max(this.screenShake, 0.46 + fragments * 0.06);
    this.screenShakePower = Math.max(this.screenShakePower, 12 + fragments * 4);
    this.flashScreen(theme.color, 0.18, 0.16);
    this.playSlowMo(0.42, 0.18 + fragments * 0.02);
    this.playZoomPunch(0.038 + fragments * 0.006, 0.22);
    this.addImpactLines(this.player.position, theme.color, 18 + fragments * 4, radius * 0.72, 0.34);
    this.addSpellRing(this.player.position, radius, theme.color, theme.label, 1.05);
    this.addSpellRing(this.player.position, radius * 0.58, theme.accent, theme.sublabel, 0.78);
    const glyphLabel = spell === "comboGracefulBody" ? theme.label : theme.label.slice(0, 4);
    const glyphSize = spell === "comboGracefulBody" ? 58 : 74 + fragments * 12;
    this.addSpellGlyph(this.player.position, glyphLabel, theme.color, glyphSize, 0.72);
    this.addBurst(this.player.position, theme.color, 48 + fragments * 16);
    this.addBurst(this.player.position, theme.accent, 32 + fragments * 10);
    this.addComboRays(this.player.position, theme.color, 18 + fragments * 5, radius * 1.02);
    this.applyFunComboShockwave(radius * 0.78, power, theme);
  }

  private triggerFunSpellImpact(label: string, sublabel: string, color: string, accent: string): void {
    this.comboFlash = {
      label,
      sublabel,
      color,
      accent,
      life: 0.72,
      maxLife: 0.72,
    };
    this.screenShake = Math.max(this.screenShake, 0.3);
    this.screenShakePower = Math.max(this.screenShakePower, 7);
    this.flashScreen(color, 0.14, 0.1);
    this.playZoomPunch(0.028, 0.18);
    this.addImpactLines(this.player.position, color, 12, 154, 0.28);
    this.addSpellRing(this.player.position, 230, color, label, 0.82);
    this.addSpellGlyph(this.player.position, label.slice(0, 4), color, 62, 0.58);
    this.addBurst(this.player.position, color, 30);
    this.addBurst(this.player.position, accent, 18);
    this.addComboRays(this.player.position, accent, 13, 240);
  }

  private funComboTheme(spell: SpellKey): { label: string; sublabel: string; color: string; accent: string } {
    const themes: Partial<Record<SpellKey, { label: string; sublabel: string; color: string; accent: string }>> = {
      comboBangFull: { label: "梆梆不梆梆", sublabel: "连梆开路", color: "#ffcf5a", accent: "#fff1a6" },
      comboBangTwoFists: { label: "梆梆两拳", sublabel: "点名重拳", color: "#ffe27a", accent: "#ff9b4a" },
      comboCardCheck: { label: "我要验牌", sublabel: "全场翻牌", color: "#f8f1d1", accent: "#ff4f6d" },
      comboTooLate: { label: "我去不早说", sublabel: "状态回溯", color: "#9cffd0", accent: "#7cff9b" },
      comboNoTalk: { label: "不讲不讲", sublabel: "拒绝沟通", color: "#e9fbff", accent: "#66e0ff" },
      comboReceived: { label: "收到，收到", sublabel: "复读爆发", color: "#7cff9b", accent: "#e9fbff" },
      comboGracefulBody: { label: "身材很曼妙", sublabel: "判定缩小", color: "#d28cff", accent: "#9cffd0" },
      comboExternalize: { label: "与其内耗，不如外耗", sublabel: "压力转嫁", color: "#c491ff", accent: "#ffcf5a" },
      comboSeeTomorrow: { label: "爱你老己，明天见", sublabel: "今晚不死", color: "#f8f1d1", accent: "#7cff9b" },
    };
    return themes[spell] ?? { label: SPELL_NAMES[spell], sublabel: "完整梗 Combo", color: "#ffe27a", accent: "#8ee8ff" };
  }

  private addComboRays(position: Vec2, color: string, count: number, radius: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.elapsed * 0.35;
      const start = {
        x: position.x + Math.cos(angle) * 34,
        y: position.y + Math.sin(angle) * 34,
      };
      const end = {
        x: position.x + Math.cos(angle) * radius,
        y: position.y + Math.sin(angle) * radius,
      };
      this.addParticle(start, end, color);
    }
  }

  private applyFunComboShockwave(radius: number, power: number, theme: { color: string; accent: string }): void {
    for (const enemy of this.enemies) {
      const dist = distance(enemy.position, this.player.position);
      if (enemy.hp <= 0 || dist > radius) continue;
      const falloff = 1 - dist / radius;
      const damage = (18 + this.attackDamage * 0.85) * power * (0.5 + falloff);
      this.damageEnemy(enemy, damage, "bang");
      this.knockEnemyAway(enemy, this.player.position, 32 + falloff * 46);
      if (Math.random() < 0.55 + falloff * 0.35) {
        this.addBurst(enemy.position, falloff > 0.55 ? theme.accent : theme.color, 8 + Math.floor(falloff * 10));
      }
    }
    this.energy = clamp(this.energy + 8 * power, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 10 * power, 0, 100);
    this.clearEnemyShotsNear(this.player.position, radius * 0.9);
  }

  private freezePriorityTargets(count: number, duration: number): void {
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))
      .slice(0, count);
    for (const enemy of targets) {
      enemy.frozen = Math.max(enemy.frozen, duration);
      this.addBurst(enemy.position, "#9be7ff", 8);
    }
  }

  private knockEnemiesFrom(origin: Vec2, radius: number, amount: number): void {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, origin) > radius) continue;
      this.knockEnemyAway(enemy, origin, amount);
      this.damageEnemy(enemy, amount * 0.12, "evade");
    }
  }

  private extendCombatMods(duration: number): void {
    this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, this.activeMods.explosionTime + duration);
    this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, this.activeMods.freezeTime + duration * 0.72);
    this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, this.activeMods.lightningTime + duration * 0.72);
    this.activeMods.splitTime = Math.max(this.activeMods.splitTime, this.activeMods.splitTime + duration);
    this.activeMods.pierceTime = Math.max(this.activeMods.pierceTime, this.activeMods.pierceTime + duration * 0.82);
    this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, this.activeMods.ricochetTime + duration * 0.82);
  }

  private shortSafeStep(distanceBoost: number): void {
    const safe = this.safeDirection();
    const from = { ...this.player.position };
    const dashAngle = Math.atan2(safe.y, safe.x);
    this.addPlayerAfterimage(from, "#9cffd0", this.effectivePlayerRadius(), 0.22, dashAngle, 1.34);
    this.player.position.x = clamp(this.player.position.x + safe.x * distanceBoost, this.player.radius, this.width - this.player.radius);
    this.player.position.y = clamp(this.player.position.y + safe.y * distanceBoost, this.player.radius, this.playerMaxY(this.player.radius));
    this.player.invuln = Math.max(this.player.invuln, 0.35);
    this.addPlayerAfterimage(this.player.position, "#9cffd0", this.effectivePlayerRadius(), 0.16, dashAngle, 1.18);
    this.addBurst(this.player.position, "#9cffd0", 12);
  }

  private recordPlayerSnapshot(): void {
    const last = this.playerHistory[this.playerHistory.length - 1];
    if (last && this.elapsed - last.time < 0.12) return;
    this.playerHistory.push({
      time: this.elapsed,
      position: { ...this.player.position },
      hp: this.player.hp,
    });
    const cutoff = this.elapsed - 4.5;
    while (this.playerHistory.length > 0 && this.playerHistory[0].time < cutoff) {
      this.playerHistory.shift();
    }
  }

  private releaseGracefulConfidence(): void {
    const stacks = this.gracefulConfidence;
    if (stacks <= 0) return;
    this.gracefulConfidence = 0;
    const count = 12 + Math.floor(stacks * 8);
    const damage = (18 + this.attackDamage * 0.82) * (1 + stacks * 0.22);
    this.fireRadialProjectiles(count, damage, 500, 0.8, {
      radius: 4,
      pierce: 1,
      ricochet: this.activeMods.ricochetTime > 0 ? 1 : 0,
      freeze: this.activeMods.freezeTime > 0,
      explosion: this.activeMods.explosionTime > 0,
    });
    this.addBurst(this.player.position, "#d28cff", 28);
    this.addSpellRing(this.player.position, 210, "#d28cff", "自信光环");
    this.say("曼妙判定结束：擦弹攒出的自信光环爆开。");
  }

  private castBangKeyword(power: number): void {
    this.bangBang(power * 0.82);
  }

  private castCardCheck(power: number): void {
    const target = this.focusedTarget() ?? [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))[0];
    if (!target) {
      this.energy = clamp(this.energy + 5, 0, this.maxEnergy);
      this.addSpellRing(this.player.position, 96, "#f8f1d1", "空牌");
      this.say("验牌：场上没牌，返还一点声能。");
      return;
    }
    this.markedEnemyId = target.id;
    this.cardMarkTime = Math.max(this.cardMarkTime, 4.8 * power);
    target.frozen = Math.max(target.frozen, 0.18);
    this.addParticle(this.player.position, target.position, "#f8f1d1");
    this.addSpellRing(target.position, 68, "#ff4f6d", "验");
    this.say(`验牌：${ENEMY_CONFIG[target.type].label} 被标记，短时间更脆。`);
  }

  private refundRecentSpell(ratio: number): void {
    const spell = this.repeatableSpellChain[this.repeatableSpellChain.length - 1];
    if (!spell) {
      this.energy = clamp(this.energy + 6, 0, this.maxEnergy);
      this.say("不早说：还没有可追溯的普通咒语，先返一点声能。");
      return;
    }
    const refund = Math.max(5, Math.round(SPELL_COSTS[spell] * ratio));
    this.energy = clamp(this.energy + refund, 0, this.maxEnergy);
    this.addSpellRing(this.player.position, 104, "#7cff9b", `退 ${refund}`);
    this.say(`不早说：返还上一句 ${SPELL_NAMES[spell]} 的 ${refund} 声能。`);
  }

  private interruptEnemies(count: number, radius: number): number {
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0 && distance(enemy.position, this.player.position) <= radius)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))
      .slice(0, count);
    for (const enemy of targets) {
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 1.15);
      enemy.frozen = Math.max(enemy.frozen, 0.12);
      this.addBurst(enemy.position, "#e9fbff", 6);
    }
    return targets.length;
  }

  private castUrgentCry(power: number): void {
    const center = { ...this.player.position };
    const missingHpRatio = 1 - this.player.hp / this.player.maxHp;
    const enemyCount = this.enemies.filter((enemy) => enemy.hp > 0 && distance(enemy.position, center) <= 420).length;
    const shotCount = this.enemyShots.filter((shot) => distance(shot.position, center) <= 460).length;
    const pressureIndex = enemyCount + Math.ceil(shotCount * 0.55) + Math.ceil(missingHpRatio * 8);
    const radius = 330 + Math.min(110, pressureIndex * 6);
    const affectedIds: number[] = [];
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, center) > radius) continue;
      affectedIds.push(enemy.id);
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 0.85);
      enemy.frozen = Math.max(enemy.frozen, 0.34);
    }
    this.playSlowMo(0.16, 0.58);
    this.playZoomPunch(0.036, 0.34);
    this.flashScreen("#ff4f6d", 0.2, 0.12);
    this.shakeScreen(7 + Math.min(8, pressureIndex * 0.45), 0.26);
    this.addSpellGlyph(center, "绷", "#ff4f6d", 128, 1.12);
    this.addSpellRing(center, 138 + Math.min(70, pressureIndex * 5), "#ff4f6d", "憋住", 1.02);
    this.addImpactLines(center, "#ff4f6d", 12 + Math.min(12, pressureIndex), 164, 0.46);
    this.pendingUrgentCryEvents.push(
      { time: 0.82, phase: "break", center, radius, power, pressureIndex, affectedIds, shotCount, missingHpRatio },
      { time: 1.62, phase: "complaints", center, radius, power, pressureIndex, affectedIds, shotCount, missingHpRatio },
      { time: 2.38, phase: "finale", center, radius, power, pressureIndex, affectedIds, shotCount, missingHpRatio },
    );
    this.player.invuln = Math.max(this.player.invuln, 0.72);
    this.say(`你已急哭：绷住，急哭指数 ${pressureIndex}。`);
  }

  private castSeeTomorrowInsurance(power: number): void {
    const duration = 24 + Math.min(10, this.level * 0.8) + Math.min(8, power * 2.6);
    this.fatalInsuranceTime = Math.max(this.fatalInsuranceTime, duration);
    this.fatalInsuranceMaxTime = Math.max(this.fatalInsuranceMaxTime, this.fatalInsuranceTime);
    this.player.shield = Math.min(95, this.player.shield + 14 * power);
    this.player.invuln = Math.max(this.player.invuln, 0.45);
    this.playSlowMo(0.34, 0.2);
    this.playZoomPunch(0.03, 0.2);
    this.flashScreen("#f8f1d1", 0.14, 0.12);
    this.addSpellCard(this.player.position, "保险单", "#f8f1d1", 110, 0, 1.05, "#7cff9b");
    this.addSlamSpellGlyph(this.player.position, "爱你老己", "#f8f1d1", 74, 0.26, 0.76, 2.1, 0.92);
    this.addSpellGlyph({ x: this.player.position.x, y: this.player.position.y + 48 }, "明天见", "#7cff9b", 56, 0.86);
    this.addSpellRing(this.player.position, 190, "#f8f1d1", "明天见保险", 0.96);
    this.addImpactLines(this.player.position, "#7cff9b", 10, 142, 0.28);
    this.addBurst(this.player.position, "#f8f1d1", 22);
    this.say(`隐藏 Combo：爱你老己，明天见。保险单已签，${Math.ceil(duration)} 秒内致命伤留到明天处理。`);
  }

  private expireTomorrowInsurance(): void {
    this.fatalInsuranceMaxTime = 0;
    const refund = 14 + Math.min(12, this.level * 0.8);
    this.energy = clamp(this.energy + refund, 0, this.maxEnergy);
    this.player.shield = Math.min(95, this.player.shield + 10);
    this.addSpellCard(this.player.position, "未出险", "#f8f1d1", 76, 0, 0.72, "#7cff9b");
    this.addSpellRing(this.player.position, 124, "#7cff9b", `退 ${Math.round(refund)}`);
    this.say("明天见保险到期：本晚平安，返还声能。");
  }

  private triggerTomorrowInsurance(): void {
    const center = { ...this.player.position };
    const nearby = this.enemies.filter((enemy) => enemy.hp > 0 && distance(enemy.position, center) <= 420).length;
    const heal = Math.max(36, this.player.maxHp * (0.38 + Math.min(0.12, nearby * 0.01)));
    const shield = 42 + Math.min(28, nearby * 2.2);
    const radius = 330 + Math.min(120, nearby * 10);
    const damage = (34 + this.attackDamage * 1.05 + nearby * 1.8) * (1 + Math.min(0.45, this.level * 0.025));

    this.fatalInsuranceTime = 0;
    this.fatalInsuranceMaxTime = 0;
    this.player.hp = Math.min(this.player.maxHp, heal);
    this.player.shield = Math.min(110, this.player.shield + shield);
    this.player.invuln = Math.max(this.player.invuln, 2.2);
    this.nextSpellFree = true;
    this.energy = clamp(this.energy + 30 + nearby * 1.4, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 24 + nearby * 1.1, 0, 100);
    this.playSlowMo(0.08, 0.68);
    this.playZoomPunch(0.025, 0.18);
    this.flashScreen("#0f1520", 0.26, 0.2);
    this.shakeScreen(7, 0.18);
    this.comboFlash = {
      label: "今天先到这",
      sublabel: "保险触发",
      color: "#f8f1d1",
      accent: "#7cff9b",
      life: 0.72,
      maxLife: 0.72,
    };
    this.addPlayerAfterimage(center, "#f8f1d1", this.effectivePlayerRadius() + 8, 0.72, undefined, 1.7);
    this.addSpellCard(center, "保险触发", "#f8f1d1", 116, 0, 0.78, "#7cff9b");
    this.addSlamSpellGlyph(center, "今天结束", "#f8f1d1", 72, 0.18, 0.72, 2.35, 0.92);
    this.addSpellRing(center, radius * 0.42, "#f8f1d1", "致命伤暂停", 0.72);
    this.addImpactLines(center, "#f8f1d1", 10, radius * 0.34, 0.26);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, center) > radius) continue;
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 1.1);
      enemy.frozen = Math.max(enemy.frozen, 0.5);
    }
    this.pendingTomorrowInsuranceEvents.push(
      { time: 0.95, phase: "impact", center, radius, damage, heal, nearby },
      { time: 1.9, phase: "settle", center, radius, damage, heal, nearby },
    );
    this.say(`爱你老己，明天见：保险触发，致命伤暂停。`);
  }

  private releaseTomorrowInsuranceEvent(event: PendingTomorrowInsuranceEvent): void {
    if (event.phase === "impact") {
      const cleared = this.clearEnemyShotsNear(event.center, Math.max(this.width, this.height));
      this.playSlowMo(0.24, 0.34);
      this.playZoomPunch(0.072, 0.28);
      this.flashScreen("#f8f1d1", 0.24, 0.18);
      this.shakeScreen(16, 0.32);
      this.comboFlash = {
        label: "明天见",
        sublabel: "今晚不死",
        color: "#f8f1d1",
        accent: "#7cff9b",
        life: 0.9,
        maxLife: 0.9,
      };
      this.addSlamSpellGlyph(event.center, "明天见", "#f8f1d1", 136, 0, 0.98, 3.0, 0.9);
      this.addSpellRing(event.center, event.radius, "#f8f1d1", "致命伤撤回", 0.96);
      this.addImpactLines(event.center, "#f8f1d1", 30, event.radius * 0.66, 0.44);
      this.addBurst(event.center, "#f8f1d1", 46);
    for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || distance(enemy.position, event.center) > event.radius) continue;
        const dist = distance(enemy.position, event.center);
        const falloff = 1 - Math.min(1, dist / event.radius);
        this.damageEnemy(enemy, event.damage * (0.55 + falloff * 0.9), "seeTomorrow");
        this.knockEnemyAway(enemy, event.center, 80 + falloff * 90);
        enemy.windup = 0;
        enemy.cooldown = Math.max(enemy.cooldown, 1.8);
        enemy.frozen = Math.max(enemy.frozen, 0.28);
      }
      this.energy = clamp(this.energy + cleared * 0.45, 0, this.maxEnergy);
      this.say(`明天见：致命伤撤回，清掉 ${cleared} 发弹幕。`);
      return;
    }

    this.playZoomPunch(0.034, 0.18);
    this.flashScreen("#7cff9b", 0.14, 0.12);
    this.addSpellGlyph({ x: event.center.x, y: event.center.y + 64 }, "今晚不死", "#7cff9b", 62, 0.82);
    this.addSpellRing(event.center, event.radius * 0.62, "#7cff9b", "下句免费", 0.8);
    this.addBurst(event.center, "#7cff9b", 28);
    this.say(`爱你老己，明天见：回复 ${Math.round(event.heal)}，下个普通咒语免费。`);
  }

  private startReceivedCharge(power: number): void {
    const duration = 8.2;
    this.receivedCharge = {
      life: duration,
      maxLife: duration,
      power,
      spells: [],
      energy: 0,
    };
    this.receivedAutoReleaseTime = 0;
    this.playSlowMo(0.22, 0.14);
    this.playZoomPunch(0.022, 0.14);
    this.addSpellCard(this.player.position, "收到", "#7cff9b", 84, 0, 0.88, "#e9fbff");
    this.addSpellRing(this.player.position, 132, "#7cff9b", "回执储能");
    this.addBurst(this.player.position, "#7cff9b", 18);
    this.say("收到：开始储能，接下来 8 秒内说出的普通咒语会进入回执缓存。再说一次收到确认执行。");
  }

  private captureReceivedSpell(spell: SpellKey, force = false): void {
    if (!this.receivedCharge || !this.isRepeatableNormalSpell(spell)) return;
    const charge = this.receivedCharge;
    if (!force && charge.spells[charge.spells.length - 1] === spell) {
      charge.energy += 0.55;
    } else {
      charge.spells.push(spell);
      charge.spells = charge.spells.slice(-6);
      charge.energy += 1.15;
      const offset = charge.spells.length - 1;
      this.addSpellCard({
        x: clamp(this.player.position.x + (offset - 2.5) * 34, 42, this.width - 42),
        y: clamp(this.player.position.y - 76, 42, this.playerMaxY(42)),
      }, SPELL_NAMES[spell].slice(0, 2), this.receivedSpellColor(spell), 46, 0, 0.64, "#e9fbff");
    }
    charge.life = Math.min(charge.maxLife, charge.life + 0.6);
    this.energy = clamp(this.energy + 1.2, 0, this.maxEnergy);
    this.addSpellRing(this.player.position, 72 + Math.min(58, charge.spells.length * 10), this.receivedSpellColor(spell), `已收：${SPELL_NAMES[spell]}`, 0.42);
  }

  private releaseReceivedCharge(power: number): void {
    const charge = this.receivedCharge;
    if (!charge) {
      this.startReceivedCharge(power);
      return;
    }
    const spells = charge.spells.slice();
    this.receivedCharge = null;
    this.receivedAutoReleaseTime = 0;
    if (spells.length === 0) {
      this.energy = clamp(this.energy + 12 * power, 0, this.maxEnergy);
      this.addSlamSpellGlyph(this.player.position, "空回执", "#7cff9b", 82, 0, 0.72, 2.2, 0.92);
      this.addSpellRing(this.player.position, 140, "#7cff9b", "收到确认");
      this.say("收到：没有缓存指令，转成声能确认戳。");
      return;
    }
    const uniqueCount = new Set(spells).size;
    const totalPower = power * Math.max(charge.power, 0.85) * (1 + Math.min(0.42, charge.energy * 0.08) + Math.min(0.28, uniqueCount * 0.06));
    const center = { ...this.player.position };
    this.playSlowMo(0.42, 0.22);
    this.playZoomPunch(0.044, 0.22);
    this.flashScreen("#7cff9b", 0.16, 0.14);
    this.shakeScreen(7 + spells.length, 0.24);
    this.comboFlash = {
      label: "收到，收到",
      sublabel: "确认执行",
      color: "#7cff9b",
      accent: "#e9fbff",
      life: 1,
      maxLife: 1,
    };
    this.addSlamSpellGlyph(center, "确认执行", "#7cff9b", 94, 0, 0.86, 2.6, 0.92);
    this.addSpellRing(center, 172 + spells.length * 18, "#7cff9b", "回执盖章", 0.96);
    this.addImpactLines(center, "#7cff9b", 18 + spells.length * 3, 210 + spells.length * 18, 0.36);
    spells.forEach((spell, index) => {
      const angle = -Math.PI * 0.85 + index * (Math.PI * 1.7 / Math.max(1, spells.length - 1));
      const cardPosition = {
        x: clamp(center.x + Math.cos(angle) * 132, 42, this.width - 42),
        y: clamp(center.y + Math.sin(angle) * 96, 42, this.playerMaxY(42)),
      };
      this.addSpellCard(cardPosition, SPELL_NAMES[spell].slice(0, 3), this.receivedSpellColor(spell), 64, index * 0.1, 0.9, "#e9fbff");
      this.pendingReceivedReceipts.push({
        time: 0.22 + index * 0.34,
        spell,
        index,
        total: spells.length,
        power: totalPower,
        center,
      });
    });
    this.pendingReceivedReceipts.push({
      time: 0.36 + spells.length * 0.34,
      spell: null,
      index: spells.length,
      total: spells.length,
      power: totalPower,
      center,
    });
    this.energy = clamp(this.energy + 6 * power + uniqueCount * 2.2, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 5 * power + spells.length * 1.8, 0, 100);
    this.say(`收到，收到：确认执行 ${spells.map((spell) => SPELL_NAMES[spell]).join(" / ")}。`);
  }

  private releaseReceivedReceipt(receipt: PendingReceivedReceipt): void {
    if (!receipt.spell) {
      const radius = 210 + receipt.total * 26;
      const unique = new Set(this.repeatableSpellChain.slice(-4)).size;
      this.playZoomPunch(0.038, 0.18);
      this.flashScreen("#e9fbff", 0.12, 0.12);
      this.addSlamSpellGlyph(receipt.center, "协同确认", "#e9fbff", 76, 0, 0.7, 2.1, 0.92);
      this.addSpellRing(receipt.center, radius, "#e9fbff", "回执结算", 0.78);
      this.addImpactLines(receipt.center, "#7cff9b", 16 + receipt.total * 3, radius * 0.72, 0.3);
      this.explode(receipt.center, radius, (18 + this.attackDamage * 0.72 + receipt.total * 4 + unique * 3) * receipt.power, false);
      this.energy = clamp(this.energy + receipt.total * 2.2, 0, this.maxEnergy);
      this.cannonMeter = clamp(this.cannonMeter + receipt.total * 1.6, 0, 100);
      return;
    }

    const spell = receipt.spell;
    const color = this.receivedSpellColor(spell);
    const target = this.focusedTarget() ?? this.nearestEnemy(receipt.center, Infinity);
    const targetPosition = target?.position ?? receipt.center;
    this.playZoomPunch(0.018 + receipt.index * 0.002, 0.12);
    this.addSlamSpellGlyph(receipt.center, "收到", color, 58, 0, 0.54, 1.8, 0.94);
    this.addSpellRing(receipt.center, 118 + receipt.index * 12, color, SPELL_NAMES[spell], 0.58);
    this.addParticle(receipt.center, targetPosition, color);
    this.replayReceivedSpellEffect(spell, receipt.power);
  }

  private replayReceivedSpellEffect(spell: SpellKey, power: number): void {
    this.replaySpellEffect(spell, 0.74 * power);
    const damage = 9 + this.attackDamage * 0.42;
    switch (spell) {
      case "explode":
        for (const enemy of this.nearbyEnemies(this.player.position, 520, 5)) {
          this.explode(enemy.position, 86 + this.explosionRadius * 0.22, damage * 1.5 * power, false);
        }
        break;
      case "freeze":
        this.freezeAround(this.player.position, this.freezePulseRadius * 1.1, this.freezeDuration * 0.9 * power);
        break;
      case "lightning":
        this.chainLightning(this.player.position, (12 + this.attackDamage * 0.34) * power);
        this.chainLightning(this.player.position, (8 + this.attackDamage * 0.24) * power);
        break;
      case "split":
        this.fireRadialProjectiles(12, damage * power, 560, 1.05, { radius: 4, pierce: 1, explosion: this.activeMods.explosionTime > 0, lightning: this.activeMods.lightningTime > 0 });
        break;
      case "pierce":
        this.fireComboFan(9, damage * 1.35 * power, { pierce: 4, color: "#e9fbff", freeze: this.activeMods.freezeTime > 0 });
        break;
      case "ricochet":
        this.fireRadialProjectiles(8, damage * 1.22 * power, 520, 1.15, { radius: 4.5, ricochet: Math.max(2, this.currentRicochetBounces()), lightning: this.activeMods.lightningTime > 0 });
        break;
      case "focus":
      case "serious":
        for (const enemy of this.nearbyEnemies(this.player.position, 620, 4)) {
          this.damageEnemy(enemy, (22 + this.attackDamage * 0.9) * power, "serious");
          this.addSpellGlyph(enemy.position, "受理", "#fff1a6", 32, 0.5);
        }
        break;
      case "bang":
        this.bangBang(power * 0.92);
        break;
      case "skillGo":
        this.castSkillGo();
        break;
      default:
        this.fireRadialProjectiles(6, damage * power, 500, 0.86, { radius: 4, ricochet: this.activeMods.ricochetTime > 0 ? 1 : 0 });
        break;
    }
  }

  private receivedSpellColor(spell: SpellKey): string {
    switch (spell) {
      case "explode":
        return "#ff9b4a";
      case "freeze":
        return "#9be7ff";
      case "lightning":
        return "#e5ff66";
      case "split":
        return "#8ee8ff";
      case "pierce":
        return "#e9fbff";
      case "ricochet":
        return "#ffcf5a";
      case "bang":
        return "#ffe27a";
      case "skillGo":
        return "#f8f1d1";
      default:
        return "#7cff9b";
    }
  }

  private castReceivedKeyword(power: number): void {
    if (this.receivedCharge) {
      if (this.receivedCharge.spells.length === 0) {
        this.receivedCharge.life = Math.min(this.receivedCharge.maxLife, this.receivedCharge.life + 2);
        this.energy = clamp(this.energy + 4, 0, this.maxEnergy);
        this.addSpellRing(this.player.position, 118, "#7cff9b", "继续接收");
        this.say("收到：回执已经打开了，先喊几个普通咒语，再说收到确认执行。");
        return;
      }
      this.releaseReceivedCharge(power);
      return;
    }
    this.startReceivedCharge(power);
  }

  private castInternalDrain(power: number): void {
    const cost = 7;
    if (this.player.shield >= cost) {
      this.player.shield -= cost;
    } else {
      const shieldUsed = this.player.shield;
      this.player.shield = 0;
      this.player.hp = Math.max(1, this.player.hp - (cost - shieldUsed));
    }
    this.energy = clamp(this.energy + 14 * power, 0, this.maxEnergy);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 3.2 * power);
    this.addWeakenSpellGlyph(this.player.position, "内耗", "#c491ff", 54, 0, 0.58, 1.9, 0.62);
    this.addImpactLines(this.player.position, "#c491ff", 8, 96, 0.24);
    this.addSpellRing(this.player.position, 104, "#c491ff", "内耗");
    this.say("内耗：扣一点状态，换声能和短爆发。");
  }

  private castSeriousCase(power: number): void {
    this.triggerFunSpellImpact("当个事儿办", "危险目标已受理", "#fff1a6", "#ff4f6d");
    this.activeMods.seriousTime = Math.max(this.activeMods.seriousTime, 8.5 * power);
    this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 8.5 * power);
    const caseCount = Math.min(6, 4 + Math.floor(power * 1.5));
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))
      .slice(0, caseCount);
    if (targets.length === 0) {
      this.energy = clamp(this.energy + 8 * power, 0, this.maxEnergy);
      this.addSpellCard(this.player.position, "暂无事项", "#fff1a6", 70, 0, 0.7, "#ff4f6d");
      this.say("当个事儿办：暂时没有危险事项，先返还声能。");
      return;
    }
    this.seriousCases = this.seriousCases.filter((item) => !targets.some((enemy) => enemy.id === item.enemyId));
    targets.forEach((enemy, index) => {
      const priorityTarget = enemy.type === "silencer" || enemy.type === "ranged" || enemy.type === "target";
      this.seriousCases.push({
        enemyId: enemy.id,
        progress: priorityTarget ? 0.42 : 0.28,
        life: 4.2 + index * 0.18,
        maxLife: 4.2 + index * 0.18,
        power,
      });
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, priorityTarget ? 1.55 : 1.15);
      enemy.frozen = Math.max(enemy.frozen, priorityTarget ? 0.34 : 0.22);
      this.clearEnemyShotsNear(enemy.position, priorityTarget ? 112 : 82);
      this.addSpellRing(enemy.position, priorityTarget ? 104 : 86, "#fff1a6", "受理", 0.46);
      this.addSpellCard({ x: enemy.position.x, y: enemy.position.y - enemy.radius - 28 }, "已受理", "#fff1a6", 62, index * 0.12, 0.82, "#ff4f6d");
      this.addParticle(this.player.position, enemy.position, "#fff1a6");
    });
    this.addSpellRing(this.player.position, 170, "#fff1a6", "立案处理");
    this.say(`当个事儿办：已受理 ${targets.length} 个危险事项。`);
  }

  private releaseSeriousCase(item: SeriousCase, enemy: Enemy): void {
    const center = { ...enemy.position };
    const priorityTarget = enemy.type === "silencer" || enemy.type === "ranged" || enemy.type === "target";
    const damage = (70 + this.attackDamage * 2.25 + this.level * 3.2) * item.power * (priorityTarget ? 1.55 : 1);
    this.playZoomPunch(0.052, 0.22);
    this.flashScreen("#fff1a6", 0.14, 0.12);
    this.shakeScreen(9, 0.18);
    this.damageEnemy(enemy, damage, "serious");
    for (const nearby of this.nearbyEnemies(center, 158 + item.power * 26, 7)) {
      if (nearby.id === enemy.id) continue;
      const falloff = 1 - clamp(distance(nearby.position, center) / (158 + item.power * 26), 0, 1);
      const nearbyPriority = nearby.type === "silencer" || nearby.type === "ranged" || nearby.type === "target" || nearby.windup > 0;
      this.damageEnemy(nearby, damage * (0.34 + falloff * 0.48) * (nearbyPriority ? 1.25 : 1), "serious");
      nearby.windup = 0;
      nearby.cooldown = Math.max(nearby.cooldown, nearbyPriority ? 1.55 : 1.05);
      nearby.frozen = Math.max(nearby.frozen, nearbyPriority ? 0.26 : 0.14);
      this.knockEnemyAway(nearby, center, (38 + falloff * 54) * item.power);
    }
    this.knockEnemyAway(enemy, this.player.position, 78 * item.power);
    enemy.windup = 0;
    enemy.cooldown = Math.max(enemy.cooldown, 2.15);
    enemy.frozen = Math.max(enemy.frozen, 0.24);
    this.addSlamSpellGlyph(enemy.position, "办结", "#fff1a6", 56, 0, 0.62, 2.0, 0.92);
    this.addSpellRing(enemy.position, 116, "#ff4f6d", "办结", 0.62);
    this.addSpellRing(center, 168, "#ff4f6d", "追办扩散", 0.72);
    this.addBurst(center, "#fff1a6", 36);
    this.energy = clamp(this.energy + 8 * item.power, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 7 * item.power, 0, 100);
  }

  private releaseBangSecondFist(event: PendingBangTwoFistEvent): void {
    const enemy = this.enemies.find((candidate) => candidate.id === event.enemyId && candidate.hp > 0);
    const position = enemy?.position ?? event.position;
    this.playSlowMo(0.22, 0.28);
    this.playZoomPunch(0.068, 0.24);
    this.flashScreen("#ffe27a", 0.16, 0.14);
    this.shakeScreen(13, 0.26);
    this.addPunchSpellGlyph({ x: event.origin.x + 58, y: event.origin.y }, "梆", "#ffe27a", 112, { x: 1, y: 0 }, 0, 0.92, 224, 1);
    this.addSpellRing(position, 172, "#ff4f6d", "右梆落点", 0.78);
    this.addImpactLines(position, "#ffe27a", 20, 176, 0.34);
    this.addBurst(position, "#ffe27a", 32);
    this.addParticle({ x: event.origin.x + 58, y: event.origin.y }, position, "#ffe27a");
    if (!enemy) {
      this.energy = clamp(this.energy + 8, 0, this.maxEnergy);
      this.say("梆梆两拳：第二拳目标已消失，返还声能。");
      return;
    }
    const beforeHp = enemy.hp;
    this.damageEnemy(enemy, (86 + this.attackDamage * 1.75 + this.bangLevel * 12) * event.power, "bang");
    for (const nearby of this.nearbyEnemies(position, 146, 6)) {
      if (nearby.id === enemy.id) continue;
      this.damageEnemy(nearby, (24 + this.attackDamage * 0.72) * event.power, "bang");
      this.knockEnemyAway(nearby, position, 44 * event.power);
    }
    this.knockEnemyAway(enemy, this.player.position, 126 * event.power);
    const killed = beforeHp > 0 && enemy.hp <= 0;
    this.energy = clamp(this.energy + 12 + (killed ? SPELL_COSTS.bang : 0), 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 18 + (killed ? 18 : 0), 0, 100);
    this.say(killed ? "梆梆两拳：第二拳办掉目标，返还梆梆声能。" : "梆梆两拳：第二拳点名命中。");
  }

  private castNoTalkCombo(power: number): void {
    const center = { ...this.player.position };
    const radius = 430 + Math.min(120, this.level * 5) + Math.min(80, this.threatTier() * 18);
    const duration = 5.6 + Math.min(2.2, power * 0.8);
    const firstCleared = this.clearEnemyShotsNear(center, radius + 110);
    let initialInterrupted = 0;
    let talkerHits = 0;

    this.playSlowMo(0.5, 0.18);
    this.playZoomPunch(0.036, 0.22);
    this.flashScreen("#e9fbff", 0.2, 0.16);
    this.shakeScreen(10, 0.26);
    this.addImpactLines(center, "#e9fbff", 18, radius * 0.42, 0.34);
    this.addSlamSpellGlyph(center, "不讲", "#e9fbff", 128, 0.02, 0.82, 2.7, 0.94);
    this.addSlamSpellGlyph(center, "不讲", "#66e0ff", 128, 0.42, 0.82, 2.35, 0.94);
    this.addSpellRing(center, radius * 0.42, "#e9fbff", "闭麦判定", 0.84);
    this.addSpellRing(center, radius * 0.72, "#66e0ff", "拒绝沟通领域", 1.05);
    this.addBurst(center, "#e9fbff", 34);

    for (let i = 0; i < 7; i += 1) {
      const y = center.y + (i - 3) * 32;
      const from = { x: clamp(center.x - radius * 0.64, 24, this.width - 24), y: clamp(y, 38, this.playerMaxY(38)) };
      const to = { x: clamp(center.x + radius * 0.64, 24, this.width - 24), y: clamp(y + (i % 2 === 0 ? -16 : 16), 38, this.playerMaxY(38)) };
      this.addParticle(from, to, i % 2 === 0 ? "#e9fbff" : "#66e0ff");
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, center) > radius) continue;
      const isTalker = enemy.type === "ranged" || enemy.type === "repeater" || enemy.type === "silencer" || enemy.windup > 0;
      initialInterrupted += 1;
      if (isTalker) talkerHits += 1;
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, isTalker ? 2.2 : 1.25);
      enemy.frozen = Math.max(enemy.frozen, isTalker ? 0.36 : 0.18);
      this.damageEnemy(enemy, (14 + this.attackDamage * 0.52) * power * (isTalker ? 1.85 : 1), "noTalk");
      this.knockEnemyAway(enemy, center, isTalker ? 42 * power : 24 * power);
      if (isTalker || initialInterrupted <= 8) {
        this.addSpellGlyph(enemy.position, isTalker ? "闭麦" : "别讲", "#e9fbff", isTalker ? 34 : 28, 0.58);
      }
    }

    this.refusalZones.push({
      center,
      radius,
      life: duration,
      maxLife: duration,
      power,
      tick: 0.28,
      clearedShots: firstCleared,
      interrupted: initialInterrupted,
    });
    this.activeMods.refusalTime = Math.max(this.activeMods.refusalTime, duration);
    this.player.invuln = Math.max(this.player.invuln, 0.48);
    this.energy = clamp(this.energy + 14 * power + firstCleared * 1.1 + talkerHits * 2.2, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 12 * power + talkerHits * 1.5, 0, 100);
    this.say(`隐藏 Combo：不讲不讲，拒绝沟通领域展开，闭麦 ${talkerHits} 个输出源。`);
  }

  private castBangFullCombo(power: number): void {
    const center = { ...this.player.position };
    const sideDistance = clamp(Math.min(this.width, this.height) * 0.22, 138, 230);
    const punchReach = clamp(sideDistance * 0.58, 78, 132);
    const laneWidth = 86 + this.bangLevel * 8;
    const crushRadius = 230 + this.bangLevel * 18;
    const screenRadius = Math.hypot(this.width, this.height);
    const punchDamage = (34 + this.attackDamage * 1.05 + this.bangLevel * 8) * power;
    const crushDamage = (96 + this.attackDamage * 2.45 + this.bangLevel * 18) * power;
    const punches = [
      { offset: { x: 0, y: -sideDistance }, direction: { x: 0, y: 1 } },
      { offset: { x: sideDistance, y: 0 }, direction: { x: -1, y: 0 } },
      { offset: { x: 0, y: sideDistance }, direction: { x: 0, y: -1 } },
      { offset: { x: -sideDistance, y: 0 }, direction: { x: 1, y: 0 } },
    ];
    let bangFullHits = 0;
    let crushHits = 0;

    this.playSlowMo(0.24, 0.34);
    this.playZoomPunch(0.062, 0.28);
    this.flashScreen("#ffcf5a", 0.2, 0.2);
    this.shakeScreen(16, 0.34);
    this.addSlamSpellGlyph(center, "不", "#ff4f6d", 170, 0.06, 0.86, 3.8, 0.92);
    this.addSpellRing(center, crushRadius * 0.75, "#ff4f6d", "不", 0.92);
    this.addSpellRing(center, crushRadius * 1.05, "#ffcf5a", "梆梆不梆梆", 1.02);
    this.addImpactLines(center, "#ff4f6d", 34, crushRadius * 0.92, 0.42);
    this.addBurst(center, "#ff4f6d", 58);

    punches.forEach((punch, index) => {
      const source = {
        x: clamp(center.x + punch.offset.x, 38, this.width - 38),
        y: clamp(center.y + punch.offset.y, 38, this.playerMaxY(38)),
      };
      const target = {
        x: clamp(source.x + punch.direction.x * punchReach, 28, this.width - 28),
        y: clamp(source.y + punch.direction.y * punchReach, 28, this.playerMaxY(28)),
      };
      this.addPunchSpellGlyph(source, "梆", "#ffcf5a", 86, punch.direction, index * 0.045, 0.96, punchReach, 5);
      this.addSpellFan(Math.atan2(punch.direction.y, punch.direction.x), 0.38, 5, sideDistance + 110, "#ffe27a", "梆");
      this.addImpactLines(target, "#ffe27a", 9, 126, 0.26);
      this.addBurst(target, "#ffe27a", 18);
      for (let i = 0; i < 5; i += 1) {
        const wobble = (i - 2) * 14;
        const start = {
          x: source.x + (punch.direction.y ? wobble : 0),
          y: source.y + (punch.direction.x ? wobble : 0),
        };
        const end = {
          x: target.x + punch.direction.x * (90 + i * 18) + (punch.direction.y ? wobble : 0),
          y: target.y + punch.direction.y * (90 + i * 18) + (punch.direction.x ? wobble : 0),
        };
        this.addParticle(start, end, i % 2 === 0 ? "#ffcf5a" : "#fff1a6");
      }
    });

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = distance(enemy.position, center);
      let damage = 0;
      let knockback = 0;
      if (dist <= crushRadius) {
        const falloff = 1 - dist / crushRadius;
        damage += crushDamage * (0.72 + falloff * 0.72);
        knockback += 82 + falloff * 86;
        crushHits += 1;
      } else {
        damage += crushDamage * 0.2 * (1 - Math.min(0.72, dist / screenRadius));
      }

      let lanePunches = 0;
      for (const punch of punches) {
        const along = (enemy.position.x - center.x) * punch.direction.x + (enemy.position.y - center.y) * punch.direction.y;
        const perp = Math.abs((enemy.position.x - center.x) * punch.direction.y - (enemy.position.y - center.y) * punch.direction.x);
        if (along > -sideDistance * 0.45 && perp <= laneWidth) {
          lanePunches += 1;
        }
      }
      if (lanePunches > 0) {
        damage += punchDamage * lanePunches * (dist <= crushRadius ? 0.65 : 1);
        knockback += 42 + lanePunches * 18;
      }

      if (damage <= 0) continue;
      bangFullHits += 1;
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 1.65);
      this.damageEnemy(enemy, damage, "bang");
      this.knockEnemyAway(enemy, center, knockback);
      if (dist <= crushRadius) {
        enemy.frozen = Math.max(enemy.frozen, 0.14);
        this.addSpellGlyph(enemy.position, "不", "#ff4f6d", 34, 0.32);
      }
      this.addBurst(enemy.position, dist <= crushRadius ? "#ff4f6d" : "#ffcf5a", dist <= crushRadius ? 16 : 9);
    }

    this.energy = clamp(this.energy + 18 + bangFullHits * 3.6 + crushHits * 2.2, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 26 + bangFullHits * 2.6 + crushHits * 1.8, 0, 100);
    this.clearEnemyShotsNear(center, Math.max(this.width, this.height));
    this.say(`隐藏 Combo：梆梆不梆梆，四面出拳，中间一个“不”砸中 ${crushHits} 个。`);
  }

  private castBangTwoFists(power: number): void {
    const center = { ...this.player.position };
    const interrupted = this.interruptEnemies(999, 360);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, center) > 280) continue;
      this.damageEnemy(enemy, (20 + this.attackDamage * 0.52 + this.bangLevel * 4) * power, "bang");
      this.knockEnemyAway(enemy, center, 34 * power);
      this.addSpellGlyph(enemy.position, "左梆", "#ffcf5a", 28, 0.5);
    }
    this.playSlowMo(0.3, 0.22);
    this.playZoomPunch(0.036, 0.18);
    this.addPunchSpellGlyph({ x: center.x - 58, y: center.y }, "梆", "#ffe27a", 112, { x: -1, y: 0 }, 0, 0.92, 224, 1);
    this.addSpellFan(Math.PI, 0.36, 5, 230, "#ffe27a", "左梆");
    this.addImpactLines(center, "#ffe27a", 12, 168, 0.3);

    const second = this.focusedTarget() ?? [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))[0];
    if (!second) {
      this.player.shield = Math.min(70, this.player.shield + 18);
      this.addSpellRing(this.player.position, 140, "#ffe27a", "两拳蓄势");
      this.say("梆梆两拳：场上没目标，转成护盾蓄势。");
      return;
    }
    this.addSpellGlyph(second.position, "右梆", "#ff4f6d", 42, 0.8);
    this.addSpellRing(second.position, 104, "#ff4f6d", "右梆落点", 0.8);
    this.pendingBangTwoFistEvents.push({
      time: 1.05,
      enemyId: second.id,
      position: { ...second.position },
      origin: center,
      power,
    });
    this.energy = clamp(this.energy + 8 + interrupted * 0.7, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 10 + interrupted * 0.5, 0, 100);
    this.say(`隐藏 Combo：梆梆两拳，第一拳打断 ${interrupted} 个，第二拳点名中。`);
  }

  private castCardCheckCombo(power: number): void {
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))
      .slice(0, 10);
    if (targets.length === 0) {
      this.energy = clamp(this.energy + 10, 0, this.maxEnergy);
      this.say("我要验牌：桌上暂时没牌，返还声能。");
      return;
    }
    this.markedEnemyId = targets[0].id;
    this.cardMarkTime = Math.max(this.cardMarkTime, 8.5 * power);
    this.playSlowMo(0.38, 0.22);
    this.playZoomPunch(0.048, 0.24);
    this.flashScreen("#f8f1d1", 0.16, 0.14);
    this.addImpactLines(this.player.position, "#f8f1d1", 18, 210, 0.34);
    this.addSpellGlyph(this.player.position, "验牌", "#f8f1d1", 92, 0.78);
    this.addSpellRing(this.player.position, 330, "#f8f1d1", "我要验牌");
    targets.forEach((enemy, index) => {
      const isMain = enemy.id === targets[0].id;
      const isDanger = isMain || enemy.type === "target" || enemy.type === "ranged" || enemy.type === "repeater";
      const delay = 0.16 + index * 0.18;
      const cardPosition = {
        x: clamp(enemy.position.x, 34, this.width - 34),
        y: clamp(enemy.position.y - enemy.radius - 34, 42, this.playerMaxY(42)),
      };
      const damage = (34 + this.attackDamage * 1.15) * power * (isMain ? 1.95 : isDanger ? 1.35 : 1);
      enemy.frozen = Math.max(enemy.frozen, delay + 0.42);
      enemy.cooldown = Math.max(enemy.cooldown, delay + 0.9);
      this.addSpellCard(cardPosition, isMain ? "主牌" : isDanger ? "红牌" : "牌", isMain ? "#ff4f6d" : isDanger ? "#ffcf5a" : "#f8f1d1", isMain ? 82 : 64, index * 0.12, 1.05, isMain ? "#fff1a6" : "#8ee8ff");
      this.addParticle(this.player.position, cardPosition, isMain ? "#ff4f6d" : "#f8f1d1");
      this.pendingCardReveals.push({
        time: delay,
        enemyId: enemy.id,
        position: { ...enemy.position },
        cardPosition,
        damage,
        isMain,
        isDanger,
      });
    });
    this.energy = clamp(this.energy + targets.length * 2.8, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + targets.length * 2.2, 0, 100);
    this.say(`隐藏 Combo：我要验牌，扣住 ${targets.length} 张牌。`);
  }

  private castTooLateCombo(power: number): void {
    const targetTime = this.elapsed - 2.2;
    const snapshot = [...this.playerHistory].reverse().find((item) => item.time <= targetTime) ?? this.playerHistory[0];
    const before = { ...this.player.position };
    const radius = this.effectivePlayerRadius();
    const safe = this.safeDirection();
    const fallback = this.clampToPlayableArea({
      x: before.x + safe.x * 140,
      y: before.y + safe.y * 140,
    }, radius);
    const to = snapshot
      ? {
          x: clamp(snapshot.position.x, radius, this.width - radius),
          y: clamp(snapshot.position.y, radius, this.playerMaxY(radius)),
        }
      : fallback;
    const hp = snapshot ? Math.min(this.player.maxHp, Math.max(this.player.hp, snapshot.hp)) : this.player.hp;
    const healed = Math.max(0, hp - this.player.hp);
    const oldPressure = this.enemies.filter((enemy) => enemy.hp > 0 && distance(enemy.position, before) <= 240).length;
    const refundEnergy = healed <= 0 ? 12 + Math.min(16, oldPressure * 2) : 0;
    this.playSlowMo(0.18, 0.42);
    this.playZoomPunch(0.036, 0.28);
    this.flashScreen("#9cffd0", 0.18, 0.12);
    this.addSpellGlyph(before, "我去", "#9cffd0", 88, 0.9);
    this.addSpellRing(before, 132, "#9cffd0", "先停一下", 0.82);
    this.addImpactLines(before, "#9cffd0", 12, 144, 0.42);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, before) > 260) continue;
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 1.15);
      enemy.frozen = Math.max(enemy.frozen, 0.75);
    }
    this.pendingTooLateEvents.push(
      { time: 0.78, phase: "rewind", from: before, to, power, hp, healed, oldPressure, refundEnergy },
      { time: 1.42, phase: "blast", from: before, to, power, hp, healed, oldPressure, refundEnergy },
    );
    this.player.invuln = Math.max(this.player.invuln, 1.05);
    this.energy = clamp(this.energy + 18 * power, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 14 * power, 0, 100);
    this.say("隐藏 Combo：我去不早说，先愣一下。");
  }

  private castReceivedCombo(power: number): void {
    if (this.receivedCharge) {
      this.releaseReceivedCharge(power * 1.12);
      return;
    }
    const seeds = this.repeatableSpellChain.slice(-3);
    this.startReceivedCharge(power);
    for (const spell of seeds) {
      this.captureReceivedSpell(spell, true);
    }
    if (seeds.length > 0) {
      this.releaseReceivedCharge(power * 1.08);
    } else {
      this.say("隐藏 Combo：收到，收到。先建立回执缓存，再说普通咒语充能。");
    }
  }

  private castExternalizeCombo(power: number): void {
    const externalizeCenter = { ...this.player.position };
    const externalizeMissingHpRatio = 1 - this.player.hp / this.player.maxHp;
    const externalizeGatherRadius = 560;
    const externalizeSafeRing = 156 + this.player.radius;
    const externalizePushRadius = 520;
    const externalizeBaseDamage = (46 + this.attackDamage * 1.25) * power * (1 + externalizeMissingHpRatio * 0.65);
    let externalizeGathered = 0;
    let externalizeDamaged = 0;

    this.playSlowMo(0.28, 0.32);
    this.playZoomPunch(0.04, 0.24);
    this.flashScreen("#c491ff", 0.16, 0.13);
    this.shakeScreen(8, 0.24);
    this.addWeakenSpellGlyph(externalizeCenter, "内耗", "#c491ff", 76, 0, 0.76, 2.35, 0.58);
    this.addSpellRing(externalizeCenter, externalizeGatherRadius * 0.36, "#c491ff", "内耗", 0.86);
    this.addSpellRing(externalizeCenter, externalizeGatherRadius * 0.62, "#8ee8ff", "扭曲聚拢", 0.92);
    this.addImpactLines(externalizeCenter, "#c491ff", 18, externalizeGatherRadius * 0.42, 0.34);

    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18 + this.elapsed * 0.42;
      const from = {
        x: clamp(externalizeCenter.x + Math.cos(angle) * externalizeGatherRadius * 0.54, 18, this.width - 18),
        y: clamp(externalizeCenter.y + Math.sin(angle) * externalizeGatherRadius * 0.54, 18, this.playerMaxY(18)),
      };
      const to = {
        x: externalizeCenter.x + Math.cos(angle + 0.68) * externalizeSafeRing,
        y: externalizeCenter.y + Math.sin(angle + 0.68) * externalizeSafeRing,
      };
      this.addParticle(from, to, i % 2 === 0 ? "#c491ff" : "#8ee8ff");
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, externalizeCenter) > externalizeGatherRadius) continue;
      externalizeGathered += 1;
      const currentAngle = Math.atan2(enemy.position.y - externalizeCenter.y, enemy.position.x - externalizeCenter.x);
      const laneAngle = currentAngle + (externalizeGathered % 5 - 2) * 0.075;
      const targetDistance = externalizeSafeRing + (externalizeGathered % 3) * 18;
      const gathered = {
        x: clamp(externalizeCenter.x + Math.cos(laneAngle) * targetDistance, enemy.radius, this.width - enemy.radius),
        y: clamp(externalizeCenter.y + Math.sin(laneAngle) * targetDistance, enemy.radius, this.playerMaxY(enemy.radius)),
      };
      this.addParticle(enemy.position, gathered, "#c491ff");
      enemy.position = gathered;
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 1.05);
      enemy.frozen = Math.max(enemy.frozen, 0.56);
      this.addWeakenSpellGlyph(gathered, "弱", "#c491ff", 34, 0, 0.42, 1.8, 0.55);
    }

    this.pendingExternalizeBlasts.push({
      time: 0.48,
      center: externalizeCenter,
      pushRadius: externalizePushRadius,
      damage: externalizeBaseDamage,
      power,
      gathered: externalizeGathered,
      missingHpRatio: externalizeMissingHpRatio,
    });
    this.player.shield = Math.min(90, this.player.shield + (8 + externalizeMissingHpRatio * 14) * power);
    this.say(`隐藏 Combo：与其内耗，不如外耗。内耗先聚拢 ${externalizeGathered} 个压力源。`);
    return;
  }

  private releaseExternalizeBlast(blast: PendingExternalizeBlast): void {
    let damaged = 0;
    this.playSlowMo(0.34, 0.2);
    this.playZoomPunch(0.056, 0.22);
    this.flashScreen("#ffcf5a", 0.18, 0.18);
    this.shakeScreen(13, 0.26);
    this.addPunchSpellGlyph({ x: blast.center.x - 50, y: blast.center.y }, "外", "#ffcf5a", 118, { x: -1, y: 0 }, 0, 0.78, 148, 2);
    this.addPunchSpellGlyph({ x: blast.center.x + 50, y: blast.center.y }, "耗", "#ffcf5a", 118, { x: 1, y: 0 }, 0.04, 0.78, 148, 2);
    this.addSpellRing(blast.center, blast.pushRadius * 0.5, "#ffcf5a", "外耗", 0.82);
    this.addSpellRing(blast.center, blast.pushRadius * 0.74, "#c491ff", "推出", 0.68);
    this.addImpactLines(blast.center, "#ffcf5a", 32, blast.pushRadius * 0.62, 0.36);

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, blast.center) > blast.pushRadius) continue;
      const dist = distance(enemy.position, blast.center);
      const falloff = 1 - Math.min(1, dist / blast.pushRadius);
      const damage = blast.damage * (0.55 + falloff * 0.9);
      damaged += 1;
      enemy.cooldown = Math.max(enemy.cooldown, 1.8);
      enemy.frozen = 0;
      this.damageEnemy(enemy, damage, "externalDrain");
      this.knockEnemyAway(enemy, blast.center, (126 + falloff * 134) * blast.power);
      this.addBurst(enemy.position, falloff > 0.45 ? "#ffcf5a" : "#c491ff", 14 + Math.floor(falloff * 14));
    }

    this.clearEnemyShotsNear(blast.center, blast.pushRadius * 0.82);
    this.player.shield = Math.min(90, this.player.shield + (6 + blast.missingHpRatio * 10) * blast.power);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 4.6 * blast.power);
    this.energy = clamp(this.energy + blast.gathered * 2.2 + damaged * 1.6, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + blast.gathered * 1.8 + damaged * 1.4, 0, 100);
    this.say(`隐藏 Combo：外耗推出，打飞 ${damaged} 个压力源。`);
  }

  private releaseCardReveal(reveal: PendingCardReveal): void {
    const enemy = this.enemies.find((candidate) => candidate.id === reveal.enemyId && candidate.hp > 0);
    const position = enemy?.position ?? reveal.position;
    if (reveal.isMain) {
      this.playSlowMo(0.32, 0.16);
      this.playZoomPunch(0.042, 0.18);
      this.flashScreen("#ff4f6d", 0.12, 0.12);
      this.addImpactLines(position, "#ff4f6d", 20, (enemy?.radius ?? 24) + 126, 0.34);
      this.addSpellRing(position, 140, "#ff4f6d", "主牌碎裂", 0.76);
      this.addSpellGlyph(position, "主", "#ff4f6d", 68, 0.52);
    } else if (reveal.isDanger) {
      this.addImpactLines(position, "#ffcf5a", 9, (enemy?.radius ?? 20) + 86, 0.26);
      this.addSpellRing(position, 96, "#ffcf5a", "红牌", 0.58);
    } else {
      this.addSpellRing(position, 74, "#f8f1d1", "揭牌", 0.46);
    }
    this.addParticle(reveal.cardPosition, position, reveal.isMain ? "#ff4f6d" : reveal.isDanger ? "#ffcf5a" : "#f8f1d1");
    if (enemy) {
      enemy.frozen = Math.max(enemy.frozen, reveal.isMain ? 0.32 : 0.14);
      enemy.cooldown = Math.max(enemy.cooldown, reveal.isMain ? 1.4 : 0.9);
      this.damageEnemy(enemy, reveal.damage, "cardCheck");
    }
    this.addBurst(position, reveal.isMain ? "#ff4f6d" : reveal.isDanger ? "#ffcf5a" : "#f8f1d1", reveal.isMain ? 34 : reveal.isDanger ? 20 : 12);
    if (reveal.isMain) {
      this.say("隐藏 Combo：我要验牌，主牌揭开。");
    }
  }

  private releaseTooLateEvent(event: PendingTooLateEvent): void {
    if (event.phase === "rewind") {
      const angle = Math.atan2(event.to.y - event.from.y, event.to.x - event.from.x);
      this.playSlowMo(0.22, 0.34);
      this.playZoomPunch(0.044, 0.26);
      this.flashScreen("#9cffd0", 0.16, 0.13);
      this.player.position = { ...event.to };
      this.player.hp = Math.min(this.player.maxHp, Math.max(this.player.hp, event.hp));
      this.player.invuln = Math.max(this.player.invuln, 0.9);
      this.clearEnemyShotsNear(event.to, 260);
      this.tooLateZones.push({
        center: { ...event.from },
        radius: 250 + Math.min(90, event.oldPressure * 12),
        life: 2,
        maxLife: 2,
        power: event.power,
      });
      this.addPlayerAfterimage(event.from, "#9cffd0", this.effectivePlayerRadius(), 0.36, angle, 1.45);
      this.addPlayerAfterimage(event.to, "#9cffd0", this.effectivePlayerRadius(), 0.42, angle, 1.2);
      this.addParticle(event.from, event.to, "#9cffd0");
      this.addSpellGlyph(event.to, "回去", "#9cffd0", 96, 0.92);
      this.addSpellRing(event.to, 196, "#9cffd0", "时间回卷", 1.02);
      this.addSpellRing(event.from, 250 + Math.min(90, event.oldPressure * 12), "#7cff9b", "延迟沟通区", 1.15);
      if (event.healed > 0) {
        this.addSpellGlyph(event.to, `撤回${Math.round(event.healed)}`, "#7cff9b", 42, 0.72);
      } else if (event.refundEnergy > 0) {
        this.energy = clamp(this.energy + event.refundEnergy, 0, this.maxEnergy);
        this.addSpellGlyph(event.to, `退${Math.round(event.refundEnergy)}`, "#7cff9b", 42, 0.72);
      }
      for (let i = 1; i <= 5; i += 1) {
        const t = i / 6;
        const ghost = {
          x: event.from.x + (event.to.x - event.from.x) * t,
          y: event.from.y + (event.to.y - event.from.y) * t,
        };
        this.addSpellGlyph(ghost, "<", "#9cffd0", 30 + i * 2, 0.58);
      }
      this.say(event.healed > 0 ? `隐藏 Combo：我去不早说，撤回 ${Math.round(event.healed)} 点伤害。` : `隐藏 Combo：我去不早说，没撤回血，返还 ${Math.round(event.refundEnergy)} 声能。`);
      return;
    }

    const pressureScale = 1 + Math.min(0.8, event.oldPressure * 0.08);
    const healScale = 1 + Math.min(0.65, event.healed / 42);
    const blastDamage = (26 + this.attackDamage * 0.82) * event.power * pressureScale * healScale;
    const blastRadius = 220 + Math.min(80, event.oldPressure * 9);
    this.playSlowMo(0.3, 0.3);
    this.playZoomPunch(0.052, 0.26);
    this.flashScreen("#9cffd0", 0.18, 0.16);
    this.addSpellGlyph(event.from, "不早说", "#9cffd0", 86, 0.92);
    this.addSpellRing(event.from, blastRadius + 12, "#9cffd0", "原地留锅", 0.92);
    this.addImpactLines(event.from, "#9cffd0", 22 + Math.min(10, event.oldPressure), blastRadius - 6, 0.42);
    this.knockEnemiesFrom(event.from, blastRadius * 0.86, (44 + event.oldPressure * 3) * event.power);
    this.explode(event.from, blastRadius, blastDamage, false);
    this.clearEnemyShotsNear(event.from, blastRadius);
    this.addBurst(event.from, "#9cffd0", 34);
    this.say(`隐藏 Combo：不早说，旧位置压力 x${event.oldPressure} 炸开。`);
  }

  private releaseUrgentCryEvent(event: PendingUrgentCryEvent): void {
    if (event.phase === "break") {
      let affected = 0;
      const damageScale = 1 + Math.min(0.75, event.pressureIndex * 0.045) + event.missingHpRatio * 0.45;
      this.playSlowMo(0.2, 0.42);
      this.playZoomPunch(0.052, 0.32);
      this.flashScreen("#ff4f6d", 0.24, 0.18);
      this.shakeScreen(11 + Math.min(12, event.pressureIndex * 0.5), 0.4);
      this.addSpellGlyph(event.center, event.pressureIndex >= 12 ? "绷不住了" : "急哭", "#ff4f6d", event.pressureIndex >= 12 ? 104 : 122, 1.08);
      this.addSpellRing(event.center, event.radius * 0.68, "#ff4f6d", "破防扩散", 1.08);
      this.addSpellRing(event.center, event.radius * 0.44, "#8ee8ff", `急哭指数 ${event.pressureIndex}`, 0.94);
      this.addImpactLines(event.center, "#ff4f6d", 22 + Math.min(18, event.pressureIndex), event.radius * 0.54, 0.52);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || distance(enemy.position, event.center) > event.radius) continue;
        const dist = distance(enemy.position, event.center);
        const falloff = 1 - Math.min(1, dist / event.radius);
        const priorityBonus = enemy.type === "ranged" || enemy.type === "repeater" || enemy.windup > 0 ? 1.5 : 1;
        const damage = (24 + this.attackDamage * 0.95) * event.power * damageScale * (0.72 + falloff * 0.58) * priorityBonus;
        affected += 1;
        enemy.windup = 0;
        enemy.cooldown = Math.max(enemy.cooldown, 1.8 + event.missingHpRatio * 0.8);
        enemy.frozen = Math.max(enemy.frozen, 0.34 + Math.min(0.42, event.pressureIndex * 0.025));
        this.damageEnemy(enemy, damage, "urgentCry");
        this.knockEnemyAway(enemy, event.center, (30 + falloff * 36) * event.power);
        this.addSpellGlyph(enemy.position, affected % 3 === 0 ? "红温" : "破防", "#ff4f6d", affected % 3 === 0 ? 38 : 36, 0.62);
        this.addBurst(enemy.position, "#ff4f6d", 10 + Math.floor(falloff * 8));
      }
      const beforeShots = this.enemyShots.length;
      this.clearEnemyShotsNear(event.center, event.radius + 80);
      const cleared = beforeShots - this.enemyShots.length;
      this.energy = clamp(this.energy + affected * 1.8 + cleared * 0.8 + event.missingHpRatio * 12, 0, this.maxEnergy);
      this.cannonMeter = clamp(this.cannonMeter + affected * 1.4 + cleared * 0.6, 0, 100);
      this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.2 + Math.min(3.4, event.pressureIndex * 0.22));
      this.say(`你已急哭：${affected} 个敌人破防，清掉 ${cleared} 个压力弹。`);
      return;
    }

    if (event.phase === "complaints") {
    const labels = ["急", "委屈", "不公平", "破防"];
    const count = Math.floor(clamp(7 + event.pressureIndex * 1.25, 8, 30));
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a));
    this.playSlowMo(0.34, 0.26);
    this.playZoomPunch(0.036, 0.24);
    this.addSpellGlyph(event.center, "投诉单", "#fff1a6", 86, 0.9);
    this.addSpellRing(event.center, 176 + Math.min(110, event.pressureIndex * 6), "#fff1a6", "已读不回", 0.96);
    this.addBurst(event.center, "#fff1a6", 24 + Math.min(22, event.pressureIndex));
    for (let i = 0; i < count; i += 1) {
      const target = targets[i % Math.max(1, targets.length)];
      const angle = target
        ? Math.atan2(target.position.y - event.center.y, target.position.x - event.center.x) + (Math.random() - 0.5) * 0.36
        : (Math.PI * 2 * i) / count;
      const speed = 520 + Math.min(160, event.pressureIndex * 8);
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...event.center },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: 4.5,
        damage: (10 + this.attackDamage * 0.34 + event.pressureIndex * 0.55) * event.power,
        life: 1.15,
        pierce: event.pressureIndex >= 14 ? 1 : 0,
        ricochet: event.pressureIndex >= 18 ? 1 : 0,
        hitIds: [],
        explosion: event.pressureIndex >= 16 || this.activeMods.explosionTime > 0,
        freeze: false,
        lightning: event.pressureIndex >= 20 || this.activeMods.lightningTime > 0,
      });
      this.nextProjectileId += 1;
      if (target && i < 12) {
        this.addParticle(event.center, target.position, i % 2 === 0 ? "#fff1a6" : "#8ee8ff");
        this.addSpellGlyph(target.position, labels[i % labels.length], i % 2 === 0 ? "#fff1a6" : "#ff4f6d", 30, 0.52);
      }
    }
    if (event.pressureIndex >= 14) {
      this.flashScreen("#8ee8ff", 0.12, 0.1);
      this.addSpellGlyph(event.center, "真的绷不住了", "#8ee8ff", 72, 0.92);
      this.interruptEnemies(999, event.radius + 180);
    }
    this.say(`你已急哭：${count} 张投诉单飞出。`);
      return;
    }

    this.releaseUrgentCryFinale(event);
  }

  private releaseUrgentCryFinale(event: PendingUrgentCryEvent): void {
    const speed = 560 + Math.min(180, event.pressureIndex * 9);
    const damage = (42 + this.attackDamage * 1.1 + event.pressureIndex * 1.35) * event.power;
    const y = clamp(event.center.y, 92, this.playerMaxY(92));
    this.playSlowMo(0.32, 0.28);
    this.playZoomPunch(0.052, 0.24);
    this.flashScreen("#fff1a6", 0.16, 0.14);
    this.shakeScreen(10 + Math.min(10, event.pressureIndex * 0.4), 0.28);
    this.addImpactLines({ x: this.width - 84, y }, "#fff1a6", 18 + Math.min(16, event.pressureIndex), 190, 0.42);
    this.addSpellRing({ x: this.width - 72, y }, 140, "#fff1a6", "弹幕来袭", 0.62);
    this.projectiles.push({
      id: this.nextProjectileId,
      position: { x: this.width + 34, y },
      velocity: { x: -speed, y: 0 },
      radius: 42,
      damage,
      life: 3,
      pierce: 999,
      ricochet: 0,
      hitIds: [],
      explosion: true,
      freeze: false,
      lightning: event.pressureIndex >= 18,
      label: "你已急哭 QAQ (╥﹏╥)",
      color: "#ff4f6d",
    });
    this.nextProjectileId += 1;
    this.cannonMeter = clamp(this.cannonMeter + 10 + event.pressureIndex * 0.7, 0, 100);
    this.say("你已急哭：大弹幕从右侧横扫过去。");
  }

  private replaySpellEffect(spell: SpellKey, power: number): boolean {
    switch (spell) {
      case "explode":
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, 3.4 * power);
        this.explode(this.player.position, this.explosionRadius * 0.55, this.attackDamage * this.explosionDamageScale * power, false);
        return true;
      case "freeze":
        this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 3.2 * power);
        this.freezeAround(this.player.position, this.freezePulseRadius * 0.75, this.freezeDuration * 0.72 * power);
        return true;
      case "lightning":
        this.chainLightning(this.player.position, 8 * power);
        this.activeMods.lightningTime = Math.max(this.activeMods.lightningTime, 2.8 * power);
        return true;
      case "split":
        this.activeMods.splitTime = Math.max(this.activeMods.splitTime, 3.2 * power);
        this.fireRadialProjectiles(6, 6 + this.attackDamage * 0.28, 430, 0.65, { radius: 4 });
        return true;
      case "pierce":
        this.activeMods.pierceTime = Math.max(this.activeMods.pierceTime, 3 * power);
        this.fireRadialProjectiles(4, 8 + this.attackDamage * 0.3, 520, 0.7, { pierce: 2, radius: 4 });
        return true;
      case "ricochet":
        this.activeMods.ricochetTime = Math.max(this.activeMods.ricochetTime, 3 * power);
        this.fireRadialProjectiles(4, 7 + this.attackDamage * 0.28, 450, 0.75, { ricochet: 1, radius: 4 });
        return true;
      case "evade":
      case "calm":
        this.shortSafeStep(spell === "calm" ? 68 : 84);
        return true;
      case "shield":
        this.player.shield = Math.min(70, this.player.shield + 10 * power);
        return true;
      case "gather":
      case "wealth":
        this.gatherDrops(spell === "wealth" ? 360 : 220);
        return true;
      case "focus":
        this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 2.4 * power);
        return true;
      case "bang":
        this.bangBang(power * 0.68);
        return true;
      case "serious":
        this.activeMods.seriousTime = Math.max(this.activeMods.seriousTime, 2.2 * power);
        this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 2.8 * power);
        return true;
      case "scramble":
        this.shortSafeStep(120);
        this.player.invuln = Math.max(this.player.invuln, 0.55);
        return true;
      case "cardCheck":
        this.castCardCheck(power * 0.72);
        return true;
      case "woqu":
        this.shortSafeStep(70);
        return true;
      case "noTalk":
        this.interruptEnemies(2, 150);
        this.clearEnemyShotsNear(this.player.position, 160);
        return true;
      case "urgentCry":
        this.castUrgentCry(power * 0.62);
        return true;
      case "unknown":
        this.player.invuln = Math.max(this.player.invuln, 0.24);
        this.clearEnemyShotsNear(this.player.position, 90);
        return true;
      case "bodyShape":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 1.8 * power);
        return true;
      case "graceful":
        this.activeMods.gracefulTime = Math.max(this.activeMods.gracefulTime, 1.5 * power);
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 1.6 * power);
        return true;
      case "internalDrain":
        this.energy = clamp(this.energy + 7 * power, 0, this.maxEnergy);
        this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 1.5 * power);
        return true;
      case "externalDrain":
        this.knockEnemiesFrom(this.player.position, 190, 24 * power);
        return true;
      case "oldSelf":
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5 * power);
        this.player.shield = Math.min(70, this.player.shield + 5 * power);
        return true;
      case "seeTomorrow":
        this.delayedHealTime = 1.4;
        this.delayedHealAmount = Math.max(this.delayedHealAmount, 7 * power);
        return true;
      default:
        return false;
    }
  }

  private prepareCannon(): boolean {
    if (this.cannonCharge >= 3) {
      this.say("一级准备已经三层，够离谱了。喊人间大炮锁定，再喊发射。");
      this.updateCommandDockState();
      return false;
    }
    const cost = this.nextCannonPrepCost();
    if (this.energy < cost) {
      this.say(`第 ${this.cannonCharge + 1} 层一级准备需要 ${cost} 声能，还差 ${Math.ceil(cost - this.energy)}。`);
      this.pulseEnergyDenied();
      this.updateCommandDockState();
      return false;
    }
    this.energy -= cost;
    this.cannonCharge += 1;
    this.cannonMeter = clamp(this.cannonMeter + 38, 0, 100);
    this.recordSpell("cannonPrep");
    this.addBurst(this.player.position, "#ffe27a", 24 + this.cannonCharge * 10);
    this.addSpellGlyph(this.player.position, `${this.cannonCharge}级准备`, "#ffe27a", 42 + this.cannonCharge * 10, 0.58);
    this.addSpellRing(this.player.position, 86 + this.cannonCharge * 34, "#ffe27a", "装填", 0.62);
    this.addImpactLines(this.player.position, "#ffe27a", 8 + this.cannonCharge * 4, 90 + this.cannonCharge * 34, 0.26);
    this.shakeScreen(3 + this.cannonCharge * 2, 0.12);
    if (this.cannonCharge >= 3) {
      this.playSlowMo(0.62, 0.18);
      this.playZoomPunch(0.036, 0.18);
      this.flashScreen("#ffe27a", 0.12, 0.08);
    }
    this.say(`一级准备 x${this.cannonCharge}。充能越高，弹射越多、伤害越高。`);
    this.updateCommandDockState();
    return true;
  }

  private nextCannonPrepCost(): number {
    return CANNON_PREP_COSTS[Math.min(this.cannonCharge, CANNON_PREP_COSTS.length - 1)];
  }

  private lockCannonTarget(): boolean {
    if (this.cannonCharge <= 0) {
      this.say("人间大炮还没装填。再喊一级准备先充能。");
      this.updateCommandDockState();
      return false;
    }
    const target = this.densestEnemyPoint();
    this.cannonAiming = true;
    if (!target) {
      this.cannonTarget = { ...this.pointer };
      this.recordSpell("cannon");
      this.addParticle(this.player.position, this.cannonTarget, "#ffe27a");
      this.addBurst(this.cannonTarget, "#ffe27a", 24 + this.cannonCharge * 6);
      this.addSpellGlyph(this.cannonTarget, "锁定", "#ffe27a", 46 + this.cannonCharge * 8, 0.62);
      this.addSpellRing(this.cannonTarget, 104 + this.cannonCharge * 32, "#ffe27a", "炮击坐标", 0.72);
      this.addImpactLines(this.cannonTarget, "#ffe27a", 12 + this.cannonCharge * 4, 120 + this.cannonCharge * 32, 0.3);
      this.say("人间大炮：进入瞄准。移动鼠标调整方向，再按一次发射。");
      this.updateCommandDockState();
      return true;
    }
    this.cannonTarget = { ...target };
    this.recordSpell("cannon");
    this.addParticle(this.player.position, this.cannonTarget, "#ffe27a");
    this.addBurst(this.cannonTarget, "#ffe27a", 28 + this.cannonCharge * 8);
    this.addSpellGlyph(this.cannonTarget, "锁定", "#ffe27a", 48 + this.cannonCharge * 8, 0.62);
    this.addSpellRing(this.cannonTarget, 118 + this.cannonCharge * 38, "#ffe27a", "炮击坐标", 0.72);
    this.addImpactLines(this.cannonTarget, "#ffe27a", 14 + this.cannonCharge * 4, 136 + this.cannonCharge * 36, 0.3);
    this.playZoomPunch(0.026 + this.cannonCharge * 0.006, 0.16);
    this.shakeScreen(4 + this.cannonCharge, 0.12);
    this.say("人间大炮：已对准敌群。可以移动鼠标微调，再按一次发射。");
    this.updateCommandDockState();
    return true;
  }

  private fireCannon(): boolean {
    if (this.cannonCharge <= 0) {
      this.say("还没一级准备，先充能再发射。");
      this.updateCommandDockState();
      return false;
    }
    if (!this.cannonTarget) {
      this.say("人间大炮还没瞄准。先锁定方向，再发射。");
      this.updateCommandDockState();
      return false;
    }
    const meterCost = this.cannonFireMeterCost();
    if (this.cannonMeter < meterCost) {
      this.say(`大炮槽还差 ${Math.ceil(meterCost - this.cannonMeter)}，再等一下或打靶心怪。`);
      this.updateCommandDockState();
      return false;
    }
    const direction = normalize({ x: this.cannonTarget.x - this.player.position.x, y: this.cannonTarget.y - this.player.position.y });
    const charge = this.cannonCharge;
    const maxCharge = charge >= 3;
    const bangBoost = this.recentChainIncludes("bang") ? 1.16 : 1;
    const speed = (maxCharge ? 1840 : 920 + charge * 190) * bangBoost;
    this.player.cannonVelocity = { x: direction.x * speed, y: direction.y * speed };
    this.player.cannonTime = maxCharge ? 3.35 : 1.25 + charge * 0.56;
    this.player.invuln = this.player.cannonTime + 0.25;
    this.cannonBouncesLeft = charge + 1 + (maxCharge ? 2 : 0);
    this.cannonDamage = (maxCharge ? 410 : 80 + charge * 70) + this.level * (maxCharge ? 8 : 5);
    this.cannonLaunchCharge = charge;
    this.cannonMeter = Math.max(0, this.cannonMeter - meterCost);
    this.cannonCharge = 0;
    this.cannonTarget = null;
    this.cannonAiming = false;
    this.recordSpell("cannonFire");
    this.addBurst(this.player.position, "#ffe27a", 40);
    this.cannonShockwave(this.player.position, 92 + charge * 18, 14 + charge * 8, 28 + charge * 10, false);
    this.playSlowMo(0.34, 0.26);
    this.playZoomPunch(0.044 + charge * 0.006, 0.24);
    this.addImpactLines(this.player.position, "#ffe27a", 16 + charge * 4, 150 + charge * 26);
    this.playSpellImpact({ glyph: "发射", glyphSize: 128 + charge * 16, color: "#ffe27a", shake: 12 + charge * 2, flash: 0.26, hitStop: 0.08, radius: 118 + charge * 18, particles: 28 + charge * 8 });
    this.addVoiceDanmakuPin("人间大炮", "发射", "#ffe27a", "#ff9b4a");
    this.say(`发射！${charge} 层充能，${charge} 次弹射。`);
    this.addBurst(this.player.position, maxCharge ? "#ff9b4a" : "#ffe27a", 58 + charge * 18 + (maxCharge ? 42 : 0));
    this.cannonShockwave(this.player.position, 130 + charge * 32 + (maxCharge ? 72 : 0), 28 + charge * 18 + (maxCharge ? 44 : 0), 48 + charge * 18 + (maxCharge ? 52 : 0), false);
    this.clearEnemyShotsNear(this.player.position, 140 + charge * 42 + (maxCharge ? 160 : 0));
    this.playSlowMo(maxCharge ? 0.18 : 0.26, maxCharge ? 0.48 : 0.34);
    this.playZoomPunch(0.065 + charge * 0.012 + (maxCharge ? 0.04 : 0), maxCharge ? 0.42 : 0.3);
    this.addImpactLines(this.player.position, maxCharge ? "#ff9b4a" : "#ffe27a", 24 + charge * 7 + (maxCharge ? 18 : 0), 190 + charge * 44 + (maxCharge ? 120 : 0));
    this.addSpellGlyph(this.player.position, maxCharge ? "三级发射" : "发射", maxCharge ? "#ff9b4a" : "#ffe27a", 78 + charge * 18 + (maxCharge ? 22 : 0), maxCharge ? 0.82 : 0.62);
    this.playSpellImpact({ glyph: maxCharge ? "三级发射" : "发射", glyphSize: 148 + charge * 20 + (maxCharge ? 44 : 0), color: maxCharge ? "#ff9b4a" : "#ffe27a", shake: 18 + charge * 4 + (maxCharge ? 10 : 0), flash: maxCharge ? 0.42 : 0.32, hitStop: maxCharge ? 0.14 : 0.105, radius: 148 + charge * 26 + (maxCharge ? 68 : 0), particles: 44 + charge * 12 + (maxCharge ? 36 : 0) });
    if (maxCharge) {
      this.fireRadialProjectiles(22, 34 + this.level * 1.8, 760, 1.2, { radius: 6.5, pierce: 1, explosion: true, ricochet: this.activeMods.ricochetTime > 0 ? 1 : 0 });
    }
    this.say(`发射！${charge} 层充能，${this.cannonBouncesLeft} 次弹射。`);
    this.updateCommandDockState();
    return true;
  }

  private castCannonStage(): void {
    if (this.cannonCharge <= 0) {
      this.prepareCannon();
      return;
    }
    if (!this.cannonTarget) {
      this.lockCannonTarget();
      return;
    }
    this.fireCannon();
  }

  private finishCannonLaunch(): void {
    const charge = Math.max(1, this.cannonLaunchCharge);
    const maxCharge = charge >= 3;
    const radius = 220 + charge * 72 + (maxCharge ? 150 : 0);
    const damage = 85 + charge * 70 + this.level * 4 + (maxCharge ? 190 + this.level * 3 : 0);
    const knockback = 130 + charge * 55 + (maxCharge ? 95 : 0);
    this.player.cannonTime = 0;
    this.player.invuln = Math.max(this.player.invuln, 0.75 + charge * 0.18);
    this.player.shield = Math.min(maxCharge ? 140 : 95, this.player.shield + 14 + charge * 9 + (maxCharge ? 34 : 0));
    this.cannonShockwave(this.player.position, radius, damage, knockback, true);
    if (maxCharge) {
      this.cannonShockwave(this.player.position, radius * 0.58, damage * 0.82, knockback * 0.76, false);
    }
    this.fireCannonShards(charge);
    this.clearEnemyShotsNear(this.player.position, radius + 70);
    this.cannonDamage = 0;
    this.cannonLaunchCharge = 0;
    this.playSlowMo(maxCharge ? 0.16 : 0.22, maxCharge ? 0.52 : 0.36);
    this.playZoomPunch(0.09 + charge * 0.01 + (maxCharge ? 0.035 : 0), maxCharge ? 0.48 : 0.36);
    this.addImpactLines(this.player.position, "#ff9b4a", 34 + charge * 8 + (maxCharge ? 24 : 0), 260 + charge * 58 + (maxCharge ? 180 : 0));
    this.addSpellGlyph(this.player.position, maxCharge ? "三级落地开花" : "落地开花", "#ff9b4a", 72 + charge * 16 + (maxCharge ? 22 : 0), maxCharge ? 0.9 : 0.72);
    this.playSpellImpact({ glyph: maxCharge ? "爆轰" : "轰", glyphSize: 196 + charge * 24 + (maxCharge ? 66 : 0), color: "#ff9b4a", shake: 20 + charge * 5 + (maxCharge ? 14 : 0), flash: maxCharge ? 0.46 : 0.34, hitStop: maxCharge ? 0.14 : 0.1, radius: 190 + charge * 34 + (maxCharge ? 120 : 0), particles: 58 + charge * 16 + (maxCharge ? 58 : 0) });
    if (maxCharge) {
      this.fireRadialProjectiles(36, 48 + this.level * 2.2, 840, 1.45, { radius: 7.5, pierce: 2, explosion: true, ricochet: this.activeMods.ricochetTime > 0 ? 2 : 1 });
    }
    this.say(`落地冲击！清场半径 ${Math.round(radius)}，短暂无敌。`);
  }

  private fireCannonShards(charge: number): void {
    const maxCharge = charge >= 3;
    const count = 8 + charge * 8 + (maxCharge ? 18 : 0) + this.cannonShardCount + (this.activeMods.ricochetTime > 0 ? charge * 3 : 0);
    if (count <= 0) return;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.elapsed * 0.6;
      this.projectiles.push({
        id: this.nextProjectileId,
        position: { ...this.player.position },
        velocity: { x: Math.cos(angle) * (620 + charge * 42 + (maxCharge ? 190 : 0)), y: Math.sin(angle) * (620 + charge * 42 + (maxCharge ? 190 : 0)) },
        radius: 5.5 + charge * 0.6 + (maxCharge ? 1.4 : 0),
        damage: 22 + charge * 12 + this.level * 1.4 + (maxCharge ? 26 + this.level * 0.8 : 0),
        life: 1.3 + charge * 0.08 + (maxCharge ? 0.28 : 0),
        pierce: this.activeMods.pierceTime > 0 ? (maxCharge ? 3 : 2) : maxCharge ? 2 : 1,
        ricochet: this.activeMods.ricochetTime > 0 ? Math.max(1, this.currentRicochetBounces() - 1 + (maxCharge ? 1 : 0)) : maxCharge ? 1 : 0,
        hitIds: [],
        explosion: this.activeMods.explosionTime > 0,
        freeze: this.activeMods.freezeTime > 0,
        lightning: this.activeMods.lightningTime > 0,
        color: maxCharge ? "#ff9b4a" : undefined,
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
    this.spellCastCounts.set(spell, (this.spellCastCounts.get(spell) ?? 0) + 1);
    if (spell === "cannonPrep") this.tutorial.prepDone = true;
    if (spell === "cannon") this.tutorial.aimDone = true;
    if (spell === "cannonFire") this.tutorial.fireDone = true;
    const entry = this.spellFatigue.get(spell);
    const count = entry && now - entry.lastAt < 8 && this.lastSpell === spell ? entry.count + 1 : 0;
    this.spellFatigue.set(spell, { count, lastAt: now });
    this.lastSpell = spell;
    this.spellChain.push(spell);
    this.spellChain = this.spellChain.slice(-5);
    if (this.isRepeatableNormalSpell(spell)) {
      this.repeatableSpellChain.push(spell);
      this.repeatableSpellChain = this.repeatableSpellChain.slice(-4);
      this.captureReceivedSpell(spell);
    }
    if (new Set(this.spellChain).size >= 4) {
      this.energy = clamp(this.energy + 3 + this.chainEnergyBonus, 0, this.maxEnergy);
      this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 4);
    }
    this.renderGuidePanel();
  }

  private isRepeatableNormalSpell(spell: SpellKey): boolean {
    if (this.isHiddenComboSpell(spell)) return false;
    return !["cannon", "cannonPrep", "cannonFire", "received", "tooLate"].includes(spell);
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
    const from = { ...this.player.position };
    const dashAngle = Math.atan2(safe.y, safe.x);
    this.addPlayerAfterimage(from, spell === "calm" ? "#9cffd0" : "#66e0ff", this.effectivePlayerRadius(), 0.25, dashAngle, 1.42);
    this.player.position.x = clamp(this.player.position.x + safe.x * distanceBoost, this.player.radius, this.width - this.player.radius);
    this.player.position.y = clamp(this.player.position.y + safe.y * distanceBoost, this.player.radius, this.playerMaxY(this.player.radius));
    this.player.invuln = Math.max(this.player.invuln, spell === "scramble" ? 0.75 : 0.45);
    this.player.dodgeCooldown = spell === "scramble" ? 5.4 : 3.2;
    if (spell === "scramble") this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.5);
    this.addPlayerAfterimage(this.player.position, spell === "calm" ? "#9cffd0" : "#66e0ff", this.effectivePlayerRadius(), 0.18, dashAngle, 1.22);
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
      enemy.position.y = clamp(enemy.position.y + away.y * 32, enemy.radius, this.playerMaxY(enemy.radius));
      this.addBurst(enemy.position, "#ffcf5a", 10);
    }
    if (hits === 0) {
      this.player.shield = Math.min(70, this.player.shield + 8);
      this.addSpellRing(this.player.position, 108, "#ffcf5a", "没怪也给盾");
      this.say("不太梆，但给了点护盾。");
    } else {
      this.energy = clamp(this.energy + hits * 5, 0, this.maxEnergy);
      this.cannonMeter = clamp(this.cannonMeter + hits * 4, 0, 100);
      this.addSpellRing(this.player.position, 120, "#ffcf5a", `梆 x${hits}`);
      this.playSlowMo(hits >= 2 ? 0.44 : 0.52, 0.16 + hits * 0.025);
      this.playZoomPunch(hits >= 2 ? 0.038 : 0.03, 0.18);
      this.addImpactLines(this.player.position, "#ffcf5a", 8 + hits * 3, 108 + hits * 18);
      this.playSpellImpact({ glyph: "梆", glyphCount: hits > 1 ? Math.min(3, hits) : 1, glyphSize: hits > 1 ? 76 : 128, color: "#ffcf5a", shake: 5 + hits, flash: 0.1, hitStop: 0.035, radius: 92 + hits * 12, particles: 8 + hits * 4 });
      this.say(hits >= 2 ? "很梆，梆梆两下。" : "梆了一下。");
    }
  }

  private castSkillGo(): void {
    const glyphs = ["技", "能", "五", "子", "棋"];
    const spacing = clamp(this.width * 0.095, 78, 128);
    const lineWidth = spacing * (glyphs.length - 1);
    const centerX = clamp(this.player.position.x, 42 + lineWidth / 2, this.width - 42 - lineWidth / 2);
    const centerY = clamp(this.player.position.y - 18, 90, this.playerMaxY(90));
    const placed: Vec2[] = glyphs.map((_, index) => ({
      x: centerX + (index - 2) * spacing,
      y: centerY,
    }));
    const barragePerGlyph = 12 + Math.min(8, this.skillGoLevel * 2);
    const projectileDamage = 8 + this.attackDamage * 0.34 + this.skillGoLevel * 2.2;
    this.playSlowMo(0.32, 0.28);
    this.playZoomPunch(0.052, 0.26);
    this.flashScreen("#f8f1d1", 0.18, 0.16);
    this.addImpactLines(this.player.position, "#f8f1d1", 24, 240, 0.36);
    for (let i = 0; i < placed.length; i += 1) {
      const position = placed[i];
      const delay = i * 0.075;
      this.turrets.push({
        position,
        cooldown: delay,
        life: 7.5 + this.skillGoLevel * 0.8,
      });
      this.addFallingSpellGlyph(position, glyphs[i], "#f8f1d1", 78, delay, 0.92, 190);
      this.addSpellRing(position, 74 + this.skillGoLevel * 4, "#f8f1d1", undefined, 0.72 + delay);
      this.addBurst(position, "#f8f1d1", 14 + this.skillGoLevel * 2);
      for (let shot = 0; shot < barragePerGlyph; shot += 1) {
        const angle = (Math.PI * 2 * shot) / barragePerGlyph + i * 0.23 + this.elapsed * 0.36;
        this.projectiles.push({
          id: this.nextProjectileId,
          position: { ...position },
          velocity: { x: Math.cos(angle) * 560, y: Math.sin(angle) * 560 },
          radius: 4,
          damage: projectileDamage,
          life: 1.65,
          pierce: 1 + Math.floor(this.skillGoLevel / 2),
          ricochet: this.activeMods.ricochetTime > 0 ? Math.max(1, this.currentRicochetBounces() - 1) : 0,
          hitIds: [],
          explosion: this.activeMods.explosionTime > 0,
          freeze: this.activeMods.freezeTime > 0,
          lightning: this.activeMods.lightningTime > 0,
        });
        this.nextProjectileId += 1;
      }
    }
    for (let i = 0; i < placed.length - 1; i += 1) {
      this.addParticle(placed[i], placed[i + 1], "#8ee8ff");
      this.addImpactLines(placed[i], "#f8f1d1", 5, 90, 0.26);
    }
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const nearest = placed.reduce((best, position) => distance(position, enemy.position) < distance(best, enemy.position) ? position : best, placed[0]);
      this.addParticle(nearest, enemy.position, "#f8f1d1");
      this.damageEnemy(enemy, 10 + this.attackDamage * 0.4 + this.skillGoLevel * 3, "skillGo");
      enemy.cooldown = Math.max(enemy.cooldown, 0.9);
    }
    this.addSpellGlyph(this.player.position, "五子棋", "#f8f1d1", 92, 0.92);
    this.energy = clamp(this.energy + 10 + this.skillGoLevel * 3, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 18 + this.skillGoLevel * 5, 0, 100);
    this.addSpellRing(this.player.position, 260, "#f8f1d1", "五字连珠");
    this.addSpellRing(this.player.position, 170, "#8ee8ff", "满屏弹幕");
    this.say("技能五子棋，落子无悔。");
  }

  private castXiexiu(): void {
    const options = [...this.unlockedSpells].filter((spell) =>
      ["explode", "freeze", "lightning", "split", "pierce", "ricochet", "bang", "skillGo"].includes(spell),
    );
    if (options.length === 0) {
      this.player.shield = Math.min(70, this.player.shield + 10);
      this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.2);
      this.playZoomPunch(0.024, 0.16);
      this.addSpellGlyph(this.player.position, "邪修", "#d28cff", 70, 0.62);
      this.addBurst(this.player.position, "#d28cff", 18);
      this.addSpellRing(this.player.position, 116, "#d28cff", "邪修护体");
      this.say("邪修缺少可借用的攻击咒语，先转成护盾和短暂火力。");
      return;
    }
    const pick = options[Math.floor(Math.random() * options.length)] ?? "explode";
    this.playSlowMo(0.38, 0.18);
    this.playZoomPunch(0.032, 0.18);
    this.comboFlash = {
      label: "邪修抽签",
      sublabel: "野路子定格",
      color: "#d28cff",
      accent: "#ff4f6d",
      life: 0.82,
      maxLife: 0.82,
    };
    this.addSlamSpellGlyph(this.player.position, "邪修", "#d28cff", 76, 0, 0.72, 2.1, 0.92);
    const shown = Math.min(8, options.length);
    for (let i = 0; i < shown; i += 1) {
      const angle = (Math.PI * 2 * i) / shown + this.elapsed;
      this.addSpellCard({
        x: this.player.position.x + Math.cos(angle) * 92,
        y: this.player.position.y + Math.sin(angle) * 92,
      }, SPELL_NAMES[options[i]].slice(0, 2), options[i] === pick ? "#ff4f6d" : "#d28cff", options[i] === pick ? 62 : 46, i * 0.06, 0.72, "#f8f1d1");
    }
    this.addSlamSpellGlyph(this.player.position, `借法：${SPELL_NAMES[pick]}`, "#ff4f6d", 46, 0.48, 0.76, 1.9, 0.92);
    this.energy = clamp(this.energy + SPELL_COSTS[pick] * 1.1, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 14, 0, 100);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 5.2);
    this.addSpellRing(this.player.position, 142, "#d28cff", `邪修：${SPELL_NAMES[pick]}`, 0.9);
    this.castSpell(pick);
    this.explode(this.player.position, 150, 12 + this.attackDamage * 0.5, false);
    if (Math.random() < 0.28) {
      this.hurtPlayer(4, true);
      this.addWeakenSpellGlyph(this.player.position, "反噬", "#ff4f6d", 54, 0.12, 0.62, 1.8, 0.62);
      this.say(`邪修成功，但多少有点副作用：${SPELL_NAMES[pick]}。`);
    } else {
      this.say(`邪修路线：${SPELL_NAMES[pick]}。`);
    }
  }

  private gatherDrops(radius: number): number {
    let affected = 0;
    for (const drop of this.drops) {
      if (distance(drop.position, this.player.position) <= this.magnetRadius + radius) {
        affected += 1;
      }
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
    return affected;
  }

  private explode(position: Vec2, radius: number, damage: number, freezes: boolean): void {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = distance(position, enemy.position);
      if (dist > radius) continue;
      this.damageEnemy(enemy, damage * (1 - dist / radius * 0.45), "explode");
      if (freezes) {
        enemy.frozen = Math.max(enemy.frozen, this.freezeDuration * 0.75);
        this.addFrostShards(enemy.position, 4, enemy.radius * 2.6, "#bdf2ff", 0.22);
      }
    }
    this.addBurst(position, freezes ? "#9be7ff" : "#ff9b4a", 24);
    if (freezes) {
      this.addFrostWave(position, radius, 12);
    }
  }

  private cannonShockwave(position: Vec2, radius: number, damage: number, knockback: number, freezes: boolean): void {
    for (const enemy of this.enemies) {
      const dist = distance(position, enemy.position);
      if (dist > radius) continue;
      const falloff = 1 - dist / radius * 0.22;
      this.damageEnemy(enemy, damage * falloff, "cannon");
      this.knockEnemyAway(enemy, position, knockback * falloff);
      if (freezes) {
        enemy.frozen = Math.max(enemy.frozen, 0.28);
        this.addFrostShards(enemy.position, 3, enemy.radius * 2.1, "#e8fbff", 0.18);
      }
    }
    this.clearEnemyShotsNear(position, freezes ? radius + 90 : radius * 0.72);
    this.addBurst(position, freezes ? "#fff1a6" : "#ffe27a", freezes ? 76 : 42);
    this.addImpactLines(position, freezes ? "#ff9b4a" : "#ffe27a", freezes ? 24 : 14, radius * (freezes ? 0.86 : 0.62), freezes ? 0.36 : 0.24);
    if (freezes) {
      this.addFrostWave(position, radius, 18, "#fff1a6", 0.42);
    }
  }

  private knockEnemyAway(enemy: Enemy, origin: Vec2, amount: number): void {
    const away = normalize({ x: enemy.position.x - origin.x, y: enemy.position.y - origin.y });
    enemy.position.x = clamp(enemy.position.x + away.x * amount, enemy.radius, this.width - enemy.radius);
    enemy.position.y = clamp(enemy.position.y + away.y * amount, enemy.radius, this.playerMaxY(enemy.radius));
  }

  private clearEnemyShotsNear(position: Vec2, radius: number): number {
    const before = this.enemyShots.length;
    this.enemyShots = this.enemyShots.filter((shot) => distance(position, shot.position) > radius);
    if (this.enemyShots.length < before) {
      this.addBurst(position, "#8ee8ff", 16);
    }
    return before - this.enemyShots.length;
  }

  private freezeAround(position: Vec2, radius: number, duration: number): void {
    const affected: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (distance(position, enemy.position) <= radius) {
        enemy.frozen = Math.max(enemy.frozen, duration);
        affected.push(enemy);
      }
    }
    this.addFrostWave(position, radius, 10 + Math.min(12, affected.length * 2));
    for (const enemy of affected.slice(0, 12)) {
      this.addFrostShards(enemy.position, 5, enemy.radius * 3, "#bdf2ff", 0.3);
    }
    this.addBurst(position, "#9be7ff", 24 + Math.min(18, affected.length * 2));
  }

  private chainLightning(position: Vec2, damage: number): void {
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => distance(a.position, position) - distance(b.position, position))
      .slice(0, this.lightningJumps);
    let arcOrigin = { ...position };
    for (const [index, enemy] of targets.entries()) {
      this.damageEnemy(enemy, damage, "lightning");
      if (this.lightningBurstRadius > 0) {
        this.explode(enemy.position, this.lightningBurstRadius, damage * 0.34, false);
      }
      this.addLightningArc(arcOrigin, enemy.position, index === 0 ? 3.6 : 2.7, index === 0 ? 3 : 2);
      this.addImpactBurst(enemy.position, index === 0 ? "#f4ff8a" : "#9cf7ff", 7 + Math.min(5, index));
      if (index === 0 && damage >= 8) {
        this.addSpellGlyph(enemy.position, "雷", "#f4ff8a", 34, 0.28);
      }
      arcOrigin = { ...enemy.position };
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, spell?: SpellKey): void {
    if (enemy.hp <= 0) return;
    const shatters = enemy.frozen > 0 && this.freezeShatterRadius > 0;
    if (spell && enemy.type === "repeater" && enemy.lastSpellHit === spell) {
      amount *= 0.45;
      this.say("复读怪抗住了同一句，换个咒语。");
    }
    if (this.cardMarkTime > 0 && enemy.id === this.markedEnemyId) {
      amount *= 1.55;
    }
    if (spell) enemy.lastSpellHit = spell;
    enemy.hp -= amount;
    if (enemy.hp > 0) {
      if (spell || amount >= this.attackDamage * 0.85) {
        this.addImpactBurst(enemy.position, spell === "freeze" ? "#9be7ff" : spell === "lightning" ? "#e5ff66" : spell === "explode" ? "#ff9b4a" : "#8ee8ff", 5);
      }
      return;
    }
    this.kills += 1;
    this.score += Math.round(ENEMY_CONFIG[enemy.type].xp * 10 + this.elapsed);
    this.cannonMeter = clamp(this.cannonMeter + (enemy.type === "target" ? 14 : 3), 0, 100);
    const xpValue = ENEMY_CONFIG[enemy.type].xp * this.currentXpDropMultiplier();
    this.drops.push({
      position: this.clampToPlayableArea(enemy.position, 7),
      value: xpValue,
      radius: 7,
      magnet: 0,
    });
    this.addBurst(enemy.position, ENEMY_CONFIG[enemy.type].color, enemy.type === "target" ? 42 : 18);
    this.addBurst(enemy.position, "#7cff9b", enemy.type === "target" ? 24 : 8);
    this.addParticle(enemy.position, this.player.position, "#7cff9b");
    if (shatters) {
      this.explode(enemy.position, this.freezeShatterRadius, 8 + this.freezeDuration * 4, true);
    }
  }

  private currentXpDropMultiplier(): number {
    if (this.elapsed < 45) return 1.38;
    if (this.elapsed < 100) return 1.18;
    if (this.elapsed < 180) return 1.1;
    return 1.04;
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
    if (this.player.hp <= 0 && this.fatalInsuranceTime > 0) {
      this.triggerTomorrowInsurance();
      return;
    }
    if (this.player.hp <= 0) {
      this.endRun();
    }
  }

  private endRun(): void {
    this.gameOver = true;
    this.running = false;
    this.paused = false;
    this.closeWildSpellbook({ restorePause: false });
    this.pauseOverlay.hidden = true;
    const rating = this.calculateResultRating();
    this.startOverlay.hidden = false;
    this.startOverlay.classList.add("is-result");
    this.startOverlay.querySelector(".survivor-kicker")!.textContent = "本局结算";
    this.startOverlay.querySelector("h1")!.textContent = rating.label;
    this.startOverlay.querySelector("p")!.textContent = "声纹战报已生成，所有施法记录进入片尾归档。";
    this.startSettingsPanel.hidden = true;
    this.startSettingsPanel.replaceChildren();
    this.renderResultPanel(rating);
    this.startButton.textContent = "再次出击";
    this.startWildButton.hidden = false;
    this.startExpertButton.hidden = true;
    this.syncCommandDockVisibility();
  }

  private calculateResultRating(): ResultRating {
    const buffCount = [...this.ownedBuffs.values()].reduce((sum, count) => sum + count, 0);
    const uniqueSpellCount = this.spellCastCounts.size;
    const castCount = [...this.spellCastCounts.values()].reduce((sum, count) => sum + count, 0);
    const resultScore = Math.round(
      this.score / 85 +
      this.kills * 2.2 +
      this.level * 18 +
      this.elapsed * 1.08 +
      buffCount * 7 +
      uniqueSpellCount * 10 +
      Math.min(80, castCount * 1.4),
    );
    if (resultScore < 130) return { label: "B", score: resultScore };
    if (resultScore < 240) return { label: "A", score: resultScore };
    const sCount = clamp(Math.floor((resultScore - 240) / 135) + 1, 1, 32);
    return { label: "S".repeat(sCount), score: resultScore };
  }

  private resultOneLineSummary(resultScore: number): string {
    return `分数 ${this.score}，击杀 ${this.kills}，生存 ${this.formatResultTime(this.elapsed)}，记录分 ${resultScore}。`;
  }

  private renderResultPanel(rating: ResultRating): void {
    this.resultPanel.hidden = false;
    this.resultPanel.replaceChildren();

    const buffCount = [...this.ownedBuffs.values()].reduce((sum, count) => sum + count, 0);
    const castCount = [...this.spellCastCounts.values()].reduce((sum, count) => sum + count, 0);
    const uniqueSpellCount = this.spellCastCounts.size;
    const topSpells = this.topResultSpells();
    const leaderboardEntry = this.createPersonalLeaderboardEntry(rating, buffCount, castCount, uniqueSpellCount, topSpells);
    const personalBoard = this.savePersonalLeaderboard(leaderboardEntry);
    const bestRecord = personalBoard[0]?.score ?? rating.score;
    const currentRank = this.personalLeaderboardRank(leaderboardEntry, personalBoard);

    const resultConsole = document.createElement("div");
    resultConsole.className = "survivor-result-console";

    const hero = document.createElement("div");
    hero.className = "survivor-result-hero";

    const grade = document.createElement("div");
    grade.className = "survivor-result-grade";
    const gradeLabel = document.createElement("span");
    gradeLabel.textContent = "RESULT SCORE";
    const gradeValue = document.createElement("strong");
    gradeValue.textContent = String(rating.score);
    const gradeScore = document.createElement("em");
    gradeScore.textContent = `评级 ${rating.label}`;
    grade.append(gradeLabel, gradeValue, gradeScore);

    const brief = document.createElement("div");
    brief.className = "survivor-result-brief";
    const briefKicker = document.createElement("span");
    briefKicker.textContent = "SURVIVOR REPORT";
    const briefTitle = document.createElement("h2");
    briefTitle.textContent = "声纹战报";
    const briefCopy = document.createElement("p");
    briefCopy.textContent = this.resultOneLineSummary(rating.score);
    const heroMeta = document.createElement("div");
    heroMeta.className = "survivor-result-hero-meta";
    for (const [label, value] of [
      ["分数", String(this.score)],
      ["记录分", String(rating.score)],
      ["击杀", String(this.kills)],
      ["生存", this.formatResultTime(this.elapsed)],
    ]) {
      const item = document.createElement("span");
      const key = document.createElement("i");
      key.textContent = label;
      const val = document.createElement("b");
      val.textContent = value;
      item.append(key, val);
      heroMeta.append(item);
    }
    brief.append(briefKicker, briefTitle, briefCopy, heroMeta);
    hero.append(grade, brief);

    const stats = document.createElement("div");
    stats.className = "survivor-result-stats";
    const statItems = [
      ["等级", `Lv.${this.level}`],
      ["战斗分", String(this.score)],
      ["记录分", String(rating.score)],
      ["击杀", String(this.kills)],
      ["生存", this.formatResultTime(this.elapsed)],
      ["Buff", String(buffCount)],
      ["施法", String(castCount)],
      ["咒语", String(uniqueSpellCount)],
    ];
    for (const [label, value] of statItems) {
      const item = document.createElement("span");
      const key = document.createElement("i");
      key.textContent = label;
      const val = document.createElement("strong");
      val.textContent = value;
      item.append(key, val);
      stats.append(item);
    }

    const spellSummary = document.createElement("div");
    spellSummary.className = "survivor-result-spells";
    const spellTitle = document.createElement("strong");
    spellTitle.textContent = "高频咒语档案";
    const spellList = document.createElement("div");
    spellList.className = "survivor-result-spell-list";
    if (topSpells.length > 0) {
      for (const [spell, count] of topSpells) {
        const item = document.createElement("span");
        const name = document.createElement("b");
        name.textContent = SPELL_NAMES[spell];
        const value = document.createElement("em");
        value.textContent = `x${count}`;
        item.append(name, value);
        spellList.append(item);
      }
    } else {
      const empty = document.createElement("span");
      empty.className = "survivor-result-spell-empty";
      empty.textContent = "本局主要依靠走位和自动攻击。";
      spellList.append(empty);
    }
    spellSummary.append(spellTitle, spellList);

    const leaderboard = document.createElement("div");
    leaderboard.className = "survivor-result-leaderboard";
    const leaderboardTitle = document.createElement("strong");
    leaderboardTitle.textContent = "个人排行榜";
    const records = document.createElement("div");
    records.className = "survivor-result-records";
    for (const [label, value] of [
      ["本局记录分", String(rating.score)],
      ["历史最高", String(bestRecord)],
      ["个人名次", currentRank > 0 ? `#${currentRank}` : "-"],
    ]) {
      const item = document.createElement("span");
      const key = document.createElement("i");
      key.textContent = label;
      const val = document.createElement("b");
      val.textContent = value;
      item.append(key, val);
      records.append(item);
    }
    const historyToggle = document.createElement("button");
    historyToggle.type = "button";
    historyToggle.className = "survivor-result-history-toggle";
    historyToggle.setAttribute("aria-expanded", "false");
    historyToggle.textContent = `查看过往历史数据（${personalBoard.length}条）`;
    const rankList = document.createElement("div");
    rankList.className = "survivor-result-rank-list";
    rankList.hidden = true;
    for (const entry of personalBoard) {
      const rank = this.personalLeaderboardRank(entry, personalBoard);
      const row = document.createElement("span");
      if (entry.id === leaderboardEntry.id) row.classList.add("is-current");
      const order = document.createElement("i");
      order.textContent = rank > 0 ? `#${rank}` : "#-";
      const score = document.createElement("b");
      score.textContent = String(entry.score);
      const meta = document.createElement("em");
      meta.textContent = `${entry.rating} / 击杀 ${entry.kills} / ${this.formatResultTime(entry.survivalTime)}`;
      const date = document.createElement("small");
      date.textContent = this.formatLeaderboardDate(entry.createdAt);
      row.append(order, score, meta, date);
      rankList.append(row);
    }
    historyToggle.addEventListener("click", () => {
      const expanded = rankList.hidden;
      rankList.hidden = !expanded;
      historyToggle.setAttribute("aria-expanded", String(expanded));
      historyToggle.textContent = expanded ? "收起过往历史数据" : `查看过往历史数据（${personalBoard.length}条）`;
    });
    leaderboard.append(leaderboardTitle, records, historyToggle, rankList);

    const credits = document.createElement("div");
    credits.className = "survivor-result-credits";
    const title = document.createElement("strong");
    title.textContent = "语音片尾字幕";
    const viewport = document.createElement("div");
    viewport.className = "survivor-result-credits-viewport";
    const track = document.createElement("div");
    track.className = "survivor-result-credits-track";
    const entries = this.voiceBarrageLog.slice();
    track.style.setProperty("--credits-duration", `${Math.max(9, entries.length * 1.25)}s`);
    if (entries.length === 0) {
      const empty = document.createElement("span");
      empty.className = "survivor-result-credits-empty";
      empty.textContent = "本局没有语音弹幕，安静得有点认真。";
      track.append(empty);
    } else {
      const intro = document.createElement("span");
      intro.className = "survivor-result-credits-intro";
      intro.textContent = "本局被听见的声音";
      track.append(intro);
      for (const entry of entries) {
        const row = document.createElement("span");
        row.dataset.tone = entry.tone;
        const time = document.createElement("i");
        time.textContent = this.formatResultTime(entry.time);
        const kind = document.createElement("b");
        kind.textContent = this.voiceResultToneLabel(entry.tone);
        const text = document.createElement("em");
        text.textContent = entry.text;
        row.append(time, kind, text);
        track.append(row);
      }
      const outro = document.createElement("span");
      outro.className = "survivor-result-credits-outro";
      outro.textContent = "施法结束";
      track.append(outro);
    }
    viewport.append(track);
    credits.append(title, viewport);

    const lower = document.createElement("div");
    lower.className = "survivor-result-lower";
    lower.append(spellSummary, credits);

    resultConsole.append(hero, stats, leaderboard, lower);
    this.resultPanel.append(resultConsole);
  }

  private createPersonalLeaderboardEntry(
    rating: ResultRating,
    buffCount: number,
    spellCasts: number,
    uniqueSpellCount: number,
    topSpells: Array<[SpellKey, number]>,
  ): PersonalLeaderboardEntry {
    return {
      id: this.createLeaderboardEntryId(),
      score: rating.score,
      rating: rating.label,
      rawScore: this.score,
      kills: this.kills,
      level: this.level,
      survivalTime: Math.max(0, Math.floor(this.elapsed)),
      buffCount,
      spellCasts,
      uniqueSpellCount,
      topSpells: topSpells.map(([spell, count]) => ({ spell, count })),
      createdAt: new Date().toISOString(),
    };
  }

  private createLeaderboardEntryId(): string {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private loadPersonalLeaderboard(): PersonalLeaderboardEntry[] {
    try {
      const raw = window.localStorage.getItem(PERSONAL_LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry): entry is PersonalLeaderboardEntry => this.isPersonalLeaderboardEntry(entry))
        .sort((a, b) => this.compareLeaderboardEntries(a, b))
        .slice(0, PERSONAL_LEADERBOARD_LIMIT);
    } catch {
      return [];
    }
  }

  private savePersonalLeaderboard(entry: PersonalLeaderboardEntry): PersonalLeaderboardEntry[] {
    const board = [...this.loadPersonalLeaderboard(), entry]
      .sort((a, b) => this.compareLeaderboardEntries(a, b))
      .slice(0, PERSONAL_LEADERBOARD_LIMIT);
    try {
      window.localStorage.setItem(PERSONAL_LEADERBOARD_KEY, JSON.stringify(board));
    } catch {
      // The run result should still render if storage is blocked.
    }
    return board;
  }

  private isPersonalLeaderboardEntry(value: unknown): value is PersonalLeaderboardEntry {
    if (!value || typeof value !== "object") return false;
    const entry = value as Partial<PersonalLeaderboardEntry>;
    return (
      typeof entry.id === "string" &&
      Number.isFinite(entry.score) &&
      typeof entry.rating === "string" &&
      Number.isFinite(entry.rawScore) &&
      Number.isFinite(entry.kills) &&
      Number.isFinite(entry.level) &&
      Number.isFinite(entry.survivalTime) &&
      Number.isFinite(entry.buffCount) &&
      Number.isFinite(entry.spellCasts) &&
      Number.isFinite(entry.uniqueSpellCount) &&
      typeof entry.createdAt === "string" &&
      Array.isArray(entry.topSpells) &&
      entry.topSpells.every((spell) => this.isLeaderboardSpellRecord(spell))
    );
  }

  private isLeaderboardSpellRecord(value: unknown): value is { spell: SpellKey; count: number } {
    if (!value || typeof value !== "object") return false;
    const record = value as { spell?: unknown; count?: unknown };
    return this.isSpellKey(record.spell) && Number.isFinite(record.count);
  }

  private isSpellKey(value: unknown): value is SpellKey {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(SPELL_CONFIG, value);
  }

  private compareLeaderboardEntries(a: PersonalLeaderboardEntry, b: PersonalLeaderboardEntry): number {
    return (
      b.score - a.score ||
      b.kills - a.kills ||
      b.survivalTime - a.survivalTime ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private personalLeaderboardRank(entry: PersonalLeaderboardEntry, board: readonly PersonalLeaderboardEntry[]): number {
    const index = board.findIndex((item) => item.id === entry.id);
    return index >= 0 ? index + 1 : 0;
  }

  private formatLeaderboardDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  }

  private voiceResultToneLabel(tone: "heard" | "spell" | "combo" | "control"): string {
    if (tone === "spell") return "咒语";
    if (tone === "combo") return "隐藏 Combo";
    if (tone === "control") return "语音控制";
    return "识别";
  }

  private topResultSpells(): Array<[SpellKey, number]> {
    return [...this.spellCastCounts.entries()]
      .sort((a, b) => b[1] - a[1] || SPELL_NAMES[a[0]].localeCompare(SPELL_NAMES[b[0]], "zh-Hans-CN"))
      .slice(0, 4);
  }

  private formatResultTime(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  private checkLevelUp(): void {
    if (this.xp < this.xpGoal) return;
    this.xp -= this.xpGoal;
    this.level += 1;
    this.xpGoal = this.level <= 6 ? Math.round(this.xpGoal * 1.08 + 5) : Math.round(this.xpGoal * 1.16 + 11);
    this.applyBaselineLevelReward();
    const lateTempo = this.level >= 8 ? 1.35 : 1;
    this.energy = clamp(this.energy + 10 * lateTempo, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 8 * lateTempo, 0, 100);
    this.addBurst(this.player.position, "#7cff9b", 48);
    this.addBurst(this.player.position, "#8ee8ff", 28);
    if (this.runMode === "wild") {
      this.energy = clamp(this.energy + 26 * lateTempo, 0, this.maxEnergy);
      this.cannonMeter = clamp(this.cannonMeter + 18 * lateTempo, 0, 100);
      this.say(`狂野模式：Lv.${this.level} 基础成长已生效，跳过抽卡。`);
      return;
    }
    if (this.testEnvironment) {
      this.energy = this.maxEnergy;
      this.cannonMeter = 100;
      this.say(`TEST 环境：Lv.${this.level} 基础成长已生效，跳过抽卡。`);
      return;
    }
    this.pendingUpgradeChoices += 1;
    this.refreshPendingUpgradePrompt();
    this.say(this.pendingUpgradeMessage());
    this.maybeAutoOpenPendingUpgradeChoices();
  }

  private refreshPendingUpgradePrompt(): void {
    if (this.pendingUpgradeChoices <= 0 || this.runMode !== "normal" || this.gameOver) return;
    this.addVoiceDanmakuPin("升级待选择", this.pendingUpgradePromptText(), "#7cff9b", "#8ee8ff");
  }

  private pendingUpgradeMessage(): string {
    if (this.upgradePickMode === "instant") {
      return `升级到 Lv.${this.level}，立即打开强化选择。`;
    }
    if (this.upgradePickMode === "safe") {
      return `升级到 Lv.${this.level}，强化已暂存 x${this.pendingUpgradeChoices}；安全时自动弹出，也可按 Tab。`;
    }
    return `升级到 Lv.${this.level}，强化已暂存 x${this.pendingUpgradeChoices}。按 Tab 打开升级选择。`;
  }

  private pendingUpgradePromptText(): string {
    if (this.upgradePickMode === "instant") return `即将弹出 x${this.pendingUpgradeChoices}`;
    if (this.upgradePickMode === "safe") return `安全自动 / Tab x${this.pendingUpgradeChoices}`;
    return `按 Tab 打开 x${this.pendingUpgradeChoices}`;
  }

  private maybeAutoOpenPendingUpgradeChoices(): void {
    if (this.upgradePickMode === "manual" || this.pendingUpgradeChoices <= 0 || this.runMode !== "normal") return;
    if (this.selectingBuff || !this.upgradeOverlay.hidden || this.gameOver || !this.running || this.paused) return;
    if (this.upgradePickMode === "safe" && this.shouldDeferAutoUpgradeChoice()) {
      this.refreshPendingUpgradePrompt();
      return;
    }
    this.openPendingUpgradeChoices();
  }

  private shouldDeferAutoUpgradeChoice(): boolean {
    if (this.player.cannonTime > 0 || this.cannonAiming || this.cannonTarget) return true;
    if (this.comboFlash && this.comboFlash.life > 0) return true;
    if (this.hitStopTime > 0 || this.slowMoTime > 0.12 || this.zoomPunchTime > 0.12) return true;
    if (this.enemyPressure() > 0.78) return true;
    return (
      this.pendingExternalizeBlasts.length > 0 ||
      this.pendingCardReveals.length > 0 ||
      this.pendingTooLateEvents.length > 0 ||
      this.receivedCharge !== null ||
      this.pendingReceivedReceipts.length > 0 ||
      this.pendingTomorrowInsuranceEvents.length > 0 ||
      this.pendingBangTwoFistEvents.length > 0 ||
      this.seriousCases.length > 0 ||
      this.pendingUrgentCryEvents.length > 0
    );
  }

  private openPendingUpgradeChoices(): void {
    if (this.pendingUpgradeChoices <= 0 || this.selectingBuff || !this.upgradeOverlay.hidden || this.gameOver || !this.running) return;
    this.manualUpgradeSequenceOpen = true;
    this.showNextPendingUpgradeChoice();
  }

  private showNextPendingUpgradeChoice(): void {
    if (!this.manualUpgradeSequenceOpen || this.pendingUpgradeChoices <= 0 || this.selectingBuff || !this.upgradeOverlay.hidden || this.gameOver || !this.running) {
      this.manualUpgradeSequenceOpen = false;
      return;
    }
    this.pendingUpgradeChoices -= 1;
    this.selectingBuff = true;
    this.showBuffChoices();
  }

  private applyBaselineLevelReward(): void {
    const lateTempo = this.level >= 8 ? 1.45 : 1;
    this.attackDamage += 0.7 * lateTempo;
    if (this.level % 3 === 0) this.maxEnergy += this.level >= 8 ? 4 : 2;
    this.player.maxHp += this.level >= 8 ? 3 : 2;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + (this.level >= 8 ? 5 : 3));
  }

  private showBuffChoices(count = 3): void {
    this.paused = false;
    this.pauseOverlay.hidden = true;
    this.pauseVoiceForUpgrade();
    const choices = this.draftBuffs(count);
    this.tutorial.upgradeSeen = true;
    this.upgradeChoices.replaceChildren();
    this.upgradeChoices.setAttribute("role", "listbox");
    this.upgradeOverlay.querySelector("h1")!.textContent = this.manualUpgradeSequenceOpen && this.pendingUpgradeChoices > 0
      ? `选择强化（剩余 ${this.pendingUpgradeChoices}）`
      : "选择强化";
    this.renderUpgradeGuide(choices);
    for (const [index, buff] of choices.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.rarity = buff.rarity;
      button.dataset.kind = this.buffKind(buff);
      button.dataset.index = String(index);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      button.tabIndex = -1;
      button.innerHTML = `
        <span class="survivor-card-topline">
          <i>${index + 1}</i>
          <b>${this.buffKindLabel(buff)}</b>
          <em>${buff.rarity === "diamond" ? "钻石" : buff.rarity === "gold" ? "黄金" : "青铜"}</em>
        </span>
        <strong>${buff.title}</strong>
        <em>${buff.description}</em>
        <small>${this.buffPickHint(buff)}</small>
      `;
      button.addEventListener("click", () => this.applyBuff(buff));
      button.addEventListener("focus", () => this.selectUpgradeChoice(index, { focus: false }));
      button.addEventListener("pointerenter", () => this.selectUpgradeChoice(index, { focus: false }));
      this.upgradeChoices.append(button);
    }
    this.upgradeOverlay.hidden = false;
    this.selectUpgradeChoice(0);
    this.syncCommandDockVisibility();
    this.renderGuidePanel();
  }

  private applyBuff(buff: Buff, options: { gm?: boolean } = {}): void {
    buff.apply();
    this.tutorial.upgradeChosen = true;
    this.ownedBuffs.set(buff.id, (this.ownedBuffs.get(buff.id) ?? 0) + 1);
    if (buff.spell) this.unlockedSpells.add(buff.spell);
    const voiceUpdates = this.refreshVoiceSpellRecognition();
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    this.upgradeSelectionIndex = 0;
    this.renderCommandDock();
    this.addBuffFeedback(buff);
    const extraVoiceUpdates = buff.spell ? voiceUpdates.filter((spell) => spell !== buff.spell) : voiceUpdates;
    if (options.gm) {
      this.say(buff.spell ? `GM: unlocked ${buff.spell}` : `GM: buff ${buff.id}`);
      this.renderGuidePanel();
      return;
    }
    this.say(buff.spell ? `解锁咒语：${SPELL_NAMES[buff.spell]}，已加入底部施法栏和语音识别${this.voiceRecognitionUpdateText(extraVoiceUpdates)}。` : `获得被动强化：${buff.title}，效果已立即生效。`);
    this.resumeVoiceAfterUpgrade();
    this.renderGuidePanel();
    if (this.manualUpgradeSequenceOpen && this.pendingUpgradeChoices > 0) {
      this.say(`还有 ${this.pendingUpgradeChoices} 次强化待选择，继续选完。`);
      this.showNextPendingUpgradeChoice();
      return;
    }
    this.manualUpgradeSequenceOpen = false;
    this.syncCommandDockVisibility();
  }

  private renderUpgradeGuide(choices: readonly Buff[]): void {
    this.upgradeGuide.replaceChildren();
    const spellCount = choices.filter((buff) => this.buffKind(buff) === "spell").length;
    const comboCount = choices.filter((buff) => this.buffKind(buff) === "combo").length;
    const passiveCount = choices.length - spellCount - comboCount;
    const summary = document.createElement("p");
    summary.textContent = this.manualUpgradeSequenceOpen
      ? "本次打开会把暂存升级一次性选完。高亮的是当前选择。"
      : "高亮的是当前选择。缺什么，拿什么。";
    const types = document.createElement("div");
    types.className = "survivor-upgrade-guide-types";
    ([
      ["选择", "A/D", "方向键也可"],
      ["确认", "Enter", "拿高亮卡"],
      ["待选", `${this.pendingUpgradeChoices}`, "本轮剩余"],
      ["牌型", `${spellCount}/${comboCount}/${passiveCount}`, "咒语/组合/被动"],
    ] as const).forEach(([label, count, copy]) => {
      const item = document.createElement("span");
      item.innerHTML = `<strong>${label}</strong><i>${count}</i><em>${copy}</em>`;
      types.append(item);
    });
    this.upgradeGuide.append(summary, types);
  }

  private buffKind(buff: Buff): "spell" | "combo" | "passive" {
    if (buff.spell) return "spell";
    if (buff.id.startsWith("combo-") || buff.id === "stat-chain") return "combo";
    return "passive";
  }

  private buffKindLabel(buff: Buff): string {
    const kind = this.buffKind(buff);
    if (kind === "spell") return "新咒语";
    if (kind === "combo") return "组合";
    return "被动";
  }

  private buffPickHint(buff: Buff): string {
    const kind = this.buffKind(buff);
    if (kind === "spell") return "加入施法栏，也能语音触发";
    if (kind === "combo") return "强化已有咒语套路";
    return "拿到后立即生效";
  }

  private addBuffFeedback(buff: Buff): void {
    const kind = this.buffKind(buff);
    const color = kind === "spell" ? "#8ee8ff" : kind === "combo" ? "#ffe27a" : "#7cff9b";
    this.addBurst(this.player.position, color, kind === "passive" ? 18 : 26);
  }

  private playSpellImpact(options: {
    position?: Vec2;
    glyph?: string;
    glyphCount?: number;
    glyphSize?: number;
    glyphSpread?: number;
    color: string;
    shake?: number;
    flash?: number;
    hitStop?: number;
    slowMo?: number;
    slowMoDuration?: number;
    zoom?: number;
    zoomDuration?: number;
    impactLines?: number;
    impactLineRadius?: number;
    radius?: number;
    particles?: number;
  }): void {
    const position = options.position ?? this.player.position;
    if (options.shake) {
      this.shakeScreen(options.shake, 0.22 + options.shake * 0.012);
    }
    if (options.flash) {
      this.flashScreen(options.color, 0.16, options.flash);
    }
    if (options.hitStop) {
      this.hitStopTime = Math.max(this.hitStopTime, options.hitStop);
    }
    if (options.slowMo) {
      this.playSlowMo(options.slowMo, options.slowMoDuration ?? 0.22);
    }
    if (options.zoom) {
      this.playZoomPunch(options.zoom, options.zoomDuration ?? 0.22);
    }
    if (options.impactLines) {
      this.addImpactLines(position, options.color, options.impactLines, options.impactLineRadius ?? options.radius ?? 120);
    }
    if (options.glyph) {
      const glyphCount = Math.max(1, Math.floor(options.glyphCount ?? 1));
      const glyphSize = options.glyphSize ?? options.radius ?? 86;
      const glyphSpread = options.glyphSpread ?? options.radius ?? 88;
      for (let i = 0; i < glyphCount; i += 1) {
        const angle = this.elapsed * 1.7 + (Math.PI * 2 * i) / glyphCount;
        const distanceRatio = glyphCount <= 1 ? 0 : 0.24 + (i % 3) * 0.16;
        const glyphPosition = glyphCount <= 1
          ? position
          : {
              x: clamp(position.x + Math.cos(angle) * glyphSpread * distanceRatio, 24, this.width - 24),
              y: clamp(position.y + Math.sin(angle) * glyphSpread * distanceRatio, 24, this.height - 24),
            };
        this.addSpellGlyph(glyphPosition, options.glyph, options.color, glyphCount <= 1 ? glyphSize : glyphSize * (0.86 + (i % 2) * 0.08));
      }
    }
    if (options.radius) {
      this.addSpellRing(position, options.radius * 1.32, options.color, undefined, 0.62);
    }
    if (options.particles) {
      this.addBurst(position, options.color, options.particles);
    }
  }

  private playHiddenComboImpact(
    name: string,
    color = "#ffe27a",
    options: {
      glyph?: string;
      glyphCount?: number;
      glyphSize?: number;
      glyphSpread?: number;
      shake?: number;
      flash?: number;
      hitStop?: number;
      slowMo?: number;
      slowMoDuration?: number;
      zoom?: number;
      zoomDuration?: number;
      impactLines?: number;
      impactLineRadius?: number;
      radius?: number;
      particles?: number;
    } = {},
  ): void {
    const glyph = options.glyph ?? (options.glyphCount && options.glyphCount > 1 ? [...name][0] : name.length > 6 ? name.slice(0, 6) : name);
    this.playSpellImpact({
      glyph,
      color,
      shake: options.shake ?? 11,
      flash: options.flash ?? 0.26,
      hitStop: options.hitStop ?? 0.075,
      slowMo: options.slowMo,
      slowMoDuration: options.slowMoDuration,
      zoom: options.zoom,
      zoomDuration: options.zoomDuration,
      impactLines: options.impactLines,
      impactLineRadius: options.impactLineRadius,
      radius: options.radius ?? 132,
      particles: options.particles ?? 34,
      glyphCount: options.glyphCount,
      glyphSize: options.glyphSize,
      glyphSpread: options.glyphSpread,
    });
  }

  private shakeScreen(strength: number, duration: number): void {
    const active = this.screenShakeTime > 0;
    this.screenShakeStrength = active ? Math.max(this.screenShakeStrength, strength) : strength;
    this.screenShakeDuration = active ? Math.max(this.screenShakeDuration, duration) : duration;
    this.screenShakeTime = Math.max(this.screenShakeTime, duration);
  }

  private flashScreen(color: string, duration: number, alpha: number): void {
    const active = this.screenFlashTime > 0;
    this.screenFlashRgb = this.colorToRgb(color);
    this.screenFlashDuration = active ? Math.max(this.screenFlashDuration, duration) : duration;
    this.screenFlashTime = Math.max(this.screenFlashTime, duration);
    this.screenFlashAlpha = active ? Math.max(this.screenFlashAlpha, alpha) : alpha;
  }

  private playSlowMo(scale: number, duration: number): void {
    const nextScale = clamp(scale, 0.12, 1);
    if (duration <= 0 || nextScale >= 1) return;
    const active = this.slowMoTime > 0;
    this.slowMoScale = active ? Math.min(this.slowMoScale, nextScale) : nextScale;
    this.slowMoDuration = active ? Math.max(this.slowMoDuration, duration) : duration;
    this.slowMoTime = Math.max(this.slowMoTime, duration);
  }

  private currentTimeScale(): number {
    if (this.slowMoTime <= 0 || this.slowMoDuration <= 0) return 1;
    const fade = clamp(this.slowMoTime / this.slowMoDuration, 0, 1);
    return 1 - (1 - this.slowMoScale) * fade * fade;
  }

  private playZoomPunch(strength: number, duration: number): void {
    if (duration <= 0 || strength <= 0) return;
    const nextStrength = clamp(strength, 0, 0.16);
    const active = this.zoomPunchTime > 0;
    this.zoomPunchStrength = active ? Math.max(this.zoomPunchStrength, nextStrength) : nextStrength;
    this.zoomPunchDuration = active ? Math.max(this.zoomPunchDuration, duration) : duration;
    this.zoomPunchTime = Math.max(this.zoomPunchTime, duration);
  }

  private currentZoomScale(): number {
    if (this.zoomPunchTime <= 0 || this.zoomPunchDuration <= 0) return 1;
    const fade = clamp(this.zoomPunchTime / this.zoomPunchDuration, 0, 1);
    return 1 + this.zoomPunchStrength * fade * fade;
  }

  private addImpactLines(position: Vec2, color: string, count: number, radius: number, life = 0.28): void {
    const safeCount = Math.max(1, Math.floor(count));
    const safeRadius = Math.max(48, radius);
    for (let i = 0; i < safeCount; i += 1) {
      const angle = (Math.PI * 2 * i) / safeCount + (Math.random() - 0.5) * 0.22;
      const lineLife = life + Math.random() * 0.08;
      this.impactLines.push({
        position: { ...position },
        angle,
        innerRadius: safeRadius * (0.22 + Math.random() * 0.16),
        outerRadius: safeRadius * (0.82 + Math.random() * 0.32),
        drift: safeRadius * (0.16 + Math.random() * 0.2),
        color,
        width: 1.8 + Math.random() * 2.8,
        life: lineLife,
        maxLife: lineLife,
      });
    }
    if (this.impactLines.length > 120) {
      this.impactLines.splice(0, this.impactLines.length - 120);
    }
  }

  private addLightningArc(from: Vec2, to: Vec2, width = 2.6, branches = 2, life = 0.22): void {
    this.lightningArcs.push({
      from: { ...from },
      to: { ...to },
      color: "#e5ff66",
      coreColor: "#f7fdff",
      life,
      maxLife: life,
      width,
      branches,
      seed: Math.random() * 1000,
    });
    if (this.lightningArcs.length > 72) {
      this.lightningArcs.splice(0, this.lightningArcs.length - 72);
    }
  }

  private addFrostWave(position: Vec2, radius: number, spokes = 12, color = "#9be7ff", life = 0.46): void {
    this.frostWaves.push({
      position: { ...position },
      radius: Math.max(44, radius),
      color,
      life,
      maxLife: life,
      spokes: Math.max(6, Math.floor(spokes)),
      seed: Math.random() * 1000,
    });
    if (this.frostWaves.length > 24) {
      this.frostWaves.splice(0, this.frostWaves.length - 24);
    }
  }

  private addFrostShards(position: Vec2, count: number, radius: number, color = "#bdf2ff", life = 0.34): void {
    const safeCount = Math.max(1, Math.floor(count));
    const safeRadius = Math.max(18, radius);
    for (let i = 0; i < safeCount; i += 1) {
      const angle = (Math.PI * 2 * i) / safeCount + (Math.random() - 0.5) * 0.5;
      const shardLife = life + Math.random() * 0.1;
      this.frostShards.push({
        position: {
          x: position.x + Math.cos(angle) * safeRadius * (0.12 + Math.random() * 0.18),
          y: position.y + Math.sin(angle) * safeRadius * (0.12 + Math.random() * 0.18),
        },
        angle,
        length: safeRadius * (0.28 + Math.random() * 0.34),
        width: 3 + Math.random() * 4,
        drift: safeRadius * (0.08 + Math.random() * 0.14),
        color,
        life: shardLife,
        maxLife: shardLife,
      });
    }
    if (this.frostShards.length > 160) {
      this.frostShards.splice(0, this.frostShards.length - 160);
    }
  }

  private addPlayerAfterimage(
    position: Vec2,
    color = "#8ee8ff",
    radius = this.effectivePlayerRadius(),
    life = 0.24,
    angle?: number,
    stretch = 1.24,
  ): void {
    const cannonSpeed = Math.hypot(this.player.cannonVelocity.x, this.player.cannonVelocity.y);
    const moveSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.y);
    const inferredAngle = cannonSpeed > 1
      ? Math.atan2(this.player.cannonVelocity.y, this.player.cannonVelocity.x)
      : moveSpeed > 1
        ? Math.atan2(this.player.velocity.y, this.player.velocity.x)
        : 0;
    this.playerAfterimages.push({
      position: { ...position },
      radius,
      color,
      angle: angle ?? inferredAngle,
      stretch,
      life,
      maxLife: life,
    });
    if (this.playerAfterimages.length > 36) {
      this.playerAfterimages.splice(0, this.playerAfterimages.length - 36);
    }
  }

  private colorToRgb(color: string): string {
    if (!color.startsWith("#")) return "255,255,255";
    const raw = color.slice(1);
    const full = raw.length === 3 ? [...raw].map((part) => `${part}${part}`).join("") : raw;
    const value = Number.parseInt(full, 16);
    if (!Number.isFinite(value)) return "255,255,255";
    return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
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
      "spell-calm",
      "spell-split",
      "spell-ricochet",
      "spell-bang",
      "spell-card-check",
      "spell-woqu",
      "spell-too-late",
      "spell-no-talk",
      "spell-received",
      "spell-unknown",
      "spell-body-shape",
      "spell-graceful",
      "spell-internal-drain",
      "spell-external-drain",
      "spell-old-self",
      "spell-see-tomorrow",
    ].includes(buff.id);
  }

  private hasSpell(spell: SpellKey): boolean {
    return this.unlockedSpells.has(spell);
  }

  private createBuffPool(options: { includeUnavailable?: boolean } = {}): Buff[] {
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
      { id: "spell-bang", title: "碎片：梆梆", description: "解锁关键词“梆梆”，单独施放是近身冲击拳；完整喊“你就说梆梆不梆梆”或“梆梆两拳”触发派生大招。", rarity: "bronze", spell: "bang", apply: () => { this.bangLevel += 1; } },
      { id: "spell-skillgo", title: "咒语：技能五子棋", description: "解锁五枚短时棋子炮台，落子无悔。", rarity: "diamond", spell: "skillGo", apply: () => { this.skillGoLevel += 1; } },
      { id: "spell-xiexiu", title: "邪修路线", description: "解锁“邪修”，随机施放已拥有攻击咒语，声能恢复 +1.6。", rarity: "gold", spell: "xiexiu", apply: () => { this.energyRegen += 1.6; } },
      { id: "spell-serious", title: "当个事儿办", description: "解锁辅助锁敌，短时间认真处理危险目标。", rarity: "bronze", spell: "serious", apply: () => { this.attackRate *= 0.96; } },
      { id: "spell-wealth", title: "来财", description: "解锁“来财”，大范围吸取经验，经验返能明显提高。", rarity: "bronze", spell: "wealth", apply: () => { this.magnetRadius += 20; this.dropEnergyRatio += 0.06; } },
      { id: "spell-calm", title: "从容", description: "解锁优雅闪避，位移更短但冷静返能，声能恢复 +2。", rarity: "bronze", spell: "calm", apply: () => { this.energyRegen += 2; } },
      { id: "spell-scramble", title: "连滚带爬", description: "解锁残血逃生咒语，狼狈但很有效。", rarity: "gold", spell: "scramble", apply: () => { this.player.maxHp += 6; this.player.hp += 6; } },
      { id: "spell-card-check", title: "碎片：验牌", description: "解锁“验牌”，标记危险敌人，标记期间承受更高伤害；完整喊“我要验牌”翻全场危险牌。", rarity: "bronze", spell: "cardCheck", apply: () => { this.attackDamage += 1; } },
      { id: "spell-woqu", title: "碎片：我去", description: "解锁“我去”，短促安全闪避；可与“不早说”拼出回溯 Combo。", rarity: "bronze", spell: "woqu", apply: () => { this.moveSpeed += 5; } },
      { id: "spell-too-late", title: "碎片：不早说", description: "解锁“不早说”，返还上一普通咒语部分声能；可与“我去”拼出回溯 Combo。", rarity: "bronze", spell: "tooLate", apply: () => { this.energyRegen += 0.6; } },
      { id: "spell-no-talk", title: "碎片：不讲", description: "解锁“不讲”，打断敌人蓄力并清近身弹幕；完整喊“不讲不讲”展开拒绝沟通领域。", rarity: "bronze", spell: "noTalk", apply: () => { this.maxEnergy += 4; } },
      { id: "spell-received", title: "碎片：收到", description: "解锁“收到”，弱化复读上一普通咒语；完整喊“收到，收到”复读最近两句。", rarity: "bronze", spell: "received", apply: () => { this.energyRegen += 0.5; } },
      { id: "spell-unknown", title: "碎片：不知道", description: "解锁“不知道”，短暂丢锁和清弹；可拼“不知道，我的身材很曼妙”。", rarity: "bronze", spell: "unknown", apply: () => { this.player.maxHp += 2; this.player.hp += 2; } },
      { id: "spell-body-shape", title: "碎片：身材", description: "解锁“身材”，短时间缩小受击判定；可拼“不知道，我的身材很曼妙”。", rarity: "bronze", spell: "bodyShape", apply: () => { this.moveSpeed += 4; } },
      { id: "spell-graceful", title: "碎片：曼妙", description: "解锁“曼妙”，优雅侧滑并获得擦弹回能窗口；可拼“不知道，我的身材很曼妙”。", rarity: "bronze", spell: "graceful", apply: () => { this.energyRegen += 0.5; } },
      { id: "spell-internal-drain", title: "碎片：内耗", description: "解锁“内耗”，消耗少量状态换声能和短爆发；可与“外耗”拼压力转嫁。", rarity: "bronze", spell: "internalDrain", apply: () => { this.maxEnergy += 5; } },
      { id: "spell-external-drain", title: "碎片：外耗", description: "解锁“外耗”，把近身怪群推开；可与“内耗”拼压力转嫁。", rarity: "bronze", spell: "externalDrain", apply: () => { this.explosionRadius += 5; } },
      { id: "spell-old-self", title: "碎片：老己", description: "解锁“老己”，回复 HP 并给护盾；可与“明天见”拼今晚不死保险。", rarity: "bronze", spell: "oldSelf", apply: () => { this.player.maxHp += 3; this.player.hp += 3; } },
      { id: "spell-see-tomorrow", title: "碎片：明天见", description: "解锁“明天见”，挂延迟回复；可与“老己”拼今晚不死保险。", rarity: "bronze", spell: "seeTomorrow", apply: () => { this.hpRegen += 0.12; } },
      { id: "spell-urgent-cry", title: "你已急哭", description: "解锁独立乐子咒语“你已急哭”，让附近敌人红温破防并干扰远程火力。", rarity: "gold", spell: "urgentCry", apply: () => { this.attackDamage += 2; this.maxEnergy += 4; } },
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
      { id: "weapon-guard-damage", title: "炮塔火力", description: "小炮塔子弹伤害 +3。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.guardTurretDamage += 3; } },
      { id: "weapon-guard-rate", title: "炮塔连发", description: "小炮塔射速提高。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.guardTurretRate *= 0.86; } },
      { id: "weapon-guard-range", title: "炮塔射程", description: "小炮塔索敌范围 +70。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.guardTurretRange += 70; } },
      { id: "weapon-guard-ricochet", title: "哨戒跳弹", description: "小炮塔数量 +1，弹射范围 +20，开启弹射时炮塔子弹也会跳。", rarity: "gold", phase: "combo", maxStacks: 3, apply: () => { this.guardTurretCount += 1; this.ricochetRange += 20; } },
      { id: "weapon-blade", title: "旋转刀刃", description: "刀刃数量 +2，贴身切开怪潮。", rarity: "bronze", phase: "starter", maxStacks: 3, apply: () => { this.bladeCount += 2; this.bladeDamage += 1; } },
      { id: "weapon-blade-count", title: "刀刃数量", description: "刀刃 +1，近身覆盖更稳定。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.bladeCount += 1; } },
      { id: "weapon-blade-radius", title: "刀圈外扩", description: "刀刃旋转半径 +10。", rarity: "bronze", phase: "branch", maxStacks: 4, apply: () => { this.bladeRadius += 10; } },
      { id: "weapon-blade-damage", title: "刀刃锋利", description: "刀刃伤害 +3。", rarity: "bronze", phase: "branch", maxStacks: 5, apply: () => { this.bladeDamage += 3; } },
      { id: "weapon-blade-motor", title: "高速刀盘", description: "刀刃转速提高。", rarity: "gold", phase: "branch", maxStacks: 4, apply: () => { this.bladeSpinSpeed += 0.9; } },
      { id: "combo-blade-freeze", title: "冰刀护身", description: "刀刃伤害提高；冻结 Buff 开启时，刀刃会短暂冻住命中的敌人。", rarity: "gold", apply: () => { this.bladeDamage += 2; this.freezeDuration += 0.15; } },
      { id: "combo-blade-boom", title: "爆裂刀盘", description: "刀刃伤害提高；爆炸 Buff 开启时，刀刃偶尔触发小爆破。", rarity: "gold", apply: () => { this.bladeDamage += 2; this.explosionRadius += 8; } },
      { id: "survive-hp", title: "先把血抬上来", description: "生命上限 +18，并立即回复 18。", rarity: "bronze", apply: () => { this.player.maxHp += 18; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 18); } },
      { id: "survive-armor", title: "安全帽", description: "受到的每次伤害 -2，落地也体面一点。", rarity: "gold", apply: () => { this.armor += 2; } },
      { id: "survive-regen", title: "慢慢缓过来", description: "每秒恢复少量 HP，适合操作不过来时稳住。", rarity: "gold", apply: () => { this.hpRegen += 0.75; } },
      { id: "stat-energy", title: "气口变长", description: "声能上限 +24，声能恢复 +3.5，经验返能提高，并立即回复 18。", rarity: "bronze", apply: () => { this.maxEnergy += 24; this.energyRegen += 3.5; this.dropEnergyRatio += 0.04; this.energy = clamp(this.energy + 18, 0, this.maxEnergy); } },
      { id: "stat-damage", title: "嘴比炮快", description: "自动攻击伤害 +2，声能上限 +4。", rarity: "bronze", apply: () => { this.attackDamage += 2; this.maxEnergy += 4; } },
      { id: "stat-rate", title: "急促咏唱", description: "自动攻击更快，并附带一点移动速度。", rarity: "bronze", apply: () => { this.attackRate *= 0.9; this.moveSpeed += 12; } },
      { id: "stat-cannon", title: "炮弹保修", description: "人间大炮充能更快，靶心怪奖励更多。", rarity: "gold", apply: () => { this.cannonMeter = Math.min(100, this.cannonMeter + 35); this.spawnBudget += 1.2; } },
      { id: "stat-chain", title: "终音爆破", description: "四个不同咒语链返能大幅提高，爆炸范围 +16。", rarity: "diamond", apply: () => { this.maxEnergy += 12; this.chainEnergyBonus += 10; this.explosionRadius += 16; } },
    ];
    if (options.includeUnavailable) return buffs;
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
      "weapon-guard-ricochet": "ricochet",
      "stat-bang-plus": "bang",
      "stat-skillgo-plus": "skillGo",
    };
    const required = requirements[buff.id];
    const spellReady = !required || (Array.isArray(required) ? required.every((spell) => this.hasSpell(spell)) : this.hasSpell(required));
    if (!spellReady) return false;

    const ownedRequirements: Record<string, string | string[]> = {
      "weapon-guard-damage": "weapon-guard-turret",
      "weapon-guard-rate": "weapon-guard-turret",
      "weapon-guard-range": "weapon-guard-turret",
      "weapon-guard-ricochet": "weapon-guard-turret",
      "weapon-blade-count": "weapon-blade",
      "weapon-blade-radius": "weapon-blade",
      "weapon-blade-damage": "weapon-blade",
      "weapon-blade-motor": "weapon-blade",
      "combo-blade-freeze": "weapon-blade",
      "combo-blade-boom": "weapon-blade",
    };
    const ownedRequired = ownedRequirements[buff.id];
    if (!ownedRequired) return true;
    const hasOwnedBuff = (id: string) => (this.ownedBuffs.get(id) ?? 0) > 0;
    return Array.isArray(ownedRequired) ? ownedRequired.every(hasOwnedBuff) : hasOwnedBuff(ownedRequired);
  }

  private isMidPowerBuff(buff: Buff): boolean {
    return ["spell-lightning", "spell-pierce", "spell-focus", "spell-wealth", "spell-calm", "stat-ricochet-count", "stat-ricochet-range", "stat-ricochet-damage", "stat-ricochet-spark", "stat-ricochet-bloom", "combo-frozen-shatter", "combo-pierce-ricochet", "combo-split-ricochet", "weapon-guard-damage", "weapon-guard-rate", "weapon-guard-range", "weapon-guard-ricochet", "weapon-blade-count", "weapon-blade-radius", "weapon-blade-damage", "weapon-blade-motor", "combo-blade-freeze", "combo-blade-boom"].includes(buff.id);
  }

  private isLatePowerBuff(buff: Buff): boolean {
    return ["spell-skillgo", "spell-xiexiu", "spell-serious", "spell-scramble", "stat-chain", "combo-lightning-burst", "combo-cannon-shards"].includes(buff.id);
  }

  private pickTarget(): Enemy | null {
    const focused = this.focusedTarget();
    if (focused) return focused;
    return this.nearestEnemy(this.player.position, Infinity);
  }

  private focusedTarget(): Enemy | null {
    if (this.activeMods.focusTime <= 0 && this.activeMods.seriousTime <= 0) return null;
    let best: Enemy | null = null;
    let bestScore = -Infinity;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const score = this.targetPriorityScore(enemy);
      if (score > bestScore) {
        best = enemy;
        bestScore = score;
      }
    }
    return best;
  }

  private targetPriorityScore(enemy: Enemy): number {
    const typeScore =
      (enemy.type === "silencer" ? 4.2 : 0) +
      (enemy.type === "ranged" ? 2.6 : 0) +
      (enemy.type === "target" ? 2.4 : 0) +
      (enemy.type === "brute" ? 1.2 : 0);
    const distancePenalty = distance(enemy.position, this.player.position) / 520;
    const seriousBonus = this.activeMods.seriousTime > 0 ? 2.1 : 0;
    return typeScore + enemy.hp / 32 + seriousBonus - distancePenalty;
  }

  private aimAngleToPrimaryTarget(): number {
    const target = this.pickTarget();
    if (target) {
      return Math.atan2(target.position.y - this.player.position.y, target.position.x - this.player.position.x);
    }
    const pointerDelta = { x: this.pointer.x - this.player.position.x, y: this.pointer.y - this.player.position.y };
    if (Math.hypot(pointerDelta.x, pointerDelta.y) > 16) {
      return Math.atan2(pointerDelta.y, pointerDelta.x);
    }
    return -Math.PI / 2;
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
      y: clamp(this.player.position.y + Math.sin(angle) * radius, 18, this.playerMaxY(18)),
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
    return this.enemies.some((enemy) =>
      enemy.type === "silencer" &&
      distance(enemy.position, this.player.position) < 145 &&
      !this.activeRefusalZone(enemy.position)
    );
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

  private addImpactBurst(position: Vec2, color: string, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        position: { ...position },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: 1.5 + Math.random() * 2.5,
        color,
        life: 0.18 + Math.random() * 0.18,
        maxLife: 0.36,
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

  private addSpellRing(position: Vec2, radius: number, color: string, label?: string, life = 0.82): void {
    this.spellCues.push({
      kind: "ring",
      position: { ...position },
      radius,
      color,
      label,
      life,
      maxLife: life,
    });
  }

  private addSpellFan(angle: number, spread: number, lines: number, radius: number, color: string, label: string): void {
    this.spellCues.push({
      kind: "fan",
      position: { ...this.player.position },
      radius,
      color,
      label,
      angle,
      spread,
      lines,
      life: 0.72,
      maxLife: 0.72,
    });
  }

  private addSpellGlyph(position: Vec2, label: string, color: string, size: number, life = 0.58): void {
    this.spellCues.push({
      kind: "glyph",
      position: { ...position },
      radius: size,
      color,
      label,
      life,
      maxLife: life,
    });
  }

  private addFallingSpellGlyph(position: Vec2, label: string, color: string, size: number, delay: number, life = 0.72, fallDistance = 150): void {
    this.spellCues.push({
      kind: "fallGlyph",
      position: { ...position },
      radius: size,
      color,
      label,
      delay,
      fallDistance,
      life,
      maxLife: life,
    });
  }

  private addPunchSpellGlyph(
    position: Vec2,
    label: string,
    color: string,
    size: number,
    direction: Vec2,
    delay: number,
    life = 0.82,
    amplitude = 76,
    cycles = 4,
  ): void {
    this.spellCues.push({
      kind: "punchGlyph",
      position: { ...position },
      radius: size,
      color,
      label,
      direction: normalize(direction),
      delay,
      amplitude,
      cycles,
      life,
      maxLife: life,
    });
  }

  private addSlamSpellGlyph(
    position: Vec2,
    label: string,
    color: string,
    size: number,
    delay: number,
    life = 0.78,
    startScale = 3.4,
    endScale = 0.95,
  ): void {
    this.spellCues.push({
      kind: "slamGlyph",
      position: { ...position },
      radius: size,
      color,
      label,
      delay,
      startScale,
      endScale,
      life,
      maxLife: life,
    });
  }

  private addWeakenSpellGlyph(
    position: Vec2,
    label: string,
    color: string,
    size: number,
    delay: number,
    life = 0.62,
    startScale = 2.1,
    endScale = 0.62,
  ): void {
    this.spellCues.push({
      kind: "weakenGlyph",
      position: { ...position },
      radius: size,
      color,
      label,
      delay,
      startScale,
      endScale,
      life,
      maxLife: life,
    });
  }

  private addSpellCard(position: Vec2, label: string, color: string, size: number, delay: number, life = 0.84, accent = "#f8f1d1"): void {
    this.spellCues.push({
      kind: "card",
      position: { ...position },
      radius: size,
      color,
      label,
      delay,
      accent,
      life,
      maxLife: life,
    });
  }

  private say(message: string): void {
    this.statusLine.textContent = message;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const shake = this.currentShakeOffset();
    const zoom = this.currentZoomScale();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    if (zoom !== 1) {
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-this.width / 2, -this.height / 2);
    }
    this.renderer.render(ctx, this.getRenderState());
    this.renderTooLateZones(ctx);
    this.renderRefusalZones(ctx);
    this.renderReceivedCharge(ctx);
    this.renderTomorrowInsurance(ctx);
    this.renderSeriousCases(ctx);
    this.renderFrostEffects(ctx);
    this.renderLightningArcs(ctx);
    this.renderImpactLines(ctx);
    this.renderSpellCues(ctx);
    ctx.restore();
    this.renderVoiceDanmaku(ctx);
    this.renderComboFlash(ctx);
    this.renderScreenFlash(ctx);
    this.renderHudText();
  }

  private currentShakeOffset(): Vec2 {
    const comboShake = this.screenShake > 0 ? this.screenShakePower * clamp(this.screenShake / 0.44, 0, 1) : 0;
    if ((this.screenShakeTime <= 0 || this.screenShakeDuration <= 0) && comboShake <= 0) {
      return { x: 0, y: 0 };
    }
    const fade = this.screenShakeDuration > 0 ? this.screenShakeTime / this.screenShakeDuration : 0;
    const strength = comboShake + this.screenShakeStrength * fade * fade;
    return {
      x: (Math.random() * 2 - 1) * strength,
      y: (Math.random() * 2 - 1) * strength,
    };
  }

  private renderFrostEffects(ctx: CanvasRenderingContext2D): void {
    if (this.frostWaves.length === 0 && this.frostShards.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const wave of this.frostWaves) {
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      const progress = 1 - alpha;
      const radius = wave.radius * (0.18 + progress * 0.92);
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = wave.color;
      ctx.fillStyle = wave.color;
      ctx.shadowColor = wave.color;
      ctx.shadowBlur = 20 * alpha;
      ctx.lineWidth = 2.2 + alpha * 1.4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      for (let i = 0; i <= wave.spokes; i += 1) {
        const angle = (Math.PI * 2 * i) / wave.spokes + wave.seed * 0.01;
        const wobble = 1 + (this.frostNoise(wave.seed, i) - 0.5) * 0.12;
        const x = wave.position.x + Math.cos(angle) * radius * wobble;
        const y = wave.position.y + Math.sin(angle) * radius * wobble;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = alpha * 0.18;
      ctx.beginPath();
      ctx.arc(wave.position.x, wave.position.y, radius * 0.72, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.72;
      ctx.lineWidth = 1.4 + alpha;
      const crackCount = Math.min(18, wave.spokes);
      for (let i = 0; i < crackCount; i += 1) {
        const angle = (Math.PI * 2 * i) / crackCount + wave.seed * 0.017;
        const start = radius * (0.26 + this.frostNoise(wave.seed + 13, i) * 0.18);
        const mid = radius * (0.58 + this.frostNoise(wave.seed + 29, i) * 0.14);
        const end = radius * (0.86 + this.frostNoise(wave.seed + 47, i) * 0.12);
        const bend = (this.frostNoise(wave.seed + 61, i) - 0.5) * 0.22;
        ctx.beginPath();
        ctx.moveTo(wave.position.x + Math.cos(angle) * start, wave.position.y + Math.sin(angle) * start);
        ctx.lineTo(wave.position.x + Math.cos(angle + bend) * mid, wave.position.y + Math.sin(angle + bend) * mid);
        ctx.lineTo(wave.position.x + Math.cos(angle - bend * 0.7) * end, wave.position.y + Math.sin(angle - bend * 0.7) * end);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const shard of this.frostShards) {
      const alpha = clamp(shard.life / shard.maxLife, 0, 1);
      const progress = 1 - alpha;
      const x = shard.position.x + Math.cos(shard.angle) * shard.drift * progress;
      const y = shard.position.y + Math.sin(shard.angle) * shard.drift * progress;
      ctx.save();
      ctx.globalAlpha = alpha * 0.78;
      ctx.translate(x, y);
      ctx.rotate(shard.angle);
      ctx.fillStyle = shard.color;
      ctx.strokeStyle = "rgba(247, 253, 255, 0.92)";
      ctx.shadowColor = shard.color;
      ctx.shadowBlur = 15 * alpha;
      ctx.lineWidth = 1.2;
      const length = shard.length * (0.65 + progress * 0.35);
      ctx.beginPath();
      ctx.moveTo(length * 0.58, 0);
      ctx.lineTo(-length * 0.24, -shard.width);
      ctx.lineTo(-length * 0.1, 0);
      ctx.lineTo(-length * 0.24, shard.width);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private frostNoise(seed: number, index: number): number {
    const value = Math.sin(seed * 17.371 + index * 51.917 + this.elapsed * 9.3) * 24634.6345;
    return value - Math.floor(value);
  }

  private renderLightningArcs(ctx: CanvasRenderingContext2D): void {
    if (this.lightningArcs.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const arc of this.lightningArcs) {
      const alpha = clamp(arc.life / arc.maxLife, 0, 1);
      const dist = distance(arc.from, arc.to);
      if (dist < 1) continue;
      const dx = (arc.to.x - arc.from.x) / dist;
      const dy = (arc.to.y - arc.from.y) / dist;
      const nx = -dy;
      const ny = dx;
      const segments = clamp(Math.round(dist / 38), 4, 11);
      const jitter = Math.min(32, dist * 0.075) * (0.45 + alpha * 0.55);
      const points: Vec2[] = [];
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const offset = i === 0 || i === segments ? 0 : (this.lightningNoise(arc.seed, i) * 2 - 1) * jitter;
        points.push({
          x: arc.from.x + (arc.to.x - arc.from.x) * t + nx * offset,
          y: arc.from.y + (arc.to.y - arc.from.y) * t + ny * offset,
        });
      }

      ctx.globalAlpha = alpha * 0.42;
      ctx.strokeStyle = "#8ff8ff";
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 22 * alpha;
      ctx.lineWidth = arc.width * 3.1;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = arc.width * 1.45;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = arc.coreColor;
      ctx.lineWidth = Math.max(1.1, arc.width * 0.52);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.68;
      ctx.strokeStyle = "#f7fdff";
      ctx.lineWidth = Math.max(0.9, arc.width * 0.38);
      for (let i = 0; i < arc.branches; i += 1) {
        const sourceIndex = Math.max(1, Math.min(points.length - 2, 1 + Math.floor(this.lightningNoise(arc.seed + 9, i) * (points.length - 2))));
        const start = points[sourceIndex];
        const branchSide = this.lightningNoise(arc.seed + 27, i) > 0.5 ? 1 : -1;
        const branchLength = Math.min(68, dist * (0.15 + this.lightningNoise(arc.seed + 41, i) * 0.12));
        const branchAngle = Math.atan2(dy, dx) + branchSide * (0.72 + this.lightningNoise(arc.seed + 63, i) * 0.56);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(start.x + Math.cos(branchAngle) * branchLength, start.y + Math.sin(branchAngle) * branchLength);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private lightningNoise(seed: number, index: number): number {
    const value = Math.sin(seed * 12.9898 + index * 78.233 + this.elapsed * 38.17) * 43758.5453;
    return value - Math.floor(value);
  }

  private renderImpactLines(ctx: CanvasRenderingContext2D): void {
    if (this.impactLines.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const line of this.impactLines) {
      const alpha = clamp(line.life / line.maxLife, 0, 1);
      const progress = 1 - alpha;
      const inner = line.innerRadius + line.drift * progress;
      const outer = line.outerRadius + line.drift * (0.25 + progress);
      ctx.globalAlpha = alpha * alpha * 0.85;
      ctx.strokeStyle = line.color;
      ctx.shadowColor = line.color;
      ctx.shadowBlur = 18 * alpha;
      ctx.lineWidth = line.width * (0.7 + alpha * 0.6);
      ctx.beginPath();
      ctx.moveTo(line.position.x + Math.cos(line.angle) * inner, line.position.y + Math.sin(line.angle) * inner);
      ctx.lineTo(line.position.x + Math.cos(line.angle) * outer, line.position.y + Math.sin(line.angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderScreenFlash(ctx: CanvasRenderingContext2D): void {
    if (this.screenFlashTime <= 0 || this.screenFlashDuration <= 0 || this.screenFlashAlpha <= 0) {
      return;
    }
    const fade = this.screenFlashTime / this.screenFlashDuration;
    ctx.save();
    ctx.globalAlpha = this.screenFlashAlpha * fade * fade;
    ctx.fillStyle = `rgb(${this.screenFlashRgb})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  private getRenderState(): SurvivorRenderState {
    return {
      width: this.width,
      height: this.height,
      elapsed: this.elapsed,
      player: { ...this.player, radius: this.effectivePlayerRadius() },
      enemies: this.enemies,
      projectiles: this.projectiles,
      enemyShots: this.enemyShots,
      drops: this.drops,
      particles: this.particles,
      afterimages: this.playerAfterimages,
      turrets: this.turrets,
      activeMods: this.activeMods,
      cannonTarget: this.cannonTarget,
      cannonCharge: this.cannonCharge,
      splitAngle: this.splitAngle,
      magnetRadius: this.magnetRadius,
      guardTurretCount: this.guardTurretCount,
      bladeCount: this.bladeCount,
      bladeAngle: this.bladeAngle,
      bladeRadius: this.bladeRadius,
      playerSilenced: this.isPlayerSilenced(),
    };
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

  private renderTooLateZones(ctx: CanvasRenderingContext2D): void {
    if (this.tooLateZones.length === 0) return;
    for (const zone of this.tooLateZones) {
      const progress = 1 - clamp(zone.life / zone.maxLife, 0, 1);
      const alpha = clamp(zone.life / zone.maxLife, 0, 1);
      const pulse = 1 + Math.sin(this.elapsed * 9) * 0.025;
      const radius = zone.radius * pulse;
      ctx.save();
      ctx.translate(zone.center.x, zone.center.y);
      ctx.globalAlpha = alpha * 0.2;
      ctx.fillStyle = "#9cffd0";
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.86 + progress * 0.08), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.62;
      ctx.strokeStyle = "rgba(156, 255, 208, 0.78)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([10, 9]);
      ctx.lineDashOffset = -this.elapsed * 34;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = alpha * 0.34;
      ctx.strokeStyle = "rgba(124, 255, 155, 0.74)";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, radius * (0.28 + i * 0.18 + progress * 0.08), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private renderRefusalZones(ctx: CanvasRenderingContext2D): void {
    if (this.refusalZones.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const zone of this.refusalZones) {
      const alpha = clamp(zone.life / zone.maxLife, 0, 1);
      const progress = 1 - alpha;
      const pulse = 1 + Math.sin(this.elapsed * 7.5) * 0.025;
      const radius = zone.radius * pulse;
      ctx.save();
      ctx.translate(zone.center.x, zone.center.y);
      ctx.globalAlpha = alpha * 0.16;
      ctx.fillStyle = "#e9fbff";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.62;
      ctx.strokeStyle = "rgba(233, 251, 255, 0.86)";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([18, 10]);
      ctx.lineDashOffset = -this.elapsed * 64;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([6, 9]);
      ctx.lineDashOffset = this.elapsed * 38;
      ctx.strokeStyle = "rgba(102, 224, 255, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.68 + progress * 0.04), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = alpha * 0.34;
      ctx.strokeStyle = "rgba(233, 251, 255, 0.8)";
      ctx.lineWidth = 5;
      for (let i = 0; i < 4; i += 1) {
        const y = (i - 1.5) * 38 + Math.sin(this.elapsed * 3 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.74, y);
        ctx.lineTo(radius * 0.74, y);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha * 0.88;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 34px Microsoft YaHei, sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(8, 18, 24, 0.86)";
      ctx.fillStyle = "#e9fbff";
      ctx.shadowColor = "#66e0ff";
      ctx.shadowBlur = 16;
      ctx.strokeText("拒绝沟通", 0, -radius * 0.22);
      ctx.fillText("拒绝沟通", 0, -radius * 0.22);
      ctx.font = "800 20px Microsoft YaHei, sans-serif";
      ctx.globalAlpha = alpha * 0.72;
      ctx.strokeText(`闭麦 ${zone.interrupted} / 清弹 ${zone.clearedShots}`, 0, -radius * 0.22 + 34);
      ctx.fillText(`闭麦 ${zone.interrupted} / 清弹 ${zone.clearedShots}`, 0, -radius * 0.22 + 34);
      ctx.globalCompositeOperation = "lighter";
      ctx.restore();
    }
    ctx.restore();
  }

  private renderReceivedCharge(ctx: CanvasRenderingContext2D): void {
    const charge = this.receivedCharge;
    if (!charge) return;
    const alpha = clamp(charge.life / charge.maxLife, 0, 1);
    const progress = 1 - alpha;
    const width = 230;
    const height = 58;
    const x = clamp(this.player.position.x - width / 2, 16, this.width - width - 16);
    const y = clamp(this.player.position.y - 132, 18, this.playerMaxY(18));
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.shadowColor = "#7cff9b";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(8, 24, 18, 0.78)";
    ctx.strokeStyle = "rgba(124, 255, 155, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(124, 255, 155, 0.18)";
    ctx.fillRect(x + 10, y + height - 13, (width - 20) * alpha, 5);
    ctx.fillStyle = "#7cff9b";
    ctx.font = "800 15px Microsoft YaHei, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`收到储能 ${Math.ceil(charge.life)}s`, x + 12, y + 17);
    ctx.fillStyle = "#e9fbff";
    ctx.font = "700 12px Microsoft YaHei, sans-serif";
    const labels = charge.spells.length > 0 ? charge.spells.map((spell) => SPELL_NAMES[spell]).join(" / ") : "等待普通咒语";
    ctx.fillText(labels.slice(0, 18), x + 12, y + 38);

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.28 + Math.sin(this.elapsed * 7) * 0.08;
    ctx.strokeStyle = "#e9fbff";
    ctx.beginPath();
    ctx.arc(this.player.position.x, this.player.position.y, 72 + progress * 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderTomorrowInsurance(ctx: CanvasRenderingContext2D): void {
    if (this.fatalInsuranceTime <= 0) return;
    const maxTime = Math.max(this.fatalInsuranceMaxTime, this.fatalInsuranceTime, 1);
    const alpha = clamp(this.fatalInsuranceTime / maxTime, 0, 1);
    const width = 216;
    const height = 54;
    const x = clamp(this.player.position.x - width / 2, 16, this.width - width - 16);
    const y = clamp(this.player.position.y - 196, 18, this.playerMaxY(18));
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = "#f8f1d1";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(28, 24, 12, 0.78)";
    ctx.strokeStyle = "rgba(248, 241, 209, 0.86)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(124, 255, 155, 0.2)";
    ctx.fillRect(x + 10, y + height - 12, (width - 20) * alpha, 5);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "900 15px Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#f8f1d1";
    ctx.fillText("明天见保险", x + 12, y + 17);
    ctx.font = "800 13px Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#7cff9b";
    ctx.fillText(`今晚不死 ${Math.ceil(this.fatalInsuranceTime)}s`, x + 12, y + 36);

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.22 + Math.sin(this.elapsed * 5.2) * 0.06;
    ctx.strokeStyle = "#f8f1d1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.player.position.x, this.player.position.y, 92 + (1 - alpha) * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderSeriousCases(ctx: CanvasRenderingContext2D): void {
    if (this.seriousCases.length === 0) return;
    ctx.save();
    for (const item of this.seriousCases) {
      const enemy = this.enemies.find((candidate) => candidate.id === item.enemyId && candidate.hp > 0);
      if (!enemy) continue;
      const progress = clamp(item.progress, 0, 1);
      const width = enemy.radius * 3.4;
      const x = enemy.position.x - width / 2;
      const y = enemy.position.y - enemy.radius - 42;
      ctx.globalAlpha = clamp(item.life / item.maxLife, 0.25, 1);
      ctx.fillStyle = "rgba(30, 18, 8, 0.78)";
      ctx.strokeStyle = "rgba(255, 241, 166, 0.86)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(x, y, width, 18, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff1a6";
      ctx.fillRect(x + 3, y + 13, (width - 6) * progress, 3);
      ctx.font = "800 11px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff1a6";
      ctx.fillText(progress >= 0.82 ? "办结中" : "处理中", enemy.position.x, y + 8);
    }
    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (this.cannonTarget) {
      const target = this.cannonTarget;
      const pulse = 1 + Math.sin(this.elapsed * 8) * 0.08;
      ctx.strokeStyle = "rgba(255, 226, 122, 0.92)";
      ctx.lineWidth = 3 + this.cannonCharge * 1.4;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -this.elapsed * 64;
      ctx.beginPath();
      ctx.moveTo(this.player.position.x, this.player.position.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255, 155, 74, 0.54)";
      ctx.lineWidth = 8 + this.cannonCharge * 2;
      ctx.beginPath();
      ctx.moveTo(this.player.position.x, this.player.position.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 226, 122, 0.18)";
      ctx.strokeStyle = "rgba(255, 226, 122, 0.8)";
      ctx.lineWidth = 2.5 + this.cannonCharge * 0.8;
      ctx.beginPath();
      ctx.arc(target.x, target.y, (26 + this.cannonCharge * 12) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 155, 74, 0.62)";
      ctx.beginPath();
      ctx.arc(target.x, target.y, (52 + this.cannonCharge * 22) * (1.04 - (pulse - 1)), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(this.player.position.x, this.player.position.y);
    const cannon = this.player.cannonTime > 0;
    const bodyRadius = this.effectivePlayerRadius();
    if (this.activeMods.slimTime > 0 || this.activeMods.gracefulTime > 0) {
      ctx.strokeStyle = this.activeMods.gracefulTime > 0 ? "rgba(156, 255, 208, 0.72)" : "rgba(210, 140, 255, 0.62)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, bodyRadius + 8 + Math.sin(this.elapsed * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = cannon ? "#ffe27a" : "#ffffff";
    ctx.shadowColor = cannon ? "#ff9b4a" : "#66e0ff";
    ctx.shadowBlur = cannon ? 34 : 14;
    ctx.beginPath();
    ctx.arc(0, 0, (cannon ? this.player.radius : bodyRadius) + (cannon ? 9 + this.cannonLaunchCharge * 2 : 0), 0, Math.PI * 2);
    ctx.fill();
    if (cannon) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 155, 74, 0.78)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 18 + Math.sin(this.elapsed * 18) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 226, 122, 0.48)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 30 + this.cannonLaunchCharge * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
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
    const focused = this.focusedTarget();
    for (const enemy of this.enemies) {
      const cfg = ENEMY_CONFIG[enemy.type];
      const isFocused = focused?.id === enemy.id;
      const isMarked = this.cardMarkTime > 0 && this.markedEnemyId === enemy.id;
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
      if (isFocused) {
        const pulse = 1 + Math.sin(this.elapsed * 9) * 0.08;
        const markerColor = this.activeMods.seriousTime > 0 ? "rgba(255, 241, 166, 0.95)" : "rgba(142, 232, 255, 0.95)";
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, (enemy.radius + 11) * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = markerColor;
        ctx.font = "900 13px Microsoft YaHei, sans-serif";
        ctx.fillText(this.activeMods.seriousTime > 0 ? "办" : "锁", 0, -enemy.radius - 23);
      }
      if (isMarked) {
        const pulse = 1 + Math.sin(this.elapsed * 11) * 0.08;
        ctx.strokeStyle = "rgba(255, 79, 109, 0.95)";
        ctx.fillStyle = "rgba(248, 241, 209, 0.92)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-enemy.radius - 8, -enemy.radius - 28, 20 * pulse, 26 * pulse, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#6c1530";
        ctx.font = "900 13px Microsoft YaHei, sans-serif";
        ctx.fillText("验", 2, -enemy.radius - 14);
      }
      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const projectile of this.projectiles) {
      const color = projectile.color ?? (projectile.explosion ? "#ffb15a" : projectile.freeze ? "#a8ecff" : projectile.lightning ? "#e5ff66" : "#66e0ff");
      const speed = Math.max(1, Math.hypot(projectile.velocity.x, projectile.velocity.y));
      const direction = { x: projectile.velocity.x / speed, y: projectile.velocity.y / speed };
      const isPiercing = projectile.pierce > 0;
      const isRicochet = projectile.ricochet > 0;
      ctx.save();
      ctx.lineCap = "round";
      if (projectile.label) {
        const label = projectile.label;
        const fontSize = Math.max(24, projectile.radius * 1.18);
        const padX = fontSize * 0.46;
        const padY = fontSize * 0.26;
        ctx.font = `900 ${fontSize}px Microsoft YaHei, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const boxWidth = textWidth + padX * 2;
        const boxHeight = fontSize + padY * 2;
        ctx.translate(projectile.position.x, projectile.position.y);
        ctx.shadowColor = color;
        ctx.shadowBlur = 26;
        ctx.fillStyle = "rgba(24, 10, 18, 0.72)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = color;
        ctx.fillRect(-boxWidth / 2 + 8, -boxHeight / 2 + 8, boxWidth - 16, boxHeight - 16);
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(20, 8, 14, 0.94)";
        ctx.strokeText(label, 0, 1);
        ctx.fillStyle = "#fff8dc";
        ctx.fillText(label, 0, 1);
        ctx.restore();
        continue;
      }
      if (isPiercing) {
        ctx.strokeStyle = "rgba(233, 251, 255, 0.78)";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#e9fbff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(projectile.position.x - direction.x * 34, projectile.position.y - direction.y * 34);
        ctx.lineTo(projectile.position.x + direction.x * 10, projectile.position.y + direction.y * 10);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (isRicochet) {
        ctx.strokeStyle = "rgba(255, 207, 90, 0.78)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, projectile.radius + 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = projectile.lightning || isPiercing || isRicochet ? 12 : 6;
      ctx.beginPath();
      ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      if (projectile.label) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(13, projectile.radius * 0.75)}px Microsoft YaHei, sans-serif`;
        ctx.lineWidth = Math.max(2, projectile.radius * 0.14);
        ctx.strokeStyle = "rgba(20, 12, 18, 0.82)";
        ctx.strokeText(projectile.label, projectile.position.x, projectile.position.y + 0.5);
        ctx.fillStyle = "#fff8dc";
        ctx.fillText(projectile.label, projectile.position.x, projectile.position.y + 0.5);
      }
      if (isPiercing) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(projectile.position.x - direction.x * 8, projectile.position.y - direction.y * 8);
        ctx.lineTo(projectile.position.x + direction.x * 8, projectile.position.y + direction.y * 8);
        ctx.stroke();
      }
      ctx.restore();
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
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.radius > 6 ? 16 : 8;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  private renderSpellCues(ctx: CanvasRenderingContext2D): void {
    for (const cue of this.spellCues) {
      if ((cue.delay ?? 0) > 0) continue;
      const progress = 1 - clamp(cue.life / cue.maxLife, 0, 1);
      const alpha = clamp(cue.life / cue.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = cue.color;
      ctx.fillStyle = cue.color;
      ctx.lineCap = "round";
      ctx.shadowColor = cue.color;
      ctx.shadowBlur = 16;

      if (cue.kind === "card") {
        const flipIn = Math.min(1, progress / 0.34);
        const flipOut = Math.min(1, Math.max(0, (progress - 0.34) / 0.24));
        const faceVisible = progress >= 0.34;
        const flipScale = faceVisible ? 0.12 + flipOut * 0.88 : 1 - flipIn * 0.88;
        const cardWidth = cue.radius * 0.82;
        const cardHeight = cue.radius * 1.16;
        const corner = Math.max(5, cue.radius * 0.08);
        ctx.translate(cue.position.x, cue.position.y - progress * 8);
        ctx.scale(flipScale, 1);
        ctx.globalAlpha = alpha * (0.72 + progress * 0.28);
        ctx.lineWidth = Math.max(2, cue.radius * 0.04);
        ctx.shadowBlur = faceVisible ? 28 : 16;
        ctx.beginPath();
        ctx.moveTo(-cardWidth / 2 + corner, -cardHeight / 2);
        ctx.lineTo(cardWidth / 2 - corner, -cardHeight / 2);
        ctx.quadraticCurveTo(cardWidth / 2, -cardHeight / 2, cardWidth / 2, -cardHeight / 2 + corner);
        ctx.lineTo(cardWidth / 2, cardHeight / 2 - corner);
        ctx.quadraticCurveTo(cardWidth / 2, cardHeight / 2, cardWidth / 2 - corner, cardHeight / 2);
        ctx.lineTo(-cardWidth / 2 + corner, cardHeight / 2);
        ctx.quadraticCurveTo(-cardWidth / 2, cardHeight / 2, -cardWidth / 2, cardHeight / 2 - corner);
        ctx.lineTo(-cardWidth / 2, -cardHeight / 2 + corner);
        ctx.quadraticCurveTo(-cardWidth / 2, -cardHeight / 2, -cardWidth / 2 + corner, -cardHeight / 2);
        ctx.closePath();
        ctx.fillStyle = faceVisible ? "rgba(22, 18, 28, 0.92)" : "rgba(248, 241, 209, 0.18)";
        ctx.strokeStyle = faceVisible ? cue.color : "rgba(248, 241, 209, 0.72)";
        ctx.fill();
        ctx.stroke();
        if (!faceVisible) {
          ctx.globalAlpha *= 0.55;
          ctx.strokeStyle = cue.accent ?? cue.color;
          ctx.beginPath();
          ctx.moveTo(-cardWidth * 0.26, -cardHeight * 0.22);
          ctx.lineTo(cardWidth * 0.26, cardHeight * 0.22);
          ctx.moveTo(cardWidth * 0.26, -cardHeight * 0.22);
          ctx.lineTo(-cardWidth * 0.26, cardHeight * 0.22);
          ctx.stroke();
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `900 ${Math.max(20, cue.radius * 0.34)}px Microsoft YaHei, sans-serif`;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";
          ctx.lineWidth = Math.max(2, cue.radius * 0.028);
          ctx.strokeText(cue.label ?? "", 0, -cardHeight * 0.04);
          ctx.fillStyle = cue.color;
          ctx.fillText(cue.label ?? "", 0, -cardHeight * 0.04);
          ctx.globalAlpha *= 0.42;
          ctx.strokeStyle = cue.accent ?? cue.color;
          ctx.beginPath();
          ctx.arc(0, 0, cardWidth * 0.36, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }

      if (cue.kind === "glyph" || cue.kind === "fallGlyph" || cue.kind === "punchGlyph" || cue.kind === "slamGlyph" || cue.kind === "weakenGlyph") {
        const punchWave = cue.kind === "punchGlyph" ? Math.max(0, Math.sin(progress * Math.PI * (cue.cycles ?? 4))) : 0;
        const punchDirection = cue.direction ?? { x: 0, y: 0 };
        const punchX = punchDirection.x * (cue.amplitude ?? 76) * punchWave;
        const punchY = punchDirection.y * (cue.amplitude ?? 76) * punchWave;
        const slamEase = cue.kind === "slamGlyph" ? 1 - Math.pow(1 - Math.min(1, progress * 1.18), 3) : 0;
        const weakenEase = cue.kind === "weakenGlyph" ? 1 - Math.pow(1 - Math.min(1, progress * 1.08), 2) : 0;
        const scale = cue.kind === "fallGlyph"
          ? 1.22 - Math.min(0.32, progress * 0.32)
          : cue.kind === "slamGlyph"
            ? (cue.startScale ?? 3.4) + ((cue.endScale ?? 0.95) - (cue.startScale ?? 3.4)) * slamEase
          : cue.kind === "weakenGlyph"
            ? (cue.startScale ?? 2.1) + ((cue.endScale ?? 0.62) - (cue.startScale ?? 2.1)) * weakenEase
          : cue.kind === "punchGlyph"
            ? 0.98 + punchWave * 0.22
            : 0.72 + progress * 0.72;
        const lift = cue.kind === "fallGlyph" ? (1 - Math.min(1, progress * 2.4)) * (cue.fallDistance ?? 150) : cue.kind === "slamGlyph" || cue.kind === "weakenGlyph" ? 0 : progress * 34;
        if (cue.kind === "weakenGlyph") {
          ctx.globalAlpha = alpha * (0.72 - progress * 0.28);
        }
        ctx.translate(cue.position.x + punchX, cue.position.y + punchY - lift);
        if (cue.kind === "punchGlyph") {
          ctx.rotate((punchDirection.x || punchDirection.y) ? Math.atan2(punchDirection.y, punchDirection.x) * 0.08 : 0);
        }
        ctx.scale(scale, scale);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(30, cue.radius)}px Microsoft YaHei, sans-serif`;
        ctx.lineWidth = Math.max(3, cue.radius * (cue.kind === "slamGlyph" ? 0.075 : cue.kind === "weakenGlyph" ? 0.035 : 0.055));
        ctx.shadowBlur = cue.kind === "slamGlyph" ? 42 : cue.kind === "weakenGlyph" ? 18 : 28;
        ctx.strokeStyle = cue.kind === "slamGlyph" ? "rgba(255, 245, 220, 0.94)" : cue.kind === "weakenGlyph" ? "rgba(235, 220, 255, 0.36)" : "rgba(255, 255, 255, 0.82)";
        ctx.strokeText(cue.label ?? "", 0, 0);
        ctx.fillStyle = cue.color;
        ctx.fillText(cue.label ?? "", 0, 0);
        ctx.restore();
        continue;
      }

      if (cue.kind === "ring") {
        const radius = cue.radius * (0.38 + progress * 0.82);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cue.position.x, cue.position.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.16;
        ctx.beginPath();
        ctx.arc(cue.position.x, cue.position.y, radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const angle = cue.angle ?? -Math.PI / 2;
        const spread = cue.spread ?? 0.36;
        const lines = Math.max(1, cue.lines ?? 3);
        ctx.lineWidth = 2.2;
        for (let i = 0; i < lines; i += 1) {
          const t = lines === 1 ? 0.5 : i / (lines - 1);
          const ray = angle - spread + spread * 2 * t;
          const inner = cue.radius * 0.18;
          const outer = cue.radius * (0.58 + progress * 0.32);
          ctx.beginPath();
          ctx.moveTo(cue.position.x + Math.cos(ray) * inner, cue.position.y + Math.sin(ray) * inner);
          ctx.lineTo(cue.position.x + Math.cos(ray) * outer, cue.position.y + Math.sin(ray) * outer);
          ctx.stroke();
        }
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(cue.position.x, cue.position.y, cue.radius * (0.58 + progress * 0.32), angle - spread, angle + spread);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (cue.label) {
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8;
        ctx.font = "900 15px Microsoft YaHei, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#f7fbff";
        ctx.fillText(cue.label, cue.position.x, cue.position.y - cue.radius * 0.32 - progress * 14);
      }
      ctx.restore();
    }
  }

  private renderVoiceDanmaku(ctx: CanvasRenderingContext2D): void {
    if (this.voiceDanmaku.length <= 0 && this.voiceDanmakuPins.length <= 0) return;

    for (const item of this.voiceDanmaku) {
      const age = item.maxLife - item.life;
      const fadeIn = clamp(age / 0.34, 0, 1);
      const fadeOut = clamp(item.life / 0.58, 0, 1);
      const alpha = item.alpha * fadeIn * fadeOut;
      if (alpha <= 0.01) continue;

      const size = this.fitVoiceDanmakuFontSize(
        ctx,
        item.text,
        item.size,
        this.width * (item.kind === "plain" ? 0.5 : 0.62),
        item.kind === "plain" ? 12 : 18,
      );
      const y = item.y + Math.sin(age * 1.7 + item.lane) * (item.kind === "plain" ? 1.1 : 1.8);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `${item.kind === "plain" ? 700 : 900} ${size}px Microsoft YaHei, sans-serif`;
      ctx.lineJoin = "round";
      ctx.lineWidth = item.kind === "plain" ? 2.2 : Math.max(3.2, size * 0.13);
      ctx.strokeStyle = item.kind === "plain" ? "rgba(3, 7, 14, 0.28)" : "rgba(2, 6, 14, 0.68)";
      ctx.shadowColor = item.kind === "plain" ? "rgba(255, 255, 255, 0.18)" : item.color;
      ctx.shadowBlur = item.kind === "plain" ? 3 : item.kind === "combo" ? 20 : 13;
      ctx.strokeText(item.text, item.x, y);
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, item.x, y);
      if (item.kind === "combo") {
        ctx.globalAlpha = alpha * 0.42;
        ctx.fillStyle = item.accent;
        ctx.fillText(item.text, item.x + 1.6, y - 1.3);
      }
      ctx.restore();
    }

    this.renderVoiceDanmakuPins(ctx);
  }

  private renderVoiceDanmakuPins(ctx: CanvasRenderingContext2D): void {
    for (const [index, pin] of this.voiceDanmakuPins.entries()) {
      const age = pin.maxLife - pin.life;
      const progress = clamp(age / pin.maxLife, 0, 1);
      const fadeIn = clamp(age / 0.18, 0, 1);
      const fadeOut = clamp(pin.life / 0.46, 0, 1);
      const alpha = fadeIn * fadeOut;
      if (alpha <= 0.01) continue;

      const centerX = this.width / 2;
      const centerY = clamp(this.height * 0.17, 70, 126) + index * 42 - progress * 8;
      const pulse = 1 + Math.sin(age * 7.4 + pin.seed) * 0.026;
      const labelSize = this.fitVoiceDanmakuFontSize(ctx, pin.label, pin.size * pulse, this.width * 0.82, 24);
      const sublabelSize = this.fitVoiceDanmakuFontSize(ctx, pin.sublabel, 15, this.width * 0.62, 12);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.globalAlpha = alpha;
      ctx.shadowColor = pin.color;
      ctx.shadowBlur = 28;
      ctx.font = `900 ${labelSize}px Microsoft YaHei, sans-serif`;
      ctx.lineWidth = Math.max(4, labelSize * 0.12);
      ctx.strokeStyle = "rgba(2, 5, 14, 0.78)";
      ctx.fillStyle = pin.color;
      ctx.strokeText(pin.label, 0, 0);
      ctx.fillText(pin.label, 0, 0);

      ctx.globalAlpha = alpha * 0.82;
      ctx.shadowColor = pin.accent;
      ctx.shadowBlur = 14;
      ctx.font = `800 ${sublabelSize}px Microsoft YaHei, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(2, 5, 14, 0.58)";
      ctx.fillStyle = pin.accent;
      ctx.strokeText(pin.sublabel, 0, labelSize * 0.68);
      ctx.fillText(pin.sublabel, 0, labelSize * 0.68);
      ctx.restore();
    }
  }

  private fitVoiceDanmakuFontSize(
    ctx: CanvasRenderingContext2D,
    text: string,
    targetSize: number,
    maxWidth: number,
    minSize: number,
  ): number {
    let size = targetSize;
    ctx.save();
    while (size > minSize) {
      ctx.font = `900 ${size}px Microsoft YaHei, sans-serif`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    ctx.restore();
    return Math.max(minSize, size);
  }

  private renderComboFlash(ctx: CanvasRenderingContext2D): void {
    const flash = this.comboFlash;
    if (!flash) return;
    const alpha = clamp(flash.life / flash.maxLife, 0, 1);
    const progress = 1 - alpha;
    const centerX = this.width / 2;
    const centerY = clamp(this.height * 0.22, 100, 165);
    const pulse = 1 + Math.sin(progress * Math.PI) * 0.08;

    ctx.save();
    ctx.globalAlpha = alpha * 0.18;
    const gradient = ctx.createRadialGradient(centerX, centerY, 18, centerX, centerY, Math.max(this.width, this.height) * 0.42);
    gradient.addColorStop(0, flash.color);
    gradient.addColorStop(0.32, "rgba(255,255,255,0.08)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const bannerWidth = Math.min(this.width * 0.82, 720);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = flash.color;
    ctx.shadowBlur = 28;
    ctx.font = `900 ${Math.round(35 * pulse)}px Microsoft YaHei, sans-serif`;
    ctx.lineJoin = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(2, 5, 14, 0.72)";
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = alpha * 0.86;
    ctx.strokeText(flash.label, centerX, centerY - 9 - progress * 10);
    ctx.fillText(flash.label, centerX, centerY - 9 - progress * 10);
    ctx.shadowBlur = 16;
    ctx.fillStyle = flash.accent;
    ctx.font = "800 16px Microsoft YaHei, sans-serif";
    ctx.globalAlpha = alpha * 0.78;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(2, 5, 14, 0.62)";
    ctx.strokeText(flash.sublabel, centerX, centerY + 30 - progress * 6);
    ctx.fillText(flash.sublabel, centerX, centerY + 30 - progress * 6);

    ctx.strokeStyle = flash.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.46;
    ctx.beginPath();
    ctx.moveTo(centerX - bannerWidth * 0.44, centerY + 48);
    ctx.lineTo(centerX + bannerWidth * 0.44, centerY + 48);
    ctx.stroke();
    ctx.restore();
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
      { label: "等级", value: `Lv.${this.level}` },
      { label: "分数", value: String(this.score) },
      { label: "击杀", value: String(this.kills) },
      { label: "大炮", value: `${Math.floor(this.cannonMeter)}%` },
      { label: "准备", value: `${this.cannonCharge}/3` },
      { label: "火力", value: String(Math.round(this.attackDamage)) },
    ];
    if (this.cannonAiming) {
      statEntries.splice(3, 0, { label: "瞄准", value: "锁定中", wide: true });
    }
    if (this.player.shield > 0) {
      statEntries.splice(5, 0, { label: "护盾", value: String(Math.round(this.player.shield)) });
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
    const chain = this.spellChain.map((spell) => this.spellChainLabel(spell)).join(" -> ");
    this.chainLine.textContent = chain ? `咒语链：${chain}` : "咒语链：先喊点不一样的。";
    this.updateCommandDockState();
    this.renderActiveSpellPanel();
  }

  private spellChainLabel(spell: SpellKey): string {
    if (spell === "cannonPrep") return "人间大炮·装填";
    if (spell === "cannon") return "人间大炮·瞄准";
    if (spell === "cannonFire") return "人间大炮·发射";
    return SPELL_NAMES[spell];
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
      { spell: "serious", time: this.activeMods.seriousTime, duration: 8.5 },
      { spell: "noTalk", time: this.activeMods.refusalTime, duration: 7.5 },
      { spell: "bodyShape", time: this.activeMods.slimTime, duration: 8 },
      { spell: "graceful", time: this.activeMods.gracefulTime, duration: 8 },
    ];
    const tracked = allTracked.filter((item) => this.unlockedSpells.has(item.spell));

    this.activeSpellPanel.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "持续效果";
    this.activeSpellPanel.append(title);

    if (this.runMode === "normal" && this.pendingUpgradeChoices > 0) {
      const prompt = document.createElement("button");
      prompt.type = "button";
      prompt.className = "survivor-upgrade-prompt-row";
      prompt.addEventListener("click", () => this.openPendingUpgradeChoices());
      prompt.innerHTML = `
        <span>Tab</span>
        <strong>升级待选择 x${this.pendingUpgradeChoices}</strong>
        <em>${this.upgradePickMode === "safe" ? "安全时自动，也可手动打开" : this.upgradePickMode === "instant" ? "即将自动打开" : "打开后一次性选完"}</em>
      `;
      this.activeSpellPanel.append(prompt);
    }

    if (tracked.length === 0 && this.pendingUpgradeChoices <= 0) {
      const empty = document.createElement("span");
      empty.className = "survivor-active-empty";
      empty.textContent = "抽到爆炸、冻结、分裂等咒语后显示状态。";
      this.activeSpellPanel.append(empty);
      return;
    }

    for (const item of tracked) {
      const cost = this.currentSpellCost(item.spell);
      const enough = this.energy >= cost;
      const row = document.createElement("div");
      row.className = "survivor-active-row";
      row.dataset.state = item.time > 0 ? "on" : enough ? "ready" : "empty";
      row.title = item.time > 0 ? `${SPELL_NAMES[item.spell]}正在生效。` : enough ? `${SPELL_NAMES[item.spell]}可施放。` : `${SPELL_NAMES[item.spell]}需要 ${cost} 声能。`;
      row.dataset.tone = getLineglowSpellArt(item.spell).tone;

      const glyph = document.createElement("span");
      glyph.className = "survivor-active-glyph";
      glyph.textContent = getLineglowSpellArt(item.spell).glyph;

      const name = document.createElement("span");
      name.className = "survivor-active-name";
      name.textContent = SPELL_NAMES[item.spell];

      const track = document.createElement("i");
      track.style.setProperty("--spell-fill", `${Math.round(clamp(item.time / item.duration, 0, 1) * 100)}%`);

      const time = document.createElement("em");
      time.textContent = item.time > 0 ? `生效 ${item.time.toFixed(1)}s` : enough ? "可施放" : "声能不足";

      row.append(glyph, name, track, time);
      this.activeSpellPanel.append(row);
    }
  }

  private renderGuidePanel(): void {
    const hidden = this.tutorial.guideDismissed || !this.running || this.paused || this.selectingBuff || this.gameOver;
    this.guidePanel.hidden = hidden;
    this.guidePanel.setAttribute("aria-hidden", hidden ? "true" : "false");
    if (hidden) {
      this.applyTutorialTargetHighlight(null);
      return;
    }

    const step = this.currentGuideStep();
    this.guidePanel.replaceChildren();
    const close = document.createElement("button");
    close.type = "button";
    close.className = "survivor-guide-close";
    close.setAttribute("aria-label", "关闭引导");
    close.title = "关闭引导";
    close.textContent = "×";
    close.addEventListener("click", () => {
      this.tutorial.guideDismissed = true;
      this.renderGuidePanel();
    });
    const title = document.createElement("strong");
    title.textContent = step.title;
    const body = document.createElement("p");
    body.textContent = step.body;
    const action = document.createElement("span");
    action.className = "survivor-guide-action";
    action.textContent = step.action;
    const list = document.createElement("ul");
    for (const tip of step.tips) {
      const item = document.createElement("li");
      item.textContent = tip;
      list.append(item);
    }
    this.guidePanel.append(close, title, body, action, list);
    this.applyTutorialTargetHighlight(step.target);
  }

  private currentGuideStep(): { title: string; body: string; action: string; tips: string[]; target: SpellKey | null } {
    if (!this.tutorial.moved) {
      return {
        title: "1/5 移动",
        body: "自动攻击会自己开火。",
        action: "WASD / 方向键移动",
        tips: ["先拉开距离。"],
        target: null,
      };
    }
    if (!this.tutorial.prepDone) {
      return {
        title: "2/5 准备",
        body: "给人间大炮蓄力。",
        action: "Q / 说“一级准备”",
        tips: ["先攒 1 层。"],
        target: "cannonPrep",
      };
    }
    if (!this.tutorial.aimDone) {
      return {
        title: "3/5 瞄准",
        body: "锁定敌群方向。",
        action: "E / 说“人间大炮”",
        tips: ["看到方向线再发射。"],
        target: "cannon",
      };
    }
    if (!this.tutorial.fireDone) {
      return {
        title: "4/5 发射",
        body: "冲出去撞怪，落地清场。",
        action: "R / 说“发射、开火”",
        tips: ["它也是位移。"],
        target: "cannonFire",
      };
    }
    if (!this.tutorial.upgradeChosen) {
      return {
        title: "5/5 选卡",
        body: "升级后拿一张强化。",
        action: "A/D 选，Enter 确认。",
        tips: ["高亮就是当前选择。"],
        target: null,
      };
    }
    return {
      title: "自由战斗",
      body: "大炮打爆发，咒语补短板。",
      action: "数字键 / 语音施法",
      tips: ["Esc 暂停。"],
      target: null,
    };
  }

  private applyTutorialTargetHighlight(target: SpellKey | null): void {
    const buttons = this.commandDock.querySelectorAll<HTMLButtonElement>("button[data-spell]");
    for (const button of buttons) {
      button.classList.toggle("is-tutorial-target", Boolean(target && button.dataset.spell === target));
    }
  }

  private renderCommandDock(): void {
    this.commandDock.replaceChildren();
    const visible = this.commandSpells();
    const header = document.createElement("div");
    header.className = "survivor-command-header";
    const title = document.createElement("strong");
    title.textContent = this.runMode === "wild" ? "狂野语音咒语" : "手动施法";
    const subtitle = document.createElement("span");
    subtitle.textContent = this.runMode === "wild" ? "只能语音触发，点击和热键不会施法" : "语音默认开启";
    header.append(title, subtitle);

    const list = document.createElement("div");
    list.className = "survivor-command-list";

    const cannonChain = document.createElement("div");
    cannonChain.className = "survivor-cannon-chain";
    cannonChain.setAttribute("role", "group");
    cannonChain.setAttribute("aria-label", "人间大炮技能链：Q 一级准备，E 瞄准，R 发射");

    const cannonTitle = document.createElement("div");
    cannonTitle.className = "survivor-cannon-chain-title";
    const cannonName = document.createElement("strong");
    cannonName.textContent = "人间大炮";
    const cannonMeta = document.createElement("span");
    cannonMeta.textContent = "同一技能链：准备 / 瞄准 / 发射";
    cannonTitle.append(cannonName, cannonMeta);

    const cannonActions = document.createElement("div");
    cannonActions.className = "survivor-cannon-chain-actions";

    ([
      ["cannonPrep", "q", "prep"],
      ["cannon", "e", "aim"],
      ["cannonFire", "r", "fire"],
    ] as const).forEach(([spell, shortcut, step]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.spell = spell;
      button.dataset.shortcut = this.runMode === "wild" ? "声" : shortcut;
      button.dataset.chainStep = step;
      button.addEventListener("click", () => {
        this.pulseCommandButton(button);
        if (this.runMode === "wild") {
          this.say("狂野模式：咒语只能靠语音喊出来。");
          return;
        }
        this.castSpell(spell);
      });
      cannonActions.append(button);
    });
    cannonChain.append(cannonTitle, cannonActions);
    list.append(cannonChain);

    visible.forEach((spell, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.spell = spell;
      if (this.runMode === "wild") {
        button.dataset.shortcut = "声";
      } else if (index < 9) {
        button.dataset.shortcut = String(index + 1);
      } else {
        const extraShortcut = EXTRA_COMMAND_SHORTCUTS[index - 9];
        if (extraShortcut) {
          button.dataset.shortcut = extraShortcut;
        }
      }
      button.addEventListener("click", () => {
        this.pulseCommandButton(button);
        if (this.runMode === "wild") {
          this.say("狂野模式：咒语只能靠语音喊出来。");
          return;
        }
        this.castSpell(spell);
      });
      list.append(button);
    });

    this.commandDock.append(header, list);
    this.syncCommandDockVisibility();
    this.updateCommandDockState();
    this.updateCommandDockMetrics();
  }

  private syncCommandDockVisibility(): void {
    const hidden = !this.running || this.paused || this.selectingBuff || this.gameOver || this.runMode === "wild";
    this.commandDock.hidden = hidden;
    this.commandDock.setAttribute("aria-hidden", hidden ? "true" : "false");
    if (hidden) this.clearHudPassThroughState();
    this.guidePanel.hidden = hidden || this.tutorial.guideDismissed;
    this.guidePanel.setAttribute("aria-hidden", hidden || this.tutorial.guideDismissed ? "true" : "false");
    if (hidden) this.applyTutorialTargetHighlight(null);
    this.updateWildSpellbookVisibility();
    window.requestAnimationFrame(() => this.updateCommandDockMetrics());
  }

  private updateCommandDockMetrics(): void {
    const height = this.commandDock.hidden ? 0 : this.commandDock.getBoundingClientRect().height;
    this.commandDockHeight = Math.ceil(height);
    this.root.style.setProperty("--survivor-command-dock-height", `${Math.ceil(height)}px`);
  }

  private pulseCommandButton(button: HTMLButtonElement): void {
    button.classList.remove("is-pressed");
    void button.offsetWidth;
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 180);
  }

  private pulseEnergyDenied(): void {
    this.energyRow.classList.remove("is-energy-denied");
    void this.energyRow.offsetWidth;
    this.energyRow.classList.add("is-energy-denied");
    window.clearTimeout(this.energyDeniedTimeout);
    this.energyDeniedTimeout = window.setTimeout(() => {
      this.energyRow.classList.remove("is-energy-denied");
    }, 520);
  }

  private commandSpells(): SpellKey[] {
    if (this.runMode === "wild") {
      return SPELL_KEYS.filter((spell) => !["cannon", "cannonPrep", "cannonFire"].includes(spell));
    }
    if (this.testEnvironment) {
      return TEST_COMMAND_SPELLS.filter((spell) => this.unlockedSpells.has(spell));
    }
    const unlocked = [...this.unlockedSpells].filter((spell) => !["cannon", "cannonPrep", "cannonFire"].includes(spell));
    return unlocked;
  }

  private updateCommandDockState(): void {
    this.syncCommandDockVisibility();
    const cannonButton = this.commandDock.querySelector<HTMLButtonElement>("button[data-command='cannon']");
    if (cannonButton) {
      const state = this.cannonCommandState();
      cannonButton.title = state.title;
      cannonButton.dataset.state = state.state;
      cannonButton.setAttribute("aria-disabled", state.state === "ready" ? "false" : "true");
      this.renderCommandButton(cannonButton, state);
    }

    const buttons = this.commandDock.querySelectorAll<HTMLButtonElement>("button[data-spell]");
    for (const button of buttons) {
      const spell = button.dataset.spell as SpellKey | undefined;
      if (!spell) continue;
      const state = this.commandState(spell);
      button.title = state.title;
      button.dataset.state = state.state;
      button.setAttribute("aria-disabled", state.state === "ready" ? "false" : "true");
      this.renderCommandButton(button, state);
    }
    if (!this.guidePanel.hidden) this.applyTutorialTargetHighlight(this.currentGuideStep().target);
  }

  private renderCommandButton(button: HTMLButtonElement, state: CommandButtonState): void {
    const shortcut = button.dataset.shortcut ?? "";
    const spell = button.dataset.spell as SpellKey | undefined;
    const art = getLineglowSpellArt(spell ?? "cannon");
    button.dataset.tone = art.tone;
    const displayLabel = button.dataset.chainStep === "aim" ? "瞄准" : state.label;

    const key = document.createElement("span");
    key.className = "survivor-command-key";
    key.textContent = shortcut ? shortcut.toUpperCase() : "-";

    const copy = document.createElement("span");
    copy.className = "survivor-command-copy";
    const label = document.createElement("strong");
    label.textContent = displayLabel;
    const meta = document.createElement("em");
    meta.textContent = state.meta;
    copy.append(label, meta);

    const badge = document.createElement("span");
    badge.className = "survivor-command-state";
    badge.textContent = state.badge;

    button.setAttribute("aria-label", `${shortcut ? `${shortcut.toUpperCase()}，` : ""}${displayLabel}，${state.meta}，${state.badge}`);
    button.replaceChildren(key, copy, badge);
  }

  private cannonCommandState(): CommandButtonState {
    if (this.cannonCharge <= 0) {
      const cost = this.nextCannonPrepCost();
      const enough = this.energy >= cost;
      return {
        label: "人间大炮",
        meta: `装填 ${cost} 声能`,
        title: enough ? "消耗声能装填人间大炮。再次使用会瞄准，第三次发射。" : `声能不足：装填需要 ${cost}，当前 ${Math.floor(this.energy)}。`,
        badge: enough ? "装填" : "声能不足",
        state: enough ? "ready" : "empty",
      };
    }
    if (!this.cannonTarget) {
      return {
        label: "人间大炮",
        meta: `${this.cannonCharge}/3 层`,
        title: "锁定敌群或进入瞄准，移动鼠标可微调方向。再次使用会发射。",
        badge: "瞄准",
        state: "ready",
      };
    }
    const meterCost = this.cannonFireMeterCost();
    const enough = this.cannonMeter >= meterCost;
    return {
      label: "人间大炮",
      meta: `${meterCost}% 大炮`,
      title: enough ? "发射玩家本人，撞怪造成高伤害，落地冲击清场。" : `大炮槽不足：需要 ${meterCost}%，当前 ${Math.floor(this.cannonMeter)}%。`,
      badge: enough ? "发射" : "槽不足",
      state: enough ? "ready" : "empty",
    };
  }

  private commandState(spell: SpellKey): CommandButtonState {
    if (spell === "cannonPrep") {
      if (this.cannonCharge >= 3) {
        return { label: "一级准备", meta: "3/3 层", title: "一级准备已经三层，喊人间大炮锁定，再喊发射。", badge: "已满", state: "blocked" };
      }
      const cost = this.nextCannonPrepCost();
      const enough = this.energy >= cost;
      return {
        label: "一级准备",
        meta: `${cost} 声能`,
        title: enough ? `消耗 ${cost} 声能，增加 1 层大炮充能。` : `声能不足：第 ${this.cannonCharge + 1} 层一级准备需要 ${cost}，当前 ${Math.floor(this.energy)}。`,
        badge: enough ? "充能" : "声能不足",
        state: enough ? "ready" : "empty",
      };
    }
    if (spell === "cannonFire") {
      if (this.cannonCharge <= 0) {
        return { label: "发射", meta: "先准备", title: "需要先喊一级准备获得至少 1 层充能。", badge: "未装填", state: "blocked" };
      }
      if (!this.cannonTarget) {
        return { label: "发射", meta: "先瞄准", title: "需要先用人间大炮锁定方向。", badge: "待瞄准", state: "blocked" };
      }
      const meterCost = this.cannonFireMeterCost();
      const enough = this.cannonMeter >= meterCost;
      return {
        label: "发射",
        meta: `${meterCost}% 大炮`,
        title: enough ? `消耗 ${meterCost}% 大炮槽，按 ${this.cannonCharge} 层充能发射。` : `大炮槽不足：需要 ${meterCost}%，当前 ${Math.floor(this.cannonMeter)}%。`,
        badge: enough ? "发射" : "槽不足",
        state: enough ? "ready" : "empty",
      };
    }
    if (spell === "cannon") {
      if (this.cannonCharge <= 0) {
        return {
          label: SPELL_NAMES[spell],
          meta: "先准备",
          title: "需要先使用一级准备获得充能，再用人间大炮瞄准。",
          badge: "待装填",
          state: "blocked",
        };
      }
      return {
        label: SPELL_NAMES[spell],
        meta: this.cannonAiming ? "微调方向" : `${this.cannonCharge}/3 准备`,
        title: "锁定敌群或进入瞄准，移动鼠标调整方向。",
        badge: this.cannonAiming ? "已瞄准" : "瞄准",
        state: "ready",
      };
    }
    const cost = this.currentSpellCost(spell);
    const enough = this.energy >= cost;
    const activeTime = this.activeSpellTime(spell);
    return {
      label: SPELL_NAMES[spell],
      meta: `${cost} 声能`,
      title: enough ? `消耗 ${cost} 声能。` : `声能不足：${SPELL_NAMES[spell]}需要 ${cost}，当前 ${Math.floor(this.energy)}。`,
      badge: enough ? (activeTime > 0 ? "续唱" : "施放") : "声能不足",
      state: enough ? "ready" : "empty",
    };
  }

  private activeSpellTime(spell: SpellKey): number {
    switch (spell) {
      case "explode":
        return this.activeMods.explosionTime;
      case "freeze":
        return this.activeMods.freezeTime;
      case "lightning":
        return this.activeMods.lightningTime;
      case "split":
        return this.activeMods.splitTime;
      case "pierce":
        return this.activeMods.pierceTime;
      case "ricochet":
        return this.activeMods.ricochetTime;
      case "focus":
        return this.activeMods.focusTime;
      case "serious":
        return this.activeMods.seriousTime;
      case "noTalk":
        return this.activeMods.refusalTime;
      case "bodyShape":
        return this.activeMods.slimTime;
      case "graceful":
        return this.activeMods.gracefulTime;
      default:
        return 0;
    }
  }

  private currentSpellCost(spell: SpellKey): number {
    if (spell === "cannonPrep") return this.nextCannonPrepCost();
    if (spell === "cannon" || spell === "cannonFire") return 0;
    if (this.nextSpellFree && !this.isHiddenComboSpell(spell)) return 0;
    const fatigue = this.spellFatigueMultiplier(spell);
    const silenceCost = this.isPlayerSilenced() ? 1.6 : 1;
    return Math.round(SPELL_COSTS[spell] * (1 + (1 - fatigue) * 1.1) * silenceCost);
  }

  private cannonFireMeterCost(): number {
    return 15 + this.cannonCharge * 8;
  }
}
