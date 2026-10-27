// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccessBookingRepository } from "../../domain/access-booking.repository";
import { CredentialIssuer, IssuedCredential } from "../credential-issuer";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetCredentialError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"credential_unavailable">;
/** The citizen's QR for an upcoming or ongoing confirmed booking. */
@Injectable()
export class GetCredential {
  constructor(
    private readonly bookings: AccessBookingRepository,
    private readonly municipalities: Municipalities,
    private readonly issuer: CredentialIssuer,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<Result<IssuedCredential, GetCredentialError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const booking = await this.bookings.find(tenantId, args.id);
    const settings = await this.municipalities.find(tenantId);
    if (!booking || booking.userId !== userId || !settings)
      return Result.err(failure("not_found"));
    if (
      booking.status !== "confirmed" ||
      Temporal.Instant.compare(booking.end, this.clock.now()) <= 0
    )
      return Result.err(failure("credential_unavailable"));
    return Result.ok(await this.issuer.issue(settings, booking));
  }
}
