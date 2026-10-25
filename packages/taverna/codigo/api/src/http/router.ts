import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpError } from './errors';

export interface Request {
  params: Record<string, string>;
  body: unknown;
}

export interface Response {
  status: number;
  body: unknown;
}

export type Handler = (req: Request) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  get(path: string, handler: Handler): void {
    this.add('GET', path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add('POST', path, handler);
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      for (const route of this.routes) {
        const match = route.method === req.method ? route.pattern.exec(url.pathname) : null;
        if (!match) continue;
        const params = Object.fromEntries(route.keys.map((key, i) => [key, match[i + 1] ?? '']));
        const body = req.method === 'POST' ? await readJson(req) : undefined;
        const result = await route.handler({ params, body });
        send(res, result.status, result.body);
        return;
      }
      send(res, 404, { error: 'Not found' });
    } catch (err) {
      if (err instanceof HttpError) {
        send(res, err.status, { error: err.message });
      } else {
        console.error(err);
        send(res, 500, { error: 'Something went wrong in the kitchen' });
      }
    }
  }

  private add(method: string, path: string, handler: Handler): void {
    const keys: string[] = [];
    const source = path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler });
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Body is not valid JSON');
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
