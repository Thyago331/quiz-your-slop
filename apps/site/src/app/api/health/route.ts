import { relatorioDeSaude } from '@/servidor/saude';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(relatorioDeSaude());
}
