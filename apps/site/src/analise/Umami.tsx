import Script from 'next/script';

/**
 * O script do Umami (sem cookie). A busca e o hash da URL ficam de fora: o `?de=` do login e
 * qualquer outro parâmetro nunca chegam às estatísticas.
 */
export function Umami({ scriptUrl, websiteId }: { scriptUrl: string; websiteId: string }) {
  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      data-exclude-search="true"
      data-exclude-hash="true"
      strategy="afterInteractive"
    />
  );
}
