export const runtime = "nodejs";

const API_KEY = process.env.OPENWEATHER_API_KEY;
const ALLOWED_LAYERS = new Set(["precipitation_new", "clouds_new", "temp_new", "wind_new", "pressure_new"]);

export async function GET(_request, { params }) {
  const { layer, z, x, y } = params;

  if (!ALLOWED_LAYERS.has(layer)) {
    return new Response("Unknown weather layer.", { status: 400 });
  }
  if (!API_KEY) {
    return new Response("Server is missing OPENWEATHER_API_KEY.", { status: 500 });
  }

  const upstream = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${API_KEY}`;
  const res = await fetch(upstream);

  if (!res.ok) {
    return new Response("Tile fetch failed.", { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=600, immutable",
    },
  });
}
