// Runtime configuration, read once at startup.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const config = {
  port: Number(required('PORT', '3000')),
  databaseUrl: required('DATABASE_URL', 'postgres://taverna:taverna@localhost:5432/taverna'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),
};
