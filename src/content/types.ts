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

export type AmenityType = "washroom" | "water" | "food" | "bike-parking";
export interface Amenity {
  type: AmenityType;
  coords: LatLng;
  name?: string;
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
  /** Optional rider services shown on a toggleable map layer. */
  amenities?: Amenity[];
}
