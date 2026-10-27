// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { DeploymentRepository } from "../../domain/deployment.repository";
import {
  LegalTexts,
  Municipalities,
  MunicipalityLocale,
  MunicipalitySettings,
} from "../../../../shared/application/municipality-settings";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { OperatorAudit } from "../../../../shared/application/operator-audit";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CreateMunicipalityError =
  | AppError<"forbidden">
  | AppError<"validation">
  | AppError<"slug_taken">
  | AppError<"id_reused">;
export function isTimezone(value: string) {
  try {
    Temporal.PlainDate.from("2026-01-01").toZonedDateTime(value);
    return true;
  } catch {
    return false;
  }
}
/**
 * Installs a municipality without SQL (R3, #18). Its booking rules start from the demo
 * defaults; its manager adjusts them and the rest of the configuration afterwards.
 */
@Injectable()
export class CreateMunicipality {
  constructor(
    private readonly deployment: DeploymentRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: OperatorAudit,
  ) {}
  async execute(args: {
    principal: OperatorPrincipal;
    id: string;
    slug: string;
    name: string;
    timezone: string;
    locale: MunicipalityLocale;
    contact: string;
    legalTexts: LegalTexts;
    advanceDays?: number;
    cancellationHours?: number;
    maxActiveBookings?: number;
  }): Promise<Result<MunicipalitySettings, CreateMunicipalityError>> {
    if (!canOperate(args.principal, "deployment:manage"))
      return Result.err(failure("forbidden"));
    const existing = await this.municipalities.find(args.id);
    if (existing)
      return existing.slug === args.slug && existing.name === args.name
        ? Result.ok(existing)
        : Result.err(failure("id_reused"));
    if (!isTimezone(args.timezone) || !args.name.trim())
      return Result.err(failure("validation"));
    if (await this.deployment.slugTaken(args.slug))
      return Result.err(failure("slug_taken"));
    const now = this.clock.now();
    await this.deployment.createMunicipality({
      id: args.id,
      slug: args.slug,
      name: args.name.trim(),
      timezone: args.timezone,
      locale: args.locale,
      contact: args.contact.trim(),
      advanceDays: args.advanceDays ?? 14,
      cancellationHours: args.cancellationHours ?? 2,
      maxActiveBookings: args.maxActiveBookings ?? 5,
      legalTexts: {
        gl: args.legalTexts.gl.trim(),
        es: args.legalTexts.es.trim(),
      },
      // First notice version, numbered like those a manager publishes later.
      legalVersion: `${now.toZonedDateTimeISO(args.timezone).toPlainDate().toString()}.1`,
      publishedAt: now,
    });
    const created = await this.municipalities.find(args.id);
    if (!created) throw new Error("Municipality not readable after insert");
    await this.audit.record(
      args.principal,
      "municipality.created",
      created.id,
      created.id,
      { slug: created.slug, name: created.name },
    );
    return Result.ok(created);
  }
}
