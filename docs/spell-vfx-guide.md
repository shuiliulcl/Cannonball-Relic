# 咒语爆炸效果调参指南

本文档说明语音幸存者模式里的咒语冲击视觉如何调整，方便后续新增咒语或平衡爆炸感。

## 目标

咒语视觉分三档，不是所有技能都使用强冲击。

- **轻反馈**：用于准备、锁定、位移、护盾、持续 Buff 维护。只给粒子、范围环或状态文案。
- **中反馈**：用于范围控制、连锁、较明显的战斗变化。可以给少量咒印、轻微闪屏或弱震动。
- **强反馈**：用于主动炸裂型技能、爆点伤害、隐藏 Combo、人间大炮发射和落地。使用屏幕震动、闪屏、短暂停顿、大字或多字咒印。

## 主要入口

文件：[VoiceSurvivorGame.ts](../src/survivor/VoiceSurvivorGame.ts)

核心函数：

```ts
playSpellImpact({
  glyph: "爆",
  glyphCount: 5,
  glyphSize: 58,
  color: "#ff9b4a",
  shake: 7,
  flash: 0.18,
  hitStop: 0.035,
  radius: 116,
  particles: 18,
});
```

参数说明：

| 参数 | 作用 | 建议范围 |
|---|---|---|
| `glyph` | 咒印文字 | 单字优先，组合技可用核心字 |
| `glyphCount` | 咒印数量 | 范围技 3-6，单体爆发 1 |
| `glyphSize` | 咒印字号 | 范围技 48-64，单体爆发 120-190 |
| `glyphSpread` | 多咒印扩散距离 | 默认跟随 `radius`，大范围可 120-180 |
| `color` | 主色 | 与技能元素一致 |
| `shake` | 屏幕震动强度 | 轻 2-4，中 5-8，强 9-16 |
| `flash` | 闪屏透明度 | 轻 0.06-0.1，中 0.12-0.18，强 0.2-0.28 |
| `hitStop` | 短暂停顿秒数 | 中 0.03-0.05，强 0.06-0.09 |
| `slowMo` | 短慢动作倍率 | 中 0.5-0.65，强 0.28-0.48 |
| `slowMoDuration` | 慢动作真实持续秒数 | 0.16-0.3 |
| `zoom` | 镜头 punch 放大强度 | 中 0.02-0.04，强 0.05-0.08 |
| `zoomDuration` | 镜头 punch 回弹秒数 | 0.16-0.3 |
| `impactLines` | 放射冲击线数量 | 中 8-14，强 16-28 |
| `impactLineRadius` | 冲击线扩散半径 | 中 110-160，强 180+ |
| `radius` | 冲击环半径 | 小 80-110，中 120-150，大 160+ |
| `particles` | 追加粒子数 | 轻 6-12，中 14-24，强 26-48 |

## 手感型效果

这批效果用于“打中了”的瞬间手感，不要覆盖到准备、锁定、护盾、聚拢这类功能型咒语。

- **顿帧 `hitStop`**：最硬的命中反馈，适合炮击、拳击、爆点。持续太长会影响连续操作，通常不超过 0.09。
- **慢动作 `slowMo`**：让爆发窗口更有重量，适合人间大炮发射/落地、爆炸 Combo。持续时间用真实时间衰减，不会永久拖慢游戏。
- **镜头 punch `zoom`**：瞬间放大世界层，HUD 不缩放。适合单点重击和炮弹落地，强度建议小步调整。
- **冲击线 `impactLines`**：强化爆点方向感。范围爆发用更多线，单体爆发用较少但配合大字。
- **闪电弧 `addLightningArc`**：雷电专用链路反馈，从施法点跳到目标再串到下一个目标。用黄绿外光加白芯，适合雷电、雷爆跳弹、带电投射物命中。
- **残影 `addPlayerAfterimage`**：只给位移和高速冲刺。闪避、从容、连滚带爬、人间大炮飞行会留下短残影，但不加大闪屏。

## 咒印规则

范围技能强调“覆盖感”，字体数量更多、单字更小：

```ts
playSpellImpact({
  glyph: "爆",
  glyphCount: 5,
  glyphSize: 58,
  color: "#ff9b4a",
  radius: 116,
});
```

单体或爆点伤害强调“打中感”，字体数量少、字号更大：

```ts
playSpellImpact({
  glyph: "轰",
  glyphSize: 180,
  color: "#ff9b4a",
  shake: 16,
  flash: 0.24,
  hitStop: 0.065,
});
```

## 当前强冲击技能

| 类型 | 技能 | 表现 |
|---|---|---|
| 普通主动 | 爆炸 | 多个“爆”字、橙色闪屏、震动、短暂停顿 |
| 普通主动 | 雷电 | 多个“雷”字、黄绿闪屏、轻停顿、链式锯齿电弧、命中电火花 |
| 普通主动 | 梆梆 | 命中时大“梆”或多个“梆”，带短 slomo 和冲击线 |
| 普通主动 | 你已急哭 | 命中敌群后多个“急”字，带轻镜头 punch |
| 大炮核心 | 发射 | 大“发射”、强震动、闪屏、短暂停顿、slomo、镜头 punch、冲击线 |
| 大炮核心 | 落地冲击 | 超大“轰”、强震动、爆点粒子、强 slomo、强镜头 punch |
| 组合 | 雷爆跳弹 / 冻结爆炸 / 弹跳开花 / 炮弹开花 | 多字范围咒印、组合色闪屏、按爆发强度追加 slomo 和冲击线 |
| 隐藏 Combo | 梆梆系 / 不讲不讲 / 内耗外耗 | 按技能性质使用多字或大字，爆发型才追加 slomo / zoom |

## 当前轻反馈技能

这些技能不建议加大震动或大字，保持清晰但不过度抢戏：

- 一级准备
- 人间大炮锁定
- 分裂
- 穿透
- 弹射
- 闪避 / 从容 / 连滚带爬
- 护盾
- 聚拢 / 来财
- 锁定 / 当个事儿办
- 身材 / 曼妙 / 老己 / 明天见

## 调参原则

1. **准备类不炸**：准备和锁定负责铺垫，不要用强震动和大字。
2. **范围技多字**：清场、控制、领域类技能用 `glyphCount` 提升覆盖感。
3. **单点技大字**：拳、穿透爆点、人间大炮落点用 `glyphSize` 提升命中感。
4. **Combo 比普通技能更强**：同类技能里，隐藏 Combo 和语音组合可以提高 20%-40% 的 `shake`、`flash`、`particles`。
5. **避免长期遮挡**：咒印 `life` 当前默认较短，不建议超过 0.8 秒。
6. **先调半档**：如果觉得太吵，优先降 `flash` 和 `shake`，保留咒印和粒子。

## 新增技能接入模板

范围爆发：

```ts
this.playSpellImpact({
  glyph: "爆",
  glyphCount: 5,
  glyphSize: 56,
  color: "#ff9b4a",
  shake: 8,
  flash: 0.18,
  hitStop: 0.04,
  slowMo: 0.48,
  slowMoDuration: 0.2,
  zoom: 0.035,
  impactLines: 16,
  impactLineRadius: 160,
  radius: 130,
  particles: 20,
});
```

单体重击：

```ts
this.playSpellImpact({
  glyph: "拳",
  glyphSize: 150,
  color: "#ffe27a",
  shake: 11,
  flash: 0.2,
  hitStop: 0.06,
  slowMo: 0.38,
  slowMoDuration: 0.2,
  zoom: 0.05,
  impactLines: 12,
  impactLineRadius: 130,
  radius: 110,
  particles: 24,
});
```

位移残影：

```ts
const from = { ...this.player.position };
const safe = this.safeDirection();
this.addPlayerAfterimage(from, "#66e0ff", this.effectivePlayerRadius(), 0.24, Math.atan2(safe.y, safe.x), 1.35);
```

轻状态：

```ts
this.addSpellRing(this.player.position, 120, "#8ee8ff", "状态");
this.addBurst(this.player.position, "#8ee8ff", 10);
```

## 检查清单

- 技能是否是主动炸裂型？不是的话优先轻反馈。
- 范围技能是否使用了 `glyphCount > 1`？
- 单点爆发是否使用了更大的 `glyphSize`？
- `shake` 是否会影响连续操作可读性？
- `flash` 是否过强导致画面发白？
- `slowMo` 是否只挂在主动爆发或重击上？
- `zoom` 是否会让目标和玩家暂时离开可读区域？
- 位移类是否只用残影，不额外加大闪屏和强震动？
- 触发失败、声能不足、未解锁等状态是否只用文字或轻反馈？
