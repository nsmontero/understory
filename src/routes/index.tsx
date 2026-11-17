import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Clock, MapPin } from "lucide-react";
import { activePark } from "@/content/parks";
import { useTour } from "@/lib/tour";
import { cumulative } from "@/lib/geo";
import { unlockAudio } from "@/lib/narration";
import { LangToggle, PoweredBy } from "@/components/tour/LangToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${activePark.name.en} Audio Bike Tour` },
      { name: "description", content: activePark.tagline.en },
      { property: "og:title", content: `${activePark.name.en} Audio Bike Tour` },
      { property: "og:description", content: activePark.tagline.en },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { park, lang, t } = useTour();
  const km = cumulative(park.route).at(-1)! / 1000;
  const minutes = Math.round(((km / park.rideSpeedKmh) * 60 + park.stops.length * 1.25) / 5) * 5;

  return (
    <main className="topo-bg mx-auto flex min-h-dvh max-w-xl flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
      <div className="flex justify-end">
        <LangToggle />
      </div>
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">
          <Bike className="size-5" /> Audio tour
        </p>
        <h1 className="mt-4 text-6xl font-extrabold leading-[0.95] sm:text-7xl">{park.name[lang]}</h1>
        <p className="mt-5 text-xl leading-snug opacity-90">{park.tagline[lang]}</p>
        <div className="mt-8 flex flex-wrap gap-3 text-base font-semibold">
          <span className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Clock className="size-5 text-primary" /> ~{minutes} {t.min} · {km.toFixed(1)} km
          </span>
          <span className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <MapPin className="size-5 text-primary" /> {park.stops.length} {t.stops}
          </span>
        </div>
      </div>
      <Link
        to="/tour"
        onClick={() => unlockAudio()}
        className="flex h-16 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-lift transition-transform active:scale-[0.98]"
      >
        {t.startTour}
      </Link>
      <div className="mt-6">
        <PoweredBy />
      </div>
    </main>
  );
}
