# 02 · Requisitos técnicos

> Fuente: https://www.agasol.gal/i-certame-gobtec/ (consultada el 2026-10-15).
> La web lista cinco "Condicionantes técnicos obrigatorios". Lo marcado como
> **[Interpretación]** es cómo los aplicamos en el desarrollo; no está en la convocatoria.

## Condicionantes técnicos OBLIGATORIOS

### T1 · Software libre con licencia reconocida (OSI/FSF)
- Todo el código propio se publica con una licencia aprobada por la OSI o reconocida
  por la FSF.
- **[Interpretación]** Licencia recomendada: **EUPL-1.2** (pensada para la administración
  pública europea, aprobada por OSI) o AGPL-3.0. Fichero `LICENSE` en la raíz y cabecera
  SPDX en los ficheros fuente.
- **Todas las dependencias** deben tener licencias libres compatibles. Prohibido incluir
  SDKs, librerías o servicios propietarios como requisito para funcionar.
- **[Interpretación]** Revisar licencias al añadir dependencias (p. ej. `license-checker`,
  `pip-licenses`, REUSE tool).

### T2 · Arquitectura abierta: web responsive y modular
- Aplicación **web responsive** (móvil, tablet, escritorio) como canal principal.
- **Modular**: módulos separados (instalaciones, reservas, usuarios, notificaciones,
  indicadores, configuración municipal) que se puedan activar/sustituir.
- **[Interpretación]** API documentada (OpenAPI) que separe backend y frontend; la app
  móvil opcional consumiría la misma API.
- **[Interpretación]** Despliegue reproducible con contenedores (Docker/Compose) y sin
  dependencia de un cloud concreto; autohospedable por un concello o deputación.

### T3 · Interoperabilidad y estándares abiertos
- Usar formatos y protocolos abiertos.
- **[Interpretación]** Ejemplos aplicables:
  - API REST + JSON, especificación OpenAPI 3.
  - Calendarios en iCalendar (RFC 5545 / `.ics`).
  - Exportación de datos en CSV/JSON; datos abiertos de instalaciones (catálogo de datos abiertos del concello).
  - Autenticación con estándares (OpenID Connect / SAML) para poder integrar Cl@ve,
    Chave365 u otros IdP de la administración.
  - Base de datos libre (PostgreSQL recomendado).
  - Alinearse con el Esquema Nacional de Interoperabilidad (ENI).

### T4 · RGPD (RXPD) y gestión segura de usuarios
- Cumplimiento del RGPD y de la LOPDGDD.
- **[Interpretación]** Mínimos en el código:
  - Minimización de datos: pedir solo lo necesario para reservar.
  - Consentimiento y textos legales configurables por municipio.
  - Derechos ARSOPL: exportar y borrar los datos de un usuario.
  - Política de retención y anonimización del historial.
  - Contraseñas con hash robusto (argon2/bcrypt), roles y permisos (ciudadano,
    gestor municipal, administrador de deputación), registro de auditoría.
  - HTTPS obligatorio, protección OWASP Top 10, sin secretos en el repositorio.
  - Aislamiento estricto de datos entre municipios (multi-tenant).
  - Tener en cuenta el Esquema Nacional de Seguridad (ENS).

### T5 · Accesibilidad
- La solución debe ser accesible.
- **[Interpretación]** Objetivo: **WCAG 2.1 nivel AA / UNE-EN 301 549**, que es lo que
  exige el RD 1112/2018 a las webs del sector público:
  - Navegación completa por teclado, foco visible.
  - Contraste suficiente, textos alternativos, etiquetas en formularios.
  - Compatible con lectores de pantalla (HTML semántico, ARIA solo cuando haga falta).
  - Calendarios de reserva accesibles (no depender solo del color ni del ratón).
  - Lenguaje claro.
  - Auditorías automáticas (axe, Lighthouse) en CI + revisión manual.

## Opcionales técnicos (valorables)
- App móvil (preferiblemente con tecnología libre y consumiendo la API común).
- Calendarios personales (suscripción/exportación ICS).
- Acceso por código QR (validación de reserva en la instalación).
- Analítica de uso y recomendación horaria — **respetando el RGPD** (datos agregados,
  sin trackers de terceros propietarios).

## Checklist antes de dar por buena cualquier funcionalidad
- [ ] Licencia del código y de las nuevas dependencias compatible (T1)
- [ ] Funciona en móvil y escritorio; módulo desacoplado (T2)
- [ ] Expuesta/consumible por API abierta documentada (T3)
- [ ] Datos personales minimizados, protegidos y aislados por municipio (T4)
- [ ] Pasa las comprobaciones de accesibilidad WCAG 2.1 AA (T5)
- [ ] Configurable por municipio, sin valores fijos en el código (R2/R3)
