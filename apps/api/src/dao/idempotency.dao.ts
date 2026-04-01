import { IdempotencyStatus, type IdempotencyKey } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class IdempotencyDao {
  async findByKey(key: string): Promise<IdempotencyKey | null> {
    return prisma.idempotencyKey.findUnique({ where: { key } });
  }

  async createInProgress(input: {
    key: string;
    requestFingerprint: string;
    expiresAt: Date;
  }): Promise<IdempotencyKey> {
    return prisma.idempotencyKey.create({
      data: {
        key: input.key,
        requestFingerprint: input.requestFingerprint,
        expiresAt: input.expiresAt,
        status: IdempotencyStatus.IN_PROGRESS,
      },
    });
  }

  async markCompleted(input: {
    key: string;
    reservationId: bigint;
    responseCode: number;
    responseBody: unknown;
  }): Promise<void> {
    await prisma.idempotencyKey.update({
      where: { key: input.key },
      data: {
        status: IdempotencyStatus.COMPLETED,
        reservationId: input.reservationId,
        responseCode: input.responseCode,
        responseBody: input.responseBody as object,
      },
    });
  }

  async markFailed(input: { key: string; responseCode: number; responseBody: unknown }): Promise<void> {
    await prisma.idempotencyKey.update({
      where: { key: input.key },
      data: {
        status: IdempotencyStatus.FAILED,
        responseCode: input.responseCode,
        responseBody: input.responseBody as object,
      },
    });
  }
}
