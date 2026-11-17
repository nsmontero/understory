export type Lang = "en" | "fr";
export type Localized = Record<Lang, string>;
export type LatLng = [number, number];

export interface Stop {
  id: string;
  title: Localized;
  coords: LatLng;
  status: string;
  audio: Record<Lang, string>;
  script: Localized;
}

export interface Partner {
  id: string;
  label: Localized;
  description: Localized;
}

export interface Park {
  id: string;
  name: Localized;
  tagline: Localized;
  colors: { primary: string; accent: string; alert: string; surface: string };
  map: { center: LatLng; zoom: number };
  triggerRadiusMeters: number;
  rideSpeedKmh: number;
  previewSpeedMetersPerSecond: number;
  route: LatLng[];
  partners: Partner[];
  stops: Stop[];
}
