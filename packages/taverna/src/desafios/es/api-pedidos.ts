// Textos em espanhol dos Desafios de ../api-pedidos.ts — API de Pedidos (Barra). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const API_DE_PEDIDOS_ES: TextosDaRegiao = {
  'api-pedidos-rota-post-orders': {
    enunciado:
      'Cuando la pantalla de pago llama a `POST /orders`, ¿qué handler de la API recibe la ' +
      'llamada?',
    opcoes: {
      a: '`listItemsHandler`',
      b: '`createOrderHandler`',
      c: '`getOrderHandler`',
      d: '`chargeOrder`',
    },
    explicacao:
      'El `server.ts` registra las rutas en el `Router`: `POST /orders` va a ' +
      '`createOrderHandler`, que comprueba el formato del cuerpo con `parseCreateOrder` y le ' +
      'pasa el pedido a `createOrder()`.',
  },
  'api-pedidos-quantidade-maxima': {
    enunciado: 'Un pedido trae una línea con 25 jarras del mismo ítem. ¿Qué responde la API?',
    opcoes: {
      a: '201: cobra las 25 jarras sin problema',
      b: '409: el ítem salió de la carta',
      c: '400: cantidad no válida, antes de cualquier cobro',
      d: '402: el Cofre del Enano rechaza el cobro',
    },
    explicacao:
      'Cada línea acepta de 1 a `MAX_PER_LINE` (20) unidades. Por encima de eso, ' +
      '`validateOrder()` lanza `badRequest` —un 400— y el pedido ni siquiera llega al Cofre ' +
      'del Enano.',
  },
  'api-pedidos-validate-order-muta': {
    enunciado:
      'El nombre y el comentario dicen que `validateOrder()` solo revisa el pedido. ¿Qué más ' +
      'hace?',
    opcoes: {
      a: 'Nada más que revisar: devuelve `void` y solo lanza errores 400',
      b: 'Cobra el pedido en el Cofre del Enano',
      c: 'Aplica el cupón del festival',
      d: 'Calcula el impuesto del rey y el total, modificando el propio pedido',
    },
    explicacao:
      'Nombre engañoso: después de las comprobaciones, `validateOrder()` escribe `order.tax` ' +
      'y `order.total` en el objeto que recibió. Quien lee solo la firma cree que nada ' +
      'cambia, y `createOrder()` depende de ese efecto secundario para cobrar el importe ' +
      'correcto.',
  },
  'api-pedidos-cobra-antes-de-gravar': {
    enunciado: '¿En qué orden cobra y guarda el pedido `createOrder()`?',
    opcoes: {
      a: 'Cobra en el Cofre del Enano y solo después guarda el pedido, ya como `paid`',
      b: 'Lo guarda como `pending`, cobra y luego lo cambia a `paid`',
      c: 'Lo guarda y publica `order.paid`; quien cobra es la cocina',
      d: 'Cobra y guarda a la vez, en una transacción de la base de datos',
    },
    explicacao:
      '`chargeOrder()` va antes de `insertOrder()`, que ya guarda `status: "paid"`. No ' +
      'existe ningún pedido `pending` en la base de datos: si la escritura falla después del ' +
      'cobro, el cliente pagó un pedido que nadie registró.',
  },
  'api-pedidos-ninguem-ouve': {
    enunciado: 'La API publica `order.paid`, pero en la cocina no hay nadie escuchando. ¿Qué pasa?',
    opcoes: {
      a: 'La API devuelve un 500 y deshace el cobro',
      b: 'Solo un aviso en el log: el pedido sigue pagado y el cliente recibe un 201',
      c: 'Redis guarda el evento hasta que vuelva la cocina',
      d: 'La API vuelve a publicar hasta que alguien escuche',
    },
    explicacao:
      '`redis.publish` devuelve cuántos oyentes recibieron el mensaje. Si son cero, ' +
      '`publishOrderPaid` solo hace un `console.warn` y sigue: el pedido queda pagado y ' +
      'guardado, pero no se prepara ningún plato. Publicar en un canal no guarda el mensaje ' +
      'para más tarde.',
  },
  'api-pedidos-cupom-morto': {
    enunciado: '¿Quién llama a `applyCoupon()` cuando un pedido llega a `POST /orders`?',
    opcoes: {
      a: '`createOrderHandler`, cuando el cuerpo trae un cupón',
      b: '`validateOrder()`, antes de calcular el impuesto',
      c: '`createOrder()`, justo después de `priceLines()`',
      d: 'Nadie: es código muerto, esperando a que alguien cumpla el TODO',
    },
    explicacao:
      'Código muerto: `applyCoupon()` está exportada, pero ningún archivo la importa. ' +
      '`createOrder()` pasa de `priceLines()` directamente a `validateOrder()` y ' +
      '`chargeOrder()`. El TODO pedía quitarla después del festival, y los cupones vencieron ' +
      'en 2024.',
  },
  'api-pedidos-total-sem-arredondar': {
    enunciado:
      'El impuesto del rey es del 8 % (`KINGS_TAX_RATE = 0.08`). Por un pedido de 10 de oro, ' +
      '¿cuánto cobra la API en el Cofre del Enano?',
    opcoes: {
      a: '11 de oro: redondea hacia arriba, sin cobre suelto',
      b: '10 de oro: el impuesto solo aparece en pantalla',
      c: '10,8 de oro: la API no redondea',
      d: '10,08 de oro: el impuesto se aplica sobre el cobre',
    },
    explicacao:
      'La API suma subtotal e impuesto y cobra `order.total` sin redondear: 10,8 de oro. ' +
      'Guárdate ese número: al otro lado del Enlace con Carrito y Pago, el total se vuelve a ' +
      'calcular, y de otra manera. La regla duplicada es slop que nace cuando cada lado se ' +
      'escribe por separado.',
  },
  'api-pedidos-onde-publica': {
    enunciado: '¿En qué función publica la API el evento `order.paid` para la cocina?',
    explicacao:
      '`createOrder()` solo la llama; quien habla con Redis es `publishOrderPaid()`, en ' +
      '`publisher.ts`: publica el evento en el canal `order.paid` y comprueba cuántos lo ' +
      'oyeron.',
  },
  'api-pedidos-imposto-do-rei': {
    enunciado: '¿En qué función se aplica el "impuesto del rey"?',
    explicacao:
      'A pesar del nombre, `validateOrder()` no solo revisa: al final calcula `order.tax` ' +
      'con `KINGS_TAX_RATE` y escribe el total en el propio pedido. Nombre engañoso: lee el ' +
      'cuerpo, no la firma.',
  },
  'api-pedidos-onde-nasce-o-400': {
    enunciado:
      'Señala una función que rechaza con un 400 un pedido mal formado, antes de cualquier ' +
      'cobro.',
    explicacao:
      'Valen dos respuestas: `parseCreateOrder` rechaza un cuerpo sin `orderRef`, ' +
      '`customerName` o `lines`; `validateOrder()` rechaza un nombre vacío, un pedido vacío ' +
      'y cantidades fuera de 1–20. Las dos lanzan `badRequest` antes de `chargeOrder()`.',
  },
  'api-pedidos-fluxo-post-orders': {
    enunciado: 'Ordena lo que pasa después de que `POST /orders` llega a la API:',
    opcoes: {
      cobra: '`chargeOrder()` cobra el total del pedido',
      publica: 'La cocina recibe el evento `order.paid`',
      recebe: '`createOrderHandler` recibe el pedido y revisa el cuerpo',
      grava: '`INSERT INTO orders` guarda el pedido como `paid`',
      imposto: '`validateOrder()` aplica el impuesto del rey',
    },
    explicacao:
      'El handler revisa el cuerpo y llama a `createOrder()`, que valida (y aplica el ' +
      'impuesto), cobra, guarda el pedido ya pagado y solo entonces publica el evento. Los ' +
      'dos últimos pasos salen de la región por una Consulta y por un Evento: revela la API ' +
      'de Pedidos para ver adónde van.',
  },
  'api-pedidos-fluxo-antes-de-cobrar': {
    enunciado: 'Ordena lo que hace `createOrder()` con el pedido antes de cobrar:',
    opcoes: {
      valida: '`validateOrder()` revisa las cantidades y calcula el total',
      soma: '`sumLines()`, del Grimorio, suma el subtotal',
      busca: '`findItemsByIds()` busca en la base de datos los ítems y sus precios',
      cobra: '`chargeOrder()` cobra el total',
      confere: '`priceLines()` rechaza un ítem desconocido o fuera de la carta',
    },
    explicacao:
      '`priceLines()` primero busca los ítems en la base de datos y solo después revisa cada ' +
      'línea (400 si el ítem es desconocido, 409 si está fuera de la carta). Con las líneas ' +
      'listas, el subtotal sale de `sumLines()`; `validateOrder()` viene después y escribe ' +
      'el total que cobra `chargeOrder()`.',
  },
};
