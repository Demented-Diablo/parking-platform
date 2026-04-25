"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const HALIFAX_CENTER: [number, number] = [-63.5788, 44.6476];
const ZOOM = 14;

const TYPE_COLOR: Record<string, string> = {
  free:       "#16a34a",  // green
  paid:       "#2563eb",  // blue (dark)
  permit:     "#d97706",  // amber
  accessible: "#0ea5e9",  // sky blue
  unknown:    "#6b7280",  // gray
};

const TYPE_LABEL: Record<string, string> = {
  free:       "Free",
  paid:       "Paid",
  permit:     "Permit only",
  accessible: "Accessible",
  unknown:    "Unknown",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Spot = {
  id: string;
  latitude: number;
  longitude: number;
  parking_type: string;
  street_name: string | null;
  time_limit_minutes: number | null;
  cost_per_hour: number | null;
};

// ─── Sample data (shown when Supabase table is empty) ────────────────────────

const SAMPLE_SPOTS: Spot[] = [
  { id: "s1", latitude: 44.6488, longitude: -63.5752, parking_type: "free",       street_name: "Spring Garden Rd", time_limit_minutes: 120,  cost_per_hour: null },
  { id: "s2", latitude: 44.6468, longitude: -63.5729, parking_type: "paid",       street_name: "Barrington St",    time_limit_minutes: null, cost_per_hour: 2.50 },
  { id: "s3", latitude: 44.6502, longitude: -63.5771, parking_type: "permit",     street_name: "Robie St",         time_limit_minutes: null, cost_per_hour: null },
  { id: "s4", latitude: 44.6479, longitude: -63.5810, parking_type: "free",       street_name: "Queen St",         time_limit_minutes: 60,   cost_per_hour: null },
  { id: "s5", latitude: 44.6455, longitude: -63.5760, parking_type: "paid",       street_name: "Granville St",     time_limit_minutes: null, cost_per_hour: 3.00 },
  { id: "s6", latitude: 44.6510, longitude: -63.5740, parking_type: "accessible", street_name: "Brunswick St",     time_limit_minutes: null, cost_per_hour: null },
  { id: "s7", latitude: 44.6440, longitude: -63.5790, parking_type: "unknown",    street_name: "Lower Water St",   time_limit_minutes: null, cost_per_hour: null },
  { id: "s8", latitude: 44.6495, longitude: -63.5800, parking_type: "paid",       street_name: "Hollis St",        time_limit_minutes: null, cost_per_hour: 2.00 },
  { id: "s9", latitude: 44.6520, longitude: -63.5760, parking_type: "free",       street_name: "University Ave",   time_limit_minutes: 90,   cost_per_hour: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Teardrop SVG pin — the tip sits at the exact coordinate (anchor: "bottom")
function createPinElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "cursor:pointer;width:26px;height:34px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))";
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 34" width="26" height="34">
      <path
        d="M13 0C5.82 0 0 5.82 0 13c0 9.1 13 21 13 21S26 22.1 26 13C26 5.82 20.18 0 13 0z"
        fill="${color}"
      />
      <circle cx="13" cy="13" r="5.5" fill="white" />
    </svg>
  `;
  return el;
}

function formatTimeLimit(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""} limit` : `${m}m limit`;
}

function buildPopupHTML(spot: Spot): string {
  const color = TYPE_COLOR[spot.parking_type] ?? TYPE_COLOR.unknown;
  const label = TYPE_LABEL[spot.parking_type] ?? "Parking";

  const street = spot.street_name
    ? `<p style="margin:5px 0 0;font-size:13px;color:#374151">${spot.street_name}</p>`
    : "";

  const details: string[] = [];
  if (spot.time_limit_minutes) details.push(formatTimeLimit(spot.time_limit_minutes));
  if (spot.cost_per_hour)      details.push(`$${spot.cost_per_hour.toFixed(2)}/hr`);

  const detailLine = details.length
    ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280">${details.join(" · ")}</p>`
    : "";

  // destination pre-filled; Google Maps uses the user's live location as origin
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;padding:4px 2px;min-width:180px">
      <div style="display:flex;align-items:center;gap:7px">
        <span style="
          display:inline-block;width:11px;height:11px;border-radius:50%;
          background:${color};flex-shrink:0;
          border:2px solid #fff;box-shadow:0 0 0 1.5px ${color}
        "></span>
        <strong style="font-size:14px;color:#111827">${label}</strong>
      </div>
      ${street}
      ${detailLine}
      <a
        href="${mapsUrl}"
        target="_blank"
        rel="noopener noreferrer"
        style="
          display:block;margin-top:12px;padding:8px 0;
          background:#4f46e5;color:#fff;
          text-align:center;border-radius:999px;
          font-size:12px;font-weight:600;text-decoration:none;
        "
      >
        Open in Google Maps ↗
      </a>
    </div>
  `;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParkingMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const popupRef     = useRef<mapboxgl.Popup | null>(null);
  const markersRef   = useRef<mapboxgl.Marker[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);

  // Fetch spots from Supabase; fall back to sample data if table is empty
  useEffect(() => {
    supabase
      .from("parking_spots")
      .select("id, latitude, longitude, parking_type, street_name, time_limit_minutes, cost_per_hour")
      .eq("is_active", true)
      .then(({ data }) => {
        setSpots(data && data.length > 0 ? (data as Spot[]) : SAMPLE_SPOTS);
      });
  }, []);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: HALIFAX_CENTER,
      zoom: ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Live location button — tapping centres the map on the user and shows their dot
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    );

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Drop / refresh pin markers whenever spots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || spots.length === 0) return;

    // Remove old pins
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    popupRef.current?.remove();

    spots.forEach((spot) => {
      const el = createPinElement(TYPE_COLOR[spot.parking_type] ?? TYPE_COLOR.unknown);

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map);

      el.addEventListener("click", () => {
        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          offset: 38,
          closeButton: true,
          maxWidth: "280px",
        })
          .setLngLat([spot.longitude, spot.latitude])
          .setHTML(buildPopupHTML(spot))
          .addTo(map);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [spots]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-96 w-full overflow-hidden rounded-2xl border border-gray-200 shadow-md"
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm">
        {Object.entries(TYPE_LABEL).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-white"
              style={{
                background: TYPE_COLOR[type],
                boxShadow: `0 0 0 1.5px ${TYPE_COLOR[type]}`,
              }}
            />
            <span className="text-xs text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
