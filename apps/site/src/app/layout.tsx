import type { ReactNode } from 'react';
import { connection } from 'next/server';
import '@quiz/ui/estilo.css';
import { configUmami } from '@/analise/umami';
import { Umami } from '@/analise/Umami';
import { IDIOMA, metadadosDoSite } from '@/seo/metadados';

// SITE_URL e o Umami são configuração de execução, lidas a cada requisição, nunca fixadas no build.
export async function generateMetadata() {
  await connection();
  return metadadosDoSite();
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  const umami = configUmami();
  return (
    <html lang={IDIOMA}>
      <body className="pixel">
        {children}
        {umami && <Umami {...umami} />}
      </body>
    </html>
  );
}
