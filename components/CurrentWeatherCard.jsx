import WeatherIcon from "./WeatherIcon";
import { displayTemp } from "@/lib/format";
import { Droplets, Wind, Thermometer, MapPin, Gauge, Eye, Sunrise, Sunset } from "lucide-react";

const COMPASS_POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function windDirection(deg) {
  if (deg === undefined || deg === null) return "";
  return COMPASS_POINTS[Math.round(deg / 22.5) % 16];
}

function localTime(unixSeconds, timezoneOffsetSeconds) {
  if (!unixSeconds) return "—";
  const d = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  let hours = d.getUTCHours();
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

export default function CurrentWeatherCard({ location, current, unit }) {
  const details = [
    { icon: Thermometer, label: "Feels like", value: `${displayTemp(current.feelsLikeC, unit)}°` },
    { icon: Droplets, label: "Humidity", value: `${current.humidity}%` },
    { icon: Wind, label: "Wind", value: `${current.windSpeed} m/s ${windDirection(current.windDeg)}` },
    { icon: Gauge, label: "Pressure", value: `${current.pressure} hPa` },
    { icon: Eye, label: "Visibility", value: `${(current.visibilityMeters / 1000).toFixed(1)} km` },
    { icon: Sunrise, label: "Sunrise", value: localTime(current.sunrise, current.timezoneOffset) },
    { icon: Sunset, label: "Sunset", value: localTime(current.sunset, current.timezoneOffset) },
    { icon: Droplets, label: "Cloud cover", value: `${current.cloudsPercent}%` },
  ];

  return (
    <div className="rounded border border-border bg-surface p-6">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <MapPin size={14} strokeWidth={1.5} />
        <span>{location.name}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-5xl font-semibold tracking-tight text-ink">{displayTemp(current.tempC, unit)}°</p>
          <p className="mt-1 text-sm capitalize text-muted">{current.description}</p>
          <p className="mt-0.5 text-xs text-muted">
            H: {displayTemp(current.tempMaxC, unit)}° L: {displayTemp(current.tempMinC, unit)}°
          </p>
        </div>
        <WeatherIcon condition={current.condition} icon={current.icon} size={56} className="text-accent" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Icon size={13} strokeWidth={1.5} />
              <span>{label}</span>
            </div>
            <span className="font-medium text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
