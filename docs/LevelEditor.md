# 关卡编辑器使用说明

本文给关卡策划、程序同事和 AI 协作代理使用。目标是让任何拉取 GitHub 仓库的人，都可以在本地编辑关卡、进游戏验证，然后把关卡文件提交回仓库。

## 1. 启动项目

```bash
npm install
npm run dev
```

Vite 默认会输出本地地址，例如：

```text
http://127.0.0.1:5176/
```

如果要给局域网同事访问：

```bash
npm run dev:lan
```

## 2. 打开编辑器

在浏览器打开：

```text
http://127.0.0.1:5176/?mode=editor
```

编辑器是独立工具页，不会影响正常游戏入口。

## 3. 编辑内容

左侧工具栏：

- `地面`：刷地面材质。
- `障碍`：放置会参与碰撞的障碍。
- `刷怪`：放置怪物刷新点。
- `擦除`：删除当前格上的障碍或刷怪点。

右侧属性栏：

- `地面材质`：砂岩、碎石、苔痕、危险。
- `障碍材质`：木箱、石柱、铁砧。
- `刷怪逻辑`：怪物类型、波次、数量、间隔秒。
- `关卡名`：导出文件和 JSON 中使用的关卡名称。
- `导出 / 导入 JSON`：可直接复制、修改或粘贴关卡数据。

## 4. 游戏内验证

编辑完成后点击：

```text
保存本地草稿
游戏内验证
```

编辑器会把当前关卡保存到浏览器 `localStorage`，然后跳转到：

```text
http://127.0.0.1:5176/?level=local
```

游戏会读取本地草稿并验证：

- 障碍位置会进入渲染和弹珠碰撞。
- 怪物刷新点会按波次、数量、怪物类型、间隔秒生成怪物。
- 地面材质当前会保存在 JSON 中，后续可继续接入运行时地面渲染。

## 5. 提交到 GitHub

浏览器不能安全地直接写入本地 Git 仓库，也不应该在网页里保存个人 GitHub Token。所以当前推荐流程是：

1. 在编辑器点击 `下载关卡`。
2. 把下载的 `.json` 文件放到项目目录：

```text
public/levels/
```

3. 运行构建确认没有破坏项目：

```bash
npm run build
```

4. 提交并推送：

```bash
git add public/levels/<your-level>.json
git commit -m "Add level <your-level>"
git push origin main
```

如果是协作分支，请按团队分支规范提交 Pull Request。

## 6. JSON 数据格式

导出的关卡 JSON 包含：

- `version`：格式版本。
- `name`：关卡名。
- `grid`：网格宽高和格子尺寸。
- `floors`：每个格子的地面材质。
- `obstacles`：障碍列表。
- `spawns`：刷怪点和刷怪规则。

示例：

```json
{
  "version": 1,
  "name": "遗迹训练场",
  "grid": { "width": 17, "height": 13, "cellSize": 1 },
  "obstacles": [
    { "id": "left-block", "x": 5, "z": 5, "w": 2, "h": 1, "material": "wood" }
  ],
  "spawns": [
    { "id": "wave-1-a", "x": 7, "z": 3, "wave": 1, "count": 3, "monsterType": "grunt", "interval": 0.7 }
  ]
}
```

坐标说明：

- `x`：从左到右。
- `z`：从上到下。
- `w/h`：障碍占用格子的宽高。
- `wave`：第几波刷新。
- `count`：该刷新点总共刷几个怪。
- `interval`：同一刷新点连续刷怪的间隔秒数。

## 7. 当前限制和后续工作

当前已经支持“编辑器 -> 本地保存 -> 游戏验证 -> 下载文件 -> GitHub 提交”的流程。

后续建议继续做：

- 游戏内关卡选择器，直接读取 `public/levels/*.json`。
- 地面材质运行时渲染，让不同格子的地面在游戏里可见。
- 障碍尺寸拖拽编辑。
- 刷怪路线、精英怪、Boss 出场规则。
- GitHub PR 模板，要求每个新关卡附截图和验证说明。
## 8. Zodiac v2 关卡字段

Zodiac 改版开始使用兼容的 `version: 2` 关卡 schema。旧 `version: 1` 关卡仍可读取。

新增字段：

- `description`: 关卡意图说明。
- `playerStart`: 玩家出生格，格式为 `{ "x": 2, "z": 5 }`。
- `floors`: 继续使用逐格数组，新增玩法材质 `fire`、`mud`、`ice`、`blood`。
- `obstacles[].behavior`: 阻挡行为，可用 `solid`、`breakable`、`reflectBack`、`speedUp`、`pierceDamage`、`oneWay`、`explosive`。
- `obstacles[].facing`: 单向门、弹反等方向型对象的朝向，可用 `up`、`right`、`down`、`left`。
- `obstacles[].hp`: 可破坏或可爆炸对象的生命值。
- `interactables`: 场地交互物列表，类型包括 `brazier`、`pinball`、`iceBall`、`alarmPost`、`doorSwitch`。
- `spawns[].patrolPath`: 怪物巡逻路径。
- `spawns[].aggroRange` / `spawns[].disengageRange`: 怪物进战和脱战距离。

可以直接用文件名加载公共关卡：

```text
/?level=zodiac-schema-smoke
```

该 URL 会读取：

```text
public/levels/zodiac-schema-smoke.json
```

注意：火焰/危险、泥沼、冰面、血池，以及玻璃、弹反、加倍、荆棘、单向门、爆裂桶已经有第一版运行时效果。火盆、弹射滚珠、冰球、警报柱、机关门开关也已有第一版运行时效果。编辑器 UI 还没有完整暴露这些新类型，临时测试请直接编辑 JSON。
