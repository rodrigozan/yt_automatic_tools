export const VALID_PRIVACY_STATUSES = ["private", "unlisted", "public"] as const;
export type PrivacyStatus = (typeof VALID_PRIVACY_STATUSES)[number];

export class PublishValidationError extends Error {
  readonly httpStatus = 400;
  constructor(message: string) {
    super(message);
    this.name = "PublishValidationError";
  }
}

export interface PublishOptions {
  privacyStatus: PrivacyStatus;
  publishAt?: string; // ISO 8601, sempre no futuro e só com privacyStatus=private
}

/**
 * Valida status e publishAt ANTES de qualquer chamada ao YouTube.
 * - status ∈ {private, unlisted, public}
 * - publishAt só vale com private e precisa estar no futuro
 */
export function parsePublishOptions(
  rawStatus: unknown,
  rawPublishAt: unknown,
  now: Date = new Date()
): PublishOptions {
  if (
    typeof rawStatus !== "string" ||
    !(VALID_PRIVACY_STATUSES as readonly string[]).includes(rawStatus)
  ) {
    throw new PublishValidationError(
      `status inválido: ${JSON.stringify(rawStatus)}. Valores aceitos: ${VALID_PRIVACY_STATUSES.join(", ")}.`
    );
  }
  const privacyStatus = rawStatus as PrivacyStatus;

  if (rawPublishAt === undefined || rawPublishAt === null || rawPublishAt === "") {
    return { privacyStatus };
  }

  if (privacyStatus !== "private") {
    throw new PublishValidationError(
      `publishAt só pode ser usado com status "private" (recebido: "${privacyStatus}").`
    );
  }

  const date = rawPublishAt instanceof Date ? rawPublishAt : new Date(String(rawPublishAt));
  if (Number.isNaN(date.getTime())) {
    throw new PublishValidationError(
      `publishAt inválido: ${JSON.stringify(rawPublishAt)}. Use data ISO 8601, ex.: 2026-11-01T20:00:00-03:00.`
    );
  }
  if (date.getTime() <= now.getTime()) {
    throw new PublishValidationError(
      `publishAt precisa estar no futuro (recebido: ${date.toISOString()}, agora: ${now.toISOString()}).`
    );
  }

  return { privacyStatus, publishAt: date.toISOString() };
}
