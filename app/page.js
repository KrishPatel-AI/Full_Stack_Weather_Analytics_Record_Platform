"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import SearchBar from "@/components/SearchBar";
import CurrentWeatherCard from "@/components/CurrentWeatherCard";
import ForecastGrid from "@/components/ForecastGrid";
import TodayTimeline from "@/components/TodayTimeline";
import AirQualityCard from "@/components/AirQualityCard";
import RecordsSection from "@/components/RecordsSection";
import ThemeToggle from "@/components/ThemeToggle";
import UnitToggle from "@/components/UnitToggle";
import Tabs from "@/components/Tabs";
import Footer from "@/components/Footer";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const TABS = [
  { id: "today", label: "Today" },
  { id: "forecast", label: "5-Day" },
  { id: "air", label: "Air Quality" },
  { id: "map", label: "Map" },
];

function HeroSkeleton() {
  return (
    <div className="animate-pulse rounded border border-border bg-surface p-6">
      <div className="h-3 w-32 rounded bg-border" />
      <div className="mt-4 h-12 w-24 rounded bg-border" />
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-border" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [location, setLocation] = useState(null);
  const [current, setCurrent] = useState(null);
  const [daily, setDaily] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [unit, setUnit] = useState("C");

  async function handleSearch(query, immediateError) {
    if (immediateError) {
      toast.error(immediateError);
      return;
    }

    setLoading(true);
    try {
      const [currentRes, forecastRes, airRes] = await Promise.all([
        fetch(`/api/weather/current?location=${encodeURIComponent(query)}`).then((r) => r.json()),
        fetch(`/api/weather/forecast?location=${encodeURIComponent(query)}`).then((r) => r.json()),
        fetch(`/api/weather/air-quality?location=${encodeURIComponent(query)}`).then((r) => r.json()),
      ]);

      if (currentRes.error) throw new Error(currentRes.error);
      if (forecastRes.error) throw new Error(forecastRes.error);

      setLocation(currentRes.location);
      setCurrent(currentRes.current);
      setDaily(forecastRes.forecast.daily);
      setHourly(forecastRes.forecast.hourly);
      setAirQuality(airRes.airQuality ?? null);
      setActiveTab("today");
    } catch (err) {
      toast.error(err.message);
      setCurrent(null);
      setDaily(null);
      setHourly(null);
      setAirQuality(null);
    } finally {
      setLoading(false);
    }
  }

  function handleView(saved) {
    setLocation(saved.location);
    setCurrent(saved.current);
    setDaily(saved.daily);
    setHourly(saved.hourly);
    setAirQuality(saved.airQuality ?? null);
    setActiveTab("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasResults = current && location;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Weather Explorer</h1>
          <p className="text-sm text-muted">Search a place to see current conditions, the forecast, and more.</p>
        </div>
        <div className="flex items-center gap-2">
          <UnitToggle unit={unit} onChange={setUnit} />
          <ThemeToggle />
        </div>
      </header>

      <div className="mt-6">
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {loading && !hasResults && (
        <div className="mt-6">
          <HeroSkeleton />
        </div>
      )}

      {hasResults && (
        <div className="mt-6 space-y-4">
          <CurrentWeatherCard location={location} current={current} unit={unit} />

          <div>
            <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
            <div className="mt-4">
              {activeTab === "today" && <TodayTimeline hourly={hourly} unit={unit} />}
              {activeTab === "forecast" && <ForecastGrid forecast={daily} unit={unit} />}
              {activeTab === "air" && <AirQualityCard airQuality={airQuality} />}
              {activeTab === "map" && <MapView lat={location.lat} lon={location.lon} label={location.name} />}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <RecordsSection onView={handleView} unit={unit} />
      </div>

      <Footer />
    </main>
  );
}
