// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import {
  FacilityPhotoRepository,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
} from "../../domain/facility-photo.repository";
import { detectLogoType } from "../../../municipalities/domain/logo";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type AddFacilityPhotoError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"unsupported_photo">
  | AppError<"photo_too_large">
  | AppError<"photo_limit">;
/** Cleans an alternative text; Spanish may be empty and then shows the Galician one. */
export function cleanAlt(alt: { gl?: string; es?: string }) {
  const value = { gl: alt.gl?.trim() ?? "", es: alt.es?.trim() ?? "" };
  return value.gl.length >= 1 &&
    value.gl.length <= 250 &&
    value.es.length <= 250
    ? value
    : null;
}
/** Adds a photo with its required alternative text, up to ten per facility (#26). */
@Injectable()
export class AddFacilityPhoto {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly photos: FacilityPhotoRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    facilityId: string;
    contentType: string;
    data: Uint8Array;
    alt: { gl?: string; es?: string };
  }): Promise<Result<{ id: string }, AddFacilityPhotoError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    // The lock serialises uploads, so the limit holds under concurrent requests.
    const facility = await this.facilities.find(
      tenantId,
      args.facilityId,
      true,
    );
    if (!facility) return Result.err(failure("not_found"));
    const alt = cleanAlt(args.alt);
    if (!alt) return Result.err(failure("validation"));
    if (args.data.byteLength > MAX_PHOTO_BYTES)
      return Result.err(failure("photo_too_large"));
    const contentType = detectLogoType(args.data);
    if (!contentType || contentType !== args.contentType)
      return Result.err(failure("unsupported_photo"));
    const existing = await this.photos.list(tenantId, [facility.id]);
    if (existing.length >= MAX_PHOTOS)
      return Result.err(failure("photo_limit"));
    const id = this.ids.next();
    await this.photos.add(
      tenantId,
      {
        id,
        facilityId: facility.id,
        contentType,
        alt,
        position: Math.max(0, ...existing.map((photo) => photo.position + 1)),
        createdAt: this.clock.now(),
      },
      args.data,
    );
    await this.audit.record(
      args.principal,
      "facility.photo_added",
      facility.id,
      {
        photoId: id,
        bytes: args.data.byteLength,
      },
    );
    return Result.ok({ id });
  }
}
