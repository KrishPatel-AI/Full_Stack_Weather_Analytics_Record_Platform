import { NextResponse } from "next/server";
import { suggestLocations } from "@/lib/weather";

export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }
  try {
    const suggestions = await suggestLocations(q);
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]); 
  }
}
