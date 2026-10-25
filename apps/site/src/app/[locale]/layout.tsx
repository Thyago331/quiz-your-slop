import type { ReactNode } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ETIQUETA } from '@quiz/i18n';
import { IdiomaDaInterface } from '@quiz/ui';
import '@quiz/ui/estilo.css';
import { configUmami } from '@/analise/umami';
import { Umami } from '@/analise/Umami';
import { routing } from '@/i18n/routing';
import { metadadosDoSite } from '@/seo/metadados';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

// SITE_URL e o Umami são configuração de execução, lidas a cada requisição, nunca fixadas no build.
export async function generateMetadata() {
  await connection();
  return metadadosDoSite();
}

export default async function LayoutDoIdioma({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const umami = configUmami();
  return (
    <html lang={ETIQUETA[locale]}>
      <body className="pixel">
        {/* Os componentes do site usam o Link e o caminho do next-intl; os de @quiz/ui, o idioma. */}
        <NextIntlClientProvider messages={null}>
          <IdiomaDaInterface idioma={locale}>{children}</IdiomaDaInterface>
        </NextIntlClientProvider>
        {umami && <Umami {...umami} />}
      </body>
    </html>
  );
}
