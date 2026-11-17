import { describe, expect, it } from "vitest";
import { distance, findStopInRange } from "./geo";
import type { LatLng } from "@/content/types";

const stop = { id: "a", coords: [49.3, -123.13] as LatLng };
// ~0.00036° latitude ≈ 40 m
const at = (m: number): LatLng => [49.3 + m / 111195, -123.13];

describe("stop triggering", () => {
  it("measures distance in metres", () => {
    expect(distance(at(0), at(100))).toBeCloseTo(100, 0);
  });
  it("triggers a stop within 40 metres", () => {
    expect(findStopInRange(at(35), [stop], new Set(), 40)?.id).toBe("a");
  });
  it("does not trigger a stop 50 metres away", () => {
    expect(findStopInRange(at(50), [stop], new Set(), 40)).toBeNull();
  });
  it("plays each stop automatically only once", () => {
    expect(findStopInRange(at(10), [stop], new Set(["a"]), 40)).toBeNull();
  });
});
