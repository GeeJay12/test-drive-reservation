import { createHash } from "node:crypto";
import { IdempotencyStatus } from "@prisma/client";
import { IdempotencyDao } from "../dao/idempotency.dao.js";
import { ConflictError } from "../lib/errors.js";

const IDEMPOTENCY_TTL_MINUTES = 60;

export class IdempotencyService {
  constructor(private readonly dao = new IdempotencyDao()) {}

  buildFingerprint(payload: unknown): string {
    const canonical = JSON.stringify(payload);
    return createHash("sha256").update(canonical).digest("hex");
  }

  async assertAndRegisterInProgress(input: {
    key: string;
    fingerprint: string;
  }): Promise<{ replay: false } | { replay: true; responseCode: number; responseBody: unknown }> {
    const existing = await this.dao.findByKey(input.key);
    if (!existing) {
      await this.dao.createInProgress({
        key: input.key,
        requestFingerprint: input.fingerprint,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MINUTES * 60_000),
      });
      return { replay: false };
    }

    if (existing.requestFingerprint !== input.fingerprint) {
      throw new ConflictError("Idempotency key reused with different payload");
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new ConflictError("Idempotency key expired. Use a new key");
    }

    if (existing.status === IdempotencyStatus.COMPLETED && existing.responseCode && existing.responseBody) {
      return {
        replay: true,
        responseCode: existing.responseCode,
        responseBody: existing.responseBody,
      };
    }

    if (existing.status === IdempotencyStatus.IN_PROGRESS) {
      throw new ConflictError("Another request with this idempotency key is in progress");
    }

    throw new ConflictError("Idempotency key is in failed state. Use a new key");
  }

  async markCompleted(key: string, reservationId: bigint, responseBody: unknown): Promise<void> {
    await this.dao.markCompleted({
      key,
      reservationId,
      responseCode: 201,
      responseBody,
    });
  }

  async markFailed(key: string, statusCode: number, responseBody: unknown): Promise<void> {
    await this.dao.markFailed({ key, responseCode: statusCode, responseBody });
  }
}
