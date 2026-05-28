import type { VoiceAction } from "./types";
import { matchVoiceActions } from "./voiceCommands";

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

export type VoiceStatus = "idle" | "listening" | "error" | "unsupported";

export type VoiceInfo<TAction = VoiceAction> = {
  status: VoiceStatus;
  transcript: string;
  actions: TAction[];
  error?: string;
};

type VoiceMatcher<TAction> = (text: string) => TAction[];
type VoiceActionKey<TAction> = (action: TAction) => string;

function defaultActionKey<TAction>(action: TAction): string {
  if (typeof action === "string") {
    return action;
  }
  const typedAction = action as { type?: string; id?: string };
  if (typedAction.type === "hidden") {
    return `hidden:${typedAction.id ?? ""}`;
  }
  if (typedAction.type === "voice") {
    return `voice:${(typedAction as { command?: string }).command ?? ""}`;
  }
  return typedAction.type ?? JSON.stringify(action);
}

export class VoiceInput<TAction = VoiceAction> {
  private readonly recognition: Recognition | null = null;
  private observer: ((info: VoiceInfo<TAction>) => void) | null = null;
  private active = false;
  private shouldRestart = false;
  private lastActionAt = 0;
  private lastActionKey = "";
  private lastRecognitionText = "";
  private readonly matcher: VoiceMatcher<TAction>;
  private readonly actionKey: VoiceActionKey<TAction>;

  constructor(
    private readonly onActions: (actions: TAction[]) => void,
    matcher?: VoiceMatcher<TAction>,
    actionKey?: VoiceActionKey<TAction>,
  ) {
    this.matcher = matcher ?? (matchVoiceActions as unknown as VoiceMatcher<TAction>);
    this.actionKey = actionKey ?? defaultActionKey;

    const ctor =
      (window as unknown as { SpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;

    if (!ctor) {
      return;
    }

    this.recognition = new ctor();
    this.recognition.lang = "zh-CN";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => {
      const error = event.error ?? "unknown";
      this.shouldRestart = error !== "not-allowed" && error !== "service-not-allowed";
      this.notify({ status: "error", transcript: "", actions: [], error });
    };
    this.recognition.onend = () => {
      if (!this.active || !this.shouldRestart) {
        if (this.active) {
          this.active = false;
          this.notify({ status: "idle", transcript: "", actions: [] });
        }
        return;
      }
      window.setTimeout(() => {
        if (!this.active || !this.shouldRestart) {
          return;
        }
        try {
          this.recognition?.start();
        } catch {
          // The browser may still be winding down the previous recognizer session.
        }
      }, 250);
    };
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  observe(observer: (info: VoiceInfo<TAction>) => void): void {
    this.observer = observer;
    if (!this.recognition) {
      this.notify({ status: "unsupported", transcript: "", actions: [] });
    }
  }

  start(): void {
    if (!this.recognition || this.active) {
      return;
    }
    this.active = true;
    this.shouldRestart = true;
    this.lastRecognitionText = "";
    try {
      this.recognition.start();
      this.notify({ status: "listening", transcript: "", actions: [] });
    } catch (error) {
      this.active = false;
      this.notify({ status: "error", transcript: "", actions: [], error: error instanceof Error ? error.message : "start failed" });
    }
  }

  stop(): void {
    if (!this.recognition || !this.active) {
      return;
    }
    this.active = false;
    this.shouldRestart = false;
    this.lastRecognitionText = "";
    try {
      this.recognition.stop();
    } catch {
      this.recognition.abort();
    }
    this.notify({ status: "idle", transcript: "", actions: [] });
  }

  private handleResult(event: RecognitionEvent): void {
    const allTranscripts: string[] = [];
    const transcripts: string[] = [];
    for (let i = 0; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript.trim();
      if (transcript) {
        allTranscripts.push(transcript);
      }
    }

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      if (!transcript) {
        continue;
      }
      transcripts.push(transcript);
    }

    const combinedTranscript = allTranscripts.join(" ").trim();
    if (!combinedTranscript || transcripts.length === 0) {
      return;
    }

    const latestTranscript = transcripts[transcripts.length - 1];
    const newTranscript =
      this.lastRecognitionText && combinedTranscript.startsWith(this.lastRecognitionText)
        ? combinedTranscript.slice(this.lastRecognitionText.length).trim()
        : latestTranscript;
    this.lastRecognitionText = combinedTranscript;

    const actions = this.matcher(newTranscript || latestTranscript);
    if (actions.length > 0) {
      const actionsToEmit = this.dedupeActions(actions);
      if (actionsToEmit.length > 0) {
        this.onActions(actionsToEmit);
      }
    }
    if (!this.active) {
      return;
    }
    this.notify({ status: "listening", transcript: latestTranscript, actions });
  }

  private dedupeActions(actions: TAction[]): TAction[] {
    const key = actions.map((action) => this.actionKey(action)).join("|");
    const now = performance.now();
    if (key === this.lastActionKey && now - this.lastActionAt < 900) {
      return [];
    }
    this.lastActionKey = key;
    this.lastActionAt = now;
    return actions;
  }

  private notify(info: VoiceInfo<TAction>): void {
    this.observer?.(info);
  }
}
