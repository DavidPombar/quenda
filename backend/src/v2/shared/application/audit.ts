// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Principal } from "./principal";
export abstract class Audit {
  abstract record(
    principal: Principal,
    action: string,
    resourceId: string,
  ): Promise<void>;
}
