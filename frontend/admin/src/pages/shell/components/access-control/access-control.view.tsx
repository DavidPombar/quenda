// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import {
  PiArrowsClockwise,
  PiCheckCircle,
  PiProhibit,
  PiQrCode,
  PiWarningCircle,
} from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import type { TextKey } from "@/services/i18n.service";
import type { PassCheck } from "@/services/access-pass.service";
import { QrCamera } from "./components/qr-camera/qr-camera.view";
import { useAccessControlController } from "./access-control.controller";
const RESULTS = {
  valid: [PiCheckCircle, "accessResultValid"],
  already_in: [PiWarningCircle, "accessResultAlreadyIn"],
  revoked: [PiProhibit, "accessResultRevoked"],
  out_of_window: [PiWarningCircle, "accessResultOutOfWindow"],
  invalid: [PiProhibit, "accessResultInvalid"],
} as const satisfies Record<PassCheck["result"], readonly [unknown, TextKey]>;
export function AccessControl() {
  const c = useAccessControlController();
  const [ResultIcon, resultLabel] = c.result ? RESULTS[c.result.result] : [];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{c.t("accessControl")}</h1>
          <p className="page-subtitle">{c.t("accessSubtitle")}</p>
        </div>
      </div>
      {!c.staff ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("accessStaffOnly")}</h2>
          <Button colorPalette="court" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : c.dayQuery.isPending ? (
        <Feedback message={c.t("loading")} />
      ) : !c.day ? (
        <Feedback
          message={c.t("accessNoDay")}
          error
          retryLabel={c.t("accessSync")}
          retry={() => {
            void c.sync();
          }}
        />
      ) : (
        <div className="access-control">
          <div className="access-sync">
            <p role="status" className={c.offline ? "notice" : undefined}>
              {c.syncedLabel} {c.pendingLabel}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void c.sync();
              }}
              loading={c.dayQuery.isFetching}
            >
              <PiArrowsClockwise size={20} aria-hidden="true" />
              {c.t("accessSync")}
            </Button>
          </div>
          {c.conflicts.map((message) => (
            <p key={message} role="alert" className="error-text">
              {message}
            </p>
          ))}
          <section className="access-scan" aria-labelledby="access-scan-title">
            <h2 id="access-scan-title" className="sr-only">
              {c.t("accessScan")}
            </h2>
            <Button
              colorPalette="court"
              size="lg"
              onClick={c.toggleScanning}
              aria-pressed={c.scanning}
            >
              <PiQrCode size={22} aria-hidden="true" />
              {c.t(c.scanning ? "accessStopScan" : "accessScan")}
            </Button>
            {c.scanning && (
              <QrCamera
                onCode={(text) => {
                  void c.scanned(text);
                }}
                help={c.t("accessCameraHelp")}
                error={c.t("accessCameraError")}
              />
            )}
            <div role="status" aria-live="assertive">
              {c.result && ResultIcon && resultLabel && (
                <div className={`access-result ${c.result.result}`}>
                  <ResultIcon size={28} aria-hidden="true" />
                  <div>
                    <strong>{c.t(resultLabel)}</strong>
                    {"booking" in c.result && c.result.booking && (
                      <p>
                        {c.result.booking.facilityName} ·{" "}
                        {c.time(c.result.booking.start)}–
                        {c.time(c.result.booking.end)} ·{" "}
                        {c.result.booking.holder} · {c.result.booking.code}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
          <section aria-labelledby="access-list-title">
            <h2 id="access-list-title">{c.t("accessList")}</h2>
            <form
              className="audit-filters"
              aria-label={c.t("accessList")}
              onSubmit={(event) => event.preventDefault()}
            >
              <Field.Root className="field">
                <Field.Label>{c.t("accessSearch")}</Field.Label>
                <Input
                  type="search"
                  value={c.search}
                  onChange={(event) => c.setSearch(event.target.value)}
                />
              </Field.Root>
              <Field.Root className="field">
                <Field.Label>{c.t("bookingsFacility")}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={c.facilityId}
                    onChange={(event) => c.setFacilityId(event.target.value)}
                  >
                    <option value="">{c.t("accessAllFacilities")}</option>
                    {c.facilities.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </form>
            {c.bookings.length === 0 ? (
              <p className="muted">{c.t("accessEmpty")}</p>
            ) : (
              <ul className="access-list">
                {c.bookings.map((booking) => (
                  <li
                    key={booking.id}
                    className={`access-row ${booking.status}`}
                  >
                    <div>
                      <strong>
                        {c.time(booking.start)}–{c.time(booking.end)} ·{" "}
                        {booking.facilityName}
                      </strong>
                      <span>
                        {booking.holder} · <code>{booking.code}</code>
                      </span>
                    </div>
                    {booking.status === "cancelled" ? (
                      <span className="access-tag">
                        {c.t("accessStatusCancelled")}
                      </span>
                    ) : booking.status === "no_show" ? (
                      <span className="access-tag">
                        {c.t("accessStatusNoShow")}
                      </span>
                    ) : c.entered.has(booking.id) ? (
                      <span className="access-tag entered">
                        <PiCheckCircle size={18} aria-hidden="true" />
                        {c.enteredLabel(booking)}
                      </span>
                    ) : (
                      <div className="row-actions">
                        <Button
                          size="sm"
                          colorPalette="court"
                          onClick={() => c.checkIn(booking)}
                          aria-label={`${c.t("accessCheckIn")}: ${booking.code}`}
                        >
                          {c.t("accessCheckIn")}
                        </Button>
                        {c.canMarkNoShow(booking) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => c.markNoShow(booking)}
                            loading={c.manage.isPending}
                            aria-label={`${c.t("accessNoShow")}: ${booking.code}`}
                          >
                            {c.t("accessNoShow")}
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
