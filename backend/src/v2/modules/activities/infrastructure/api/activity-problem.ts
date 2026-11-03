// SPDX-License-Identifier: AGPL-3.0-or-later
import { ProblemException } from "../../../../shared/infrastructure/api/problem";
import { AppError, assertNever } from "../../../../shared/application/errors";
import type { ActivityConflict } from "../../application/activity-preparation";
/** HTTP problem for the errors of saving or publishing an activity (#97). */
export function activityProblem(
  error:
    | AppError<"forbidden">
    | AppError<"not_found">
    | AppError<"validation">
    | AppError<"resource_unavailable">
    | AppError<"activity_not_editable">
    | AppError<"activity_has_enrolments">
    | AppError<"places_below_enrolled">
    | ActivityConflict,
): never {
  switch (error.code) {
    case "forbidden":
      throw new ProblemException(403, error);
    case "not_found":
      throw new ProblemException(404, error);
    case "validation":
      throw new ProblemException(400, error);
    case "resource_unavailable":
      throw new ProblemException(422, error);
    case "activity_not_editable":
    case "activity_has_enrolments":
    case "places_below_enrolled":
      throw new ProblemException(409, error);
    case "activity_conflict":
      // The dates to resolve or to add as exceptions, without who holds the court.
      throw new ProblemException(
        409,
        { code: error.code },
        {
          clashes: error.clashes.map((clash) => ({
            start: clash.start.toString(),
            end: clash.end.toString(),
            date: clash.date,
            reason: clash.reason,
          })),
        },
      );
    default:
      return assertNever(error);
  }
}
