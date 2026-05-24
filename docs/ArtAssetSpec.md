# 美术资产生成规范 — Cannonball Relic

> 版本：v1.0  
> 适用范围：`public/assets/skins/relic-ruins/` 全部 PNG 资产  
> 生成工具：Nano Banana Pro / Gemini 3 Pro Image

---

## 一、问题诊断（已知错误）

截图分析发现两类严重问题：

| 问题 | 现象 | 根因 |
|---|---|---|
| 视角错误 | 怪物像人倒在地上、障碍物透视感怪异 | 提示词使用了 `isometric view`，生成了等距斜视角（Diablo风格），在纯俯视摄像机下表现异常 |
| 白色背景残留 | 部分怪物（tank等）显示白色方块背景 | AI 生成图背景为白色，alpha 去除不完整 |
| 比例不一致 | 怪物大小参差不齐 | 各次生成画布/缩放不一致 |
| 风格冲突 | 描边过重 / 等距3D阴影 | 与 HM2 无描边高饱和平光风格相悖 |

**结论：所有角色/怪物/障碍物 sprite 必须按照本规范重新生成。**

---

## 二、目标视角：纯俯视（Bird's-Eye）

游戏摄像机在角色正上方垂直向下拍摄，等同于从天花板俯视地面。

```
❌ 错误：等距斜视角（Isometric / 2.5D）
   你能同时看到角色的正面和侧面，有明显透视感
   ╔══╗
   ║  ║  ← 看得到角色的脸和身体正面
   ╚══╝

✅ 正确：正交俯视（Orthographic Top-Down）
   只能看到角色的头顶和肩膀轮廓，像棋盘上的棋子
     ○
    /|\  ← 从正上方看到头顶+手臂展开
     |
```

**类比参考：**
- 迈阿密热线 (Hotline Miami 1/2) — 标准参考
- GTA 1/2 俯视视角
- 《死亡细胞》关卡俯视预览
- 桌游棋子（token）从上往下看

---

## 三、风格规范

### 3.1 整体风格
- **像素艺术（Pixel Art）**，边缘像素清晰可辨
- **无描边或极细描边**：字符轮廓不使用粗黑边，颜色深浅自然过渡即可
- **高饱和度 + 暗底反衬**：深色背景（`#0a0a0f`）下角色颜色饱和度 ≥ 80%
- **平光无阴影**：不使用等距阴影、不使用侧面渐变
- **俯视阴影**：只有正下方小圆形深色阴影（像光源在正上方）

### 3.2 颜色原则
| 规则 | 说明 |
|---|---|
| 每个角色有一个主色 | 占面积 ≥ 50%，高饱和度，便于在深色背景上辨认 |
| 对比度 | 角色颜色与地板颜色（深褐/暗黑）对比度 ≥ 4:1 |
| 禁止纯白 | 白色背景不可见，白色角色与背景无法区分 |
| 禁用灰色系主色 | 灰色在暗背景上视觉权重太低 |

### 3.3 画布与尺寸
- **分辨率**：128×128 px（游戏内缩放为约 0.8–1.4 世界单位）
- **背景**：完全透明（alpha = 0）
- **内容占画布比例**：角色/物件主体占画布面积 60–75%，四周保留透明边距
- **禁止**：水印、文字、标注、UI元素

---

## 四、各类资产详细规范

### 4.1 角色（玩家）— `sprites/player.png`

**视角描述：**  
俯视视角下看到玩家头顶。主色鲜明，有区分于怪物的视觉特征。

**内容要求：**
- 可见：头顶（圆形）、肩膀/手臂轮廓（左右伸展少量）
- 可选：背部斗篷/装备的顶部轮廓
- 朝向指示：轻微不对称提示朝前方向（如正前方较亮或小炮口）
- 禁止：脸部五官（只有俯视轮廓）、侧面透视渐变

**颜色：** 主色青蓝 `#4ac8e8`，高亮白 `#b8f8ff`

---

### 4.2 弹珠 — `sprites/marble.png`

**视角描述：**  
正圆形，俯视看到球的顶部高光。

**内容要求：**
- 正圆或略椭圆（纵向稍扁，模拟俯视）
- 顶部高光白点，边缘深色
- 发光晕圈可选（对应游戏内 neon 发光）

**颜色：** 核心 `#00ddff`，高光 `#ffffff`，边缘 `#0066aa`

---

### 4.3 怪物通用规则

**所有怪物 sprite 的视角必须是纯俯视。**  
想象从天花板拍一张怪物站立的照片。

**结构模板：**
```
   ████      ← 头顶（圆形/椭圆，主色）
  ██████     ← 肩膀/上身宽度
   ████      ← 躯干
  ██  ██     ← 双腿/爪（若有，展开向两侧）
```

**共性要求：**
- 主体轮廓接近圆形或矮椭圆（不是细长竖条）
- 有区分特征：颜色、头型、武器顶部轮廓
- 俯视阴影：主体正下方深色圆形暗影层
- 不同怪物主色不同（见下表）

**各怪物主色与特征：**

| 文件 | 怪物 | 主色（Hex） | 特征提示 |
|---|---|---|---|
| `enemy-grunt.png` | 木偶兵 grunt | `#c8781a` 暖棕橙 | 头顶可见训练头盔顶部，圆鼓鼓 |
| `enemy-runner.png` | 疾行怪 runner | `#ff4455` 亮红 | 细长轮廓，前倾姿势（头比身体靠前） |
| `enemy-tank.png` | 重甲怪 tank | `#8844ff` 紫 | 宽大圆形，装甲板纹路 |
| `enemy-octopus.png` | 章鱼 octopus | `#40c8ff` 亮青 | 圆头加 6–8 条触手向外展开 |
| `enemy-hound.png` | 大狗 hound | `#cc3322` 深红 | 细长椭圆，头部明显偏前 |
| `enemy-boar.png` | 突猪 boar | `#ff8833` 橙 | 宽额头，两侧各有一枚短獠牙横向伸出 |
| `enemy-slime.png` | 史莱姆 slime | `#44ff66` 亮绿 | 完美圆形，顶部光泽感，有小眼睛在顶部 |
| `enemy-rabbit.png` | 兔兔 rabbit | `#88eeff` 冰蓝 | 圆体加两个向上竖的兔耳（俯视看耳朵在头两侧） |
| `enemy-bomb-bug.png` | 爆爆虫 bombBug | `#ff4400` 橙红 | 圆形甲虫背壳，顶部有导火索亮点 |
| `enemy-shield-crab.png` | 盾兵蟹 shieldCrab | `#8899cc` 蓝灰 | 宽蟹形，正前方有半圆盾牌遮挡 |
| `enemy-voodoo-flower.png` | 巫毒花 voodooFlower | `#cc44ff` 紫粉 | 花瓣向四周展开（俯视花冠），中心深色花芯 |
| `enemy-eye-cannon.png` | 眼球炮 eyeCannon | `#ffcc00` 金黄 | 大圆形瞳孔，瞳孔内深色竖缝 |
| `enemy-priest.png` | 祭司机 priest | `#ffffaa` 淡金 | 头顶法帽/头冠轮廓，持杖顶部光点 |

---

### 4.4 障碍物 — `sprites/obstacle-*.png`

> **注意：** 当前代码（Phase 40）障碍物已改为代码绘制颜色块，不再读取这些 sprite。  
> 如果未来要恢复 sprite 显示，必须按以下规范重新生成。

**视角：** 正交俯视，只看到物件的顶面（Top surface）

**内容：**
- 只画物件被从正上方看到的顶面
- 木箱：正方形木板纹路，四角钉子点
- 石柱：圆形/方形石面，裂缝纹路
- 铁砧：矩形金属面，亮高光

**禁止：** 侧面、立体感透视渐变、等距3D阴影

---

### 4.5 地板纹理 — `textures/floor*.png`

地板纹理要求**可无缝平铺**，本身颜色较暗（游戏代码会再叠加 `color: 0x555560` 深色染色）。

| 文件 | 描述 | 颜色基调 |
|---|---|---|
| `floor.png` | 基础砂岩砖 | 暖褐 `#6a5040` |
| `floor-cracked.png` | 碎裂砂岩 | 同基础，砖缝更深 |
| `floor-moss.png` | 苔藓砂岩 | 褐底带绿斑 |
| `floor-danger.png` | 危险警示地板 | 深色带橙红纹 |

**规范：**
- 128×128 或 256×256，完全无缝平铺
- 无角色、无文字、无 UI
- 不能有大面积亮色（角色主色需对地板有反差）

---

## 五、生成提示词模板

以下为正确的俯视视角提示词结构，**必须包含以下关键词**：

```
single game sprite, pixel art, pure top-down orthographic view (bird's-eye view, looking straight down from above),
[角色描述], only the TOP of the character is visible, compact circular silhouette,
highly saturated [主色] color, dark background compatible, no isometric perspective,
no 3D shading, no bold outlines, flat lighting from directly above,
small round shadow directly beneath character,
fully transparent PNG background, centered, no text, no UI, 128x128px game asset
```

**关键词解释：**
- `pure top-down orthographic view` = 纯俯视正交视角（不是等距斜视角）
- `bird's-eye view, looking straight down from above` = 从正上方向下看
- `only the TOP of the character is visible` = 只看到角色顶部
- `compact circular silhouette` = 紧凑圆形轮廓（不是细长竖条）
- `no isometric perspective` = 明确排除等距视角

### 示例：怪物 Grunt（木偶兵）

```
single enemy game sprite, pixel art, pure top-down orthographic view (bird's-eye view, 
looking straight down from above), squat wooden training dummy monster seen from above, 
only the TOP of the character visible (round helmet top, shoulder pads spreading left and right), 
compact circular silhouette, warm orange-brown #c8781a as main color, highly saturated, 
dark background compatible, no isometric perspective, no 3D shading, no bold outlines, 
flat lighting from directly above, small round shadow directly beneath character, 
fully transparent PNG background, centered, no text, no UI, 128x128px game asset
```

### 示例：怪物 Octopus（章鱼）

```
single enemy game sprite, pixel art, pure top-down orthographic view (bird's-eye view, 
looking straight down from above), octopus monster seen from above, round blue-cyan head 
in center with 6-8 tentacles spreading radially outward, compact radial silhouette, 
bright cyan #40c8ff as main color, highly saturated, golden eye visible on top of head, 
dark background compatible, no isometric perspective, no bold outlines, flat lighting, 
small shadow beneath, fully transparent PNG background, centered, no text, no UI, 
128x128px game asset
```

---

## 六、验收标准

生成图提交前必须对照以下清单：

- [ ] **视角正确**：从正上方俯视，看不到角色正面或侧面
- [ ] **轮廓紧凑**：主体轮廓接近圆形或矮椭圆，没有细长竖条感
- [ ] **透明背景**：整张图除角色外全透明，无白色/灰色底
- [ ] **主色饱和**：主色在 `#0a0a0f` 深色背景下清晰可辨
- [ ] **无水印文字**：图内无任何 AI 生成的说明文字或水印
- [ ] **无描边**：轮廓无粗黑描边，颜色自然过渡
- [ ] **正确尺寸**：建议 128×128，不超过 512×512

---

## 七、常见错误对照

| ❌ 错误 | ✅ 正确 |
|---|---|
| 提示词写 `isometric view` | 改为 `pure top-down orthographic view` |
| 提示词写 `2.5D` | 改为 `bird's-eye view, looking straight down from above` |
| 生成了正面站立角色 | 只应看到头顶和肩膀轮廓 |
| 角色又高又细（竖条形） | 角色应是矮椭圆/圆形 token 状 |
| 有白色背景 | 生成后用工具去除背景，或提示词加 `fully transparent PNG background` |
| 颜色偏灰/偏暗 | 主色饱和度不足，重新生成时强调 `highly saturated` |
| 侧面阴影渐变 | 禁止使用，只有正下方小圆形阴影 |

---

## 八、资产更新流程

1. 按本规范撰写提示词
2. 用 Nano Banana Pro 生成（`uv run scripts/generate_image.py -p "提示词"`）
3. 检查：背景透明、视角正确、颜色饱和
4. 将 PNG 放入 `public/assets/skins/relic-ruins/sprites/`
5. 运行 `npm run build` 验证无报错
6. 截图验证游戏内效果
7. 更新 `source/prompts.md` 追加记录
