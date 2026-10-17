// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import { Clock } from "../application/clock";
export class SystemClock extends Clock {
  now() {
    return Temporal.Now.instant();
  }
}
