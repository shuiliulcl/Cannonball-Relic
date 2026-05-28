import { VoiceInput } from "../game/voice";
import { LineglowSurvivorRenderer, type SurvivorRenderState } from "./render/LineglowSurvivorRenderer";
import { getLineglowSpellArt } from "./render/lineglowTheme";

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
  kind: "ring" | "fan";
  position: Vec2;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  label?: string;
  angle?: number;
  spread?: number;
  lines?: number;
};

type ComboFlash = {
  label: string;
  sublabel: string;
  color: string;
  accent: string;
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
  guard: (count?: number) => void;
  turrets: (count?: number) => void;
  showcase: () => void;
  listBuffs: () => Array<{ id: string; title: string; rarity: Buff["rarity"]; spell?: SpellKey }>;
  state: () => {
    level: number;
    energy: number;
    guardTurretCount: number;
    placedTurretCount: number;
    unlockedSpells: SpellKey[];
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

const SPELL_COMMAND_ALIASES = Object.entries(SPELL_CONFIG).map(([key, config]) => ({
  key: key as SpellKey,
  aliases: config.aliases,
  priority: (config as SpellConfig).hidden ? 10 : 0,
}));

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

function matchSpells(text: string): SpellKey[] {
  const normalized = normalizeVoiceText(text);
  if (!normalized) return [];
  const matches: Array<{ key: SpellKey; position: number; length: number; priority: number }> = [];
  for (const command of SPELL_COMMAND_ALIASES) {
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
      const position = normalized.lastIndexOf(aliasForm);
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

function matchSurvivorVoiceActions(text: string): SurvivorVoiceAction[] {
  const spells = matchSpells(text);
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
  private gmPanel!: HTMLElement;
  private readonly gmEnabled = new URLSearchParams(window.location.search).get("gm") === "1";

  private voiceInput!: VoiceInput<SurvivorVoiceAction>;
  private voiceActive = false;
  private voiceCommandsEnabled = true;
  private voicePausedForUpgrade = false;
  private lastVoiceControlAt = 0;
  private lastVoiceControlCommand: VoiceControlAction["command"] | null = null;
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
  private spellCues: SpellCue[] = [];
  private comboFlash: ComboFlash | null = null;
  private turrets: Turret[] = [];
  private unlockedSpells = new Set<SpellKey>(["cannon", "cannonPrep", "cannonFire"]);
  private ownedBuffs = new Map<string, number>();
  private spellChain: SpellKey[] = [];
  private repeatableSpellChain: SpellKey[] = [];
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
            <button id="survivorVoiceButton" type="button">语音施法</button>
            <span id="survivorStatus">手动施法就绪；语音可选。</span>
          </div>
          <div id="survivorActiveSpells" class="survivor-active-spells" aria-label="持续效果状态"></div>
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
        <section id="survivorCommandDock" class="survivor-command-dock" aria-label="手动施法栏"></section>
        <section id="survivorGmPanel" class="survivor-gm-panel" aria-label="GM debug tools" hidden></section>
        <div id="survivorStart" class="survivor-overlay">
          <span class="survivor-kicker">语音幸存者肉鸽</span>
          <h1>人间大炮一级准备</h1>
          <p>自动攻击怪潮，升级抽取咒语 Buff。键盘 Q/E/R 分别对应一级准备、人间大炮、发射；普通咒语从 1 开始排。</p>
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
    this.gmPanel = this.root.querySelector<HTMLElement>("#survivorGmPanel") ?? this.fail("Missing survivor GM panel.");

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
      guard: (count = 1) => { this.gmGrantBuff("weapon-guard-turret", count); },
      turrets: (count = 5) => this.gmSpawnPlacedTurrets(count),
      showcase: () => this.gmBuffShowcase(),
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
      }),
    };
  }

  private renderGmPanel(): void {
    if (!this.gmEnabled) {
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
      ["Place x5", () => this.gmSpawnPlacedTurrets(5)],
      ["All VFX", () => this.gmBuffShowcase()],
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
    this.energy = this.maxEnergy;
    this.renderCommandDock();
    this.say(`GM: unlock ${spell}`);
    return true;
  }

  private gmCastSpell(spell: SpellKey): boolean {
    this.gmUnlockSpell(spell);
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    this.energy = this.maxEnergy;
    return this.castSpell(spell);
  }

  private gmSpawnPlacedTurrets(count = 5): void {
    this.gmStart();
    this.unlockedSpells.add("skillGo");
    this.skillGoLevel = Math.max(this.skillGoLevel, 3);
    const turretCount = clamp(Math.round(count), 1, 12);
    for (let i = 0; i < turretCount; i += 1) {
      const angle = (Math.PI * 2 * i) / turretCount + this.elapsed;
      const radius = 84 + (i % 2) * 26;
      this.turrets.push({
        position: {
          x: clamp(this.player.position.x + Math.cos(angle) * radius, 34, this.width - 34),
          y: clamp(this.player.position.y + Math.sin(angle) * radius, 34, this.height - 34),
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

  private fail(message: string): never {
    throw new Error(message);
  }

  private installEvents(): void {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      if (this.castManualShortcut(event)) {
        event.preventDefault();
        return;
      }
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

  private castManualShortcut(event: KeyboardEvent): boolean {
    const shortcut = event.key.toLowerCase();
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !/^[1-9qer]$/.test(shortcut)) {
      return false;
    }
    if (!this.running || this.selectingBuff || this.gameOver) {
      return false;
    }
    const button = this.commandDock.querySelector<HTMLButtonElement>(`button[data-shortcut="${shortcut}"]`);
    const spell = button?.dataset.spell as SpellKey | undefined;
    if (!spell) {
      return false;
    }
    this.castSpell(spell);
    return true;
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
        this.say(`语音出错：${error ?? "unknown"}`);
        return;
      }
      if (status === "idle") {
        this.voiceActive = false;
        this.voiceButton.textContent = "语音施法";
        return;
      }

      this.voiceActive = true;
      this.voiceButton.textContent = this.voiceCommandsEnabled ? "语音中" : "语音待机";
      if (actions.length > 0) {
        return;
      }
      if (!this.voiceCommandsEnabled && transcript) {
        this.say("语音待机：说“开启语音”恢复。");
      } else if (transcript) {
        this.say(`听见了：${transcript}`);
      }
    });
  }

  private matchSurvivorVoiceActions(text: string): SurvivorVoiceAction[] {
    const controls = matchVoiceControl(text);
    if (!this.voiceCommandsEnabled) {
      return controls.filter((action) => action.command === "start");
    }
    return controls.length > 0 ? controls : matchSurvivorVoiceActions(text);
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
    if (this.voiceActive) return;
    this.voicePausedForUpgrade = false;
    this.voiceCommandsEnabled = true;
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

  private start(): void {
    this.running = true;
    this.selectingBuff = false;
    this.voicePausedForUpgrade = false;
    this.voiceCommandsEnabled = true;
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
    this.spellCues = [];
    this.comboFlash = null;
    this.turrets = [];
    this.unlockedSpells = new Set(["cannon", "cannonPrep", "cannonFire"]);
    this.ownedBuffs.clear();
    this.spellChain = [];
    this.repeatableSpellChain = [];
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
    this.delayedHealTime = 0;
    this.delayedHealAmount = 0;
    this.nextSpellFree = false;
    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.xpGoal = INITIAL_XP_GOAL;
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
    this.screenShake = 0;
    this.screenShakePower = 0;
    this.renderCommandDock();
    this.say("开局：按 Q 一级准备，按 E 人间大炮瞄准，按 R 发射；普通咒语从 1 开始。");
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
    this.screenShake = Math.max(0, this.screenShake - dt);
    if (this.comboFlash) {
      this.comboFlash.life -= dt;
      if (this.comboFlash.life <= 0) this.comboFlash = null;
    }
    this.recordPlayerSnapshot();
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
    this.activeMods.refusalTime = Math.max(0, this.activeMods.refusalTime - dt);
    this.activeMods.slimTime = Math.max(0, this.activeMods.slimTime - dt);
    this.activeMods.gracefulTime = Math.max(0, this.activeMods.gracefulTime - dt);
    this.cardMarkTime = Math.max(0, this.cardMarkTime - dt);
    if (this.cardMarkTime <= 0) this.markedEnemyId = null;
    this.fatalInsuranceTime = Math.max(0, this.fatalInsuranceTime - dt);
    if (this.delayedHealTime > 0) {
      this.delayedHealTime = Math.max(0, this.delayedHealTime - dt);
      if (this.delayedHealTime <= 0 && this.delayedHealAmount > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.delayedHealAmount);
        this.addSpellRing(this.player.position, 110, "#f8f1d1", "明天回信");
        this.delayedHealAmount = 0;
      }
    }
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
  }

  private effectivePlayerRadius(): number {
    const slim = this.activeMods.slimTime > 0 ? 0.68 : 1;
    const graceful = this.activeMods.gracefulTime > 0 ? 0.86 : 1;
    return Math.max(7, this.player.radius * slim * graceful);
  }

  private updatePlayer(dt: number): void {
    if (this.player.cannonTime > 0) {
      this.player.cannonTime -= dt;
      this.player.invuln = Math.max(this.player.invuln, 0.12);
      if (Math.random() < 0.55) {
        this.addBurst(this.player.position, "#ffe27a", 2);
      }
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
    const playerRadius = this.effectivePlayerRadius();
    this.player.velocity = { x: move.x * this.moveSpeed, y: move.y * this.moveSpeed };
    this.player.position.x = clamp(this.player.position.x + this.player.velocity.x * dt, playerRadius, this.width - playerRadius);
    this.player.position.y = clamp(this.player.position.y + this.player.velocity.y * dt, playerRadius, this.height - playerRadius);
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
    const playerRadius = this.effectivePlayerRadius();
    const refusal = this.activeMods.refusalTime > 0;
    for (const enemy of this.enemies) {
      enemy.frozen = Math.max(0, enemy.frozen - dt);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.windup = Math.max(0, enemy.windup - dt);
      if (enemy.frozen > 0) continue;

      const toPlayer = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
      if (enemy.type === "pouncer") {
        if (!refusal && enemy.cooldown <= 0) {
          enemy.windup = 0.48;
          enemy.cooldown = Math.max(1.65, 2.7 - this.threatTier() * 0.18);
        }
        const speed = refusal ? enemy.speed * 0.22 : enemy.windup > 0 ? 8 : enemy.speed * 2.8;
        enemy.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
      } else if (enemy.type === "ranged") {
        const dist = distance(enemy.position, this.player.position);
        const backing = dist < 170 ? -0.55 : 0.45;
        enemy.velocity = { x: toPlayer.x * enemy.speed * backing * (refusal ? 0.28 : 1), y: toPlayer.y * enemy.speed * backing * (refusal ? 0.28 : 1) };
        if (!refusal && enemy.cooldown <= 0 && dist < 520) {
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
        enemy.velocity = { x: toPlayer.x * enemy.speed * (refusal ? 0.36 : 1), y: toPlayer.y * enemy.speed * (refusal ? 0.36 : 1) };
      }

      enemy.position.x += enemy.velocity.x * dt;
      enemy.position.y += enemy.velocity.y * dt;
      enemy.position.x = clamp(enemy.position.x, enemy.radius, this.width - enemy.radius);
      enemy.position.y = clamp(enemy.position.y, enemy.radius, this.height - enemy.radius);

      if (distance(enemy.position, this.player.position) < enemy.radius + playerRadius) {
        this.hurtPlayer(this.scaledEnemyDamage(enemy.type));
        const away = normalize({ x: this.player.position.x - enemy.position.x, y: this.player.position.y - enemy.position.y });
        this.player.position.x = clamp(this.player.position.x + away.x * 18, playerRadius, this.width - playerRadius);
        this.player.position.y = clamp(this.player.position.y + away.y * 18, playerRadius, this.height - playerRadius);
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
        this.energy = clamp(this.energy + 2.6, 0, this.maxEnergy);
        this.gracefulConfidence = clamp(this.gracefulConfidence + 0.16, 0, 3);
        this.addParticle(this.player.position, shot.position, "#9cffd0");
      }
    }
    this.enemyShots = this.enemyShots.filter((shot) => shot.life > 0);
  }

  private updateDrops(dt: number): void {
    const playerRadius = this.effectivePlayerRadius();
    for (const drop of this.drops) {
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
      cue.life -= dt;
    }
    this.spellCues = this.spellCues.filter((cue) => cue.life > 0);
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
    const maxBatch = earlyRush ? 4 : this.elapsed < 80 ? 7 + tier : 5 + tier;
    const roomLeft = Math.max(0, targetCount - this.enemies.length);
    const count = Math.min(maxBatch, roomLeft, (earlyRush ? 2 : 1) + Math.floor(this.spawnBudget));
    for (let i = 0; i < count; i += 1) {
      this.spawnEnemy(this.pickEnemyType(wave));
    }
    this.spawnBudget = Math.max(earlyRush ? 1.05 : 0.7, this.spawnBudget - count * 0.62);
    this.spawnTimer = this.nextSpawnInterval(pressure);
  }

  private targetEnemyCount(): number {
    const tier = this.threatTier();
    if (this.elapsed < 20) return 20;
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

  private handleVoiceActions(actions: SurvivorVoiceAction[]): void {
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

  private castVoiceCombo(comboKey: VoiceComboKey): boolean {
    if (!this.running || this.selectingBuff || this.gameOver) return false;
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
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.8 + power);

    switch (comboKey) {
      case "stormBloom": {
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
        const radius = this.freezePulseRadius + 52;
        this.activeMods.freezeTime = Math.max(this.activeMods.freezeTime, 3.8 * power);
        this.activeMods.explosionTime = Math.max(this.activeMods.explosionTime, 3.2 * power);
        this.freezeAround(this.player.position, radius, this.freezeDuration * (1.1 + power * 0.18));
        this.explode(this.player.position, this.explosionRadius + 46, (18 + this.attackDamage) * power, true);
        this.addVoiceComboBurst("#9be7ff", "#ff9b4a", 54);
        this.say(`组合咒语：${combo.name}！先冻住，再炸开。`);
        break;
      }
      case "thunderRicochet": {
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
    if (!this.running || this.selectingBuff || this.gameOver) return false;
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
        this.addBurst(this.player.position, "#e5ff66", 26);
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
        this.triggerFunSpellImpact("当个事儿办", "危险目标已受理", "#fff1a6", "#ff4f6d");
        this.activeMods.seriousTime = Math.max(this.activeMods.seriousTime, 5.5 * power);
        this.activeMods.focusTime = Math.max(this.activeMods.focusTime, 5.5 * power);
        this.addBurst(this.player.position, "#fff1a6", 18);
        this.addSpellRing(this.player.position, 150, "#fff1a6", "认真锁敌");
        this.say("当个事儿办：辅助瞄准上线。");
        break;
      case "cardCheck":
        this.castCardCheck(power);
        break;
      case "woqu":
        this.shortSafeStep(92);
        this.player.invuln = Math.max(this.player.invuln, 0.35);
        this.addSpellRing(this.player.position, 92, "#9cffd0", "我去");
        this.say("我去：先闪开半步。");
        break;
      case "tooLate":
        this.refundRecentSpell(0.36);
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
        this.triggerFunSpellImpact("你已急哭", "红温扩散", "#ff4f6d", "#fff1a6");
        this.castUrgentCry(power);
        break;
      case "received":
        this.castReceivedKeyword(power);
        break;
      case "unknown":
        this.player.invuln = Math.max(this.player.invuln, 0.42);
        this.clearEnemyShotsNear(this.player.position, 120);
        this.addSpellRing(this.player.position, 94, "#d28cff", "不知道");
        this.say("不知道：敌人短暂丢失节奏。");
        break;
      case "bodyShape":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 4 * power);
        this.addSpellRing(this.player.position, 82, "#d28cff", "身材");
        this.say("身材：受击判定短暂变窄。");
        break;
      case "graceful":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 2.5 * power);
        this.activeMods.gracefulTime = Math.max(this.activeMods.gracefulTime, 2.2 * power);
        this.shortSafeStep(78);
        this.addSpellRing(this.player.position, 98, "#9cffd0", "曼妙");
        this.say("曼妙：擦弹会回声能。");
        break;
      case "internalDrain":
        this.castInternalDrain(power);
        break;
      case "externalDrain":
        this.knockEnemiesFrom(this.player.position, 250, 36);
        this.addSpellRing(this.player.position, 150, "#c491ff", "外耗");
        this.say("外耗：把压力推回怪群。");
        break;
      case "oldSelf":
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8 * power);
        this.player.shield = Math.min(70, this.player.shield + 8 * power);
        this.addSpellRing(this.player.position, 92, "#f8f1d1", "老己");
        this.say("老己：先爱自己一口。");
        break;
      case "seeTomorrow":
        this.delayedHealTime = 2.2;
        this.delayedHealAmount = Math.max(this.delayedHealAmount, 12 * power);
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
      return false;
    }

    const fatigue = this.spellFatigueMultiplier(spell);
    const power = fatigue * (1 + fragments.length * 0.22 + Math.min(0.35, this.level * 0.02));
    this.energy -= cost;
    this.recordSpell(spell);
    this.triggerFunComboImpact(spell, power);

    switch (spell) {
      case "comboBangFull":
        this.castBangFullCombo(power);
        break;
      case "comboBangTwoFists":
        this.castBangTwoFists(power);
        break;
      case "comboCardCheck":
        this.castCardCheckCombo(power);
        break;
      case "comboTooLate":
        this.castTooLateCombo(power);
        break;
      case "comboNoTalk":
        this.activeMods.refusalTime = Math.max(this.activeMods.refusalTime, 5.5 * power);
        this.clearEnemyShotsNear(this.player.position, 720);
        this.interruptEnemies(999, 520);
        this.addSpellRing(this.player.position, 360, "#e9fbff", "不讲不讲");
        this.say("隐藏 Combo：不讲不讲，拒绝沟通领域展开。");
        break;
      case "comboReceived":
        this.castReceivedCombo(power);
        break;
      case "comboGracefulBody":
        this.activeMods.slimTime = Math.max(this.activeMods.slimTime, 8 * power);
        this.activeMods.gracefulTime = Math.max(this.activeMods.gracefulTime, 8 * power);
        this.player.invuln = Math.max(this.player.invuln, 0.7);
        this.clearEnemyShotsNear(this.player.position, 160);
        this.gracefulConfidence = Math.max(this.gracefulConfidence, 1);
        this.addSpellRing(this.player.position, 260, "#d28cff", "曼妙判定");
        this.say("隐藏 Combo：不知道，我的身材很曼妙。擦弹会攒自信光环。");
        break;
      case "comboExternalize":
        this.castExternalizeCombo(power);
        break;
      case "comboSeeTomorrow":
        this.fatalInsuranceTime = Math.max(this.fatalInsuranceTime, 14 * power);
        this.player.shield = Math.min(70, this.player.shield + 22 * power);
        this.delayedHealTime = 1.2;
        this.delayedHealAmount = Math.max(this.delayedHealAmount, 24 * power);
        this.addSpellRing(this.player.position, 240, "#f8f1d1", "明天见");
        this.say("隐藏 Combo：爱你老己，明天见。今晚不死保险已生效。");
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
    this.screenShake = Math.max(this.screenShake, 0.34 + fragments * 0.05);
    this.screenShakePower = Math.max(this.screenShakePower, 8 + fragments * 3);
    this.addSpellRing(this.player.position, radius, theme.color, theme.label, 1.05);
    this.addSpellRing(this.player.position, radius * 0.58, theme.accent, theme.sublabel, 0.78);
    this.addBurst(this.player.position, theme.color, 34 + fragments * 12);
    this.addBurst(this.player.position, theme.accent, 22 + fragments * 8);
    this.addComboRays(this.player.position, theme.color, 14 + fragments * 4, radius * 0.95);
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
    this.screenShake = Math.max(this.screenShake, 0.2);
    this.screenShakePower = Math.max(this.screenShakePower, 5);
    this.addSpellRing(this.player.position, 210, color, label, 0.72);
    this.addBurst(this.player.position, color, 22);
    this.addBurst(this.player.position, accent, 12);
    this.addComboRays(this.player.position, accent, 10, 210);
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
      const damage = (5 + this.attackDamage * 0.28) * power * (0.45 + falloff);
      this.damageEnemy(enemy, damage, "bang");
      this.knockEnemyAway(enemy, this.player.position, 18 + falloff * 26);
      if (Math.random() < 0.55 + falloff * 0.35) {
        this.addBurst(enemy.position, falloff > 0.55 ? theme.accent : theme.color, 6 + Math.floor(falloff * 7));
      }
    }
    this.clearEnemyShotsNear(this.player.position, radius * 0.72);
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
    this.player.position.x = clamp(this.player.position.x + safe.x * distanceBoost, this.player.radius, this.width - this.player.radius);
    this.player.position.y = clamp(this.player.position.y + safe.y * distanceBoost, this.player.radius, this.height - this.player.radius);
    this.player.invuln = Math.max(this.player.invuln, 0.35);
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
    const count = 8 + Math.floor(stacks * 6);
    const damage = (7 + this.attackDamage * 0.42) * (1 + stacks * 0.16);
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
    const radius = 360;
    let affected = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, this.player.position) > radius) continue;
      affected += 1;
      const damage = (12 + this.attackDamage * 0.58) * power * (enemy.type === "ranged" || enemy.type === "repeater" ? 1.35 : 1);
      this.damageEnemy(enemy, damage, "urgentCry");
      enemy.cooldown = Math.max(enemy.cooldown, 1.8);
      enemy.windup = 0;
      this.knockEnemyAway(enemy, this.player.position, 22 * power);
      this.addBurst(enemy.position, "#ff4f6d", 7);
    }
    this.clearEnemyShotsNear(this.player.position, radius + 60);
    this.player.invuln = Math.max(this.player.invuln, 0.38);
    this.addSpellRing(this.player.position, radius * 0.55, "#ff4f6d", "你已急哭");
    this.say(affected > 0 ? `你已急哭：${affected} 个敌人红温破防。` : "你已急哭：先稳住，红温留给下一波。");
  }

  private castReceivedKeyword(power: number): void {
    const spell = this.repeatableSpellChain[this.repeatableSpellChain.length - 1];
    if (!spell) {
      this.energy = clamp(this.energy + 8, 0, this.maxEnergy);
      this.addSpellRing(this.player.position, 92, "#7cff9b", "收到");
      this.say("收到：暂时没有可复读的普通咒语，改为回声能。");
      return;
    }
    this.replaySpellEffect(spell, 0.46 * power);
    this.addSpellRing(this.player.position, 110, "#7cff9b", `收到：${SPELL_NAMES[spell]}`);
    this.say(`收到：弱化复读上一句 ${SPELL_NAMES[spell]}。`);
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
    this.addSpellRing(this.player.position, 104, "#c491ff", "内耗");
    this.say("内耗：扣一点状态，换声能和短爆发。");
  }

  private castBangFullCombo(power: number): void {
    const waves = 3 + Math.floor(this.bangLevel / 2);
    let hits = 0;
    for (let wave = 0; wave < waves; wave += 1) {
      const radius = 190 + wave * 46;
      const targets = [...this.enemies]
        .filter((enemy) => enemy.hp > 0 && distance(enemy.position, this.player.position) <= radius)
        .sort((a, b) => distance(a.position, this.player.position) - distance(b.position, this.player.position))
        .slice(0, 4 + wave);
      for (const enemy of targets) {
        hits += 1;
        this.damageEnemy(enemy, (18 + this.attackDamage * 0.62 + this.bangLevel * 4) * power, "bang");
        this.knockEnemyAway(enemy, this.player.position, 28 + wave * 9);
        this.addBurst(enemy.position, "#ffcf5a", 9);
      }
      this.addSpellRing(this.player.position, radius * 0.6, "#ffcf5a", wave === 0 ? "梆" : undefined, 0.55);
    }
    this.energy = clamp(this.energy + hits * 3.2, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 12 + hits * 2.2, 0, 100);
    this.clearEnemyShotsNear(this.player.position, 240);
    this.say(`隐藏 Combo：你就说梆梆不梆梆，连打 ${hits} 下。`);
  }

  private castBangTwoFists(power: number): void {
    const first = this.nearestEnemy(this.player.position, 260);
    const second = this.focusedTarget() ?? [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))[0];
    const punches = [first, second].filter((enemy, index, list): enemy is Enemy => !!enemy && list.indexOf(enemy) === index);
    if (punches.length === 0) {
      this.player.shield = Math.min(70, this.player.shield + 18);
      this.addSpellRing(this.player.position, 140, "#ffe27a", "两拳蓄势");
      this.say("梆梆两拳：场上没目标，转成护盾蓄势。");
      return;
    }
    punches.forEach((enemy, index) => {
      enemy.windup = 0;
      enemy.cooldown = Math.max(enemy.cooldown, 1.6 + index * 0.35);
      this.damageEnemy(enemy, (32 + this.attackDamage * 0.9 + this.bangLevel * 5) * power * (index === 1 ? 1.18 : 1), "bang");
      this.knockEnemyAway(enemy, this.player.position, 62 + index * 22);
      this.addSpellFan(Math.atan2(enemy.position.y - this.player.position.y, enemy.position.x - this.player.position.x), 0.28, 3, 190 + index * 36, "#ffe27a", index === 0 ? "第一拳" : "第二拳");
      this.addBurst(enemy.position, "#ffe27a", 18);
    });
    this.energy = clamp(this.energy + punches.length * 7, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + punches.length * 8, 0, 100);
    this.say("隐藏 Combo：梆梆两拳，先打断再点名。");
  }

  private castCardCheckCombo(power: number): void {
    const targets = [...this.enemies]
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => this.targetPriorityScore(b) - this.targetPriorityScore(a))
      .slice(0, 7);
    if (targets.length === 0) {
      this.energy = clamp(this.energy + 10, 0, this.maxEnergy);
      this.say("我要验牌：桌上暂时没牌，返还声能。");
      return;
    }
    this.markedEnemyId = targets[0].id;
    this.cardMarkTime = Math.max(this.cardMarkTime, 8.5 * power);
    for (const enemy of targets) {
      enemy.frozen = Math.max(enemy.frozen, 0.35);
      this.damageEnemy(enemy, (16 + this.attackDamage * 0.72) * power * (enemy.type === "target" ? 1.45 : 1), "cardCheck");
      this.addParticle(this.player.position, enemy.position, "#f8f1d1");
      this.addBurst(enemy.position, enemy.type === "target" ? "#ff4f6d" : "#f8f1d1", 11);
    }
    this.addSpellRing(this.player.position, 330, "#f8f1d1", "我要验牌");
    this.say(`隐藏 Combo：我要验牌，翻出 ${targets.length} 张危险牌。`);
  }

  private castTooLateCombo(power: number): void {
    const targetTime = this.elapsed - 2.2;
    const snapshot = [...this.playerHistory].reverse().find((item) => item.time <= targetTime) ?? this.playerHistory[0];
    if (snapshot) {
      const from = { ...this.player.position };
      const radius = this.effectivePlayerRadius();
      this.player.position = {
        x: clamp(snapshot.position.x, radius, this.width - radius),
        y: clamp(snapshot.position.y, radius, this.height - radius),
      };
      this.player.hp = Math.min(this.player.maxHp, Math.max(this.player.hp, snapshot.hp));
      this.addParticle(from, this.player.position, "#9cffd0");
      this.addBurst(from, "#9cffd0", 20);
    } else {
      this.shortSafeStep(140);
    }
    this.player.invuln = Math.max(this.player.invuln, 1.05);
    this.energy = clamp(this.energy + 18 * power, 0, this.maxEnergy);
    this.clearEnemyShotsNear(this.player.position, 260);
    this.addSpellRing(this.player.position, 250, "#9cffd0", "我去不早说");
    this.say("隐藏 Combo：我去不早说，玩家状态回溯，怪物受过的伤不回退。");
  }

  private castReceivedCombo(power: number): void {
    const spells = this.repeatableSpellChain.slice(-2);
    if (spells.length === 0) {
      this.energy = clamp(this.energy + 14, 0, this.maxEnergy);
      this.addSpellRing(this.player.position, 140, "#7cff9b", "收到收到");
      this.say("隐藏 Combo：收到，收到。没有可复读内容，转成声能确认戳。");
      return;
    }
    for (const spell of spells) {
      this.replaySpellEffect(spell, 0.68 * power);
    }
    this.explode(this.player.position, 150, (10 + this.attackDamage * 0.45) * power, false);
    this.addSpellRing(this.player.position, 180, "#7cff9b", "收到，收到");
    this.say(`隐藏 Combo：收到，收到。复读 ${spells.map((spell) => SPELL_NAMES[spell]).join(" / ")}。`);
  }

  private castExternalizeCombo(power: number): void {
    const center = this.densestEnemyPoint() ?? this.player.position;
    const missingHpRatio = 1 - this.player.hp / this.player.maxHp;
    const radius = 390;
    let affected = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || distance(enemy.position, center) > radius) continue;
      affected += 1;
      const push = normalize({ x: center.x - enemy.position.x, y: center.y - enemy.position.y });
      enemy.position.x = clamp(enemy.position.x + push.x * 72 * power, enemy.radius, this.width - enemy.radius);
      enemy.position.y = clamp(enemy.position.y + push.y * 72 * power, enemy.radius, this.height - enemy.radius);
      enemy.cooldown = Math.max(enemy.cooldown, 1.25);
      this.damageEnemy(enemy, (13 + this.attackDamage * 0.55) * power * (1 + missingHpRatio * 0.65), "externalDrain");
      this.addBurst(enemy.position, "#c491ff", 7);
    }
    this.player.shield = Math.min(70, this.player.shield + (10 + missingHpRatio * 22) * power);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 3.6 * power);
    this.addParticle(this.player.position, center, "#c491ff");
    this.addSpellRing(center, radius * 0.48, "#c491ff", "外耗转嫁");
    this.say(`隐藏 Combo：与其内耗不如外耗，转嫁 ${affected} 个敌人的压力。`);
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
      return false;
    }
    const cost = this.nextCannonPrepCost();
    if (this.energy < cost) {
      this.say(`第 ${this.cannonCharge + 1} 层一级准备需要 ${cost} 声能，还差 ${Math.ceil(cost - this.energy)}。`);
      return false;
    }
    this.energy -= cost;
    this.cannonCharge += 1;
    this.cannonMeter = clamp(this.cannonMeter + 32, 0, 100);
    this.recordSpell("cannonPrep");
    this.addBurst(this.player.position, "#ffe27a", 16 + this.cannonCharge * 4);
    this.say(`一级准备 x${this.cannonCharge}。充能越高，弹射越多、伤害越高。`);
    return true;
  }

  private nextCannonPrepCost(): number {
    return CANNON_PREP_COSTS[Math.min(this.cannonCharge, CANNON_PREP_COSTS.length - 1)];
  }

  private lockCannonTarget(): boolean {
    if (this.cannonCharge <= 0) {
      this.say("人间大炮还没装填。再喊一级准备先充能。");
      return false;
    }
    const target = this.densestEnemyPoint();
    this.cannonAiming = true;
    if (!target) {
      this.cannonTarget = { ...this.pointer };
      this.recordSpell("cannon");
      this.addParticle(this.player.position, this.cannonTarget, "#ffe27a");
      this.addBurst(this.cannonTarget, "#ffe27a", 12);
      this.say("人间大炮：进入瞄准。移动鼠标调整方向，再按一次发射。");
      return true;
    }
    this.cannonTarget = { ...target };
    this.recordSpell("cannon");
    this.addParticle(this.player.position, this.cannonTarget, "#ffe27a");
    this.addBurst(this.cannonTarget, "#ffe27a", 16);
    this.say("人间大炮：已对准敌群。可以移动鼠标微调，再按一次发射。");
    return true;
  }

  private fireCannon(): boolean {
    if (this.cannonCharge <= 0) {
      this.say("还没一级准备，先充能再发射。");
      return false;
    }
    if (!this.cannonTarget) {
      this.say("人间大炮还没瞄准。先锁定方向，再发射。");
      return false;
    }
    const meterCost = this.cannonFireMeterCost();
    if (this.cannonMeter < meterCost) {
      this.say(`大炮槽还差 ${Math.ceil(meterCost - this.cannonMeter)}，再等一下或打靶心怪。`);
      return false;
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
    this.fireCannon();  }

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
    if (this.isRepeatableNormalSpell(spell)) {
      this.repeatableSpellChain.push(spell);
      this.repeatableSpellChain = this.repeatableSpellChain.slice(-4);
    }
    if (new Set(this.spellChain).size >= 4) {
      this.energy = clamp(this.energy + 3 + this.chainEnergyBonus, 0, this.maxEnergy);
      this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 4);
    }
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
      this.addSpellRing(this.player.position, 108, "#ffcf5a", "没怪也给盾");
      this.say("不太梆，但给了点护盾。");
    } else {
      this.energy = clamp(this.energy + hits * 5, 0, this.maxEnergy);
      this.cannonMeter = clamp(this.cannonMeter + hits * 4, 0, 100);
      this.addSpellRing(this.player.position, 120, "#ffcf5a", `梆 x${hits}`);
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
    this.addSpellRing(this.player.position, 124, "#f8f1d1", "落子");
    this.say("技能五子棋，落子无悔。");
  }

  private castXiexiu(): void {
    const options = [...this.unlockedSpells].filter((spell) =>
      ["explode", "freeze", "lightning", "split", "pierce", "ricochet", "bang", "skillGo"].includes(spell),
    );
    if (options.length === 0) {
      this.player.shield = Math.min(70, this.player.shield + 10);
      this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 2.2);
      this.addBurst(this.player.position, "#d28cff", 18);
      this.addSpellRing(this.player.position, 116, "#d28cff", "邪修护体");
      this.say("邪修缺少可借用的攻击咒语，先转成护盾和短暂火力。");
      return;
    }
    const pick = options[Math.floor(Math.random() * options.length)] ?? "explode";
    this.energy = clamp(this.energy + SPELL_COSTS[pick] * 0.7, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 6, 0, 100);
    this.activeMods.damageBoost = Math.max(this.activeMods.damageBoost, 3.2);
    this.addSpellRing(this.player.position, 118, "#d28cff", `邪修：${SPELL_NAMES[pick]}`);
    this.castSpell(pick);
    if (Math.random() < 0.28) {
      this.hurtPlayer(4, true);
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
      position: { ...enemy.position },
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
    return 1;
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
      this.player.hp = 1;
      this.fatalInsuranceTime = 0;
      this.player.invuln = Math.max(this.player.invuln, 1.45);
      this.player.shield = Math.min(70, this.player.shield + 18);
      this.delayedHealTime = 1.1;
      this.delayedHealAmount = Math.max(this.delayedHealAmount, 26);
      this.nextSpellFree = true;
      this.clearEnemyShotsNear(this.player.position, 340);
      this.knockEnemiesFrom(this.player.position, 320, 54);
      this.addSpellRing(this.player.position, 260, "#f8f1d1", "今晚不死");
      this.say("爱你老己，明天见：致命伤被留到明天处理，下一个普通咒语免费。");
      return;
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
    this.xpGoal = this.level <= 6 ? Math.round(this.xpGoal * 1.08 + 5) : Math.round(this.xpGoal * 1.16 + 11);
    this.applyBaselineLevelReward();
    this.energy = clamp(this.energy + 10, 0, this.maxEnergy);
    this.cannonMeter = clamp(this.cannonMeter + 8, 0, 100);
    this.addBurst(this.player.position, "#7cff9b", 48);
    this.addBurst(this.player.position, "#8ee8ff", 28);
    this.selectingBuff = true;
    this.showBuffChoices();
  }

  private applyBaselineLevelReward(): void {
    this.attackDamage += 0.7;
    if (this.level % 3 === 0) this.maxEnergy += 2;
    this.player.maxHp += 2;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
  }

  private showBuffChoices(count = 3): void {
    this.pauseVoiceForUpgrade();
    const choices = this.draftBuffs(count);
    this.upgradeChoices.replaceChildren();
    this.upgradeOverlay.querySelector("h1")!.textContent = "选择强化";
    for (const buff of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.rarity = buff.rarity;
      button.dataset.kind = this.buffKind(buff);
      button.innerHTML = `
        <span class="survivor-card-tags">
          <i>${buff.rarity === "diamond" ? "钻石" : buff.rarity === "gold" ? "黄金" : "青铜"}</i>
          <i>${this.buffKindLabel(buff)}</i>
        </span>
        <strong>${buff.title}</strong>
        <em>${buff.description}</em>
      `;
      button.addEventListener("click", () => this.applyBuff(buff));
      this.upgradeChoices.append(button);
    }
    this.upgradeOverlay.hidden = false;
  }

  private applyBuff(buff: Buff, options: { gm?: boolean } = {}): void {
    buff.apply();
    this.ownedBuffs.set(buff.id, (this.ownedBuffs.get(buff.id) ?? 0) + 1);
    if (buff.spell) this.unlockedSpells.add(buff.spell);
    this.selectingBuff = false;
    this.upgradeOverlay.hidden = true;
    this.renderCommandDock();
    this.addBuffFeedback(buff);
    if (options.gm) {
      this.say(buff.spell ? `GM: unlocked ${buff.spell}` : `GM: buff ${buff.id}`);
      return;
    }
    this.say(buff.spell ? `解锁咒语：${SPELL_NAMES[buff.spell]}，已加入底部施法栏。` : `获得被动强化：${buff.title}，效果已立即生效。`);
    this.resumeVoiceAfterUpgrade();
  }

  private buffKind(buff: Buff): "spell" | "combo" | "passive" {
    if (buff.spell) return "spell";
    if (buff.id.startsWith("combo-") || buff.id === "stat-chain") return "combo";
    return "passive";
  }

  private buffKindLabel(buff: Buff): string {
    const kind = this.buffKind(buff);
    if (kind === "spell") return "解锁咒语";
    if (kind === "combo") return "组合强化";
    return "被动生效";
  }

  private addBuffFeedback(buff: Buff): void {
    const kind = this.buffKind(buff);
    const color = kind === "spell" ? "#8ee8ff" : kind === "combo" ? "#ffe27a" : "#7cff9b";
    this.addBurst(this.player.position, color, kind === "passive" ? 18 : 26);
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
    const seriousBonus = this.activeMods.seriousTime > 0 ? 1.2 : 0;
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

  private say(message: string): void {
    this.statusLine.textContent = message;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    if (this.screenShake > 0) {
      const strength = this.screenShakePower * clamp(this.screenShake / 0.44, 0, 1);
      ctx.translate((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
    }
    this.renderer.render(ctx, this.getRenderState());
    this.renderSpellCues(ctx);
    ctx.restore();
    this.renderComboFlash(ctx);
    this.renderHudText();
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
    ctx.shadowBlur = cannon ? 22 : 14;
    ctx.beginPath();
    ctx.arc(0, 0, (cannon ? this.player.radius : bodyRadius) + (cannon ? 5 : 0), 0, Math.PI * 2);
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
      const color = projectile.explosion ? "#ffb15a" : projectile.freeze ? "#a8ecff" : projectile.lightning ? "#e5ff66" : "#66e0ff";
      const speed = Math.max(1, Math.hypot(projectile.velocity.x, projectile.velocity.y));
      const direction = { x: projectile.velocity.x / speed, y: projectile.velocity.y / speed };
      const isPiercing = projectile.pierce > 0;
      const isRicochet = projectile.ricochet > 0;
      ctx.save();
      ctx.lineCap = "round";
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
      const progress = 1 - clamp(cue.life / cue.maxLife, 0, 1);
      const alpha = clamp(cue.life / cue.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = cue.color;
      ctx.fillStyle = cue.color;
      ctx.lineCap = "round";
      ctx.shadowColor = cue.color;
      ctx.shadowBlur = 16;

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

  private renderComboFlash(ctx: CanvasRenderingContext2D): void {
    const flash = this.comboFlash;
    if (!flash) return;
    const alpha = clamp(flash.life / flash.maxLife, 0, 1);
    const progress = 1 - alpha;
    const centerX = this.width / 2;
    const centerY = this.height * 0.32;
    const pulse = 1 + Math.sin(progress * Math.PI) * 0.08;

    ctx.save();
    ctx.globalAlpha = alpha * 0.28;
    const gradient = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.max(this.width, this.height) * 0.62);
    gradient.addColorStop(0, flash.color);
    gradient.addColorStop(0.35, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = "rgba(5, 7, 14, 0.42)";
    const bannerWidth = Math.min(this.width * 0.82, 720);
    const bannerHeight = 86;
    ctx.fillRect(centerX - bannerWidth / 2, centerY - bannerHeight / 2, bannerWidth, bannerHeight);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = flash.color;
    ctx.shadowBlur = 28;
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.round(35 * pulse)}px Microsoft YaHei, sans-serif`;
    ctx.fillText(flash.label, centerX, centerY - 9 - progress * 10);
    ctx.shadowBlur = 16;
    ctx.fillStyle = flash.accent;
    ctx.font = "800 16px Microsoft YaHei, sans-serif";
    ctx.fillText(flash.sublabel, centerX, centerY + 30 - progress * 6);

    ctx.strokeStyle = flash.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.86;
    ctx.beginPath();
    ctx.moveTo(centerX - bannerWidth * 0.44, centerY + bannerHeight * 0.5);
    ctx.lineTo(centerX + bannerWidth * 0.44, centerY + bannerHeight * 0.5);
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
      { spell: "serious", time: this.activeMods.seriousTime, duration: 5.5 },
      { spell: "noTalk", time: this.activeMods.refusalTime, duration: 5.5 },
      { spell: "bodyShape", time: this.activeMods.slimTime, duration: 8 },
      { spell: "graceful", time: this.activeMods.gracefulTime, duration: 8 },
    ];
    const tracked = allTracked.filter((item) => this.unlockedSpells.has(item.spell));

    this.activeSpellPanel.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "持续效果";
    this.activeSpellPanel.append(title);

    if (tracked.length === 0) {
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

  private renderCommandDock(): void {
    this.commandDock.replaceChildren();
    const header = document.createElement("div");
    header.className = "survivor-command-header";
    const title = document.createElement("strong");
    title.textContent = "手动施法";
    const subtitle = document.createElement("span");
    subtitle.textContent = "语音可选";
    header.append(title, subtitle);

    const list = document.createElement("div");
    list.className = "survivor-command-list";

    ([
      ["cannonPrep", "q"],
      ["cannon", "e"],
      ["cannonFire", "r"],
    ] as const).forEach(([spell, shortcut]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.spell = spell;
      button.dataset.shortcut = shortcut;
      button.addEventListener("click", () => {
        this.pulseCommandButton(button);
        this.castSpell(spell);
      });
      list.append(button);
    });

    const visible = this.commandSpells();
    visible.forEach((spell, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.spell = spell;
      if (index < 9) {
        button.dataset.shortcut = String(index + 1);
      }
      button.addEventListener("click", () => {
        this.pulseCommandButton(button);
        this.castSpell(spell);
      });
      list.append(button);
    });

    this.commandDock.append(header, list);
    this.updateCommandDockState();
  }

  private pulseCommandButton(button: HTMLButtonElement): void {
    button.classList.remove("is-pressed");
    void button.offsetWidth;
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 180);
  }

  private commandSpells(): SpellKey[] {
    const unlocked = [...this.unlockedSpells].filter((spell) => !["cannon", "cannonPrep", "cannonFire"].includes(spell));
    return unlocked;
  }

  private updateCommandDockState(): void {
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
  }

  private renderCommandButton(button: HTMLButtonElement, state: CommandButtonState): void {
    const shortcut = button.dataset.shortcut ?? "";
    const spell = button.dataset.spell as SpellKey | undefined;
    const art = getLineglowSpellArt(spell ?? "cannon");
    button.dataset.tone = art.tone;

    const icon = document.createElement("span");
    icon.className = "survivor-command-icon";
    icon.textContent = art.glyph;

    const key = document.createElement("span");
    key.className = "survivor-command-key";
    key.textContent = shortcut ? shortcut.toUpperCase() : "-";

    const copy = document.createElement("span");
    copy.className = "survivor-command-copy";
    const label = document.createElement("strong");
    label.textContent = state.label;
    const meta = document.createElement("em");
    meta.textContent = state.meta;
    copy.append(label, meta);

    const badge = document.createElement("span");
    badge.className = "survivor-command-state";
    badge.textContent = state.badge;

    button.setAttribute("aria-label", `${shortcut ? `${shortcut}，` : ""}${state.label}，${state.meta}，${state.badge}`);
    button.replaceChildren(icon, key, copy, badge);
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
