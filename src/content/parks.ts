import type { Park } from "./types";

// Every JSON file in this folder is a park. Add a file to add a park.
const modules = import.meta.glob<{ default: Park }>("./*.json", { eager: true });

export const parks: Park[] = Object.keys(modules)
  .sort()
  .map((k) => modules[k]!.default);

const wanted = import.meta.env['VITE_PARK_ID'] as string | undefined;
export const activePark: Park = parks.find((p) => p.id === wanted) ?? parks[0]!;
