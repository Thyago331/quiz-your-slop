// Textos em espanhol dos Desafios de ../livro-registros.ts — Libro de Registros (Bodega). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const LIVRO_DE_REGISTROS_ES: TextosDaRegiao = {
  'livro-tabelas': {
    enunciado: '¿Qué tablas crea el esquema de la Taberna?',
    opcoes: {
      a: '`items`, `orders` y `payments`',
      b: '`menu` y `orders`',
      c: '`items`, `carts` y `orders`',
      d: '`items`, `orders` y `order_items`',
    },
    explicacao:
      'Tres tablas: la carta (`items`), los pedidos (`orders`) y las líneas de cada pedido ' +
      '(`order_items`). No hay tabla de pagos: el recibo del Cofre del Enano vive solo en la ' +
      'memoria de la API.',
  },
  'livro-status-padrao': {
    enunciado:
      'Si el `INSERT` no indica el estado, ¿con qué estado nace un pedido en la tabla ' +
      '`orders`? ¿Y con cuál lo guarda la API?',
    opcoes: {
      a: 'Nace `pending`; la API también guarda `pending`',
      b: 'Nace `pending`, pero la API siempre manda el estado: `paid`',
      c: 'Nace `paid`; la API no manda estado',
      d: 'Nace sin estado (`NULL`)',
    },
    explicacao:
      'El valor por defecto de la columna es `pending`, pero `insertOrder` siempre pasa ' +
      '`order.status`, y la API solo la llama con `paid`, después de cobrar. En la práctica, ' +
      'ningún pedido se queda en `pending` en la base de datos.',
  },
  'livro-numeric-vira-numero': {
    enunciado:
      'El driver `pg` devuelve las columnas `NUMERIC` (como `price`) como texto. ¿Por qué la ' +
      'API recibe números?',
    opcoes: {
      a: 'El esquema usa `REAL`, no `NUMERIC`',
      b: '`toItem` convierte cada precio con `Number`',
      c: 'El `pool.ts` registra un conversor de `NUMERIC` a `Number`',
      d: 'El `JSON.stringify` de la respuesta lo convierte',
    },
    explicacao:
      '`pool.ts` registra un `setTypeParser` para `NUMERIC` al cargarse el módulo: toda ' +
      'consulta de la API recibe números. `toItem` solo copia la fila.',
  },
  'livro-rollback': {
    enunciado:
      'Al guardar un pedido de 3 líneas, falla el `INSERT` de la tercera línea en ' +
      '`order_items`. ¿Qué queda en la base de datos?',
    opcoes: {
      a: 'El pedido y las dos primeras líneas',
      b: 'Solo el pedido, sin líneas',
      c: 'El pedido, marcado como `failed`',
      d: 'Nada: el `ROLLBACK` deshace el pedido y las líneas',
    },
    explicacao:
      '`insertOrder` lo guarda todo en una transacción: cualquier error cae en el `catch`, ' +
      'que hace `ROLLBACK` y lo vuelve a lanzar. La base de datos queda limpia, pero el ' +
      'cobro en el Cofre del Enano ya ocurrió antes, y ningún `ROLLBACK` lo deshace.',
  },
  'livro-item-repetido': {
    enunciado:
      'Un pedido llega a la API con dos líneas del mismo ítem (el mismo `itemId`, dos ' +
      'veces). ¿Qué pasa al guardarlo?',
    opcoes: {
      a: 'Las dos líneas se suman en una sola',
      b: 'La segunda línea reemplaza a la primera',
      c: 'Las dos líneas se guardan sin problema',
      d: 'La clave primaria rechaza la segunda línea y se deshace el pedido entero',
    },
    explicacao:
      'La clave de `order_items` es `(order_id, item_id)`: la segunda línea del mismo ítem ' +
      'viola la clave, y el `ROLLBACK` deshace el pedido. El carrito del sitio junta los ' +
      'ítems iguales en una sola línea, pero la API no revisa los repetidos antes de cobrar: ' +
      'quien mande el pedido así paga y recibe un error 500.',
  },
  'livro-onde-grava': {
    enunciado: 'Señala la función que guarda un pedido nuevo en la base de datos.',
    explicacao:
      '`createOrder()` decide cuándo guardar, pero quien escribe en la base de datos es ' +
      '`insertOrder`, con un `INSERT INTO orders` y un `INSERT INTO order_items` por línea. ' +
      '`setStatus`, en la cocina, solo actualiza pedidos que ya existen.',
  },
  'livro-onde-le-cardapio': {
    enunciado: '¿Dónde está la consulta que lee la carta entera, ordenada por categoría y nombre?',
    explicacao:
      '`listItems` hace el `SELECT ... ORDER BY category, name` sin filtrar por `available`, ' +
      'así que los ítems fuera de la carta también llegan al sitio. `findItemsByIds` es la ' +
      'otra consulta, que busca solo los ítems de un pedido.',
  },
  'livro-onde-preco-pago': {
    enunciado:
      '¿En qué columna queda el precio por unidad que pagó el cliente en cada línea, aunque ' +
      'la carta cambie después?',
    explicacao:
      '`items.price` es el precio de hoy y puede cambiar. Cada línea del pedido guarda su ' +
      'propio `unit_price`, que `insertOrder` copia en el momento de la compra.',
  },
  'livro-fluxo-insert': {
    enunciado: 'Ordena lo que hace `insertOrder()` para guardar un pedido:',
    opcoes: {
      commit: '`COMMIT`',
      linhas: 'Un `INSERT INTO order_items` por cada línea',
      conecta: 'Toma una conexión del `pool`',
      pedido: '`INSERT INTO orders` devolviendo la fila guardada',
      begin: '`BEGIN`',
      libera: 'Devuelve la conexión al `pool` con `release()`',
    },
    explicacao:
      'Todo en una sola conexión, para que la transacción valga: abre, guarda el pedido, ' +
      'guarda las líneas y confirma. El `finally` devuelve la conexión al `pool` pase lo que ' +
      'pase.',
  },
  'livro-fluxo-vida-do-pedido': {
    enunciado: 'Ordena la vida de un pedido que sale bien, contada por la columna `status`:',
    opcoes: {
      cooking: 'La cocina cambia el estado a `cooking`',
      grava: '`insertOrder` guarda el pedido con estado `paid`',
      ready: 'La cocina cambia el estado a `ready`',
      cobra: 'La API cobra el pedido en el Cofre del Enano',
    },
    explicacao:
      'El pedido solo entra en la base de datos después de cobrarse, y ya como `paid`. A ' +
      'partir de ahí quien escribe es la cocina, por otra Consulta: `cooking` y luego ' +
      '`ready`. `pending` y `failed` existen en el `CHECK`, pero nadie los guarda.',
  },
};
