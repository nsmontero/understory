import { useTour } from "@/lib/tour";
import type { Lang } from "@/content/types";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useTour();
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full bg-secondary p-1 ${className}`}>
      {(["en", "fr"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`h-11 min-w-14 rounded-full px-4 text-base font-bold uppercase transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-secondary-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function PoweredBy() {
  const { t } = useTour();
  return (
    <p className="text-center text-xs opacity-60">
      {t.poweredBy} <span className="font-bold">Understory</span>
    </p>
  );
}
