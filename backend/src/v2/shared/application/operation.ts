// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Result } from "./result";
export interface Operation<A, O, E> {
  execute(args: A): Promise<Result<O, E>>;
}
