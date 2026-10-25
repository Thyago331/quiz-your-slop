import pg from 'pg';

export const db = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgres://taverna:taverna@localhost:5432/taverna',
  max: 2,
});
