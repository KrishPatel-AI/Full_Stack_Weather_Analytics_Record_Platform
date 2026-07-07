"use client";

import { useEffect, useRef, useState } from "react";
import { Search, LocateFixed, Loader2 } from "lucide-react";

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSuggestions(data);
        setHighlighted(-1);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function runSearch(query) {
    setShowSuggestions(false);
    if (query.trim()) onSearch(query.trim());
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (highlighted >= 0 && suggestions[highlighted]) {
      selectSuggestion(suggestions[highlighted]);
    } else {
      runSearch(value);
    }
  }

  function selectSuggestion(s) {
    setValue(s.label);
    setSuggestions([]);
    setShowSuggestions(false);
    runSearch(s.label);
  }

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      onSearch(null, "Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        setValue(coords);
        runSearch(coords);
        setLocating(false);
      },
      () => {
        onSearch(null, "Location permission denied. Please enter a location manually.");
        setLocating(false);
      }
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="City, postal code, landmark, or coordinates"
            className="w-full rounded border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Location"
            autoComplete="off"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-border bg-surface shadow-lg">
              {suggestions.map((s, i) => (
                <li key={`${s.lat}-${s.lon}`}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      highlighted === i ? "bg-accent text-accent-ink" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Search"}
          </button>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 rounded border border-border px-3 py-2.5 text-sm text-ink transition-colors hover:border-ink/30 disabled:opacity-50"
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} strokeWidth={1.5} />}
            <span className="hidden sm:inline">Current location</span>
          </button>
        </div>
      </form>
    </div>
  );
}
