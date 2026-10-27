// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Checkbox } from "@chakra-ui/react";
import { PiDownloadSimple, PiWarningCircle } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { dateLabel } from "@/services/date.service";
import { DeleteAccountDialog } from "./components/delete-account-dialog/delete-account-dialog.view";
import { useAccountController } from "./account.controller";
export function Account() {
  const c = useAccountController();
  return (
    <div className="page account-page">
      <h1>{c.t("accountTitle")}</h1>
      <p className="page-subtitle">{c.t("accountSubtitle")}</p>
      {!c.session ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("accountSignedOut")}</h2>
          <p>{c.t("accountSignedOutBody")}</p>
          <Button colorPalette="court" size="lg" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : c.query.isPending ? (
        <Feedback message={c.t("loading")} />
      ) : c.query.isError || !c.account ? (
        <Feedback
          message={c.t("loadError")}
          error
          retryLabel={c.t("retry")}
          retry={() => {
            void c.query.refetch();
          }}
        />
      ) : (
        <div className="account-sections">
          <section className="account-section">
            <h2>{c.t("accountData")}</h2>
            <dl className="facts">
              <div>
                <dt>{c.t("accountName")}</dt>
                <dd>{c.account.displayName}</dd>
              </div>
              <div>
                <dt>{c.t("accountRole")}</dt>
                <dd>{c.t("roleCitizen")}</dd>
              </div>
              <div>
                <dt>{c.t("accountBookings")}</dt>
                <dd className="count">{c.account.bookings}</dd>
              </div>
              <div>
                <dt>{c.t("accountNotices")}</dt>
                <dd className="count">{c.account.notifications}</dd>
              </div>
            </dl>
          </section>
          <section className="account-section">
            <h2>{c.t("privacySection")}</h2>
            <dl className="facts">
              <div>
                <dt>{c.t("consentVersion")}</dt>
                <dd>
                  {c.latestConsent ? (
                    <>
                      <span className="count">
                        {c.latestConsent.legalVersion}
                      </span>
                      <span className="muted small">
                        {c.t("consentAccepted")}{" "}
                        {dateLabel(
                          c.latestConsent.acceptedAt,
                          c.municipality.timezone,
                          c.locale,
                        )}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>{c.t("retentionNote")}</dt>
                <dd>
                  <span className="count">
                    {c.municipality.retentionMonths}
                  </span>{" "}
                  {c.t("months")}
                </dd>
              </div>
            </dl>
            {!c.account.consentUpToDate && (
              <p className="notice-warning" role="status">
                <PiWarningCircle size={20} aria-hidden="true" />
                {c.t("consentOutdated")}
              </p>
            )}
            <button
              type="button"
              className="text-button"
              onClick={c.showPrivacy}
            >
              {c.t("readPrivacy")}
            </button>
          </section>
          <section className="account-section">
            <h2>{c.t("noticesTitle")}</h2>
            {c.account.email ? (
              <>
                <dl className="facts">
                  <div>
                    <dt>{c.t("noticesEmail")}</dt>
                    <dd>{c.account.email}</dd>
                  </div>
                </dl>
                <p>{c.t("noticesAlways")}</p>
                <Checkbox.Root
                  className="consent-check"
                  colorPalette="court"
                  size="lg"
                  checked={c.account.reminderEmails}
                  disabled={c.preferences.isPending}
                  onCheckedChange={(event) =>
                    c.setReminderEmails(event.checked === true)
                  }
                >
                  <Checkbox.HiddenInput aria-describedby="reminder-hint" />
                  <Checkbox.Control />
                  <Checkbox.Label>{c.t("reminderLabel")}</Checkbox.Label>
                </Checkbox.Root>
                <p id="reminder-hint" className="muted small">
                  {c.reminderHint}
                </p>
                {c.preferences.isSuccess && (
                  <p role="status" className="success-body">
                    {c.t("reminderSaved")}
                  </p>
                )}
                {c.preferences.isError && (
                  <p role="alert" className="error-text">
                    {c.t("reminderError")}
                  </p>
                )}
              </>
            ) : (
              <p>{c.t("noticesNoEmail")}</p>
            )}
          </section>
          <section className="account-section">
            <h2>{c.t("downloadTitle")}</h2>
            <p>{c.t("downloadBody")}</p>
            <Button
              variant="outline"
              size="lg"
              alignSelf="flex-start"
              onClick={() => {
                void c.download();
              }}
              loading={c.exportData.isPending}
            >
              <PiDownloadSimple size={20} aria-hidden="true" />
              {c.t("download")}
            </Button>
            {c.exportData.isSuccess && (
              <p role="status" className="success-body">
                {c.t("downloadReady")}
              </p>
            )}
            {c.exportData.isError && (
              <p role="alert" className="error-text">
                {c.t("downloadError")}
              </p>
            )}
          </section>
          <section className="account-section danger-zone">
            <h2>{c.t("dangerZone")}</h2>
            <p>{c.t("deleteBody")}</p>
            <Button
              colorPalette="red"
              size="lg"
              alignSelf="flex-start"
              onClick={c.openDelete}
            >
              {c.t("deleteAccount")}
            </Button>
          </section>
        </div>
      )}
      <DeleteAccountDialog
        open={c.deleting}
        pending={c.remove.isPending}
        error={c.remove.error?.message ?? ""}
        t={c.t}
        onClose={c.closeDelete}
        onConfirm={() => {
          void c.confirmDelete();
        }}
      />
    </div>
  );
}
