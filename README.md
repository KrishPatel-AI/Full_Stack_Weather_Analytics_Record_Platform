# Weather Explorer — PM Accelerator AI Engineer Intern Assessment

A single Next.js application covering both the Frontend (Tech Assessment #1) and Backend
(Tech Assessment #2) requirements — one codebase, one deploy, built the way production
Next.js products are structured at most companies.

**Built by:** Krish Patel

## Bugs fixed in this round

**1. Indian (and other non-US) postal codes were rejected.**
The geocoding logic hard-coded every all-digit input as a **US** zip code
(`zip=${code},US`). A 6-digit Indian PIN code would get sent to OpenWeatherMap as if it were a
US zip, fail, and the app would report "location not found." Fixed: digit length now picks a
sensible guess (5 digits → US, 6 digits → India) before falling back to a general search, and
you can always be explicit with `"postal code, country code"` (e.g. `380001, IN` or `SW1A 1AA, GB`).

**2. CRUD date-range validation didn't actually validate anything meaningful.**
The old check only confirmed `start ≤ end` and that the range was 5 days or fewer — it never
checked the dates against *today*, so you could "successfully" save a record for January 2020
and it would silently just show today's generic forecast, completely disconnected from the
dates you picked. Fixed two ways:
  - Validation now rejects ranges that are entirely in the past or start too far in the future
    (with a 1-day grace window so time-zone differences, e.g. India at UTC+5:30, don't wrongly
    block a valid "today").
  - Saved records now store a **`rangeForecast`** — the forecast filtered to exactly the dates
    you asked for — and the table shows a real **Temp range** column computed from it, so the
    date range visibly does something.

**3. Map weather layers (Precipitation/Clouds/Wind) weren't rendering.**
The previous version fetched OpenWeatherMap's tile images directly from the browser, which
required exposing the API key to the client via `NEXT_PUBLIC_OPENWEATHER_API_KEY` — an easy
step to miss or misconfigure. Fixed by routing tile requests through the app's own server
(`/api/tiles/[layer]/[z]/[x]/[y]`), which fetches the tile with the server-only key and streams
it back. One less setup step, one less way to misconfigure it, and the key is never exposed to
the browser at all — this is also just better practice.

## What's in the app

The homepage is one simple flow: search a place (with autocomplete-as-you-type suggestions —
handy in general, and especially so if you're unsure how a place will resolve), see its current
conditions front and center, then use four tabs — **Today, 5-Day, Air Quality, Map** — to go
deeper without cluttering the main screen.

## OpenWeatherMap APIs used (researched against the free tier before building)

OpenWeatherMap's free "Weather API access" plan (no credit card, 60 calls/min, 1M calls/month)
covers five of the six products, and this app uses all five:

| API | Where it's used |
|---|---|
| [Current Weather](https://openweathermap.org/current) | Hero card: temperature, feels-like, humidity, pressure, visibility, sunrise/sunset, wind |
| [5-day / 3-hour Forecast](https://openweathermap.org/forecast5) | "Today" tab (next 24h in 3-hour steps), "5-Day" tab, and the date-range CRUD feature |
| [Geocoding API](https://openweathermap.org/api/geocoding-api) | City/zip/landmark/GPS → coordinates, reverse geocoding, and search-as-you-type suggestions |
| [Air Pollution API](https://openweathermap.org/api/air-pollution) | "Air Quality" tab: plain-language AQI (Good → Very Poor) plus pollutant breakdown |
| [Weather Maps 1.0](https://openweathermap.org/api/weathermaps) | "Map" tab: toggleable Precipitation / Clouds / Temperature / Wind overlay tiles, proxied server-side |

**Weather Widgets** (the sixth product) were intentionally **not** used — they're pre-branded
OpenWeatherMap iframes, and embedding one would break the custom, cohesive UI. All the same
data those widgets show is already presented through the app's own themed components instead.

## MNC-level touches added this round

- **Search-as-you-type autocomplete** with debounced suggestions and keyboard navigation
  (arrow keys + Enter), so you pick a confirmed match instead of guessing spelling
- **Celsius / Fahrenheit toggle** in the header, applied consistently everywhere temperature
  is shown
- **Skeleton loading state** for the hero card while a search is in flight, instead of a bare
  spinner
- **Server-proxied map tiles** — no API key ever reaches the browser
- Inline field-level validation (red outline + explanation) in addition to toast notifications

## What "Saved locations" is for, and how to use it

This is the CRUD feature from Tech Assessment #2. It's a small personal log: save a place you
care about together with a date range, and the app stores **the actual forecast for those
specific dates** (not just a generic 5-day window) so you don't have to search again.

- **Save (Create):** type a location + pick a date range → validated against today and the
  5-day forecast horizon, geocoded, fetched, and stored — including a range-specific summary.
- **Wrong/nonexistent location:** rejected before anything is written. The field outlines in
  red with a plain-language explanation, and — since autocomplete is right there — you can just
  pick a suggestion instead of retyping.
- **View:** click the eye icon on any saved row to instantly bring back everything saved for
  it (current conditions, forecast, air quality) in the tabs above — no new API call.
- **Edit / Delete:** change the location or dates (re-validated and re-fetched the same way),
  or remove the row entirely.
- **Export:** JSON, CSV, XML, Markdown, or PDF, any time.

## Project Structure

```
weather-nextjs/
├── app/
│   ├── layout.js              # Root layout, font, theme + toast providers
│   ├── page.js                # Main dashboard: search + hero card + tabs + saved locations
│   ├── globals.css            # Theme variables (light/dark) + Tailwind
│   └── api/
│       ├── weather/current/route.js
│       ├── weather/forecast/route.js       # returns { hourly, daily }
│       ├── weather/air-quality/route.js
│       ├── geocode/suggest/route.js        # autocomplete suggestions
│       ├── tiles/[layer]/[z]/[x]/[y]/route.js  # server-side weather-tile proxy
│       ├── records/route.js                # GET (list) / POST (create)
│       ├── records/[id]/route.js           # GET / PUT / DELETE one record
│       └── export/[format]/route.js        # json | csv | xml | markdown | pdf
├── components/
│   ├── SearchBar.jsx (with autocomplete), CurrentWeatherCard.jsx, TodayTimeline.jsx
│   ├── ForecastGrid.jsx, AirQualityCard.jsx, MapView.jsx, Tabs.jsx, UnitToggle.jsx
│   ├── RecordsSection.jsx, ThemeToggle.jsx, Footer.jsx, WeatherIcon.jsx
├── lib/
│   ├── prisma.js              # Prisma client singleton
│   ├── weather.js             # Geocoding + weather/air-quality fetch + validation logic
│   ├── format.js              # Client-safe temperature unit conversion
│   └── serialize.js
├── prisma/schema.prisma       # WeatherRecord model
└── .env.example
```

## Setup & Run Locally

### 1. Get a free OpenWeatherMap API key
Sign up at https://openweathermap.org/api (the free plan — no credit card). Activation is
usually instant, occasionally takes up to an hour.

### 2. Install and configure
```bash
cd weather-nextjs
npm install
cp .env.example .env
```
Open `.env` and paste in your key — just one, this time:
```
DATABASE_URL="file:./dev.db"
OPENWEATHER_API_KEY=your_actual_key_here
```

### 3. Set up the database
```bash
npx prisma generate
npx prisma db push
```
This creates `prisma/dev.db` — a SQLite file, no separate database server needed.

### 4. Run it
```bash
npm run dev
```
Open http://localhost:3000. Try:
- Typing a partial location and picking a suggestion
- An Indian PIN code (e.g. `380001`) or `"380001, IN"` — confirms the geocoding fix
- Saving a location with a date range 2–3 days out and checking the Temp range column
- Flipping the Map tab to Precipitation/Clouds/Wind
- Switching °C/°F
- Each export link, including PDF

### 5. Build for production (optional, good to demo you can)
```bash
npm run build
npm start
```

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/weather/current?location=` | Current conditions for a location |
| GET | `/api/weather/forecast?location=` | `{ hourly, daily }` — next 24h in 3h steps, and 5-day summary |
| GET | `/api/weather/air-quality?location=` | AQI + pollutant breakdown |
| GET | `/api/geocode/suggest?q=` | Up to 5 autocomplete matches |
| GET | `/api/tiles/:layer/:z/:x/:y` | Proxied weather-map tile image |
| GET | `/api/records` | List all saved locations |
| POST | `/api/records` | Create `{ location, startDate, endDate }` |
| GET | `/api/records/:id` | Get one record |
| PUT | `/api/records/:id` | Update a record |
| DELETE | `/api/records/:id` | Delete a record |
| GET | `/api/export/:format` | Export all records — format: json, csv, xml, markdown, pdf |

