# Voice Input Implementation

## Goals

Voice input adds optional hands-light commands for core combat actions:

- Fire: launch the marble.
- Recall: manually recall the marble.
- Evade: trigger the roll/evade action.

The feature is intentionally small and browser-native. It uses the Web Speech API when available and keeps keyboard/mouse controls as the primary input path.

## User Flow

1. The HUD shows a voice panel in the lower-right corner.
2. If the current browser supports `SpeechRecognition` or `webkitSpeechRecognition`, the `Voice Off` button is enabled.
3. Clicking the button starts continuous recognition in `zh-CN`.
4. Recognized speech updates the transcript line and emits matched gameplay actions.
5. Clicking the button again stops recognition and clears the active listening state.

Unsupported browsers keep the button disabled and show a short unsupported message.

## Files

- `index.html`
  Adds the voice panel button and transcript region.

- `src/main.ts`
  Wires `VoiceInput` to `Game.queueVoiceAction`, manages the voice button state, and renders the transcript UI.

- `src/game/voice.ts`
  Wraps the Web Speech API lifecycle, restart behavior, result handling, action dedupe, and observer notifications.

- `src/game/voiceCommands.ts`
  Defines command aliases and normalization/matching logic for fire, recall, and evade.

- `src/game/types.ts`
  Adds `VoiceAction` variants for `fire`, `recall`, and `evade`.

- `src/game/Game.ts`
  Consumes queued voice actions in the game loop and routes them to existing gameplay behavior.

- `src/styles.css`
  Styles the voice panel and keeps transcript updates constrained so new results do not overlap old results.

## Recognition Lifecycle

`VoiceInput` creates a browser recognizer with:

- `lang = "zh-CN"`
- `continuous = true`
- `interimResults = true`

The recognizer emits `VoiceInfo` updates through `observe()`:

- `unsupported`: browser does not expose speech recognition.
- `idle`: recognition is stopped.
- `listening`: recognition is active and may include transcript/actions.
- `error`: browser recognition failed or permission was denied.

For transient end events, recognition attempts to restart while the user-facing active flag is still on. Permission errors such as `not-allowed` and `service-not-allowed` do not auto-restart.

## Command Matching

Speech text is normalized by lowercasing and removing common Chinese/English punctuation and whitespace.

The command table includes canonical commands plus common homophones and recognition mistakes:

- Fire: `开火`, `发射`, `开`, `发`, plus close variants and `fire`/`shoot`.
- Recall: `回收`, `召回`, `收回`, `回来`, `收`, `回`, plus close variants and `recall`/`return`.
- Evade: `闪避`, `闪`, `躲避`, `躲`, `闪开`, plus close variants and `dash`/`dodge`/`evade`.

Only one action is emitted per match pass. When multiple commands are present in the same speech buffer, the command that appears latest wins. This avoids stale continuous-recognition text, such as a previous `闪避`, blocking a later `开火`.

## Handling Continuous Recognition Drift

Some browsers keep prior final recognition text in later result batches. To avoid replaying old commands:

1. `VoiceInput` stores the previous combined recognition text.
2. On each result event, it computes the newly appended text when possible.
3. The new text is used for command matching.
4. The UI still displays only the latest transcript line.

This keeps the transcript readable while preventing prior commands from dominating later commands.

## Gameplay Routing

Voice actions are queued and consumed inside the normal game loop:

- `fire`
  Calls the shared launch path, so voice fire uses the same charge, range, triple-shot, perfect-recall, and human-cannon rules as pointer fire.

- `recall`
  Calls the same manual recall path as right-click while the marble is flying or awaiting recall. If the marble is charging, recall cancels the charge.

- `evade`
  Uses current movement direction when available. If the player is not moving, it falls back to aim direction. It respects dash cooldown, current roll state, and human-cannon mode.

## UI Behavior

The voice panel uses a single live transcript region:

- New messages call `replaceChildren()` before rendering.
- The message line and action line are constrained with overflow ellipsis.
- The panel is positioned at the lower-right on desktop and bottom-aligned on mobile.

This prevents old recognition text from stacking visually under new input.

## Known Constraints

- Web Speech API support varies by browser. Chrome and Edge are the main supported targets.
- Microphone permission must be granted by the user.
- Recognition quality depends on the browser speech service and ambient noise.
- The current implementation is command-based, not intent-based natural language parsing.

## Manual Test Checklist

1. Open the game in Chrome or Edge at `http://127.0.0.1:5173`.
2. Click `Voice Off`; it should become `Voice On`.
3. Say `开火` or `发射`; the marble should fire.
4. Say `回收` while the marble is flying or awaiting recall; it should manually recall.
5. Say `闪避`; the player should roll/evade.
6. Say `闪避`, then `开火`; the second command should fire, not repeat evade.
7. Say `闪避`, then `回收`; the second command should recall, not repeat evade.
8. Long recognized text should stay within the voice panel instead of overlapping old text.

## Suggested Commit Message

```text
Add browser voice commands for combat actions
```
