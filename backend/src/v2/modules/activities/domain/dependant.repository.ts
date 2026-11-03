// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Dependant } from "./dependant.entity";
export abstract class DependantRepository {
  /** Locks the adult's row, serialising changes to their dependants. */
  abstract lockUser(tenantId: string, userId: string): Promise<void>;
  /** Any dependant with that id in the municipality, whoever it belongs to. */
  abstract findById(tenantId: string, id: string): Promise<Dependant | null>;
  /** The adult's dependants, in the order they were added. */
  abstract list(tenantId: string, userId: string): Promise<Dependant[]>;
  /** Null when it does not exist or belongs to someone else. */
  abstract find(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<Dependant | null>;
  abstract add(dependant: Dependant): Promise<void>;
  abstract save(dependant: Dependant): Promise<void>;
  abstract remove(tenantId: string, id: string): Promise<void>;
  /** Removes every dependant of the adult (account deletion). */
  abstract removeAll(tenantId: string, userId: string): Promise<number>;
  abstract hasOpenEnrolments(tenantId: string, id: string): Promise<boolean>;
}
