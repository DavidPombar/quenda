// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccessRepository } from "../../domain/access.repository";
import { AccessKeyRepository } from "../../domain/access-key.repository";
import { AccessPass } from "../../domain/access.read-model";
import { AccessSigner } from "../access-signer";
import { AccessWindow } from "../access-window";
import { accessCode } from "../access-code";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type IssueAccessPassError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"booking_cancelled">
  | AppError<"validation">;
/**
 * Signs a pass for the person's own confirmed reservation. It is a command because the
 * municipality's first key is created on first use.
 */
@Injectable()
export class IssueAccessPass {
  constructor(
    private readonly access: AccessRepository,
    private readonly keys: AccessKeyRepository,
    private readonly signer: AccessSigner,
    private readonly window: AccessWindow,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    bookingId: string;
  }): Promise<Result<AccessPass, IssueAccessPassError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const settings = await this.municipalities.find(tenantId);
    const target = await this.access.passTarget(
      tenantId,
      userId,
      args.bookingId,
    );
    if (!settings || !target) return Result.err(failure("not_found"));
    if (target.status !== "confirmed")
      return Result.err(failure("booking_cancelled"));
    const now = this.clock.now();
    if (Temporal.Instant.compare(target.end, now) <= 0)
      return Result.err(failure("validation"));
    let key = await this.keys.active(tenantId);
    if (!key) {
      key = this.signer.generate(now);
      await this.keys.insert(tenantId, key);
    }
    const window = this.window.of({
      openingCalendar: target.openingCalendar,
      timezone: settings.timezone,
      start: target.start,
      end: target.end,
    });
    const seconds = (instant: Temporal.Instant) =>
      Math.floor(instant.epochMilliseconds / 1000);
    const token = this.signer.sign(key, {
      iss: settings.slug,
      sub: target.bookingId,
      fac: target.facilityId,
      iat: seconds(now),
      nbf: seconds(window.from),
      exp: seconds(window.until),
    });
    return Result.ok({
      token,
      code: accessCode(target.bookingId),
      validFrom: window.from,
      validUntil: window.until,
    });
  }
}
