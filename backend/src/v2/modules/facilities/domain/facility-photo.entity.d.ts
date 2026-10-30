// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { LogoType } from "../../municipalities/domain/logo";
/** Photo of a facility (#26); the alternative text is required for accessibility. */
export interface FacilityPhoto {
  id: string;
  facilityId: string;
  contentType: LogoType;
  /** First characters of the SHA-256 of the image, used to version its URL. */
  version: string;
  alt: { gl: string; es: string };
  position: number;
  createdAt: Temporal.Instant;
}
