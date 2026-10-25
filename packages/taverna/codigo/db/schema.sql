-- Taverna do Slop: database schema (PostgreSQL)

CREATE TABLE items (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL CHECK (category IN ('drinks', 'stews', 'roasts', 'sweets')),
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  available   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
  id            UUID PRIMARY KEY,
  customer_name TEXT NOT NULL,
  subtotal      NUMERIC(10, 4) NOT NULL,
  tax           NUMERIC(10, 4) NOT NULL,
  total         NUMERIC(10, 4) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'cooking', 'ready', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id   UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES items (id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (order_id, item_id)
);

CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX order_items_item_idx ON order_items (item_id);
