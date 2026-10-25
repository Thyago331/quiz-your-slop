// Desafios do Livro de Registros (Adega): as tabelas e as consultas da API que as leem e escrevem.
// A API grava o pedido; o Fogão muda o status dele.
import type { DesafioTaverna } from './tipo.ts';

export const LIVRO_DE_REGISTROS: readonly DesafioTaverna[] = [
  {
    id: 'livro-tabelas',
    formato: 'multipla_escolha',
    enunciado: 'Quais tabelas o esquema da Taverna cria?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '`items`, `orders` e `payments`' },
      { id: 'b', texto: '`menu` e `orders`' },
      { id: 'c', texto: '`items`, `carts` e `orders`' },
      { id: 'd', texto: '`items`, `orders` e `order_items`' },
    ],
    gabarito: ['d'],
    explicacao:
      'Três tabelas: o cardápio (`items`), os pedidos (`orders`) e as linhas de cada pedido ' +
      '(`order_items`). Não há tabela de pagamentos: o recibo do Cofre do Anão vive só na memória ' +
      'da API.',
    evidencias: [
      { caminho: 'db/schema.sql', linha_inicio: 3, linha_fim: 3, trecho: 'CREATE TABLE items (' },
      {
        caminho: 'db/schema.sql',
        linha_inicio: 12,
        linha_fim: 12,
        trecho: 'CREATE TABLE orders (',
      },
      {
        caminho: 'db/schema.sql',
        linha_inicio: 24,
        linha_fim: 24,
        trecho: 'CREATE TABLE order_items (',
      },
    ],
  },
  {
    id: 'livro-status-padrao',
    formato: 'multipla_escolha',
    enunciado:
      'Se o `INSERT` não disser o status, com qual status um pedido nasce na tabela `orders`? E ' +
      'com qual a API o grava?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: 'Nasce `pending`; a API também grava `pending`' },
      { id: 'b', texto: 'Nasce `pending`, mas a API sempre manda o status: `paid`' },
      { id: 'c', texto: 'Nasce `paid`; a API não manda status' },
      { id: 'd', texto: 'Nasce sem status (`NULL`)' },
    ],
    gabarito: ['b'],
    explicacao:
      'O padrão da coluna é `pending`, mas `insertOrder` sempre passa `order.status` — e a API só ' +
      'chama com `paid`, depois de cobrar. Na prática nenhum pedido fica `pending` no banco.',
    evidencias: [
      {
        caminho: 'db/schema.sql',
        linha_inicio: 18,
        linha_fim: 19,
        trecho:
          "  status        TEXT NOT NULL DEFAULT 'pending'\n" +
          "                CHECK (status IN ('pending', 'paid', 'cooking', 'ready', 'failed')),",
      },
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 27,
        linha_fim: 30,
        trecho:
          '      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status)\n' +
          '       VALUES ($1, $2, $3, $4, $5, $6)\n' +
          '       RETURNING id, customer_name, subtotal, tax, total, status, created_at`,\n' +
          '      [order.id, order.customerName, order.subtotal, order.tax, order.total, order.status],',
      },
    ],
  },
  {
    id: 'livro-numeric-vira-numero',
    formato: 'multipla_escolha',
    enunciado:
      'O driver `pg` devolve colunas `NUMERIC` (como `price`) como texto. Por que a API recebe ' +
      'números?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'O esquema usa `REAL`, não `NUMERIC`' },
      { id: 'b', texto: '`toItem` converte cada preço com `Number`' },
      { id: 'c', texto: 'O `pool.ts` registra um conversor de `NUMERIC` para `Number`' },
      { id: 'd', texto: 'O `JSON.stringify` da resposta converte' },
    ],
    gabarito: ['c'],
    explicacao:
      '`pool.ts` registra um `setTypeParser` para `NUMERIC` na carga do módulo: toda consulta da ' +
      'API recebe número. `toItem` só copia a linha.',
    evidencias: [
      {
        caminho: 'api/src/db/pool.ts',
        linha_inicio: 10,
        linha_fim: 11,
        trecho:
          '// NUMERIC columns come back as strings; the tavern deals in plain numbers.\n' +
          'pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));',
      },
      {
        caminho: 'api/src/db/itemsRepo.ts',
        linha_inicio: 13,
        linha_fim: 15,
        trecho: 'function toItem(row: ItemRow): Item {\n' + '  return { ...row };\n' + '}',
      },
    ],
  },
  {
    id: 'livro-rollback',
    formato: 'multipla_escolha',
    enunciado:
      'Gravando um pedido de 3 linhas, o `INSERT` da terceira linha em `order_items` falha. O que ' +
      'fica no banco?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: 'O pedido e as duas primeiras linhas' },
      { id: 'b', texto: 'Só o pedido, sem linhas' },
      { id: 'c', texto: 'O pedido, marcado como `failed`' },
      { id: 'd', texto: 'Nada: o `ROLLBACK` desfaz o pedido e as linhas' },
    ],
    gabarito: ['d'],
    explicacao:
      '`insertOrder` grava tudo numa transação: qualquer erro cai no `catch`, que faz `ROLLBACK` ' +
      'e relança. O banco fica limpo — mas a cobrança no Cofre do Anão já aconteceu antes, e ' +
      'nenhum `ROLLBACK` a desfaz.',
    evidencias: [
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 22,
        linha_fim: 25,
        trecho:
          'export async function insertOrder(order: NewOrder): Promise<Order> {\n' +
          '  const client = await pool.connect();\n' +
          '  try {\n' +
          "    await client.query('BEGIN');",
      },
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 38,
        linha_fim: 42,
        trecho:
          "    await client.query('COMMIT');\n" +
          '    return toOrder(rows[0] as OrderRow, order.lines);\n' +
          '  } catch (err) {\n' +
          "    await client.query('ROLLBACK');\n" +
          '    throw err;',
      },
    ],
  },
  {
    id: 'livro-item-repetido',
    formato: 'multipla_escolha',
    enunciado:
      'Um pedido chega à API com duas linhas do mesmo item (o mesmo `itemId`, duas vezes). O que ' +
      'acontece ao gravar?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: 'As duas linhas são somadas numa só' },
      { id: 'b', texto: 'A segunda linha substitui a primeira' },
      { id: 'c', texto: 'As duas linhas são gravadas normalmente' },
      { id: 'd', texto: 'A chave primária recusa a segunda linha e o pedido inteiro é desfeito' },
    ],
    gabarito: ['d'],
    explicacao:
      'A chave de `order_items` é `(order_id, item_id)`: a segunda linha do mesmo item viola a ' +
      'chave, e o `ROLLBACK` desfaz o pedido. O carrinho do site junta itens iguais numa linha só, ' +
      'mas a API não confere repetidos antes de cobrar — quem mandar o pedido assim paga e recebe ' +
      'um erro 500.',
    evidencias: [
      {
        caminho: 'db/schema.sql',
        linha_inicio: 24,
        linha_fim: 30,
        trecho:
          'CREATE TABLE order_items (\n' +
          '  order_id   UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,\n' +
          '  item_id    INTEGER NOT NULL REFERENCES items (id),\n' +
          '  quantity   INTEGER NOT NULL CHECK (quantity > 0),\n' +
          '  unit_price NUMERIC(10, 2) NOT NULL,\n' +
          '  PRIMARY KEY (order_id, item_id)\n' +
          ');',
      },
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 32,
        linha_fim: 42,
        trecho:
          '    for (const line of order.lines) {\n' +
          '      await client.query(\n' +
          "        'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',\n" +
          '        [order.id, line.itemId, line.quantity, line.unitPrice],\n' +
          '      );\n' +
          '    }\n' +
          "    await client.query('COMMIT');\n" +
          '    return toOrder(rows[0] as OrderRow, order.lines);\n' +
          '  } catch (err) {\n' +
          "    await client.query('ROLLBACK');\n" +
          '    throw err;',
      },
    ],
  },
  {
    id: 'livro-onde-grava',
    formato: 'apontar',
    enunciado: 'Aponte a função que grava um pedido novo no banco.',
    dificuldade: 1,
    opcoes: [
      { id: 'a', caminho: 'api/src/db/ordersRepo.ts', simbolo: 'findOrderById' },
      { id: 'b', caminho: 'api/src/orders/service.ts', simbolo: 'createOrder' },
      { id: 'c', caminho: 'api/src/db/ordersRepo.ts', simbolo: 'insertOrder' },
      { id: 'd', caminho: 'kitchen/src/worker.ts', simbolo: 'setStatus' },
    ],
    gabarito: ['c'],
    explicacao:
      '`createOrder()` decide quando gravar, mas quem escreve no banco é `insertOrder`, com um ' +
      '`INSERT INTO orders` e um `INSERT INTO order_items` por linha. `setStatus`, na cozinha, só ' +
      'atualiza pedidos que já existem.',
    evidencias: [
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 22,
        linha_fim: 36,
        trecho:
          'export async function insertOrder(order: NewOrder): Promise<Order> {\n' +
          '  const client = await pool.connect();\n' +
          '  try {\n' +
          "    await client.query('BEGIN');\n" +
          '    const { rows } = await client.query<OrderRow>(\n' +
          '      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status)\n' +
          '       VALUES ($1, $2, $3, $4, $5, $6)\n' +
          '       RETURNING id, customer_name, subtotal, tax, total, status, created_at`,\n' +
          '      [order.id, order.customerName, order.subtotal, order.tax, order.total, order.status],\n' +
          '    );\n' +
          '    for (const line of order.lines) {\n' +
          '      await client.query(\n' +
          "        'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',\n" +
          '        [order.id, line.itemId, line.quantity, line.unitPrice],\n' +
          '      );',
      },
    ],
  },
  {
    id: 'livro-onde-le-cardapio',
    formato: 'apontar',
    enunciado: 'Onde está a consulta que lê o cardápio inteiro, ordenado por categoria e nome?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'api/src/db/itemsRepo.ts', simbolo: 'findItemsByIds' },
      { id: 'b', caminho: 'api/src/db/itemsRepo.ts', simbolo: 'listItems' },
      { id: 'c', caminho: 'api/src/routes/items.ts', simbolo: 'listItemsHandler' },
      { id: 'd', caminho: 'web/src/api/items.ts', simbolo: 'fetchItems' },
    ],
    gabarito: ['b'],
    explicacao:
      '`listItems` faz o `SELECT ... ORDER BY category, name` — sem filtrar `available`, então os ' +
      'itens fora do cardápio também vão para o site. `findItemsByIds` é a outra consulta, que ' +
      'busca só os itens de um pedido.',
    evidencias: [
      {
        caminho: 'api/src/db/itemsRepo.ts',
        linha_inicio: 17,
        linha_fim: 22,
        trecho:
          'export async function listItems(): Promise<Item[]> {\n' +
          '  const { rows } = await pool.query<ItemRow>(\n' +
          "    'SELECT id, name, description, category, price, available FROM items ORDER BY category, name',\n" +
          '  );\n' +
          '  return rows.map(toItem);\n' +
          '}',
      },
    ],
  },
  {
    id: 'livro-onde-preco-pago',
    formato: 'apontar',
    enunciado:
      'Em qual coluna fica o preço que o cliente pagou por unidade em cada linha, mesmo que o ' +
      'cardápio mude depois?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'db/schema.sql', simbolo: 'price' },
      { id: 'b', caminho: 'db/schema.sql', simbolo: 'subtotal' },
      { id: 'c', caminho: 'db/schema.sql', simbolo: 'total' },
      { id: 'd', caminho: 'db/schema.sql', simbolo: 'unit_price' },
    ],
    gabarito: ['d'],
    explicacao:
      '`items.price` é o preço de hoje e pode mudar. Cada linha do pedido guarda o seu ' +
      '`unit_price`, copiado na hora da compra por `insertOrder`.',
    evidencias: [
      {
        caminho: 'db/schema.sql',
        linha_inicio: 28,
        linha_fim: 28,
        trecho: '  unit_price NUMERIC(10, 2) NOT NULL,',
      },
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 33,
        linha_fim: 36,
        trecho:
          '      await client.query(\n' +
          "        'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',\n" +
          '        [order.id, line.itemId, line.quantity, line.unitPrice],\n' +
          '      );',
      },
    ],
  },
  {
    id: 'livro-fluxo-insert',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que `insertOrder()` faz para gravar um pedido:',
    dificuldade: 3,
    opcoes: [
      { id: 'commit', texto: '`COMMIT`', regiao_id: 'livro-registros' },
      {
        id: 'linhas',
        texto: 'Um `INSERT INTO order_items` para cada linha',
        regiao_id: 'livro-registros',
      },
      {
        id: 'conecta',
        texto: 'Pega uma conexão do `pool`',
        regiao_id: 'livro-registros',
      },
      {
        id: 'pedido',
        texto: '`INSERT INTO orders` devolvendo a linha gravada',
        regiao_id: 'livro-registros',
      },
      { id: 'begin', texto: '`BEGIN`', regiao_id: 'livro-registros' },
      {
        id: 'libera',
        texto: 'Devolve a conexão ao `pool` com `release()`',
        regiao_id: 'livro-registros',
      },
    ],
    gabarito: ['conecta', 'begin', 'pedido', 'linhas', 'commit', 'libera'],
    explicacao:
      'Tudo numa conexão só, para a transação valer: abre, grava o pedido, grava as linhas e ' +
      'confirma. O `finally` devolve a conexão ao `pool` aconteça o que acontecer.',
    evidencias: [
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 22,
        linha_fim: 46,
        trecho:
          'export async function insertOrder(order: NewOrder): Promise<Order> {\n' +
          '  const client = await pool.connect();\n' +
          '  try {\n' +
          "    await client.query('BEGIN');\n" +
          '    const { rows } = await client.query<OrderRow>(\n' +
          '      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status)\n' +
          '       VALUES ($1, $2, $3, $4, $5, $6)\n' +
          '       RETURNING id, customer_name, subtotal, tax, total, status, created_at`,\n' +
          '      [order.id, order.customerName, order.subtotal, order.tax, order.total, order.status],\n' +
          '    );\n' +
          '    for (const line of order.lines) {\n' +
          '      await client.query(\n' +
          "        'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',\n" +
          '        [order.id, line.itemId, line.quantity, line.unitPrice],\n' +
          '      );\n' +
          '    }\n' +
          "    await client.query('COMMIT');\n" +
          '    return toOrder(rows[0] as OrderRow, order.lines);\n' +
          '  } catch (err) {\n' +
          "    await client.query('ROLLBACK');\n" +
          '    throw err;\n' +
          '  } finally {\n' +
          '    client.release();\n' +
          '  }\n' +
          '}',
      },
    ],
  },
  {
    id: 'livro-fluxo-vida-do-pedido',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene a vida de um pedido que dá certo, contada pela coluna `status`:',
    dificuldade: 4,
    opcoes: [
      {
        id: 'cooking',
        texto: 'A cozinha muda o status para `cooking`',
        regiao_id: 'fogao',
        ligacao: 'consulta',
      },
      {
        id: 'grava',
        texto: '`insertOrder` grava o pedido com status `paid`',
        regiao_id: 'livro-registros',
      },
      {
        id: 'ready',
        texto: 'A cozinha muda o status para `ready`',
        regiao_id: 'fogao',
        ligacao: 'consulta',
      },
      {
        id: 'cobra',
        texto: 'A API cobra o pedido no Cofre do Anão',
        regiao_id: 'api-pedidos',
        ligacao: 'consulta',
      },
    ],
    gabarito: ['cobra', 'grava', 'cooking', 'ready'],
    explicacao:
      'O pedido só entra no banco depois de cobrado, e já como `paid`. A partir daí quem escreve ' +
      'é a cozinha, por outra Consulta: `cooking` e depois `ready`. `pending` e `failed` existem no ' +
      '`CHECK`, mas ninguém os grava.',
    evidencias: [
      {
        caminho: 'db/schema.sql',
        linha_inicio: 18,
        linha_fim: 19,
        trecho:
          "  status        TEXT NOT NULL DEFAULT 'pending'\n" +
          "                CHECK (status IN ('pending', 'paid', 'cooking', 'ready', 'failed')),",
      },
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 27,
        linha_fim: 30,
        trecho:
          '      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status)\n' +
          '       VALUES ($1, $2, $3, $4, $5, $6)\n' +
          '       RETURNING id, customer_name, subtotal, tax, total, status, created_at`,\n' +
          '      [order.id, order.customerName, order.subtotal, order.tax, order.total, order.status],',
      },
    ],
  },
];
