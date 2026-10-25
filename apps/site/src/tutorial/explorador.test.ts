import { describe, expect, it } from 'vitest';
import { arvoreDoExplorador, caminhosVisiveis, iniciarMapa } from '@quiz/jogo';
import { ARQUIVOS, ENTRADAS, REGIOES, TERRITORIOS } from '@quiz/taverna';
import { linguagemDe, realcar } from '@quiz/ui';
import { ESTRUTURA } from './estado';

describe('explorador da Taverna', () => {
  it('todo arquivo da Taverna tem linguagem e o destaque não perde nem uma linha', () => {
    for (const [caminho, conteudo] of Object.entries(ARQUIVOS)) {
      const linguagem = linguagemDe(caminho);
      expect(linguagem, caminho).not.toBe('texto');
      const linhas = realcar(conteudo, linguagem).map((l) => l.map((t) => t.texto).join(''));
      expect(linhas.join('\n') + '\n', caminho).toBe(conteudo);
    }
  });

  it('no início da Aventura só os arquivos da entrada podem ser abertos, e nada fica de fora', () => {
    const mapa = iniciarMapa(ESTRUTURA, ENTRADAS.backend);
    const grupos = arvoreDoExplorador({
      territorios: TERRITORIOS,
      regioes: REGIOES,
      estados: mapa.estados,
      todos: Object.keys(ARQUIVOS),
    });
    // Todo arquivo da Taverna é de uma Região: não há grupo "Outros arquivos".
    expect(grupos.map((g) => g.nome)).toEqual(['Salão', 'Balcão', 'Adega', 'Cozinha']);
    const api = REGIOES.find((r) => r.id === ENTRADAS.backend)!;
    expect([...caminhosVisiveis(grupos)].sort()).toEqual([...api.arquivos].sort());
  });
});
