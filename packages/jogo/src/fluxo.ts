// Traçar o fluxo na Névoa (spec §5): um passo que cai numa região ainda não revelada não diz o que
// faz, só por qual tipo de Ligação o caminho sai — "??? (Consulta → região desconhecida)".
import type { OpcaoTracarFluxo, TipoLigacao } from './contrato.ts';
import type { MapaAventura } from './mapa.ts';

/** O que a tela pode mostrar de um passo; o texto da Névoa (e a tradução) ficam com a interface. */
export type PassoNaTela =
  | { id: string; naNevoa: false; texto: string }
  | { id: string; naNevoa: true; ligacao: TipoLigacao | null };

/**
 * Decide se o passo aparece com nome: só em região já revelada (ou desatualizada, que já foi) e na
 * região da própria Expedição (`regiaoAtual`, desbloqueada enquanto se joga nela). Desbloqueada não
 * basta — "até a revelação" (spec §5). regiao_id null (região que o Mestre ainda não detalhou) e
 * região fora do mapa contam como Névoa; ao ser revelada, o mesmo passo ganha nome.
 */
export function passoDoFluxo(
  opcao: OpcaoTracarFluxo,
  estados: MapaAventura['estados'],
  regiaoAtual: string,
): PassoNaTela {
  const estado = opcao.regiao_id === null ? undefined : estados[opcao.regiao_id];
  const conhecida =
    estado === 'revelada' ||
    estado === 'desatualizada' ||
    (estado !== undefined && opcao.regiao_id === regiaoAtual);
  if (!conhecida) return { id: opcao.id, naNevoa: true, ligacao: opcao.ligacao ?? null };
  return { id: opcao.id, naNevoa: false, texto: opcao.texto };
}
