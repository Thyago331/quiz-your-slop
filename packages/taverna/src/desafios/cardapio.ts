// Desafios do Cardápio (Salão): a primeira tela, o GET /items, o filtro por categoria e o botão que
// põe o item no carrinho.
import type { DesafioTaverna } from './tipo.ts';

export const CARDAPIO: readonly DesafioTaverna[] = [
  {
    id: 'cardapio-rota-get-items',
    formato: 'multipla_escolha',
    enunciado: 'Quando o Cardápio abre, qual rota da API ele chama para buscar os itens?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '`POST /orders`' },
      { id: 'b', texto: '`GET /items`' },
      { id: 'c', texto: '`GET /menu`' },
      { id: 'd', texto: '`GET /orders/:id`' },
    ],
    gabarito: ['b'],
    explicacao:
      '`fetchItems()` pede `/items` ao `getJson`, que faz um `fetch` simples — um GET — no ' +
      'endereço da API. A resposta vem como `{ items }` e só a lista volta para o `Menu`.',
    evidencias: [
      {
        caminho: 'web/src/api/items.ts',
        linha_inicio: 4,
        linha_fim: 7,
        trecho:
          'export async function fetchItems(): Promise<Item[]> {\n' +
          "  const { items } = await getJson<{ items: Item[] }>('/items');\n" +
          '  return items;\n' +
          '}',
      },
    ],
  },
  {
    id: 'cardapio-item-indisponivel',
    formato: 'multipla_escolha',
    enunciado: 'Um item chega da API com `available: false`. Como o Cardápio o mostra?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: 'Não mostra: a API já tira o item da lista' },
      { id: 'b', texto: 'Mostra normal; o erro só aparece ao pagar' },
      { id: 'c', texto: 'Mostra com a classe `unavailable` e o botão "Off the menu" desabilitado' },
      { id: 'd', texto: 'Mostra com preço zero' },
    ],
    gabarito: ['c'],
    explicacao:
      'O `GET /items` traz também os itens fora do cardápio, e é o `ItemCard` que decide: com ' +
      '`available` falso, o card ganha a classe `unavailable` e o botão fica desabilitado, com o ' +
      'texto "Off the menu".',
    evidencias: [
      {
        caminho: 'web/src/components/ItemCard.tsx',
        linha_inicio: 12,
        linha_fim: 12,
        trecho: "    <article className={item.available ? 'item-card' : 'item-card unavailable'}>",
      },
      {
        caminho: 'web/src/components/ItemCard.tsx',
        linha_inicio: 17,
        linha_fim: 19,
        trecho:
          '        <button onClick={onAdd} disabled={!item.available}>\n' +
          "          {item.available ? 'Add to tab' : 'Off the menu'}\n" +
          '        </button>',
      },
    ],
  },
  {
    id: 'cardapio-filtro-vazio',
    formato: 'multipla_escolha',
    enunciado: 'O Jogador escolhe uma categoria que não tem nenhum item hoje. O que acontece?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: 'O Cardápio chama `GET /items?category=...` e recebe uma lista vazia' },
      { id: 'b', texto: 'Aparece "Could not read the menu"' },
      { id: 'c', texto: 'O filtro volta sozinho para "Everything"' },
      { id: 'd', texto: 'Sem nova chamada à API, aparece "Nothing in this category tonight."' },
    ],
    gabarito: ['d'],
    explicacao:
      'O filtro roda no próprio `Menu`, sobre os itens que já chegaram: `visible` é só um ' +
      '`filter` por categoria. Sem nenhum visível, a tela mostra a frase de categoria vazia.',
    evidencias: [
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 22,
        linha_fim: 22,
        trecho:
          "  const visible = category === 'all' ? items : items.filter((item) => item.category === category);",
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 41,
        linha_fim: 41,
        trecho: '      {visible.length === 0 && <p>Nothing in this category tonight.</p>}',
      },
    ],
  },
  {
    id: 'cardapio-cart-provider',
    formato: 'multipla_escolha',
    enunciado: 'Por que o `Menu` consegue chamar `useCart()` sem receber o carrinho por props?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'O `main.tsx` envolve o `App` inteiro num `<CartProvider>`' },
      { id: 'b', texto: 'O `App` passa o carrinho para cada página' },
      { id: 'c', texto: '`useCart()` lê o carrinho do `localStorage`' },
      { id: 'd', texto: 'Cada `Menu` cria o próprio carrinho' },
    ],
    gabarito: ['a'],
    explicacao:
      'O `main.tsx` monta o `App` dentro do `CartProvider`: o mesmo carrinho vale para o ' +
      'Cardápio, o selo do cabeçalho e o Checkout. É por essa Dependência que o Cardápio fala com ' +
      'o Carrinho e Checkout.',
    evidencias: [
      {
        caminho: 'web/src/main.tsx',
        linha_inicio: 7,
        linha_fim: 13,
        trecho:
          "createRoot(document.getElementById('root')!).render(\n" +
          '  <StrictMode>\n' +
          '    <CartProvider>\n' +
          '      <App />\n' +
          '    </CartProvider>\n' +
          '  </StrictMode>,\n' +
          ');',
      },
    ],
  },
  {
    id: 'cardapio-erro-502',
    formato: 'multipla_escolha',
    enunciado:
      'Um proxy na frente da API responde o `GET /items` com 502 e uma página HTML. O que o ' +
      'cliente lê na tela?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: '"The barkeep is fetching the menu...", para sempre' },
      { id: 'b', texto: '"Could not read the menu: Request failed: 502"' },
      { id: 'c', texto: '"Could not read the menu: Something went wrong in the kitchen"' },
      { id: 'd', texto: 'Um cardápio vazio' },
    ],
    gabarito: ['b'],
    explicacao:
      'Com `res.ok` falso, `getJson` tenta ler o JSON de erro; o HTML não é JSON, o `catch` vira ' +
      '`{}` e a mensagem cai no padrão `Request failed: 502`. O `Menu` pega o erro, desliga o ' +
      '"carregando" no `finally` e mostra a mensagem. A frase da cozinha só viria se a própria ' +
      'API respondesse com seu `{ error }`.',
    evidencias: [
      {
        caminho: 'web/src/api/client.ts',
        linha_inicio: 12,
        linha_fim: 17,
        trecho:
          'export async function getJson<T>(path: string): Promise<T> {\n' +
          '  const res = await fetch(`${API_URL}${path}`);\n' +
          '  if (!res.ok) {\n' +
          '    const body = (await res.json().catch(() => ({}))) as { error?: string };\n' +
          '    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`);\n' +
          '  }',
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 15,
        linha_fim: 20,
        trecho:
          '  useEffect(() => {\n' +
          '    fetchItems()\n' +
          '      .then(setItems)\n' +
          '      .catch((err: Error) => setError(err.message))\n' +
          '      .finally(() => setLoading(false));\n' +
          '  }, []);',
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 25,
        linha_fim: 25,
        trecho: '  if (error) return <p className="error">Could not read the menu: {error}</p>;',
      },
    ],
  },
  {
    id: 'cardapio-onde-busca',
    formato: 'apontar',
    enunciado: 'Aponte a função do site que pede o cardápio à API.',
    dificuldade: 1,
    opcoes: [
      { id: 'a', caminho: 'web/src/pages/Menu.tsx', simbolo: 'Menu' },
      { id: 'b', caminho: 'web/src/api/items.ts', simbolo: 'fetchItems' },
      { id: 'c', caminho: 'web/src/components/CategoryFilter.tsx', simbolo: 'CategoryFilter' },
      { id: 'd', caminho: 'api/src/routes/items.ts', simbolo: 'listItemsHandler' },
    ],
    gabarito: ['b'],
    explicacao:
      '`fetchItems()` é quem monta o pedido `GET /items`; o `Menu` só a chama ao abrir. ' +
      '`listItemsHandler` é o outro lado da Chamada, já na API de Pedidos.',
    evidencias: [
      {
        caminho: 'web/src/api/items.ts',
        linha_inicio: 4,
        linha_fim: 5,
        trecho:
          'export async function fetchItems(): Promise<Item[]> {\n' +
          "  const { items } = await getJson<{ items: Item[] }>('/items');",
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 16,
        linha_fim: 16,
        trecho: '    fetchItems()',
      },
    ],
  },
  {
    id: 'cardapio-onde-rotulos',
    formato: 'apontar',
    enunciado: 'Onde o site decide que o botão da categoria `roasts` diz "Roasts"?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'shared/types.ts', simbolo: 'CATEGORIES' },
      { id: 'b', caminho: 'web/src/pages/Menu.tsx', simbolo: 'Menu' },
      { id: 'c', caminho: 'web/src/components/CategoryFilter.tsx', simbolo: 'LABELS' },
      { id: 'd', caminho: 'web/src/components/ItemCard.tsx', simbolo: 'ItemCard' },
    ],
    gabarito: ['c'],
    explicacao:
      '`CATEGORIES`, do Grimório, diz quais categorias existem e em que ordem; o texto de cada ' +
      'botão vem de `LABELS`, no `CategoryFilter`. O "Everything" é um botão à parte.',
    evidencias: [
      {
        caminho: 'web/src/components/CategoryFilter.tsx',
        linha_inicio: 4,
        linha_fim: 9,
        trecho:
          'const LABELS: Record<Category, string> = {\n' +
          "  drinks: 'Drinks',\n" +
          "  stews: 'Stews',\n" +
          "  roasts: 'Roasts',\n" +
          "  sweets: 'Sweets',\n" +
          '};',
      },
      {
        caminho: 'web/src/components/CategoryFilter.tsx',
        linha_inicio: 22,
        linha_fim: 28,
        trecho:
          '      {CATEGORIES.map((category) => (\n' +
          '        <button\n' +
          '          key={category}\n' +
          "          className={value === category ? 'active' : ''}\n" +
          '          onClick={() => onChange(category)}\n' +
          '        >\n' +
          '          {LABELS[category]}',
      },
    ],
  },
  {
    id: 'cardapio-onde-filtra',
    formato: 'apontar',
    enunciado: 'Em qual componente os itens são de fato filtrados pela categoria escolhida?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'web/src/components/CategoryFilter.tsx', simbolo: 'CategoryFilter' },
      { id: 'b', caminho: 'web/src/api/items.ts', simbolo: 'fetchItems' },
      { id: 'c', caminho: 'api/src/db/itemsRepo.ts', simbolo: 'listItems' },
      { id: 'd', caminho: 'web/src/pages/Menu.tsx', simbolo: 'Menu' },
    ],
    gabarito: ['d'],
    explicacao:
      'O `CategoryFilter` só desenha os botões e avisa a escolha com `onChange`. Quem guarda a ' +
      'categoria e filtra a lista é o `Menu`, em `visible`. Nem a API nem o banco filtram.',
    evidencias: [
      {
        caminho: 'web/src/components/CategoryFilter.tsx',
        linha_inicio: 26,
        linha_fim: 26,
        trecho: '          onClick={() => onChange(category)}',
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 22,
        linha_fim: 22,
        trecho:
          "  const visible = category === 'all' ? items : items.filter((item) => item.category === category);",
      },
    ],
  },
  {
    id: 'cardapio-fluxo-abrir',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que acontece desde que o Cardápio abre até os itens aparecerem:',
    dificuldade: 3,
    opcoes: [
      { id: 'cards', texto: 'Cada item visível vira um `ItemCard`', regiao_id: 'cardapio' },
      {
        id: 'busca',
        texto: '`fetchItems()` pede `GET /items` com `getJson`',
        regiao_id: 'cardapio',
      },
      {
        id: 'espera',
        texto: 'O `Menu` mostra "The barkeep is fetching the menu..."',
        regiao_id: 'cardapio',
      },
      {
        id: 'responde',
        texto: '`listItemsHandler` responde com `{ items }`',
        regiao_id: 'api-pedidos',
        ligacao: 'chamada',
      },
      {
        id: 'guarda',
        texto: '`setItems` guarda a lista e `loading` vira `false`',
        regiao_id: 'cardapio',
      },
    ],
    gabarito: ['espera', 'busca', 'responde', 'guarda', 'cards'],
    explicacao:
      '`loading` começa `true`, então a primeira tela é a do taverneiro buscando o cardápio; o ' +
      '`useEffect` roda depois dessa primeira renderização e chama `fetchItems()`. A resposta da ' +
      'API sai da região por uma Chamada, volta para `setItems` e o `finally` desliga o ' +
      '"carregando".',
    evidencias: [
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 12,
        linha_fim: 24,
        trecho:
          '  const [loading, setLoading] = useState(true);\n' +
          '  const cart = useCart();\n' +
          '\n' +
          '  useEffect(() => {\n' +
          '    fetchItems()\n' +
          '      .then(setItems)\n' +
          '      .catch((err: Error) => setError(err.message))\n' +
          '      .finally(() => setLoading(false));\n' +
          '  }, []);\n' +
          '\n' +
          "  const visible = category === 'all' ? items : items.filter((item) => item.category === category);\n" +
          '\n' +
          '  if (loading) return <p>The barkeep is fetching the menu...</p>;',
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 32,
        linha_fim: 38,
        trecho:
          '        {visible.map((item) => (\n' +
          '          <ItemCard\n' +
          '            key={item.id}\n' +
          '            item={item}\n' +
          '            quantityInCart={cart.quantityOf(item.id)}\n' +
          '            onAdd={() => cart.add(item)}\n' +
          '          />',
      },
    ],
  },
  {
    id: 'cardapio-fluxo-add',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que acontece quando o cliente clica em "Add to tab" num item:',
    dificuldade: 4,
    opcoes: [
      {
        id: 'mostra',
        texto: 'O card passa a mostrar `x1`, vindo de `cart.quantityOf`',
        regiao_id: 'cardapio',
      },
      {
        id: 'clica',
        texto: 'O botão do `ItemCard` chama `onAdd`',
        regiao_id: 'cardapio',
      },
      {
        id: 'soma',
        texto: 'O carrinho ganha uma linha com quantidade 1',
        regiao_id: 'carrinho-checkout',
        ligacao: 'dependencia',
      },
      { id: 'add', texto: 'O `Menu` chama `cart.add(item)`', regiao_id: 'cardapio' },
    ],
    gabarito: ['clica', 'add', 'soma', 'mostra'],
    explicacao:
      'O `ItemCard` não conhece o carrinho: recebe `onAdd` pronto do `Menu`, que chama ' +
      '`cart.add(item)`. O carrinho mora em outra região (Dependência pelo `useCart`); quando ele ' +
      'muda, o `Menu` renderiza de novo e `quantityOf` devolve a nova quantidade para o card.',
    evidencias: [
      {
        caminho: 'web/src/components/ItemCard.tsx',
        linha_inicio: 17,
        linha_fim: 20,
        trecho:
          '        <button onClick={onAdd} disabled={!item.available}>\n' +
          "          {item.available ? 'Add to tab' : 'Off the menu'}\n" +
          '        </button>\n' +
          '        {quantityInCart > 0 && <span className="in-cart">x{quantityInCart}</span>}',
      },
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 33,
        linha_fim: 38,
        trecho:
          '          <ItemCard\n' +
          '            key={item.id}\n' +
          '            item={item}\n' +
          '            quantityInCart={cart.quantityOf(item.id)}\n' +
          '            onAdd={() => cart.add(item)}\n' +
          '          />',
      },
    ],
  },
  {
    id: 'cardapio-fluxo-preco',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o caminho do preço de um item, do banco até o texto no card:',
    dificuldade: 5,
    opcoes: [
      {
        id: 'formata',
        texto: '`formatGold` transforma o número em texto de ouro e cobre',
        regiao_id: 'grimorio',
        ligacao: 'dependencia',
      },
      { id: 'pede', texto: '`fetchItems()` pede `GET /items`', regiao_id: 'cardapio' },
      {
        id: 'le',
        texto: '`listItems()` lê a tabela `items`',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
      {
        id: 'card',
        texto: 'O `ItemCard` recebe o item, com `price` em ouro',
        regiao_id: 'cardapio',
      },
      {
        id: 'atende',
        texto: '`listItemsHandler` atende a rota',
        regiao_id: 'api-pedidos',
        ligacao: 'chamada',
      },
    ],
    gabarito: ['pede', 'atende', 'le', 'card', 'formata'],
    explicacao:
      'O preço atravessa quatro regiões: o Cardápio chama a API, a API consulta o banco, a lista ' +
      'volta e cada `ItemCard` passa `item.price` para `formatGold`, do Grimório. O número só ' +
      'vira texto no fim, na tela.',
    evidencias: [
      {
        caminho: 'web/src/api/items.ts',
        linha_inicio: 4,
        linha_fim: 7,
        trecho:
          'export async function fetchItems(): Promise<Item[]> {\n' +
          "  const { items } = await getJson<{ items: Item[] }>('/items');\n" +
          '  return items;\n' +
          '}',
      },
      {
        caminho: 'web/src/components/ItemCard.tsx',
        linha_inicio: 1,
        linha_fim: 1,
        trecho: "import { formatGold } from '@taverna/shared/money';",
      },
      {
        caminho: 'web/src/components/ItemCard.tsx',
        linha_inicio: 16,
        linha_fim: 16,
        trecho: '        <span className="price">{formatGold(item.price)}</span>',
      },
    ],
  },
];
