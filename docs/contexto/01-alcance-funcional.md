# 01 · Alcance funcional y especificaciones

> Fuente: https://www.agasol.gal/i-certame-gobtec/ (consultada el 2026-10-15).
> Los textos entre comillas son literales de la web (en gallego). Lo marcado como
> **[Interpretación]** es criterio propio para desarrollar, no está en la convocatoria.

## Reto de esta edición

**"Plataforma de xestión e reserva de instalacións deportivas municipais"**

- **Ámbito:** concellos y deputacións (administración local gallega).
- **Problema:** muchos concellos, sobre todo los pequeños, gestionan el acceso a sus
  instalaciones deportivas por teléfono, correo o presencialmente, con poca visibilidad
  de la disponibilidad real y procesos de cambio/cancelación poco ágiles.
- **Objetivo:** una solución digital, **reutilizable** y **accesible**.

## Funcionalidades obligatorias (núcleo del reto)

Cualquier desarrollo debe cubrir los tres bloques. La cobertura funcional pesa un **35 %**
en la valoración (ver [03](03-concurso-presentacion-valoracion.md)).

### A. Ciudadanía
| ID | Funcionalidad (web) | Qué implica como mínimo **[Interpretación]** |
|----|---------------------|----------------------------------------------|
| C1 | "Consulta de instalacións" | Listado/buscador de instalaciones con ficha (ubicación, tipo, deporte, horarios, normas, accesibilidad) y **disponibilidad real** visible |
| C2 | "Reserva online" | Reservar un hueco libre sin intervención del personal; control de solapes/concurrencia |
| C3 | "Modificación e cancelación" | El usuario cambia o cancela su reserva según las normas del concello (plazos, penalizaciones) |
| C4 | "Historial e avisos" | Historial de reservas del usuario y notificaciones (confirmación, recordatorio, cambios/cancelaciones) |

### B. Concello (gestión)
| ID | Funcionalidad (web) | Qué implica como mínimo **[Interpretación]** |
|----|---------------------|----------------------------------------------|
| M1 | "Alta e mantemento de instalacións" | CRUD de instalaciones/pistas/espacios, fotos, estado (activa, en mantenimiento, cerrada) |
| M2 | "Xestión de horarios e normas de uso" | Calendarios de apertura, franjas, festivos, cierres puntuales; reglas (duración máx., antelación, nº reservas por persona, empadronados vs. no empadronados, etc.) |
| M3 | "Indicadores básicos de seguimento" | Panel con ocupación, reservas, cancelaciones, no-shows, uso por instalación/franja |

### C. Reutilización pública
| ID | Requisito (web) | Qué implica como mínimo **[Interpretación]** |
|----|-----------------|----------------------------------------------|
| R1 | "Solución replicable e escalable" | Desplegable por cualquier administración sin dependencias propietarias; documentación de instalación |
| R2 | "Configurable por cada municipio" | Branding, idiomas, normas, tasas/precios, textos legales, tipos de instalación configurables sin tocar código |
| R3 | "Preparada para uso multi-municipio" | **Multi-tenant** (p. ej. una deputación da servicio a varios concellos) con aislamiento de datos por municipio |

## Aspectos valorables (opcionales)

No son obligatorios; suman, pero **nunca a costa del núcleo obligatorio**.

- App móvil ("App móbil")
- Calendarios personales ("Calendarios persoais") — p. ej. exportación iCal/ICS
- Accesos mediante código QR
- Analítica de uso y recomendación horaria

## Reglas para el desarrollo

1. Priorizar siempre C1–C4, M1–M3 y R1–R3 antes que cualquier opcional.
2. Cada funcionalidad nueva debe poder trazarse a un ID de esta tabla (en issues, PRs,
   commits o en la memoria técnica).
3. Pensar en el **concello pequeño** como usuario principal: poco personal técnico,
   implantación sencilla (la viabilidad de implantación pesa un 25 %).
4. Nada específico de un único municipio en el código: todo lo municipal es configuración.
5. Idiomas **[Interpretación]**: gallego como idioma por defecto y castellano; i18n
   desde el inicio.
