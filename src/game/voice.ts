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
  private startGeneration = 0;
  private restartTimer: number | null = null;
  private microphoneReady = false;
  private processedResultCount = 0;
  private lastActionAt = 0;
  private lastActionKey = "";
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
    this.recognition.interimResults = false;
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onerror = (event) => {
      const error = event.error ?? "unknown";
      this.shouldRestart = this.isRestartableError(error);
      if (!this.shouldRestart) {
        this.active = false;
        this.startGeneration += 1;
        this.processedResultCount = 0;
        this.clearRestartTimer();
        if (error === "not-allowed" || error === "service-not-allowed") {
          this.microphoneReady = false;
        }
        this.notify({ status: "error", transcript: "", actions: [], error });
        return;
      }
      this.notify({ status: "listening", transcript: "", actions: [] });
    };
    this.recognition.onend = () => {
      if (!this.active || !this.shouldRestart) {
        if (this.active) {
          this.active = false;
          this.notify({ status: "idle", transcript: "", actions: [] });
        }
        return;
      }
      this.scheduleRestart();
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
    const recognition = this.recognition;
    if (!recognition || this.active) {
      return;
    }
    this.active = true;
    this.shouldRestart = true;
    this.processedResultCount = 0;
    this.clearRestartTimer();
    const generation = this.startGeneration + 1;
    this.startGeneration = generation;
    void this.startRecognition(generation, recognition);
  }

  private async startRecognition(generation: number, recognition: Recognition): Promise<void> {
    try {
      await this.ensureMicrophonePermission();
      if (!this.active || this.startGeneration !== generation) {
        return;
      }
      recognition.start();
      this.notify({ status: "listening", transcript: "", actions: [] });
    } catch (error) {
      if (this.active && this.startGeneration === generation && this.isRecognitionStartPending(error)) {
        this.scheduleRestart(360);
        return;
      }
      this.active = false;
      this.shouldRestart = false;
      this.startGeneration += 1;
      this.notify({ status: "error", transcript: "", actions: [], error: error instanceof Error ? error.message : "start failed" });
    }
  }

  stop(): void {
    if (!this.recognition || !this.active) {
      return;
    }
    this.active = false;
    this.shouldRestart = false;
    this.startGeneration += 1;
    this.processedResultCount = 0;
    this.clearRestartTimer();
    try {
      this.recognition.stop();
    } catch {
      this.recognition.abort();
    }
    this.notify({ status: "idle", transcript: "", actions: [] });
  }

  private async ensureMicrophonePermission(): Promise<void> {
    if (this.microphoneReady) {
      return;
    }
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      return;
    }
    const stream = await mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    this.microphoneReady = true;
  }

  private isRestartableError(error: string): boolean {
    return !["not-allowed", "service-not-allowed", "audio-capture"].includes(error);
  }

  private handleResult(event: RecognitionEvent): void {
    const visibleTranscripts: string[] = [];
    const transcripts: string[] = [];
    let processedResultCount = this.processedResultCount;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      if (!transcript) {
        continue;
      }
      visibleTranscripts.push(transcript);
      if (i >= this.processedResultCount && result.isFinal) {
        transcripts.push(transcript);
        processedResultCount = Math.max(processedResultCount, i + 1);
      }
    }

    const latestTranscript = visibleTranscripts[visibleTranscripts.length - 1] ?? "";
    if (!latestTranscript && transcripts.length === 0) {
      return;
    }

    if (processedResultCount > this.processedResultCount) {
      this.processedResultCount = processedResultCount;
    }

    const finalTranscript = transcripts.join(" ").trim();
    if (!finalTranscript) {
      return;
    }

    const actions = this.matcher(finalTranscript);
    if (actions.length > 0) {
      const actionsToEmit = this.dedupeActions(actions);
      if (actionsToEmit.length > 0) {
        this.onActions(actionsToEmit);
      }
    }
    if (!this.active) {
      return;
    }
    this.notify({ status: "listening", transcript: finalTranscript, actions });
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

  private scheduleRestart(delay = 250): void {
    this.clearRestartTimer();
    this.restartTimer = window.setTimeout(() => {
      this.restartTimer = null;
      if (!this.active || !this.shouldRestart) {
        return;
      }
      try {
        this.processedResultCount = 0;
        this.recognition?.start();
        this.notify({ status: "listening", transcript: "", actions: [] });
      } catch (error) {
        if (this.isRecognitionStartPending(error)) {
          this.scheduleRestart(500);
          return;
        }
        this.active = false;
        this.shouldRestart = false;
        this.startGeneration += 1;
        this.notify({ status: "error", transcript: "", actions: [], error: error instanceof Error ? error.message : "start failed" });
      }
    }, delay);
  }

  private clearRestartTimer(): void {
    if (this.restartTimer === null) {
      return;
    }
    window.clearTimeout(this.restartTimer);
    this.restartTimer = null;
  }

  private isRecognitionStartPending(error: unknown): boolean {
    return error instanceof DOMException
      ? error.name === "InvalidStateError"
      : error instanceof Error && /already|started|state/i.test(error.message);
  }
}
