import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Ticket } from "lucide-react";
import { activePark } from "@/content/parks";
import { useTour } from "@/lib/tour";

export const Route = createFileRoute("/partner/$partnerId")({
  loader: ({ params }) => {
    const partner = activePark.partners.find((p) => p.id === params.partnerId);
    if (!partner) throw notFound();
    return { partner };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.partner.label.en ?? "Booking"} · ${activePark.name.en}` },
      { name: "description", content: loaderData?.partner.description.en ?? "" },
      { property: "og:title", content: `${loaderData?.partner.label.en ?? "Booking"} · ${activePark.name.en}` },
      { property: "og:description", content: loaderData?.partner.description.en ?? "" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnerPage,
});

function PartnerPage() {
  const { partner } = Route.useLoaderData();
  const { lang, t } = useTour();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <Link to="/finish" className="flex h-12 items-center gap-1 self-start text-lg font-semibold">
        <ChevronLeft className="size-6" /> {t.backToTour}
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground">
          <Ticket className="size-10" />
        </span>
        <h1 className="mt-6 text-4xl font-extrabold">{partner.label[lang]}</h1>
        <p className="mt-3 text-xl opacity-90">{partner.description[lang]}</p>
        <p className="mt-6 rounded-full bg-secondary px-5 py-2 font-bold">{t.comingSoon}</p>
      </div>
    </main>
  );
}
