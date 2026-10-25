import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const comNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // O site vai para a VPS como servidor standalone dentro do Docker (spec §11).
  output: 'standalone',
  // Monorepo: rastreia a partir da raiz para os pacotes do workspace entrarem na imagem.
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  transpilePackages: ['@quiz/i18n', '@quiz/jogo', '@quiz/taverna', '@quiz/ui'],
  reactStrictMode: true,
};

export default comNextIntl(nextConfig);
