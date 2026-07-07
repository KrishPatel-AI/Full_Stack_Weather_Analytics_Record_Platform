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

async function findRecordOr404(id) {
  const record = await prisma.weatherRecord.findUnique({ where: { id } });
  return record;
}

export async function GET(_request, { params }) {
  const id = Number(params.id);
  const record = await findRecordOr404(id);
  if (!record) return NextResponse.json({ error: `No record with id ${id}.` }, { status: 404 });
  return NextResponse.json(serializeRecord(record));
}

export async function PUT(request, { params }) {
  const id = Number(params.id);
  const existing = await findRecordOr404(id);
  if (!existing) return NextResponse.json({ error: `No record with id ${id}.` }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const location = (body.location ?? existing.locationQuery).trim();
  const startDate = body.startDate ?? existing.startDate;
  const endDate = body.endDate ?? existing.endDate;

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

    const updated = await prisma.weatherRecord.update({
      where: { id },
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

    return NextResponse.json(serializeRecord(updated));
  } catch (err) {
    const status = err instanceof WeatherApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(_request, { params }) {
  const id = Number(params.id);
  const existing = await findRecordOr404(id);
  if (!existing) return NextResponse.json({ error: `No record with id ${id}.` }, { status: 404 });

  await prisma.weatherRecord.delete({ where: { id } });
  return NextResponse.json({ message: `Record ${id} deleted.` });
}
