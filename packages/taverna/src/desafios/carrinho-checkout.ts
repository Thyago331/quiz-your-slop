// Desafios do Carrinho e Checkout (Salão): o estado do carrinho, o botão Pagar e o POST /orders.
// Aqui mora metade do total divergente: o front arredonda para cima, a API não.
import type { DesafioTaverna } from './tipo.ts';

export const CARRINHO_E_CHECKOUT: readonly DesafioTaverna[] = [
  {
    id: 'carrinho-rota-pagar',
    formato: 'multipla_escolha',
    enunciado: 'Quando o cliente clica em Pagar, qual rota da API é chamada?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '`POST /checkout`' },
      { id: 'b', texto: '`POST /orders`' },
      { id: 'c', texto: '`PUT /cart`' },
      { id: 'd', texto: '`POST /payments`' },
    ],
    gabarito: ['b'],
    explicacao:
      '`pay()` manda o carrinho inteiro num só `POST` para `${API_URL}/orders`. Não existe rota ' +
      'de pagamento separada: criar o pedido e cobrar acontecem na mesma chamada.',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 42,
        linha_fim: 46,
        trecho:
          '      const res = await fetch(`${API_URL}/orders`, {\n' +
          "        method: 'POST',\n" +
          "        headers: { 'Content-Type': 'application/json' },\n" +
          '        body: JSON.stringify(body),\n' +
          '      });',
      },
    ],
  },
  {
    id: 'carrinho-badge-conta',
    formato: 'multipla_escolha',
    enunciado:
      'O carrinho tem 2 Dragonfire Ale e 1 Honey Cake. Que número aparece no selo "Your tab" do ' +
      'cabeçalho?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: '2: uma por linha do carrinho' },
      { id: 'b', texto: '3: a soma das quantidades' },
      { id: 'c', texto: 'O total em ouro' },
      { id: 'd', texto: 'Nenhum: o selo só aparece no Checkout' },
    ],
    gabarito: ['b'],
    explicacao:
      'O `CartBadge` mostra `count`, que o `useCart` calcula somando a quantidade de cada linha: ' +
      '2 + 1 = 3. Com o carrinho vazio, o número some.',
    evidencias: [
      {
        caminho: 'web/src/cart/useCart.ts',
        linha_inicio: 25,
        linha_fim: 25,
        trecho: '    count: lines.reduce((n, line) => n + line.quantity, 0),',
      },
      {
        caminho: 'web/src/components/CartBadge.tsx',
        linha_inicio: 4,
        linha_fim: 7,
        trecho:
          '  const { count } = useCart();\n' +
          '  return (\n' +
          '    <button className="cart-badge" onClick={onClick} aria-label="Open your tab">\n' +
          '      Your tab {count > 0 && <span className="count">{count}</span>}',
      },
    ],
  },
  {
    id: 'carrinho-total-arredonda',
    formato: 'multipla_escolha',
    enunciado:
      'O subtotal do carrinho é 10 de ouro e o imposto do rei é 8%. O que o botão de pagar ' +
      'mostra?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: '"Pay 10 gold, 80 copper"' },
      { id: 'b', texto: '"Pay 10 gold"' },
      { id: 'c', texto: '"Pay 11 gold"' },
      { id: 'd', texto: '"Pay 10 gold, 8 copper"' },
    ],
    gabarito: ['c'],
    explicacao:
      'O `useCart` arredonda o total para cima com `Math.ceil`, para o cliente "nunca ver cobre ' +
      'solto": 10 + 0,8 vira 11. Guarde esse número e compare com o que a API cobra do outro lado ' +
      'do `POST /orders`.',
    evidencias: [
      {
        caminho: 'web/src/cart/useCart.ts',
        linha_inicio: 16,
        linha_fim: 18,
        trecho:
          '  const tax = subtotal * KINGS_TAX_RATE;\n' +
          '  // Round up so the customer never sees loose copper at checkout.\n' +
          '  const total = Math.ceil(subtotal + tax);',
      },
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 89,
        linha_fim: 89,
        trecho:
          "        {status.kind === 'paying' ? 'Counting coins...' : `Pay ${formatGold(cart.total)}`}",
      },
    ],
  },
  {
    id: 'carrinho-erro-pagamento',
    formato: 'multipla_escolha',
    enunciado:
      'A API responde o `POST /orders` com 402 e `{ "error": "The Dwarf Vault declined the ' +
      'payment: over_the_vault_limit" }`. O que o Checkout faz?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'Mostra a mensagem do `error` e mantém o carrinho como estava' },
      { id: 'b', texto: 'Esvazia o carrinho e mostra "Payment failed"' },
      { id: 'c', texto: 'Mostra "Paid! The kitchen is on it."' },
      { id: 'd', texto: 'Tenta pagar de novo sozinho' },
    ],
    gabarito: ['a'],
    explicacao:
      'Com `res.ok` falso, `pay()` lança um erro com a mensagem que veio da API (ou "Payment ' +
      'failed", se não veio nenhuma) e o `catch` põe o status em `error`. `cart.clear()` só roda ' +
      'no caminho do sucesso, então o carrinho fica intacto.',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 47,
        linha_fim: 53,
        trecho:
          '      const data = await res.json();\n' +
          "      if (!res.ok) throw new Error(data.error ?? 'Payment failed');\n" +
          "      setStatus({ kind: 'paid', order: data as CreateOrderResponse });\n" +
          '      cart.clear();\n' +
          '    } catch (err) {\n' +
          "      setStatus({ kind: 'error', message: (err as Error).message });\n" +
          '    }',
      },
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 87,
        linha_fim: 87,
        trecho: '      {status.kind === \'error\' && <p className="error">{status.message}</p>}',
      },
    ],
  },
  {
    id: 'carrinho-quantidade-25',
    formato: 'multipla_escolha',
    enunciado: 'No Checkout, o cliente digita 25 na quantidade de uma linha. O que acontece?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: 'O campo não deixa passar de 20' },
      { id: 'b', texto: 'O carrinho corta a quantidade para 20' },
      { id: 'c', texto: 'O carrinho aceita 25; só ao pagar a API recusa a linha' },
      { id: 'd', texto: 'A linha sai do carrinho' },
    ],
    gabarito: ['c'],
    explicacao:
      'O campo só tem `min={0}`, e `setQuantity` aceita qualquer número positivo. O limite de 20 ' +
      'por linha existe só na API de Pedidos (`MAX_PER_LINE`): o cliente vê 25 no carrinho e ' +
      'recebe um 400 ao pagar. Regra que vive de um lado só da Ligação.',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 64,
        linha_fim: 69,
        trecho:
          '            <input\n' +
          '              type="number"\n' +
          '              min={0}\n' +
          '              value={line.quantity}\n' +
          '              onChange={(e) => cart.setQuantity(line.item.id, Number(e.target.value))}\n' +
          '            />',
      },
      {
        caminho: 'web/src/cart/CartContext.tsx',
        linha_inicio: 28,
        linha_fim: 34,
        trecho:
          "    case 'setQuantity':\n" +
          '      if (action.quantity <= 0) {\n' +
          '        return lines.filter((line) => line.item.id !== action.itemId);\n' +
          '      }\n' +
          '      return lines.map((line) =>\n' +
          '        line.item.id === action.itemId ? { ...line, quantity: action.quantity } : line,\n' +
          '      );',
      },
    ],
  },
  {
    id: 'carrinho-total-divergente',
    formato: 'multipla_escolha',
    enunciado:
      'O botão mostra "Pay 11 gold" para um subtotal de 10 de ouro. Quanto a API cobra, e por quê?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: '11 de ouro: o Checkout manda o total no corpo do pedido' },
      { id: 'b', texto: '11 de ouro: a API usa o mesmo `useCart`' },
      { id: 'c', texto: '10 de ouro: o imposto só aparece na tela' },
      {
        id: 'd',
        texto:
          '10,8 de ouro: o corpo só leva itens e quantidades, e a API recalcula sem arredondar',
      },
    ],
    gabarito: ['d'],
    explicacao:
      'O corpo do `POST /orders` tem `orderRef`, `customerName` e as linhas com `itemId` e ' +
      '`quantity` — nenhum preço, nenhum total. A API recalcula tudo em `validateOrder()` e cobra ' +
      '10,8, sem o `Math.ceil` do front. A mesma regra escrita duas vezes, de jeitos diferentes: ' +
      'o cliente vê um preço e paga outro.',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 34,
        linha_fim: 38,
        trecho:
          '    const body: CreateOrderRequest = {\n' +
          '      orderRef,\n' +
          '      customerName,\n' +
          '      lines: cart.lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),\n' +
          '    };',
      },
      {
        caminho: 'web/src/cart/useCart.ts',
        linha_inicio: 17,
        linha_fim: 18,
        trecho:
          '  // Round up so the customer never sees loose copper at checkout.\n' +
          '  const total = Math.ceil(subtotal + tax);',
      },
    ],
  },
  {
    id: 'carrinho-onde-total',
    formato: 'apontar',
    enunciado: 'Aponte onde o total mostrado no Checkout é calculado.',
    dificuldade: 1,
    opcoes: [
      { id: 'a', caminho: 'web/src/pages/Checkout.tsx', simbolo: 'Checkout' },
      { id: 'b', caminho: 'web/src/cart/CartContext.tsx', simbolo: 'cartReducer' },
      { id: 'c', caminho: 'web/src/cart/useCart.ts', simbolo: 'useCart' },
      { id: 'd', caminho: 'web/src/components/CartBadge.tsx', simbolo: 'CartBadge' },
    ],
    gabarito: ['c'],
    explicacao:
      'O `Checkout` só mostra `cart.total`. Quem calcula subtotal, imposto e total é o `useCart`, ' +
      'a cada renderização, a partir das linhas guardadas no contexto.',
    evidencias: [
      {
        caminho: 'web/src/cart/useCart.ts',
        linha_inicio: 13,
        linha_fim: 18,
        trecho:
          '  const subtotal = sumLines(\n' +
          '    lines.map((line) => ({ unitPrice: line.item.price, quantity: line.quantity })),\n' +
          '  );\n' +
          '  const tax = subtotal * KINGS_TAX_RATE;\n' +
          '  // Round up so the customer never sees loose copper at checkout.\n' +
          '  const total = Math.ceil(subtotal + tax);',
      },
    ],
  },
  {
    id: 'carrinho-onde-reducer',
    formato: 'apontar',
    enunciado:
      'Aponte a função que decide como o carrinho muda a cada ação (`add`, `remove`, ' +
      '`setQuantity`, `clear`).',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'web/src/cart/CartContext.tsx', simbolo: 'cartReducer' },
      { id: 'b', caminho: 'web/src/cart/useCart.ts', simbolo: 'useCart' },
      { id: 'c', caminho: 'web/src/cart/CartContext.tsx', simbolo: 'CartProvider' },
      { id: 'd', caminho: 'web/src/pages/Checkout.tsx', simbolo: 'Checkout' },
    ],
    gabarito: ['a'],
    explicacao:
      '`useCart` só despacha ações e o `CartProvider` só guarda o estado com `useReducer`; quem ' +
      'decide o novo carrinho para cada ação é o `cartReducer`. Por exemplo, `add` de um item que ' +
      'já está no carrinho soma 1 na mesma linha.',
    evidencias: [
      {
        caminho: 'web/src/cart/CartContext.tsx',
        linha_inicio: 15,
        linha_fim: 25,
        trecho:
          'function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {\n' +
          '  switch (action.type) {\n' +
          "    case 'add': {\n" +
          '      const existing = lines.find((line) => line.item.id === action.item.id);\n' +
          '      if (existing) {\n' +
          '        return lines.map((line) =>\n' +
          '          line === existing ? { ...line, quantity: line.quantity + 1 } : line,\n' +
          '        );\n' +
          '      }\n' +
          '      return [...lines, { item: action.item, quantity: 1 }];\n' +
          '    }',
      },
      {
        caminho: 'web/src/cart/CartContext.tsx',
        linha_inicio: 46,
        linha_fim: 46,
        trecho: '  const [lines, dispatch] = useReducer(cartReducer, []);',
      },
    ],
  },
  {
    id: 'carrinho-onde-order-ref',
    formato: 'apontar',
    enunciado: 'Onde nasce o `orderRef` que identifica o pedido enviado à API?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'web/src/cart/useCart.ts', simbolo: 'useCart' },
      { id: 'b', caminho: 'web/src/pages/Checkout.tsx', simbolo: 'Checkout' },
      { id: 'c', caminho: 'web/src/cart/CartContext.tsx', simbolo: 'cartReducer' },
      { id: 'd', caminho: 'api/src/routes/orders.ts', simbolo: 'parseCreateOrder' },
    ],
    gabarito: ['b'],
    explicacao:
      'O `Checkout` gera o `orderRef` com `crypto.randomUUID()` dentro de um `useMemo` sem ' +
      'dependências: um por visita ao Checkout. A API só o lê em `parseCreateOrder` e o usa como ' +
      '`id` do pedido.',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 17,
        linha_fim: 18,
        trecho:
          '  // One reference per visit to the checkout: retries reuse it, so they are the same order.\n' +
          '  const orderRef = useMemo(() => crypto.randomUUID(), []);',
      },
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 34,
        linha_fim: 35,
        trecho: '    const body: CreateOrderRequest = {\n' + '      orderRef,',
      },
    ],
  },
  {
    id: 'carrinho-fluxo-pagar',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que acontece quando o cliente clica em Pagar e tudo dá certo:',
    dificuldade: 3,
    opcoes: [
      { id: 'limpa', texto: '`cart.clear()` esvazia o carrinho', regiao_id: 'carrinho-checkout' },
      {
        id: 'pagando',
        texto: 'O status vira `paying` e o botão mostra "Counting coins..."',
        regiao_id: 'carrinho-checkout',
      },
      {
        id: 'api',
        texto: '`createOrderHandler` recebe o pedido',
        regiao_id: 'api-pedidos',
        ligacao: 'chamada',
      },
      {
        id: 'monta',
        texto: '`pay()` monta o corpo com `orderRef`, nome e linhas',
        regiao_id: 'carrinho-checkout',
      },
      {
        id: 'pago',
        texto: 'O status vira `paid` com a resposta da API',
        regiao_id: 'carrinho-checkout',
      },
    ],
    gabarito: ['monta', 'pagando', 'api', 'pago', 'limpa'],
    explicacao:
      '`pay()` monta o corpo, marca `paying` (o botão fica desabilitado) e faz o `POST /orders`, ' +
      'que sai da região por uma Chamada. Com a resposta boa, o status vira `paid` e só então o ' +
      'carrinho é esvaziado.',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 33,
        linha_fim: 50,
        trecho:
          '  async function pay() {\n' +
          '    const body: CreateOrderRequest = {\n' +
          '      orderRef,\n' +
          '      customerName,\n' +
          '      lines: cart.lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),\n' +
          '    };\n' +
          '\n' +
          "    setStatus({ kind: 'paying' });\n" +
          '    try {\n' +
          '      const res = await fetch(`${API_URL}/orders`, {\n' +
          "        method: 'POST',\n" +
          "        headers: { 'Content-Type': 'application/json' },\n" +
          '        body: JSON.stringify(body),\n' +
          '      });\n' +
          '      const data = await res.json();\n' +
          "      if (!res.ok) throw new Error(data.error ?? 'Payment failed');\n" +
          "      setStatus({ kind: 'paid', order: data as CreateOrderResponse });\n" +
          '      cart.clear();',
      },
    ],
  },
  {
    id: 'carrinho-fluxo-total-ate-cobranca',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o caminho do total, do carrinho até a cobrança no Cofre do Anão:',
    dificuldade: 5,
    opcoes: [
      {
        id: 'recalcula',
        texto: '`validateOrder()` recalcula o total, sem arredondar',
        regiao_id: 'api-pedidos',
        ligacao: 'chamada',
      },
      {
        id: 'arredonda',
        texto: '`useCart` arredonda o total para cima com `Math.ceil`',
        regiao_id: 'carrinho-checkout',
      },
      {
        id: 'cobra',
        texto: '`charge()` cobra o total da API',
        regiao_id: 'cofre-anao',
        ligacao: 'dependencia',
      },
      {
        id: 'soma',
        texto: '`sumLines()` soma o subtotal do carrinho',
        regiao_id: 'grimorio',
        ligacao: 'dependencia',
      },
      {
        id: 'envia',
        texto: '`pay()` envia só itens e quantidades',
        regiao_id: 'carrinho-checkout',
      },
    ],
    gabarito: ['soma', 'arredonda', 'envia', 'recalcula', 'cobra'],
    explicacao:
      'O total da tela nasce no `useCart`, com a soma do Grimório e o `Math.ceil`. Mas esse ' +
      'número nunca sai do navegador: `pay()` manda só itens e quantidades, a API recalcula do ' +
      'seu jeito e é esse outro total que o Cofre do Anão cobra.',
    evidencias: [
      {
        caminho: 'web/src/cart/useCart.ts',
        linha_inicio: 13,
        linha_fim: 18,
        trecho:
          '  const subtotal = sumLines(\n' +
          '    lines.map((line) => ({ unitPrice: line.item.price, quantity: line.quantity })),\n' +
          '  );\n' +
          '  const tax = subtotal * KINGS_TAX_RATE;\n' +
          '  // Round up so the customer never sees loose copper at checkout.\n' +
          '  const total = Math.ceil(subtotal + tax);',
      },
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 34,
        linha_fim: 38,
        trecho:
          '    const body: CreateOrderRequest = {\n' +
          '      orderRef,\n' +
          '      customerName,\n' +
          '      lines: cart.lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),\n' +
          '    };',
      },
    ],
  },
];
