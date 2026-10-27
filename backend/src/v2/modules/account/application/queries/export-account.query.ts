// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { ConsentRepository } from "../../domain/consent.repository";
import { AccountExport } from "../../domain/account.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { DataProtector } from "../../../../shared/application/data-protector";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ExportAccountError = AppError<"forbidden"> | AppError<"not_found">;
@Injectable()
export class ExportAccount {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly consents: ConsentRepository,
    private readonly municipalities: Municipalities,
    private readonly protector: DataProtector,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<AccountExport, ExportAccountError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const settings = await this.municipalities.find(tenantId);
    const profile = await this.accounts.find(tenantId, userId);
    const personal = await this.accounts.findPersonalData(tenantId, userId);
    if (!settings || !profile || !personal)
      return Result.err(failure("not_found"));
    const result: AccountExport = {
      generatedAt: this.clock.now(),
      municipality: {
        slug: settings.slug,
        name: settings.name,
        contact: settings.contact,
        legalVersion: settings.legalVersion,
        retentionMonths: settings.retentionMonths,
      },
      profile: {
        ...profile,
        email: personal.email,
        assurance: personal.assurance,
        nif: personal.nifCiphertext
          ? this.protector.decrypt(personal.nifCiphertext)
          : null,
      },
      identities: await this.accounts.listIdentities(tenantId, userId),
      consents: await this.consents.listByUser(tenantId, userId),
      bookings: await this.accounts.listBookingsAll(tenantId, userId),
      notifications: await this.accounts.listNotificationsAll(tenantId, userId),
      auditEvents: await this.accounts.listAuditByActor(tenantId, userId),
    };
    // Queries run outside a transaction; this single INSERT autocommits on its own.
    await this.audit.record(args.principal, "account.exported", userId);
    return Result.ok(result);
  }
}
