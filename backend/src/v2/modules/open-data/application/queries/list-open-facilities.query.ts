// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OpenDataRepository } from "../../domain/open-data.repository";
import { OpenFacilities } from "../../domain/open-facility.read-model";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListOpenFacilities {
  constructor(
    private readonly openData: OpenDataRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: { slug: string }) {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    return Result.ok<OpenFacilities>({
      municipality: {
        slug: municipality.slug,
        name: municipality.name,
        dataLicense: municipality.dataLicense,
        dir3Code: municipality.dir3Code,
      },
      facilities: await this.openData.facilities(municipality.id),
      generatedOn: this.clock
        .now()
        .toZonedDateTimeISO(municipality.timezone)
        .toPlainDate()
        .toString(),
    });
  }
}
