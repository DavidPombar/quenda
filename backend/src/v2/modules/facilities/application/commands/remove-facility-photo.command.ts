// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityPhotoRepository } from "../../domain/facility-photo.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class RemoveFacilityPhoto {
  constructor(
    private readonly photos: FacilityPhotoRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    facilityId: string;
    photoId: string;
  }): Promise<Result<void, AppError<"forbidden"> | AppError<"not_found">>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const removed = await this.photos.remove(
      args.principal.tenantId,
      args.facilityId,
      args.photoId,
    );
    if (!removed) return Result.err(failure("not_found"));
    await this.audit.record(
      args.principal,
      "facility.photo_removed",
      args.facilityId,
      { photoId: args.photoId },
    );
    return Result.ok();
  }
}
