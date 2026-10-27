// SPDX-License-Identifier: AGPL-3.0-or-later
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
      ] as const)
        await db.query(
          "INSERT INTO users VALUES ($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
          [`10000000-0000-4000-8000-0000000000${i}${j}`, tenant, display, role],
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
      }
    }
  } finally {
    await db.end();
  }
}
if (require.main === module)
  void seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
