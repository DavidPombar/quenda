# Anexo 05 · Mercado europeo de reserva de instalaciones deportivas municipales

> Investigación web del 2026-10-16 en tres frentes paralelos (Reino Unido/Irlanda/nórdicos;
> DACH/Benelux; Francia/Italia/Portugal + nivel UE), ~180 búsquedas y ~120 páginas leídas.
> Precios según documentos públicos (G-Cloud, marcos de compra, actas municipales, tarifas
> de proveedor). Lo no verificado se marca **desconocido**. Complementa a
> [02-mercado-comercial.md](02-mercado-comercial.md) (España) y
> [01-software-libre.md](01-software-libre.md).

## 0. Síntesis transversal

### 0.1 Diez hechos que se repiten en toda Europa

1. **Ningún país tiene un producto público o libre vivo para concellos pequeños.** Lo más
   cercano fue Varaamo/Respa (Helsinki, MIT, 9 ciudades), hoy **archivado**; su sucesor
   es monociudad. Alemania tiene Kommunale Räume (Apache-2.0) pero sin reparto de temporada
   y acoplado a la plataforma de identidad DeDi. El catálogo de software libre de la UE
   (>640 soluciones) no contiene ninguna de reservas deportivas.
2. **El mercado es SaaS comercial comprado por catálogo o marco**: G-Cloud (UK), Adda
   (Suecia), UGAP (Francia), MePA (Italia), Deutsche Verwaltungscloud (DE), o compra directa
   bajo umbral en el resto.
3. **El reparto de temporada a clubes («Dauerbelegung», «säsongsansökan», «créneaux»,
   «assegnazione spazi», «vuorohaku») es el núcleo funcional en todos los países**, no la
   reserva puntual. Todos los sistemas municipales serios lo modelan: ventana anual de
   solicitud, prioridades publicadas, traspaso de la temporada anterior, convención por
   asociación, y liberación de huecos a la ciudadanía.
4. **La reserva ciudadana suele ser «solicitud → opción → confirmación»**, con reserva
   directa solo para instalaciones y perfiles configurados.
5. **eID nacional es estándar en nórdicos e Italia** (BankID, MitID, Vipps/ID-porten,
   Suomi.fi, SPID/CIE); en UK, Alemania, Benelux y Francia predominan cuentas propias
   (GOV.UK One Login aún no sirve a councils; BundID no documentado en ningún proveedor).
   Todos distinguen **cuenta de organización** (club, verificada por el ayuntamiento, con
   varios usuarios) de cuenta ciudadana.
6. **El pago público nacional es obligatorio o de facto**: PayFiP (FR, por ley), pagoPA
   (IT, por ley), iDEAL (NL), MobilePay (DK), Vipps (NO), Suomi.fi-maksut (FI). El patrón
   universal es factura a clubes + pago inmediato para ocasionales + conciliación contable.
7. **Control de accesos sin llaves** (PIN por SMS válido solo en la franja, QR en puerta,
   cerraduras iLOQ/Salto/Tapkey) es el diferenciador más citado y el mayor ahorro de
   personal.
8. **Nadie publica una declaración de accesibilidad verificable.** Los councils británicos
   admiten que ClubSpark, Legend, BookingLive y Stopford son «parcialmente conformes
   WCAG 2.1 AA»; Turku necesitó dos personas-mes para hacer accesible Varaamo.
9. **Modelo de proveedor compartido supramunicipal en todas partes**: OPSN franceses
   (Mégalis, Gironde Numérique), Vitako alemán (59 proveedores, 80 % de municipios), Aktiv
   kommune noruego (14 municipios, coste compartido), SIGI luxemburgués (99 comunas), CIM
   portuguesas, in-house regionales italianas, GELORE cantonal suizo. Es el análogo exacto
   de una deputación gallega.
10. **El open source municipal fracasa sin gobernanza** (lección Varaamo): sin product
    owner ni modelo de financiación compartida aparecen forks divergentes y el proyecto
    muere al irse el responsable.

### 0.2 Bandas de precio europeas para un concello pequeño

| Banda | Evidencia |
|---|---|
| Gratis / casi gratis | BalleJaune Bronze (FR), Espace sur Demande (FR, <3.500 hab.), ClubSpark (UK, tenis LTA), Conventus club (DK) |
| **1.000–4.000 €/año** | Aqqo 84–299 €/mes (NL); Hallenbuchungsplan «Basisabo 120 €» (DE); Pitchbooking £25/instalación/mes (UK); BalleJaune Platinum 50 €/mes (FR); ReservaDeportes 700–1.000 €/año (ES/PT) |
| 2.500–10.000 €/año | Locaboo desde 199 €/mes (DE); GovBook Sports Pitch £6k–15k (UK); Planitech mantenimiento ~5.000 €/año (FR) |
| 15.000–50.000 €/año | Sheffield–Zipporah £20k/año; North Yorkshire–Legend £14,9k/año por centro; Publik SaaS agglo <40.000 € |
| Proyecto ciudad media | Zúrich 2015: 80.000 CHF; Karlsruhe 2025: 87.581 € (89 pabellones, 198 clubes, 18 meses) |
| Proyecto regional | Berlín TSSV: 257.515 € (2023) + 100.000 € (2024) para 4.845 instalaciones y 15 oficinas |
| Plataforma supramunicipal | Mégalis: 2.333–11.663 €/año por intercomunalidad para todo el bouquet; Dimpact (NL) ≈15.000 €/año |

**Precio objetivo a batir en la memoria: <3.000 €/concello/año** (banda Aqqo/Hallenbuchungsplan/
Pitchbooking), que es lo que permite comprar sin licitar.

### 0.3 Cumplimiento de los requisitos del certamen, solución por solución

Mismos filtros que la tabla 5.1 del [resumen ejecutivo](00-resumen-ejecutivo.md), según las
bases: **T1** licencia OSI/FSF · **T2** web responsive y modular · **T3** autenticación
pública y estándares abiertos · **T4** RGPD y gestión segura · **T5** WCAG 2.1 AA ·
**R3** multi-municipio · **C/M** portal ciudadano (C1–C4) y gestión municipal (M1–M3) ·
**gl** gallego (o, al menos, i18n que permita añadirlo sin tocar código).
✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ sin verificar.

**Software libre y de titularidad pública**

| Solución | T1 | T2 | T3 | T4 | T5 | R3 | C/M | gl | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| **Kommunale Räume** (DE, openCode) | ✅ Apache-2.0 | ✅ React/TS, módulos frontend+admin+backend | ⚠️ OIDC vía Keycloak, pero **solo con la plataforma DeDi** (AGPL); API con SDKs | ✅ | ⚠️ plugin a11y en el linter, sin declaración ni auditoría | ✅ catálogo nacional, organizaciones | ⚠️ reserva de día/franjas y pago; **sin temporada, aprobación ni tarifas por tipo de usuario documentadas** | ❌ solo de; i18next permite añadir | El más cercano por licencia y multi-municipio; inviable como base sin desacoplar DeDi y añadir el núcleo municipal |
| **Publik Chrono + Ressources** (FR, Entr'ouvert) | ✅ AGPL-3.0 | ✅ Django, componentes desacoplados | ✅ FranceConnect nativo (OIDC/SAML genéricos), API `fillslot`, PayFiP vía eopayment | ✅ | ✅ RGAA declarado | ✅ multi-tenant SaaS | ⚠️ agendas, recursos compartidos y personas jurídicas sí; **sin temporada ni reglas deportivas**; es una GRU completa | ❌ fr; i18n Django | Cumple la capa técnica entera; demasiado grande como base, excelente referencia de arquitectura |
| **OpenCity Stanza del Cittadino** (IT) | ✅ AGPL-3.0 | ✅ microservicios | ✅ SPID/CIE/eIDAS, OpenAPI, pagoPA, App IO | ✅ | ✅ Bootstrap Italia / AgID | ✅ multi-ente | ⚠️ «prenotazione sale e spazi» con importe y pago; sin temporada | ❌ it/de | Igual que Publik: técnica completa, dominio deportivo ausente |
| **tilavarauspalvelu** (Helsinki, nuevo Varaamo) | ✅ MIT | ✅ Django+GraphQL, Next.js | ⚠️ acoplado a Helsinki Profile, Web Shop, Pindora | ✅ | ✅ Helsinki Design System | ❌ monociudad | ⚠️ reserva ciudadana y recurrencias; temporada parcial | ❌ fi/sv/en | Arquitectura y accesibilidad ejemplares; desacoplarlo cuesta más que rehacerlo |
| **respa / varaamo** (Helsinki, antiguo) y fork **codepointtku/respa** (Turku) | ✅ MIT | ✅ | ⚠️ JWT/Tunnistamo; spec 6Aika | ✅ | ⚠️ Turku añadió módulo accessibility | ⚠️ varias ciudades compartían instancia con frontal propio | ⚠️ recursos, unidades, reglas, pagos (Turku), accesos (kulkunen) | ❌ | Originales archivados; el fork de Turku es el más genérico, pero código sin futuro |
| **Lutece** (París) | ✅ BSD-3 | ✅ Java, 300+ plugins | ⚠️ | ✅ | ❓ | ✅ | ❌ solo citas; sin plugin de equipamientos | ❌ fr | Descartado por dominio |
| **GRR** (FR) | ✅ GPL-2.0 | ⚠️ Symfony 6, intranet | ❌ API desconocida | ✅ | ❓ | ❌ multi-dominio | ❌ sin portal ciudadano | ❌ (es sí) | Referencia |
| **Aktiv kommune** (NO), **GELORE** (CH), **Hallenbuchungsplan** (DE), **Groundkeeper/Berlín** (DE) | ❌ titularidad pública pero **código cerrado** o licencia desconocida | ✅ | ❓ | ✅ | ⚠️ solo Groundkeeper declara BITV | ✅ los cuatro son multi-municipio | ✅ temporada, aprobación, accesos | ❌ | **Fallan T1**: son el modelo de gobernanza y de funcionalidad, no código reutilizable |
| **LIPAS** (FI) | ✅ MIT + CC BY 4.0 | ✅ | ✅ API pública sin registro | ✅ | ❓ | n/a (registro nacional) | ❌ no es un sistema de reservas | ❌ | Fuera de alcance, pero **modelo para el rexistro de instalacións** y la capa de datos abiertos (T3, criterio 4) |

**Comerciales europeas** (todas fallan T1 por ser propietarias; se evalúa el resto para saber qué nivel exige el mercado)

| Solución | T2 | T3 | T4 | T5 | R3 | C/M | gl | Lo que enseña |
|---|---|---|---|---|---|---|---|---|
| Planitech, BalleJaune, Looc, 3D Ouest (FR) | ✅ | ⚠️ PayFiP sí; FranceConnect no; API limitada | ✅ | ❌ ninguna declara RGAA | ⚠️ BalleJaune multi-sitio; resto por cliente | ✅ temporada, convenciones, journal, heatmap | ❌ | El nivel funcional de temporada y trazabilidad que hay que igualar |
| CiviliaNext, SYSAP, Comune Facile, ServiziOnLinePA (IT) | ✅ | ✅ SPID/CIE + pagoPA + App IO | ✅ | ⚠️ obligados por AgID, no verificado | ⚠️ ServiziOnLinePA para unioni | ✅ | ❌ | Integración con eID y pago público como estándar, no como extra |
| Interbook GO, Rbok, Actor (SE); KMD, Conventus, WinKAS (DK); Timmi, Enkora (FI) | ✅ | ✅ BankID/MitID/Suomi.fi | ✅ | ❓ | ⚠️ por municipio | ✅ temporada + **subvenciones a clubes** + accesos | ❌ | Reserva, temporada y subvenciones como un solo sistema club–municipio |
| Locaboo, Venuzle, KOMMSOFT, NOLIS (DE/AT) | ✅ | ⚠️ sin BundID documentado; Locaboo mapea LeiKa | ✅ | ❓ | ⚠️ | ✅ Dauerbelegung, aprobación, sub-partes de pabellón | ❌ | Flujo solicitud → aprobación y pabellón divisible |
| Aqqo (NL), Recreatex (BE) | ✅ | ⚠️ iDEAL/Mollie; sin DigiD/itsme | ✅ | ❓ | ✅ Enterprise / webshop por municipio | ✅ | ❌ | Multi-municipio comercial y precio bajo (Aqqo) |
| Pitchbooking, Bookteq, GovBook, Legend, Gladstone, ClubSpark (UK); SportsKey (IE) | ✅ | ⚠️ OpenActive (Bookteq, Legend, Gladstone); sin One Login | ✅ | ⚠️ GovBook/Gladstone declaran AA; ClubSpark, Legend, BookingLive **«parcialmente conformes»** según los propios councils | ⚠️ multi-sede | ✅ | ❌ | Precios públicos de referencia; la accesibilidad como punto débil generalizado |
| BookUp (NO), Anybuddy (FR), Playfinder (UK/IE) | ✅ | ⚠️ Vipps (BookUp) | ✅ | ❓ | ✅ marketplace | ⚠️ reserva sí, gestión municipal débil | ❌ | Modelo marketplace supramunicipal con eID |

**Lectura:**
1. **Ninguna solución europea, libre o comercial, cumple el pliego completo.** La columna que sigue vacía en toda Europa es la combinación T1 (libre) + R3 (multi-municipio) + C/M con reparto de temporada + T5 declarada.
2. Las tres libres que cumplen toda la capa técnica (Publik, OpenCity, tilavarauspalvelu) son plataformas generalistas o monociudad **sin el dominio deportivo** (temporada, tarifas por tipo de usuario, no-show). Las que tienen el dominio deportivo completo (Aktiv kommune, GELORE, Berlín, nórdicas, francesas) son **propietarias o de código cerrado**.
3. Kommunale Räume es el único proyecto libre y multi-municipio, pero su dependencia de DeDi y la ausencia de temporada lo dejan como referencia de stack y licencia, no como base.
4. Para la memoria: la tabla demuestra que un desarrollo libre, multi-concello, con temporada y accesibilidad declarada sería **inédito en Europa**, no solo en España, y que los patrones de integración (eID + pago público + cuenta de organización + accesos por webhook) son el estándar que el jurado puede reconocer.

### 0.4 Lo que debe incorporar la propuesta gallega (lecciones consolidadas)

| # | Lección | Origen | Requisito que implica |
|---|---------|--------|----------------------|
| 1 | **Ciclo de temporada como entidad de primera clase**: campaña anual con ventana, solicitud por persona jurídica, prioridades configurables (sede local, menores, deporte natural del pabellón), traspaso con histórico, convención por club, huecos liberados a ciudadanía | NOLIS, Locaboo, Berlín, BalleJaune, Planitech, Interbook, Timmi, SDCC | Nuevo bloque funcional M4 **[propuesta]**: hoy manual en A Coruña, Vigo, Santiago y Barreiros |
| 2 | **Separar recurso de agenda**; recursos compartidos (pabellón = pista completa o tercios), búsqueda de huecos comunes, granularidad configurable | Publik Chrono/Ressources, Opencity, KOMMSOFT | Modelo de datos `Facility → Resource → AvailabilityRule → Booking` |
| 3 | **Estados explícitos** solicitud → opción → confirmación, con reserva directa solo donde se configure | Warendorf, Mechelen, Maldegem, Recreatex | Máquina de estados en C2/C3 |
| 4 | **Cuenta de organización** verificada por el concello, con usuarios y roles; eID ciudadano para personas | Berlín, Dortmund, Gent, Asker, KMD | Keycloak con organizaciones; Cl@ve para personas, representación de entidades |
| 5 | **Login ligero de respaldo** (email+OTP) para reserva puntual de bajo riesgo; eID obligatorio para clubes y temporada | Lappeenranta (Suomi.fi inestable hundió la adopción), Timmi, ClubSpark | T3 con dos niveles de garantía |
| 6 | **Combatir el acaparamiento con uso real**: check-in por QR/PIN, cancelación automática de no usados, KPI reservado vs. usado | Bielefeld, Rüti, Münster, Booky, Berlín Hallenbuch | M3 + opcional QR |
| 7 | **Pagos como adaptadores enchufables**: factura a clubes, pago inmediato a ocasionales, referencia única de conciliación, exportación contable | Venlo, Asker, Timmi, Interbook; PayFiP/pagoPA/iDEAL | Interfaz `PaymentProvider` (Redsys/Bizum, OVT deputación, sin pago) |
| 8 | **Conector abierto de control de accesos**: «reserva confirmada → credencial temporal» por webhook | Aktiv kommune, ClubSpark, Timmi, Locaboo | API/webhook aunque no haya hardware en v1 |
| 9 | **Trazabilidad**: journal inmutable de cada atribución, modificación y anulación | BalleJaune, Berlín, Opencity | Auditoría en T4 |
| 10 | **Datos abiertos**: plan de ocupación como endpoint abierto (Münster, París, Stavanger), registro de instalaciones tipo LIPAS (CC BY 4.0, API pública), feed OpenActive | Münster, París, LIPAS, OpenActive | T3 + criterio 4 |
| 11 | **Gobernanza publicada en el repo**: product owner, comité de concellos, política de contribuciones, versión única | Informe Tampere/Helsinki sobre Varaamo, Aktiv kommune | Apartado 6 de la memoria |
| 12 | **Accesibilidad como ventaja verificable**: declaración lista para que cada concello la enlace, auditoría WCAG presupuestada | Elmbridge, Liverpool, Turku | T5 |
| 13 | **Plan de implantación realista**: 12–18 meses en ciudades medias; piloto con clubes, sesión informativa, ventana de corte para migrar, soporte la primera temporada | Karlsruhe, Gütersloh, Berlín | Apartado 5 de la memoria |
| 14 | **Reglas de negocio data-driven** que aparecen en todos los reglamentos: antelación mín./máx., cancelación con penalización escalonada, tarifas por categoría (local/residente/no residente/externo, menores −50 %, tarjeta ciudadana), bloqueo por deudas, franjas escolares protegidas, cierres con aviso | Odivelas, París, Cuneo, Helmond, Porto, Ferrara | M2 configurable por concello |

---

## 1. Reino Unido e Irlanda

### 1.1 Productos
- **Pitchbooking** (Belfast) — G-Cloud 15: **£25 por instalación/mes** o **5 % por transacción**; contratos 1–5 años; Lisburn & Castlereagh, Reading BC. Accesibilidad: desconocido. https://www.pitchbooking.com
- **Bookteq / Playfinder** (Londres) — G-Cloud: **£30–80 por sede/mes** + Stripe; publica feed **OpenActive**; marketplace Playfinder también en Dublín. https://www.bookteq.com
- **BookingLab GovBook** (sobre JRNI) — solo sector público, «co-creado con 40+ councils»; **Sports Pitch Booking £6.000–15.000/año**; reglas, recurrentes, listas de espera, exención IVA automática, REST/OpenAPI; declara WCAG 2.1/2.2 AA (inconsistente).
- **Zipporah** — Sheffield CC: **£20.000/año** (2025–26) por adjudicación directa G-Cloud; campos, temporada, eventos.
- **Legend by Xplor** — LMS de centros de ocio; **£288–980/unidad/mes**; North Yorkshire **£44.668/3 años** por un centro; adoptó OpenActive en oct-2025; Liverpool publica fallos de accesibilidad.
- **Gladstone** — core **£83/licencia concurrente/mes** + online £125/sede/mes + app £125/sede/mes + transacciones £0,10–0,50; Blackpool £233.568; declara WCAG 2.2 AA.
- **ClubSpark (LTA)** — **gratuito** para tenis en parques; puertas con teclado/SmartAccess: PIN por franja; Elmbridge lo declara «parcialmente conforme WCAG 2.1 AA».
- **BookingLive** (Buckinghamshire, «parcialmente conforme»), **Open Play Flow** (285 centros), Hallnet (desaparecido). Bookwhen, Innovatise, CourtReserve: sin uso municipal verificado.
- **Irlanda — SportsKey** (ex BookAPitch): South Dublin CC desde 2021; SDCC licitó en 2024 con requisito de integración con accesos ACT365 y Global Payments. Fingal y Dublin City siguen con formularios anuales. Sin servicio compartido LGMA.

### 1.2 Identidad, pagos, compra
- **GOV.UK One Login no está disponible para councils** (discovery MHCLG 2025; «GDS Local» nov-2025) → usuario/contraseña + 2FA. Irlanda: sin MyGovID en reservas.
- Pagos: Stripe, pasarelas Capita/Civica, domiciliación. PSBAR 2018 obliga a publicar declaración de accesibilidad incluyendo terceros.
- Compra: **G-Cloud con direct award** sin licitación (Sheffield, North Yorkshire, Tendring); £20k–45k/año típico.

### 1.3 OpenActive
- Sport England +£700k hasta jun-2027 (£5,6 M desde 2016); >4.000 proveedores, 3 M oportunidades/mes; ~150–170 publicadores con feeds de councils vía Legend, Gladstone, Bookteq, Playwaze, ClubSpark; DSIT estudia adoptarlo como estándar oficial (sep-2025). **Open Booking API** con adopción limitada (Bookteq, Spawtz, Played…). Sport England exige cláusula OpenActive a receptores de Lottery funding. Sin adopción fuera de UK. https://status.openactive.io/

---

## 2. Nórdicos

### 2.1 Suecia
- **Marco Adda «Boknings- och bidragslösningar 2022»** (2023–2027, **no se renovará**): Pinea (Interbook), Rbok, Multisoft. Proyecto conjunto SKL 2016: >100 municipios, 24.000 SEK por adherirse.
- **Interbook GO** (Pinea/Explizit, absorbió FRI): dominante (~235 municipios entre ambos en 2018); reservas, **säsongsansökan**, **bidrag** (subvenciones a clubes), facturación, accesos (líder), Fogis, BankID como add-on. https://pinea.se/sv/tjanster/interbook/
- **Rbok** (Malmö, Helsingborg…): reservas + bidrag + importación de asistencia de IdrottOnline; NOX en Malmö. **Actor Smartbook** (Vitec): Nacka, Knivsta; säsongsplanering, códigos de acceso de un solo uso.
- Lección: **reserva + subvenciones + temporada son un mismo sistema de relación club–municipio.** Sin registro nacional de instalaciones.

### 2.2 Dinamarca
- **KMD Booking / Foreningsportalen**: portales `booking-<kommune>.kmd.dk`; **login MitID obligatorio** (clubes y grupos de particulares). **Conventus** (>3.000 asociaciones; precios club gratis/50/175 DKK/mes; módulo Haller 250 DKK/mes; accesos 2.500 DKK + 100 DKK/mes; MobilePay 70 DKK/mes + 1,35 DKK/pago); quejas de clubes: «demasiado complicado». **WinKAS**: Frederikshavn desde 2014 (ciclos de vida muy largos).
- **OS2** (comunidad open source municipal, 28 proyectos): **ningún producto de reservas**.

### 2.3 Noruega
- **Aktiv kommune** (cooperación liderada por Stavanger): **14 municipios, >1 M habitantes** (2020), modelo «selvkost og delingsøkonomi» (coste compartido sin ánimo de lucro), roles estandarizados, foro de usuarios, **PIN por SMS que abre la puerta solo en la franja reservada**, asignaciones fijas de temporada, datos abiertos en data.norge.no. Proveedor técnico y licencia: desconocido. https://www.aktiv-kommune.no
- **BookUp**: marketplace multi-arrendador (Asker: 21 colegios + 12 instalaciones), **login Vipps/BankID**, llave digital por Vipps. Kristiansund: Planyo ≈ 210.000 NOK/4 años.

### 2.4 Finlandia
- **Varaamo/Respa** (Helsinki, MIT): 155.000 reservas en 2025; repos originales **archivados abr-2024**; sucesor **tilavarauspalvelu** (MIT, Django+GraphQL, Next.js + Helsinki Design System) acoplado a Helsinki Profile/Web Shop/Pindora. Fork más genérico: codepointtku/respa (Turku, con módulos accessibility, payments, kulkunen).
- **Informe Tampere 2020 / Helsinki 2019**: 9 ciudades adoptaron; falló por falta de product owner → forks divergentes (Lappeenranta, Hämeenlinna), pago tardío («imposible modelar tarifas distintas»), Suomi.fi inestable en ciudades pequeñas, Turku 2 personas-mes para accesibilidad, Tampere se paró al irse el jefe de proyecto; Helsinki reescribió todo. https://tampereenseutu.fi/wp-content/uploads/2022/11/Varaamo-tilavarauspalvelu-Tampereen-kaupunkiseudulla.pdf
- **Timmi** (>40 municipios): reservas, **vuorohaku**, facturación, subvenciones, accesos iLOQ/Abloy, **Suomi.fi identificación y pagos**; Tuusula lo sustituyó por Enkora (ene-2026).
- **LIPAS** (Univ. Jyväskylä): registro nacional de ≈48.000 instalaciones, API v2 sin registro, datos **CC BY 4.0**, código **MIT**. **Modelo a imitar para un rexistro galego.** https://github.com/lipas-liikuntapaikat/lipas

---

## 3. Alemania, Austria, Suiza

### 3.1 Alemania
- **Locaboo** (Múnich): «>800 clientes públicos»; **desde 199 €/mes** (+79 € cursos, +39 € puertas), 12 meses mínimo; Saisonplanung, aprobación, reserva de parte de pabellón, Girosolution/Mollie/PayPal, Tapkey/Salto/Primion; declara OZG Reifegrad 3 y mapea LeiKa 99098006005000. Gütersloh, Lüneburg, Bielefeld (2026). Bielefeld detecta clubes que «acaparan» horas. https://www.locaboo.com/preise
- **Venuzle** (Graz): ganó **Dortmund** (licitación europea, 450 instalaciones, 2024) y **Karlsruhe** (87.581 € totales, 89 pabellones, 198 clubes, 18 meses, sustituye a SKUBIS); Eberswalde, Mainz, Duisburg. Precios no públicos.
- **Groundkeeper** (Kiel): software del **Sportstättenportal Berlin / TSSV**: 4.845 instalaciones, 15 oficinas; Hallenbuch digital; declara **BITV**; clubes con cuenta por formulario firmado (sin BundID); 257.515 € en 2023. Código propietario. https://sportstaetten.berlin.de/
- **Hallenbuchungsplan** (BIT Bremerhaven, empresa pública): «de la administración para la administración», en la **Deutsche Verwaltungscloud**; «Basisabo 120 €»; Luzern, Münster. Código cerrado.
- **KOMMSOFT** (Dauerreservierung, sub-partes, DATEV/SAP, LDAP/SSO), **NOLIS KoRBI** (temporada con traspaso; premio KommDIGITALE 2022), **eBuSy** (pistas, luz/acceso, >1.200 clientes), **SKUBIS** (legado en sustitución).
- **AKDB, ekom21, regio iT, KDO, Dataport**: sin producto propio de reservas deportivas.
- **Kommunale Räume** (DEUTSCHLAND.DIGITAL, ex LandRäume, Smarte.Land.Regionen/Fraunhofer IESE): **Apache-2.0**; **React 19 + TypeScript + Vite, React-Bootstrap 5, FullCalendar 6, Leaflet, TanStack Query, i18next, keycloak-js 26**; backend + PostgreSQL; **no funciona sin la plataforma DeDi** (AGPL-3.0: Keycloak, User-Service con organizaciones, Geo-Service Land/Kreis/municipio, Kafka, S3). Reserva de día o franjas, pago, catálogo nacional con mapa. **Recurrencias/temporada, aprobación, tarifas por tipo de usuario: no documentados.** Municipios usuarios: desconocido. https://gitlab.opencode.de/DEUTSCHLAND.DIGITAL/l1/kommunale-raeume-app
- **OZG**: no hay servicio EfA de Sportstättenvergabe; existe la ficha FIM/LeiKa 99098006005000 «Sporthalle oder Sportplatz nutzen» (útil para definir el trámite). **Sportstättenatlas federal aparcado en jul-2026** por datos inconsistentes. **Münster publica el plan de ocupación de pabellones como XML vivo** (open.nrw).
- Modelo compartido: **Vitako** (59 proveedores municipales de IT, ~80 % de municipios, 3.700 M€; AKDB ~5.000 clientes, ekom21 >90 % de Hesse, Komm.ONE, Dataport); compra por adhesión/in-house sin licitación individual; **EfA** («uno para todos») y **openCode** como mecanismos de reutilización.

### 3.2 Austria
- Venuzle dominante (Graz 2016, Wiener Neustadt, Eisenstadt). Auditoría de Viena 2022: adjudicación de ~600 gimnasios escolares por correo/fax, recomienda reserva online. **Baja Austria subvenciona sistemas de reserva y acceso** (400.000 € en 2024). ID Austria en reservas: desconocido.

### 3.3 Suiza
- **BASPO/EHSM «Marktübersicht Softwareprogramme zur Belegungsplanung von Sportanlagen»** (2020, actualizada mayo 2025): 17 productos con criterios de evaluación (roles propietario/explotador/conserje/usuario, tarifas regular/puntual e interno/externo, objetos y sub-objetos, interfaces facturación/cerraduras). **Marco de criterios reutilizable.** https://www.ehsm.admin.ch/dam/fr/sd-web/ZRmpiA4nfv14/Markt%C3%BCbersicht%20Softwareprogramme%20zur%20Belegungsplanung%20von%20Sportanlagen_2025-05-06.pdf
- **GELORE** (SIEN, Cantón de Neuchâtel, desarrollo público cantonal para Lausanne, Yverdon, La Chaux-de-Fonds — análogo a deputación), RBS (Berna), iCampus, RMS, Skubis (Zúrich 80.000 CHF en 2015). **El Cantón de Zúrich subvenciona** la introducción de sistemas de reserva. Rüti (2026): **check-in obligatorio por QR y «Fairplay-Ordnung»** para liberar reservas no usadas. EMBAG (2024) obliga al Bund a publicar código; sin código municipal de reservas liberado.

---

## 4. Países Bajos, Bélgica, Luxemburgo

- **Aqqo** (NL): **84 / 159 / 299 €/mes**, Enterprise municipal a consulta; seasonal scheduling, iDEAL/Wero vía Mollie, Peppol, acceso remoto; Tynaarlo lo compró **sin licitar por su bajo coste** (12 instalaciones, códigos de acceso por franja). https://www.aqqo.com
- **Consulta de mercado de Venlo** (TenderNed, 21 pabellones/40 unidades): checklist de requisitos muy útil — SaaS, fijos con factura vs. ocasionales con iDEAL, recurrencias, bloqueos, tarifas por tipo de usuario, conciliación con referencia fija, exportación ERP, ISO 27001, acceso Aras/QR, AVG, SLA, **WCAG 2.1**, coste anual. https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/237864/documenten/7026167/content
- Groningen Sport050 (QR ligado a reserva), Den Haag Sportwebshop. DigiD no se usa para reservas. **Common Ground**: Open Formulieren solo citas con JCC/Qmatic; sin componente de reservas. Datos: **Database SportAanbod** (Mulier, ≈20.000 instalaciones, derivados CC BY 4.0).
- **Bélgica — Recreatex/Vintia** (hoy SALTO WECOSYSTEM): webshop por municipio (`webshop<gemeente>.recreatex.be`), consulta sin login, reserva nace «en opción», asociaciones con aprobación previa; Gent documenta que integrar su SSO «fue todo menos sencillo». **Blueprints DINA de Leuven y Mortsel** (Vlaanderen): login Mijn Burgerprofiel/Verenigingsloket, datos vía MAGDA, código de acceso digital, de 4 días a 10 minutos de tramitación. Datos: **SPAKKI / Sportinfrastructuur Vlaanderen** (54 tipos, POI-service abierto). Sin vocabulario OSLO de sport. Luwio en los 13 centros de Sport Vlaanderen.
- **Luxemburgo — SIGI** (sindicato intercomunal, 99 comunas): sin módulo de reservas documentado.

---

## 5. Francia

### 5.1 Productos
- **Planitech/PlaniWeb** (JES, grupo CLERE): líder histórico, ~380 colectividades (Lyon, Marseille, Nantes, Strasbourg); **campañas anuales de renovación de créneaux**, pre-reserva con validación, **PayFiP**, Castel para accesos; referenciado en **UGAP**; exclusividad de PI → contratos negociados sin competencia (Arles: 20.000 €/4 años de mantenimiento). https://www.planitech.fr/
- **BalleJaune (OpenResa)**: módulo Collectivités con **atribuciones anuales con reconducción e histórico, journal de trazabilidad de cada decisión, heatmap de ocupación, PayFiP sin comisión con ingreso en la régie**, accesos (PassPerso, Igloohome, Bodet) e iluminación; **Bronze gratis, Silver 14,99, Gold 24,99, Platinum 49,99 €/mes**; Clermont-Ferrand. https://ballejaune.com/fr-fr/municipalities
- **JVS-Mairistem Looc** (>250 colectividades pequeñas): convención anual por asociación con firma electrónica, seguimiento de subvenciones indirectas. **3D Ouest Salles**: recurrencias con vacaciones escolares, exports PES/ASAP, parapheurs. **Kirola** (web caída), **Mariloo** (Arpège), **Berger-Levrault Atal** (sin reserva ciudadana), SynBird, Ma Municipalité, Booky (créneaux planificados vs. usados), **Espace sur Demande** (ANCT, gratuito <3.500 hab.).
- Grandes ciudades a medida: **París SPORTS** (390 equipamientos, solo personas morales, **open data «occupation des créneaux sportifs»**), Lyon (campaña anual en marzo).
- Marketplaces: Anybuddy (>15.000 pistas, comisión, Decathlon accionista), Doinsport, Ten'Up (FFT).

### 5.2 Integraciones y compra
- **PayFiP obligatorio por ley** (art. L.1611-5-1 CGCT) para entidades con >5.000 €/año de ingresos; FranceConnect nativo solo en Publik; RGAA 4 (ningún SaaS deportivo la menciona); exports PES/ASAP a Hélios.
- **OPSN** (>80 operadores públicos de servicios numéricos en la red Déclic): **Mégalis Bretagne** (Región + 4 departamentos + 60 EPCI, >2.500 entidades; **la intercomunalidad paga por tramo de población y sus communes acceden gratis**: 2.333 € <20.000 hab., 11.663 € >50.000), **Gironde Numérique** (734 miembros), **SICTIAM** (400–480). **Modelo directamente trasladable a una deputación.** https://services.megalis.bretagne.bzh/app/uploads/2025/01/2025-002_CONV_MEMBRES_Bouquet-de-services-2025-2029.docx
- Umbral: <40.000 € HT sin formalidades.

### 5.3 Open source
- **Publik** (Entr'ouvert, SCOP, **AGPLv3**, Django): GRU completa «nativement FranceConnectée»; módulo **Chrono** (agendas con «plages libres», `partial_bookings`, recursos compartidos, API `fillslot`) + **Publik Ressources** (multi-recurso, personas morales con usuarios habilitados, permisos por recurso, estadísticas); pago vía Lingo/eopayment (PayFiP). Roannais Agglo lo contrató como SaaS <40.000 €. **Mejor referencia de arquitectura** (agendas + recursos + personas jurídicas + conectores), pero demasiado pesado como base. https://doc-publik.entrouvert.com/admin-fonctionnel/agendas/
- **Lutece** (París, BSD-3, Java): plugin-appointment, sin plugin de equipamientos deportivos. **GRR** y Espace sur Demande en el Comptoir du Libre (Adullact).
- **Data ES**: censo de >330.000 equipamientos deportivos, Licence Ouverte, API diaria, declaración obligatoria por ley. https://equipements.sports.gouv.fr/

---

## 6. Italia

### 6.1 Productos
- **CiviliaNext Impianti Sportivi** (Deda Next): vetrina con disponibilidad, **SPID/CIE/eIDAS**, recurrentes, **aviso pagoPA automático**, conciliación contable, BI; Cuneo (rechazo automático si hay deudas previas). **SYSAP**: palestre escolares, pagoPA, QR de acceso, calendario de custodios. **Comune Facile Strutture Online** (~35 comuni: Novara, Modena, Padova). **ServiziOnLinePA** (Yes I Code, ACN): impianti + pagoPA + SPID + App IO para unioni.
- Grandes ciudades: Firenze PERICLE (ventana en mayo), Roma SUAS, Milano (palestre escolares 2023), Verona (tasas **exclusivamente por pagoPA**, marca da bollo 16 €), Modena/Ferrara/Torino (avisos anuales de assegnazione spazi; Ferrara −50 % under-18).

### 6.2 Integraciones obligatorias
- **pagoPA obligatorio** (art. 5 CAD; los pequeños comuni vía intermediario regional: MyPay, IRIS, E-fil). **SPID/CIE** obligatorios para servicios online. **App IO** tiene un **modelo de servicio oficial «Locazione locali e impianti comunali»** (mensajes de aprobación con periodo y canon, rechazo, revocación, reembolso, aviso de pago). https://developer.pagopa.it/app-io/guides/modelli-servizi/suolo-spazi-e-beni-pubblici/locazione-locali-e-impianti-comunali
- Accesibilidad: Linee guida AgID, **dichiarazione di accessibilità** anual, **Bootstrap Italia / Modello sito Comuni**. PNRR 1.4.x financió la digitalización 2022–26.

### 6.3 Riuso y open source
- **CAD art. 68–69 + Linee guida AgID 2019/2024**: valutazione comparativa obligatoria antes de comprar, prioridad a OSS y riuso; el software de titularidad pública se publica con `publiccode.yml` en **Developers Italia** (403 soluciones en 2023, 58 % reutilizadas). **Modelo normativo a citar junto a la Ley 40/2015.**
- **OpenCity Italia – Stanza del Cittadino** (AGPL-3.0, PHP/PostgreSQL/Shibboleth, v4.19 oct-2026, varios cientos de PA): según ficha ACN SA-6063 incluye «prenotazione di sale e spazi comuni con calcolo importo, pagamento pagoPA e integrazione App IO». Sin asignación estacional. https://www.acn.gov.it/portale/en/w/sa-6063
- **Censimento Nazionale Impianti Sportivi** (Sport e Salute, 2024): >3.300 comuni, acceso restringido.
- Compra: affidamento diretto <140.000 € vía MePA; in-house regionales (Lepida, CSI Piemonte, Insiel, Trentino Digitale) como agregadores.

---

## 7. Portugal

- **Mercado inmaduro y fragmentado**: ningún editor portugués especializado multi-municipio verificado. Los ERP autárquicos (**AIRC**, asociación de 29 municipios presente en ~179 câmaras; **Medidata**) no tienen módulo deportivo verificado. **ReservaDeportes** (ES) vende en PT (700–1.000 €/año). **Innux** (accesos/billética, integra con AIRC y Medidata).
- Casos: **Odivelas** (portal + app; reserva 5 días antes hasta 30 min; cancelación ≥1 h; clubes 10 €/h, residentes 15 €, no residentes 20 €), **Porto** (Ágora, quiosco check-in, Cartão Porto −50 %), **Mafra** (app Mafrativa con pago anticipado), **Lisboa** (inscripción anual de entidades por formulario), Oliveira do Bairro/Odemira (balcão digital con Cartão de Cidadão).
- Integraciones: **Autenticação.gov** (Cartão de Cidadão + Chave Móvel Digital, SAML/CAS/OAuth); MB Way/Multibanco; **PPAP** (plataforma de pagos de la AP) adoptándose con PRR; DL 83/2018 (WCAG 2.1 AA); AMA publica **AccessMonitor** (MIT). Sin dataset nacional de instalaciones (Carta Desportiva Nacional incompleta).
- Compra: **CIM** (comunidades intermunicipais) contratan plataformas compartidas (Médio Tejo 14 municipios, Região de Aveiro, Alto Minho ~1,5 M€, Região de Coimbra 19). Portal BASE: ningún contrato de software de reservas deportivas localizado.

---

## 8. Nivel UE

- **Interoperable Europe Act** (Reg. 2024/903, aplicación 2025): evaluaciones de interoperabilidad, **«share & reuse»** obligatorio entre entidades públicas, **preferencia por soluciones sin licencias restrictivas** a igualdad de funcionalidad/coste/seguridad. **Citar en la memoria junto a Ley 40/2015 y CAD art. 69.**
- **EU Open Source Solutions Catalogue** (>640 soluciones): **ninguna de reserva de instalaciones deportivas**; lo más cercano ZMS (citas, Berlín/Múnich).
- **Core Vocabularies (SEMIC)**: **CPSV-AP 3.2** para describir «reserva de instalación deportiva» como servicio público; **Core Location** para instalaciones; Core Public Organisation para concellos.
- **EUDI Wallet**: pilotos POTENTIAL/NOBID/EWC/DC4EU sin caso municipal de reservas; obligatorio 2026–27 → prever OIDC4VP.
- **Living-in.EU** (222 signatarios; financiación termina oct-2026). **OpenActive**: sin adopción fuera de UK, pero único estándar abierto de disponibilidad + reserva.
- Datos: sin dataset paneuropeo; nacionales Data ES (FR, abierto), LIPAS (FI, abierto), SPAKKI (BE, abierto), DSA (NL, parcial), Censimento (IT, restringido), Carta Desportiva (PT, inexistente), CNID (ES, 2005).
- CEN: EN 15312:2026 (equipamiento multideporte de acceso libre), EN 14904 (superficies): útiles para tipificar instalaciones, no para reservas.

---

## 9. Matriz europea resumida (✓ documentado · ~ parcial · – no · ? desconocido)

| Producto | País | Temporada clubes | Reserva ciudadana | Pago público nativo | eID nacional | Multi-municipio | Accesos | Accesibilidad declarada | Licencia |
|---|---|---|---|---|---|---|---|---|---|
| Pitchbooking | UK | ? | ✓ | ~ | – | – | ~ | ? | Propietaria |
| GovBook | UK | ~ | ✓ | ✓ | – (2FA) | multi-sede | ? | 2.1/2.2 AA | Propietaria |
| ClubSpark | UK | – | ✓ | ~ | – | ✓ | ✓ PIN | parcial | Propietaria (gratis) |
| Interbook GO | SE | ✓ | ✓ | ✓ | ~ BankID | por municipio | ✓ | ? | Propietaria |
| KMD Booking | DK | ✓ | ✓ | ✓ | ✓ MitID | por municipio | ✓ | ? | Propietaria |
| Aktiv kommune | NO | ✓ | ✓ | ~ factura | ? | **✓ 14 municipios** | ✓ PIN SMS | ? | ? |
| Timmi | FI | ✓ | ✓ | ✓ Suomi.fi | ✓ | por municipio | ✓ | ? | Propietaria |
| tilavarauspalvelu | FI | ~ | ✓ | ✓ | ~ Helsinki | – | ~ | HDS | **MIT** |
| Locaboo | DE | ✓ | ✓ | ✓ | ? | ~ | ✓ | ? | Propietaria |
| Groundkeeper (Berlín) | DE | ✓ | ~ clubes | ? | – | ✓ Land | – | ✓ BITV | Propietaria |
| Kommunale Räume | DE | ? | ✓ | ✓ | OIDC (DeDi) | ✓ | – | ~ | **Apache-2.0** |
| Aqqo | NL | ~ | ✓ | ✓ iDEAL | ? | ✓ Enterprise | ✓ | ? | Propietaria |
| Recreatex | BE | ✓ | ✓ | ✓ | ? | ✓ por municipio | ✓ | ? | Propietaria |
| Planitech | FR | ✓ | ✓ | ✓ PayFiP | ? | – | ✓ | ? | Propietaria |
| BalleJaune | FR | ✓ | ✓ | ✓ PayFiP | – | ✓ | ✓ | ? | Propietaria |
| Publik Chrono+Ressources | FR | ~ | ✓ | ✓ | ✓ FranceConnect | ✓ | – | ✓ RGAA | **AGPL-3.0** |
| CiviliaNext | IT | ~ | ✓ | ✓ pagoPA | ✓ SPID/CIE | – | – | ? | Propietaria |
| Opencity Stanza | IT | – | ✓ | ✓ pagoPA+IO | ✓ SPID/CIE | ✓ | – | ✓ AgID | **AGPL-3.0** |

**Ninguna columna completa en ninguna fila.** El cruce temporada + multi-municipio +
accesibilidad declarada + licencia libre sigue vacío en toda Europa.

---

## 10. Lagunas que quedaron sin verificar
Precios municipales de Interbook, Rbok, Timmi, KMD, Venuzle, Groundkeeper, KOMMSOFT, Recreatex,
Planitech; integración de BundID/ID Austria/AGOV/DigiD/itsme en cualquier proveedor; proveedor
y licencia de Aktiv kommune; municipios que usan Kommunale Räume y si soporta recurrencias;
lista oficial 2025 de implementadores de Open Booking API; sistemas actuales de Viena, Linz,
Zúrich, Luxemburgo, Cascais, Braga, Guimarães; módulos deportivos de Maggioli/Halley/Medidata/AIRC.

## Fuentes principales
UK: G-Cloud pricing docs (Pitchbooking 709863, Bookteq 806807843973490, GovBook 970464727127808, Gladstone 602956898113376, Legend 869719401337652) en applytosupply.digitalmarketplace.service.gov.uk · Sheffield/Zipporah https://www.contractsfinder.service.gov.uk/Notice/3df99f08-c203-41f1-bd85-995a0bd01f0b · Elmbridge ClubSpark https://elmbridge.gov.uk/accessibility/parks-tennis-clubspark-accessibility-statement · One Login https://mhclgdigital.blog.gov.uk/2025/04/23/exploring-approaches-for-using-gov-uk-one-login-in-local-government-join-our-discovery/ · OpenActive https://status.openactive.io/ · https://buddle.sportengland.org/news-and-inspiration/openactive-secures-fresh-funding-boost
Nórdicos: Adda https://www.adda.se/upphandling-och-ramavtal/ramavtal-och-avtalskategorier/utbildning-och-larande/boknings-och-bidragslosningar-2022/ · Aktiv kommune https://www.aktiv-kommune.no/wp-content/uploads/2020/12/Brosjyre-rev2-2.pdf · BookUp/Asker https://www.asker.kommune.no/bookup · Varaamo informes https://www.hel.fi/static/kanslia/elo/varaamo-loppuraportti.pdf · https://github.com/City-of-Helsinki/tilavarauspalvelu-core · LIPAS https://github.com/lipas-liikuntapaikat/lipas · Timmi https://timmi.fi/en/smart-city · Conventus https://web.conventus.dk/priser · MitID https://www.mitid.dk/en-gb/broker/prices/
DACH: Locaboo https://www.locaboo.com/preise · Karlsruhe https://web2.karlsruhe.de/ris/oparl/bodies/0001/downloadfiles/00670338.pdf · Dortmund https://www.dortmund.de/newsroom/presse-mitteilungen/buchungsanfragen-fuer-dortmunder-sportanlagen-sind-ab-september-online-moeglich.html · Berlín https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-26234.pdf · Kommunale Räume https://gitlab.opencode.de/DEUTSCHLAND.DIGITAL/l1/kommunale-raeume-app · Vitako https://vitako.de/ · Münster open data https://ckan.open.nrw/dataset/sporthallen-belegungsplan-ms · BASPO https://www.ehsm.admin.ch/ · Zürich subvención https://www.zh.ch/de/sport-kultur/sport/raum-fuer-sport/unterstuetzung-reservationssystem.html · Baja Austria https://www.noe.gv.at/noe/Sport/SPEZIELLE_RICHTLINIE_DIGITALE_BUCHUNGSSYSTEME_SPORTANLAGEN2.pdf
Benelux: Aqqo https://www.aqqo.com · Venlo TenderNed (arriba) · Mechelen Recreatex https://www.mechelen.be/digitaal-loket/sportinfrastructuur-reserveren · DINA Leuven https://assets.vlaanderen.be/image/upload/v1684324087/Blauwdruk_DINA_digitaliseringproceszaalverhuur_flwzml.pdf · SPAKKI https://www.vlaanderen.be/datavindplaats/catalogus/sportaccommodaties-in-vlaanderen-via-poi-service
Francia: Planitech https://www.planitech.fr/ · Arles https://centraledesmarches.com/marches-publics/Arles-Ville-d-Arles-MAINTENANCE-DU-PROGICIEL-PLANITECH--GESTION-ET-PLANIFICATION-DES-RESSOURCES/368217 · BalleJaune https://ballejaune.com/fr-fr/municipalities · Publik https://doc-publik.entrouvert.com/admin-fonctionnel/agendas/ · https://publik.entrouvert.com/publik-ressources/ · Mégalis (arriba) · PayFiP guía https://www.collectivites-locales.gouv.fr/ · París open data https://data.gouv.fr/fr/datasets/occupation-des-creneaux-sportifs · Data ES https://equipements.sports.gouv.fr/
Italia: CiviliaNext https://www.civilianext.it/civilianext.it/civilia-next/servizi-online/impianti-sportivi · Cuneo https://www.comune.cuneo.it/servizio/prenotazione-impianti-sportivi-comunali/ · App IO modelo https://developer.pagopa.it/app-io/guides/modelli-servizi/suolo-spazi-e-beni-pubblici/locazione-locali-e-impianti-comunali · Linee guida riuso https://www.agid.gov.it/sites/agid/files/2024-05/lg-acquisizione-e-riuso-software-per-pa-docs_pubblicata.pdf · Opencity ACN https://www.acn.gov.it/portale/en/w/sa-6063
Portugal: Odivelas https://odivelasamexer.cm-odivelas.pt/desporto/oferta-desportiva-municipal/instalacoes-desportivas/campos-de-padel · Porto https://www.agoraporto.pt/desporto/rmid · AMA eID https://www.ama.gov.pt/documents/24077/198481/Identifica%C3%A7%C3%A3o+eletronica.pdf · CIM Alto Minho https://www.cim-altominho.pt/pt/noticias/cim-alto-minho-lidera-projeto-digital-para-modernizar-gestao-urbana-dos-municipios/
UE: Interoperable Europe Act https://interoperable-europe.ec.europa.eu/collection/open-source-observatory-osor/news/interoperable-europe-act-and-open-source-community · catálogo OSS https://interoperable-europe.ec.europa.eu/interoperable-europe/news/eu-open-source-solutions-catalogue-now-live · CPSV-AP https://semiceu.github.io/CPSV-AP/releases/3.0.0/ · EUDI pilotos https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/694487808/
