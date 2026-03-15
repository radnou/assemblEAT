import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[var(--color-surface)]">
      <span className="text-6xl mb-6">🥗</span>
      <h1 className="text-4xl font-bold mb-2">Page introuvable</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Ce repas n&apos;est pas au menu. Retournez à la cuisine !
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-[var(--color-cta)] text-white font-semibold hover:opacity-90 transition"
        >
          Accueil
        </Link>
        <Link
          href="/app"
          className="px-6 py-3 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition"
        >
          Mon planning
        </Link>
      </div>
    </div>
  );
}
