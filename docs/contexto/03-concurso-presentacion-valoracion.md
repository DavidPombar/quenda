# 03 · Requisitos del concurso, presentación y valoración

> **Fuente: bases oficiales.** `Bases_I_Certame_GOBTEC_2026.pdf`
> (https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026.pdf),
> descargadas y leídas el 2026-10-16 (5 páginas, puntos 0–11). Fuente secundaria:
> https://www.agasol.gal/i-certame-gobtec/ (consultada el 2026-10-15 y el 2026-10-16).
> Literales de las bases entre comillas (en gallego). **[Interpretación]** = criterio
> propio. **[Cambio vs. web]** = difiere de lo que decía la web antes de las bases.
>
> Las bases prevalecen sobre la web: a 2026-10-16 la web **todavía muestra los pesos
> antiguos (35 %/15 %)** y el formulario de entrega aún no está habilitado.

## Datos generales
- **Certamen:** I Certame GOBTEC de Software Libre — 2026. "Concurso de ideas innovadoras
  baseadas en software libre" (punto 0).
- **Organiza:** AGASOL (Asociación de Empresas Galegas de Software Libre), en el marco de
  su colaboración con el ecosistema GOBTEC, "coa colaboración da Xunta de Galicia e de
  Startup Galicia para a difusión e busca de empresas candidatas". La web añade que está
  financiado por la Xunta de Galicia.
- **Premio (punto 7):** 6.000 € y reconocimiento institucional público, entregados en el
  evento de clausura. **El abono queda condicionado** a que la entidad premiada publique
  el código fuente y la documentación de despliegue en un repositorio público en un
  máximo de **60 días naturales desde el fallo** (punto 8). **[Cambio vs. web]** nuevo.
- **Importante (puntos 0 y 7):** participar o ganar **no implica contratación, encargo ni
  financiación** del desarrollo.
- **Contacto:** certame@agasol.gal (de la web; las bases no indican correo).
- **Aceptación (punto 11):** participar implica aceptar íntegramente las bases; AGASOL
  resuelve las incidencias no previstas y puede **modificar el calendario** por causas
  justificadas, avisando en la página del certamen.
- **Protección de datos (punto 10):** AGASOL trata los datos de contacto solo para
  gestionar el certamen, conforme al RGPD.

## Quién puede participar (punto 2)
- "Empresas, persoas emprendedoras e entidades tecnolóxicas con **domicilio social ou
  centro de traballo en Galicia**".
- Con "**capacidade demostrable** para desenvolver solucións de software libre"
  (conviene acreditarlo en la memoria: proyectos previos, repositorios, equipo).
- **Excluidas** las propuestas de "persoas físicas a título particular sen actividade
  económica nin proxecto empresarial constituído ou en constitución". **[Cambio vs. web]**
  la exclusión explícita es nueva.
- **Una única propuesta por entidad participante.**

## Propiedad intelectual y licencia (punto 8)
- Las propuestas deben acogerse a una **licencia de software libre reconocida por la OSI
  o la FSF**.
- **Recomendadas expresamente: AGPL-3.0 o EUPL 1.2** (garantizan que las mejoras sigan
  disponibles también cuando la plataforma se ofrece como servicio alojado; la EUPL 1.2
  es la licencia de referencia de la Comisión Europea y tiene texto oficial en castellano).
- Otra licencia OSI/FSF no excluye, pero "terase en conta na valoración do criterio
  «Reutilización e soberanía tecnolóxica»".
- **Titularidad:** los derechos de propiedad intelectual **corresponden a la entidad
  participante**; participar "non supón cesión de dereitos a AGASOL nin ás administracións
  colaboradoras", sin perjuicio del uso posterior que permita la licencia libre elegida.
- El participante **garantiza** ser titular de todos los derechos (o tener autorización
  suficiente), "con independencia das ferramentas empregadas no desenvolvemento, incluídas
  as ferramentas de intelixencia artificial xerativa".
- **Obligación de la entidad premiada:** publicar código fuente + documentación de
  despliegue en repositorio público en **60 días naturales** desde el fallo; el pago del
  premio depende de ello.
- Detalle técnico y decisiones en [02](02-requisitos-tecnicos.md) (T1).

## Documentación a presentar (punto 3 "Formato da proposta")
| Documento | Obligatorio | Formato |
|-----------|-------------|---------|
| Memoria técnica "conforme á plantilla oficial de presentación publicada xunto a estas bases" | Sí | **PDF, máximo 10 páginas** |
| Datos de contacto de la entidad (persona de contacto, teléfono, correo electrónico) | Sí | En el formulario |
| Mockup, prototipo o demo funcional | Opcional | Libre (enlace a demo o repositorio recomendado) |

- Sobre la plantilla, las bases dicen: "Recoméndase encarecidamente o uso da plantilla
  oficial para facilitar unha avaliación obxectiva e comparable de todas as propostas por
  parte do xurado." Es decir, **recomendada con mucha insistencia, no estrictamente
  obligatoria**; la usamos siempre.
- Plantilla oficial: https://www.agasol.gal/wp-content/uploads/2026/09/plantilla_memoria_tecnica_gobtec_2026.odt

## Plazo y canal de entrega (punto 4)
- **Plazo límite:** "ata as 23:59h do xoves **19 de novembro de 2026**".
- **Canal único:** "formulario habilitado na páxina do certame, aloxada en agasol.gal".
- "**Non se admitirán** propostas presentadas fóra de prazo **nin por canles distintas ao
  formulario oficial**." **[Cambio vs. web]** El envío por correo a certame@agasol.gal
  (que es a donde apuntaba el botón de la web) **no vale como entrega**.
- **Formulario de entrega:** las bases no dan URL. A 2026-10-16 la web dice que "o
  formulario de presentación de propostas [...] estará dispoñible nesta mesma páxina" y
  aún no está publicado. **Comprobar https://www.agasol.gal/i-certame-gobtec/ con
  antelación al 19-11-2026** y anotar aquí la URL del formulario cuando exista.

### Reglas para la memoria técnica
1. Seguir la estructura de la plantilla oficial sin saltarse apartados (detalle en
   [04-plantilla-memoria-tecnica.md](04-plantilla-memoria-tecnica.md)).
2. No pasar de **10 páginas** en el PDF final (comprobarlo antes de enviar).
3. Ordenar el contenido para que el jurado puntúe fácil cada criterio (ver tabla de abajo);
   **[Interpretación]** incluir una matriz de trazabilidad que relacione requisitos
   (C1–C4, M1–M3, R1–R3, T1–T5) con la solución.
4. Si hay demo, enlazarla en la memoria con acceso sin fricción (URL pública + usuario de prueba).
5. Indicar expresamente la licencia (AGPL-3.0 o EUPL 1.2) y la titularidad, y dejar claro
   cómo se cumple cada subcriterio de "Reutilización e soberanía tecnolóxica".

## Criterios de valoración (punto 5)

| # | Criterio (literal) | Peso | Qué mira (literal de las bases) | Cómo lo atacamos **[Interpretación]** |
|---|--------------------|------|----------------------------------|----------------------------------------|
| 1 | Comprensión do reto | **25 %** | "Grao de axuste ao problema formulado." | Describir el problema de los concellos pequeños (teléfono, correo, poca visibilidad, cancelaciones poco ágiles) y cómo lo resolvemos en concreto |
| 2 | Cobertura funcional | **30 %** | "Resposta ás necesidades de cidadanía, concello e condicionantes técnicos." | Cubrir al 100 % C1–C4, M1–M3, R1–R3 y T1–T5; opcionales como extra |
| 3 | Viabilidade de implantación | **25 %** | "Facilidade de adopción real por parte das administracións locais." | Instalación sencilla, despliegue documentado, bajo coste de mantenimiento, plan de puesta en marcha, formación, soporte |
| 4 | Reutilización e soberanía tecnolóxica | **20 %** | "Capacidade da solución de converterse nun activo público replicable" con estos subcriterios: (a) "grao de apertura real do código", (b) "independencia de provedor", (c) "uso de estándares e formatos abertos", (d) "portabilidade íntegra dos datos"; (e) si hay IA, "modelo de pesos abertos e autoaloxable, ou substituíble sen redeseñar a plataforma", sin remitir datos personales a terceros sin base jurídica; "a ausencia de compoñentes de IA non penaliza". Además cuenta la licencia elegida (punto 8). | Licencia AGPL-3.0/EUPL 1.2, repositorio público, autohospedable sin cloud concreto, OpenAPI/ICS/CSV/OIDC, exportación íntegra por municipio, multi-municipio, gobernanza/comunidad |

**[Cambio vs. web]** La web ponderaba Cobertura 35 % y "Potencial de reutilización" 15 %
sin subcriterios. Las bases pasan a **30 % y 20 %**, renombran el criterio 4 y le añaden
los subcriterios anteriores. Comprensión y Viabilidad siguen en 25 %.

**Regla de priorización:** el orden de esfuerzo es Cobertura (30) > Comprensión (25) =
Viabilidad (25) > Reutilización y soberanía (20). La diferencia entre criterios es ahora
pequeña: la reutilización/soberanía ya no es un "extra" sino un quinto del total.
Ninguna decisión de desarrollo debe perjudicar la viabilidad de implantación en un
concello pequeño.

## Jurado (punto 6)
- Mínimo **cinco personas**, incluyendo: representante de AGASOL; de la Xunta de
  Galicia/GOBTEC; de **un concello, "preferiblemente un interesado en pilotar a
  solución"**; persona experta independiente en software libre; representante del sector
  empresarial TIC gallego / Startup Galicia.
- La composición definitiva la designa AGASOL y se publicará **antes del cierre del plazo**.
- **"O fallo do xurado será inapelable."**
- **[Interpretación]** Que haya un concello con intención de pilotar refuerza el peso real
  de la viabilidad de implantación: la memoria debe leerse como un plan de piloto.

## Calendario (punto 9)
| Fecha | Hito |
|-------|------|
| Semana del 5 al 9 oct 2026 | Publicación de bases, landing en agasol.gal y apertura de la convocatoria |
| Oct – 19 nov 2026 | Campaña de difusión activa (AGASOL y Startup Galicia) |
| **Jue 19 nov 2026, 23:59 h** | **Cierre de presentación de propuestas** |
| 20–27 nov 2026 | Evaluación del jurado y preselección de 5–6 finalistas |
| Vie 27 nov 2026 | Comunicación a finalistas y preparación de pitches |
| Semana del 30 nov al 2 dic | Confirmación logística final con la Cidade da Cultura |
| **Jue 3 dic 2026** | Evento: pitches de finalistas, fallo del jurado y entrega del reconocimiento |

AGASOL puede modificar este calendario por causas justificadas (punto 11).

## Fase final (pitch)
- El jurado preselecciona **entre 5 y 6 propuestas finalistas**, "que serán convidadas a
  presentar a súa solución (pitch) o día do evento" (3 de diciembre, Cidade da Cultura).
- Las bases **no fijan duración ni formato del pitch**; la preparación va del 27 nov al
  3 dic. Confirmar el formato con la organización al ser notificados.
- **[Interpretación]** Preparar entre el 27 nov y el 3 dic: demo en vivo estable, guion
  que siga los 4 criterios y su peso (incluyendo los subcriterios de soberanía), y plan B
  (vídeo grabado) por si falla la demo.
