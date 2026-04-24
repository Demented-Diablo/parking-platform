import Navbar from "@/components/layout/Navbar";

// ── Mock data ────────────────────────────────────────────────────────────────

const SAMPLE_MARKERS = [
  { id: 1, label: "Free",         dot: "bg-green-500", top: "22%", left: "28%" },
  { id: 2, label: "Paid",         dot: "bg-blue-500",  top: "50%", left: "62%" },
  { id: 3, label: "Likely Free",  dot: "bg-amber-400", top: "68%", left: "20%" },
  { id: 4, label: "Restricted",   dot: "bg-red-500",   top: "30%", left: "75%" },
];

const LEGEND = [
  { color: "bg-green-500", label: "Free" },
  { color: "bg-blue-500",  label: "Paid" },
  { color: "bg-amber-400", label: "Likely Free" },
  { color: "bg-red-500",   label: "Restricted" },
];

const STEPS = [
  {
    number: 1,
    icon: "🗺️",
    title: "Open the map",
    body: "Launch Park Off and see color-coded parking spots near you across Halifax.",
  },
  {
    number: 2,
    icon: "📍",
    title: "Find nearby parking",
    body: "Browse free, paid, and community-verified spots. Tap a marker for details and directions.",
  },
  {
    number: 3,
    icon: "📷",
    title: "Submit a photo or correction",
    body: "If parking info is missing or wrong, take a photo or flag the spot to help other drivers.",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-indigo-50 to-white px-6 py-28 text-center">
          <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Halifax · Community powered
          </span>

          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Find parking in Halifax{" "}
            <span className="text-indigo-600">faster</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
            Discover free parking, paid parking, street parking, and community
            verified spots.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#map-preview"
              className="rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              View Map Preview
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-gray-300 px-7 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              How it works
            </a>
          </div>
        </section>

        {/* ── Map Preview ────────────────────────────────────────────────── */}
        <section id="map-preview" className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Parking near you
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Halifax downtown · sample data only
            </p>

            {/* Fake map card */}
            <div className="map-grid relative mt-10 h-80 w-full overflow-hidden rounded-2xl border border-gray-200 bg-stone-100 shadow-md">
              {/* Center label */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="rounded bg-white/70 px-2 py-1 text-xs font-medium text-gray-400 backdrop-blur-sm">
                  Downtown Halifax
                </span>
              </div>

              {/* Parking markers */}
              {SAMPLE_MARKERS.map((m) => (
                <div
                  key={m.id}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
                  style={{ top: m.top, left: m.left }}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-full border-2 border-white shadow ${m.dot}`}
                  />
                  <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-gray-600">
              {LEGEND.map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-gray-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              How it works
            </h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.number}
                  className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl">
                    {s.icon}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {s.number}
                    </span>
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-gray-500">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contribution ───────────────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-indigo-100 bg-indigo-50 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl">
              📷
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Help keep parking data accurate
            </h2>

            <p className="mt-4 leading-relaxed text-gray-600">
              Soon you will be able to take a photo of any parking sign directly
              in the app. Park Off will ask for your{" "}
              <strong>camera and location</strong>, then use{" "}
              <strong>Google Vision OCR</strong> to automatically read the sign
              and extract parking rules, with no manual typing required.
            </p>

            <p className="mt-3 leading-relaxed text-gray-600">
              All submissions are reviewed by the community before going live,
              so the data stays trustworthy.
            </p>

            <p className="mt-8 text-sm font-medium text-indigo-500">
              Contributions coming soon. Backend not yet connected.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        Park Off · Halifax parking, community powered
      </footer>
    </div>
  );
}
