export class FacebookScheduleError extends Error {}

const MIN_MS = 10 * 60 * 1000;
const MAX_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Converte o `scheduledAt` (ISO 8601) em segundos Unix para o `scheduled_publish_time` da Graph API.
 * O Facebook só aceita agendar de 10 minutos a 30 dias à frente.
 */
export function parseScheduledAt(value: unknown, now: Date = new Date()): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new FacebookScheduleError(`scheduledAt inválido: "${value}". Use ISO 8601.`);
  const delta = date.getTime() - now.getTime();
  if (delta < MIN_MS) throw new FacebookScheduleError("scheduledAt precisa estar pelo menos 10 minutos no futuro (regra do Facebook).");
  if (delta > MAX_MS) throw new FacebookScheduleError("scheduledAt pode ser no máximo 30 dias à frente (regra do Facebook).");
  return Math.floor(date.getTime() / 1000);
}
