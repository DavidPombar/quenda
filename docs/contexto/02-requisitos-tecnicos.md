# 02 · Requisitos técnicos

> **Fuente: bases oficiales.** `Bases_I_Certame_GOBTEC_2026.pdf`
> (https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026.pdf),
> descargadas y leídas el 2026-10-16. Puntos 1.2 "Condicionantes técnicos obrigatorios",
> 1.3, 5 (criterio «Reutilización e soberanía tecnolóxica») y 8 «Propiedade intelectual e
> licenza». Fuente secundaria: https://www.agasol.gal/i-certame-gobtec/ (2026-10-15).
> Las bases listan cinco condicionantes técnicos obligatorios, literales entre comillas.
> Lo marcado como **[Interpretación]** es cómo los aplicamos en el desarrollo; no está en
> la convocatoria. Lo marcado como **[Cambio vs. web]** difiere de la web anterior a las bases.

## Condicionantes técnicos OBLIGATORIOS (punto 1.2)

### T1 · Software libre con licencia reconocida (OSI/FSF)
Literal 1.2: "Software libre: licenza recoñecida (OSI/FSF) que permita a reutilización por
outras administracións."

Lo que añade el **apartado 8 de las bases** («Propiedade intelectual e licenza»):
- **Licencia exigida:** "unha licenza de software libre recoñecida pola OSI (Open Source
  Initiative) ou a FSF (Free Software Foundation)".
- **Licencias recomendadas expresamente: AGPL-3.0 o EUPL 1.2**, "por seren as que garanten
  que as melloras realizadas sobre a solución sigan estando dispoñibles para o conxunto
  das administracións, tamén cando a plataforma se ofreza como servizo aloxado". Las
  bases destacan que la EUPL 1.2 es la licencia de referencia de la Comisión Europea para
  software del sector público y tiene texto con pleno valor jurídico en castellano.
- Otra licencia libre OSI/FSF **no excluye** la propuesta, "pero terase en conta na
  valoración do criterio «Reutilización e soberanía tecnolóxica»" (20 %).
  **[Cambio vs. web]** La web solo decía "software libre (OSI/FSF)"; la recomendación
  AGPL-3.0/EUPL 1.2 y su efecto en la puntuación son nuevos. Nuestra elección anterior
  (EUPL-1.2 o AGPL-3.0) era una interpretación y ahora coincide con la recomendación oficial.
- **Titularidad:** "Os dereitos de propiedade intelectual de cada proposta corresponden á
  entidade participante que a presenta. A participación no certame non supón cesión de
  dereitos a AGASOL nin ás administracións colaboradoras", sin perjuicio del uso posterior
  que permita la licencia libre elegida.
- **Garantía de titularidad:** el participante garantiza ser titular de todos los derechos
  o tener autorización suficiente para licenciar, "con independencia das ferramentas
  empregadas no desenvolvemento, incluídas as ferramentas de intelixencia artificial
  xerativa". **[Interpretación]** No copiar código de licencias incompatibles; revisar lo
  generado con IA igual que cualquier otra contribución.
- **Obligación si se gana:** publicar el código fuente "xunto coa documentación necesaria
  para o seu despregamento, nun repositorio de acceso público" en un máximo de **60 días
  naturais desde o fallo do xurado**; el pago del premio queda condicionado a ello.

Decisiones de desarrollo:
- Licencia del proyecto: **EUPL-1.2** (alternativa: AGPL-3.0); ambas son las recomendadas.
  Fichero `LICENSE` en la raíz y cabecera SPDX en los ficheros fuente. **[Interpretación]**
- **Todas las dependencias** deben tener licencias libres compatibles. Prohibido incluir
  SDKs, librerías o servicios propietarios como requisito para funcionar.
- **[Interpretación]** Revisar licencias al añadir dependencias (p. ej. `license-checker`,
  `pip-licenses`, REUSE tool).
- Repositorio público con documentación de despliegue desde el principio: el criterio 4
  puntúa el "grao de apertura real do código".

### T2 · Arquitectura abierta: web responsive y modular
Literal: "Arquitectura aberta: solución web, responsive e modular."
- Aplicación **web responsive** (móvil, tablet, escritorio) como canal principal.
- **Modular**: módulos separados (instalaciones, reservas, usuarios, notificaciones,
  indicadores, configuración municipal) que se puedan activar/sustituir.
- **[Interpretación]** API documentada (OpenAPI) que separe backend y frontend; la app
  móvil opcional consumiría la misma API.
- **[Interpretación]** Despliegue reproducible con contenedores (Docker/Compose) y sin
  dependencia de un cloud concreto; autohospedable por un concello o deputación. Esto
  responde además a la "independencia de provedor" del criterio 4.

### T3 · Interoperabilidad: autenticación pública y estándares abiertos
Literal: "Interoperabilidade: autenticación pública e estándares abertos."
**[Cambio vs. web]** Las bases hacen explícita la **autenticación pública** como parte del
condicionante (la plantilla ya pedía el "mecanismo de autenticación pública previsto").
- Prever integración con un sistema de identidad de la administración (**Cl@ve, Chave365**)
  mediante estándares (OpenID Connect / SAML), con alternativa de cuenta local mientras no
  exista la integración. **[Interpretación]** sobre qué IdP concreto.
- Usar formatos y protocolos abiertos. **[Interpretación]** Ejemplos aplicables:
  - API REST + JSON, especificación OpenAPI 3.
  - Calendarios en iCalendar (RFC 5545 / `.ics`).
  - Exportación de datos en CSV/JSON; datos abiertos de instalaciones (catálogo de datos
    abiertos del concello).
  - Base de datos libre (PostgreSQL recomendado).
  - Alinearse con el Esquema Nacional de Interoperabilidad (ENI).
- **Portabilidad íntegra de los datos** (criterio 4): exportación/importación completa de
  los datos de un municipio en formatos abiertos, para cambiar de proveedor o de
  instancia sin pérdida. **[Interpretación]** de "portabilidade íntegra dos datos".

### T4 · Seguridad y cumplimiento: RGPD (RXPD) y gestión segura de usuarios
Literal: "Seguridade e cumprimento: RXPD e xestión segura de usuarios."
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
- Si hay componentes de IA: "que non remita datos persoais a terceiros sen base xurídica"
  (criterio 4 de las bases).

### T5 · Accesibilidad: WCAG 2.1 nivel AA
Literal: "Accesibilidade: conformidade co nivel AA da norma WCAG 2.1, consonte ao Real
Decreto 1112/2018 e á norma EN 301549."
**[Cambio vs. web]** La web solo decía "accesibilidade"; las bases fijan **WCAG 2.1 AA,
RD 1112/2018 y EN 301 549** como requisito obligatorio (antes era nuestra interpretación).
- **[Interpretación]** Cómo lo cumplimos:
  - Navegación completa por teclado, foco visible.
  - Contraste suficiente, textos alternativos, etiquetas en formularios.
  - Compatible con lectores de pantalla (HTML semántico, ARIA solo cuando haga falta).
  - Calendarios de reserva accesibles (no depender solo del color ni del ratón).
  - Lenguaje claro.
  - Auditorías automáticas (axe, Lighthouse) en CI + revisión manual.
  - Declaración de accesibilidad configurable por municipio (la exige el RD 1112/2018 a
    las webs públicas).

## Requisitos derivados del criterio «Reutilización e soberanía tecnolóxica» (20 %)

No son un condicionante del punto 1.2, pero las bases los puntúan y afectan al diseño:

| Qué piden las bases (literal) | Cómo se traduce **[Interpretación]** | IDs |
|-------------------------------|--------------------------------------|-----|
| "grao de apertura real do código" | Repositorio público desde el inicio, licencia recomendada, sin módulos cerrados | T1, R1 |
| "independencia de provedor" | Sin dependencias de un cloud o SaaS concreto; autohospedable; sin SDKs propietarios | T1, T2 |
| "uso de estándares e formatos abertos" | OpenAPI, iCalendar, CSV/JSON, OIDC/SAML, PostgreSQL | T3 |
| "portabilidade íntegra dos datos" | Exportación/importación completa por municipio en formatos abiertos | T3, R3 |
| IA: "pesos abertos e autoaloxable, ou substituíble sen redeseñar a plataforma", sin remitir datos personales a terceros sin base jurídica; su ausencia "non penaliza" | Si hay IA, modelo intercambiable detrás de una interfaz y sin datos personales a terceros; por defecto, no incluir IA | T4 |

## Opcionales técnicos (valorables, punto 1.3)
- App móvil (preferiblemente con tecnología libre y consumiendo la API común).
- Calendarios personales (suscripción/exportación ICS).
- Acceso por código QR (validación de reserva en la instalación).
- Analítica de uso y recomendación horaria — **respetando el RGPD** (datos agregados,
  sin trackers de terceros propietarios) y, si usa IA, con las condiciones del criterio 4.

## Checklist antes de dar por buena cualquier funcionalidad
- [ ] Licencia del código y de las nuevas dependencias compatible con EUPL-1.2/AGPL-3.0 (T1)
- [ ] Funciona en móvil y escritorio; módulo desacoplado (T2)
- [ ] Expuesta/consumible por API abierta documentada; datos exportables (T3)
- [ ] Datos personales minimizados, protegidos y aislados por municipio (T4)
- [ ] Pasa las comprobaciones de accesibilidad WCAG 2.1 AA (T5)
- [ ] Configurable por municipio, sin valores fijos en el código (R2/R3)
- [ ] Sin dependencia de un proveedor o servicio concreto para funcionar (criterio 4)
