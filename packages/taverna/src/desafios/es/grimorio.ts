// Textos em espanhol dos Desafios de ../grimorio.ts — Grimorio (Bodega). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const GRIMORIO_ES: TextosDaRegiao = {
  'grimorio-cobre-por-ouro': {
    enunciado: 'En la Taberna, ¿cuántas monedas de cobre vale una moneda de oro?',
    opcoes: {
      a: '10',
      b: '100',
      c: '1000',
      d: '8',
    },
    explicacao:
      '`COPPER_PER_GOLD` vale 100. Los precios se guardan en oro, con decimales; el cobre ' +
      'solo aparece a la hora de escribir el importe.',
  },
  'grimorio-format-dois-e-meio': {
    enunciado: '¿Qué devuelve `formatGold(2.5)`?',
    opcoes: {
      a: '`"2.50 gold"`',
      b: '`"2 gold, 5 copper"`',
      c: '`"250 copper"`',
      d: '`"2 gold, 50 copper"`',
    },
    explicacao:
      'El oro es la parte entera (`Math.floor`) y el cobre es el resto por 100, redondeado: ' +
      '2 de oro y 50 de cobre. Como ninguna de las dos partes es cero, el texto muestra las ' +
      'dos.',
  },
  'grimorio-preco-em-ouro': {
    enunciado: '¿En qué unidad viene el `price` de un `Item`?',
    opcoes: {
      a: 'En cobre, siempre entero',
      b: 'En oro, con decimales para el cobre',
      c: 'En un texto ya formateado, como `"2 gold"`',
      d: 'En oro, ya con el impuesto del rey',
    },
    explicacao:
      'El tipo dice `price: number; // in gold`, y la cabecera de `money.ts` lo confirma: ' +
      'los precios se guardan en oro. Un precio de 2,50 son 2 de oro y 50 de cobre. El ' +
      'impuesto entra después, sobre la suma del pedido.',
  },
  'grimorio-corpo-do-pedido': {
    enunciado:
      'Según el tipo `CreateOrderRequest`, ¿qué le manda el sitio a la API en `POST /orders`?',
    opcoes: {
      a: 'El `Order` entero, con subtotal, impuesto y total',
      b: 'Solo el total a cobrar',
      c: '`orderRef`, el nombre y las líneas con `itemId` y `quantity`, sin precios',
      d: 'Los ítems con su precio, para que la API no tenga que ir a la base de datos',
    },
    explicacao:
      'El pedido lleva solo quién pide y qué; el precio, el impuesto y el total no forman ' +
      'parte del contrato. Por eso la API busca los precios en la base de datos y vuelve a ' +
      'calcular el total, y la respuesta (`CreateOrderResponse`) devuelve el `total` que ' +
      'calculó ella.',
  },
  'grimorio-onde-nasce-a-diferenca': {
    enunciado:
      'Carrito y Pago y la API usan el mismo `sumLines` y el mismo `KINGS_TAX_RATE`, pero el ' +
      'cliente ve un total y paga otro. ¿Qué tiene que ver el Grimorio con eso?',
    opcoes: {
      a: '`sumLines` redondea cuando corre en el navegador',
      b: 'Nada: el Grimorio no redondea; la diferencia nace en quien calcula el total',
      c: '`formatGold` redondea el total que se cobra',
      d: 'El sitio y la API leen tasas distintas',
    },
    explicacao:
      'El Grimorio solo ofrece la tasa y la suma de las líneas, sin redondear nada. El total ' +
      'en sí no vive aquí: cada lado lo calcula por su cuenta, y `useCart` redondea hacia ' +
      'arriba mientras que la API no. Una regla de negocio duplicada fuera del lugar ' +
      'compartido.',
  },
  'grimorio-cem-cobres': {
    enunciado: '¿Qué devuelve `formatGold(2.999)`?',
    opcoes: {
      a: '`"3 gold"`',
      b: '`"2 gold, 99 copper"`',
      c: '`"2 gold, 100 copper"`',
      d: '`"2 gold, 1 copper"`',
    },
    explicacao:
      'El oro se trunca primero (2) y solo el cobre se redondea: 99,9 se vuelve 100. Nada ' +
      'devuelve esos 100 cobres al oro, así que el texto sale "2 gold, 100 copper". Un caso ' +
      'límite de quien redondea las partes por separado.',
  },
  'grimorio-onde-imposto': {
    enunciado: '¿Dónde está definida la tasa del impuesto del rey (el 8 %)?',
    explicacao:
      '`KINGS_TAX_RATE = 0.08` vive en el Grimorio. `validateOrder()` y `useCart` solo la ' +
      'usan, cada uno en su propia cuenta.',
  },
  'grimorio-onde-categorias': {
    enunciado:
      'Señala la lista de categorías que recorre el filtro de la Carta para crear los ' +
      'botones.',
    explicacao:
      'El filtro recorre `CATEGORIES`, del Grimorio. Pero las cuatro categorías se repiten ' +
      'en otros sitios —el `CHECK` de la base de datos, las etiquetas del filtro, las ' +
      'estaciones de la cocina—: una categoría nueva obliga a tocarlos todos.',
  },
  'grimorio-onde-evento': {
    enunciado: '¿Dónde está definido el formato del evento que publica la API y lee la cocina?',
    explicacao:
      '`OrderPaidEvent` es el contrato del Evento entre la API de Pedidos y el Fogón: el ' +
      'tipo, el id del pedido, las líneas (solo `itemId` y `quantity`) y la hora del pago. ' +
      'Los dos lados importan el mismo tipo del Grimorio.',
  },
  'grimorio-fluxo-format-gold': {
    enunciado: 'Ordena lo que hace `formatGold(0.5)` hasta devolver el texto:',
    opcoes: {
      'zero-ouro': 'Ve que el oro es cero y devuelve `"50 copper"`',
      ouro: 'Trunca el oro con `Math.floor`: 0',
      confere: 'Comprueba si el cobre es cero: no lo es',
      cobre: 'Calcula el cobre con `Math.round`: 50',
    },
    explicacao:
      'Primero separa las partes (oro entero, cobre redondeado) y después elige el texto: ' +
      'sin cobre, solo oro; sin oro, solo cobre; si no, los dos.',
  },
  'grimorio-fluxo-quem-usa': {
    enunciado: 'Ordena, en el camino de un pedido, las veces en que otra región usa el Grimorio:',
    opcoes: {
      imposto: '`validateOrder()` aplica `KINGS_TAX_RATE`',
      card: 'El `ItemCard` muestra el precio con `formatGold`',
      'api-soma': '`createOrder()` suma el subtotal con `sumLines`',
      memo: '`chargeOrder()` escribe el total en el `memo` con `formatGold`',
      carrinho: '`useCart` suma el carrito con `sumLines`',
    },
    explicacao:
      'El Grimorio no llama a nadie: son las otras regiones las que lo importan. El cliente ' +
      've el precio en la Carta, el carrito suma, y la API vuelve a sumar, aplica el ' +
      'impuesto y escribe el total formateado en el cobro: el mismo código sirviendo a los ' +
      'dos lados del Enlace.',
  },
};
