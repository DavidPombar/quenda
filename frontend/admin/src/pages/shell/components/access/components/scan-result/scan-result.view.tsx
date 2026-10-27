// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  PiCheckCircle,
  PiClock,
  PiCloudSlash,
  PiXCircle,
} from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { AccessClaims } from "@/services/credential.service";
import type { CheckIn, ManagedBooking } from "@/types/models";
type Status =
  | "valid"
  | "not_yet_valid"
  | "expired"
  | "other_municipality"
  | "invalid"
  | "no_keys"
  | "rejected";
const TITLES = {
  valid: "accessValid",
  not_yet_valid: "accessTooEarly",
  expired: "accessExpired",
  other_municipality: "accessOtherMunicipality",
  invalid: "accessInvalid",
  no_keys: "accessNoKeys",
  rejected: "accessRejected",
} as const satisfies Record<Status, TextKey>;
export function ScanResult(p: {
  status: Status;
  claims: AccessClaims | null;
  booking: ManagedBooking | null;
  checkIn: CheckIn | null;
  queued: boolean;
  error: string;
  t: (key: TextKey) => string;
  window: (claims: AccessClaims) => string;
}) {
  const ok = p.status === "valid";
  const waiting = p.status === "not_yet_valid";
  const Icon = ok
    ? p.queued
      ? PiCloudSlash
      : PiCheckCircle
    : waiting
      ? PiClock
      : PiXCircle;
  const name = p.checkIn?.displayName ?? p.booking?.displayName;
  const facility = p.checkIn?.facilityName ?? p.booking?.facilityName;
  return (
    <div
      className={`scan-result ${ok ? "ok" : waiting ? "wait" : "denied"}`}
      role={ok ? "status" : "alert"}
    >
      <Icon size={48} aria-hidden="true" />
      <div>
        <h2>
          {p.checkIn?.alreadyCheckedIn
            ? p.t("accessAlreadyIn")
            : p.t(TITLES[p.status])}
        </h2>
        {name && <p className="scan-name">{name}</p>}
        {facility && <p>{facility}</p>}
        {p.claims && (
          <p className="scan-window">
            {p.t("accessWindow")}: {p.window(p.claims)}
          </p>
        )}
        {p.queued && <p>{p.t("accessQueued")}</p>}
        {p.error && <p>{p.error}</p>}
      </div>
    </div>
  );
}
