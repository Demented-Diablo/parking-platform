import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-indigo-600"
        >
          Park Off
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 sm:flex">
          <Link href="/map" className="transition-colors hover:text-indigo-600">
            Map
          </Link>
          <Link
            href="/submit"
            className="transition-colors hover:text-indigo-600"
          >
            Submit Spot
          </Link>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-indigo-600"
          >
            How It Works
          </a>
        </nav>
      </div>
    </header>
  );
}
