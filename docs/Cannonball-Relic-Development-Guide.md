# Cannonball Relic 开发文档

> 面向参赛团队、协作同事以及接入项目的 AI coding agent。  
> 目标：让任何人先读这份文档，就能理解游戏方向、工程启动方式、目录结构、协作边界和当前注意事项。

## 1. 项目概览

**项目名：Cannonball Relic**

Cannonball Relic 是一个 PC 浏览器端运行的 2.5D Top-Down RogueLite 弹珠动作游戏原型。玩家控制角色走位，蓄力发射弹珠，利用墙壁和障碍物反弹叠加伤害，击杀怪物后选择卡牌强化，逐波推进。

核心关键词：

- 2.5D 斜俯视
- 弹珠反弹
- 回收路径伤害
- 清波三选一卡牌
- RogueLite 构筑
- HTML5 资源包交付

重要设计原则：

- 默认核心玩法是 **角色发射弹珠**。
- **人间大炮** 是后期/特殊卡效果，不是默认基础操作。
- 不要在未确认设计意图前，把特殊卡改成主机制。

## 2. 重要链接

| 类型 | 链接 |
|-|-|
| 比赛指南 | https://papergames.feishu.cn/wiki/T64ewlKG4izMiSk75sZcdOganaf |
| 游戏概念文档 | https://papergames.feishu.cn/wiki/CN6vwzPrmiSKNukCDqhcLQR1nge |
| GitHub 仓库 | https://github.com/shuiliulcl/Cannonball-Relic |
| 本地/局域网预览 | 运行 `npm run dev` 或 `npm run dev:lan` 后查看控制台地址 |

GitHub 仓库内建议优先阅读：

- `README.md`
- `Tasklist.md`
- `docs/GameDesign.md`
- `docs/TechPlan.md`
- `docs/CollaboratorGuide.md`
- `docs/AIProcess.md`

## 3. 当前可玩版本

当前版本已经具备：

- Vite + TypeScript + Three.js 工程结构
- 2.5D 斜俯视场景
- WASD 移动
- 空格冲刺
- 鼠标左键蓄力预瞄，松开发射弹珠
- 右键回收弹珠
- 弹珠撞墙/障碍物反弹
- 反弹叠加伤害
- 怪物追踪、受击、死亡计分
- 清波后三选一卡牌
- 卡牌稀有度：common / rare / special
- Special 卡：Human Cannon
- Game Over / Restart
- 伤害数字、反弹火花、命中特效

## 4. 工程启动方式

### 4.1 环境要求

- Node.js 18+ 推荐
- npm
- 现代 PC 浏览器

### 4.2 安装依赖

```bash
npm install
```

### 4.3 本机开发

```bash
npm run dev
```

默认只绑定本机，适合自己调试。

### 4.4 局域网预览

```bash
npm run dev:lan
```

适合同事在同一局域网内试玩。启动后把控制台里的 Network 地址发给同事。

### 4.5 构建

```bash
npm run build
```

构建产物在 `dist/`。比赛最终 HTML5 资源包应以 `dist/` 为基础整理压缩。

## 5. 目录结构

```text
src/
  main.ts
  styles.css
  game/
    Game.ts
    config.ts
    input.ts
    physics.ts
    types.ts
    upgrades.ts
  render/
    SceneView.ts
    effects.ts
    factories.ts
  ui/
    Hud.ts
docs/
  GameDesign.md
  TechPlan.md
  CollaboratorGuide.md
  AIProcess.md
  Cannonball-Relic-Development-Guide.md
```

### 5.1 关键文件说明

| 文件 | 作用 |
|-|-|
| `src/game/Game.ts` | 主循环、波次、战斗、卡牌效果 |
| `src/game/config.ts` | 核心数值、地图尺寸、障碍布局 |
| `src/game/physics.ts` | 平面物理、反弹、轨迹预览 |
| `src/game/upgrades.ts` | 卡牌配置池、权重抽卡 |
| `src/render/SceneView.ts` | Three.js 场景、相机、地面、模型同步 |
| `src/render/effects.ts` | 伤害数字、火花粒子 |
| `src/ui/Hud.ts` | HUD 和卡牌选择 UI |
| `src/styles.css` | 页面与 UI 样式 |

## 6. 玩法设计摘要

### 6.1 基础循环

1. 玩家进入房间。
2. 怪物生成。
3. 玩家走位并蓄力发射弹珠。
4. 弹珠撞墙/障碍反弹，反弹次数提升伤害。
5. 弹珠命中怪物造成伤害。
6. 弹珠可被右键回收，回收路径也能造成伤害。
7. 清波后选择卡牌强化。
8. 进入下一波。

### 6.2 卡牌系统

卡牌配置位于 `src/game/upgrades.ts`。

卡牌字段：

| 字段 | 说明 |
|-|-|
| `id` | 唯一标识，需要同步加入 `UpgradeId` |
| `rarity` | `bronze` / `gold` / `diamond` |
| `title` | UI 展示名称 |
| `description` | UI 展示描述 |
| `weight` | 抽取权重 |
| `uniquePerRun` | 可选，`true` 表示单局仅能抽一次（所有钻石卡默认应设此项） |
| `apply` | `(stats, player) => void`，直接修改属性，无需改 `Game.chooseUpgrade` |

新增卡牌流程：

1. 在 `src/game/types.ts` 的 `UpgradeId` 加新 id。
2. 在 `src/game/upgrades.ts` 增加卡牌配置，在 `apply` 里写效果。
3. 如有 UI 或特效需求，再改 `src/ui/Hud.ts` 或 `src/render/effects.ts`。
4. 更新 `docs/GameDesign.md` 或 `docs/CollaboratorGuide.md`。

### 6.3 Human Cannon 特殊卡

Human Cannon 是 `diamond`（钻石）卡。

设计边界：

- 只能在玩家选到该卡后触发。
- 不改变默认操作方式。
- 触发后短时间把玩家作为炮弹发射。
- 反弹叠加高伤害。
- 高风险、高爆发，用于制造惊喜和局内爽点。

## 7. 协作分工建议

| 方向 | 主要文件 | 适合任务 |
|-|-|-|
| 玩法/战斗 | `src/game/Game.ts`, `config.ts` | 怪物、波次、伤害、手感 |
| 卡牌/构筑 | `src/game/upgrades.ts`, `types.ts` | 新卡、稀有度、权重、构筑流派 |
| 渲染/美术表现 | `src/render/*` | 场景、角色、怪物、特效、镜头 |
| UI/UX | `src/ui/Hud.ts`, `src/styles.css` | HUD、卡牌面板、开始/结束界面 |
| 文档/材料 | `docs/*` | AI 过程说明、PV 文案、比赛提交材料 |

## 8. AI 协作规则

给 AI agent 的最低要求：

- 先读 `docs/GameDesign.md` 和 `docs/CollaboratorGuide.md`。
- 不要跳过 `Tasklist.md`，做完任务要更新。
- 不要擅自改核心设计。
- 不要把 Human Cannon 改成默认基础机制。
- 新增卡牌必须走配置化流程。
- 涉及视觉资产时，必须确保不使用商业 IP、内部未授权素材或侵权内容。
- 使用 AI 生成代码、图像、音频、文案时，记录到 `docs/AIProcess.md`。

## 9. 当前技术决策

### 9.1 为什么用 Three.js

比赛要求 PC 网页端运行，HTML5 资源包最稳。Three.js 能在浏览器直接运行，既能做 2.5D 视觉，也比 Unity WebGL 更轻、更快、更方便调试和提交。

### 9.2 为什么暂不使用完整物理引擎

核心玩法需要的是可控的弹珠街机手感，而不是完全真实的刚体模拟。当前使用自写平面物理，优点是：

- 轨迹预瞄更可控
- 反弹规则更容易调
- 卡牌效果更容易插入
- 同事上手成本更低

后续如果加入复杂机关、斜坡、动态物体，再评估 Rapier 等物理库。

## 10. 下一阶段建议

优先级从高到低：

1. 增加怪物类型：追踪怪、盾牌怪、炮台怪。
2. 增加卡牌流派：多弹珠、穿透、吸附、分裂、回收刀锋。
3. 优化预瞄线：显示多次反弹点和预计命中目标。
4. 强化 2.5D 美术：神殿地砖、墙柱、木箱、手绘 UI。
5. 加音效：蓄力、发射、反弹、命中、清波、选卡。
6. 准备比赛材料：封面图、PV、AI 创作过程说明。

### 10.1 新增设计补充

- 新增 Buff 查看界面：顶部 HUD 增加一个入口 icon；点击后弹出当前已获得的全部 Buff/卡牌列表；弹出期间游戏暂停；关闭后恢复到打开前的游戏状态。
- 所有钻石卡仅能在单局内抽取一次。玩家获得某张钻石卡后，该卡从本局后续抽卡池中移除。
- 怪物头顶新增小血条，用于提高战斗可读性。
- 点按发射和长按蓄力发射的弹珠速度保持一致，避免点按成为明显劣势输入。
- 蓄力预瞄线按弹射段落变色：每经过一次弹射，后续线段更偏红，用于区分弹射顺序和伤害成长。
- 空格闪避不再是直接瞬移，改为 0.5 秒快速移动/翻滚过程；翻滚期间玩家无敌。
- 空格翻滚 CD 在下方 HUD 显示剩余冷却。
- 新增钻石卡、黄金卡、青铜卡三类卡片视觉设计，用边框、底色和图标质感区分稀有度。

## 11. 提交流程建议

### 11.0 开始改动前必须同步 GitHub

所有同事和 AI agent 在改代码、文档、关卡或美术资源前，必须先把本地仓库同步到 GitHub 最新版本。

```bash
git status --short
git pull --ff-only origin main
git status --short
```

执行规则：

- 只有确认本地工作区不会覆盖他人改动后，才开始编辑文件。
- 如果 `git status --short` 显示已有改动，先判断这些改动是谁的；不要直接 `checkout`、`reset`、覆盖或格式化。
- 如果是其他同事或其他 AI agent 的改动，先协调分工；必要时使用单独分支或单独 worktree。
- 使用 `git pull --ff-only origin main`，避免无意产生 merge commit。
- 如果 pull 失败，停止开发并说明当前分支、未提交文件和失败原因。

每次改动建议：

```bash
npm run build
git status
git add <files>
git commit -m "简短说明"
git push
```

提交前至少确认：

- 游戏能启动。
- `npm run build` 通过。
- 没有把 `node_modules/`、`dist/`、临时素材提交进仓库。
- `Tasklist.md` 与实际进度一致。

## 12. 比赛提交材料提醒

最终需要准备：

- HTML5 游戏资源包：由 `dist/` 整理。
- PV：16:9，1920x1080，MP4，不超过 2 分钟。
- 游戏封面图：16:9，JPG/PNG，1920x1080。
- 游戏简介：名称、类型标签、AI 工具、30 字安利、70 字简介、制作组的话。
- AI 辅助创作过程说明：建议持续维护 `docs/AIProcess.md`。

## 13. 当前状态

截至当前版本：

- GitHub 仓库已建立并推送。
- 核心 H5/Three.js 工程可运行。
- 基础玩法闭环已完成。
- 卡牌系统已配置化。
- Human Cannon 已作为 special 卡实现。
- 仍需重点补：怪物丰富度、视觉资产、音效、PV 与比赛材料。
