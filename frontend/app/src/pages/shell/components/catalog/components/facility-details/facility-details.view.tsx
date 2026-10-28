// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { NativeSelect } from "@chakra-ui/react";
import {
  PiArrowLeft,
  PiCaretDown,
  PiClock,
  PiMapPin,
  PiWheelchair,
} from "react-icons/pi";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { CourtArt } from "@/components/court-art/court-art.view";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { FacilityStatus } from "@/components/facility-status/facility-status.view";
import { Feedback } from "@/components/feedback/feedback.view";
import { ROUTES, routeFor } from "@/constants/routes";
import {
  timeLabel,
  dayParts,
  longDayLabel,
  money,
} from "@/services/date.service";
import { BookingDialog } from "./components/booking-dialog/booking-dialog.view";
import { ResourceGrid } from "./components/resource-grid/resource-grid.view";
import { useFacilityDetailsController } from "./facility-details.controller";
export function FacilityDetails() {
  const c = useFacilityDetailsController();
  if (c.facilities.isPending) return <Feedback message={c.t("loading")} />;
  if (!c.facility) return <Feedback message={c.t("notFound")} error />;
  const f = c.facility;
  return (
    <div className="page detail-page">
      <Link
        className="back-link"
        to={routeFor(c.municipality.slug, ROUTES.catalog)}
      >
        <PiArrowLeft size={20} aria-hidden="true" />
        {c.t("back")}
      </Link>
      <header className="detail-heading">
        <h1>{f.name}</h1>
        <div className="facility-tags">
          <SportTag sport={f.sport} label={c.t(f.sport)} />
          <FacilityStatus
            status={f.status}
            label={c.t(f.status === "active" ? "available" : f.status)}
          />
        </div>
      </header>
      <div className="detail-layout">
        <div className="detail-info">
          <div className="detail-art">
            <CourtArt sport={f.sport} status={f.status} />
          </div>
          <section className="info-panel">
            <h2>{c.t("about")}</h2>
            <p>{f.description}</p>
            <ul className="meta-list">
              <li>
                <PiMapPin size={20} aria-hidden="true" />
                {f.address}
              </li>
              <li>
                <PiClock size={20} aria-hidden="true" />
                {f.slotMinutes} {c.t("minutes")}
              </li>
              {f.accessible && (
                <li>
                  <PiWheelchair size={20} aria-hidden="true" />
                  {c.t("stepFree")}
                </li>
              )}
            </ul>
            <h3>{c.t("rules")}</h3>
            <p>{f.rules}</p>
            <p>
              {c.t("deadline")} {c.municipality.cancellationHours}{" "}
              {c.t("hoursBefore")}
            </p>
          </section>
        </div>
        <section
          className={`availability-panel sport-${f.sport}`}
          aria-labelledby="slots-title"
        >
          <div className="section-heading">
            <h2 id="slots-title">{c.t("selectSlot")}</h2>
            <strong className="panel-price">
              {f.priceCents ? money(f.priceCents, c.locale) : c.t("free")}
              {f.priceCents > 0 && <small>{c.t("perSlot")}</small>}
            </strong>
          </div>
          <div className="day-strip" role="group" aria-label={c.t("date")}>
            {c.days.map((day, i) => {
              const parts = dayParts(day, c.locale);
              return (
                <button
                  type="button"
                  key={day}
                  aria-pressed={c.date === day}
                  title={longDayLabel(day, c.locale)}
                  className={c.date === day ? "selected" : ""}
                  onClick={() => c.setDate(day)}
                >
                  <span className="day-name">
                    {i === 0
                      ? c.t("today")
                      : i === 1
                        ? c.t("tomorrow")
                        : parts.weekday}
                  </span>
                  <strong>{parts.day}</strong>
                  <span className="sr-only"> {parts.month}</span>
                </button>
              );
            })}
          </div>
          <label className="field">
            <span>{c.t("date")}</span>
            <NativeSelect.Root size="lg">
              <NativeSelect.Field
                value={c.date}
                onChange={(event) => c.setDate(event.target.value)}
              >
                {c.dateOptions.map((day) => (
                  <option key={day} value={day}>
                    {longDayLabel(day, c.locale)}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </label>
          {c.multiple && (
            <label className="field">
              <span>{c.t("resource")}</span>
              <NativeSelect.Root size="lg">
                <NativeSelect.Field
                  value={c.view}
                  onChange={(event) => c.setView(event.target.value)}
                >
                  {c.resourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  <option value={c.allResourcesValue}>
                    {c.t("allResources")}
                  </option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </label>
          )}
          <p className="muted small">{c.t("localTimes")}</p>
          {c.availability.isPending ? (
            <Feedback message={c.t("loading")} />
          ) : c.availability.isError ? (
            <Feedback
              message={c.t("loadError")}
              error
              retryLabel={c.t("retry")}
              retry={() => {
                void c.availability.refetch();
              }}
            />
          ) : c.grid ? (
            c.visibleColumns.length ? (
              <ResourceGrid
                caption={`${c.t("resourceGridCaption")}, ${longDayLabel(c.date, c.locale)}`}
                resourceHeader={c.t("resource")}
                outOfService={c.t("resourceOutOfService")}
                columns={c.visibleColumns}
                rows={c.rows}
              />
            ) : (
              <div className="empty-state small-empty">
                <SpotArt kind="bookings" size="sm" />
                <p>{c.t(c.pastCount ? "noSlotsLeft" : "noSlots")}</p>
              </div>
            )
          ) : c.visibleSlots.length ? (
            <div className="slots-grid">
              {c.visibleSlots.map((slot) => (
                <button
                  type="button"
                  className={`time-slot ${slot.status}`}
                  key={slot.start}
                  disabled={slot.status !== "available"}
                  onClick={() => c.select(slot)}
                >
                  <strong>
                    {timeLabel(slot.start, c.municipality.timezone)}
                  </strong>
                  <span>
                    {c.t(
                      slot.status === "available" ? "slotFree" : slot.status,
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state small-empty">
              <SpotArt kind="bookings" size="sm" />
              <p>{c.t(c.pastCount ? "noSlotsLeft" : "noSlots")}</p>
            </div>
          )}
          {c.pastCount > 0 && !c.availability.isPending && (
            <button
              type="button"
              className="past-toggle"
              aria-expanded={c.showPast}
              onClick={c.togglePast}
            >
              {c.t(c.showPast ? "hidePast" : "showPast")} ({c.pastCount})
              <PiCaretDown size={18} aria-hidden="true" />
            </button>
          )}
          <p className="booking-footnote">{c.t("payAtVenue")}</p>
        </section>
      </div>
      <BookingDialog
        open={!!c.selected}
        slot={c.selected}
        facility={f}
        resourceName={c.selectedResource}
        municipality={c.municipality}
        locale={c.locale}
        t={c.t}
        pending={c.create.isPending}
        success={c.create.isSuccess}
        error={c.create.error?.message ?? ""}
        onClose={c.close}
        onConfirm={c.reserve}
      />
    </div>
  );
}
