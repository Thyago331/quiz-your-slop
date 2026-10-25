// Textos em inglês dos Desafios de ../cardapio.ts — Menu (Hall). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const CARDAPIO_EN: TextosDaRegiao = {
  'cardapio-rota-get-items': {
    enunciado: 'When the Menu opens, which API route does it call to fetch the items?',
    opcoes: {
      a: '`POST /orders`',
      b: '`GET /items`',
      c: '`GET /menu`',
      d: '`GET /orders/:id`',
    },
    explicacao:
      '`fetchItems()` asks `getJson` for `/items`, which does a plain `fetch` — a GET — ' +
      "against the API's address. The response comes back as `{ items }`, and only the list " +
      'is handed back to the `Menu`.',
  },
  'cardapio-item-indisponivel': {
    enunciado: 'An item arrives from the API with `available: false`. How does the Menu show it?',
    opcoes: {
      a: "It doesn't: the API already drops the item from the list",
      b: 'As usual; the error only shows up at payment',
      c: 'With the `unavailable` class and a disabled "Off the menu" button',
      d: 'With a price of zero',
    },
    explicacao:
      "`GET /items` also brings the items that are off the menu, and it's the `ItemCard` " +
      'that decides: with `available` false, the card gets the `unavailable` class and the ' +
      'button is disabled, reading "Off the menu".',
  },
  'cardapio-filtro-vazio': {
    enunciado: 'The Player picks a category that has no items tonight. What happens?',
    opcoes: {
      a: 'The Menu calls `GET /items?category=...` and gets an empty list',
      b: '"Could not read the menu" shows up',
      c: 'The filter snaps back to "Everything" on its own',
      d: 'With no new API call, "Nothing in this category tonight." shows up',
    },
    explicacao:
      'The filtering happens right inside the `Menu`, over the items that already arrived: ' +
      '`visible` is just a `filter` by category. With nothing visible, the screen shows the ' +
      'empty-category line.',
  },
  'cardapio-cart-provider': {
    enunciado: 'Why can the `Menu` call `useCart()` without getting the cart through props?',
    opcoes: {
      a: '`main.tsx` wraps the whole `App` in a `<CartProvider>`',
      b: 'The `App` hands the cart to every page',
      c: '`useCart()` reads the cart from `localStorage`',
      d: 'Each `Menu` creates its own cart',
    },
    explicacao:
      '`main.tsx` mounts the `App` inside the `CartProvider`: the same cart serves the Menu, ' +
      'the header badge and the Checkout. That Dependency is how the Menu talks to Cart & ' +
      'Checkout.',
  },
  'cardapio-erro-502': {
    enunciado:
      'A proxy in front of the API answers `GET /items` with a 502 and an HTML page. What ' +
      'does the customer read on screen?',
    opcoes: {
      a: '"The barkeep is fetching the menu...", forever',
      b: '"Could not read the menu: Request failed: 502"',
      c: '"Could not read the menu: Something went wrong in the kitchen"',
      d: 'An empty menu',
    },
    explicacao:
      "With `res.ok` false, `getJson` tries to read the error JSON; HTML isn't JSON, so the " +
      '`catch` turns it into `{}` and the message falls back to `Request failed: 502`. The ' +
      '`Menu` catches the error, turns off "loading" in the `finally` and shows the message. ' +
      'The kitchen line would only appear if the API itself answered with its `{ error }`.',
  },
  'cardapio-onde-busca': {
    enunciado: 'Point to the site function that asks the API for the menu.',
    explicacao:
      '`fetchItems()` is the one that builds the `GET /items` request; the `Menu` just calls ' +
      'it when it opens. `listItemsHandler` is the other end of the Call, over in the Orders ' +
      'API.',
  },
  'cardapio-onde-rotulos': {
    enunciado: 'Where does the site decide that the `roasts` category button says "Roasts"?',
    explicacao:
      '`CATEGORIES`, from the Grimoire, says which categories exist and in what order; each ' +
      'button\'s text comes from `LABELS`, in `CategoryFilter`. "Everything" is a separate ' +
      'button.',
  },
  'cardapio-onde-filtra': {
    enunciado: 'In which component are the items actually filtered by the chosen category?',
    explicacao:
      '`CategoryFilter` only draws the buttons and reports the choice through `onChange`. ' +
      'The one that keeps the category and filters the list is the `Menu`, in `visible`. ' +
      'Neither the API nor the database filters anything.',
  },
  'cardapio-fluxo-abrir': {
    enunciado: 'Put in order what happens from the moment the Menu opens until the items appear:',
    opcoes: {
      cards: 'Each visible item becomes an `ItemCard`',
      busca: '`fetchItems()` requests `GET /items` with `getJson`',
      espera: 'The `Menu` shows "The barkeep is fetching the menu..."',
      responde: '`listItemsHandler` answers with `{ items }`',
      guarda: '`setItems` stores the list and `loading` becomes `false`',
    },
    explicacao:
      '`loading` starts out `true`, so the first screen is the barkeep fetching the menu; ' +
      'the `useEffect` runs after that first render and calls `fetchItems()`. The request ' +
      "leaves the Region through a Call, the API's answer comes back to `setItems`, and the " +
      '`finally` turns off "loading".',
  },
  'cardapio-fluxo-add': {
    enunciado: 'Put in order what happens when the customer clicks "Add to tab" on an item:',
    opcoes: {
      mostra: 'The card starts showing `x1`, coming from `cart.quantityOf`',
      clica: 'The `ItemCard` button calls `onAdd`',
      soma: 'The cart gains a line with quantity 1',
      add: 'The `Menu` calls `cart.add(item)`',
    },
    explicacao:
      'The `ItemCard` knows nothing about the cart: it gets `onAdd` ready-made from the ' +
      '`Menu`, which calls `cart.add(item)`. The cart lives in another Region (a Dependency ' +
      'through `useCart`); when it changes, the `Menu` renders again and `quantityOf` hands ' +
      'the new quantity to the card.',
  },
  'cardapio-fluxo-preco': {
    enunciado:
      "Put in order the path an item's price takes, from the database to the text on the " +
      'card:',
    opcoes: {
      formata: '`formatGold` turns the number into gold-and-copper text',
      pede: '`fetchItems()` requests `GET /items`',
      le: '`listItems()` reads the `items` table',
      card: 'The `ItemCard` receives the item, with `price` in gold',
      atende: '`listItemsHandler` handles the route',
    },
    explicacao:
      'The price crosses four Regions: the Menu calls the API, the API queries the database, ' +
      'the list comes back and each `ItemCard` passes `item.price` to `formatGold`, from the ' +
      'Grimoire. The number only becomes text at the very end, on screen.',
  },
};
