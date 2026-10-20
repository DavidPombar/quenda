# 01 · Alcance funcional y especificaciones

> **Fuente: bases oficiales.** Leídas en su primera versión el 2026-10-16 y revisadas el
> 2026-10-20 contra la **versión 3** (`Bases_I_Certame_GOBTEC_2026_GL_v3.pdf`,
> https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026_GL_v3.pdf),
> que solo cambia el plazo, la forma de entrega y el calendario (ver
> [03](03-concurso-presentacion-valoracion.md)): los puntos citados aquí no cambian. Puntos 0, 1, 1.1, 1.2 y 1.3 de las bases.
> Fuente secundaria: https://www.agasol.gal/i-certame-gobtec/ (consultada el 2026-10-15
> y el 2026-10-16). Los textos entre comillas son literales de las bases (en gallego).
> Lo marcado como **[Interpretación]** es criterio propio para desarrollar, no está en
> la convocatoria. Lo marcado como **[Cambio vs. web]** difiere de lo que decía la web
> antes de publicarse las bases.

## Reto de esta edición

**"Plataforma de xestión e reserva de instalacións deportivas municipais"**
(bases, punto 1 "Obxecto e descrición do reto").

- **Naturaleza:** "concurso de ideas innovadoras baseadas en software libre" para dar
  respuesta a un reto real del ecosistema GOBTEC en el ámbito de las administraciones.
  Las bases insisten en que **no implica contratación, encargo ni financiación** del
  desarrollo: es "un exercicio de ideación e impulso da innovación aberta".
- **Ámbito:** administraciones gallegas, en especial las de menor tamaño.
- **Problema (literal de las bases):** "Moitas administracións, especialmente as de menor
  tamaño, seguen xestionando o acceso ás súas instalacións deportivas mediante
  procedementos manuais (teléfono, correo electrónico ou atención presencial), cunha baixa
  visibilidade da dispoñibilidade real e procesos de modificación e cancelación pouco
  áxiles."
- **Objetivo:** el "deseño dunha plataforma" que "dea resposta ás necesidades actuais das
  administracións galegas"; reutilizable, accesible y basada en software libre.

## Funcionalidades obligatorias (punto 1.1 "Alcance funcional mínimo")

Literal: "As propostas deberán contemplar, como mínimo, os seguintes bloques funcionais".
Cualquier desarrollo debe cubrir los tres bloques. La cobertura funcional pesa un **30 %**
en la valoración (ver [03](03-concurso-presentacion-valoracion.md)).
**[Cambio vs. web]** La web decía 35 %.

### A. Ciudadanía
Literal: "Cidadanía: consulta de instalacións, reserva online, modificación e cancelación,
historial e avisos."

| ID | Funcionalidad (bases) | Qué implica como mínimo **[Interpretación]** |
|----|-----------------------|----------------------------------------------|
| C1 | "consulta de instalacións" | Listado/buscador de instalaciones con ficha (ubicación, tipo, deporte, horarios, normas, accesibilidad) y **disponibilidad real** visible |
| C2 | "reserva online" | Reservar un hueco libre sin intervención del personal; control de solapes/concurrencia |
| C3 | "modificación e cancelación" | El usuario cambia o cancela su reserva según las normas del concello (plazos, penalizaciones) |
| C4 | "historial e avisos" | Historial de reservas del usuario y notificaciones (confirmación, recordatorio, cambios/cancelaciones) |

### B. Concello (gestión)
Literal: "Concello: alta e mantemento de instalacións, horarios e normas de uso,
información e seguimento mediante indicadores básicos."

| ID | Funcionalidad (bases) | Qué implica como mínimo **[Interpretación]** |
|----|-----------------------|----------------------------------------------|
| M1 | "alta e mantemento de instalacións" | CRUD de instalaciones/pistas/espacios, fotos, estado (activa, en mantenimiento, cerrada) |
| M2 | "horarios e normas de uso" | Calendarios de apertura, franjas, festivos, cierres puntuales; reglas (duración máx., antelación, nº reservas por persona, empadronados vs. no empadronados, etc.) |
| M3 | "información e seguimento mediante indicadores básicos" | Panel con ocupación, reservas, cancelaciones, no-shows, uso por instalación/franja |

### C. Reutilización pública
Literal: "Reutilización pública: solución replicable, escalable, configurable e preparada
para o seu uso por varios municipios (multi-municipio)."

| ID | Requisito (bases) | Qué implica como mínimo **[Interpretación]** |
|----|-------------------|----------------------------------------------|
| R1 | "replicable, escalable" | Desplegable por cualquier administración sin dependencias propietarias; documentación de instalación |
| R2 | "configurable" | Branding, idiomas, normas, tasas/precios, textos legales, tipos de instalación configurables sin tocar código |
| R3 | "preparada para o seu uso por varios municipios (multi-municipio)" | **Multi-tenant** (p. ej. una deputación da servicio a varios concellos) con aislamiento de datos por municipio |

El bloque C está además directamente ligado al criterio de valoración "Reutilización e
soberanía tecnolóxica" (20 %), que exige "grao de apertura real do código, independencia
de provedor, uso de estándares e formatos abertos, e portabilidade íntegra dos datos"
(ver [03](03-concurso-presentacion-valoracion.md) y T1/T3 en [02](02-requisitos-tecnicos.md)).

## Aspectos valorables (punto 1.3, "non obrigatorios")

Literal: "Valoraranse positivamente, sen ser requisito mínimo, funcionalidades adicionais
como app móbil, calendarios persoais, accesos mediante código QR, analítica de uso ou
recomendación horaria. Estes aspectos achegan valor engadido, pero non substitúen o
alcance funcional mínimo descrito no punto 1.1."

- App móvil ("app móbil")
- Calendarios personales ("calendarios persoais") — p. ej. exportación iCal/ICS **[Interpretación]**
- Accesos mediante código QR
- Analítica de uso y recomendación horaria
- **Componentes de IA (nuevo en las bases, criterio 4):** si se incorporan, se valora que
  el modelo sea "de pesos abertos e autoaloxable, ou substituíble sen redeseñar a
  plataforma", y que "non remita datos persoais a terceiros sen base xurídica".
  "A ausencia de compoñentes de intelixencia artificial non penaliza."

## Reglas para el desarrollo

1. Priorizar siempre C1–C4, M1–M3 y R1–R3 antes que cualquier opcional (las bases dicen
   expresamente que los opcionales "non substitúen o alcance funcional mínimo").
2. Cada funcionalidad nueva debe poder trazarse a un ID de esta tabla (en issues, PRs,
   commits o en la memoria técnica).
3. Pensar en el **concello pequeño** como usuario principal: poco personal técnico,
   implantación sencilla (la viabilidad de implantación pesa un 25 %).
4. Nada específico de un único municipio en el código: todo lo municipal es configuración.
5. Idiomas **[Interpretación]**: gallego como idioma por defecto y castellano; i18n
   desde el inicio.
6. Si se añade IA (p. ej. recomendación horaria), solo con modelos de pesos abiertos
   autoalojables o fácilmente sustituibles, y sin enviar datos personales a terceros
   **[Interpretación]** (p. ej. preferir reglas/estadística sobre datos agregados).
7. Lo que se construya debe poder **publicarse como repositorio público con documentación
   de despliegue**: si la propuesta gana, es obligatorio hacerlo en 60 días naturales
   (ver [03](03-concurso-presentacion-valoracion.md), apartado 8 de las bases).
