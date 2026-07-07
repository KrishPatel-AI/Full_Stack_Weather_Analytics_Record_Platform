import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  geocodeLocation,
  fetchCurrentWeather,
  fetchForecast,
  fetchAirQuality,
  filterForecastToRange,
  validateDateRange,
  WeatherApiError,
} from "@/lib/weather";
import { serializeRecord } from "@/lib/serialize";

export async function GET() {
  const records = await prisma.weatherRecord.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(records.map(serializeRecord));
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const location = (body.location ?? "").trim();
  const { startDate, endDate } = body;

  if (!location) {
    return NextResponse.json({ error: "location is required." }, { status: 400 });
  }

  const dateError = validateDateRange(startDate, endDate);
  if (dateError) {
    return NextResponse.json({ error: dateError }, { status: 400 });
  }

  try {
    const geo = await geocodeLocation(location);
    const [current, forecast, airQuality] = await Promise.all([
      fetchCurrentWeather(geo.lat, geo.lon),
      fetchForecast(geo.lat, geo.lon),
      fetchAirQuality(geo.lat, geo.lon),
    ]);
    const rangeForecast = filterForecastToRange(forecast.daily, startDate, endDate);

    const record = await prisma.weatherRecord.create({
      data: {
        locationQuery: location,
        resolvedName: geo.name,
        latitude: geo.lat,
        longitude: geo.lon,
        startDate,
        endDate,
        weatherData: JSON.stringify({ current, forecast, airQuality, rangeForecast }),
      },
    });

    return NextResponse.json(serializeRecord(record), { status: 201 });
  } catch (err) {
    const status = err instanceof WeatherApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
