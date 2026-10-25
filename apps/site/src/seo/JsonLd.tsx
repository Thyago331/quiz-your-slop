import { serializarJsonLd, type JsonLd as Dados } from './jsonld';

/** Um `<script type="application/ld+json">` no HTML renderizado no servidor. */
export function JsonLd({ dados }: { dados: Dados }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializarJsonLd(dados) }}
    />
  );
}
