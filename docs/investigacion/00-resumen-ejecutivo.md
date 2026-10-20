# Investigación de mercado: soluciones para la reserva de instalaciones deportivas municipales

> Fecha: 2026-10-16. Investigación web en cuatro frentes más una segunda tanda europea,
> consolidada aquí. Los informes detallados con fuentes están en los anexos
> [01](01-software-libre.md), [02](02-mercado-comercial.md), [03](03-sector-publico.md),
> [04](04-stack-tecnico.md) y [05](05-mercado-europeo.md). Lo no verificado está marcado
> como «desconocido» en los anexos; aquí solo se recogen conclusiones con respaldo.

## 1. Conclusión principal

**No existe ninguna solución, libre ni comercial, que cumpla el pliego completo del certamen**
(multi-concello + portal ciudadano + reglas deportivas municipales + indicadores +
accesibilidad WCAG 2.1 AA + gallego + identidad pública). El hueco es real:

- El software libre existente es genérico (salas de reuniones, citas, escritorios) y
  ninguno es multi-tenant por municipio ni accesible de serie. El único precedente público
  multi-municipio es alemán (Kommunale Räume, Apache-2.0).
- El mercado comercial para concellos pequeños es SaaS barato (310–1.200 €/año) que cabe en
  contrato menor, pero **ningún proveedor integra Cl@ve/Chave365, ninguno publicita WCAG y
  casi ninguno ofrece gallego**. Los grandes (i2A Cronos, Deporsite) son suites on-prem con
  apps mal valoradas (Cronos Global 1,6★) y alta presencial obligatoria.
- Muchos concellos gallegos siguen en teléfono, papel o formulario de sede electrónica
  (Santiago, Lugo, Abegondo, Catoira, Castrelo do Val, Avión…). No hay ninguna plataforma
  provincial de reservas: las deputacións ofrecen administración electrónica, no deportes.

## 2. Quién usa qué en Galicia hoy (verificado)

| Concello | Sistema |
|----------|---------|
| A Coruña | i2A CronosWeb tras SSO municipal; alta presencial en Riazor |
| Vigo | Deporsite (T-Innova) en reservasdeportes.vigo.org |
| Ames | i2A Cronos + app propia (mayo 2026) con apertura de puerta y luces |
| Vilalba | Sporttia (desde oct-2024) |
| Lourenzá, Riotorto | Pistas-Online (1 pista de pádel cada uno) |
| Soutomaior | App con cerradura electromagnética; proveedor desconocido |
| Santiago, Lugo, Abegondo | Formulario / solicitud en sede, sin reserva en tiempo real |
| Catoira, Castrelo do Val, Avión | Biblioteca, teléfono o llave en el Concello |
| Xunta (Fundación Deporte Galego) | Plataforma propia de reserva de pabellones |
| Deputacións | Ninguna plataforma de reservas deportivas |

## 3. Qué espera el mercado de un producto maduro

Funciones que los proveedores comerciales dan por hechas y que el jurado (con un concello
en él) probablemente también:

1. Calendario por instalación con franjas, ventana de antelación (48 h–15 días), límite de
   reservas por persona y día.
2. **Tarifas por empadronamiento** (integración con padrón), por tipo de usuario y franja.
3. Cancelación con plazos y penalización por no presentarse; devolución a monedero.
4. Pago: TPV Redsys/Bizum, bono o monedero prepago, y en los más completos SEPA, carta de
   pago y FacturaE.
5. **Reparto anual de horas a clubes** por temporada (hoy manual en A Coruña, Vigo, Santiago,
   Barreiros). Ninguna solución libre lo modela: es un diferencial.
6. Acceso por QR/PIN con apertura de puerta y luces (Ames, Soutomaior, Catoira ya lo hacen).
7. App móvil, idealmente con marca del concello (los SaaS cobran +250 €/plataforma).
8. Indicadores de ocupación y caja.

## 4. Dolores detectados que la propuesta debe atacar explícitamente

- Alta presencial obligatoria antes de poder reservar.
- Lock-in: migraciones de saldos de monedero a mano; sin exportación estándar; ReservaDeportes
  es el único que anuncia API abierta.
- Apps de marketplace sin marca municipal y con malas valoraciones.
- Comisiones ocultas (TPV del proveedor, 0,29–0,99 €/operación en Playtomic).
- Sin gallego, sin accesibilidad declarada, sin Cl@ve/Chave365.
- Procesos de temporada por decreto y correo.

## 4 bis. Mercado europeo: qué añade (detalle en [05](05-mercado-europeo.md))

Segunda tanda de investigación sobre Reino Unido, Irlanda, nórdicos, DACH, Benelux, Francia,
Italia, Portugal y nivel UE. Confirma la conclusión española y añade requisitos:

- **Ninguna solución europea, libre o comercial, cumple el pliego completo** (tabla de
  cumplimiento en la sección 0.3 del anexo 05). Las libres que cumplen la capa técnica
  (Publik, OpenCity, tilavarauspalvelu) carecen del dominio deportivo; las que lo tienen
  (Aktiv kommune, GELORE, Berlín, nórdicas, francesas) son propietarias o de código cerrado.
- **Tampoco en Europa existe un producto público o libre vivo para municipios pequeños.**
  Varaamo (Helsinki, MIT, 9 ciudades) está archivado; Kommunale Räume (DE, Apache-2.0) no
  tiene reparto de temporada y depende de la plataforma DeDi; el catálogo OSS de la UE
  (>640 soluciones) no tiene ninguna de reservas deportivas.
- **El reparto anual de horas a clubes es el núcleo funcional en todos los países**
  («Dauerbelegung», «säsongsansökan», «créneaux», «assegnazione spazi»). En Galicia es
  manual en A Coruña, Vigo, Santiago y Barreiros. Debe ser un bloque funcional propio.
- **Patrón universal de pagos**: factura a clubes + pago inmediato a ocasionales +
  conciliación contable; pasarela pública nacional obligatoria o de facto (PayFiP, pagoPA,
  iDEAL, MobilePay, Vipps, Suomi.fi).
- **Cuenta de organización** (club, verificada por el ayuntamiento, varios usuarios)
  separada de la cuenta ciudadana; eID obligatorio para clubes y temporada, **login ligero
  de respaldo** para reserva puntual (Lappeenranta perdió adopción cuando el eID fallaba).
- **Control de accesos sin llaves** (PIN por SMS válido solo en la franja, QR, cerraduras)
  es el diferenciador más citado; basta un webhook «reserva confirmada → credencial».
- **Nadie publica accesibilidad verificable**: los councils británicos admiten que sus
  proveedores son «parcialmente conformes»; Turku gastó dos personas-mes en Varaamo.
- **Modelo supramunicipal validado en todas partes**: OPSN franceses (Mégalis: la
  intercomunalidad paga por tramo de población y sus communes acceden gratis), Vitako
  alemán (80 % de municipios), Aktiv kommune noruego (14 municipios, coste compartido),
  GELORE cantonal suizo, CIM portuguesas. Es el molde para una deputación.
- **Gobernanza antes que código**: Varaamo murió por falta de product owner y modelo de
  financiación compartida (forks divergentes, pago tardío, proyecto parado al irse el jefe).
- **Precio a batir: <3.000 €/concello/año** (Aqqo, Hallenbuchungsplan, Pitchbooking),
  que es lo que permite comprar sin licitar.
- Marco legal a citar junto a la Ley 40/2015: **Interoperable Europe Act** (share & reuse,
  preferencia por licencias no restrictivas) y **CAD art. 69** italiano (riuso obligatorio).
- Referencias reutilizables: **Publik Chrono/Ressources** (AGPL, arquitectura agendas +
  recursos + personas jurídicas), **LIPAS** (registro finlandés de instalaciones, MIT,
  CC BY 4.0) como modelo de rexistro galego, **BASPO** (marco suizo de criterios de
  evaluación), **FIM 99098006005000** (ficha alemana del trámite), **modelo App IO
  «Locazione impianti»** (catálogo de notificaciones), **Venlo** (checklist de licitación).

## 5. Software libre reutilizable: veredicto

| Candidato | Licencia | Uso recomendado |
|-----------|----------|-----------------|
| **LibreBooking** (fork de Booked) | GPL-3.0 | Referencia funcional más completa (reglas, cuotas, lista de espera, ICS, API). PHP legacy con CVE recientes: no como base de código |
| **ep3-bs** | MIT | Único proyecto libre específico de pistas; cantera de modelo de datos y reglas (límite de reservas activas, estados de cobro). Zend 2 obsoleto |
| **MRBS** | GPL-2.0 | Único con traducción al **gallego**; motor de periodos y aprobaciones. Sin API ni portal moderno |
| **Kommunale Räume** (openCode.de) | Apache-2.0 | Único precedente público multi-municipio con reserva horaria y pago. Clonar y auditar: stack e idiomas sin verificar |
| **Odoo + OCA resource_booking** | AGPL-3.0 | Base viable solo si el equipo domina Odoo; demasiado pesado para un concello pequeño |
| **Pretix** | AGPL-3.0+ | Componente para aforo/entradas de piscina por franja, no para pistas |
| Cal.com, Easy!Appointments, Seatsurfing, Indico | varias | Solo referencia (modelo de citas o escritorios) |

### 5.1 Cumplimiento de los requisitos del certamen, solución por solución

Filtros aplicados (según las bases, ver `docs/contexto/`): **T1** licencia OSI/FSF ·
**T2** web responsive y modular · **T3** autenticación pública y estándares abiertos ·
**T4** RGPD y gestión segura de usuarios · **T5** WCAG 2.1 AA · **R3** multi-municipio ·
**C/M** portal ciudadano (C1–C4) y gestión municipal (M1–M3) · **gl** interfaz en gallego
(no es requisito literal, pero el jurado y las bases son gallegos).
✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ sin verificar.

| Solución | T1 | T2 | T3 | T4 | T5 | R3 | C/M | gl | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| **LibreBooking** | ✅ GPL-3.0 | ✅ | ⚠️ API + ICS + SAML/OAuth2, sin OIDC | ⚠️ CVE críticos corregidos en 7.0/7.1 (oct-2026) | ❌ no documentada | ❌ | ⚠️ reglas y cuotas sí; sin pagos ni indicadores | ❌ | La más completa; falla 3 obligatorios |
| **MRBS** | ✅ GPL-2.0 | ⚠️ UI antigua | ❌ sin API REST | ✅ | ❌ | ❌ | ❌ sin portal ciudadano | ✅ único con gl | Solo motor interno |
| **ep3-bs** | ✅ MIT | ⚠️ | ❌ sin API | ⚠️ | ❌ | ❌ | ⚠️ pistas sí, gestión municipal no | ❌ | Referencia de modelo de datos |
| **Odoo + OCA resource_booking** | ✅ AGPL-3.0 | ✅ | ✅ RPC/REST, OIDC vía OCA | ✅ | ❌ cliente web no certificado | ⚠️ multi-company | ⚠️ back-office sí, portal ciudadano flojo | ⚠️ parcial | La que más se acerca; falla T5 y portal |
| **Drupal + BEE/BAT** | ✅ GPL-2.0+ | ✅ | ✅ | ✅ | ✅ core de Drupal | ⚠️ multisite | ❌ reglas deportivas por programar | ✅ | Cumple la capa técnica, no la funcional |
| **Kommunale Räume** (openCode.de) | ✅ Apache-2.0 | ✅ | ⚠️ identidad acoplada a «DeDi» (DE) | ✅ | ❓ | ✅ | ⚠️ espacios genéricos; pago sí | ❌ | Único multi-municipio real; stack e idioma sin verificar |
| **GRR** | ✅ GPL-2.0 | ✅ Symfony 6 | ❓ API | ✅ | ❓ | ❌ (multi-dominio) | ❌ intranet | ❌ (es sí) | Referencia |
| Cal.com/Cal.diy, Easy!Appointments, Seatsurfing, Indico | ✅ | ✅ | ✅/⚠️ | ✅ | ❌ | ❌ | ❌ modelo de citas o escritorios | ❌ | Descartadas por dominio |
| **Pretix** | ✅ AGPL-3.0+ | ✅ | ✅ API completa | ✅ | ❌ | ✅ multi-organizador | ❌ entradas/aforo, no pistas | ❓ | Solo componente de aforo |
| Directus, Budibase, Dolibarr/ERPNext (módulos de reservas), Odoo `appointment` | ❌ no OSI o propietario | — | — | — | — | — | — | — | Descartadas en T1 |
| Comerciales (Cronos, Deporsite, Sporttia, ReservaDeportes, Playtomic…) | ❌ propietarias | ✅ | ❌ ninguna con Cl@ve/Chave365 | ⚠️ ENS medio en Sporttia y T-Innova | ❌ ninguna lo publicita | ⚠️ multi-centro, no multi-concello | ✅ | ❌ (solo portales propios de Vigo/A Coruña) | Descartadas en T1; referencia funcional |

**Lectura de la tabla:**
1. **Ninguna solución cumple el pliego completo.** El cruce que nadie resuelve es
   R3 + T5 + portal ciudadano: las multi-tenant (Kommunale Räume, Odoo) no son accesibles
   ni tienen portal apto; las que tienen reglas de reserva maduras (LibreBooking, ep3-bs)
   son mono-instancia.
2. **Ninguna cumple T3 en el sentido de las bases:** la «autenticación pública»
   (Cl@ve/Chave365) no la integra ninguna, libre o comercial.
3. **Esto es un argumento para la memoria**, no un problema: el criterio 4 (20 %) puntúa
   ser un activo público que hoy no existe, y esta tabla lo documenta (se buscó en CTT,
   mancomún, Joinup, openCode.de, Developers Italia y GitHub).
4. **Lo reutilizable, y así se defiende:** el modelo de reglas de LibreBooking/ep3-bs
   (cuotas, antelación, lista de espera, estados de cobro), la traducción gallega de MRBS
   como glosario, Keycloak para la identidad pública, Pretix como referencia de aforo, y
   Kommunale Räume como precedente a auditar. Desarrollo propio con piezas libres probadas,
   no un fork.

**Estrategia recomendada:** desarrollo propio con núcleo de disponibilidad inspirado en
LibreBooking/ep3-bs/MRBS, arquitectura multi-tenant e identidad propias, y portal ciudadano
nuevo construido accesible y en gallego desde el inicio. Esto es, además, lo que mejor puntúa
en «reutilización e soberanía tecnolóxica» (20 % según las bases): cubre un hueco inexistente en CTT, mancomún y Joinup.

## 6. Piezas del sector público que la memoria debe citar

Prioridad según el anexo [03](03-sector-publico.md):

1. **Identidad:** Cl@ve por SAML 2.0 vía pasarela (la deputación como intermediaria es el
   canal natural; la Deputación da Coruña ya publica guías de alta en Cl@ve para concellos).
   Chave365 **no tiene documentación pública de integración para terceros**: presentarlo como
   conector opcional condicionado a AMTEGA, nunca como hecho. Preparado para la Cartera
   Digital europea (OpenID4VP) que debe existir antes del 24/12/2026.
2. **Cobro desacoplado:** TPV Redsys propio del concello (tarjeta + Bizum, redirección) o
   autoliquidación contra la oficina tributaria de la deputación cuando la recaudación esté
   delegada; o sin pago online. Nunca custodiar tarjetas.
3. **ENS categoría básica «by design»** + kit de declaración de conformidad (CCN-STIC 809),
   alineado con el modelo «deputación como hub» (perfil CCN-STIC 883D). La Deputación da
   Coruña ya tiene su plataforma certificada hasta 2028.
4. **Accesibilidad RD 1112/2018** (UNE-EN 301 549:2022 = WCAG 2.1 AA): declaración de
   accesibilidad, mecanismo de comunicación y revisión previa incluidos en el producto.
5. **Licencia EUPL-1.2** (opcionalmente doble con AGPL-3.0, como hizo la Xunta con «Apunta»
   en 2025) + publicación en eira.mancomun.gal y CTT/Joinup, citando Ley 40/2015 arts. 157–158
   (obligación de reutilizar).
6. **pasaXe!** (plataforma de intermediación de la Xunta) para consultar padrón, familia
   numerosa y discapacidad sin papel; justificantes con CSV según ENI.
7. **Datos abiertos:** taxonomía del CNID, schema.org `SportsActivityLocation`, DCAT para
   datos.gob.es/abertos.xunta.gal y feed OpenActive (RPDE / Open Booking API).
8. **RGPD multi-tenant:** concello responsable, deputación/operador encargado (art. 28),
   minimización, menores, retención configurable.

Modelos de despliegue a contemplar en la memoria: (1) instancia multi-tenant operada por la
deputación o la Xunta, (2) instancia propia de un concello grande, (3) SaaS de un proveedor
con declaración ENS. Las deputacións de A Coruña y Pontevedra ya operan plataformas
multi-entidad para 50–90 concellos bajo convenio, así que el modelo (1) es realista.

## 7. Stack técnico: recomendación

Dos opciones del anexo [04](04-stack-tecnico.md), todas con licencias OSI verificadas:

- **A — «más rápido de prototipar»:** Supabase autoalojado (Apache-2.0) + Next.js/React +
  React Aria + Schedule-X, multi-tenant por RLS en PostgreSQL. Punto débil: ~10 contenedores,
  pesado para que un concello lo aloje solo.
- **B — «más defendible para adopción pública» (recomendada para la memoria):** Django 5.2
  LTS + django-tenants (schema por concello) + PostgreSQL + HTMX, Keycloak 26 (broker SAML
  para Cl@ve, passkeys, organizaciones), sistema de diseño basado en GOV.UK Frontend o
  Bootstrap Italia con identidad de la Xunta, PWA + Web Push, Docker Compose «un comando» +
  Coolify, Metabase/Umami para analítica. Gallego nativo en Django, admin de serie para el
  back-office, accesibilidad por renderizado en servidor.

Descartes por licencia: **Directus** (BSL, no OSI), Budibase (open core incompleto),
módulos de pago de Dolibarr/ERPNext, Odoo `appointment` (Enterprise). Cal.com ha pasado a MIT
pero eliminando el código de organizaciones y SSO.

Patrones concretos a reutilizar: restricción de exclusión en PostgreSQL
(`EXCLUDE USING gist`) para evitar solapes; RRULE para disponibilidad; QR como token firmado
(JWT ES256) validable sin red; OSDP en lugar de Wiegand si se integra hardware de acceso;
FullCalendar Premium es gratuito para proyectos GPLv3 (confirmar por escrito).

## 8. Bases oficiales del certamen

Durante la investigación apareció el PDF de las **bases completas**, que no estaba enlazado
en la web el día 15:
https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026.pdf (sustituido el
20-10-2026 por la versión 3, `Bases_I_Certame_GOBTEC_2026_GL_v3.pdf`)
Ya están leídas e incorporadas en `docs/contexto/`. Lo que cambia respecto a la web:
pesos 25/30/25/20 (cobertura baja al 30 %, reutilización sube al 20 % y pasa a llamarse
«reutilización e soberanía tecnolóxica» con subcriterios de apertura, independencia de
proveedor, estándares y portabilidad de datos), licencias recomendadas AGPL-3.0 o EUPL 1.2,
titularidad del participante, obligación de publicar el código en 60 días si se gana, y
entrega **solo por el formulario oficial** (no por correo). **Actualización 20-10-2026:** la
versión 3 de las bases sustituye el formulario por **correo a certame@agasol.gal**, adelanta el
cierre al **miércoles 18 de noviembre** y el evento final al **jueves 26 de noviembre**
(detalle en `docs/contexto/03-concurso-presentacion-valoracion.md`).

## 9. Incógnitas que conviene cerrar antes de la memoria

1. Formato y duración del pitch final (las bases no lo fijan).
2. Si AMTEGA ofrece federación de Chave365 a concellos y el procedimiento actual de alta en
   Cl@ve para entidades locales (la web de clave.gob.es rechazó las peticiones).
3. Si alguna deputación dispone de hosting ENS, pasarela de pago o contrato SMS corporativos.
4. Stack e idiomas de Kommunale Räume (openCode.de).
5. Sistemas actuales de Pontevedra, Ourense, Lugo, Narón, Oleiros, Carballo y Ferrol
   (no localizados por agotarse el cupo de búsquedas).
6. Licencia exacta de Bootstrap Italia (CC0 vs BSD-3) si se adopta como sistema de diseño.
