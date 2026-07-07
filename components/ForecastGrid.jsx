import WeatherIcon from "./WeatherIcon";
import { displayTemp } from "@/lib/format";

export default function ForecastGrid({ forecast, unit }) {
  return (
    <div className="rounded border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-muted">5-day forecast</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {forecast.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1.5 rounded border border-border py-4">
            <p className="text-xs font-medium text-muted">
              {new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}
            </p>
            <WeatherIcon condition={day.condition} icon={day.icon} size={26} className="text-accent" />
            <p className="text-sm font-medium text-ink">
              {displayTemp(day.tempMaxC, unit)}° <span className="text-muted">{displayTemp(day.tempMinC, unit)}°</span>
            </p>
            <p className="text-[11px] text-muted">{day.precipitationChance}% rain</p>
          </div>
        ))}
      </div>
    </div>
  );
}
