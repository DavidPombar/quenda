// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityPhotoRepository } from "../../domain/facility-photo.repository";
import { cleanAlt } from "./add-facility-photo.command";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Changes a photo's alternative text or its place in the gallery. */
@Injectable()
export class UpdateFacilityPhoto {
  constructor(
    private readonly photos: FacilityPhotoRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    facilityId: string;
    photoId: string;
    alt: { gl?: string; es?: string };
    position: number;
  }): Promise<
    Result<
      void,
      AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">
    >
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const alt = cleanAlt(args.alt);
    if (!alt) return Result.err(failure("validation"));
    const tenantId = args.principal.tenantId;
    const photo = (await this.photos.list(tenantId, [args.facilityId])).find(
      (value) => value.id === args.photoId,
    );
    if (!photo) return Result.err(failure("not_found"));
    await this.photos.update(tenantId, photo.id, {
      alt,
      position: args.position,
    });
    await this.audit.record(
      args.principal,
      "facility.photo_updated",
      args.facilityId,
      { photoId: photo.id, position: args.position },
    );
    return Result.ok();
  }
}
