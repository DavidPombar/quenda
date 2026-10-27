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
