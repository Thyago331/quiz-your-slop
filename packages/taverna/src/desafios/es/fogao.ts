// Textos em espanhol dos Desafios de ../fogao.ts — Fogón (Cocina). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const FOGAO_ES: TextosDaRegiao = {
  'fogao-canal': {
    enunciado: '¿En qué canal de Redis escucha la cocina los pedidos pagados?',
    opcoes: {
      a: '`orders`',
      b: '`kitchen`',
      c: '`order.paid`',
      d: '`order.created`',
    },
    explicacao:
      'La cocina se suscribe a `order.paid`. El nombre está escrito otra vez aquí, con un ' +
      'comentario que pide que coincida con el de la API: son los dos lados de un Evento, y ' +
      'nada en el código garantiza que los dos nombres sigan siendo iguales.',
  },
  'fogao-tempo-de-preparo': {
    enunciado:
      'Un pedido trae 2 asados (`roasts`) y 1 bebida (`drinks`). ¿Cuánto tiempo espera la ' +
      'cocina antes de marcarlo como listo?',
    opcoes: {
      a: '11 segundos',
      b: '21 segundos',
      c: '10 segundos: solo cuenta el plato que más tarda',
      d: '3 segundos: uno por porción',
    },
    explicacao:
      'El tiempo es la suma, porción por porción: 10 s por asado y 1 s por bebida dan 2 × 10 ' +
      '+ 1 = 21 s. Nada se prepara en paralelo.',
  },
  'fogao-mensagem-ilegivel': {
    enunciado: 'Llega al canal un mensaje que no es JSON. ¿Qué hace la cocina?',
    opcoes: {
      a: 'El worker se cae con un error de JSON',
      b: 'Avisa "Kitchen got a note it cannot read" en el log e ignora el mensaje',
      c: 'Marca el pedido como `failed`',
      d: 'Devuelve el mensaje a la cola',
    },
    explicacao:
      '`parse` se traga el error de `JSON.parse` y devuelve `undefined`, igual que con un ' +
      'JSON que no es un `order.paid`. Quien recibe el mensaje avisa en el log y sigue. A ' +
      'diferencia del `catch {}` del worker, aquí el problema deja rastro.',
  },
  'fogao-item-sumido': {
    enunciado:
      'El evento trae un `itemId` que ya no existe en la tabla `items`. ¿Cómo sale esa línea ' +
      'en el ticket?',
    opcoes: {
      a: 'La línea se ignora',
      b: 'La preparación se detiene con un error',
      c: 'Sale sin nombre y sin estación',
      d: 'Sale como `item #<id>`, preparada como guiso (`stews`)',
    },
    explicacao:
      '`ticketLinesFor` usa valores de reserva cuando el ítem no viene de la base de datos: ' +
      'el nombre pasa a ser `item #<id>` y la categoría, `stews`. El plato va a la estación ' +
      'POT y cuenta 4 s por porción.',
  },
  'fogao-catch-engolido': {
    enunciado:
      'Durante la preparación se cae la base de datos, y falla el `UPDATE` a `ready`. ¿Qué ' +
      'pasa con el pedido?',
    opcoes: {
      a: 'El estado pasa a `failed`',
      b: 'El worker lo reintenta hasta conseguirlo',
      c:
        'El error desaparece en el `catch {}`: sin log, el pedido se queda en `cooking` para ' +
        'siempre',
      d: 'El worker se cae y el pedido vuelve a la cola',
    },
    explicacao:
      'Manejo de errores tragado: el `catch {}` de `cook` no registra nada, no reintenta y ' +
      'no marca el fallo. El `cooking` ya se guardó, el `ready` no, y nadie se entera.',
  },
  'fogao-primeiro-update': {
    enunciado:
      '¿Y si el que falla es el primer `UPDATE`, el que cambia el estado a `cooking`? ¿Qué ' +
      'queda en la base de datos y en el log?',
    opcoes: {
      a: 'El pedido se queda en `paid` para siempre; el log solo dice que llegó al fogón',
      b: 'El pedido pasa a `failed` y el log muestra el error',
      c: 'El plato se prepara igual y el pedido termina en `ready`',
      d: 'La API recibe el error y devuelve el dinero',
    },
    explicacao:
      'El "reached the stove" se escribe antes del `try`; el primer `setStatus` falla y el ' +
      '`catch {}` se salta todo lo demás: sin ticket, sin preparación, sin `ready`. El ' +
      'pedido queda pagado y parado, y el estado `failed`, que existe en el tipo, nunca lo ' +
      'guarda nadie.',
  },
  'fogao-onde-status': {
    enunciado:
      'Señala la función de la cocina que cambia el estado del pedido en la base de datos.',
    explicacao:
      '`cook` decide cuándo, pero el `UPDATE orders SET status` está en `setStatus`: la ' +
      'Consulta del Fogón al Libro de Registros. También actualiza `updated_at`.',
  },
  'fogao-onde-estacao': {
    enunciado: '¿Dónde se decide en qué estación (BAR, POT, SPIT, OVEN) se prepara cada plato?',
    explicacao:
      '`STATION` asocia cada categoría a una estación, y `printTicket` la usa para escribir ' +
      'y ordenar las líneas del ticket. `SECONDS_PER_PORTION` es la otra tabla por ' +
      'categoría: la del tiempo.',
  },
  'fogao-onde-engole': {
    enunciado: 'Señala la función en la que un error de base de datos desaparece sin dejar rastro.',
    explicacao:
      '`setStatus` deja que el error suba; quien se lo traga es el `catch {}` vacío de ' +
      '`cook`. `parse` también tiene un `catch`, pero para JSON, y quien la llama avisa en ' +
      'el log.',
  },
  'fogao-fluxo-cook': {
    enunciado: 'Ordena lo que hace la cocina con un pedido pagado, cuando todo sale bien:',
    opcoes: {
      ticket: 'Busca los nombres de los ítems e imprime el ticket',
      ready: '`UPDATE orders` marca el pedido como `ready`',
      chega: '`onOrderPaid` le entrega el evento a `cook`',
      espera: 'Espera el tiempo de `cookingTimeMs`',
      cooking: '`UPDATE orders` marca el pedido como `cooking`',
    },
    explicacao:
      'El estado `cooking` va antes que todo, incluso antes que el ticket. Después la cocina ' +
      'espera la suma de los tiempos de preparación y solo entonces guarda `ready`. Los dos ' +
      'cambios de estado salen de la región por una Consulta a la base de datos.',
  },
  'fogao-fluxo-evento': {
    enunciado:
      'Ordena el camino de un pedido, desde que la API lo guarda hasta que se enciende el ' +
      'fuego:',
    opcoes: {
      cook: '`cook` recibe el evento',
      publica: 'La API publica `order.paid` en Redis',
      cooking: 'El estado del pedido pasa a `cooking`',
      parse: '`parse` comprueba que el mensaje sea un `order.paid`',
      grava: 'El pedido se guarda como `paid`',
    },
    explicacao:
      'La API solo publica después de guardar. El Evento llega por Redis al suscriptor de la ' +
      'cocina, que comprueba el canal y el formato antes de llamar a `cook`, sin esperar el ' +
      'resultado (`void`). El primer paso de `cook` es una Consulta: el `UPDATE` a `cooking`.',
  },
};
