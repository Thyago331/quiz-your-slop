// Textos em espanhol dos Desafios de ../carrinho-checkout.ts — Carrito y Pago (Salón). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const CARRINHO_E_CHECKOUT_ES: TextosDaRegiao = {
  'carrinho-rota-pagar': {
    enunciado: 'Cuando el cliente hace clic en Pagar, ¿qué ruta de la API se llama?',
    opcoes: {
      a: '`POST /checkout`',
      b: '`POST /orders`',
      c: '`PUT /cart`',
      d: '`POST /payments`',
    },
    explicacao:
      '`pay()` manda el carrito entero en un solo `POST` a `${API_URL}/orders`. No hay una ' +
      'ruta de pago aparte: crear el pedido y cobrarlo ocurren en la misma llamada.',
  },
  'carrinho-badge-conta': {
    enunciado:
      'El carrito tiene 2 Dragonfire Ale y 1 Honey Cake. ¿Qué número aparece en la insignia ' +
      '"Your tab" de la cabecera?',
    opcoes: {
      a: '2: uno por línea del carrito',
      b: '3: la suma de las cantidades',
      c: 'El total en oro',
      d: 'Ninguno: la insignia solo aparece en el pago',
    },
    explicacao:
      'El `CartBadge` muestra `count`, que `useCart` calcula sumando la cantidad de cada ' +
      'línea: 2 + 1 = 3. Con el carrito vacío, el número desaparece.',
  },
  'carrinho-total-arredonda': {
    enunciado:
      'El subtotal del carrito es de 10 de oro y el impuesto del rey es del 8 %. ¿Qué ' +
      'muestra el botón de pagar?',
    opcoes: {
      a: '"Pay 10 gold, 80 copper"',
      b: '"Pay 10 gold"',
      c: '"Pay 11 gold"',
      d: '"Pay 10 gold, 8 copper"',
    },
    explicacao:
      '`useCart` redondea el total hacia arriba con `Math.ceil`, para que el cliente "nunca ' +
      'vea cobre suelto": 10 + 0,8 se vuelve 11. Guárdate ese número y compáralo con lo que ' +
      'cobra la API al otro lado del `POST /orders`.',
  },
  'carrinho-erro-pagamento': {
    enunciado:
      'La API responde al `POST /orders` con un 402 y `{ "error": "The Dwarf Vault declined ' +
      'the payment: over_the_vault_limit" }`. ¿Qué hace la pantalla de pago?',
    opcoes: {
      a: 'Muestra el mensaje del `error` y deja el carrito como estaba',
      b: 'Vacía el carrito y muestra "Payment failed"',
      c: 'Muestra "Paid! The kitchen is on it."',
      d: 'Vuelve a intentar el pago por su cuenta',
    },
    explicacao:
      'Con `res.ok` en falso, `pay()` lanza un error con el mensaje que vino de la API (o ' +
      '"Payment failed", si no vino ninguno) y el `catch` pone el estado en `error`. ' +
      '`cart.clear()` solo corre en el camino del éxito, así que el carrito queda intacto.',
  },
  'carrinho-quantidade-25': {
    enunciado:
      'En la pantalla de pago, el cliente escribe 25 en la cantidad de una línea. ¿Qué pasa?',
    opcoes: {
      a: 'El campo no deja pasar de 20',
      b: 'El carrito recorta la cantidad a 20',
      c: 'El carrito acepta 25; solo al pagar la API rechaza la línea',
      d: 'La línea sale del carrito',
    },
    explicacao:
      'El campo solo tiene `min={0}`, y `setQuantity` acepta cualquier número positivo. El ' +
      'límite de 20 por línea existe solo en la API de Pedidos (`MAX_PER_LINE`): el cliente ' +
      've 25 en el carrito y recibe un 400 al pagar. Una regla que vive en un solo lado del ' +
      'Enlace.',
  },
  'carrinho-total-divergente': {
    enunciado:
      'El botón muestra "Pay 11 gold" para un subtotal de 10 de oro. ¿Cuánto cobra la API, y ' +
      'por qué?',
    opcoes: {
      a: '11 de oro: la pantalla de pago manda el total en el cuerpo del pedido',
      b: '11 de oro: la API usa el mismo `useCart`',
      c: '10 de oro: el impuesto solo aparece en pantalla',
      d:
        '10,8 de oro: el cuerpo solo lleva ítems y cantidades, y la API recalcula sin ' +
        'redondear',
    },
    explicacao:
      'El cuerpo del `POST /orders` lleva `orderRef`, `customerName` y las líneas con ' +
      '`itemId` y `quantity`: ningún precio, ningún total. La API lo recalcula todo en ' +
      '`validateOrder()` y cobra 10,8, sin el `Math.ceil` del front. La misma regla escrita ' +
      'dos veces, de maneras distintas: el cliente ve un precio y paga otro.',
  },
  'carrinho-onde-total': {
    enunciado: 'Señala dónde se calcula el total que muestra la pantalla de pago.',
    explicacao:
      'El `Checkout` solo muestra `cart.total`. Quien calcula el subtotal, el impuesto y el ' +
      'total es `useCart`, en cada renderizado, a partir de las líneas guardadas en el ' +
      'contexto.',
  },
  'carrinho-onde-reducer': {
    enunciado:
      'Señala la función que decide cómo cambia el carrito con cada acción (`add`, `remove`, ' +
      '`setQuantity`, `clear`).',
    explicacao:
      '`useCart` solo despacha acciones y el `CartProvider` solo guarda el estado con ' +
      '`useReducer`; quien decide el nuevo carrito para cada acción es `cartReducer`. Por ' +
      'ejemplo, un `add` de un ítem que ya está en el carrito suma 1 a esa misma línea.',
  },
  'carrinho-onde-order-ref': {
    enunciado: '¿Dónde nace el `orderRef` que identifica el pedido enviado a la API?',
    explicacao:
      'El `Checkout` genera el `orderRef` con `crypto.randomUUID()` dentro de un `useMemo` ' +
      'sin dependencias: uno por cada visita a la pantalla de pago. La API solo lo lee en ' +
      '`parseCreateOrder` y lo usa como `id` del pedido.',
  },
  'carrinho-fluxo-pagar': {
    enunciado: 'Ordena lo que pasa cuando el cliente hace clic en Pagar y todo sale bien:',
    opcoes: {
      limpa: '`cart.clear()` vacía el carrito',
      pagando: 'El estado pasa a `paying` y el botón muestra "Counting coins..."',
      api: '`createOrderHandler` recibe el pedido',
      monta: '`pay()` arma el cuerpo con `orderRef`, nombre y líneas',
      pago: 'El estado pasa a `paid` con la respuesta de la API',
    },
    explicacao:
      '`pay()` arma el cuerpo, marca `paying` (el botón queda deshabilitado) y hace el `POST ' +
      '/orders`, que sale de la región por una Llamada. Con una buena respuesta, el estado ' +
      'pasa a `paid` y solo entonces se vacía el carrito.',
  },
  'carrinho-fluxo-total-ate-cobranca': {
    enunciado: 'Ordena el camino del total, desde el carrito hasta el cobro en el Cofre del Enano:',
    opcoes: {
      recalcula: '`validateOrder()` recalcula el total, sin redondear',
      arredonda: '`useCart` redondea el total hacia arriba con `Math.ceil`',
      cobra: '`charge()` cobra el total de la API',
      soma: '`sumLines()` suma el subtotal del carrito',
      envia: '`pay()` envía solo ítems y cantidades',
    },
    explicacao:
      'El total de la pantalla nace en `useCart`, con la suma del Grimorio y el `Math.ceil`. ' +
      'Pero ese número nunca sale del navegador: `pay()` manda solo ítems y cantidades, la ' +
      'API recalcula a su manera y es ese otro total el que cobra el Cofre del Enano.',
  },
};
