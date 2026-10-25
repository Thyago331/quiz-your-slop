import { iniciarExpedicao, responderDesafio, type Desafio } from '@quiz/jogo';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Idioma } from '@quiz/i18n';
import { Batalha, ResumoExpedicao } from './Batalha.tsx';
import { classesNaTela } from './classes.ts';
import { EscolhaDeClasse } from './EscolhaDeClasse.tsx';
import { IdiomaDaInterface } from './idioma.tsx';
import { LegendaMapa } from './MapaMundi.tsx';
import { OrdemDoFluxo } from './OrdemDoFluxo.tsx';
import { SeletorDeIdioma } from './SeletorDeIdioma.tsx';

const em = (idioma: Idioma, filho: ReactNode) =>
  render(<IdiomaDaInterface idioma={idioma}>{filho}</IdiomaDaInterface>);

// O Desafio fica em português: o conteúdo dos Desafios só se traduz no #30.
const desafio: Desafio = {
  id: 'd1',
  formato: 'apontar',
  enunciado: 'Onde o pedido é cobrado?',
  dificuldade: 1,
  opcoes: [
    { id: 'a', caminho: 'api/src/orders/service.ts', simbolo: 'charge' },
    { id: 'b', caminho: 'web/src/pages/Checkout.tsx' },
  ],
  gabarito: ['a'],
  explicacao: 'O serviço chama `charge`.',
  evidencias: [
    { caminho: 'api/src/orders/service.ts', linha_inicio: 1, linha_fim: 1, trecho: 'x' },
  ],
};

const batalha = (expedicao = iniciarExpedicao('api', [desafio])) => (
  <Batalha
    expedicao={expedicao}
    estados={{}}
    nomeRegiao="Orders API"
    heroi="cavaleiro"
    onResponder={vi.fn()}
    onAvancar={vi.fn()}
  />
);

describe('a interface em inglês', () => {
  it('Batalha: Guardião, vida, formato e contador viram inglês; o Desafio segue como veio', () => {
    em('en', batalha());
    expect(screen.getByText('GUARDIAN · ORDERS API')).toBeTruthy();
    expect(screen.getByRole('meter', { name: "Guardian's HP" })).toBeTruthy();
    expect(screen.getByText(/POINT TO THE CODE · CHALLENGE 1\/1 · DIFFICULTY/)).toBeTruthy();
    expect(screen.getByText('(4 hits defeat it)')).toBeTruthy();
    expect(screen.getByText('Onde o pedido é cobrado?')).toBeTruthy();
  });

  it('depois da resposta: o veredito e o menu em inglês', () => {
    em('en', batalha(responderDesafio(iniciarExpedicao('api', [desafio]), ['a'])));
    expect(screen.getByRole('status').textContent).toBe('HIT! The Guardian took damage.');
    expect(screen.getByRole('menuitem', { name: 'End of battle' })).toBeTruthy();
  });

  it('Classes e legenda do mapa', () => {
    em(
      'en',
      <>
        <EscolhaDeClasse classes={classesNaTela('en')} onEscolher={vi.fn()} />
        <LegendaMapa />
      </>,
    );
    expect(screen.getByText('CHOOSE YOUR CLASS')).toBeTruthy();
    expect(screen.getByText('Backend Knight')).toBeTruthy();
    expect(screen.getByText('☁ Fog')).toBeTruthy();
  });
});

describe('a interface em espanhol', () => {
  it('ResumoExpedicao: VICTORIA, aciertos e a Niebla', () => {
    em(
      'es',
      <ResumoExpedicao
        resultado={{
          regiaoId: 'api',
          venceu: true,
          acertos: 4,
          respondidos: 5,
          xp: 80,
          contestacoesVencidas: 1,
          arquivosCitados: ['api/src/server.ts'],
        }}
        nomeRegiao="API de Pedidos"
        descobertas={['Fogón']}
        novoTitulo="Lector de Diff"
        onVoltar={vi.fn()}
      />,
    );
    expect(screen.getByText('¡VICTORIA!')).toBeTruthy();
    expect(screen.getByText('El Guardián cayó. API de Pedidos quedó revelada ★')).toBeTruthy();
    expect(screen.getByText(/Aciertos: 4\/5/)).toBeTruthy();
    expect(screen.getByText(/1 Impugnación ganada \(\+50 XP de bono\)/)).toBeTruthy();
    expect(screen.getByText('¡La Niebla retrocede! Descubiertas:')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Volver al mapa' })).toBeTruthy();
  });

  it('OrdemDoFluxo: o passo a escolher e os botões', () => {
    em('es', <OrdemDoFluxo passos={[{ id: 'a', rotulo: 'uno' }]} onConfirmar={vi.fn()} />);
    expect(screen.getByText('Elige el paso 1:')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: '↺ Reiniciar el orden' })).toBeTruthy();
  });
});

describe('SeletorDeIdioma', () => {
  it('marca o idioma atual e escolhe outro', async () => {
    const onEscolher = vi.fn();
    em('es', <SeletorDeIdioma atual="es" onEscolher={onEscolher} />);
    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ES' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'EN' }).getAttribute('lang')).toBe('en');
    await userEvent.setup().click(screen.getByRole('button', { name: 'PT' }));
    expect(onEscolher).toHaveBeenCalledWith('pt');
  });

  it('com link, quem usa desenha cada opção', () => {
    em(
      'pt',
      <SeletorDeIdioma
        atual="pt"
        link={({ idioma, conteudo, props }) => (
          <a href={`/${idioma}`} {...props}>
            {conteudo}
          </a>
        )}
      />,
    );
    expect(screen.getByRole('link', { name: 'EN' }).getAttribute('href')).toBe('/en');
  });
});
