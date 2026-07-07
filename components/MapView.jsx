"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LAYERS = [
  { id: "none", label: "None" },
  { id: "precipitation_new", label: "Precipitation" },
  { id: "clouds_new", label: "Clouds" },
  { id: "temp_new", label: "Temperature" },
  { id: "wind_new", label: "Wind" },
];

export default function MapView({ lat, lon, label }) {
  const [layer, setLayer] = useState("precipitation_new");

  return (
    <div className="rounded border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted">Map</h2>
        <div className="flex flex-wrap gap-1">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayer(l.id)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                layer === l.id ? "bg-accent text-accent-ink" : "border border-border text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-container border border-border">
        <MapContainer center={[lat, lon]} zoom={9} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {layer !== "none" && (
            <TileLayer
              key={layer}
              url={`/api/tiles/${layer}/{z}/{x}/{y}`}
              opacity={0.6}
              attribution='Weather layer &copy; OpenWeatherMap'
            />
          )}
          <Marker position={[lat, lon]} icon={markerIcon}>
            <Popup>{label}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
