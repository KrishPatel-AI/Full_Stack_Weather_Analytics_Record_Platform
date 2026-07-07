"use client";

export default function UnitToggle({ unit, onChange }) {
  return (
    <div className="flex overflow-hidden rounded border border-border text-xs">
      <button
        onClick={() => onChange("C")}
        className={`px-2.5 py-1.5 transition-colors ${unit === "C" ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}
      >
        °C
      </button>
      <button
        onClick={() => onChange("F")}
        className={`px-2.5 py-1.5 transition-colors ${unit === "F" ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`}
      >
        °F
      </button>
    </div>
  );
}
