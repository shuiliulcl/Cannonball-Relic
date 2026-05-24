# 美术资产生成规范 — Cannonball Relic

> 版本：v1.1（2026-05-24 更新：增加纹理类资产规范，修正白边问题）  
> 适用范围：`public/assets/skins/relic-ruins/` 全部 PNG 资产  
> 生成工具：Nano Banana Pro / Gemini 3 Pro Image

---

## 一、资产类型区分（重要）

本项目的 PNG 资产分为**两类**，生成方式和后处理流程完全不同：

| 类型 | 用途 | 背景 | 画布要求 | 代表文件 |
|---|---|---|---|---|
| **Sprite（精灵图）** | 角色、怪物、弹珠等有独立轮廓的个体 | **透明**（alpha=0） | 主体居中，四周留透明边距 | `enemy-*.png`, `player.png`, `marble.png` |
| **Texture Tile（纹理贴图）** | 障碍物顶面、地板、墙壁等铺满面的图案 | **不透明**（RGB，无 alpha） | **填满整块画布，无边框无留白** | `obstacle-*.png`, `textures/floor*.png` |

> ⚠️ **最常见的错误**：把 Texture Tile 用 Sprite 的方式生成——AI 会在图案四周留一圈白色背景边框，贴到障碍物上就出现白边。

---

## 二、已知问题记录

| 问题 | 现象 | 根因 | 修复方案 |
|---|---|---|---|
| 视角错误 | 怪物像人倒在地上 | 提示词用了 `isometric view`，生成等距斜视角 | 改用 `pure top-down orthographic view` |
| 怪物白色背景 | 部分怪物显示白色方块 | 生成背景为白色，alpha 去除不完整 | 洪泛填充去除四角连通白色区域 |
| 障碍物白边 | 纹理四周出现白色方框 | 把 Texture 当 Sprite 生成，AI 在图案外生成白色背景边框，洪泛填充无法去除（不连通到角落） | 纹理提示词必须加 `fills entire canvas edge to edge, no border, no frame`；保存为 RGB 不需要 alpha |
| 比例不一致 | 怪物大小参差不齐 | 各次生成画布/缩放不同 | 生成后统一缩放到目标尺寸 |
| 风格冲突 | 描边过重 / 等距3D阴影 | 与 HM2 无描边高饱和平光风格相悖 | 提示词明确 `no bold outlines, flat lighting` |

---

## 三、目标视角：纯俯视（Bird's-Eye）

游戏摄像机在角色正上方垂直向下拍摄，等同于从天花板俯视地面。

```
❌ 错误：等距斜视角（Isometric / 2.5D）
   同时看到角色正面和侧面，有明显透视感
   ╔══╗
   ║  ║  ← 看得到角色的脸和身体正面
   ╚══╝

✅ 正确：正交俯视（Orthographic Top-Down）
   只看到头顶和肩膀轮廓，像棋盘上的棋子
     ○
    /|\  ← 从正上方看到头顶+手臂展开
     |
```

**参考游戏：**  迈阿密热线 1/2（标准参考）、GTA 1/2、桌游棋子俯视

---

## 四、风格规范

### 4.1 整体风格
- **像素艺术（Pixel Art）**，边缘像素清晰可辨
- **无描边或极细描边**：不使用粗黑边，颜色深浅自然过渡
- **高饱和度 + 暗底反衬**：游戏背景为 `#0a0a0f`，角色颜色饱和度 ≥ 80%
- **平光无阴影**：不使用等距阴影、不使用侧面渐变
- **Sprite 俯视阴影**：只有正下方小圆形深色阴影

### 4.2 颜色原则
| 规则 | 说明 |
|---|---|
| 每个角色/障碍物有一个主色 | 占面积 ≥ 50%，高饱和度，便于在深色背景上辨认 |
| 对比度 | 颜色与地板（深褐/暗黑）对比度 ≥ 4:1 |
| 禁止纯白为主色 | 白色在深色背景下可见，但如果是 Sprite 的边缘白色像素会被误判为背景 |
| 禁用灰色系主色 | 灰色在暗背景上视觉权重太低 |

---

## 五、各类资产详细规范

### 5.1 角色（玩家）— `sprites/player.png`  【Sprite 类型】

**视角：** 俯视，看到玩家头顶。  
**内容：** 头顶（圆形）+ 肩膀/手臂轮廓，轻微不对称指示朝向。  
**禁止：** 脸部五官、侧面透视渐变。  
**画布：** 透明背景，主体居中，四周保留透明边距。  
**颜色：** 主色青蓝 `#4ac8e8`，高亮 `#b8f8ff`

---

### 5.2 弹珠 — `sprites/marble.png`  【Sprite 类型】

**视角：** 俯视，看到球顶部高光。  
**内容：** 正圆或略椭圆，顶部高光白点，边缘深色，可选发光晕。  
**画布：** 透明背景，居中。  
**颜色：** 核心 `#00ddff`，高光 `#ffffff`，边缘 `#0066aa`

---

### 5.3 怪物通用规则  【Sprite 类型】

**所有怪物 sprite 必须是纯俯视视角。**

**结构模板：**
```
   ████      ← 头顶（圆形/椭圆，主色）
  ██████     ← 肩膀/上身宽度
   ████      ← 躯干
  ██  ██     ← 双腿/爪（若有，展开向两侧）
```

**要求：**
- 主体轮廓接近圆形或矮椭圆（不是细长竖条）
- 俯视阴影：主体正下方深色圆形暗影层
- 画布：透明背景，主体居中，占画布面积 60–75%

**各怪物主色与特征：**

| 文件 | 怪物 | 主色（Hex） | 特征提示 |
|---|---|---|---|
| `enemy-grunt.png` | 木偶兵 grunt | `#c8781a` 暖棕橙 | 训练头盔顶部，圆鼓鼓 |
| `enemy-runner.png` | 疾行怪 runner | `#ff4455` 亮红 | 细长轮廓，前倾姿势 |
| `enemy-tank.png` | 重甲怪 tank | `#8844ff` 紫 | 宽大圆形，装甲板纹路 |
| `enemy-octopus.png` | 章鱼 octopus | `#40c8ff` 亮青 | 圆头加 6–8 条触手向外展开 |
| `enemy-hound.png` | 大狗 hound | `#cc3322` 深红 | 细长椭圆，头部偏前 |
| `enemy-boar.png` | 突猪 boar | `#ff8833` 橙 | 宽额头，两侧獠牙横向伸出 |
| `enemy-slime.png` | 史莱姆 slime | `#44ff66` 亮绿 | 完美圆形，顶部光泽 |
| `enemy-rabbit.png` | 兔兔 rabbit | `#88eeff` 冰蓝 | 圆体加两侧兔耳 |
| `enemy-bomb-bug.png` | 爆爆虫 bombBug | `#ff4400` 橙红 | 圆形甲虫背壳，顶部导火索亮点 |
| `enemy-shield-crab.png` | 盾兵蟹 shieldCrab | `#8899cc` 蓝灰 | 宽蟹形，正前方半圆盾牌 |
| `enemy-voodoo-flower.png` | 巫毒花 voodooFlower | `#cc44ff` 紫粉 | 花瓣向四周展开，深色花芯 |
| `enemy-eye-cannon.png` | 眼球炮 eyeCannon | `#ffcc00` 金黄 | 大圆形瞳孔，深色竖缝 |
| `enemy-priest.png` | 祭司机 priest | `#ffffaa` 淡金 | 头冠轮廓，法杖顶部光点 |

---

### 5.4 障碍物顶面 — `sprites/obstacle-<material>.png`  【Texture Tile 类型】

> 代码通过 `obstacle-${material.toLowerCase()}.png` 动态加载，material 对应：  
> `wood` / `stone` / `metal` / `glass` / `reflector` / `accelerator` / `thorns` / `oneway` / `bomb`

**核心要求（与 Sprite 不同）：**
- **必须填满整块画布，四边无留白无边框**
- **保存为 RGB（不需要 alpha/透明通道）**
- 顶面图案，俯视看到的障碍物表面
- 高饱和度与主色（见下表），便于和深色地板区分

**各障碍物顶面颜色与特征：**

| 文件 | 材质 | 主色 | 图案特征 |
|---|---|---|---|
| `obstacle-wood.png` | 木箱 | `#e07020` 橙棕 | 交叉木板纹路，四角黄铜钉 |
| `obstacle-stone.png` | 石柱 | `#9090b8` 蓝灰 | 石面纹理，自然裂缝 |
| `obstacle-metal.png` | 铁砧 | `#40a8d0` 钢青 | 刷面金属，四角铆钉 |
| `obstacle-glass.png` | 玻璃 | `#60d8ff` 亮青 | 光泽玻璃，中心折光菱形 |
| `obstacle-reflector.png` | 弹反 | `#b040ff` 紫 | 镜面，中心星爆高光 |
| `obstacle-accelerator.png` | 加速 | `#ffcc00` 金黄 | 双箭头 >> 图案 |
| `obstacle-thorns.png` | 荆棘 | `#ff2020` 血红 | 尖刺俯视阵列 |
| `obstacle-oneway.png` | 单向门 | `#00ff60` 霓虹绿 | 白色 → 箭头 |
| `obstacle-bomb.png` | 爆裂桶 | `#ff5010` 橙红 | 圆形桶盖，警告纹，导火索 |

---

### 5.5 地板纹理 — `textures/floor*.png`  【Texture Tile 类型】

**要求：** 可无缝平铺，颜色较暗（代码会叠加 `0x555560` 深色染色），填满画布无边框。

| 文件 | 描述 | 颜色基调 |
|---|---|---|
| `floor.png` | 基础砂岩砖 | 暖褐 `#6a5040` |
| `floor-cracked.png` | 碎裂砂岩 | 同基础，砖缝更深 |
| `floor-moss.png` | 苔藓砂岩 | 褐底带绿斑 |
| `floor-danger.png` | 危险警示地板 | 深色带橙红纹 |

---

## 六、生成提示词模板

### 6.1 Sprite 模板（角色 / 怪物 / 弹珠）

```
single game sprite, pixel art, pure top-down orthographic view (bird's-eye view,
looking straight down from above), [角色描述],
only the TOP of the character is visible, compact circular silhouette,
highly saturated [主色], dark background compatible,
no isometric perspective, no 3D shading, no bold outlines,
flat lighting from directly above, small round shadow directly beneath character,
fully transparent PNG background, centered, no text, no UI, 128x128px game asset
```

**必须包含的关键词：**
- `pure top-down orthographic view` — 排除等距视角
- `bird's-eye view, looking straight down from above` — 明确俯视
- `only the TOP of the character is visible` — 只看顶部
- `compact circular silhouette` — 紧凑圆形轮廓
- `no isometric perspective` — 明确排除等距
- `fully transparent PNG background` — 透明背景

**示例（Grunt 木偶兵）：**
```
single enemy game sprite, pixel art, pure top-down orthographic view (bird's-eye view,
looking straight down from above), squat wooden training dummy monster seen from above,
only the TOP of the character visible (round helmet top, shoulder pads spreading outward),
compact circular silhouette, warm orange-brown #c8781a as main color, highly saturated,
dark background compatible, no isometric perspective, no 3D shading, no bold outlines,
flat lighting from directly above, small round shadow directly beneath character,
fully transparent PNG background, centered, no text, no UI, 128x128px game asset
```

---

### 6.2 Texture Tile 模板（障碍物顶面 / 地板）

```
seamless top-down [材质] surface texture tile, pixel art,
[图案特征描述], highly saturated [主色],
fills entire canvas edge to edge with no border no frame no white margin no background,
game texture asset, no text, no UI, no watermark
```

**必须包含的关键词：**
- `seamless` — 无缝纹理风格
- `surface texture tile` — 明确是纹理贴片而非独立物件
- `fills entire canvas edge to edge` — **最重要**，消除白边根因
- `no border no frame no white margin no background` — 四重禁止，防止 AI 加白色边框

**禁止在 Texture Tile 提示词中出现：**
- `transparent PNG background` — 纹理不需要透明背景，写了反而会引导 AI 生成带白底的"物件"
- `centered` — 纹理应填满整块，不是居中的独立物
- `isolated sprite` — 同上

**示例（木箱障碍物顶面）：**
```
seamless top-down wooden crate surface texture tile, pixel art,
warm orange-brown cross-plank wooden boards pattern with X-beam and corner brass nails,
highly saturated orange-brown #e07020,
fills entire canvas edge to edge with no border no frame no white margin no background,
game texture asset, no text, no UI, no watermark
```

**示例（单向门障碍物顶面）：**
```
seamless top-down one-way gate surface texture tile, pixel art,
vivid neon green surface with bold white right-pointing arrow symbol in center,
highly saturated neon green #00ff60,
fills entire canvas edge to edge with no border no frame no white margin no background,
game texture asset, no text, no UI, no watermark
```

---

## 七、后处理流程

### 7.1 Sprite 后处理（角色 / 怪物）

1. 用 PIL 进行**洪泛填充**：从四角开始，将白色/近白色连通像素设为透明
2. 裁剪为**正方形**（取短边，中心裁剪）
3. 缩放到目标尺寸（推荐 512×512）
4. 保存为 **RGBA PNG**

```python
# 关键参数
def is_bg(r, g, b, a):
    return a > 50 and r > 210 and g > 210 and b > 210  # 白色或近白色
# BFS 从四角连通填充
img.save(path)  # RGBA
```

**注意：** 洪泛填充只去除从角落**连通**的白色区域。角色内部的白色高光不会被删除。

### 7.2 Texture Tile 后处理（障碍物 / 地板）

1. **不需要**背景去除（纹理应完全不透明）
2. 裁剪为**正方形**（取短边，中心裁剪）
3. 缩放到目标尺寸（推荐 512×512）
4. 保存为 **RGB PNG**（无 alpha）

```python
img = Image.open(path).convert("RGB")  # 转为 RGB，去掉 alpha 通道
s = min(w, h)
img = img.crop((cx - s//2, cy - s//2, cx + s//2, cy + s//2))
img = img.resize((512, 512), Image.LANCZOS)
img.save(path)  # RGB
```

---

## 八、验收标准

### Sprite（角色/怪物）

- [ ] 视角正确：从正上方俯视，看不到角色正面或侧面
- [ ] 轮廓紧凑：主体接近圆形或矮椭圆，没有细长竖条感
- [ ] 透明背景：整张图除角色外全透明，无白色/灰色底
- [ ] 主色饱和：主色在 `#0a0a0f` 深色背景下清晰可辨
- [ ] 无水印文字：图内无任何说明文字或水印
- [ ] 无粗描边：轮廓无明显粗黑边

### Texture Tile（障碍物/地板）

- [ ] 填满画布：纹理铺满整张图，**四边无白边无留白**
- [ ] 无边框：图案没有被白色/深色矩形边框包围
- [ ] 主色饱和：贴到深色障碍物顶面后清晰可辨
- [ ] RGB格式：无透明通道（用 `file.mode` 确认为 `RGB` 而非 `RGBA`）
- [ ] 尺寸方形：宽高相等（通常 512×512）

---

## 九、常见错误对照

| ❌ 错误 | ✅ 正确 | 适用类型 |
|---|---|---|
| 提示词写 `isometric view` | `pure top-down orthographic view` | Sprite |
| 提示词写 `2.5D` | `bird's-eye view, looking straight down from above` | Sprite |
| 角色又高又细（竖条形） | 矮椭圆/圆形 token 状 | Sprite |
| 提示词用了 `transparent PNG background`（障碍物纹理） | 改为 `fills entire canvas edge to edge, no border` | Texture |
| 提示词用了 `centered`（障碍物纹理） | 纹理不居中，填满整块 | Texture |
| 生成了带白色边框的纹理 | 提示词加 `no border no frame no white margin` | Texture |
| 保存 Texture 为 RGBA | `convert("RGB")` 再保存 | Texture |
| 侧面阴影渐变 | 禁止，只有正下方小圆形阴影 | Sprite |

---

## 十、完整资产清单

| 文件路径 | 类型 | 状态 |
|---|---|---|
| `sprites/player.png` | Sprite | ✅ 已生成 |
| `sprites/marble.png` | Sprite | ✅ 已生成 |
| `sprites/enemy-grunt.png` | Sprite | ✅ 已生成 |
| `sprites/enemy-runner.png` | Sprite | ✅ 已生成（已修白底）|
| `sprites/enemy-tank.png` | Sprite | ✅ 已生成（已修白底）|
| `sprites/enemy-octopus.png` | Sprite | ✅ 已生成（已修白底）|
| `sprites/enemy-hound.png` | Sprite | ✅ 已生成（已修白底）|
| `sprites/enemy-boar.png` | Sprite | ✅ 已生成 |
| `sprites/enemy-slime.png` | Sprite | ✅ 已生成（已修白底）|
| `sprites/enemy-rabbit.png` | Sprite | ✅ 已生成（含水印，待重新生成）|
| `sprites/enemy-bomb-bug.png` | Sprite | ✅ 已生成 |
| `sprites/enemy-shield-crab.png` | Sprite | ✅ 已生成（已修白底）|
| `sprites/enemy-voodoo-flower.png` | Sprite | ✅ 已生成 |
| `sprites/enemy-eye-cannon.png` | Sprite | ✅ 已生成 |
| `sprites/enemy-priest.png` | Sprite | ✅ 已生成 |
| `sprites/obstacle-wood.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-stone.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-metal.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-glass.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-reflector.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-accelerator.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-thorns.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-oneway.png` | Texture | ✅ 已生成 |
| `sprites/obstacle-bomb.png` | Texture | ✅ 已生成 |
| `textures/floor.png` | Texture | ✅ 已生成 |
| `textures/floor-cracked.png` | Texture | ✅ 已生成 |
| `textures/floor-moss.png` | Texture | ✅ 已生成 |
| `textures/floor-danger.png` | Texture | ✅ 已生成 |
