// O mapa da Taverna em inglês e espanhol: nomes e resumos de Territórios e Regiões e a descrição de
// cada Ligação, pelo id. O português é o de mapa.ts. Os termos seguem docs/glossario-traducoes.md.
import type { Idioma } from '@quiz/jogo';

type NomeResumo = { nome: string; resumo: string };

export type TextosDoMapa = {
  territorios: Readonly<Record<string, NomeResumo>>;
  regioes: Readonly<Record<string, NomeResumo>>;
  ligacoes: Readonly<Record<string, string>>;
};

export const TRADUCOES_DO_MAPA: Readonly<Record<Exclude<Idioma, 'pt'>, TextosDoMapa>> = {
  en: {
    territorios: {
      salao: {
        nome: 'Hall',
        resumo: 'The site where customers see the menu, build the order and pay.',
      },
      balcao: {
        nome: 'Counter',
        resumo: 'The API that takes the orders, charges them and tells the kitchen.',
      },
      adega: { nome: 'Cellar', resumo: 'The database with the menu and the orders.' },
      cozinha: {
        nome: 'Kitchen',
        resumo: 'The worker that receives paid orders and cooks the dishes.',
      },
    },
    regioes: {
      cardapio: {
        nome: 'Menu',
        resumo: 'The first screen: lists the items with prices and filters by category.',
      },
      'carrinho-checkout': {
        nome: 'Cart & Checkout',
        resumo: 'Keeps what the customer picked, shows the total and sends the order on Pay.',
      },
      'api-pedidos': {
        nome: 'Orders API',
        resumo:
          'The GET /items and POST /orders routes: validates the order, computes the total, ' +
          'charges and records it.',
      },
      'cofre-anao': {
        nome: "Dwarf's Vault",
        resumo: 'A fake payment provider: approves or declines the charge by fixed rules.',
      },
      grimorio: {
        nome: 'Grimoire',
        resumo: 'Types and currency formatting used by the site, the API and the kitchen.',
      },
      'livro-registros': {
        nome: 'Ledger',
        resumo: 'The items and orders tables and the queries that read and write them.',
      },
      fogao: {
        nome: 'Stove',
        resumo: 'The worker that listens for paid orders, cooks the dishes and updates the status.',
      },
    },
    ligacoes: {
      'cardapio-api-pedidos': 'GET /items brings the menu',
      'cardapio-carrinho-checkout': 'The Menu puts items in the cart with useCart',
      'carrinho-checkout-api-pedidos':
        'POST /orders creates the order when the customer clicks Pay',
      'api-pedidos-cofre-anao': 'The API imports charge() to charge the order',
      'api-pedidos-livro-registros': 'INSERT INTO orders saves the already-paid order',
      'api-pedidos-fogao': 'The API publishes order.paid and the kitchen receives it',
      'fogao-livro-registros':
        'UPDATE orders SET status moves the order to "cooking" and then "ready"',
      'cardapio-grimorio': 'The menu uses formatGold to show the prices',
      'carrinho-checkout-grimorio': 'The checkout uses formatGold to show the total',
      'api-pedidos-grimorio': "The API uses formatGold and the Grimoire's king's tax",
    },
  },
  es: {
    territorios: {
      salao: {
        nome: 'Salón',
        resumo: 'El sitio donde el cliente ve la carta, arma el pedido y paga.',
      },
      balcao: {
        nome: 'Barra',
        resumo: 'La API que recibe los pedidos, los cobra y avisa a la cocina.',
      },
      adega: { nome: 'Bodega', resumo: 'La base de datos con la carta y los pedidos.' },
      cozinha: {
        nome: 'Cocina',
        resumo: 'El worker que recibe los pedidos pagados y prepara los platos.',
      },
    },
    regioes: {
      cardapio: {
        nome: 'Carta',
        resumo: 'La primera pantalla: lista los artículos con precio y filtra por categoría.',
      },
      'carrinho-checkout': {
        nome: 'Carrito y Pago',
        resumo:
          'Guarda lo que el cliente eligió, muestra el total y envía el pedido al pulsar Pagar.',
      },
      'api-pedidos': {
        nome: 'API de Pedidos',
        resumo:
          'Las rutas GET /items y POST /orders: valida el pedido, calcula el total, cobra y lo ' +
          'registra.',
      },
      'cofre-anao': {
        nome: 'Cofre del Enano',
        resumo: 'Un pago de mentira: aprueba o rechaza el cobro con reglas fijas.',
      },
      grimorio: {
        nome: 'Grimorio',
        resumo: 'Tipos y formato de moneda que usan el sitio, la API y la cocina.',
      },
      'livro-registros': {
        nome: 'Libro de Registros',
        resumo: 'Las tablas de artículos y pedidos y las consultas que las leen y escriben.',
      },
      fogao: {
        nome: 'Fogón',
        resumo:
          'El worker que escucha los pedidos pagados, prepara los platos y actualiza el estado.',
      },
    },
    ligacoes: {
      'cardapio-api-pedidos': 'GET /items trae la carta',
      'cardapio-carrinho-checkout': 'La Carta pone artículos en el carrito con useCart',
      'carrinho-checkout-api-pedidos': 'POST /orders crea el pedido cuando el cliente pulsa Pagar',
      'api-pedidos-cofre-anao': 'La API importa charge() para cobrar el pedido',
      'api-pedidos-livro-registros': 'INSERT INTO orders guarda el pedido ya pagado',
      'api-pedidos-fogao': 'La API publica order.paid y la cocina lo recibe',
      'fogao-livro-registros':
        'UPDATE orders SET status pasa el pedido a "cooking" y luego a "ready"',
      'cardapio-grimorio': 'La carta usa formatGold para mostrar los precios',
      'carrinho-checkout-grimorio': 'El checkout usa formatGold para mostrar el total',
      'api-pedidos-grimorio': 'La API usa formatGold y el impuesto del rey del Grimorio',
    },
  },
};
