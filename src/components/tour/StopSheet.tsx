import { useEffect, useSyncExternalStore } from "react";
import { Pause, Play, RotateCcw, RotateCw, Repeat, ArrowUp, X } from "lucide-react";
import { narrator } from "@/lib/narration";
import { useTour } from "@/lib/tour";
import { bearing, compassIndex, distance, formatDistance } from "@/lib/geo";
import type { LatLng } from "@/content/types";

interface Props {
  index: number;
  position: LatLng | null;
  autoplay: boolean;
  countdown: number | null;
  onNext: () => void;
  onClose: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function StopSheet({ index, position, autoplay, countdown, onNext, onClose }: Props) {
  const { park, lang, t } = useTour();
  const stop = park.stops[index]!;
  const next = park.stops[index + 1];
  const st = useSyncExternalStore(narrator.subscribe, narrator.getState, narrator.getState);

  useEffect(() => {
    void narrator.load(stop.audio[lang], stop.script[lang], lang, autoplay);
    return () => narrator.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop.id, lang]);

  const from = position ?? stop.coords;
  const nextDist = next ? distance(from, next.coords) : 0;
  const nextDir = next ? t.dirs[compassIndex(bearing(from, next.coords))]! : "";
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] flex max-h-[88dvh] flex-col rounded-t-[2rem] bg-card text-card-foreground shadow-lift animate-in slide-in-from-bottom duration-500">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">{t.stopOf(index + 1, park.stops.length)}</p>
          <h2 className="mt-1 text-3xl font-extrabold leading-tight">{stop.title[lang]}</h2>
        </div>
        <button onClick={onClose} aria-label={t.close} className="grid size-12 shrink-0 place-items-center rounded-full bg-muted">
          <X className="size-6" />
        </button>
      </div>

      <div className="overflow-y-auto px-5 pb-5">
        <div className="placeholder-stripes mt-4 grid aspect-[16/8] place-items-center rounded-2xl border border-border">
          <span className="rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-muted-foreground">{t.imagePlaceholder}</span>
        </div>

        <div className="mt-4 rounded-2xl bg-primary-foreground p-4 text-secondary-foreground">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => narrator.skip(-15)} aria-label={t.back15} className="relative grid size-14 place-items-center rounded-full bg-secondary">
              <RotateCcw className="size-7" />
              <span className="absolute text-[10px] font-bold">15</span>
            </button>
            <button
              onClick={() => (st.playing ? narrator.pause() : narrator.play())}
              aria-label={st.playing ? t.pause : t.play}
              className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift"
            >
              {st.playing ? <Pause className="size-9" fill="currentColor" /> : <Play className="ml-1 size-9" fill="currentColor" />}
            </button>
            <button onClick={() => narrator.skip(15)} aria-label={t.fwd15} className="relative grid size-14 place-items-center rounded-full bg-secondary">
              <RotateCw className="size-7" />
              <span className="absolute text-[10px] font-bold">15</span>
            </button>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-sm font-semibold tabular-nums opacity-80">
            <span>{fmt(st.position)}</span>
            <button onClick={() => narrator.replay()} className="flex items-center gap-1.5 underline-offset-4 hover:underline">
              <Repeat className="size-4" /> {t.replay}
            </button>
            <span>{fmt(st.duration)}</span>
          </div>
          {st.source === "speech" && <p className="mt-2 text-xs opacity-70">{t.voiceNote}</p>}
        </div>

        <h3 className="mt-5 text-lg font-extrabold">{t.transcript}</h3>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.draft}</p>
        <p className="mt-2 text-lg leading-relaxed">{stop.script[lang]}</p>
      </div>

      <div className="border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {next ? (
          <button onClick={onNext} className="flex w-full items-center gap-4 rounded-2xl bg-background p-3 pr-5 text-left text-foreground">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ArrowUp className="size-7" style={{ transform: `rotate(${bearing(from, next.coords)}deg)` }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold opacity-80">
                {t.nextStop} · {formatDistance(nextDist)} {nextDir} {t.away}
              </span>
              <span className="block truncate font-display text-xl font-extrabold">{next.title[lang]}</span>
            </span>
            {countdown !== null && <span className="text-sm font-bold text-primary">{t.autoContinue(countdown)}</span>}
          </button>
        ) : (
          <button onClick={onNext} className="h-16 w-full rounded-2xl bg-accent text-xl font-extrabold text-accent-foreground">
            {t.finishTour} {countdown !== null && `· ${countdown}s`}
          </button>
        )}
      </div>
    </div>
  );
}
