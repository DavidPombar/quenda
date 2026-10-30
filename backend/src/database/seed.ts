// SPDX-License-Identifier: AGPL-3.0-or-later
import { courtPhoto } from "./seed-photo";
import { Pool } from "pg";
import { databaseUrl } from "./config";
export function openingCalendar(id: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Opening hours//GL",
    "BEGIN:VEVENT",
    `UID:${id}@quenda`,
    "DTSTAMP:20260101T000000Z",
    "DTSTART;TZID=Europe/Madrid:20260101T090000",
    "DTEND;TZID=Europe/Madrid:20260101T220000",
    "RRULE:FREQ=DAILY",
    "EXDATE;TZID=Europe/Madrid:20261225T090000",
    "SUMMARY:Apertura",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
export async function seed(url = databaseUrl) {
  const db = new Pool({ connectionString: url });
  try {
    // One supramunicipal operator per deployment (deputación or mancomunidade, #18).
    await db.query(
      "INSERT INTO operators (id,display_name) VALUES ($1,$2) ON CONFLICT(id) DO NOTHING",
      ["40000000-0000-4000-8000-000000000001", "Deputación · operación"],
    );
    for (const [i, slug, name] of [
      [1, "vilaverde", "Concello de Vilaverde"],
      [2, "portomar", "Concello de Portomar"],
    ] as const) {
      const tenant = `00000000-0000-4000-8000-00000000000${i}`;
      await db.query(
        "INSERT INTO municipalities (id,slug,name,timezone,locale,advance_days,cancellation_hours,max_active_bookings,contact,legal_text,legal_version,retention_months) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING",
        [
          tenant,
          slug,
          name,
          "Europe/Madrid",
          "gl",
          14,
          2,
          5,
          `deportes@${slug}.example`,
          "Demostración con datos ficticios. Non introduzas datos persoais. As reservas son de proba.",
          "2026-10",
          24,
        ],
      );
      // Only fills statements nobody has configured yet.
      await db.query(
        "UPDATE municipalities SET accessibility_unit=$2, accessibility_email=$3, accessibility_phone=$4, accessibility_reviewed_on=$5, accessibility_method='self', accessibility_exceptions_gl=$6, accessibility_exceptions_es=$7 WHERE id=$1 AND accessibility_unit=''",
        [
          tenant,
          `Servizo de Deportes do ${name}`,
          `accesibilidade@${slug}.example`,
          `+34 986 000 00${i}`,
          "2026-10-27",
          "Os textos que redacta o concello (descricións das instalacións e normas de uso) aínda non se revisaron con criterios de accesibilidade e linguaxe clara.",
          "Los textos que redacta el ayuntamiento (descripciones de las instalaciones y normas de uso) aún no se han revisado con criterios de accesibilidad y lenguaje claro.",
        ],
      );
      // Versioned notice in both languages; the row above keeps the Galician text for older readers.
      await db.query(
        "INSERT INTO legal_texts (tenant_id,version,text_gl,text_es,published_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
        [
          tenant,
          "2026-10",
          "Demostración con datos ficticios. Non introduzas datos persoais. As reservas son de proba.",
          "Demostración con datos ficticios. No introduzcas datos personales. Las reservas son de prueba.",
          "2026-10-01T00:00:00Z",
        ],
      );
      for (const [j, role, display] of [
        [1, "citizen", "Alex · conta de proba"],
        [2, "manager", "Uxía · xestión municipal"],
        [3, "access", "Brais · control de accesos"],
      ] as const)
        await db.query(
          "INSERT INTO users VALUES ($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
          [`10000000-0000-4000-8000-0000000000${i}${j}`, tenant, display, role],
        );
      // Synthetic address at a reserved domain; demo notices land in the local mail catcher.
      await db.query(
        "UPDATE users SET email=$2 WHERE id=$1 AND email IS NULL AND deleted_at IS NULL",
        [`10000000-0000-4000-8000-0000000000${i}1`, `alex@${slug}.example`],
      );
      for (const [
        j,
        label,
        sport,
        address,
        description,
        price,
        accessible,
        status,
      ] of [
        [
          1,
          "Pistas de pádel da Carballeira",
          "padel",
          "Rúa da Carballeira, 12",
          "Dúas paredes de cristal, luz natural e todo o que precisas para unha boa partida.",
          400,
          true,
          "active",
        ],
        [
          2,
          "Pavillón municipal",
          "futsal",
          "Avenida do Deporte, 8",
          "Un espazo cuberto para xogar en equipo durante todo o ano.",
          0,
          true,
          "active",
        ],
        [
          3,
          "Pista de tenis do Souto",
          "tennis",
          "Parque do Souto, s/n",
          "A túa próxima partida, ao aire libre. Pista de superficie rápida.",
          300,
          true,
          "active",
        ],
        [
          4,
          "Piscina municipal",
          "swimming",
          "Rúa do Río, 5",
          "Piscina cuberta de 25 metros. Actualmente en mantemento.",
          0,
          true,
          "maintenance",
        ],
      ] as const) {
        const id = `20000000-0000-4000-8000-0000000000${i}${j}`;
        await db.query(
          "INSERT INTO facilities VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING",
          [
            id,
            tenant,
            label,
            sport,
            address,
            description,
            accessible,
            status,
            60,
            price,
            openingCalendar(id),
            "Trae calzado deportivo. Respecta a quenda e deixa o espazo como che gustaría atopalo.",
          ],
        );
        // Demo facilities keep their seeded status since the calendar horizon.
        await db.query(
          "INSERT INTO facility_status_periods (tenant_id,facility_id,status,starts_at) VALUES ($1,$2,$3,'2000-01-01T00:00:00Z') ON CONFLICT DO NOTHING",
          [tenant, id, status],
        );
        // Fictitious positions in Galicia for the open data GeoJSON; a manager's values are kept.
        const [latitude, longitude] = i === 1 ? [42.61, -8.12] : [42.49, -8.86];
        await db.query(
          "UPDATE facilities SET latitude=$3, longitude=$4 WHERE tenant_id=$1 AND id=$2 AND latitude IS NULL",
          [
            tenant,
            id,
            Number((latitude + j * 0.002).toFixed(6)),
            Number((longitude + j * 0.003).toFixed(6)),
          ],
        );
        await seedResources(db, tenant, id, label, i, j);
      }
      // Category tariffs (M2): the demo citizen's residency request waits for the manager.
      await db.query(
        "UPDATE municipalities SET enabled_categories=$2 WHERE id=$1 AND enabled_categories='{}'",
        [
          tenant,
          [
            "resident",
            "family",
            "local_club",
            "minor",
            "large_family",
            "senior",
          ],
        ],
      );
      for (const [j, prices] of [
        [
          1,
          {
            resident: 250,
            family: 600,
            local_club: 200,
            minor: 150,
            large_family: 200,
            senior: 150,
          },
        ],
        [3, { resident: 200, minor: 100, senior: 100 }],
      ] as const)
        for (const [category, price] of Object.entries(prices))
          await db.query(
            "INSERT INTO facility_prices VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
            [
              tenant,
              `20000000-0000-4000-8000-0000000000${i}${j}`,
              category,
              price,
            ],
          );
      await db.query(
        "INSERT INTO user_categories (tenant_id,user_id,category,status,requested_at) VALUES ($1,$2,'resident','requested','2026-10-20T09:00:00Z') ON CONFLICT DO NOTHING",
        [tenant, `10000000-0000-4000-8000-0000000000${i}1`],
      );
      await seedSeason(db, tenant, slug, name, i);
      // Demo photo (#26) with its alternative text, on the municipal sports hall.
      await db.query(
        "INSERT INTO facility_photos (id,tenant_id,facility_id,content_type,data,sha256,alt_gl,alt_es,position,created_at) VALUES ($1,$2,$3,'image/png',$4,encode(sha256($4),'hex'),$5,$6,0,'2026-09-01T09:00:00Z') ON CONFLICT DO NOTHING",
        [
          `54000000-0000-4000-8000-0000000000${i}1`,
          tenant,
          `20000000-0000-4000-8000-0000000000${i}2`,
          courtPhoto(),
          "Pista do pavillón vista desde arriba: chan de madeira, área de xogo laranxa e liñas brancas de fútbol sala.",
          "Pista del pabellón vista desde arriba: suelo de madera, zona de juego naranja y líneas blancas de fútbol sala.",
        ],
      );
    }
  } finally {
    await db.end();
  }
}
/**
 * Demo season (#17): a club with a synthetic representative, the school-year campaign with its
 * published criteria and a Tuesday-and-Thursday 19:00–21:00 slot on the first padel court.
 * Idempotent; dates already taken by a one-off booking are left out.
 */
async function seedSeason(
  db: Pool,
  tenant: string,
  slug: string,
  municipality: string,
  i: number,
) {
  const club = `50000000-0000-4000-8000-0000000000${i}1`;
  const campaign = `51000000-0000-4000-8000-0000000000${i}1`;
  const allocation = `52000000-0000-4000-8000-0000000000${i}1`;
  const court = `20000000-0000-4000-8000-0000000000${i}1`;
  const representative = `10000000-0000-4000-8000-0000000000${i}4`;
  const clubName = `Club Pádel ${municipality.replace(/^Concello de /, "")}`;
  await db.query(
    "INSERT INTO organizations (id,tenant_id,name,tax_id,sport,contact_email,created_at) VALUES ($1,$2,$3,$4,'padel',$5,'2026-08-20T09:00:00Z') ON CONFLICT(id) DO NOTHING",
    [club, tenant, clubName, `G1500000${i}`, `padel@${slug}.example`],
  );
  await db.query(
    "INSERT INTO users (id,tenant_id,display_name,role,email,organization_id) VALUES ($1,$2,$3,'citizen',$4,$5) ON CONFLICT(id) DO NOTHING",
    [
      representative,
      tenant,
      `Iria · ${clubName}`,
      `iria@${slug}.example`,
      club,
    ],
  );
  await db.query(
    `INSERT INTO season_campaigns (id,tenant_id,name,starts_on,ends_on,criteria_gl,criteria_es,created_at)
    VALUES ($1,$2,'Curso 2026–2027','2026-09-01','2027-06-30',$3,$4,'2026-07-01T09:00:00Z') ON CONFLICT(id) DO NOTHING`,
    [
      campaign,
      tenant,
      "Prioridade para clubs con sede no concello, equipos de menores e deportes propios da instalación. A asignación publícase antes do inicio do curso.",
      "Prioridad para clubes con sede en el municipio, equipos de menores y deportes propios de la instalación. La asignación se publica antes del inicio del curso.",
    ],
  );
  await db.query(
    "INSERT INTO season_campaign_facilities VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
    [tenant, campaign, court],
  );
  await db.query(
    `INSERT INTO season_allocations (id,tenant_id,campaign_id,organization_id,facility_id,resource_id,weekdays,starts_local,ends_local,reason,created_at)
    VALUES ($1,$2,$3,$4,$5,$5,'{2,4}','19:00','21:00','Escola de pádel de menores con sede no concello','2026-08-25T09:00:00Z') ON CONFLICT(id) DO NOTHING`,
    [allocation, tenant, campaign, club, court],
  );
  // Future Tuesdays and Thursdays of the campaign whose court is still free.
  await db.query(
    `WITH dates AS (
      SELECT d::date AS day FROM generate_series(GREATEST(current_date + 1, DATE '2026-09-01'), DATE '2027-06-30', interval '1 day') d
      WHERE extract(isodow FROM d) IN (2, 4)
    ), slots AS (
      SELECT md5($3::text || day::text)::uuid AS id,
        (day + time '19:00') AT TIME ZONE 'Europe/Madrid' AS starts_at,
        (day + time '21:00') AT TIME ZONE 'Europe/Madrid' AS ends_at
      FROM dates
    ), free AS (
      SELECT * FROM slots s WHERE NOT EXISTS (
        SELECT 1 FROM booking_units u WHERE u.tenant_id=$1::uuid AND u.unit_id=$2::uuid AND u.starts_at<s.ends_at AND u.ends_at>s.starts_at
      )
    ), stored AS (
      INSERT INTO season_occurrences (id,tenant_id,allocation_id,starts_at,ends_at,status)
      SELECT id,$1::uuid,$3::uuid,starts_at,ends_at,'active' FROM free ON CONFLICT(id) DO NOTHING RETURNING id, starts_at, ends_at
    )
    INSERT INTO booking_units (tenant_id,occurrence_id,unit_id,starts_at,ends_at)
    SELECT $1::uuid,id,$2::uuid,starts_at,ends_at FROM stored`,
    [tenant, court, allocation],
  );
}
/**
 * Default resource (same id as the facility) plus demo courts. Idempotent: existing rows and names
 * changed by a manager are kept. Parts are only added to a hall without upcoming reservations, so
 * already used demo databases never get a whole-court booking that would overlap new parts.
 */
async function seedResources(
  db: Pool,
  tenant: string,
  facility: string,
  label: string,
  i: number,
  j: number,
) {
  const resource = (k: number) =>
    `30000000-0000-4000-8000-000000000${i}${j}${k}`;
  await db.query(
    "INSERT INTO resources (id,tenant_id,facility_id,name,position) VALUES ($1,$2,$1,$3,0) ON CONFLICT(id) DO NOTHING",
    [facility, tenant, label],
  );
  const courts: Record<number, { rename: string; others: string[] }> = {
    1: { rename: "Pista 1", others: ["Pista 2"] },
    2: {
      rename: "Pista completa",
      others: ["Tercio A", "Tercio B", "Tercio C"],
    },
  };
  const plan = courts[j];
  if (!plan) return;
  await db.query(
    "UPDATE resources SET name=$3 WHERE tenant_id=$1 AND id=$2 AND name=$4",
    [tenant, facility, plan.rename, label],
  );
  for (const [index, name] of plan.others.entries())
    await db.query(
      `INSERT INTO resources (id,tenant_id,facility_id,name,position,parent_id)
      SELECT $1::uuid,$2::uuid,$3::uuid,$4::text,$5::int,$6::uuid
      WHERE $6::uuid IS NULL OR NOT EXISTS (
        SELECT 1 FROM bookings WHERE tenant_id=$2 AND facility_id=$3 AND status='confirmed' AND ends_at>now()
      )
      ON CONFLICT(id) DO NOTHING`,
      [
        resource(index + 1),
        tenant,
        facility,
        name,
        index + 1,
        j === 2 ? facility : null,
      ],
    );
}
if (require.main === module)
  void seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
