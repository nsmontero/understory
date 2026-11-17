import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { activePark } from "@/content/parks";
import { useTour } from "@/lib/tour";
import { PoweredBy } from "@/components/tour/LangToggle";

export const Route = createFileRoute("/finish")({
  head: () => ({
    meta: [
      { title: `Tour complete · ${activePark.name.en}` },
      { name: "description", content: `You've finished the ${activePark.name.en} audio tour.` },
      { property: "og:title", content: `Tour complete · ${activePark.name.en}` },
      { property: "og:description", content: `You've finished the ${activePark.name.en} audio tour.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Finish,
});

function Finish() {
  const { park, lang, t, completed, reset } = useTour();
  return (
    <main className="topo-bg mx-auto flex min-h-dvh max-w-xl flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-6">
      <div className="flex flex-1 flex-col justify-center">
        <CheckCircle2 className="size-14 text-primary" />
        <h1 className="mt-4 text-5xl font-extrabold leading-none">{t.finishedTitle}</h1>
        <p className="mt-3 text-xl">{t.finishedBody(completed.length, park.stops.length)}</p>
        <ol className="mt-6 space-y-2">
          {park.stops.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 text-lg">
              <span className={`grid size-9 place-items-center rounded-full font-display font-extrabold ${completed.includes(s.id) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {i + 1}
              </span>
              {s.title[lang]}
            </li>
          ))}
        </ol>
        <h2 className="mt-10 text-2xl font-extrabold">{t.keepExploring}</h2>
        <div className="mt-3 grid gap-3">
          {park.partners.map((p, i) => (
            <Link
              key={p.id}
              to="/partner/$partnerId"
              params={{ partnerId: p.id }}
              className={`flex h-16 items-center justify-center rounded-2xl text-xl font-extrabold shadow-lift ${i === 0 ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
            >
              {p.label[lang]}
            </Link>
          ))}
        </div>
        <Link to="/tour" onClick={reset} className="mt-5 text-center text-lg font-semibold underline underline-offset-4">
          {t.restart}
        </Link>
      </div>
      <div className="mt-8">
        <PoweredBy />
      </div>
    </main>
  );
}
