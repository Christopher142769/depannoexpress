"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LANDING_MAP_DEMO } from "@/lib/landing-map-demo";

const clientIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#e0231c;border:3px solid #fff;box-shadow:0 2px 12px rgba(224,35,28,.45)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const proIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#1e73be;border:3px solid #fff;box-shadow:0 0 0 6px rgba(30,115,190,.28)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitDemoBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([
      [LANDING_MAP_DEMO.client.lat, LANDING_MAP_DEMO.client.lng],
      [LANDING_MAP_DEMO.pro.lat, LANDING_MAP_DEMO.pro.lng],
    ]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map]);
  return null;
}

/** Carte Leaflet décorative — landing (Cotonou, trajet démo) */
export function LandingTrackMap() {
  const { client, pro, route, center } = LANDING_MAP_DEMO;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      zoomControl={false}
      attributionControl
      className="landing-leaflet-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitDemoBounds />
      <Polyline
        positions={route}
        pathOptions={{
          color: "#2e9cf0",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "10 14",
        }}
      />
      <Marker position={[client.lat, client.lng]} icon={clientIcon} />
      <Marker position={[pro.lat, pro.lng]} icon={proIcon} />
    </MapContainer>
  );
}
