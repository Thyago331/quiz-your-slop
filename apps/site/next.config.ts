import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // O site vai para a VPS como servidor standalone dentro do Docker (spec §11).
  output: 'standalone',
  // Monorepo: rastreia a partir da raiz para os pacotes do workspace entrarem na imagem.
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  transpilePackages: ['@quiz/jogo', '@quiz/taverna', '@quiz/ui'],
  reactStrictMode: true,
};

export default nextConfig;
