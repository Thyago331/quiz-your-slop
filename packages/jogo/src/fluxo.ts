// Traçar o fluxo na Névoa (spec §5): um passo que cai numa região ainda na Névoa não diz o que
// faz, só por qual tipo de Ligação o caminho sai — "??? (Consulta → região desconhecida)".
import type { OpcaoTracarFluxo, TipoLigacao } from './contrato.ts';
import type { MapaAventura } from './mapa.ts';

/** O que a tela pode mostrar de um passo; o texto da Névoa (e a tradução) ficam com a interface. */
export type PassoNaTela =
  | { id: string; naNevoa: false; texto: string }
  | { id: string; naNevoa: true; ligacao: TipoLigacao | null };

/**
 * Decide se o passo aparece com nome. regiao_id null (região que o Mestre ainda não detalhou) e
 * região fora do mapa contam como Névoa; ao sair dela, o mesmo passo ganha nome.
 */
export function passoDoFluxo(
  opcao: OpcaoTracarFluxo,
  estados: MapaAventura['estados'],
): PassoNaTela {
  const estado = opcao.regiao_id === null ? undefined : estados[opcao.regiao_id];
  if (estado === undefined || estado === 'nevoa') {
    return { id: opcao.id, naNevoa: true, ligacao: opcao.ligacao ?? null };
  }
  return { id: opcao.id, naNevoa: false, texto: opcao.texto };
}
