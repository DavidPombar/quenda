// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { CredentialKeys } from "../domain/credential-keys";
import { AccessBooking } from "../domain/access-booking.repository";
import { credentialWindow, toEpochSeconds } from "../domain/access-credential";
import { OpeningCalendar } from "../../facilities/domain/opening-calendar";
import { MunicipalitySettings } from "../../../shared/application/municipality-settings";
export interface IssuedCredential {
  token: string;
  keyId: string;
  notBefore: Temporal.Instant;
  expiresAt: Temporal.Instant;
}
/** Signs the temporary credential of a confirmed booking (M3); shared by the app and the webhook. */
@Injectable()
export class CredentialIssuer {
  constructor(
    private readonly keys: CredentialKeys,
    private readonly calendar: OpeningCalendar,
  ) {}
  async issue(
    settings: MunicipalitySettings,
    booking: AccessBooking,
  ): Promise<IssuedCredential> {
    const { notBefore, expiresAt } = credentialWindow({
      start: booking.start,
      end: booking.end,
      openings: this.calendar.expand({
        calendar: booking.openingCalendar,
        timezone: settings.timezone,
        date: booking.start.toZonedDateTimeISO(settings.timezone).toPlainDate(),
      }),
    });
    const key = await this.keys.active(settings.id);
    const token = await this.keys.sign(settings.id, {
      iss: settings.slug,
      sub: booking.id,
      fac: booking.facilityId,
      nbf: toEpochSeconds(notBefore),
      exp: toEpochSeconds(expiresAt),
    });
    return { token, keyId: key.id, notBefore, expiresAt };
  }
}
