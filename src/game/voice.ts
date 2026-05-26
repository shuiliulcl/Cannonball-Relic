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

export type VoiceInfo = {
  status: VoiceStatus;
  transcript: string;
  actions: VoiceAction[];
  error?: string;
};

export class VoiceInput {
  private readonly recognition: Recognition | null = null;
  private observer: ((info: VoiceInfo) => void) | null = null;
  private active = false;
  private shouldRestart = false;
  private lastActionAt = 0;
  private lastActionKey = "";
  private lastRecognitionText = "";

  constructor(private readonly onActions: (actions: VoiceAction[]) => void) {
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

  observe(observer: (info: VoiceInfo) => void): void {
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

    const actions = matchVoiceActions(newTranscript || latestTranscript);
    if (actions.length > 0) {
      const actionsToEmit = this.dedupeActions(actions);
      if (actionsToEmit.length > 0) {
        this.onActions(actionsToEmit);
      }
    }
    this.notify({ status: "listening", transcript: latestTranscript, actions });
  }

  private dedupeActions(actions: VoiceAction[]): VoiceAction[] {
    const key = actions.map((action) => (action.type === "hidden" ? `hidden:${action.id}` : action.type)).join("|");
    const now = performance.now();
    if (key === this.lastActionKey && now - this.lastActionAt < 900) {
      return [];
    }
    this.lastActionKey = key;
    this.lastActionAt = now;
    return actions;
  }

  private notify(info: VoiceInfo): void {
    this.observer?.(info);
  }
}
