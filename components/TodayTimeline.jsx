import WeatherIcon from "./WeatherIcon";
import { displayTemp } from "@/lib/format";

export default function TodayTimeline({ hourly, unit }) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="rounded border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-muted">Next 24 hours</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
        {hourly.map((slot) => {
          const time = new Date(slot.time.replace(" ", "T"));
          return (
            <div key={slot.time} className="flex min-w-[64px] flex-col items-center gap-1.5">
              <span className="text-xs text-muted">
                {time.toLocaleTimeString(undefined, { hour: "numeric" })}
              </span>
              <WeatherIcon condition={slot.condition} icon={slot.icon} size={22} className="text-accent" />
              <span className="text-sm font-medium text-ink">{displayTemp(slot.tempC, unit)}°</span>
              <span className="text-[11px] text-muted">{slot.precipitationChance}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
