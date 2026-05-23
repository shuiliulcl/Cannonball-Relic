# Development Standards - 必读

This file is required reading for every teammate and AI agent before changing Cannonball Relic.

## 1. Product Guardrails

- The core game is a 2.5D top-down rogue-lite where the player moves, aims, fires a marble, bounces it off walls or obstacles, recalls it, clears waves, and drafts upgrades.
- Human Cannon / 人间大炮 is a rare late-game or special card. Do not turn it into the default control scheme unless the design document is explicitly updated and approved.
- Keep gameplay changes small and reviewable. If a change alters controls, scoring, wave flow, card rules, or camera framing, update `docs/GameDesign.md` and `Tasklist.md`.
- In-game visible UI text should be Chinese. Code identifiers, file names, and documentation headings may stay English for collaboration clarity.

## 2. Work Order

### 2.0 Sync From GitHub First

Every teammate and AI agent must sync the repository before making code, art, level, or documentation changes.

Required pre-change routine:

```bash
git status --short
git pull --ff-only origin main
git status --short
```

Rules:

- Run this before editing files, generating assets, or starting a refactor.
- If `git status --short` is not clean, do not overwrite or revert those files. Confirm whether the changes belong to another teammate/AI agent, then coordinate, commit, stash, or move to a separate worktree before pulling.
- Prefer `git pull --ff-only origin main` so a local agent does not create accidental merge commits.
- If the pull fails because the branch diverged or the workspace is dirty, stop and report the exact status before continuing.
- After syncing, note the latest commit hash when handing work to another person or AI agent.

### 2.1 Pre-Change Execution Plan

Recent long-running changes exposed several avoidable slowdowns: broad feature scope, parallel-agent overlap, large mixed diffs, fragile patching around mojibake text, and late discovery of runtime/UI risks. Use the following rules before starting work.

Required planning note before substantial changes:

- State the exact files or modules you expect to touch.
- Identify files that may also be owned by another teammate/AI agent.
- Split the task into the smallest shippable slices.
- Name the verification command or manual check for each slice.
- Decide whether the change should be one commit or multiple focused commits.

Scope rules:

- Prefer one behavioral slice per commit. Good examples: "monster health bar anchor", "Buff panel UI", "diamond card draft filtering".
- If a request spans `game`, `render`, `ui`, `styles`, and `docs`, implement and verify in phases instead of one large patch.
- For mixed code and documentation work, finish code verification first, then update docs and Tasklist.
- Do not bundle unrelated cleanup, encoding fixes, formatting, or refactors into feature commits.

Parallel-work rules:

- If another teammate/AI agent has uncommitted changes in a file you must edit, pause and call that out before editing.
- If the user explicitly authorizes committing the whole workspace, still summarize which changes came from the current task and which were pre-existing.
- Avoid patching by matching long text blocks that contain garbled terminal output. Prefer small line-range edits or rewriting a narrow function/component.

Verification rules:

- Run `npm run build` before handoff for any code or CSS change.
- For UI/runtime changes, also verify the page starts and the relevant DOM nodes or interaction path exist.
- If browser automation is unavailable, state that limitation and use the best available fallback: dev server response, DOM-node checks, targeted static checks, and build.
- For cloud-document sync, prefer simple headings, paragraphs, and lists unless rich XML is necessary. If an update returns partial success or warnings, retry with a simpler format and record the final successful revision.

Timebox rule:

- If a single change session exceeds 30 minutes, pause before final handoff and write a short self-retrospective.
- The retrospective must include: what caused the delay, what was completed, what remains risky, and how the next similar task should be split or verified.
- If the long session is still in progress, send the user a concise status update before continuing.

Before implementation:

1. Read `README.md`, `docs/GameDesign.md`, `docs/CollaboratorGuide.md`, and this file.
2. Check `Tasklist.md` and add or update the relevant phase before starting substantial work.
3. Inspect existing patterns in nearby files before adding new abstractions.

During implementation:

- Prefer focused commits that complete one understandable slice.
- Keep gameplay logic in `src/game/`.
- Keep Three.js scene sync and visual-only logic in `src/render/`.
- Keep DOM/HUD behavior in `src/ui/` and visual styling in `src/styles.css`.
- Put tunable constants in `src/game/config.ts`.
- Do not hide gameplay decisions inside renderer or CSS code.

Before handoff:

- Run `npm run build`.
- If the change affects visuals or interaction, run the dev server and manually verify the game starts, restarts, and can clear or lose a wave.
- Update `Tasklist.md`.
- Update docs when a teammate or future AI agent would otherwise need to rediscover your decision.

## 3. Art Skin System

Runtime art lives under:

```text
public/assets/skins/<skin-id>/
```

Every skin must provide these files:

```text
sprites/player.png
sprites/marble.png
sprites/enemy-grunt.png
sprites/obstacle-crate.png
sprites/obstacle-stone.png
sprites/obstacle-metal.png
sprites/pillar.png
sprites/brazier.png
textures/floor.png
textures/floor-cracked.png
textures/floor-moss.png
textures/floor-danger.png
textures/wall-border.png
manifest.json
```

Optional source files should live under:

```text
source/raw/
source/prompts.md
```

Rules:

- Do not hardcode a skin's image path in random gameplay files.
- Add new art by creating or replacing files inside a skin folder.
- Preserve the slot names above so switching skins does not require renderer changes.
- Use transparent PNG sprites. If an AI tool returns a fake checkerboard background, process it into real alpha before placing it in `sprites/`.
- Keep AI prompts, raw outputs, and any manual processing notes in `source/prompts.md`.
- Test alternate skins with `?skin=<skin-id>`.

## 4. Visual Direction

- Target style: readable 2.5D pixel art / hand-painted indie game, top-down arena, strong silhouettes, warm ancient ruin or experimental themed skins.
- Gameplay readability wins over decorative detail.
- Player, marble, enemy, obstacle, and floor must remain visually distinct at normal camera zoom.
- Avoid copyrighted, trademarked, or internal IP assets. Use original generated or team-created art only.

## 5. UI Standards

- Keep combat HUD as an overlay, not a web dashboard.
- HP belongs top-left, wave progress top-center, controls bottom-left, buff/marble state bottom-center unless a documented UI pass changes it.
- Result and upgrade screens must offer a restart or continue path. Never leave the game in a dead-end state after victory, defeat, or wave clear.
- All visible player-facing labels should be Chinese.
- Check text fit at desktop and smaller browser sizes. Buttons and panels must not overflow the viewport.

## 6. Code Style

- TypeScript should stay explicit where it clarifies game state and contracts.
- Prefer local helper functions over broad abstractions unless the repeated pattern is stable.
- Avoid unrelated refactors in feature commits.
- Keep comments rare and useful: explain non-obvious intent, not obvious syntax.
- Do not remove existing user or teammate changes unless explicitly asked.

## 7. AI Collaboration Notes

- When AI materially contributes code, art, tuning, copy, or planning, update `docs/AIProcess.md`.
- AI-generated art should include the prompt and destination skin folder.
- If you make assumptions, write them in the relevant doc instead of only in chat.
- If a task touches design, art, and code, leave a short handoff note in `Tasklist.md` or the related doc.

## 8. Level Files

- Use `?mode=editor` to author levels locally.
- Use `?level=local` to validate the browser's saved local draft in game.
- Commit shared level JSON files under `public/levels/`.
- Read `docs/LevelEditor.md` before changing the editor schema or runtime level loader.
