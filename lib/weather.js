const API_KEY = process.env.OPENWEATHER_API_KEY;

const GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct";
const REVERSE_GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/reverse";
const ZIP_GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/zip";
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const AIR_POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

export class WeatherApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function requireApiKey() {
  if (!API_KEY) {
    throw new WeatherApiError("OPENWEATHER_API_KEY is not set on the server. See .env.example.", 500);
  }
}


export async function geocodeLocation(rawQuery) {
  requireApiKey();
  const query = rawQuery.trim();


  if (query.includes(",")) {
    const parts = query.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        const name = await reverseGeocode(lat, lon);
        return { name: name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon };
      }
    }
  }

  
  const explicitZip = query.match(/^([\w-]+),\s*([A-Za-z]{2})$/);
  if (explicitZip) {
    const [, code, country] = explicitZip;
    const hit = await tryZipLookup(code, country.toUpperCase());
    if (hit) return hit;
  }

  
  const digitsOnly = query.replace(/\s/g, "");
  if (/^\d+$/.test(digitsOnly)) {
    const guess = digitsOnly.length === 5 ? "US" : digitsOnly.length === 6 ? "IN" : null;
    if (guess) {
      const hit = await tryZipLookup(digitsOnly, guess);
      if (hit) return hit;
    }
  }


  const res = await fetch(`${GEOCODE_URL}?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`);
  if (res.ok) {
    const results = await res.json();
    if (results.length > 0) {
      const d = results[0];
      const state = d.state ? `, ${d.state}` : "";
      return { name: `${d.name}${state}, ${d.country}`, lat: d.lat, lon: d.lon };
    }
  }

  throw new WeatherApiError(
    `Could not find a location matching "${rawQuery}". Try the city name, or "postal code, country code" (e.g. "380001, IN").`,
    404
  );
}

async function tryZipLookup(code, countryCode) {
  const res = await fetch(`${ZIP_GEOCODE_URL}?zip=${encodeURIComponent(code)},${countryCode}&appid=${API_KEY}`);
  if (!res.ok) return null;
  const d = await res.json();
  return { name: `${d.name} (${code}, ${countryCode})`, lat: d.lat, lon: d.lon };
}

export async function suggestLocations(query) {
  requireApiKey();
  const res = await fetch(`${GEOCODE_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
  if (!res.ok) return [];
  const results = await res.json();
  return results.map((d) => ({
    label: [d.name, d.state, d.country].filter(Boolean).join(", "),
    lat: d.lat,
    lon: d.lon,
  }));
}

export async function reverseGeocode(lat, lon) {
  requireApiKey();
  const res = await fetch(`${REVERSE_GEOCODE_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
  if (!res.ok) return null;
  const results = await res.json();
  if (results.length === 0) return null;
  const d = results[0];
  const state = d.state ? `, ${d.state}` : "";
  return `${d.name}${state}, ${d.country}`;
}

export async function fetchCurrentWeather(lat, lon) {
  requireApiKey();
  const res = await fetch(`${CURRENT_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  if (!res.ok) throw new WeatherApiError("Weather service is unavailable right now.", 502);
  const d = await res.json();
  return {
    tempC: d.main.temp,
    feelsLikeC: d.main.feels_like,
    tempMinC: d.main.temp_min,
    tempMaxC: d.main.temp_max,
    humidity: d.main.humidity,
    pressure: d.main.pressure,
    visibilityMeters: d.visibility,
    cloudsPercent: d.clouds?.all ?? 0,
    condition: d.weather[0].main,
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    windSpeed: d.wind.speed,
    windDeg: d.wind.deg,
    sunrise: d.sys.sunrise, // unix seconds, UTC
    sunset: d.sys.sunset,
    timezoneOffset: d.timezone, // seconds offset from UTC
  };
}


export async function fetchForecast(lat, lon) {
  requireApiKey();
  const res = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  if (!res.ok) throw new WeatherApiError("Weather service is unavailable right now.", 502);
  const d = await res.json();

  const hourly = d.list.slice(0, 8).map((entry) => ({
    time: entry.dt_txt,
    tempC: entry.main.temp,
    condition: entry.weather[0].main,
    icon: entry.weather[0].icon,
    precipitationChance: Math.round((entry.pop ?? 0) * 100),
  }));

  const byDay = new Map();
  for (const entry of d.list) {
    const day = entry.dt_txt.split(" ")[0];
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(entry);
  }

  const daily = [...byDay.entries()].slice(0, 5).map(([day, entries]) => {
    const noon = entries.find((e) => e.dt_txt.includes("12:00:00")) ?? entries[Math.floor(entries.length / 2)];
    return {
      date: day,
      tempC: noon.main.temp,
      tempMinC: Math.min(...entries.map((e) => e.main.temp_min)),
      tempMaxC: Math.max(...entries.map((e) => e.main.temp_max)),
      condition: noon.weather[0].main,
      description: noon.weather[0].description,
      icon: noon.weather[0].icon,
      precipitationChance: Math.round(Math.max(...entries.map((e) => e.pop ?? 0)) * 100),
    };
  });

  return { hourly, daily };
}

export function filterForecastToRange(daily, startDate, endDate) {
  return daily.filter((d) => d.date >= startDate && d.date <= endDate);
}

const AQI_LABELS = {
  1: { label: "Good", color: "green" },
  2: { label: "Fair", color: "lime" },
  3: { label: "Moderate", color: "yellow" },
  4: { label: "Poor", color: "orange" },
  5: { label: "Very Poor", color: "red" },
};

export async function fetchAirQuality(lat, lon) {
  requireApiKey();
  try {
    const res = await fetch(`${AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!res.ok) return null;
    const d = await res.json();
    const entry = d.list?.[0];
    if (!entry) return null;
    return {
      aqi: entry.main.aqi,
      ...AQI_LABELS[entry.main.aqi],
      components: {
        pm2_5: entry.components.pm2_5,
        pm10: entry.components.pm10,
        o3: entry.components.o3,
        no2: entry.components.no2,
        so2: entry.components.so2,
        co: entry.components.co,
      },
    };
  } catch {
    return null;
  }
}


export function validateDateRange(startDate, endDate) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    return "Dates must be in YYYY-MM-DD format.";
  }
  if (Number.isNaN(Date.parse(startDate)) || Number.isNaN(Date.parse(endDate))) {
    return "Dates must be valid calendar dates.";
  }
  if (startDate > endDate) {
    return "Start date must be before or equal to the end date.";
  }

  const rangeDays = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000);
  if (rangeDays > 4) {
    return "Please choose a range of 5 days or fewer — the free forecast API only covers 5 days ahead.";
  }

  
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const sixDaysOut = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);

  if (endDate < yesterday) {
    return "That date range is in the past — pick a range that includes today or later.";
  }
  if (startDate > sixDaysOut) {
    return "That start date is too far out — the free forecast only covers the next 5 days.";
  }
  return null;
}
