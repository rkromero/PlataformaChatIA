export function Logos() {
    const brands = [
        { name: 'NexGen', logo: 'N' },
        { name: 'Apex', logo: 'A' },
        { name: 'Velocity', logo: 'V' },
        { name: 'CloudScale', logo: 'C' },
        { name: 'DataFlow', logo: 'D' },
    ];

    return (
        <div className="bg-gray-950 py-12 border-y border-white/5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Empresas que ya automatizan su atención
                </p>
                <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-5 lg:grid-cols-5">
                    {brands.map((brand) => (
                        <div
                            key={brand.name}
                            className="col-span-1 flex items-center justify-center grayscale transition-all hover:grayscale-0"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-xl font-bold text-gray-400">
                                {brand.logo}
                            </div>
                            <span className="ml-3 text-lg font-bold text-gray-500">{brand.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
