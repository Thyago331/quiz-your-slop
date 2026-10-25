// Desafios do Grimório (Balcão, shared/): a moeda, o imposto do rei e os tipos que o site, a API e
// a cozinha compartilham. Toda Ligação dele é Dependência: as outras regiões o importam.
import type { DesafioTaverna } from './tipo.ts';

export const GRIMORIO: readonly DesafioTaverna[] = [
  {
    id: 'grimorio-cobre-por-ouro',
    formato: 'multipla_escolha',
    enunciado: 'Na Taverna, quantas moedas de cobre vale uma moeda de ouro?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '10' },
      { id: 'b', texto: '100' },
      { id: 'c', texto: '1000' },
      { id: 'd', texto: '8' },
    ],
    gabarito: ['b'],
    explicacao:
      '`COPPER_PER_GOLD` vale 100. Os preços ficam guardados em ouro, com fração; o cobre só ' +
      'aparece na hora de escrever o valor.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 2,
        linha_fim: 4,
        trecho:
          '// Prices are stored in gold coins. One gold coin is worth 100 copper.\n' +
          '\n' +
          'export const COPPER_PER_GOLD = 100;',
      },
    ],
  },
  {
    id: 'grimorio-format-dois-e-meio',
    formato: 'multipla_escolha',
    enunciado: 'O que `formatGold(2.5)` devolve?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: '`"2.50 gold"`' },
      { id: 'b', texto: '`"2 gold, 5 copper"`' },
      { id: 'c', texto: '`"250 copper"`' },
      { id: 'd', texto: '`"2 gold, 50 copper"`' },
    ],
    gabarito: ['d'],
    explicacao:
      'O ouro é a parte inteira (`Math.floor`) e o cobre é o resto vezes 100, arredondado: 2 de ' +
      'ouro e 50 de cobre. Com as duas partes diferentes de zero, o texto traz as duas.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 9,
        linha_fim: 15,
        trecho:
          'export function formatGold(amount: number): string {\n' +
          '  const gold = Math.floor(amount);\n' +
          '  const copper = Math.round((amount - gold) * COPPER_PER_GOLD);\n' +
          '  if (copper === 0) return `${gold} gold`;\n' +
          '  if (gold === 0) return `${copper} copper`;\n' +
          '  return `${gold} gold, ${copper} copper`;\n' +
          '}',
      },
    ],
  },
  {
    id: 'grimorio-preco-em-ouro',
    formato: 'multipla_escolha',
    enunciado: 'Em que unidade vem o `price` de um `Item`?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: 'Em cobre, sempre inteiro' },
      { id: 'b', texto: 'Em ouro, com fração para os cobres' },
      { id: 'c', texto: 'Num texto já formatado, como `"2 gold"`' },
      { id: 'd', texto: 'Em ouro, já com o imposto do rei' },
    ],
    gabarito: ['b'],
    explicacao:
      'O tipo diz `price: number; // in gold`, e o cabeçalho de `money.ts` confirma: preços ' +
      'ficam em ouro. Um preço de 2,50 é 2 de ouro e 50 de cobre. O imposto entra depois, sobre a ' +
      'soma do pedido.',
    evidencias: [
      {
        caminho: 'shared/types.ts',
        linha_inicio: 12,
        linha_fim: 12,
        trecho: '  price: number; // in gold',
      },
      {
        caminho: 'shared/money.ts',
        linha_inicio: 2,
        linha_fim: 2,
        trecho: '// Prices are stored in gold coins. One gold coin is worth 100 copper.',
      },
    ],
  },
  {
    id: 'grimorio-corpo-do-pedido',
    formato: 'multipla_escolha',
    enunciado: 'Pelo tipo `CreateOrderRequest`, o que o site manda para a API em `POST /orders`?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'O `Order` inteiro, com subtotal, imposto e total' },
      { id: 'b', texto: 'Só o total a cobrar' },
      { id: 'c', texto: '`orderRef`, o nome e as linhas com `itemId` e `quantity` — sem preços' },
      { id: 'd', texto: 'Os itens com preço, para a API não precisar ir ao banco' },
    ],
    gabarito: ['c'],
    explicacao:
      'O pedido leva só quem pede e o quê; preço, imposto e total não fazem parte do contrato. Por ' +
      'isso a API busca os preços no banco e calcula o total de novo — e a resposta ' +
      '(`CreateOrderResponse`) devolve o `total` que ela calculou.',
    evidencias: [
      {
        caminho: 'shared/types.ts',
        linha_inicio: 35,
        linha_fim: 45,
        trecho:
          'export interface CreateOrderRequest {\n' +
          '  orderRef: string;\n' +
          '  customerName: string;\n' +
          '  lines: { itemId: number; quantity: number }[];\n' +
          '}\n' +
          '\n' +
          'export interface CreateOrderResponse {\n' +
          '  orderId: string;\n' +
          '  status: OrderStatus;\n' +
          '  total: number;\n' +
          '}',
      },
    ],
  },
  {
    id: 'grimorio-onde-nasce-a-diferenca',
    formato: 'multipla_escolha',
    enunciado:
      'O Carrinho e a API usam o mesmo `sumLines` e o mesmo `KINGS_TAX_RATE`, mas o cliente vê um ' +
      'total e paga outro. O que o Grimório tem a ver com isso?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: '`sumLines` arredonda quando roda no navegador' },
      {
        id: 'b',
        texto: 'Nada: o Grimório não arredonda; a diferença nasce em quem calcula o total',
      },
      { id: 'c', texto: '`formatGold` arredonda o total que é cobrado' },
      { id: 'd', texto: 'O site e a API leem taxas diferentes' },
    ],
    gabarito: ['b'],
    explicacao:
      'O Grimório só oferece a taxa e a soma das linhas, sem arredondar nada. O total em si não ' +
      'mora aqui: cada lado o calcula por conta própria — o `useCart` arredonda para cima, a API ' +
      'não. Uma regra de negócio duplicada fora do lugar compartilhado.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 6,
        linha_fim: 7,
        trecho:
          '// The king takes his share of every order served in the realm.\n' +
          'export const KINGS_TAX_RATE = 0.08;',
      },
      {
        caminho: 'shared/money.ts',
        linha_inicio: 25,
        linha_fim: 27,
        trecho:
          'export function sumLines(lines: { unitPrice: number; quantity: number }[]): number {\n' +
          '  return lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);\n' +
          '}',
      },
    ],
  },
  {
    id: 'grimorio-cem-cobres',
    formato: 'multipla_escolha',
    enunciado: 'O que `formatGold(2.999)` devolve?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: '`"3 gold"`' },
      { id: 'b', texto: '`"2 gold, 99 copper"`' },
      { id: 'c', texto: '`"2 gold, 100 copper"`' },
      { id: 'd', texto: '`"2 gold, 1 copper"`' },
    ],
    gabarito: ['c'],
    explicacao:
      'O ouro é cortado antes (2) e só o cobre é arredondado: 99,9 vira 100. Nada leva esses 100 ' +
      'cobres de volta para o ouro, então o texto sai "2 gold, 100 copper". Caso de borda de quem ' +
      'arredonda as partes separadas.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 9,
        linha_fim: 15,
        trecho:
          'export function formatGold(amount: number): string {\n' +
          '  const gold = Math.floor(amount);\n' +
          '  const copper = Math.round((amount - gold) * COPPER_PER_GOLD);\n' +
          '  if (copper === 0) return `${gold} gold`;\n' +
          '  if (gold === 0) return `${copper} copper`;\n' +
          '  return `${gold} gold, ${copper} copper`;\n' +
          '}',
      },
    ],
  },
  {
    id: 'grimorio-onde-imposto',
    formato: 'apontar',
    enunciado: 'Onde fica definida a taxa do imposto do rei (os 8%)?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
      { id: 'b', caminho: 'shared/money.ts', simbolo: 'KINGS_TAX_RATE' },
      { id: 'c', caminho: 'web/src/cart/useCart.ts', simbolo: 'useCart' },
      { id: 'd', caminho: 'shared/money.ts', simbolo: 'COPPER_PER_GOLD' },
    ],
    gabarito: ['b'],
    explicacao:
      '`KINGS_TAX_RATE = 0.08` mora no Grimório. `validateOrder()` e `useCart` só a usam — cada ' +
      'um na sua conta.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 6,
        linha_fim: 7,
        trecho:
          '// The king takes his share of every order served in the realm.\n' +
          'export const KINGS_TAX_RATE = 0.08;',
      },
    ],
  },
  {
    id: 'grimorio-onde-categorias',
    formato: 'apontar',
    enunciado:
      'Aponte a lista de categorias que o filtro do Cardápio percorre para criar os botões.',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'web/src/components/CategoryFilter.tsx', simbolo: 'LABELS' },
      { id: 'b', caminho: 'db/schema.sql', simbolo: 'category' },
      { id: 'c', caminho: 'kitchen/src/tickets.ts', simbolo: 'STATION' },
      { id: 'd', caminho: 'shared/types.ts', simbolo: 'CATEGORIES' },
    ],
    gabarito: ['d'],
    explicacao:
      'O filtro percorre `CATEGORIES`, do Grimório. Mas as quatro categorias se repetem em outros ' +
      'lugares — o `CHECK` do banco, os rótulos do filtro, as estações da cozinha: uma categoria ' +
      'nova precisa mexer em todos.',
    evidencias: [
      {
        caminho: 'shared/types.ts',
        linha_inicio: 3,
        linha_fim: 5,
        trecho:
          "export type Category = 'drinks' | 'stews' | 'roasts' | 'sweets';\n" +
          '\n' +
          "export const CATEGORIES: Category[] = ['drinks', 'stews', 'roasts', 'sweets'];",
      },
    ],
  },
  {
    id: 'grimorio-onde-evento',
    formato: 'apontar',
    enunciado: 'Onde está definido o formato do evento que a API publica e a cozinha lê?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'api/src/events/publisher.ts', simbolo: 'publishOrderPaid' },
      { id: 'b', caminho: 'shared/types.ts', simbolo: 'OrderPaidEvent' },
      { id: 'c', caminho: 'kitchen/src/queue.ts', simbolo: 'OrderPaidListener' },
      { id: 'd', caminho: 'shared/types.ts', simbolo: 'CreateOrderResponse' },
    ],
    gabarito: ['b'],
    explicacao:
      '`OrderPaidEvent` é o contrato do Evento entre a API de Pedidos e o Fogão: o tipo, o id do ' +
      'pedido, as linhas (só `itemId` e `quantity`) e a hora do pagamento. Os dois lados importam ' +
      'o mesmo tipo do Grimório.',
    evidencias: [
      {
        caminho: 'shared/types.ts',
        linha_inicio: 47,
        linha_fim: 52,
        trecho:
          'export interface OrderPaidEvent {\n' +
          "  type: 'order.paid';\n" +
          '  orderId: string;\n' +
          '  lines: { itemId: number; quantity: number }[];\n' +
          '  paidAt: string;\n' +
          '}',
      },
    ],
  },
  {
    id: 'grimorio-fluxo-format-gold',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que `formatGold(0.5)` faz até devolver o texto:',
    dificuldade: 3,
    opcoes: [
      {
        id: 'zero-ouro',
        texto: 'Vê que o ouro é zero e devolve `"50 copper"`',
        regiao_id: 'grimorio',
      },
      { id: 'ouro', texto: 'Corta o ouro com `Math.floor`: 0', regiao_id: 'grimorio' },
      {
        id: 'confere',
        texto: 'Confere se o cobre é zero: não é',
        regiao_id: 'grimorio',
      },
      {
        id: 'cobre',
        texto: 'Calcula o cobre com `Math.round`: 50',
        regiao_id: 'grimorio',
      },
    ],
    gabarito: ['ouro', 'cobre', 'confere', 'zero-ouro'],
    explicacao:
      'Primeiro separa as partes (ouro inteiro, cobre arredondado), depois escolhe o texto: sem ' +
      'cobre, só ouro; sem ouro, só cobre; senão, os dois.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 9,
        linha_fim: 15,
        trecho:
          'export function formatGold(amount: number): string {\n' +
          '  const gold = Math.floor(amount);\n' +
          '  const copper = Math.round((amount - gold) * COPPER_PER_GOLD);\n' +
          '  if (copper === 0) return `${gold} gold`;\n' +
          '  if (gold === 0) return `${copper} copper`;\n' +
          '  return `${gold} gold, ${copper} copper`;\n' +
          '}',
      },
    ],
  },
  {
    id: 'grimorio-fluxo-quem-usa',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene, no caminho de um pedido, as vezes em que outra região usa o Grimório:',
    dificuldade: 4,
    opcoes: [
      {
        id: 'imposto',
        texto: '`validateOrder()` aplica `KINGS_TAX_RATE`',
        regiao_id: 'api-pedidos',
        ligacao: 'dependencia',
      },
      {
        id: 'card',
        texto: 'O `ItemCard` mostra o preço com `formatGold`',
        regiao_id: 'cardapio',
        ligacao: 'dependencia',
      },
      {
        id: 'api-soma',
        texto: '`createOrder()` soma o subtotal com `sumLines`',
        regiao_id: 'api-pedidos',
        ligacao: 'dependencia',
      },
      {
        id: 'memo',
        texto: '`chargeOrder()` escreve o total no `memo` com `formatGold`',
        regiao_id: 'api-pedidos',
        ligacao: 'dependencia',
      },
      {
        id: 'carrinho',
        texto: 'O `useCart` soma o carrinho com `sumLines`',
        regiao_id: 'carrinho-checkout',
        ligacao: 'dependencia',
      },
    ],
    gabarito: ['card', 'carrinho', 'api-soma', 'imposto', 'memo'],
    explicacao:
      'O Grimório não chama ninguém: são as outras regiões que o importam. O cliente vê o preço no ' +
      'Cardápio, o carrinho soma, e a API soma de novo, aplica o imposto e escreve o total ' +
      'formatado na cobrança — o mesmo código servindo os dois lados da Ligação.',
    evidencias: [
      {
        caminho: 'shared/money.ts',
        linha_inicio: 6,
        linha_fim: 9,
        trecho:
          '// The king takes his share of every order served in the realm.\n' +
          'export const KINGS_TAX_RATE = 0.08;\n' +
          '\n' +
          'export function formatGold(amount: number): string {',
      },
      {
        caminho: 'shared/money.ts',
        linha_inicio: 25,
        linha_fim: 27,
        trecho:
          'export function sumLines(lines: { unitPrice: number; quantity: number }[]): number {\n' +
          '  return lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);\n' +
          '}',
      },
    ],
  },
];
