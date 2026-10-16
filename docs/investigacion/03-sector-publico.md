# Anexo 03 · Piezas del sector público: identidad, pagos, cumplimiento, ecosistema gallego y datos abiertos

> Investigación web del 2026-10-16. Algunas páginas oficiales (clave.gob.es, CTT) rechazaron
> las peticiones (WAF). Donde no hay verificación se indica **desconocido**.

## 0. Hallazgo sobre el certamen
- **Bases (PDF):** https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026.pdf (no enlazado en la web el 15-10). Tienen un apartado «8. Propiedade intelectual e licenza» y los puntos 1.1 y 1.2 que cita la plantilla. Texto no extraído: **leer a mano y actualizar `docs/contexto/`**.
- Encaja con el Plan de Acción de Software Libre 2026 de AMTEGA («reto tecnolóxico de interese público» vía convenio con AGASOL): https://mancomun.gal/wp-content/uploads/2026/06/Plan-de-Accion-2026_SWL.pdf. Logos FEDER/NextGenerationEU.

## 1. Identidad

### Chave365 (Xunta)
- NIF + clave + OTP por SMS; >1,4 M usuarios. https://www.xunta.gal/chave365 · alta PR001A en sede.xunta.gal.
- Se usa en sede Xunta, Notifica.gal, eSaúde… **No hay evidencia de uso en sedes de concellos ni documentación pública de integración para terceros.** El broker de la Xunta (https://sedegl-idbroker-ext.xunta.gal/cas/login) parece tipo CAS (inferencia). En el catálogo Eidolocal no figura ningún servicio de identificación ciudadana con Chave365.
- Qué decir: «integración opcional con Chave365 condicionada a habilitación por AMTEGA; el módulo de identidad es un conector estándar OIDC/SAML 2.0». No prometerlo como hecho.

### Cl@ve
- Federación de identidad de la AGE. Prescripciones técnicas: Resolución 14/12/2015 (https://www.boe.es/buscar/act.php?id=BOE-A-2015-14215). Nota técnica: https://administracionelectronica.gob.es/pae_Home/va/dam/jcr:2f03a912-1a7e-4766-b031-1f87f57be0e9/2015-05-nota_tecnica_clave_v2.pdf. Procedimiento de alta actual: **desconocido** (web inaccesible).
- SAML 2.0 con extensiones STORK/eIDAS; intercambio de EntityID, ACS, certificado y atributos. Nivel básico no permite usar sedes; avanzado sí. Pasarelas intermedias (ProxyCl@ve Andalucía, RedIRIS). **La Deputación da Coruña publica guías de alta en Cl@ve para EELL**: el canal natural de un concello pequeño es su deputación.
- Qué decir: Cl@ve como identificación «de nivel sede» (tarifas bonificadas, datos personales); acceso ligero (email/teléfono verificado) para consulta; conector SAML2 compatible con pasarela Cl@ve o de la deputación; firma no necesaria para reservar.

### Autofirma / @firma / FIRe
- CTT: https://administracionelectronica.gob.es/ctt/afirma · https://administracionelectronica.gob.es/ctt/fire. Fuera del núcleo; justificantes sellados con selo de órgano (certificados Camerfirma gratuitos vía Eidolocal) + CSV.

### eIDAS 2 / EUDI Wallet
- Reglamento (UE) 2024/1183: cartera antes del **24/12/2026**; registro de partes usuarias desde esa fecha. España: «Cartera Digital (Beta)» sobre Cl@ve; real decreto en borrador (consulta hasta 13/10/2026). Protocolos OpenID4VP/OpenID4VCI.
- Qué decir: «EUDI-ready»: OIDC con capacidad de añadir verificador OpenID4VP para acreditar edad/empadronamiento sin almacenar documentos.

## 2. Pagos
- Xunta/ATRIGA: TPV virtual con tarjeta y Bizum (https://ficheiros-web.xunta.gal/aplicacions/fides/pago-tasas-cast.pdf). **No hay evidencia de que se ofrezca a concellos.**
- Deputacións con recaudación delegada: A Coruña OVT (tarjeta sin coste; cobra prezos públicos por delegación), Lugo «Portal do Contribuínte», Pontevedra ORAL.
- Redsys: https://pagosonline.redsys.es (Redirección, REST, inSite, inApp; Bizum, Apple/Google Pay; HMAC-SHA256; `Ds_Order` ≤ 12 caracteres; contrato siempre con una entidad financiera). Bizum en AAPP: Madrid lo asimiló al TPV (BOCM 4/1/2024); Justicia: ~35 % de los pagos online.
- Qué decir: módulo de cobro desacoplado con tres estrategias por concello: (a) TPV Redsys propio; (b) autoliquidación/pago por referencia contra la OVT de la deputación; (c) sin pago online. Bonificaciones (empadronados, familia numerosa, discapacidad), devoluciones, sin custodiar tarjetas.

## 3. Interoperabilidad y cumplimiento
- **ENI** (RD 4/2010): justificantes como documentos ENI con CSV y metadatos; exportación de expedientes a la plataforma de tramitación del concello.
- **ENS** (RD 311/2022): art. 2.3 obliga a exigir conformidad en pliegos. BÁSICA → Declaración de Conformidad (CCN-STIC 809); MEDIA/ALTA → certificación. CCN-Entidades locales (https://ens.ccn.cni.es/es/entidades-locales): guía CCN-STIC 883 con perfiles por población (883A <5.000; 883B 5.000–20.000; 883C 20.000–75.000; **883D diputaciones**). La Deputación da Coruña tiene certificado ENS para su plataforma y la de las EELL adheridas hasta 2028-06-08 (https://sede.dacoruna.gal/sxc/recursos/enlaces/Normativa/CertificadoConformidadeENS_V2).
- Qué decir: «ENS básica by default» (MFA gestores, registro de actividad, cifrado, copias, segregación multi-tenant, SBOM) + kit documental para que la deputación lo incluya en su alcance.
- **RD 1112/2018** (https://www.boe.es/buscar/act.php?id=BOE-A-2018-12699): aplica a EELL; UNE-EN 301 549:2022 = WCAG 2.1 AA; declaración de accesibilidad enlazada desde todas las páginas y actualizada anualmente; mecanismo de comunicación; revisión previa y periódica; quejas 20 días hábiles; apps móviles sujetas desde 2021; la «carga desproporcionada» no excusa adquirir sistemas no accesibles (art. 7.3).
- **Ley 40/2015** (https://www.boe.es/buscar/act.php?id=BOE-A-2015-10566): art. 157 — las AAPP deben compartir sus aplicaciones, pueden declararlas de fuentes abiertas y **están obligadas a reutilizar** antes de adquirir/desarrollar; art. 158 — directorios de aplicaciones.
- **CTT** (https://administracionelectronica.gob.es/ctt): la AGE libera «preferentemente con EUPL»; federado con Joinup y con el repositorio de la Xunta. **Repositorio Xunta: https://eira.mancomun.gal** (GitLab «Mancomún», OSL de AMTEGA); procedimiento de liberación: https://mancomun.gal/wp-content/uploads/2023/03/Procedemento-Liberacion-Xunta_de_Galicia-galego.pdf; ejemplo: «Apunta» liberado en 2025 con **doble licencia EUPL + AGPL**. Ninguna solución de reservas en el CTT.
- Qué decir: **EUPL-1.2** (± AGPL-3.0), publicación en eira.mancomun.gal y CTT/Joinup, dependencias compatibles, documentación de despliegue para cumplir el art. 157.
- **RGPD/LOPDGDD**: concello = responsable, operador/deputación = encargado (art. 28, contrato modelo incluido), segregación por tenant, minimización, menores, retención configurable, registro de actividades tipo, DPD del concello.

## 4. Ecosistema gallego
- **AMTEGA** (https://amtega.xunta.gal): Oficina de Software Libre; planes anuales SwL (2025: https://mancomun.gal/wp-content/uploads/2025/02/2025_Plan_SwL.pdf). **GobTec Galicia**: ecosistema de co-creación con empresas, startups, universidades; acuerdo marco 2021 de 30 M€ en tecnologías disruptivas.
- **mancomún.gal**: repositorio documental y forja (>180 soluciones catalogadas; nueva forja en eira.mancomun.gal).
- **Eidolocal** (https://www.eidolocal.gal): portal de las EELL a los servicios de la Xunta. **Convenio Xunta–FEGAMP vigente hasta 31/12/2028**. Catálogo (~43 servicios: https://www.eidolocal.gal/servizos): **pasaXe!** (interoperabilidad, >80 servicios: padrón, identidad, familia numerosa, discapacidad, AEAT, TGSS, Catastro; vía web services desde una aplicación consumidora; requiere adhesión, administrador, red corporativa y base normativa: https://www.eidolocal.gal/gl/ficha-servicio?id=129), AIRES-SIR, certificados Camerfirma gratuitos, Red SARA, Ciberseguridade, KOHA, transparencia. Acuerdos marco para EELL de nube pública, software libre de servidor, backup, ciberseguridad (105 concellos y 4 deputacións en 2025). **No figuran**: sede, pasarela de pagos, Chave365, hosting de aplicaciones.
- Cifras: >40 servicios gratuitos a concellos (mayo 2026); todos los concellos y deputacións en la Rede Corporativa; Notifica.gal admite a «calquera outra administración pública galega adherida».
- **Deputación da Coruña**: convenio de administración electrónica renovado en 2024; plataforma TEDeC / AL-SIGM; ENS certificado; OVT.
- **Deputación de Pontevedra**: acuerdo marco de administración electrónica 2020 (54 concellos, 4 mancomunidades, 6 EATIM) renovado en marzo 2024 por 3 años; padrón para 36 concellos.
- **Deputación de Ourense**: plataforma compartida SIGEM (catálogo 2024: https://www.depourense.gal/sites/default/files/2024-10/catalogo-de-servicios-diputacion-ourense.pdf).
- **Deputación de Lugo**: sede propia, nodo SIR; plataforma compartida desconocida.
- Gestiona (esPublico) en Galicia: desconocido.
- **¿Es realista un despliegue multi-concello alojado por una deputación? Sí**: A Coruña y Pontevedra ya operan plataformas multi-entidad para 50–90 concellos, el CCN diseña el ENS local con la diputación como hub, y la Xunta ofrece nube e infraestructura. Tres modelos: (1) multi-tenant operado por deputación/Xunta, (2) instancia propia de un concello grande, (3) SaaS con declaración ENS.

## 5. Datos abiertos y vocabularios
- Portales: https://datos.gob.es (DCAT-AP/NTI RISP) y https://abertos.xunta.gal (categoría «Deporte» con 2 datasets; «Rexistro de entidades deportivas»). Ejemplos: Vigo «Pabellones deportivos» (https://datos-ckan.vigo.org/dataset/deportes-i-pabellones), Euskadi «Censo de instalaciones deportivas» (tres entidades enlazadas: https://datos.gob.es/es/catalogo/a16003011-censo-de-instalaciones-deportivas-de-euskadi1), Vitoria-Gasteiz «Uso de las instalaciones deportivas».
- **CNID** (CSD, última edición 2005; https://www.educacionfpydeportes.gob.es/gl/mc/deportedata/instalaciones.html): jerarquía instalación → espacios deportivos → complementarios → auxiliares; tipologías. Sin esquema de datos publicado; el Manual de Interpretación 2005 sirve como taxonomía.
- schema.org: `SportsActivityLocation` (`PublicSwimmingPool`, `StadiumOrArena`, `TennisComplex`…), `OpeningHoursSpecification`, `Reservation`.
- **OpenActive** (ODI/Sport England): Modelling Opportunity Data, RPDE (https://www.w3.org/2017/08/realtime-paged-data-exchange/), **Open Booking API 1.0 CR3** (https://openactive.io/open-booking-api/EditorsDraft/1.0CR3/; `FacilityUse`/`Slot`, `OrderQuote`→`Order`).
- FIWARE/Smart Data Models: sin modelo específico; lo más próximo `PointOfInterest`.
- Qué decir: modelo alineado con CNID + schema.org; publicación automática de catálogo (CSV/GeoJSON/JSON-LD, DCAT), feed RPDE de disponibilidad y estadísticas anonimizadas; API OpenAPI.

## 6. Hosting y antecedentes
- Xunta: CPD Integral en la Cidade da Cultura; acuerdo marco de nube pública accesible a EELL (adjudicatario y ENS: desconocidos). Para SaaS privado: proveedor con certificación ENS ≥ categoría del sistema.
- **Ningún software libre municipal de reservas deportivas publicado** (CTT, Euskadi, Barcelona, Madrid, València). El mercado es comercial. Esto refuerza el criterio «activo público replicable» (15 %).

## Las 8 integraciones/estándares prioritarios para la memoria
1. Cl@ve (SAML 2.0 vía pasarela) con capa OIDC + Chave365 opcional + «EUDI-ready».
2. Cobro desacoplado: Redsys (tarjeta + Bizum) y autoliquidación contra la OVT de la deputación.
3. ENS básica «by design» + kit de Declaración de Conformidad (CCN-STIC 809) alineado con 883D.
4. Accesibilidad RD 1112/2018 / UNE-EN 301 549:2022 con declaración y mecanismo de comunicación de serie.
5. Licencia EUPL-1.2 (± AGPL) + publicación en eira.mancomun.gal y CTT/Joinup, citando Ley 40/2015 arts. 157–158.
6. pasaXe!/Plataforma de Intermediación para padrón, familia numerosa y discapacidad + ENI (justificantes con CSV).
7. Datos abiertos: CNID, schema.org, DCAT, OpenActive.
8. RGPD multi-tenant (responsable/encargado, minimización, menores) + Notifica.gal/DEHú para comunicaciones formales.

## Fuentes principales
agasol.gal/i-certame-gobtec · xunta.gal/chave365 · BOE-A-2015-14215 · rediris.es (pasarela Cl@ve UJI) · eidolocal.gal (convenio, servizos, pasaXe!, identidade dixital) · xunta.gal/pasaxe · xunta.gal/notifica · sede.dacoruna.gal (ENS, convenio 2024, guía Cl@ve EELL) · galaicos.depo.gal (acta XG 2024-03-08) · depourense.gal (catálogo 2024) · ens.ccn.cni.es/es/entidades-locales · BOE-A-2018-12699 · BOE-A-2015-10566 · administracionelectronica.gob.es (CTT, FIRe) · mancomun.gal / eira.mancomun.gal · pagosonline.redsys.es · BOCM 4/1/2024 · datos.gob.es · datos-ckan.vigo.org · educacionfpydeportes.gob.es (CNID) · openactive.io · eudi-wallet-tracker.igrant.io/tracker/spain/
