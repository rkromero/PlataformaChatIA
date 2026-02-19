import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // En Railway (Linux) podés agregar output: 'standalone' para optimizar
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
