# Anexo 02 · Mercado comercial (España/Europa) y situación en Galicia

> Investigación web del 2026-10-16 (~60 búsquedas + páginas oficiales). Precios según
> proveedores o agregadores (Capterra/GetApp), pueden estar desactualizados. Donde no hay
> verificación se indica **desconocido**.

## 1. Fichas por solución

### A. Proveedores españoles con foco municipal

**i2A Cronos (CronosWeb / app «Cronos Global»)** — i2A Proyectos Informáticos (Asturias) · https://www.i2a.es · folleto: https://www.zpinformatica.com/pdf/Cronos.pdf
- «Estándar de facto» municipal: «>200 ayuntamientos», «>400 centros». Históricamente on-prem; portales ciudadanos en `<municipio>.i2a.es/CronosWeb/Login`. Precio no público.
- Reserva de recintos, escuelas deportivas, abonados, competiciones, caja y recibos, monedero, TPV, control de accesos (hardware propio), integración con el **padrón** para tarifas empadronado/no, extensible a otras concejalías. App Cronos Global.
- Cl@ve: no documentado. Accesibilidad/RGPD: sin afirmaciones públicas.
- Gallegos verificados: **A Coruña** (CronosWeb tras SSO municipal; alta presencial en Riazor) y **Ames**.
- Fricciones: app 1,6★ (App Store); alta presencial obligatoria en varios municipios; migración de saldos por correo al cambiar desde Sporttia (Grado).

**Deporsite / Deporwin** — T-Innova (Barcelona) · https://www.t-innova.com · https://www.deporsite.net
- Centros municipales grandes; «>550 instalaciones». Deporwin = suite software+hardware; Deporsite = portal (`<cliente>.deporsite.net`). Precio no público.
- Actividades, reserva de pistas, clases, campus, venta de entradas, CRM, económico-financiero, Verifactu, control de accesos SmartTagQR.
- ENS nivel medio (RD 311/2022). Accesibilidad: desconocido.
- Gallegos verificados: **Vigo** (reservasdeportes.vigo.org).

**Sporttia** — Sporttia S.L. (Sevilla) · https://sporttia.com/software-gestion-deportiva/ayuntamientos
- SaaS; «>450 centros en 341 municipios»; ENS nivel medio; datos en la UE.
- **Precio público: Básico desde 35 €/mes, Avanzado desde 45 €/mes** (sin IVA), app incluida. Sin comisión con TPV del banco; con TPV Sporttia (Stripe) hay comisión. «Sporttia Zero» gratuito básico.
- Franjas con ventana/duración/límites, tarifas por franja y tipo de usuario, monedero, SEPA C19, cartas de pago C60, FacturaE a FACe, export Navision, conceptos tributarios, control de accesos (QR, RFID, PIN, huella; offline), Redsys y Paycomet. App marketplace. API y padrón: no mencionados. Cl@ve: no.
- Gallegos verificados: **Vilalba (Lugo)** desde oct-2024. App 3,5★.

**ReservaDeportes** — Algarsys S.L. · https://www.reservadeportes.com/en/ayuntamientos/
- «>300 municipios y clubes». SaaS. **Precio público anual sin IVA:** ≤3 instalaciones 700 €; ≤7 850 €; ilimitadas 1.000 €. Módulos +350–500 €/año; **app con marca del ayuntamiento +250 €/plataforma**; automatización de accesos desde 1.000 € + 5 €/mes SIM.
- Tarifas empadronado/no, monedero vecinal, TPV, SEPA, apertura de puertas y luces por 4G, **API abierta**, «sin permanencia».
- Gallegos: ninguno verificado. Idiomas: ES, EN, PT, FR, DE, EU; **no gallego**.

**Pistas-Online** — https://pistas-online.com — clubes y ayuntamientos pequeños (1–3 pistas); tarifa plana mensual sin importe público. Gallegos: **Lourenzá** y **Riotorto** (1 pista de pádel cada uno), Club de Tenis Nigrán.

**Reservar Zona Común** — desde 310 €/año; se posiciona «por debajo del contrato menor». **Gestión Instalación** — 40 €/mes (≤5 espacios) / 85 €/mes.

Otros existentes sin precio público ni clientes gallegos verificados: Reservae, zPoint, Anolla, **EPRINSA** (Diputación de Córdoba: módulo de instalaciones deportivas para sus municipios — ejemplo de solución provincial), ZCenter/Zitelia, GPA Sport, DeporWeb, **Provis/ProviSport** (Zaragoza, «>1.400 centros», foco gimnasios).

**Kirola / «Gestiona Deporte»**: no identificado como producto; «Kirola» es marca de servicios deportivos municipales vascos (Bilbao Kirolak con acceso QR, VGKirola Vitoria).

### B. Software de clubes de raqueta
- **Playtomic / Playtomic Manager** (ex-Syltek): clubes de pádel/tenis; comisiones al jugador documentadas 0,29 €/reserva, 0,50 €/cancelación; quejas OCU por no-show, cancelaciones y soporte. Sin funciones municipales.
- **Matchpoint** (~90–150 €/mes), **Timp** (50–170 €/mes), **Clupik** (desde 35 €/mes), **Padel Manager**, **Nubapp/Resasports**, **Trainingym**, **Golfmanager**: no municipales.
- No identificados: Instalia, Esportia, Ubikua, OpenSports, Sportyfriends. «Cronosport» y «Reservaweb» no son productos.

### C. Genéricos de reservas
Bookitit (15,90 €/mes por calendario), Reservio, Bookeo (14,95–79,95 $/mes), Skedda (99 $/espacio/mes). Sin tasas municipales ni padrón.

### D. Europa
- **Pitchbooking** (UK councils): G-Cloud 25 £/instalación/mes o 5 % por transacción. **SportsKey** (Irlanda). **Legend by Xplor** (UK; Tendring DC 42.751 £/año). **Gladstone** (desde 3.000–9.999 £/año).
- Francia: **Anybuddy** (marketplace por comisión; pistas municipales de París), **Doinsport**, Paris Tennis (plataforma propia de la Mairie).
- Alemania: **Locaboo** (Gütersloh, Lüneburg), **Venuzle** (Dortmund), KOMMSOFT, eBuSy, NOLIS. Precios no públicos.

## 2. Matriz de funcionalidades de un producto maduro

| Bloque | Funcionalidad | Quién la tiene |
|---|---|---|
| Reserva ciudadana | Calendario por instalación, franjas, antelación 48 h–15 días, límite por usuario/día | Todos |
| Reglas | Tarifas por franja, tipo de usuario y **empadronamiento** | Cronos (padrón), Sporttia, ReservaDeportes |
| Temporada | Asignación anual de horas a clubes por concurrencia | Manual en A Coruña, Vigo, Santiago, Lugo, Barreiros |
| Pagos | Redsys/Paycomet, monedero, SEPA C19, C60, FacturaE→FACe, export ERP | Sporttia (todo), ReservaDeportes, Cronos |
| Cancelación | Plazos, penalización no-show, devolución a monedero | Todos |
| Acceso | QR/PIN/RFID/huella, puerta y luces por 4G, aforo, offline | Sporttia, ReservaDeportes, Cronos, Ames/Soutomaior |
| App | Marketplace o con marca del concello (+250 €/plataforma) | — |
| Multi-centro | Varias instalaciones y concejalías | Cronos, ReservaDeportes |
| Actividades | Escuelas, inscripciones, listas de espera, abonos piscina | Cronos, Deporsite, Sporttia, ReservaDeportes |
| Analítica | Ocupación, horas punta, caja | Playtomic, Sporttia, Legend |
| Identidad | Usuario/contraseña + alta presencial; SSO municipal (A Coruña); **Cl@ve/Chave365: ninguna** | — |
| Cumplimiento | ENS medio (Sporttia, T-Innova); **WCAG: nadie lo publicita**; gallego solo en portales propios | — |

## 3. Bandas de precio para un concello pequeño (1–10 instalaciones)

| Banda | Coste orientativo | Ejemplos |
|---|---|---|
| Ultra-low SaaS | 310–700 €/año | Reservar Zona Común, ReservaDeportes ≤3, Bookitit |
| SaaS municipal estándar | 420–1.200 €/año | Sporttia 35–45 €/mes; ReservaDeportes 850–1.000 € + módulos |
| App con marca propia | +500 € | ReservaDeportes |
| Control de accesos | 1.000–3.000 € hardware + 5 €/mes/puerta | ReservaDeportes; Sporttia |
| Comisiones | 0 € (TPV banco) a 1–5 % o 0,29–0,99 €/operación | Sporttia-Stripe, Pitchbooking, Playtomic |
| Suites on-prem (Cronos, Deporwin, Provis) | No público; licencia + mantenimiento por módulos | — |

Casi todo el mercado para concellos pequeños cabe en **contrato menor** (<15.000 €): no se encontró ninguna licitación de software de reservas en contratosdegalicia.

## 4. Puntos de dolor recurrentes
1. Alta presencial obligatoria antes de usar la web/app.
2. Cuentas y datos fragmentados (SSO municipal vs. registro de Deportes).
3. Lock-in por monedero y datos; sin exportación estándar.
4. Calidad de app baja (Cronos Global 1,6★; Sporttia 3,5★); apps sin marca del concello.
5. Comisiones ocultas.
6. Coste/complejidad excesivos para pocas pistas vs. ultra-baratos sin padrón ni tasas.
7. Sin gallego ni accesibilidad declarada.
8. Sin Cl@ve/Chave365; la sede solo sirve para «solicitudes».
9. Procesos de temporada manuales por decreto y correo.
10. Concellos muy pequeños siguen en papel/teléfono/llave.

## 5. Galicia: quién usa qué hoy

| Concello | Sistema | Evidencia |
|---|---|---|
| A Coruña | i2A CronosWeb tras SSO; alta presencial; trámite RESINDEP; reparto anual a clubes | https://sede.coruna.gal/sede/es/tramites-y-servicios-electronicos/guia-de-procedimientos-y-servicios/detalle-de-procedimientos/reserva-de-instalaciones-deportivas/contenido/1453858202676 · https://www.coruna.gal/descarga/1453861288548/GUIA-ACCESO-CRONOS-WEB_xeral.pdf |
| Vigo | Deporsite; reserva desde 20:00 dos días antes; bonos; gl/es | https://reservasdeportes.vigo.org/ · https://sede.vigo.org/expedientes/tramites/tramite.jsp?id_tramite=169&lang=cas |
| Ames | i2A Cronos + app «Deportes Concello de Ames» (may-2026): puerta y luces, reservar para terceros | https://www.concellodeames.gal/es/avisos/reserva-de-pistas-de-tenis-e-padel · https://www.elcorreogallego.es/concellos/2026/05/04/ames-lanza-unha-app-reservar-129835355.html |
| Vilalba | Sporttia desde oct-2024 | https://www.aquilugo.com/articulo/vilalba/el/20241011101016014942.html |
| Lourenzá, Riotorto | Pistas-Online | https://pistas-online.com/clientes.html |
| Soutomaior | App con cerradura electromagnética; proveedor desconocido | https://www.pontevedraviva.com/es/general/las-pistas-municipales-de-padel-y-tenis-de-soutomaior-modernizan-el-sistema-de-reservas_356988_102.html |
| Ferrol | Gestor web (2016), proveedor desconocido; vigencia no verificada | https://diariodeferrol.elidealgallego.com/texto-diario/mostrar/2288415/reserva-instalaciones-deportivas-podra-realizarse-web-municipal |
| Santiago | Sin reserva en tiempo real: registro/declaración responsable; atletismo por correo | https://deportes.santiagodecompostela.gal/sites/portaldeportes/files/2023-09/informacion_2.pdf |
| Lugo | Trámite 801 (formulario) | https://concellodelugo.gal/es/tramites/online |
| Abegondo | Solicitud en sede | https://sede.abegondo.gal/sxc/es/procedimientosytramites/tramites/Solicituddereservadeinstalacionesdeportivas_N |
| Catoira | Biblioteca/teléfono → QR + clave | https://catoira.gal/wp-content/uploads/2026/01/Novas-normas-pista-padel-2026.pdf |
| Castrelo do Val, Avión | Llave en el Concello; ordenanza de precio público | https://castrelodoval.gal/wp-content/uploads/2025/12/Ordenanza-reguladora-do-funcionamento-da-pista-de-padel-municipal-de-Castrelo-do-Val-e-o-prezo-publico-pola-utilizacion-das-suas-instalacions.pdf · https://www.concelloavion.org/images/servicios/pabellon-municipal/pista-padel/normas-reserva-uso-pista-padel.pdf |
| Barreiros | Decreto anual de solicitudes de uso del pabellón | https://www.concellodebarreiros.gal/sites/default/files/deportes/decreto_2025-0674_apertura_prazo_para_solicitudes_uso_pavillon_municipal_tempada_25-26.pdf |
| Ourense, Pontevedra, Narón, Oleiros, Carballo, Ribeira, Vilagarcía… | **Desconocido** | — |
| Xunta – Fundación Deporte Galego | Plataforma propia de reserva de pabellones; sin Chave365 | https://fundaciondeportegalego.es/reserva-instalaciones/ |
| Deputacións | **Ninguna plataforma de reservas deportivas**; sí administración electrónica (Pontevedra: 54 concellos adheridos) | https://sede.dacoruna.gal/sxc/recursos/enlaces/serviciosAE · https://eprinsa.es/producto/gestion-de-cementerios-gestion-de-instalaciones-deportivas/ |

## 6. Huecos que un proyecto libre podría cubrir
1. Identidad pública (Chave365/Cl@ve/certificado) y alta 100 % online con verificación de padrón.
2. Gallego nativo + WCAG 2.1 AA.
3. Multi-tenant provincial desplegable por una deputación o AMTEGA (modelo EPRINSA).
4. Reglas municipales reales: tasas por ordenanza, reparto anual a clubes, FacturaE/FACe, C19/C60, Redsys sin comisión.
5. Portabilidad y anti-lock-in: exportación estándar, API abierta, datos en el concello/deputación.
6. Control de accesos abierto (QR/PIN con relés de bajo coste).
7. PWA con marca del concello.
8. Transparencia: ocupación como datos abiertos.

## Fuentes adicionales
Sporttia: https://sporttia.com/software-gestion-deportiva/ayuntamientos · ReservaDeportes: https://www.reservadeportes.com/en/ayuntamientos/ · Playtomic comisiones: https://matchpointsevilla.com/padel/crea-tu-partido/ · OCU: https://www.ocu.org/reclamar/empresas/playtomic/58E7B914-96B43580C · Cronos Global: https://apps.apple.com/es/app/cronos-global/id1367179688 · Grado (migración): https://www.ayto-grado.es/deportes/-/asset_publisher/df91e0d76a47/content/reapertura-de-instalaciones-deportivas · Tocina: https://www.tocinalosrosales.es/es/actualidad/noticias/NUEVA-APLICACION-PARA-RESERVA-DE-PISTAS-DEPORTIVAS/ · Pitchbooking G-Cloud: https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-15/documents/709863/744629558639052-pricing-document-2025-10-24-1201.pdf · Tendring/Legend: https://tdcdemocracy.tendringdc.gov.uk/ieDecisionDetails.aspx?Id=14437 · Anybuddy: https://www.anybuddyapp.com/fr · Locaboo: https://www.locaboo.com/loesungen/fachbereich/sportamt/sporthallen · Bilbao Kirolak QR: https://www.ondavasca.com/la-nueva-app-de-bilbao-kirolak-permitira-el-acceso-sin-pulseras-ni-tarjetas-2/

Pendientes (cupo de búsquedas agotado): proveedor de Soutomaior y de la app de Ames («galileo»), sistemas de Pontevedra, Ourense, Lugo, Narón, Oleiros, Carballo, Ferrol; licitaciones en contratosdegalicia.gal.
