import type { PorIdioma } from '@quiz/i18n';

/** O que uma página pública declara para SEO em cada idioma: o título, a descrição e o cartão. */
export type TextosDaPagina = {
  /** O `<title>` sem o nome do site (a raiz junta " · Quiz your slop"). */
  titulo: string;
  /** Meta description e Open Graph: uma ou duas frases que valem sozinhas. */
  descricao: string;
  /** O texto grande da imagem de compartilhamento (Open Graph/Twitter). */
  cartao: string;
};

/** O caminho é o mesmo em todo idioma, depois do prefixo (`/en/faq`, `/es/faq`). */
export type DadosDaPagina = { caminho: string; textos: PorIdioma<TextosDaPagina> };
