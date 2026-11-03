// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { PiCheckCircle, PiHourglassMedium, PiX } from "react-icons/pi";
import { localized } from "@/services/catalog.service";
import { fill } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { PublicActivityDetails } from "@/types/models";
import { useEnrolPanelController } from "./enrol-panel.controller";
/** Free places and enrolment in an activity (#97): enrol, join its waiting list or leave. */
export function EnrolPanel(p: {
  activity: PublicActivityDetails;
  context: AppContext;
}) {
  const c = useEnrolPanelController(p);
  const { t, locale, session, municipality } = p.context;
  const a = p.activity;
  const full = a.enrolment === "full";
  return (
    <section className="enrol-panel" aria-labelledby="enrol-panel-title">
      <h2 id="enrol-panel-title">{t("enrolment")}</h2>
      <p>
        {a.freePlaces > 0
          ? fill(t("activityFreePlaces"), {
              free: a.freePlaces,
              places: a.places,
            })
          : t("activityNoPlaces")}
        {a.waiting > 0 &&
          ` ${fill(t("activityWaitingCount"), { count: a.waiting })}`}
      </p>
      {c.forMinors ? (
        c.canEnrol && (
          <p>
            {t("enrolMinorsHow")}{" "}
            <a href={`mailto:${municipality.contact}`}>
              {municipality.contact}
            </a>
          </p>
        )
      ) : c.mine ? (
        <div className="enrol-state">
          <p
            className={`booking-status ${c.mine.status === "enrolled" ? "upcoming" : "waiting"}`}
          >
            {c.mine.status === "enrolled" ? (
              <PiCheckCircle size={20} aria-hidden="true" />
            ) : (
              <PiHourglassMedium size={20} aria-hidden="true" />
            )}
            {c.mine.status === "enrolled"
              ? t("enrolledNotice")
              : fill(t("enrolledWaiting"), {
                  position: c.mine.position ?? "",
                })}
          </p>
          <Button
            variant="outline"
            loading={c.leave.isPending}
            onClick={() => c.mine && c.leave.mutate(c.mine.id)}
          >
            {t("enrolLeave")}
          </Button>
          {c.leave.error && (
            <p role="alert" className="error-text">
              {c.leave.error.message}
            </p>
          )}
        </div>
      ) : c.canEnrol ? (
        session ? (
          <Button colorPalette="court" size="lg" onClick={c.open}>
            {t(full ? "enrolWaitlistAction" : "enrolAction")}
          </Button>
        ) : (
          <Button colorPalette="court" size="lg" onClick={p.context.signIn}>
            {t("enrolSignIn")}
          </Button>
        )
      ) : null}
      <Dialog.Root
        open={c.confirming}
        onOpenChange={(event) => {
          if (!event.open) c.close();
        }}
        placement="center"
        scrollBehavior="inside"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>
                  {fill(t("enrolTitle"), { name: localized(a.name, locale) })}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {/* Present from the start so the result is announced (WCAG 4.1.3). */}
                <div role="status">
                  {c.enrol.isSuccess && (
                    <p className="success-body">
                      <PiCheckCircle size={22} aria-hidden="true" />
                      {t(
                        c.enrol.data.status === "waiting"
                          ? "enrolDoneWaiting"
                          : "enrolDone",
                      )}
                    </p>
                  )}
                </div>
                {!c.enrol.isSuccess && (
                  <p>{t(full ? "enrolWaitlistBody" : "enrolBody")}</p>
                )}
                <p className="muted small">{t("activityPricesNote")}</p>
                {c.enrol.error && (
                  <p role="alert" className="error-text">
                    {c.enrol.error.message}
                  </p>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                {c.enrol.isSuccess ? (
                  <Button colorPalette="court" size="lg" onClick={c.close}>
                    {t("close")}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={c.close}
                      disabled={c.enrol.isPending}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      colorPalette="court"
                      size="lg"
                      loading={c.enrol.isPending}
                      onClick={c.confirm}
                    >
                      {t("enrolConfirm")}
                    </Button>
                  </>
                )}
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  size="md"
                  aria-label={t("close")}
                  disabled={c.enrol.isPending}
                >
                  <PiX size={20} aria-hidden="true" />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </section>
  );
}
