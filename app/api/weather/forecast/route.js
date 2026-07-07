import { NextResponse } from "next/server";
import { geocodeLocation, fetchForecast, WeatherApiError } from "@/lib/weather";

export async function GET(request) {
  const location = request.nextUrl.searchParams.get("location");
  if (!location) {
    return NextResponse.json({ error: "Missing 'location' query parameter." }, { status: 400 });
  }

  try {
    const geo = await geocodeLocation(location);
    const forecast = await fetchForecast(geo.lat, geo.lon);
    return NextResponse.json({ location: geo, forecast });
  } catch (err) {
    const status = err instanceof WeatherApiError ? err.status : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
