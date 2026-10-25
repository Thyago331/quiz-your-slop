import { describe, expect, it } from 'vitest';
import { lerEnvio } from '@quiz/jogo';
import { ARQUIVOS, DESAFIOS, LIGACOES, REGIOES, TERRITORIOS } from '@quiz/taverna';
import {
  ESTADO_INICIAL,
  desafiosParaPartir,
  envioDoTutorial,
  podePartir,
  tutorial,
  type AcaoTutorial,
  type EstadoTutorial,
} from './estado';

// O que nunca sai da máquina (spec §8): nomes e ids de Regiões e Territórios, Ligações, caminhos e
// Desafios. Ids de região da Taverna ("cofre-anao") já são nomes, então também não podem ir.
const PROIBIDOS = [
  ...REGIOES.flatMap((r) => [r.id, r.nome, r.resumo]),
  ...TERRITORIOS.flatMap((t) => [t.id, t.nome]),
  ...LIGACOES.flatMap((l) => [l.id, l.descricao]),
  ...Object.keys(ARQUIVOS),
  ...Object.values(DESAFIOS)
    .flat()
    .flatMap((d) => [d.id, d.enunciado, d.explicacao, ...d.evidencias.map((e) => e.caminho)]),
];

const rodar = (acoes: AcaoTutorial[], estado: EstadoTutorial) => acoes.reduce(tutorial, estado);

/** Joga o Tutorial inteiro: acerta tudo e, no Cofre, contesta a isca (Caçador de Slop). */
function jogarTudo(): EstadoTutorial[] {
  let estado = tutorial(ESTADO_INICIAL, { tipo: 'escolherClasse', classe: 'fullstack' });
  const fotos = [estado];
  for (let n = 0; n < 7; n++) {
    const regiaoId = Object.keys(estado.aventura!.mapa.estados).find((id) =>
      podePartir(estado, id),
    );
    if (!regiaoId) break;
    const desafios = desafiosParaPartir(estado, regiaoId, () => 0.3);
    estado = tutorial(estado, { tipo: 'partir', regiaoId, desafios });
    while (estado.expedicao?.fase === 'respondendo') {
      const desafio = desafios[estado.expedicao.atual]!;
      estado = tutorial(estado, { tipo: 'responder', resposta: [...desafio.gabarito] });
      if (desafio.isca) estado = tutorial(estado, { tipo: 'contestar', argumento: 'Mente.' });
      fotos.push(estado);
      estado = tutorial(estado, { tipo: 'avancar' });
    }
    fotos.push(estado);
    estado = rodar([{ tipo: 'voltarAoMapa' }], estado);
  }
  return fotos;
}

describe('o envio do Tutorial não leva conteúdo', () => {
  const fotos = jogarTudo();
  const fim = fotos[fotos.length - 1]!;

  it('a partida de teste é de verdade: revela tudo e vence uma Contestação', () => {
    expect(Object.values(fim.aventura!.mapa.estados)).toEqual(Array(7).fill('revelada'));
    expect(fim.estatisticas.contestacoes_vencidas).toBe(1);
    expect(envioDoTutorial(fim).aventuras).toEqual([
      { id: 'tutorial', progresso: 100, classe: 'fullstack' },
    ]);
  });

  it('em nenhum momento da partida o JSON enviado cita Região, caminho ou Desafio', () => {
    expect(PROIBIDOS.length).toBeGreaterThan(100);
    for (const estado of fotos) {
      const json = JSON.stringify(envioDoTutorial(estado));
      for (const proibido of PROIBIDOS) expect(json, proibido).not.toContain(proibido);
    }
  });

  it('o envio passa pela lista permitida do servidor', () => {
    for (const estado of fotos) expect(lerEnvio(envioDoTutorial(estado)).ok).toBe(true);
  });
});
