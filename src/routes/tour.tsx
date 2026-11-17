import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft } from "lucide-react";
import { activePark } from "@/content/parks";
import type { LatLng } from "@/content/types";
import { useTour } from "@/lib/tour";
import { alongRoute, cumulative, findStopInRange, pointAt } from "@/lib/geo";
import { narrator, playChime, unlockAudio } from "@/lib/narration";
import { StopSheet } from "@/components/tour/StopSheet";
import { LangToggle } from "@/components/tour/LangToggle";

const TourMap = lazy(() => import("@/components/tour/TourMap"));

export const Route = createFileRoute("/tour")({
  head: () => ({
    meta: [
      { title: `Map · ${activePark.name.en} Audio Tour` },
      { name: "description", content: `Follow the route and hear each stop of the ${activePark.name.en} tour.` },
      { property: "og:title", content: `Map · ${activePark.name.en} Audio Tour` },
      { property: "og:description", content: `Follow the route and hear each stop of the ${activePark.name.en} tour.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TourPage,
});

type Mode = "location" | "preview";

function TourPage() {
  const { park, t, completed, markCompleted } = useTour();
  const navigate = useNavigate();
  const cum = useMemo(() => cumulative(park.route), [park]);
  const stopAlong = useMemo(() => park.stops.map((s) => alongRoute(park.route, cum, s.coords)), [park, cum]);

  const [mode, setMode] = useState<Mode>("location");
  const [notice, setNotice] = useState<string | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [open, setOpen] = useState<{ index: number; autoplay: boolean } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const played = useRef(new Set<string>());
  const along = useRef(0);
  const previewNext = useRef(0);

  const trigger = useCallback(
    (index: number) => {
      played.current.add(park.stops[index]!.id);
      playChime();
      // Let the chime ring before narration starts.
      setTimeout(() => setOpen({ index, autoplay: true }), 700);
    },
    [park],
  );

  // Live location mode
  useEffect(() => {
    if (mode !== "location") return;
    if (!("geolocation" in navigator)) {
      setMode("preview");
      setNotice(t.unsupportedNotice);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const here: LatLng = [p.coords.latitude, p.coords.longitude];
        setPosition(here);
        const s = findStopInRange(here, park.stops, played.current, park.triggerRadiusMeters);
        if (s) trigger(park.stops.indexOf(s));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setMode("preview");
          setNotice(t.deniedNotice);
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [mode, park, trigger, t]);

  // Preview mode: glide along the route, stopping at each stop in order.
  const sheetOpen = open !== null;
  useEffect(() => {
    if (mode !== "preview" || sheetOpen) return;
    if (previewNext.current >= park.stops.length) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = stopAlong[previewNext.current]!;
      along.current = Math.min(target, along.current + park.previewSpeedMetersPerSecond * dt);
      setPosition(pointAt(park.route, cum, along.current));
      if (along.current >= target) {
        const i = previewNext.current;
        previewNext.current++;
        trigger(i);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mode, sheetOpen, park, cum, stopAlong, trigger]);

  const goNext = useCallback(() => {
    if (!open) return;
    markCompleted(park.stops[open.index]!.id);
    narrator.stop();
    setCountdown(null);
    const last = open.index === park.stops.length - 1;
    setOpen(null);
    if (last) void navigate({ to: "/finish" });
  }, [open, park, markCompleted, navigate]);

  const closeSheet = useCallback(() => {
    if (open) markCompleted(park.stops[open.index]!.id);
    setCountdown(null);
    setOpen(null);
  }, [open, park, markCompleted]);

  // In preview, ride on automatically once a stop finishes.
  const nar = useSyncExternalStore(narrator.subscribe, narrator.getState, narrator.getState);
  useEffect(() => {
    if (mode !== "preview" || !open || !nar.ended) {
      setCountdown(null);
      return;
    }
    let n = 4;
    setCountdown(n);
    const id = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(id);
        goNext();
      } else setCountdown(n);
    }, 1000);
    return () => clearInterval(id);
  }, [mode, open, nar.ended, goNext]);

  const switchMode = (m: Mode) => {
    unlockAudio();
    setNotice(null);
    if (m === "preview") {
      // Resume from the first stop not yet played.
      const idx = park.stops.findIndex((s) => !played.current.has(s.id));
      previewNext.current = idx === -1 ? park.stops.length : idx;
      along.current = idx <= 0 ? 0 : stopAlong[idx - 1]!;
    }
    setMode(m);
  };

  const nextIndex = park.stops.findIndex((s) => !completed.includes(s.id));

  return (
    <main className="fixed inset-0 overflow-hidden">
      <ClientOnly fallback={<div className="absolute inset-0 bg-card" />}>
        <Suspense fallback={<div className="absolute inset-0 bg-card" />}>
          <TourMap
            park={park}
            position={position}
            completed={completed}
            nextIndex={nextIndex}
            follow={mode === "preview" || position !== null}
            onStopClick={(i) => setOpen({ index: i, autoplay: false })}
          />
        </Suspense>
      </ClientOnly>

      <header className="absolute inset-x-0 top-0 z-[900] flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/" aria-label={t.home} className="grid size-12 place-items-center rounded-full bg-background text-foreground shadow-lift">
          <ChevronLeft className="size-7" />
        </Link>
        <div role="group" aria-label="Mode" className="flex rounded-full bg-background p-1 shadow-lift">
          {(["location", "preview"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              aria-label={m === "location" ? t.liveLocation : t.previewMode}
              className={`h-11 whitespace-nowrap rounded-full px-4 text-base font-bold transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-foreground"}`}
            >
              {m === "location" ? t.liveShort : t.previewShort}
            </button>
          ))}
        </div>
        <LangToggle className="shadow-lift max-[380px]:hidden" />
      </header>

      {notice && (
        <div role="status" className="absolute inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+4rem)] z-[900] rounded-2xl bg-accent p-4 text-base font-semibold text-accent-foreground shadow-lift">
          {notice}
          <button onClick={() => setNotice(null)} className="ml-2 underline">
            OK
          </button>
        </div>
      )}

      {!open && (
        <div className="absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[900] rounded-2xl bg-background p-4 text-foreground shadow-lift">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            {mode === "preview" ? t.previewOn : position ? t.liveLocation : t.locating}
          </p>
          <div className="mt-2 flex gap-1.5" aria-label={`${completed.length} / ${park.stops.length}`}>
            {park.stops.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setOpen({ index: i, autoplay: false })}
                className={`h-3 flex-1 rounded-full ${completed.includes(s.id) ? "bg-primary" : "bg-secondary"}`}
                aria-label={s.title.en}
              />
            ))}
          </div>
        </div>
      )}

      {open && (
        <StopSheet
          key={open.index}
          index={open.index}
          position={position}
          autoplay={open.autoplay}
          countdown={countdown}
          onNext={goNext}
          onClose={closeSheet}
        />
      )}
    </main>
  );
}
