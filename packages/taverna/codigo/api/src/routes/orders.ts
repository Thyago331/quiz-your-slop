import type { CreateOrderRequest, CreateOrderResponse } from '@taverna/shared/types';
import { findOrderById } from '../db/ordersRepo';
import { badRequest, notFound } from '../http/errors';
import type { Handler } from '../http/router';
import { createOrder } from '../orders/service';

function parseCreateOrder(body: unknown): CreateOrderRequest {
  if (typeof body !== 'object' || body === null) {
    throw badRequest('Expected a JSON object');
  }
  const { orderRef, customerName, lines } = body as Record<string, unknown>;
  if (typeof orderRef !== 'string' || orderRef.length === 0) {
    throw badRequest('orderRef is required');
  }
  if (typeof customerName !== 'string') {
    throw badRequest('customerName is required');
  }
  if (!Array.isArray(lines)) {
    throw badRequest('lines must be an array');
  }
  return {
    orderRef,
    customerName,
    lines: lines.map((line) => ({
      itemId: Number((line as Record<string, unknown>).itemId),
      quantity: Number((line as Record<string, unknown>).quantity),
    })),
  };
}

// POST /orders — called by the checkout page when the customer clicks "Pay".
export const createOrderHandler: Handler = async (req) => {
  const request = parseCreateOrder(req.body);
  const order = await createOrder(request);

  const response: CreateOrderResponse = {
    orderId: order.id,
    status: order.status,
    total: order.total,
  };
  return { status: 201, body: response };
};

// GET /orders/:id
export const getOrderHandler: Handler = async (req) => {
  const id = req.params.id;
  if (!id) throw badRequest('Missing order id');

  const order = await findOrderById(id);
  if (!order) throw notFound(`Order ${id} not found`);

  return { status: 200, body: order };
};
