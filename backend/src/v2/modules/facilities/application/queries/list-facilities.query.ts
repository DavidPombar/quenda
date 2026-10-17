// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListFacilities {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: { slug: string }) {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    return Result.ok(await this.facilities.list(municipality.id));
  }
}
