const POLLUTANT_LABELS = {
  pm2_5: "Fine particles (PM2.5)",
  pm10: "Coarse particles (PM10)",
  o3: "Ozone",
  no2: "Nitrogen dioxide",
  so2: "Sulfur dioxide",
  co: "Carbon monoxide",
};

export default function AirQualityCard({ airQuality }) {
  if (!airQuality) {
    return (
      <div className="rounded border border-border bg-surface p-6 text-sm text-muted">
        Air quality data isn't available for this location right now.
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-muted">Air quality</h2>

      <div className="mt-3 flex items-center gap-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: airQuality.color }}
          aria-hidden
        />
        <span className="text-2xl font-semibold text-ink">{airQuality.label}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Based on the U.S. EPA-style 1 (Good) to 5 (Very Poor) index used by OpenWeatherMap.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
        {Object.entries(airQuality.components).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">{POLLUTANT_LABELS[key] ?? key}</span>
            <span className="text-sm font-medium text-ink">{value.toFixed(1)} μg/m³</span>
          </div>
        ))}
      </div>
    </div>
  );
}
