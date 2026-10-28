// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Resource } from "../../facilities/domain/resource.entity";
import { Result } from "../../../shared/application/result";
import { AppError, failure } from "../../../shared/application/errors";
export type ResourceChoiceError =
  | AppError<"not_found">
  | AppError<"resource_required">
  | AppError<"resource_unavailable">;
/**
 * Picks the booked resource among the facility's resources. Without an explicit choice the only
 * active resource is used; composites and parts are each bookable, so a divisible hall always
 * needs a choice.
 */
export function chooseResource(
  resources: readonly Resource[],
  requested: string | undefined,
): Result<Resource, ResourceChoiceError> {
  if (requested === undefined) {
    const active = resources.filter((resource) => resource.active);
    return active.length === 1
      ? Result.ok(active[0])
      : Result.err(failure("resource_required"));
  }
  const resource = resources.find((item) => item.id === requested);
  if (!resource) return Result.err(failure("not_found"));
  if (!resource.active) return Result.err(failure("resource_unavailable"));
  return Result.ok(resource);
}
