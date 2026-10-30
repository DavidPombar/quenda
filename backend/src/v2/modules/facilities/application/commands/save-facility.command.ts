// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Facility } from "../../domain/facility.entity";
import { FacilityDetails } from "../../domain/facility.read-model";
import { FacilityRepository } from "../../domain/facility.repository";
import { ResourceRepository } from "../../domain/resource.repository";
import { OpeningCalendar } from "../../domain/opening-calendar";
import { SportRepository } from "../../domain/sport.repository";
import { FacilityDescriber } from "../facility-details";
import { CATEGORIES } from "../../../../shared/application/categories";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import {
  Outbox,
  queueBookingChange,
} from "../../../../shared/application/outbox";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SaveFacilityError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"calendar_in_use">
  | AppError<"id_reused">;
@Injectable()
export class SaveFacility {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly municipalities: Municipalities,
    private readonly calendar: OpeningCalendar,
    private readonly clock: Clock,
    private readonly audit: Audit,
    private readonly ids: IdGenerator,
    private readonly outbox: Outbox,
    private readonly sports: SportRepository,
    private readonly describer: FacilityDescriber,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    patch: Partial<Omit<Facility, "id" | "tenantId">>;
    mode: "create" | "update";
    /**
     * Unexpected closure (C3): when the status leaves "active" with upcoming bookings, they are
     * cancelled with this reason and each person is notified. Without it the change is refused.
     */
    closureReason?: string;
  }): Promise<Result<FacilityDetails, SaveFacilityError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const municipality = await this.municipalities.find(
      args.principal.tenantId,
    );
    if (!municipality) return Result.err(failure("not_found"));
    const existing = await this.facilities.find(
      args.principal.tenantId,
      args.id,
      true,
    );
    if (args.mode === "update" && !existing)
      return Result.err(failure("not_found"));
    const defaults: Facility = {
      id: args.id,
      tenantId: args.principal.tenantId,
      name: "",
      sport: "padel",
      address: "",
      description: "",
      accessible: false,
      status: "active",
      slotMinutes: 60,
      priceCents: 0,
      prices: [],
      openingCalendar: "",
      rules: "",
      followsMunicipalHolidays: true,
      latitude: null,
      longitude: null,
    };
    const patch = Object.fromEntries(
      Object.entries(args.patch).filter(([, value]) => value !== undefined),
    );
    const details = async (value: Facility): Promise<FacilityDetails> =>
      (await this.describer.describe(value.tenantId, [value]))[0];
    if (existing && Object.keys(patch).length === 0)
      return Result.ok(await details(existing));
    const merged: Facility = { ...(existing ?? defaults), ...patch };
    const facility: Facility = {
      ...merged,
      prices: [...merged.prices].sort(
        (a, b) =>
          CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category),
      ),
    };
    if (existing && args.mode === "create") {
      return Object.keys(patch).every((key) =>
        same(existing[key as keyof Facility], facility[key as keyof Facility]),
      )
        ? Result.ok(await details(existing))
        : Result.err(failure("id_reused"));
    }
    if (
      new Set(facility.prices.map((price) => price.category)).size !==
        facility.prices.length ||
      !facility.name.trim() ||
      !facility.address.trim() ||
      (facility.latitude === null) !== (facility.longitude === null) ||
      !this.calendar.validate(
        facility.openingCalendar,
        municipality.timezone,
      ) ||
      // A new or changed sport must be a visible one of the catalogue (#26); facilities that
      // already have a sport the municipality hid keep it.
      (facility.sport !== existing?.sport &&
        (await this.sports.find(municipality.id, facility.sport))?.hidden !==
          false)
    )
      return Result.err(failure("validation"));
    const now = this.clock.now();
    const scheduleChanged =
      !!existing &&
      (existing.openingCalendar !== facility.openingCalendar ||
        existing.slotMinutes !== facility.slotMinutes);
    const closing =
      !!existing &&
      existing.status !== facility.status &&
      facility.status !== "active";
    const reason = args.closureReason?.trim();
    const upcoming =
      scheduleChanged || (existing && existing.status !== facility.status)
        ? await this.facilities.upcomingBookings(municipality.id, args.id, now)
        : [];
    if (upcoming.length && (scheduleChanged || !closing || !reason))
      return Result.err(failure("calendar_in_use"));
    const saved = await this.facilities.save(facility);
    if (saved.isFailure)
      return saved.fold<Result<FacilityDetails, SaveFacilityError>>(
        () =>
          Result.ok({
            ...facility,
            resources: [],
            sportName: { gl: facility.sport, es: facility.sport },
            sportArt: "generic",
            photos: [],
          }),
        (error) => Result.err(error),
      );
    if (!existing || existing.status !== facility.status)
      await this.facilities.recordStatus(
        facility.tenantId,
        facility.id,
        facility.status,
        now,
      );
    // A new facility is bookable at once through its default resource (same id and name).
    if (!existing)
      await this.resources.add({
        id: facility.id,
        tenantId: facility.tenantId,
        facilityId: facility.id,
        name: facility.name,
        position: 0,
        parentId: null,
        active: true,
      });
    if (upcoming.length && reason) {
      const cancelled = upcoming.map((booking) => ({
        id: booking.id,
        userId: booking.userId,
        notificationId: this.ids.next(),
      }));
      await this.facilities.cancelBookings({
        tenantId: municipality.id,
        bookings: cancelled,
        reason,
        at: now,
      });
      for (const booking of cancelled)
        await queueBookingChange(this.outbox, {
          newId: () => this.ids.next(),
          tenantId: municipality.id,
          userId: booking.userId,
          bookingId: booking.id,
          kind: "cancelled_by_municipality",
          notificationId: booking.notificationId,
          createdAt: now,
        });
      for (const booking of upcoming)
        await this.audit.record(
          args.principal,
          "booking.cancelled_by_municipality",
          booking.id,
          {
            facilityId: args.id,
            start: booking.start.toString(),
            end: booking.end.toString(),
            reason,
          },
        );
    }
    await this.audit.record(
      args.principal,
      args.mode === "create" ? "facility.created" : "facility.updated",
      args.id,
      {
        ...changes(existing, facility),
        ...(upcoming.length && reason
          ? {
              closure: {
                reason,
                cancelledBookings: upcoming.length,
                people: new Set(upcoming.map((booking) => booking.userId)).size,
              },
            }
          : {}),
      },
    );
    return Result.ok(await details(facility));
  }
}
type AuditedField = Exclude<
  keyof Facility,
  "id" | "tenantId" | "openingCalendar"
>;
/**
 * Audit details limited to changed fields. The iCalendar text can be large, so only a marker
 * records that it changed.
 */
function changes(existing: Facility | null, facility: Facility) {
  const fields = (Object.keys(facility) as (keyof Facility)[]).filter(
    (key): key is AuditedField =>
      key !== "id" &&
      key !== "tenantId" &&
      key !== "openingCalendar" &&
      (!existing || !same(existing[key], facility[key])),
  );
  const pick = (source: Facility) =>
    Object.fromEntries(fields.map((key) => [key, source[key]]));
  return {
    before: existing ? pick(existing) : null,
    after: pick(facility),
    ...(!existing || existing.openingCalendar !== facility.openingCalendar
      ? { openingCalendarChanged: true }
      : {}),
  };
}
function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}
