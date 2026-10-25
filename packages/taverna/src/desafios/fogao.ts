// Desafios do Fogão (Cozinha): o worker que ouve order.paid, prepara os pratos e atualiza o status.
// Aqui mora o catch {} que engole o erro do banco.
import type { DesafioTaverna } from './tipo.ts';

export const FOGAO: readonly DesafioTaverna[] = [
  {
    id: 'fogao-canal',
    formato: 'multipla_escolha',
    enunciado: 'Em qual canal do Redis a cozinha escuta os pedidos pagos?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '`orders`' },
      { id: 'b', texto: '`kitchen`' },
      { id: 'c', texto: '`order.paid`' },
      { id: 'd', texto: '`order.created`' },
    ],
    gabarito: ['c'],
    explicacao:
      'A cozinha assina `order.paid`. O nome está escrito de novo aqui, com um comentário pedindo ' +
      'que bata com o da API: são dois lados de um Evento, e nada no código garante que os dois ' +
      'nomes continuem iguais.',
    evidencias: [
      {
        caminho: 'kitchen/src/queue.ts',
        linha_inicio: 4,
        linha_fim: 5,
        trecho:
          '// Must match ORDER_PAID_CHANNEL in api/src/events/publisher.ts.\n' +
          "const ORDER_PAID_CHANNEL = 'order.paid';",
      },
      {
        caminho: 'kitchen/src/queue.ts',
        linha_inicio: 11,
        linha_fim: 11,
        trecho: '  await subscriber.subscribe(ORDER_PAID_CHANNEL);',
      },
    ],
  },
  {
    id: 'fogao-tempo-de-preparo',
    formato: 'multipla_escolha',
    enunciado:
      'Um pedido traz 2 assados (`roasts`) e 1 bebida (`drinks`). Quanto tempo a cozinha espera ' +
      'antes de marcá-lo como pronto?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: '11 segundos' },
      { id: 'b', texto: '21 segundos' },
      { id: 'c', texto: '10 segundos: só o prato mais demorado conta' },
      { id: 'd', texto: '3 segundos: um por porção' },
    ],
    gabarito: ['b'],
    explicacao:
      'O tempo é a soma, porção por porção: 10 s por assado e 1 s por bebida dão 2 × 10 + 1 = 21 ' +
      's. Nada é preparado em paralelo.',
    evidencias: [
      {
        caminho: 'kitchen/src/recipes.ts',
        linha_inicio: 4,
        linha_fim: 9,
        trecho:
          'const SECONDS_PER_PORTION: Record<Category, number> = {\n' +
          '  drinks: 1,\n' +
          '  stews: 4,\n' +
          '  roasts: 10,\n' +
          '  sweets: 3,\n' +
          '};',
      },
      {
        caminho: 'kitchen/src/recipes.ts',
        linha_inicio: 11,
        linha_fim: 17,
        trecho:
          'export function cookingTimeMs(lines: { category: Category; quantity: number }[]): number {\n' +
          '  const seconds = lines.reduce(\n' +
          '    (total, line) => total + SECONDS_PER_PORTION[line.category] * line.quantity,\n' +
          '    0,\n' +
          '  );\n' +
          '  return seconds * 1000;\n' +
          '}',
      },
    ],
  },
  {
    id: 'fogao-mensagem-ilegivel',
    formato: 'multipla_escolha',
    enunciado: 'Chega no canal uma mensagem que não é JSON. O que a cozinha faz?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'O worker cai com erro de JSON' },
      { id: 'b', texto: 'Avisa "Kitchen got a note it cannot read" no log e ignora a mensagem' },
      { id: 'c', texto: 'Marca o pedido como `failed`' },
      { id: 'd', texto: 'Devolve a mensagem para a fila' },
    ],
    gabarito: ['b'],
    explicacao:
      '`parse` engole o erro de `JSON.parse` e devolve `undefined` — também para JSON que não é ' +
      'um `order.paid`. Quem recebe a mensagem avisa no log e segue. Diferente do `catch {}` do ' +
      'worker, aqui o problema deixa rastro.',
    evidencias: [
      {
        caminho: 'kitchen/src/queue.ts',
        linha_inicio: 13,
        linha_fim: 21,
        trecho:
          "  subscriber.on('message', (channel, message) => {\n" +
          '    if (channel !== ORDER_PAID_CHANNEL) return;\n' +
          '    const event = parse(message);\n' +
          '    if (!event) {\n' +
          "      console.warn('Kitchen got a note it cannot read:', message);\n" +
          '      return;\n' +
          '    }\n' +
          '    void listener(event);\n' +
          '  });',
      },
      {
        caminho: 'kitchen/src/queue.ts',
        linha_inicio: 29,
        linha_fim: 36,
        trecho:
          'function parse(message: string): OrderPaidEvent | undefined {\n' +
          '  try {\n' +
          '    const event = JSON.parse(message) as OrderPaidEvent;\n' +
          "    return event.type === 'order.paid' ? event : undefined;\n" +
          '  } catch {\n' +
          '    return undefined;\n' +
          '  }\n' +
          '}',
      },
    ],
  },
  {
    id: 'fogao-item-sumido',
    formato: 'multipla_escolha',
    enunciado:
      'O evento traz um `itemId` que não existe mais na tabela `items`. Como essa linha sai no ' +
      'ticket?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: 'A linha é ignorada' },
      { id: 'b', texto: 'O preparo para com erro' },
      { id: 'c', texto: 'Sai sem nome e sem estação' },
      { id: 'd', texto: 'Sai como `item #<id>`, preparada como ensopado (`stews`)' },
    ],
    gabarito: ['d'],
    explicacao:
      '`ticketLinesFor` usa valores de reserva quando o item não vem do banco: o nome vira ' +
      '`item #<id>` e a categoria, `stews`. O prato vai para a estação POT e conta 4 s por porção.',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 20,
        linha_fim: 25,
        trecho:
          '  const byId = new Map(rows.map((row) => [row.id, row]));\n' +
          '  return event.lines.map((line) => ({\n' +
          '    name: byId.get(line.itemId)?.name ?? `item #${line.itemId}`,\n' +
          "    category: byId.get(line.itemId)?.category ?? 'stews',\n" +
          '    quantity: line.quantity,\n' +
          '  }));',
      },
    ],
  },
  {
    id: 'fogao-catch-engolido',
    formato: 'multipla_escolha',
    enunciado:
      'Durante o preparo o banco cai, e o `UPDATE` para `ready` falha. O que acontece com o pedido?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: 'O status vira `failed`' },
      { id: 'b', texto: 'O worker tenta de novo até conseguir' },
      { id: 'c', texto: 'O erro some no `catch {}`: sem log, o pedido fica `cooking` para sempre' },
      { id: 'd', texto: 'O worker cai e o pedido volta para a fila' },
    ],
    gabarito: ['c'],
    explicacao:
      'Tratamento de erro engolido: o `catch {}` de `cook` não registra nada, não tenta de novo e ' +
      'não marca falha. O `cooking` já foi gravado, o `ready` não — e ninguém fica sabendo.',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 28,
        linha_fim: 39,
        trecho:
          'async function cook(event: OrderPaidEvent): Promise<void> {\n' +
          '  console.log(`Order ${event.orderId} reached the stove`);\n' +
          '  try {\n' +
          "    await setStatus(event.orderId, 'cooking');\n" +
          '    const lines = await ticketLinesFor(event);\n' +
          '    console.log(printTicket(event.orderId, lines));\n' +
          '    const time = cookingTimeMs(lines);\n' +
          '    await new Promise((resolve) => setTimeout(resolve, time));\n' +
          "    await setStatus(event.orderId, 'ready');\n" +
          '    console.log(`Order ${event.orderId} is ready`);\n' +
          '  } catch {}\n' +
          '}',
      },
    ],
  },
  {
    id: 'fogao-primeiro-update',
    formato: 'multipla_escolha',
    enunciado:
      'E se for o primeiro `UPDATE`, o que muda o status para `cooking`, que falhar? O que fica no ' +
      'banco e no log?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: 'O pedido fica `paid` para sempre; o log só diz que ele chegou ao fogão' },
      { id: 'b', texto: 'O pedido vira `failed` e o log mostra o erro' },
      { id: 'c', texto: 'O prato é preparado assim mesmo e o pedido termina `ready`' },
      { id: 'd', texto: 'A API recebe o erro e devolve o dinheiro' },
    ],
    gabarito: ['a'],
    explicacao:
      'O "reached the stove" é escrito antes do `try`; o primeiro `setStatus` falha e o `catch {}` ' +
      'pula todo o resto — sem ticket, sem preparo, sem `ready`. O pedido fica pago e parado, e o ' +
      'status `failed`, que existe no tipo, nunca é gravado por ninguém.',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 28,
        linha_fim: 31,
        trecho:
          'async function cook(event: OrderPaidEvent): Promise<void> {\n' +
          '  console.log(`Order ${event.orderId} reached the stove`);\n' +
          '  try {\n' +
          "    await setStatus(event.orderId, 'cooking');",
      },
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 38,
        linha_fim: 39,
        trecho: '  } catch {}\n' + '}',
      },
    ],
  },
  {
    id: 'fogao-onde-status',
    formato: 'apontar',
    enunciado: 'Aponte a função da cozinha que muda o status do pedido no banco.',
    dificuldade: 1,
    opcoes: [
      { id: 'a', caminho: 'kitchen/src/worker.ts', simbolo: 'cook' },
      { id: 'b', caminho: 'kitchen/src/worker.ts', simbolo: 'setStatus' },
      { id: 'c', caminho: 'api/src/db/ordersRepo.ts', simbolo: 'insertOrder' },
      { id: 'd', caminho: 'kitchen/src/queue.ts', simbolo: 'onOrderPaid' },
    ],
    gabarito: ['b'],
    explicacao:
      '`cook` decide quando, mas o `UPDATE orders SET status` está em `setStatus` — a Consulta ' +
      'do Fogão ao Livro de Registros. Ela também atualiza `updated_at`.',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 7,
        linha_fim: 12,
        trecho:
          'async function setStatus(orderId: string, status: OrderStatus): Promise<void> {\n' +
          "  await db.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [\n" +
          '    status,\n' +
          '    orderId,\n' +
          '  ]);\n' +
          '}',
      },
    ],
  },
  {
    id: 'fogao-onde-estacao',
    formato: 'apontar',
    enunciado: 'Onde se decide em qual estação (BAR, POT, SPIT, OVEN) cada prato é feito?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'kitchen/src/recipes.ts', simbolo: 'SECONDS_PER_PORTION' },
      { id: 'b', caminho: 'kitchen/src/worker.ts', simbolo: 'ticketLinesFor' },
      { id: 'c', caminho: 'kitchen/src/tickets.ts', simbolo: 'STATION' },
      { id: 'd', caminho: 'shared/types.ts', simbolo: 'CATEGORIES' },
    ],
    gabarito: ['c'],
    explicacao:
      '`STATION` liga cada categoria a uma estação, e `printTicket` a usa para escrever e ordenar ' +
      'as linhas do ticket. `SECONDS_PER_PORTION` é a outra tabela por categoria: a do tempo.',
    evidencias: [
      {
        caminho: 'kitchen/src/tickets.ts',
        linha_inicio: 9,
        linha_fim: 14,
        trecho:
          'const STATION: Record<Category, string> = {\n' +
          "  drinks: 'BAR',\n" +
          "  stews: 'POT',\n" +
          "  roasts: 'SPIT',\n" +
          "  sweets: 'OVEN',\n" +
          '};',
      },
      {
        caminho: 'kitchen/src/tickets.ts',
        linha_inicio: 19,
        linha_fim: 23,
        trecho:
          '  const body = [...lines]\n' +
          '    .sort((a, b) => STATION[a.category].localeCompare(STATION[b.category]))\n' +
          '    .map((line) => {\n' +
          '      const quantity = String(line.quantity).padStart(2);\n' +
          '      return `${STATION[line.category].padEnd(5)}${quantity}x ${line.name}`;',
      },
    ],
  },
  {
    id: 'fogao-onde-engole',
    formato: 'apontar',
    enunciado: 'Aponte a função em que um erro de banco some sem deixar rastro.',
    dificuldade: 4,
    opcoes: [
      { id: 'a', caminho: 'kitchen/src/queue.ts', simbolo: 'parse' },
      { id: 'b', caminho: 'kitchen/src/worker.ts', simbolo: 'setStatus' },
      { id: 'c', caminho: 'kitchen/src/db.ts', simbolo: 'db' },
      { id: 'd', caminho: 'kitchen/src/worker.ts', simbolo: 'cook' },
    ],
    gabarito: ['d'],
    explicacao:
      '`setStatus` deixa o erro subir; quem o engole é o `catch {}` vazio de `cook`. `parse` ' +
      'também tem um `catch`, mas para JSON, e quem a chama avisa no log.',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 28,
        linha_fim: 31,
        trecho:
          'async function cook(event: OrderPaidEvent): Promise<void> {\n' +
          '  console.log(`Order ${event.orderId} reached the stove`);\n' +
          '  try {\n' +
          "    await setStatus(event.orderId, 'cooking');",
      },
      { caminho: 'kitchen/src/worker.ts', linha_inicio: 38, linha_fim: 38, trecho: '  } catch {}' },
    ],
  },
  {
    id: 'fogao-fluxo-cook',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que a cozinha faz com um pedido pago, quando tudo dá certo:',
    dificuldade: 3,
    opcoes: [
      {
        id: 'ticket',
        texto: 'Busca os nomes dos itens e imprime o ticket',
        regiao_id: 'fogao',
      },
      {
        id: 'ready',
        texto: '`UPDATE orders` marca o pedido como `ready`',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
      { id: 'chega', texto: '`onOrderPaid` entrega o evento a `cook`', regiao_id: 'fogao' },
      {
        id: 'espera',
        texto: 'Espera o tempo de `cookingTimeMs`',
        regiao_id: 'fogao',
      },
      {
        id: 'cooking',
        texto: '`UPDATE orders` marca o pedido como `cooking`',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
    ],
    gabarito: ['chega', 'cooking', 'ticket', 'espera', 'ready'],
    explicacao:
      'O status `cooking` vem antes de tudo, até do ticket. Depois a cozinha espera a soma dos ' +
      'tempos de preparo e só então grava `ready`. As duas mudanças de status saem da região por ' +
      'uma Consulta ao banco.',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 28,
        linha_fim: 37,
        trecho:
          'async function cook(event: OrderPaidEvent): Promise<void> {\n' +
          '  console.log(`Order ${event.orderId} reached the stove`);\n' +
          '  try {\n' +
          "    await setStatus(event.orderId, 'cooking');\n" +
          '    const lines = await ticketLinesFor(event);\n' +
          '    console.log(printTicket(event.orderId, lines));\n' +
          '    const time = cookingTimeMs(lines);\n' +
          '    await new Promise((resolve) => setTimeout(resolve, time));\n' +
          "    await setStatus(event.orderId, 'ready');\n" +
          '    console.log(`Order ${event.orderId} is ready`);',
      },
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 42,
        linha_fim: 42,
        trecho: '  const stop = await onOrderPaid(cook);',
      },
    ],
  },
  {
    id: 'fogao-fluxo-evento',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o caminho de um pedido, da gravação na API até o fogo aceso:',
    dificuldade: 5,
    opcoes: [
      { id: 'cook', texto: '`cook` recebe o evento', regiao_id: 'fogao' },
      {
        id: 'publica',
        texto: 'A API publica `order.paid` no Redis',
        regiao_id: 'api-pedidos',
        ligacao: 'evento',
      },
      {
        id: 'cooking',
        texto: 'O status do pedido vira `cooking`',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
      {
        id: 'parse',
        texto: '`parse` confere que a mensagem é um `order.paid`',
        regiao_id: 'fogao',
      },
      {
        id: 'grava',
        texto: 'O pedido é gravado como `paid`',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
    ],
    gabarito: ['grava', 'publica', 'parse', 'cook', 'cooking'],
    explicacao:
      'A API só publica depois de gravar. O Evento chega pelo Redis ao assinante da cozinha, que ' +
      'confere o canal e o formato antes de chamar `cook` — sem esperar o resultado (`void`). O ' +
      'primeiro passo de `cook` é uma Consulta: o `UPDATE` para `cooking`.',
    evidencias: [
      {
        caminho: 'kitchen/src/queue.ts',
        linha_inicio: 11,
        linha_fim: 21,
        trecho:
          '  await subscriber.subscribe(ORDER_PAID_CHANNEL);\n' +
          '\n' +
          "  subscriber.on('message', (channel, message) => {\n" +
          '    if (channel !== ORDER_PAID_CHANNEL) return;\n' +
          '    const event = parse(message);\n' +
          '    if (!event) {\n' +
          "      console.warn('Kitchen got a note it cannot read:', message);\n" +
          '      return;\n' +
          '    }\n' +
          '    void listener(event);\n' +
          '  });',
      },
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 28,
        linha_fim: 31,
        trecho:
          'async function cook(event: OrderPaidEvent): Promise<void> {\n' +
          '  console.log(`Order ${event.orderId} reached the stove`);\n' +
          '  try {\n' +
          "    await setStatus(event.orderId, 'cooking');",
      },
    ],
  },
];
