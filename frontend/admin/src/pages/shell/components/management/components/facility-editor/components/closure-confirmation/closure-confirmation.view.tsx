// SPDX-License-Identifier: AGPL-3.0-or-later
import type { FormEvent } from "react";
import { Field, Textarea } from "@chakra-ui/react";
import { PiWarning } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { Facility, FacilityImpact } from "@/types/models";
/** Confirmation step before an unexpected closure cancels upcoming bookings (C3). */
export function ClosureConfirmation(p: {
  impact: FacilityImpact;
  status: Facility["status"];
  reason: string;
  invalid: boolean;
  error?: string;
  t: (key: TextKey) => string;
  onReasonChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { t } = p;
  return (
    <form id="closure-form" noValidate onSubmit={p.onSubmit}>
      <div className="closure-warning" role="alert">
        <PiWarning size={24} aria-hidden="true" />
        <div>
          <h3>{t("closureTitle")}</h3>
          <p>
            {t("closureBookings")}: <strong>{p.impact.bookings}</strong> ·{" "}
            {t("closurePeople")}: <strong>{p.impact.people}</strong>
          </p>
          <p>
            {t("closureBody")} ({t(p.status)})
          </p>
        </div>
      </div>
      <Field.Root className="field" required invalid={p.invalid}>
        <Field.Label>
          {t("closureReason")}
          <Field.RequiredIndicator />
        </Field.Label>
        <Textarea
          name="closureReason"
          value={p.reason}
          maxLength={500}
          rows={3}
          onChange={(event) => p.onReasonChange(event.target.value)}
        />
        <Field.HelperText>{t("closureReasonHint")}</Field.HelperText>
        {p.invalid && (
          <Field.ErrorText>{t("closureReasonRequired")}</Field.ErrorText>
        )}
      </Field.Root>
      {p.error && (
        <p role="alert" className="error-text">
          {p.error}
        </p>
      )}
    </form>
  );
}
