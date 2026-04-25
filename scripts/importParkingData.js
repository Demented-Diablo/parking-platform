// Run with: node --env-file=.env scripts/importParkingData.js

import { createClient } from "@supabase/supabase-js";

// ── URLs ──────────────────────────────────────────────────────────────────────

const ACCESSIBLE_PARKING_URL =
  "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/Accessible_Parking_Spots/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson";

const PAY_STATIONS_URL =
  "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/Parking_Pay_Stations/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson";

// ── Supabase client ───────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY
);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Parses durations like "HR2" -> 120 minutes, "HR1" -> 60 minutes
function parseDurationMinutes(duration) {
  if (!duration) return null;
  const match = duration.match(/^HR(\d+)$/i);
  if (match) return parseInt(match[1], 10) * 60;
  return null;
}

// ── Transform functions ───────────────────────────────────────────────────────

function transformAccessible(feature) {
  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    latitude,
    longitude,
    location: `POINT(${longitude} ${latitude})`,
    street_name: p.STREET_NAME ?? null,
    from_street: p.FROM_STR ?? null,
    to_street: p.TO_STR ?? null,
    parking_type: "accessible",
    time_limit_minutes: parseDurationMinutes(p.DURATION),
    cost_per_hour: 0,
    source_type: "hrm_arcgis",
    confidence_score: 1.0,
    notes: p.COMMENTS ?? null,
    schedule: null,
    is_active: p.STATUS === "INS",
    external_id: p.ACCPRKID ?? String(p.OBJECTID),
    raw_data: p,
  };
}

function transformPaid(feature) {
  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    latitude,
    longitude,
    location: `POINT(${longitude} ${latitude})`,
    street_name: p.LOCATION ?? null,
    from_street: null,
    to_street: null,
    parking_type: "paid",
    time_limit_minutes: null,
    cost_per_hour: null,
    source_type: "hrm_arcgis",
    confidence_score: 1.0,
    notes: null,
    schedule: null,
    is_active: p.ASSETSTAT === "INS",
    external_id: p.PRKPAYID ?? String(p.OBJECTID),
    raw_data: p,
  };
}

// ── Core function ─────────────────────────────────────────────────────────────

async function fetchAndImport(url, transformFn) {
  // 1. Fetch GeoJSON
  console.log(`Fetching: ${url}\n`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const features = data.features;
  console.log(`Fetched:             ${features.length} features`);

  // 2. Transform features into table rows
  const rows = features.map(transformFn);
  console.log(`Transformed:         ${rows.length} rows`);

  // 3. Upsert — updates the row if (source_type, external_id) already exists
  const { count, error } = await supabase
    .from("parking_spots")
    .upsert(rows, { onConflict: "source_type,external_id", count: "exact" });

  // 4. Log results
  console.log(`Inserted/updated:    ${count ?? "unknown"}`);

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await fetchAndImport(PAY_STATIONS_URL, transformPaid);
  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
