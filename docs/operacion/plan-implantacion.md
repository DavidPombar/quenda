# Plan de implantación tipo: 12 semanas

Plan para un concello pequeño o mediano que pasa del teléfono y el correo a Quenda, sobre
una instancia ya desplegada (propia o de la deputación). Sirve de base para el apartado 5
de la memoria (fases, recursos, plazo y riesgos).

Sigue la lección 13 de la [investigación europea](../investigacion/05-mercado-europeo.md),
sacada de las implantaciones de Karlsruhe, Gütersloh y Berlín: **piloto con clubes**,
**sesión informativa**, **ventana de corte** para pasar las reservas vivas y **soporte
durante la primera temporada**. En ciudades medias llevó de 12 a 18 meses (Karlsruhe: 89
pabellones y 198 clubes en 18 meses). Un concello pequeño, con pocas instalaciones y una
sola temporada de clubes, cabe en 12 semanas.

## Fases

| Semanas           | Fase                                      | Qué se hace                                                                                                                                                                                                         | Entregable                                                      |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1–2               | **Acuerdo y preparación**                 | Convenio con la deputación o decisión de instancia propia; persona responsable en el concello; contrato de encargo del tratamiento; aviso de privacidad revisado por el DPD; registro de actividades de tratamiento | [Alta del concello](alta-concello.md) hecha y gestor con acceso |
| 3–4               | **Configuración**                         | Inventario de instalaciones, pistas, horarios, festivos, tarifas y normas; logo y textos; declaración de accesibilidad                                                                                              | Catálogo completo visible en la app, sin abrir reservas         |
| 5–6               | **Formación**                             | Sesión de dos horas con el personal de deportes y de puerta: backoffice, cancelaciones, indicadores, control de acceso QR; guía de una página para el mostrador                                                     | Personal que configura y cancela solo                           |
| 7–9               | **Piloto con clubes**                     | Dos o tres clubes y una instalación: temporada de clubes en Quenda y reservas puntuales de sus socios; revisión semanal de incidencias                                                                              | Lista de ajustes de normas y de fallos resuelta                 |
| 10                | **Sesión informativa y ventana de corte** | Presentación pública a clubes y vecinos; durante la semana de corte se pasan a Quenda las reservas vivas y las temporadas de los clubes; el teléfono sigue atendiendo, pero ya reserva en Quenda                    | Todas las reservas futuras en Quenda                            |
| 11–12             | **Apertura**                              | Enlace en la web del concello, cartelería con QR en las instalaciones, nota de prensa; seguimiento diario de incidencias                                                                                            | Reservas en línea abiertas a toda la ciudadanía                 |
| Primera temporada | **Acompañamiento**                        | [Soporte](soporte.md) por incidencias; revisión mensual de indicadores; revisión de cierre de temporada                                                                                                             | Decisión de continuidad y mejoras para la siguiente versión     |

## Recursos

- **Concello:** una persona responsable del servicio de deportes (unas 4 horas por
  semana durante la implantación) y el personal de mostrador y de puerta en la
  formación.
- **Técnico del concello o de la deputación:** despliegue y alta (una jornada si la
  instancia es nueva; una hora si ya existe), y después copias y actualizaciones
  ([operación](README.md)).
- **Proyecto Quenda:** formación, acompañamiento del piloto y soporte por incidencias.
- **Coste de software:** ninguno. Quenda es AGPL-3.0 y todas sus dependencias son
  libres. El coste es el servidor (o la parte de la instancia de la deputación) y el
  tiempo del personal.

## Riesgos y cómo se reducen

| Riesgo                                                   | Mitigación                                                                                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los clubes siguen pidiendo horas por teléfono o correo   | Piloto con ellos antes de abrir; su temporada vive en Quenda desde la ventana de corte                                                                                            |
| Datos de partida dispersos (hojas de cálculo, cuadernos) | Fase de configuración con plantilla de inventario; importación de horarios `.ics`                                                                                                 |
| Personas sin competencias digitales                      | El mostrador las ayuda a reservar con su propia cuenta; la app es accesible (WCAG 2.1 AA) y está en gallego y castellano. Reservar en su nombre desde el backoffice aún no existe |
| Cl@ve aún no disponible para el concello                 | Entrada por código de correo desde el primer día; Cl@ve se añade después con la configuración OIDC de la instancia                                                                |
| Dependencia de una sola persona en el concello           | Dos personas formadas como gestoras; la guía de operación es pública                                                                                                              |
| Pérdida de datos                                         | Copias cifradas cada noche fuera del servidor y simulacro de restauración trimestral ([copias](copias-de-seguridad.md))                                                           |
| Adopción baja                                            | Indicadores de uso en el backoffice; revisión mensual con el concello en la primera temporada                                                                                     |
