// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Facility } from "../../domain/facility.entity";
import { FacilityRepository } from "../../domain/facility.repository";
import { OpeningCalendar } from "../../domain/opening-calendar";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
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
    private readonly municipalities: Municipalities,
    private readonly calendar: OpeningCalendar,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    patch: Partial<Omit<Facility, "id" | "tenantId">>;
    mode: "create" | "update";
  }): Promise<Result<Facility, SaveFacilityError>> {
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
      openingCalendar: "",
      rules: "",
    };
    const patch = Object.fromEntries(
      Object.entries(args.patch).filter(([, value]) => value !== undefined),
    );
    if (existing && Object.keys(patch).length === 0) return Result.ok(existing);
    const facility = { ...(existing ?? defaults), ...patch };
    if (existing && args.mode === "create") {
      return Object.entries(patch).every(
        ([key, value]) => existing[key as keyof Facility] === value,
      )
        ? Result.ok(existing)
        : Result.err(failure("id_reused"));
    }
    if (
      !facility.name.trim() ||
      !facility.address.trim() ||
      !this.calendar.validate(facility.openingCalendar, municipality.timezone)
    )
      return Result.err(failure("validation"));
    if (
      existing &&
      (existing.openingCalendar !== facility.openingCalendar ||
        existing.slotMinutes !== facility.slotMinutes ||
        existing.status !== facility.status) &&
      (await this.facilities.hasFutureBookings(
        municipality.id,
        args.id,
        this.clock.now(),
      ))
    )
      return Result.err(failure("calendar_in_use"));
    const saved = await this.facilities.save(facility);
    if (saved.isFailure)
      return saved.fold<Result<Facility, SaveFacilityError>>(
        () => Result.ok(facility),
        (error) => Result.err(error),
      );
    await this.audit.record(
      args.principal,
      args.mode === "create" ? "facility.created" : "facility.updated",
      args.id,
    );
    return Result.ok(facility);
  }
}
