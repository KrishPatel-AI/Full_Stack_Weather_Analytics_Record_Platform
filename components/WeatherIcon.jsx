"use client";

import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Moon } from "lucide-react";

const ICON_MAP = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: CloudSnow,
  Mist: CloudFog,
  Fog: CloudFog,
  Haze: CloudFog,
  Smoke: CloudFog,
};

export default function WeatherIcon({ condition, icon, size = 40, className = "" }) {
  const isNight = icon?.endsWith("n");
  const Icon = condition === "Clear" && isNight ? Moon : ICON_MAP[condition] ?? Cloud;
  return <Icon size={size} strokeWidth={1.5} className={className} />;
}
