import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sin conexión | ChatPlatform',
  description: 'Vista offline de ChatPlatform.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md text-center">
        <h1 className="text-xl font-semibold text-gray-100">Sin conexión</h1>
        <p className="mt-2 text-sm text-gray-400">
          No hay internet en este momento. Reintentá cuando vuelva la conexión.
        </p>
      </div>
    </main>
  );
}
