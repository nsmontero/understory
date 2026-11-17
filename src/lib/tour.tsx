import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { activePark } from "@/content/parks";
import type { Lang, Park } from "@/content/types";
import { strings } from "./ui-strings";

interface TourCtx {
  park: Park;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof strings)["en"];
  completed: string[];
  markCompleted: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [completed, setCompleted] = useState<string[]>([]);
  const value = useMemo<TourCtx>(
    () => ({
      park: activePark,
      lang,
      setLang,
      t: strings[lang],
      completed,
      markCompleted: (id) => setCompleted((c) => (c.includes(id) ? c : [...c, id])),
      reset: () => setCompleted([]),
    }),
    [lang, completed],
  );
  const { colors } = activePark;
  return (
    <Ctx.Provider value={value}>
      <div
        className="min-h-dvh bg-background text-foreground"
        style={
          {
            "--park-primary": colors.primary,
            "--park-accent": colors.accent,
            "--park-alert": colors.alert,
            "--park-surface": colors.surface,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useTour() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTour outside TourProvider");
  return c;
}
