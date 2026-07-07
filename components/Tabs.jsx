"use client";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-3 py-2 text-sm transition-colors ${
            active === tab.id ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
          {active === tab.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
        </button>
      ))}
    </div>
  );
}
