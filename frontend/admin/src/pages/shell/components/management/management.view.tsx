// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import {
  PiCheck,
  PiClock,
  PiDownloadSimple,
  PiLock,
  PiPencilSimple,
  PiPlus,
  PiWheelchair,
  PiWrench,
} from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { CourtArt } from "@/components/court-art/court-art.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { FacilityEditor } from "./components/facility-editor/facility-editor.view";
import { useManagementController } from "./management.controller";
const STATUS_ICON = { active: PiCheck, maintenance: PiWrench, closed: PiLock };
export function Management() {
  const c = useManagementController();
  const facilityCount = c.facilities.data?.length;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{c.municipality.name}</h1>
          <p className="page-subtitle">{c.t("managementSubtitle")}</p>
        </div>
        {c.isManager && (
          <div className="page-actions">
            <Button
              variant="outline"
              onClick={c.exportData}
              loading={c.exporting.isPending}
            >
              <PiDownloadSimple size={18} aria-hidden="true" />
              {c.t("exportData")}
            </Button>
            <Button colorPalette="court" onClick={() => c.setEditing("new")}>
              <PiPlus size={18} aria-hidden="true" />
              {c.t("newFacility")}
            </Button>
          </div>
        )}
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("managerOnly")}</h2>
          <p>{c.t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : (
        <>
          {c.exporting.isSuccess && (
            <p role="status" className="success-message">
              <PiCheck size={18} aria-hidden="true" />
              {c.t("exportDone")}
            </p>
          )}
          {c.exporting.isError && (
            <p role="alert" className="error-text">
              {c.t("exportError")}
            </p>
          )}
          {c.saved && (
            <p role="status" className="success-message">
              <PiCheck size={18} aria-hidden="true" />
              {c.t("facilitySaved")}
            </p>
          )}
          <section className="dashboard-section" aria-labelledby="activity">
            <h2 id="activity">{c.activityTitle}</h2>
            {c.insights.isError ? (
              <Feedback
                message={c.t("loadError")}
                error
                retryLabel={c.t("retry")}
                retry={() => {
                  void c.insights.refetch();
                }}
              />
            ) : (
              <dl className="stats-strip">
                {[
                  {
                    label: "statsBookings" as const,
                    hint: "statsBookingsHint" as const,
                    value: c.insights.data?.confirmed,
                  },
                  {
                    label: "statsOccupancy" as const,
                    hint: "statsOccupancyHint" as const,
                    value: c.insights.data
                      ? `${c.insights.data.occupancy} %`
                      : undefined,
                  },
                  {
                    label: "statsCancelled" as const,
                    hint: "statsCancelledHint" as const,
                    value: c.insights.data?.cancelled,
                  },
                  {
                    label: "statsFacilities" as const,
                    hint: "statsFacilitiesHint" as const,
                    value: c.insights.data?.facilities,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="stat">
                    <dt>{c.t(stat.label)}</dt>
                    <dd className="stat-value">{stat.value ?? "—"}</dd>
                    <dd className="stat-hint">{c.t(stat.hint)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          <div className="dashboard-columns">
            <section aria-labelledby="facilities">
              <h2 id="facilities" className="section-title">
                {c.t("facilities")}
                {facilityCount !== undefined && (
                  <span className="section-count">{facilityCount}</span>
                )}
              </h2>
              {c.facilities.isError ? (
                <Feedback
                  message={c.t("loadError")}
                  error
                  retryLabel={c.t("retry")}
                  retry={() => {
                    void c.facilities.refetch();
                  }}
                />
              ) : c.facilities.isPending ? (
                <Feedback message={c.t("loading")} />
              ) : facilityCount === 0 ? (
                <div className="panel-empty">
                  <SpotArt kind="search" size="sm" />
                  <h3>{c.t("noFacilities")}</h3>
                  <p>{c.t("noFacilitiesBody")}</p>
                  <Button
                    colorPalette="court"
                    onClick={() => c.setEditing("new")}
                  >
                    {c.t("newFacility")}
                  </Button>
                </div>
              ) : (
                <ul className="facility-list">
                  {c.facilities.data?.map((facility) => {
                    const StatusIcon = STATUS_ICON[facility.status];
                    return (
                      <li key={facility.id}>
                        <div className="facility-mini">
                          <CourtArt
                            sport={facility.sport}
                            status={facility.status}
                          />
                        </div>
                        <div className="facility-name">
                          <h3>{facility.name}</h3>
                          <ul className="facility-meta">
                            <li>
                              <span className={`sport-tag ${facility.sport}`}>
                                {c.t(facility.sport)}
                              </span>
                            </li>
                            <li>
                              <PiClock size={17} aria-hidden="true" />
                              {facility.slotMinutes} {c.t("minutes")}
                            </li>
                            <li>
                              {c.price(facility.priceCents)}
                              {facility.priceCents > 0 && ` ${c.t("perSlot")}`}
                            </li>
                            {facility.accessible && (
                              <li>
                                <PiWheelchair size={17} aria-hidden="true" />
                                {c.t("stepFreeShort")}
                              </li>
                            )}
                          </ul>
                        </div>
                        <span className={`facility-status ${facility.status}`}>
                          <StatusIcon size={18} aria-hidden="true" />
                          {c.t(facility.status)}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => c.setEditing(facility)}
                          aria-label={`${c.t("edit")} ${facility.name}`}
                        >
                          <PiPencilSimple size={17} aria-hidden="true" />
                          {c.t("edit")}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section className="usage-section" aria-labelledby="usage">
              <h2 id="usage" className="section-title">
                {c.t("usage")}
              </h2>
              <p className="section-hint">{c.t("usageHint")}</p>
              {c.insights.data && c.insights.data.byFacility.length ? (
                <ul className="usage-list">
                  {c.insights.data.byFacility.map((facility) => (
                    <li key={facility.id}>
                      <span className="usage-name">{facility.name}</span>
                      <strong className="usage-value">
                        {facility.bookings}
                        <span className="sr-only">
                          {" "}
                          {c.t(
                            facility.bookings === 1
                              ? "bookingUnit"
                              : "bookingsUnit",
                          )}
                        </span>
                      </strong>
                      <span
                        className={`usage-bar ${c.sportOf(facility.id) ?? "other"}`}
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            width: `${(facility.bookings / c.maxBookings) * 100}%`,
                          }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                c.insights.data && (
                  <p className="section-hint">{c.t("noActivity")}</p>
                )
              )}
            </section>
          </div>
          {c.editing && (
            <FacilityEditor
              facility={c.editing === "new" ? undefined : c.editing}
              municipality={c.municipality}
              t={c.t}
              onClose={c.close}
            />
          )}
        </>
      )}
    </div>
  );
}
