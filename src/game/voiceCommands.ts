import type { VoiceAction } from "./types";

export type VoiceCommand = {
  id: string;
  aliases: readonly string[];
  action: VoiceAction;
  priority?: number;
};

const FIRE_ALIASES = [
  "开火",
  "发射",
  "开",
  "发",
  "凯",
  "铠",
  "楷",
  "恺",
  "刊",
  "看",
  "发社",
  "发设",
  "发涉",
  "发誓",
  "法射",
  "法社",
  "法设",
  "法师",
  "发生",
  "发现",
  "开发",
  "开伙",
  "开活",
  "开霍",
  "开炮",
  "开跑",
  "开票",
  "射击",
  "设计",
  "涉及",
  "社稷",
  "打",
  "fire",
  "shoot",
] as const;

const RECALL_ALIASES = [
  "回收",
  "回手",
  "回首",
  "回受",
  "会收",
  "会手",
  "挥手",
  "汇收",
  "回修",
  "回宿",
  "回朔",
  "回缩",
  "回溯",
  "召回",
  "找回",
  "照回",
  "招回",
  "着回",
  "收回",
  "手回",
  "守回",
  "回来",
  "回來",
  "会来",
  "回来吧",
  "回來吧",
  "回来呀",
  "回去",
  "回球",
  "收球",
  "收",
  "回",
  "recall",
  "return",
] as const;

const EVADE_ALIASES = [
  "闪避",
  "闪",
  "闪开",
  "闪一下",
  "躲避",
  "躲",
  "躲开",
  "躲一下",
  "避开",
  "闪壁",
  "闪币",
  "闪闭",
  "闪必",
  "善避",
  "善必",
  "闪退",
  "冲刺",
  "衝刺",
  "重刺",
  "充次",
  "充斥",
  "dash",
  "dodge",
  "evade",
] as const;

const VOICE_START_ALIASES = [
  "开启语音",
  "打开语音",
  "启动语音",
  "开始语音",
  "启用语音",
  "恢复语音",
  "继续听",
  "语音开启",
  "语音打开",
  "语音启用",
  "开语音",
  "开麦",
  "打开麦克风",
  "开麦克风",
  "开起语音",
  "开机语音",
  "开启",
  "打开",
  "启动",
  "开始",
  "启用",
  "恢复",
] as const;

const VOICE_STOP_ALIASES = [
  "关闭语音",
  "停止语音",
  "关掉语音",
  "语音关闭",
  "语音停止",
  "语音暂停",
  "关闭声音",
  "停止监听",
  "停止识别",
  "暂停语音",
  "关语音",
  "关麦",
  "闭麦",
  "麦克风关闭",
  "关麦克风",
  "不要听了",
  "别听了",
  "关机语音",
  "关起语音",
  "关闭",
  "停止",
  "暂停",
  "关掉",
  "别听",
] as const;

export const VOICE_COMMANDS: readonly VoiceCommand[] = [
  { id: "voiceStart", aliases: VOICE_START_ALIASES, action: { type: "voice", command: "start" }, priority: 20 },
  { id: "voiceStop", aliases: VOICE_STOP_ALIASES, action: { type: "voice", command: "stop" }, priority: 20 },
  { id: "fire", aliases: FIRE_ALIASES, action: { type: "fire" } },
  { id: "recall", aliases: RECALL_ALIASES, action: { type: "recall" } },
  { id: "evade", aliases: EVADE_ALIASES, action: { type: "evade" } },
];

const PUNCTUATION_PATTERN = /[\s,.;:!?，。；：！？、'"`~()[\]{}<>《》【】]/g;

export function normalizeVoiceText(text: string): string {
  return text.toLowerCase().replace(PUNCTUATION_PATTERN, "");
}

export function matchVoiceActions(text: string, commands: readonly VoiceCommand[] = VOICE_COMMANDS): VoiceAction[] {
  const normalized = normalizeVoiceText(text);
  if (!normalized) {
    return [];
  }

  const matches: Array<{ id: string; position: number; priority: number; action: VoiceAction; aliasLength: number }> = [];
  for (const command of commands) {
    let bestMatch: { id: string; position: number; priority: number; action: VoiceAction; aliasLength: number } | undefined;
    for (const alias of command.aliases) {
      const aliasForm = normalizeVoiceText(alias);
      if (!aliasForm) {
        continue;
      }
      const position = normalized.lastIndexOf(aliasForm);
      if (position !== -1) {
        const match = { id: command.id, position, priority: command.priority ?? 0, action: command.action, aliasLength: aliasForm.length };
        if (!bestMatch || match.position > bestMatch.position || (match.position === bestMatch.position && match.aliasLength > bestMatch.aliasLength)) {
          bestMatch = match;
        }
      }
    }
    if (bestMatch) matches.push(bestMatch);
  }

  const hasExplicitUtilityAction = matches.some((match) => match.id !== "fire");
  const filteredMatches = matches
    .filter((match) => !hasExplicitUtilityAction || match.id !== "fire" || match.aliasLength > 1)
    .sort((a, b) => b.priority - a.priority || b.position - a.position || b.aliasLength - a.aliasLength);

  return filteredMatches[0] ? [filteredMatches[0].action] : [];
}
