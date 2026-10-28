// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { TariffResolver } from "../tariff-resolver";
import { Tariff } from "../../domain/resolve-tariff";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetTariffError = AppError<"forbidden"> | AppError<"not_found">;
/** The price shown before confirming a reservation (M2). */
@Injectable()
export class GetTariff {
  constructor(private readonly tariffs: TariffResolver) {}
  async execute(args: {
    principal: Principal;
    facilityId: string;
  }): Promise<Result<Tariff, GetTariffError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const tariff = await this.tariffs.resolve(
      args.principal.tenantId,
      args.principal.userId,
      args.facilityId,
    );
    return tariff ? Result.ok(tariff) : Result.err(failure("not_found"));
  }
}
