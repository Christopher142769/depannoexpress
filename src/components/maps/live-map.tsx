"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const clientIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#e0231c;border:2px solid #fff;box-shadow:0 0 0 4px rgba(224,35,28,.25)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const proIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#1e73be;border:2px solid #fff;box-shadow:0 0 0 4px rgba(30,115,190,.25)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitBounds({
  points,
}: {
  points: { lat: number; lng: number }[];
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
  kind?: "client" | "pro";
};

export function LiveMap({
  points,
  className = "h-72 w-full rounded-card overflow-hidden border border-border",
}: {
  points: MapPoint[];
  className?: string;
}) {
  const center = points[0] ?? { lat: 6.3703, lng: 2.3912 }; // Cotonou

  return (
    <div className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p, i) => (
          <Marker
            key={`${p.lat}-${p.lng}-${i}`}
            position={[p.lat, p.lng]}
            icon={p.kind === "pro" ? proIcon : clientIcon}
          >
            {p.label ? <Popup>{p.label}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
