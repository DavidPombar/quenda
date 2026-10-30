// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  SPORT_ARTS,
  SPORT_CODE,
  SportRepository,
} from "../../domain/sport.repository";
import { Sport } from "../../domain/sport.entity";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SaveSportError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"sport_exists">;
/** Adds, renames, reorders or hides a sport of the municipality's catalogue (#26). */
@Injectable()
export class SaveSport {
  constructor(
    private readonly sports: SportRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    code: string;
    patch: Partial<Omit<Sport, "code">>;
    mode: "create" | "update";
  }): Promise<Result<Sport, SaveSportError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    const existing = await this.sports.find(tenantId, args.code);
    if (args.mode === "update" && !existing)
      return Result.err(failure("not_found"));
    if (args.mode === "create" && existing)
      return Result.err(failure("sport_exists"));
    const merged: Sport = {
      code: args.code,
      name: { gl: "", es: "" },
      cnidClass: "Otros",
      cnidType: "Espacio deportivo",
      schemaType: "SportsActivityLocation",
      art: "generic",
      hidden: false,
      position: 100,
      ...existing,
      ...Object.fromEntries(
        Object.entries(args.patch).filter(([, value]) => value !== undefined),
      ),
    };
    const sport: Sport = {
      ...merged,
      name: { gl: merged.name.gl.trim(), es: merged.name.es.trim() },
      cnidClass: merged.cnidClass.trim(),
      cnidType: merged.cnidType.trim(),
    };
    if (
      !SPORT_CODE.test(sport.code) ||
      sport.name.gl.length < 2 ||
      sport.name.es.length < 2 ||
      !sport.cnidClass ||
      !sport.cnidType ||
      !SPORT_ARTS.includes(sport.art)
    )
      return Result.err(failure("validation"));
    const others = (await this.sports.list(tenantId)).filter(
      (value) => value.code !== sport.code,
    );
    // Names are unique in each language, so filters and selects never show two equal options.
    const same = (a: string, b: string) =>
      a.toLocaleLowerCase("gl") === b.toLocaleLowerCase("gl");
    if (
      others.some(
        (value) =>
          same(value.name.gl, sport.name.gl) ||
          same(value.name.es, sport.name.es),
      )
    )
      return Result.err(failure("sport_exists"));
    // At least one sport stays visible, or no facility could be created.
    if (sport.hidden && others.every((value) => value.hidden))
      return Result.err(failure("validation"));
    await this.sports.save(tenantId, sport);
    // The catalogue belongs to the municipality, so the entry is recorded against it.
    await this.audit.record(
      args.principal,
      existing ? "sport.updated" : "sport.created",
      tenantId,
      { code: sport.code, name: sport.name.gl, hidden: sport.hidden },
    );
    return Result.ok(sport);
  }
}
