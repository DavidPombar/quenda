// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityPhotoRepository } from "../../domain/facility-photo.repository";
import { Logo } from "../../../municipalities/domain/logo";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class GetFacilityPhoto {
  constructor(private readonly photos: FacilityPhotoRepository) {}
  async execute(args: {
    facilityId: string;
    photoId: string;
  }): Promise<Result<Logo & { version: string }, AppError<"not_found">>> {
    const image = await this.photos.image(args.facilityId, args.photoId);
    return image ? Result.ok(image) : Result.err(failure("not_found"));
  }
}
