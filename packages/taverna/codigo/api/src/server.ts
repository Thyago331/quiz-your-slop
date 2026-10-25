import { createServer } from 'node:http';
import { config } from './config';
import { Router } from './http/router';
import { listItemsHandler } from './routes/items';
import { createOrderHandler, getOrderHandler } from './routes/orders';

const router = new Router();

router.get('/items', listItemsHandler);
router.post('/orders', createOrderHandler);
router.get('/orders/:id', getOrderHandler);

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  void router.handle(req, res);
});

server.listen(config.port, () => {
  console.log(`Taverna API listening on http://localhost:${config.port}`);
});
