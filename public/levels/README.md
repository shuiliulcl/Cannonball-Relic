# 关卡文件目录

编辑器下载的关卡 JSON 放在这里，然后通过 Git 提交到仓库。

当前运行时支持编辑器本地草稿验证：在编辑器点击“游戏内验证”，游戏会读取浏览器 localStorage 中的关卡草稿。

后续可以继续扩展为直接从 `public/levels/*.json` 选择关卡。
## Zodiac v2 smoke level

`zodiac-schema-smoke.json` is a minimal compatibility level for the Zodiac revision schema. It proves that the runtime can load:

- `version: 2`
- `playerStart`
- new terrain materials such as `fire`, `mud`, `ice`, and `blood`
- obstacle behavior fields
- interactables
- monster patrol and aggro metadata

Open it with:

```text
/?level=zodiac-schema-smoke
```

Current limitation: terrain, core obstacle effects, and interactables have first-pass runtime behavior. Editor UI support for all new types is still scheduled for later phases.
