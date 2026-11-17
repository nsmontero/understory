import type { LatLng } from "@/content/types";

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function distance(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
  const x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** 0..7 → N, NE, E, SE, S, SW, W, NW */
export const compassIndex = (deg: number) => Math.round(deg / 45) % 8;

export function cumulative(route: LatLng[]): number[] {
  const out = [0];
  for (let i = 1; i < route.length; i++) out.push(out[i - 1]! + distance(route[i - 1]!, route[i]!));
  return out;
}

export function pointAt(route: LatLng[], cum: number[], d: number): LatLng {
  if (d <= 0) return route[0]!;
  const total = cum[cum.length - 1]!;
  if (d >= total) return route[route.length - 1]!;
  let i = 1;
  while (cum[i]! < d) i++;
  const t = (d - cum[i - 1]!) / (cum[i]! - cum[i - 1]! || 1);
  const a = route[i - 1]!;
  const b = route[i]!;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Distance along the route of the point on the route closest to p. */
export function alongRoute(route: LatLng[], cum: number[], p: LatLng): number {
  let best = Infinity;
  let bestD = 0;
  const k = Math.cos(rad(p[0]));
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!;
    const b = route[i]!;
    const bx = (b[1] - a[1]) * k, by = b[0] - a[0];
    const px = (p[1] - a[1]) * k, py = p[0] - a[0];
    const len2 = bx * bx + by * by || 1e-12;
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / len2));
    const q: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const dd = distance(p, q);
    if (dd < best) {
      best = dd;
      bestD = cum[i - 1]! + t * (cum[i]! - cum[i - 1]!);
    }
  }
  return bestD;
}

/** First stop (in riding order) within radius that hasn't played yet, or null. */
export function findStopInRange<T extends { id: string; coords: LatLng }>(
  position: LatLng,
  stops: T[],
  played: ReadonlySet<string>,
  radius: number,
): T | null {
  return stops.find((s) => !played.has(s.id) && distance(position, s.coords) <= radius) ?? null;
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}
