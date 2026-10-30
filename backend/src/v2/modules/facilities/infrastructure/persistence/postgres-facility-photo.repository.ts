// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { FacilityPhoto } from "../../domain/facility-photo.entity";
import { FacilityPhotoRepository } from "../../domain/facility-photo.repository";
import { LogoType } from "../../../municipalities/domain/logo";
import { Database } from "../../../../shared/infrastructure/database";
@Injectable()
export class PostgresFacilityPhotoRepository extends FacilityPhotoRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async list(tenantId: string, facilityIds: readonly string[]) {
    const { rows } = await this.db.query<
      Omit<FacilityPhoto, "createdAt"> & { createdAt: string }
    >(
      `SELECT id, facility_id AS "facilityId", content_type AS "contentType", left(sha256, 16) AS version,
        json_build_object('gl', alt_gl, 'es', alt_es) AS alt, position, created_at AS "createdAt"
      FROM facility_photos WHERE tenant_id=$1 AND facility_id=ANY($2::uuid[])
      ORDER BY position, created_at, id`,
      [tenantId, facilityIds],
    );
    return rows.map((row) => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
  async add(
    tenantId: string,
    photo: Omit<FacilityPhoto, "version">,
    data: Uint8Array,
  ) {
    await this.db.query(
      `INSERT INTO facility_photos (id,tenant_id,facility_id,content_type,data,sha256,alt_gl,alt_es,position,created_at)
      VALUES ($1,$2,$3,$4,$5,encode(sha256($5),'hex'),$6,$7,$8,$9)`,
      [
        photo.id,
        tenantId,
        photo.facilityId,
        photo.contentType,
        Buffer.from(data),
        photo.alt.gl,
        photo.alt.es,
        photo.position,
        photo.createdAt.toString(),
      ],
    );
  }
  async update(
    tenantId: string,
    id: string,
    changes: { alt: { gl: string; es: string }; position: number },
  ) {
    const result = await this.db.query(
      "UPDATE facility_photos SET alt_gl=$3, alt_es=$4, position=$5 WHERE tenant_id=$1 AND id=$2",
      [tenantId, id, changes.alt.gl, changes.alt.es, changes.position],
    );
    return Boolean(result.rowCount);
  }
  async remove(tenantId: string, facilityId: string, id: string) {
    const result = await this.db.query(
      "DELETE FROM facility_photos WHERE tenant_id=$1 AND facility_id=$2 AND id=$3",
      [tenantId, facilityId, id],
    );
    return Boolean(result.rowCount);
  }
  async image(facilityId: string, id: string) {
    const { rows } = await this.db.query<{
      contentType: LogoType;
      data: Buffer;
      version: string;
    }>(
      'SELECT content_type AS "contentType", data, left(sha256, 16) AS version FROM facility_photos WHERE facility_id=$1 AND id=$2',
      [facilityId, id],
    );
    return rows[0] ? { ...rows[0], data: new Uint8Array(rows[0].data) } : null;
  }
}
