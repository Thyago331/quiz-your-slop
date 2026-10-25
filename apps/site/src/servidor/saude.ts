/** O que `/api/health` responde: o deploy espera `status: "ok"` (spec §11). */
export function relatorioDeSaude() {
  return { status: 'ok' as const };
}
