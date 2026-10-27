// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type DeleteAccountError = AppError<"forbidden"> | AppError<"not_found">;
const anonymisedName = "Conta eliminada";
/**
 * Right to erasure, in place: foreign keys keep past reservations and audit rows attached to a
 * user row that no longer carries personal data. Future reservations are released without the
 * cancellation deadline and without notices. Consents stay as evidence until retention purges them.
 */
@Injectable()
export class DeleteAccount {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<void, DeleteAccountError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.accounts.lockUser(tenantId, userId);
    const profile = await this.accounts.find(tenantId, userId);
    if (!profile) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const cancelledBookings = await this.accounts.cancelFutureBookings(
      tenantId,
      userId,
      now,
    );
    await this.accounts.deleteNotifications(tenantId, userId);
    await this.accounts.deleteCategories(tenantId, userId);
    const revokedSessions = await this.accounts.revokeSessions(
      tenantId,
      userId,
    );
    await this.accounts.markDeleted(tenantId, userId, anonymisedName, now);
    await this.audit.record(args.principal, "account.deleted", userId, {
      cancelledBookings,
      revokedSessions,
    });
    return Result.ok();
  }
}
