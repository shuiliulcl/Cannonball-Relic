# Game Design - Cannonball Relic

## One-Line Pitch

一款 2.5D 斜俯视弹珠肉鸽：玩家控制角色走位、蓄力发射弹珠，利用墙面和障碍物反弹叠加伤害，在回收和再发射之间打出高倍率清场。

## Target Competition Fit

- 交付形态：PC 浏览器可直接运行的 HTML5 游戏资源包。
- 核心亮点：弹珠反弹增伤、预瞄轨迹、回收路径伤害、波次肉鸽强化。
- AI 参与点：代码协作、玩法参数迭代、贴图/图标/封面生成、PV 分镜与说明材料。

## Reference Visual Direction

目标画风接近“手绘 2.5D 独立游戏”：

- 斜俯视正交镜头，玩法仍在平面上计算。
- 大理石棋盘地面、两侧高墙/柱子、木质障碍物。
- 角色和怪物可先用 billboard 纸片精灵，后续替换为低模或逐帧图。
- 弹珠、轨迹线、命中特效使用发光材质和粒子。
- UI 使用木质/铜色/羊皮纸质感，但首版先保持清晰可读。

## Core Loop

1. 玩家进入房间。
2. 怪物生成并向玩家靠近或守在阵型中。
3. 玩家移动、瞄准、蓄力发射弹珠。
4. 弹珠撞墙反弹，每次反弹提升本颗弹珠伤害。
5. 弹珠命中怪物造成伤害，回收途中也可造成伤害。
6. 清掉本波怪物后，选择一个肉鸽强化。
7. 新波次生成，敌人更多或更强。

## Controls

- `WASD`: move.
- `Space`: dash toward current movement direction.
- Left mouse hold: charge and show preview trajectory.
- Left mouse release: fire marble.
- Right mouse: recall active marble.

## MVP Scope

首个可玩版本必须包含：

- 2.5D arena scene.
- Player movement.
- Mouse aim and trajectory preview.
- One active marble.
- Wall and obstacle bounce damage scaling.
- Monster hit, score, and wave clear.
- Three upgrade choices after each wave.

## Rogue Upgrade Examples

- More Marble: active marble count +1.
- Sharper Bounce: bonus damage per bounce +1.
- Longer Shot: marble travel range +20%.
- Recall Blade: recall damage +50%.
- Soft Aim: small homing angle after bounce.
- Quick Dash: dash cooldown -20%.
- Human Cannon: a rare special card that stops firing marbles and launches the player as the projectile for a short high-risk burst.

## Card System Direction

Cards are drafted after wave clear from a weighted pool. The default game remains marble firing and recall. Special cards may bend rules temporarily, but they should not silently redefine the baseline control scheme.

### Card Rarity And One-Time Rules

- Card rarity should be visually distinct in both frame and background treatment:
  - Diamond card: highest rarity, strongest build-changing effects.
  - Gold card: rare/high-value effects.
  - Bronze card: common numeric or utility upgrades.
- Diamond cards can only be drafted once per run. After a diamond card is selected, remove that exact card from the remaining draft pool for the rest of the run.
- Rarity visuals should be readable at a glance before the player reads the card text.

## HUD Direction

UI should read like an in-game HUD rather than a web dashboard:

- Top-left HP bar with icon and numeric health.
- Top-center wave/progress bar.
- Bottom-left compact control reference.
- Bottom-center buff/marble status meter.
- Keep gameplay canvas full-screen behind the HUD.

### Buff Review Panel

- Add a top HUD icon that opens the current buff review panel.
- The panel lists every buff/card currently owned by the player, including name, rarity, short effect text, and stack/count where relevant.
- Opening this panel pauses gameplay immediately.
- Closing the panel resumes gameplay if the game was running before the panel opened.
- The panel should not appear during result screens unless explicitly reopened from a future meta screen.

### Cooldown And Combat Readability

- Show the Space dodge/roll cooldown in the lower HUD area.
- Add a health bar above each monster. The bar should be small, readable, and not obscure the monster silhouette.
- The trajectory preview should change color by bounce segment: each bounce makes the later segment redder so players can distinguish bounce order and expected damage buildup.

## Out Of Scope For First Slice

- Full art pipeline.
- Complex physics engine.
- Network features.
- Save system.
- Mobile controls.

## Control And Combat Rule Updates

- Tap-fire bullets and hold-charge bullets should use the same final projectile speed. Charging may affect preview/commit timing or other future stats, but it should not make tap-fire feel like a weaker projectile by default.
- Space dodge should become a 0.5 second fast movement/roll instead of an instant teleport.
- During the 0.5 second dodge/roll movement, the player is invincible.
- Dodge/roll should preserve player agency and readability: the movement direction is based on current input direction, with a sensible fallback only if no movement key is held.
