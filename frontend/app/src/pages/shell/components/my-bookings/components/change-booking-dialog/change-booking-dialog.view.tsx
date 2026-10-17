// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal, NativeSelect } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import { timeLabel, longDayLabel } from "@/services/date.service";
import { Feedback } from "@/components/feedback/feedback.view";
import type { Booking } from "@/types/models";
import type { AppContext } from "@/types/app-context";
import { useChangeBookingDialogController } from "./change-booking-dialog.controller";
export function ChangeBookingDialog(p: {
  booking: Booking;
  context: AppContext;
  onClose: () => void;
}) {
  const c = useChangeBookingDialogController(p);
  const { t, municipality, locale } = p.context;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.update.isPending) p.onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{t("changeTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <h3>{p.booking.facilityName}</h3>
              <label className="field">
                <span>{t("date")}</span>
                <NativeSelect.Root size="lg">
                  <NativeSelect.Field
                    value={c.date}
                    onChange={(event) => c.changeDate(event.target.value)}
                  >
                    {c.dateOptions.map((day) => (
                      <option key={day} value={day}>
                        {longDayLabel(day, locale)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </label>
              {c.query.isPending ? (
                <Feedback message={t("loading")} />
              ) : c.query.isError ? (
                <Feedback
                  message={t("loadError")}
                  error
                  retryLabel={t("retry")}
                  retry={() => {
                    void c.query.refetch();
                  }}
                />
              ) : (
                <div className="slots-grid">
                  {c.query.data
                    ?.filter((slot) => slot.status === "available")
                    .map((slot) => (
                      <button
                        type="button"
                        key={slot.start}
                        className={`time-slot ${c.selected === slot.start ? "selected" : ""}`}
                        aria-pressed={c.selected === slot.start}
                        onClick={() => c.setSelected(slot.start)}
                      >
                        <strong>
                          {timeLabel(slot.start, municipality.timezone)}
                        </strong>
                        <span>{t("slotFree")}</span>
                      </button>
                    ))}
                </div>
              )}
              {c.query.data?.every((slot) => slot.status !== "available") && (
                <p className="muted">{t("noSlots")}</p>
              )}
              {c.update.error && (
                <p role="alert" className="error-text">
                  {c.update.error.message}
                </p>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                size="lg"
                onClick={p.onClose}
                disabled={c.update.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                colorPalette="court"
                size="lg"
                disabled={!c.selected}
                loading={c.update.isPending}
                onClick={() => {
                  void c.confirm();
                }}
              >
                {t("confirmChange")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                aria-label={t("close")}
                disabled={c.update.isPending}
              >
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
