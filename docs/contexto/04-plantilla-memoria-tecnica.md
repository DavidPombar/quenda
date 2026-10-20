# 04 · Estructura de la plantilla oficial de la memoria técnica

> **Fuente principal: plantilla oficial, versión 3.** `plantilla_memoria_tecnica_gobtec_2026.odt`
> (https://www.agasol.gal/wp-content/uploads/2026/10/plantilla_memoria_tecnica_gobtec_2026.odt),
> «Versión 3 — 20 de outubro de 2026. Adaptada á versión 3 das bases (novo calendario)»,
> descargada el 2026-10-20. La versión de septiembre (carpeta `2026/09`) ya no está
> publicada. Títulos literales en gallego; lo marcado como **[Interpretación]** es
> criterio propio.
>
> **Fuente: bases oficiales, versión 3.** `Bases_I_Certame_GOBTEC_2026_GL_v3.pdf`
> (https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026_GL_v3.pdf),
> leídas el 2026-10-20: puntos 3 (formato), 4 (plazo y forma de presentación) y 5
> (criterios). La plantilla v3 ya muestra los pesos de las bases (25/30/25/20).
> **[Cambio vs. web]** marca diferencias con la web anterior a las bases y **[Cambio v3]**
> los cambios de la versión 3 de la plantilla.

## Instrucciones generales de la plantilla
- Cabecera: "MEMORIA TÉCNICA DA PROPOSTA — Plantilla oficial de presentación —
  I Certame GOBTEC de Software Libre — 2026 — Reto: Plataforma de xestión e reserva de
  instalacións deportivas municipais".
- Rellenar **todos** los apartados, con un **máximo de 10 páginas** (las bases, punto 3,
  confirman: "máximo 10 páxinas, formato PDF").
- Sustituir el texto entre corchetes `[...]` por el contenido de la propuesta.
- **Eliminar las cajas de instrucciones (ℹ)** antes de exportar a PDF.
- **[Cambio v3]** Entrega en **PDF de 15 MB como máximo** por **correo a
  certame@agasol.gal** con el asunto **«Proposta — I Certame GOBTEC»**, antes de las
  **23:59 h del miércoles 18 de noviembre de 2026**; si el PDF supera 15 MB, enlace de
  descarga en el cuerpo del mensaje. AGASOL confirma la recepción en dos días hábiles.
  Antes era un formulario web hasta el jueves 19 (ver [03](03-concurso-presentacion-valoracion.md)).
- La plantilla remite a las **Bases del concurso**: "punto 1.1" (bloques funcionales
  mínimos) y "punto 1.2" (condicionantes técnicos obligatorios). Ambos puntos están
  transcritos en [01](01-alcance-funcional.md) y [02](02-requisitos-tecnicos.md).

> Uso de la plantilla: la web decía que la memoria va "segundo a plantilla oficial" y la
> plantilla se declaraba "de uso recomendado". Las bases lo zanjan (punto 3): la memoria
> describe la solución "conforme á plantilla oficial" y "recoméndase encarecidamente o uso
> da plantilla oficial para facilitar unha avaliación obxectiva e comparable".
> **Decisión:** usarla siempre y sin alterar su estructura.

## Apartados

| # | Apartado (literal) | Criterio / peso (bases) | Contenido pedido | Contexto relacionado |
|---|--------------------|-------------------------|------------------|----------------------|
| 0 | Datos de identificación da entidade | — | Tabla: nombre/razón social, forma jurídica, concello/provincia (domicilio o centro de trabajo en Galicia), nombre de la propuesta, persona de contacto, teléfono, correo, web/portfolio (opcional). Los datos de contacto son obligatorios según el punto 3 de las bases. **[Cambio v3]** La forma jurídica admite ahora «asociación» y «proxecto empresarial en constitución», y se añade una nota de protección de datos: AGASOL comunicará estos datos a las personas del jurado | [03](03-concurso-presentacion-valoracion.md) |
| 1 | Resumo executivo | — | **Máximo 150 palabras**: qué es, a quién va dirigida y qué problema resuelve | — |
| 2 | Comprensión do reto | **25 %** | Problema identificado y cómo lo aborda la propuesta; conocimiento de la problemática real de concellos y ciudadanía | [01](01-alcance-funcional.md) |
| 3 | Cobertura funcional | **30 %** **[Cambio vs. web]** (antes 35 %) | Cómo se cubre cada bloque funcional mínimo; se pueden añadir capturas, esquemas o diagramas de flujo | [01](01-alcance-funcional.md) |
| 3.1 | Funcionalidades para a cidadanía | | Consulta de instalaciones · Reserva online · Modificación y cancelación · Historial y avisos | C1–C4 |
| 3.2 | Funcionalidades para o concello | | Alta y mantenimiento de instalaciones · Gestión de horarios y normas de uso · Información y seguimiento mediante indicadores básicos | M1–M3 |
| 3.3 | Reutilización pública e multi-municipio | | **[Cambio v3]** Solo los aspectos funcionales: configuración por municipio, gestión multi-municipio y adaptación a concellos de distinto tamaño. Las condiciones que lo hacen posible (apertura del código, independencia de proveedor, estándares abiertos, portabilidad) «van no punto 6» | R1–R3 |
| 3.4 | Aspectos valorables adicionais (opcional) | | App móvil, calendarios personales, QR, analítica de uso, recomendación horaria, etc. Si hay IA, indicar modelo (pesos abiertos/autoalojable/sustituible) y tratamiento de datos | Opcionales |
| 4 | Arquitectura técnica e condicionantes obrigatorios | **[Cambio v3]** La plantilla lo dice ahora explícitamente: «Avalíase dentro do criterio "Cobertura funcional" (punto 3)» | Tabla con cinco filas (ver abajo) | [02](02-requisitos-tecnicos.md) |
| 5 | Viabilidade de implantación | **25 %** | Facilidad de adopción por un concello: **fases de implantación, recursos necesarios, plazo estimado de desarrollo y principales riesgos** | [03](03-concurso-presentacion-valoracion.md) |
| 6 | Reutilización e soberanía tecnolóxica | **20 %** **[Cambio v3]** La plantilla adopta el nombre del criterio de las bases (antes «Potencial de reutilización») | «Non repetir o descrito no punto 3.3.» Activo público replicable: escalabilidad, configurabilidad y aplicabilidad a otros concellos; **además**, apertura real del código, independencia de proveedor, estándares y formatos abiertos, portabilidad íntegra de los datos y, si hay IA, modelo de pesos abiertos o sustituible sin enviar datos personales a terceros. La ausencia de IA no penaliza | R1–R3, T1, T3 |
| 7 | Equipo do proxecto | — **[Cambio v3]** «Non puntúa como criterio independente: acredita a capacidade esixida no punto 2 das bases e sustenta a viabilidade do punto 5» | Perfiles profesionales y experiencia en proyectos similares o en software libre | [03](03-concurso-presentacion-valoracion.md) |
| 8 | Anexos (opcional) | — | Enlaces a mockups, prototipo, demo en vídeo o repositorio público (el punto 3 de las bases admite "mockup, prototipo ou demo funcional" como opcional) | — |
| 9 | Declaracións | — **[Cambio v3]** Apartado nuevo | Tres casillas: (1) solo para proyectos empresariales en constitución, compromiso de constituir la empresa o darse de alta como autónomo y acreditarlo antes del pago si se gana; (2) titularidad de los derechos de propiedad intelectual, también sobre lo generado con IA; (3) compromiso de publicar el código y la documentación de despliegue en 60 días si se gana | [02](02-requisitos-tecnicos.md) (T1) |

### Tabla del apartado 4 (condicionantes técnicos)
| Fila | Qué poner (según la plantilla) | Qué exigen las bases (1.2 y 8) | Requisito |
|------|--------------------------------|--------------------------------|-----------|
| Licenza de software libre | **[Cambio v3]** Licencia elegida; la plantilla recuerda que las bases recomiendan AGPL-3.0 o EUPL 1.2 y que otra licencia libre cuenta en el criterio del punto 6 | Licencia OSI/FSF; **recomendadas AGPL-3.0 o EUPL 1.2**; otra licencia resta en el criterio 4. Indicar también la titularidad (entidad participante) | T1 |
| Arquitectura | Stack tecnológico; arquitectura web responsive y modular | "solución web, responsive e modular" | T2 |
| Interoperabilidade | Estándares abiertos de interoperabilidad y **mecanismo de autenticación pública previsto** (p. ej. Cl@ve / Chave365) | "autenticación pública e estándares abertos" | T3 |
| Seguridade e RXPD | Medidas de seguridad y cumplimiento normativo previstos | "RXPD e xestión segura de usuarios" | T4 |
| Accesibilidade | **[Cambio v3]** «Compromiso de conformidade co nivel AA da norma WCAG 2.1 [...]: medidas previstas e grao de cumprimento» | **"conformidade co nivel AA da norma WCAG 2.1, consonte ao RD 1112/2018 e á norma EN 301549"** | T5 |

## Implicaciones para el desarrollo **[Interpretación]**
- Lo que se construya tiene que poder **contarse y enseñarse** en los apartados 3.1–3.4
  y 4: guardar capturas y diagramas de cada funcionalidad a medida que se terminan.
- El apartado 5 pide **plazos, recursos y riesgos**: mantener un roadmap y un registro de
  riesgos en el repositorio.
- El apartado 6 vale ahora un 20 % y tiene subcriterios concretos: documentar en el
  repositorio la exportación íntegra de datos, el despliegue autohospedado y la ausencia
  de dependencias de proveedor, para poder citarlo.
- El apartado 8 valora un repositorio público y una demo: mantener `README`, instrucciones
  de despliegue y una demo pública con datos ficticios. Si la propuesta gana, publicar
  código + documentación de despliegue en 60 días es obligatorio (bases, punto 8), así
  que el repositorio debe estar listo para abrirse en cualquier momento.
- El resumen ejecutivo es de 150 palabras como máximo: comprobarlo con un contador de palabras.
- **[Cambio v3]** El apartado 6 pide **no repetir el 3.3**: la reutilización funcional
  (configuración y multi-municipio) va en 3.3 y las condiciones de soberanía en 6.
- **[Cambio v3]** La fila de accesibilidad pide declarar el **grado de cumplimiento**:
  la declaración de accesibilidad (#9) y los informes axe de la CI son la evidencia.
- **[Cambio v3]** Marcar las casillas 2 y 3 del apartado 9; la 1 solo si la entidad está
  en constitución. La casilla 3 es coherente con la AGPL-3.0 y el repositorio público.
- Reparto orientativo de las 10 páginas según el peso de cada criterio (bases):
  0–1 → 1 pág. · 2 → 1,5 · 3 → 2,5 · 4 → 1,5 · 5 → 1,5 · 6 → 1,25 · 7–9 → 0,75.
