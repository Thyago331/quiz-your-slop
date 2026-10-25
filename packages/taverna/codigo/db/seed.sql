-- Starter menu for local development

INSERT INTO items (name, description, category, price) VALUES
  ('Dragonfire Ale', 'Dark ale brewed with smoked peppers', 'drinks', 2.50),
  ('Elven Mead', 'Honey wine, served chilled', 'drinks', 3.75),
  ('Goblin Grog', 'Nobody knows what is in it', 'drinks', 0.99),
  ('Hunter''s Stew', 'Venison, roots and barley', 'stews', 4.20),
  ('Mushroom Broth', 'Cave mushrooms in a clear broth', 'stews', 3.15),
  ('Roast Boar', 'Half a boar, slow-roasted over oak', 'roasts', 12.00),
  ('Spit Chicken', 'Whole chicken with herb butter', 'roasts', 7.45),
  ('Honey Cake', 'Dwarven honey cake with walnuts', 'sweets', 1.80),
  ('Baked Apple', 'With cinnamon and cream', 'sweets', 1.35);

INSERT INTO items (name, description, category, price, available) VALUES
  ('Kraken Skewer', 'Back when the kraken season opens', 'roasts', 9.90, FALSE);
