// SPDX-License-Identifier: AGPL-3.0-or-later
import type { MunicipalitySnapshot } from "./municipality-snapshot.read-model";
export abstract class PortabilityRepository {
  abstract snapshot(tenantId: string): Promise<MunicipalitySnapshot | null>;
}
