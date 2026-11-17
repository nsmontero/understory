import type { Lang } from "@/content/types";

export interface NarrationState {
  playing: boolean;
  position: number;
  duration: number;
  source: "file" | "speech" | null;
  ended: boolean;
}

const WORDS_PER_SECOND = 2.5;
const fileCache = new Map<string, boolean>();

async function fileExists(src: string): Promise<boolean> {
  if (fileCache.has(src)) return fileCache.get(src)!;
  let ok = false;
  try {
    const res = await fetch(src, { method: "HEAD" });
    ok = res.ok && (res.headers.get("content-type") ?? "").startsWith("audio");
  } catch {
    ok = false;
  }
  fileCache.set(src, ok);
  return ok;
}

let audioCtx: AudioContext | null = null;

/** Call from a tap so iOS/Android allow later automatic playback. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx ??= new Ctx();
    void audioCtx.resume();
  } catch {
    /* no web audio */
  }
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}

export function playChime() {
  if (!audioCtx) unlockAudio();
  const ctx = audioCtx;
  if (!ctx) return;
  const now = ctx.currentTime;
  [880, 1318.5].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t = now + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 1);
  });
}

class Narrator {
  private listeners = new Set<() => void>();
  private state: NarrationState = { playing: false, position: 0, duration: 0, source: null, ended: false };
  private audio: HTMLAudioElement | null = null;
  private words: string[] = [];
  private lang: Lang = "en";
  private token = 0;
  private startedAt = 0;
  private startOffset = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getState = () => this.state;
  private set(p: Partial<NarrationState>) {
    this.state = { ...this.state, ...p };
    this.listeners.forEach((l) => l());
  }

  async load(src: string, text: string, lang: Lang, autoplay: boolean) {
    this.stop();
    const token = ++this.token;
    this.lang = lang;
    this.words = text.split(/\s+/).filter(Boolean);
    const hasFile = await fileExists(src);
    if (token !== this.token) return;
    if (hasFile) {
      const a = new Audio(src);
      this.audio = a;
      a.addEventListener("loadedmetadata", () => this.set({ duration: a.duration }));
      a.addEventListener("timeupdate", () => this.set({ position: a.currentTime }));
      a.addEventListener("play", () => this.set({ playing: true, ended: false }));
      a.addEventListener("pause", () => this.set({ playing: false }));
      a.addEventListener("ended", () => this.set({ playing: false, ended: true }));
      this.set({ source: "file", position: 0, duration: 0, ended: false });
    } else {
      this.set({ source: "speech", position: 0, duration: this.words.length / WORDS_PER_SECOND, ended: false });
    }
    if (autoplay) this.play();
  }

  play() {
    if (this.state.source === "file" && this.audio) {
      if (this.state.ended) this.audio.currentTime = 0;
      void this.audio.play().catch(() => this.set({ playing: false }));
      return;
    }
    if (this.state.source !== "speech" || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const from = this.state.ended ? 0 : this.state.position;
    this.speakFrom(from);
  }

  private speakFrom(seconds: number) {
    const synth = window.speechSynthesis;
    const myToken = ++this.token;
    synth.cancel();
    const startWord = Math.min(this.words.length - 1, Math.max(0, Math.floor(seconds * WORDS_PER_SECOND)));
    const u = new SpeechSynthesisUtterance(this.words.slice(startWord).join(" "));
    u.lang = this.lang === "fr" ? "fr-CA" : "en-CA";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(this.lang));
    if (voice) u.voice = voice;
    u.rate = 1;
    u.onend = () => {
      if (myToken !== this.token) return;
      this.clearTimer();
      this.set({ playing: false, ended: true, position: this.state.duration });
    };
    this.startOffset = startWord / WORDS_PER_SECOND;
    this.startedAt = performance.now();
    this.clearTimer();
    this.timer = setInterval(() => {
      const pos = Math.min(this.state.duration, this.startOffset + (performance.now() - this.startedAt) / 1000);
      this.set({ position: pos });
    }, 250);
    this.set({ playing: true, ended: false, position: this.startOffset });
    // Chrome needs a tick after cancel() before speak()
    setTimeout(() => myToken === this.token && synth.speak(u), 60);
  }

  pause() {
    if (this.state.source === "file") return this.audio?.pause();
    if (this.state.source === "speech") {
      this.token++;
      window.speechSynthesis.cancel();
      this.clearTimer();
      this.set({ playing: false });
    }
  }

  skip(seconds: number) {
    const pos = Math.max(0, Math.min(this.state.duration, this.state.position + seconds));
    if (this.state.source === "file" && this.audio) {
      this.audio.currentTime = pos;
      return;
    }
    if (this.state.source === "speech") {
      if (this.state.playing) this.speakFrom(pos);
      else this.set({ position: pos, ended: false });
    }
  }

  replay() {
    if (this.state.source === "file" && this.audio) {
      this.audio.currentTime = 0;
      void this.audio.play().catch(() => {});
    } else if (this.state.source === "speech") {
      this.speakFrom(0);
    }
  }

  stop() {
    this.token++;
    this.clearTimer();
    this.audio?.pause();
    this.audio = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    this.set({ playing: false, position: 0, ended: false });
  }

  private clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export const narrator = new Narrator();
