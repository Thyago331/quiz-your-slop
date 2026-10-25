import { useState } from 'react';
import { arvoreDoExplorador, iniciarExpedicao, responderDesafio, type Desafio } from '@quiz/jogo';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Batalha } from './Batalha.tsx';
import { ExploradorDeCodigo, PalcoComCodigo, type ArquivoAberto } from './Explorador.tsx';

const SEGREDO = 'export const SEGREDO_DO_COFRE = 42;';
const ARQUIVOS: Record<string, string> = {
  'web/src/pages/Menu.tsx':
    "import { useCart } from '../cart/useCart';\nexport function Menu() {}\n",
  'web/index.html': '<!doctype html>\n',
  'api/src/server.ts':
    "import { router } from './http/router';\n\nrouter.get('/items', listItemsHandler);\nrouter.post('/orders', createOrderHandler);\nrouter.listen();\n",
  'api/src/payments/dwarfVault.ts': `${SEGREDO}\n`,
};
const territorios = [
  { id: 'salao', nome: 'Salão' },
  { id: 'balcao', nome: 'Balcão' },
];
const regioes = [
  {
    id: 'cardapio',
    territorio_id: 'salao',
    arquivos: ['web/src/pages/Menu.tsx', 'web/index.html'],
  },
  { id: 'api', territorio_id: 'balcao', arquivos: ['api/src/server.ts'] },
  { id: 'cofre', territorio_id: 'balcao', arquivos: ['api/src/payments/dwarfVault.ts'] },
];
const estados = { cardapio: 'revelada', api: 'desbloqueada', cofre: 'nevoa' } as const;
const grupos = arvoreDoExplorador({ territorios, regioes, estados });
const ler = (caminho: string) => ARQUIVOS[caminho];

function Controlado({ inicial = null }: { inicial?: ArquivoAberto | null }) {
  const [aberto, setAberto] = useState<ArquivoAberto | null>(inicial);
  return (
    <ExploradorDeCodigo
      grupos={grupos}
      lerArquivo={ler}
      aberto={aberto}
      onAbrir={(caminho) => setAberto({ caminho })}
    />
  );
}

describe('ExploradorDeCodigo', () => {
  it('agrupa a árvore por Território e pastas', () => {
    render(<Controlado />);
    const arvore = screen.getByRole('navigation', { name: 'Arquivos do Projeto' });
    const titulos = within(arvore)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titulos).toEqual(['SALÃO', 'BALCÃO']);
    expect(arvore.textContent).toMatch(/SALÃOweb\/src\/pages\/Menu\.tsxindex\.html/);
    expect(arvore.textContent).toMatch(/BALCÃOapi\/src\/xxxxxxxx\/xxxxxxxxxx\.xxserver\.ts/);
    expect(
      within(arvore)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Menu.tsx', 'index.html', 'server.ts']);
  });

  it('abre um arquivo com números de linha e destaque de sintaxe', async () => {
    render(<Controlado />);
    expect(screen.getByText(/Escolha um arquivo/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'server.ts' }));
    const codigo = screen.getByLabelText('Código de api/src/server.ts');
    const linhas = codigo.querySelectorAll('.codigo-linha');
    expect(linhas).toHaveLength(5);
    expect(linhas[2]?.textContent).toContain("3router.get('/items', listItemsHandler);");
    expect(within(codigo).getByText('import').classList.contains('tok-palavra')).toBe(true);
    expect(within(codigo).getByText("'/items'").classList.contains('tok-texto')).toBe(true);
    expect(screen.getByRole('button', { name: 'server.ts' }).getAttribute('aria-current')).toBe(
      'true',
    );
  });

  it('arquivos na Névoa: borrados, sem botão, sem foco e sem conteúdo nem nome no DOM', async () => {
    const { container } = render(<Controlado />);
    const nevoa = screen.getAllByRole('img', { name: 'Arquivo na Névoa' });
    expect(nevoa).toHaveLength(1);
    expect(nevoa[0]?.classList.contains('explorador-nevoa')).toBe(true);
    expect(nevoa[0]!.closest('button')).toBeNull();
    expect(nevoa[0]?.hasAttribute('tabindex')).toBe(false);
    expect(
      screen.getByRole('img', { name: 'Pasta na Névoa' }).classList.contains('explorador-nevoa'),
    ).toBe(true);
    expect(container.innerHTML).not.toContain('dwarfVault');
    expect(container.innerHTML).not.toContain('payments');
    expect(container.innerHTML).not.toContain('SEGREDO');

    // Tab percorre só os arquivos visíveis.
    const focados: string[] = [];
    for (let k = 0; k < 3; k++) {
      await userEvent.tab();
      focados.push(document.activeElement?.textContent ?? '');
    }
    expect(focados).toEqual(['Menu.tsx', 'index.html', 'server.ts']);
  });

  it('pedir um arquivo na Névoa mostra a nuvem, não o código', () => {
    const { container } = render(
      <Controlado inicial={{ caminho: 'api/src/payments/dwarfVault.ts', inicio: 1, fim: 1 }} />,
    );
    expect(screen.getByRole('status').textContent).toContain('Este arquivo está na Névoa');
    expect(container.innerHTML).not.toContain('SEGREDO');
    expect(container.innerHTML).not.toContain('dwarfVault');
  });

  it('abrir com linhas destaca exatamente essas linhas', () => {
    render(<Controlado inicial={{ caminho: 'api/src/server.ts', inicio: 3, fim: 4 }} />);
    const codigo = screen.getByLabelText('Código de api/src/server.ts, linhas 3–4 destacadas');
    const destacadas = [...codigo.querySelectorAll('.codigo-linha--destaque')].map((l) =>
      l.getAttribute('data-linha'),
    );
    expect(destacadas).toEqual(['3', '4']);
  });
});

const desafio: Desafio = {
  id: 'd1',
  formato: 'multipla_escolha',
  enunciado: 'Qual rota cria o pedido?',
  dificuldade: 1,
  opcoes: [
    { id: 'a', texto: '`GET /items`' },
    { id: 'b', texto: '`POST /orders`' },
  ],
  gabarito: ['b'],
  explicacao: 'O `server.ts` registra a rota.',
  evidencias: [
    {
      caminho: 'api/src/server.ts',
      linha_inicio: 3,
      linha_fim: 4,
      trecho:
        "router.get('/items', listItemsHandler);\nrouter.post('/orders', createOrderHandler);",
    },
  ],
};

/** A batalha e o explorador juntos, como no Tutorial. */
function BatalhaComCodigo() {
  const [aberto, setAberto] = useState<ArquivoAberto | null>(null);
  const [aba, setAba] = useState<'principal' | 'codigo'>('principal');
  const expedicao = responderDesafio(iniciarExpedicao('api', [desafio]), ['b']);
  return (
    <PalcoComCodigo
      aba={aba}
      onTrocarAba={setAba}
      codigo={
        <ExploradorDeCodigo
          grupos={grupos}
          lerArquivo={ler}
          aberto={aberto}
          onAbrir={(caminho) => setAberto({ caminho })}
        />
      }
      principal={
        <Batalha
          expedicao={expedicao}
          estados={estados}
          nomeRegiao="API"
          heroi="heroi"
          onResponder={vi.fn()}
          onAvancar={vi.fn()}
          onAbrirEvidencia={(ev) => {
            setAberto({ caminho: ev.caminho, inicio: ev.linha_inicio, fim: ev.linha_fim });
            setAba('codigo');
          }}
        />
      }
    />
  );
}

describe('Evidência clicável', () => {
  it('abre o arquivo no explorador, destaca as linhas e troca para a aba do código', async () => {
    const { container } = render(<BatalhaComCodigo />);
    expect(container.querySelector('.palco')?.getAttribute('data-aba')).toBe('principal');
    await userEvent.click(screen.getByRole('button', { name: 'api/src/server.ts:3-4' }));
    const codigo = screen.getByLabelText('Código de api/src/server.ts, linhas 3–4 destacadas');
    const destacadas = [...codigo.querySelectorAll('.codigo-linha--destaque')];
    expect(destacadas.map((l) => l.textContent)).toEqual([
      "3router.get('/items', listItemsHandler);",
      "4router.post('/orders', createOrderHandler);",
    ]);
    expect(container.querySelector('.palco')?.getAttribute('data-aba')).toBe('codigo');
    expect(screen.getByRole('tab', { name: '📜 Código' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('sem onAbrirEvidencia, a Evidência é só texto', () => {
    render(
      <Batalha
        expedicao={responderDesafio(iniciarExpedicao('api', [desafio]), ['b'])}
        estados={estados}
        nomeRegiao="API"
        heroi="heroi"
        onResponder={vi.fn()}
        onAvancar={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'api/src/server.ts:3-4' })).toBeNull();
    expect(screen.getByText('api/src/server.ts:3-4')).toBeTruthy();
  });
});
