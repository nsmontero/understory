import { useEffect, useRef } from "react";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Bike, Coffee, Droplet, Toilet } from "lucide-react";
import type { AmenityType, LatLng, Park } from "@/content/types";

const AMENITY_ICON: Record<AmenityType, typeof Bike> = { washroom: Toilet, water: Droplet, food: Coffee, "bike-parking": Bike };

interface Props {
  park: Park;
  position: LatLng | null;
  completed: string[];
  nextIndex: number;
  follow: boolean;
  onStopClick: (index: number) => void;
  showAmenities: boolean;
  amenityLabel: (t: AmenityType) => string;
}

export default function TourMap({ park, position, completed, nextIndex, follow, onStopClick, showAmenities, amenityLabel }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef<L.Marker[]>([]);
  const rider = useRef<L.Marker | null>(null);
  const amenityLayer = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onStopClick);
  clickRef.current = onStopClick;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(park.map.center, park.map.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(m);
    const css = getComputedStyle(el.current);
    L.polyline(park.route, { color: css.getPropertyValue("--park-primary").trim() || "#313A1F", weight: 9, opacity: 0.9 }).addTo(m);
    L.polyline(park.route, { color: css.getPropertyValue("--park-accent").trim() || "#D19B3A", weight: 4, dashArray: "1 10", lineCap: "round" }).addTo(m);
    pins.current = park.stops.map((s, i) =>
      L.marker(s.coords, {
        icon: L.divIcon({ className: "", html: `<div class="stop-pin">${i + 1}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
        keyboard: true,
        title: s.title.en,
      })
        .on("click", () => clickRef.current(i))
        .addTo(m),
    );
    m.fitBounds(L.latLngBounds(park.route), { padding: [40, 40] });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      rider.current = null;
    };
  }, [park]);

  useEffect(() => {
    pins.current.forEach((p, i) => {
      const done = completed.includes(park.stops[i]!.id);
      const cls = done ? "is-done" : i === nextIndex ? "is-next" : "";
      p.setIcon(L.divIcon({ className: "", html: `<div class="stop-pin ${cls}">${i + 1}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] }));
    });
  }, [completed, nextIndex, park]);

  // Services layer: quiet, non-triggering pins; tap shows the name only.
  useEffect(() => {
    const m = map.current;
    amenityLayer.current?.remove();
    amenityLayer.current = null;
    if (!m || !showAmenities || !park.amenities?.length) return;
    const g = L.layerGroup(
      park.amenities.map((a) => {
        const Icon = AMENITY_ICON[a.type];
        const label = a.name ? `${amenityLabel(a.type)} · ${a.name}` : amenityLabel(a.type);
        return L.marker(a.coords, {
          icon: L.divIcon({ className: "", html: `<div class="amenity-pin">${renderToStaticMarkup(<Icon aria-hidden />)}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
          title: label,
          zIndexOffset: -500,
        }).bindTooltip(label, { direction: "top", offset: [0, -14] });
      }),
    ).addTo(m);
    amenityLayer.current = g;
    return () => {
      g.remove();
    };
  }, [showAmenities, park, amenityLabel]);

  useEffect(() => {
    const m = map.current;
    if (!m || !position) return;
    if (!rider.current) {
      rider.current = L.marker(position, {
        icon: L.divIcon({ className: "", html: '<div class="rider-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        zIndexOffset: 1000,
        interactive: false,
      }).addTo(m);
    } else rider.current.setLatLng(position);
    if (follow) m.panTo(position, { animate: false });
  }, [position, follow]);

  return <div ref={el} className="absolute inset-0 z-0" aria-label="Map" />;
}
