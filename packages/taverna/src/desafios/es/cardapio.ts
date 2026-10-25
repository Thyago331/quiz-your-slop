// Textos em espanhol dos Desafios de ../cardapio.ts — Carta (Salón). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const CARDAPIO_ES: TextosDaRegiao = {
  'cardapio-rota-get-items': {
    enunciado: 'Cuando se abre la Carta, ¿qué ruta de la API llama para traer los ítems?',
    opcoes: {
      a: '`POST /orders`',
      b: '`GET /items`',
      c: '`GET /menu`',
      d: '`GET /orders/:id`',
    },
    explicacao:
      '`fetchItems()` le pide `/items` a `getJson`, que hace un `fetch` sencillo —un GET— a ' +
      'la dirección de la API. La respuesta llega como `{ items }` y solo la lista vuelve al ' +
      '`Menu`.',
  },
  'cardapio-item-indisponivel': {
    enunciado: 'Un ítem llega de la API con `available: false`. ¿Cómo lo muestra la Carta?',
    opcoes: {
      a: 'No lo muestra: la API ya lo quita de la lista',
      b: 'Lo muestra como siempre; el error solo aparece al pagar',
      c: 'Lo muestra con la clase `unavailable` y el botón "Off the menu" deshabilitado',
      d: 'Lo muestra con precio cero',
    },
    explicacao:
      'El `GET /items` también trae los ítems que están fuera de la carta, y quien decide es ' +
      'el `ItemCard`: con `available` en falso, la tarjeta recibe la clase `unavailable` y ' +
      'el botón queda deshabilitado, con el texto "Off the menu".',
  },
  'cardapio-filtro-vazio': {
    enunciado: 'El Jugador elige una categoría que hoy no tiene ningún ítem. ¿Qué pasa?',
    opcoes: {
      a: 'La Carta llama a `GET /items?category=...` y recibe una lista vacía',
      b: 'Aparece "Could not read the menu"',
      c: 'El filtro vuelve solo a "Everything"',
      d: 'Sin otra llamada a la API, aparece "Nothing in this category tonight."',
    },
    explicacao:
      'El filtro corre en el propio `Menu`, sobre los ítems que ya llegaron: `visible` no es ' +
      'más que un `filter` por categoría. Si no queda ninguno visible, la pantalla muestra ' +
      'la frase de categoría vacía.',
  },
  'cardapio-cart-provider': {
    enunciado: '¿Por qué el `Menu` puede llamar a `useCart()` sin recibir el carrito por props?',
    opcoes: {
      a: 'El `main.tsx` envuelve todo el `App` en un `<CartProvider>`',
      b: 'El `App` le pasa el carrito a cada página',
      c: '`useCart()` lee el carrito del `localStorage`',
      d: 'Cada `Menu` crea su propio carrito',
    },
    explicacao:
      'El `main.tsx` monta el `App` dentro del `CartProvider`: el mismo carrito sirve para ' +
      'la Carta, la insignia de la cabecera y el pago. Es por esa Dependencia que la Carta ' +
      'habla con Carrito y Pago.',
  },
  'cardapio-erro-502': {
    enunciado:
      'Un proxy delante de la API responde al `GET /items` con un 502 y una página HTML. ' +
      '¿Qué lee el cliente en pantalla?',
    opcoes: {
      a: '"The barkeep is fetching the menu...", para siempre',
      b: '"Could not read the menu: Request failed: 502"',
      c: '"Could not read the menu: Something went wrong in the kitchen"',
      d: 'Una carta vacía',
    },
    explicacao:
      'Con `res.ok` en falso, `getJson` intenta leer el JSON de error; el HTML no es JSON, ' +
      'el `catch` lo convierte en `{}` y el mensaje cae en el valor por defecto `Request ' +
      'failed: 502`. El `Menu` atrapa el error, apaga el "cargando" en el `finally` y ' +
      'muestra el mensaje. La frase de la cocina solo saldría si la propia API respondiera ' +
      'con su `{ error }`.',
  },
  'cardapio-onde-busca': {
    enunciado: 'Señala la función del sitio que le pide la carta a la API.',
    explicacao:
      '`fetchItems()` es la que arma la petición `GET /items`; el `Menu` solo la llama al ' +
      'abrirse. `listItemsHandler` es el otro extremo de la Llamada, ya en la API de Pedidos.',
  },
  'cardapio-onde-rotulos': {
    enunciado: '¿Dónde decide el sitio que el botón de la categoría `roasts` diga "Roasts"?',
    explicacao:
      '`CATEGORIES`, del Grimorio, dice qué categorías existen y en qué orden; el texto de ' +
      'cada botón sale de `LABELS`, en el `CategoryFilter`. El "Everything" es un botón ' +
      'aparte.',
  },
  'cardapio-onde-filtra': {
    enunciado: '¿En qué componente se filtran de verdad los ítems por la categoría elegida?',
    explicacao:
      'El `CategoryFilter` solo dibuja los botones y avisa de la elección con `onChange`. ' +
      'Quien guarda la categoría y filtra la lista es el `Menu`, en `visible`. Ni la API ni ' +
      'la base de datos filtran.',
  },
  'cardapio-fluxo-abrir': {
    enunciado: 'Ordena lo que pasa desde que se abre la Carta hasta que aparecen los ítems:',
    opcoes: {
      cards: 'Cada ítem visible se convierte en un `ItemCard`',
      busca: '`fetchItems()` pide `GET /items` con `getJson`',
      espera: 'El `Menu` muestra "The barkeep is fetching the menu..."',
      responde: '`listItemsHandler` responde con `{ items }`',
      guarda: '`setItems` guarda la lista y `loading` pasa a `false`',
    },
    explicacao:
      '`loading` empieza en `true`, así que la primera pantalla es la del tabernero yendo a ' +
      'buscar la carta; el `useEffect` corre después de ese primer renderizado y llama a ' +
      '`fetchItems()`. La respuesta de la API sale de la región por una Llamada, vuelve a ' +
      '`setItems` y el `finally` apaga el "cargando".',
  },
  'cardapio-fluxo-add': {
    enunciado: 'Ordena lo que pasa cuando el cliente hace clic en "Add to tab" en un ítem:',
    opcoes: {
      mostra: 'La tarjeta pasa a mostrar `x1`, que viene de `cart.quantityOf`',
      clica: 'El botón del `ItemCard` llama a `onAdd`',
      soma: 'El carrito gana una línea con cantidad 1',
      add: 'El `Menu` llama a `cart.add(item)`',
    },
    explicacao:
      'El `ItemCard` no conoce el carrito: recibe `onAdd` ya listo del `Menu`, que llama a ' +
      '`cart.add(item)`. El carrito vive en otra región (Dependencia a través de `useCart`); ' +
      'cuando cambia, el `Menu` se vuelve a renderizar y `quantityOf` le devuelve la nueva ' +
      'cantidad a la tarjeta.',
  },
  'cardapio-fluxo-preco': {
    enunciado:
      'Ordena el camino del precio de un ítem, desde la base de datos hasta el texto de la ' +
      'tarjeta:',
    opcoes: {
      formata: '`formatGold` convierte el número en texto de oro y cobre',
      pede: '`fetchItems()` pide `GET /items`',
      le: '`listItems()` lee la tabla `items`',
      card: 'El `ItemCard` recibe el ítem, con `price` en oro',
      atende: '`listItemsHandler` atiende la ruta',
    },
    explicacao:
      'El precio atraviesa cuatro regiones: la Carta llama a la API, la API consulta la base ' +
      'de datos, la lista vuelve y cada `ItemCard` le pasa `item.price` a `formatGold`, del ' +
      'Grimorio. El número solo se vuelve texto al final, en la pantalla.',
  },
};
