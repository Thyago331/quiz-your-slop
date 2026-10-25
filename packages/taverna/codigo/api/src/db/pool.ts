import pg from 'pg';
import { config } from '../config';

// One connection pool for the whole API.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

// NUMERIC columns come back as strings; the tavern deals in plain numbers.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));
