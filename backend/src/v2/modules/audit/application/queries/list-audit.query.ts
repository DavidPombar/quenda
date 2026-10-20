// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AuditLogRepository } from "../../domain/audit-log.repository";
import { AuditEntry } from "../../domain/audit-entry.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ListAuditError = AppError<"forbidden"> | AppError<"validation">;
function instant(value: string | undefined) {
  if (value === undefined) return { ok: true as const, value: undefined };
  try {
    return { ok: true as const, value: Temporal.Instant.from(value) };
  } catch {
    return { ok: false as const };
  }
}
@Injectable()
export class ListAudit {
  constructor(private readonly repository: AuditLogRepository) {}
  async execute(args: {
    principal: Principal;
    from?: string;
    to?: string;
    action?: string;
    limit?: number;
  }): Promise<Result<AuditEntry[], ListAuditError>> {
    if (!can(args.principal, "audit:view"))
      return Result.err(failure("forbidden"));
    const from = instant(args.from);
    const to = instant(args.to);
    if (!from.ok || !to.ok) return Result.err(failure("validation"));
    if (
      from.value &&
      to.value &&
      Temporal.Instant.compare(from.value, to.value) > 0
    )
      return Result.err(failure("validation"));
    return Result.ok(
      await this.repository.list(args.principal.tenantId, {
        from: from.value,
        to: to.value,
        action: args.action,
        limit: args.limit ?? 100,
      }),
    );
  }
}
