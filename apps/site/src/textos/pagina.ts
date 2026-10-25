/** O que toda página pública declara para SEO: o caminho, o título, a descrição e o cartão. */
export type DadosDaPagina = {
  caminho: string;
  /** O `<title>` sem o nome do site (a raiz junta " · Quiz your slop"). */
  titulo: string;
  /** Meta description e Open Graph: uma ou duas frases que valem sozinhas. */
  descricao: string;
  /** O texto grande da imagem de compartilhamento (Open Graph/Twitter). */
  cartao: string;
};
