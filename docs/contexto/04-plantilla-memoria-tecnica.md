# 04 · Estructura de la plantilla oficial de la memoria técnica

> Fuente principal: `plantilla_memoria_tecnica_gobtec_2026.odt`
> (https://www.agasol.gal/wp-content/uploads/2026/09/plantilla_memoria_tecnica_gobtec_2026.odt),
> descargada el 2026-10-15. Títulos literales en gallego; lo marcado como
> **[Interpretación]** es criterio propio.
>
> **Fuente: bases oficiales.** `Bases_I_Certame_GOBTEC_2026.pdf`
> (https://www.agasol.gal/wp-content/uploads/2026/10/Bases_I_Certame_GOBTEC_2026.pdf),
> leídas el 2026-10-16: puntos 3 (formato de la propuesta), 4 (plazo y canal) y 5
> (criterios). Los pesos de este fichero están **actualizados a las bases**; la plantilla
> .odt se publicó antes y puede mostrar los pesos antiguos (35 %/15 %) en sus cajas de
> instrucciones: **prevalecen las bases**. **[Cambio vs. web]** marca las diferencias.

## Instrucciones generales de la plantilla
- Cabecera: "MEMORIA TÉCNICA DA PROPOSTA — Plantilla oficial de presentación —
  I Certame GOBTEC de Software Libre — 2026 — Reto: Plataforma de xestión e reserva de
  instalacións deportivas municipais".
- Rellenar **todos** los apartados, con un **máximo de 10 páginas** (las bases, punto 3,
  confirman: "máximo 10 páxinas, formato PDF").
- Sustituir el texto entre corchetes `[...]` por el contenido de la propuesta.
- **Eliminar las cajas de instrucciones (ℹ)** antes de exportar a PDF.
- Entrega en **PDF** mediante el **formulario habilitado en la web del certamen**
  (agasol.gal), antes de las **23:59 h del jueves 19 de noviembre de 2026**. Las bases
  (punto 4) añaden que **no se admite ningún otro canal** (ver [03](03-concurso-presentacion-valoracion.md)).
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
| 0 | Datos de identificación da entidade | — | Tabla: nombre/razón social, forma jurídica, concello/provincia (domicilio o centro de trabajo en Galicia), nombre de la propuesta, persona de contacto, teléfono, correo, web/portfolio (opcional). Los datos de contacto son obligatorios según el punto 3 de las bases | [03](03-concurso-presentacion-valoracion.md) |
| 1 | Resumo executivo | — | **Máximo 150 palabras**: qué es, a quién va dirigida y qué problema resuelve | — |
| 2 | Comprensión do reto | **25 %** | Problema identificado y cómo lo aborda la propuesta; conocimiento de la problemática real de concellos y ciudadanía | [01](01-alcance-funcional.md) |
| 3 | Cobertura funcional | **30 %** **[Cambio vs. web]** (antes 35 %) | Cómo se cubre cada bloque funcional mínimo; se pueden añadir capturas, esquemas o diagramas de flujo | [01](01-alcance-funcional.md) |
| 3.1 | Funcionalidades para a cidadanía | | Consulta de instalaciones · Reserva online · Modificación y cancelación · Historial y avisos | C1–C4 |
| 3.2 | Funcionalidades para o concello | | Alta y mantenimiento de instalaciones · Gestión de horarios y normas de uso · Información y seguimiento mediante indicadores básicos | M1–M3 |
| 3.3 | Reutilización pública e multi-municipio | | Cómo puede reutilizarse por varios concellos | R1–R3 |
| 3.4 | Aspectos valorables adicionais (opcional) | | App móvil, calendarios personales, QR, analítica de uso, recomendación horaria, etc. Si hay IA, indicar modelo (pesos abiertos/autoalojable/sustituible) y tratamiento de datos | Opcionales |
| 4 | Arquitectura técnica e condicionantes obrigatorios | (cuenta en "Cobertura funcional": "condicionantes técnicos") | Tabla con cinco filas (ver abajo) | [02](02-requisitos-tecnicos.md) |
| 5 | Viabilidade de implantación | **25 %** | Facilidad de adopción por un concello: **fases de implantación, recursos necesarios, plazo estimado de desarrollo y principales riesgos** | [03](03-concurso-presentacion-valoracion.md) |
| 6 | Potencial de reutilización | **20 %** **[Cambio vs. web]** (antes 15 %; en las bases el criterio se llama "Reutilización e soberanía tecnolóxica") | Activo público replicable: **escalabilidad, configurabilidad y aplicabilidad** a otros concellos o administraciones. **Añadir** los subcriterios de las bases: apertura real del código (repositorio público), independencia de proveedor, estándares y formatos abiertos, portabilidad íntegra de los datos, y condiciones de la IA si la hay; justificar la licencia (AGPL-3.0/EUPL 1.2) | R1–R3, T1, T3 |
| 7 | Equipo do proxecto | — | Perfiles profesionales y experiencia en proyectos similares o en software libre (acredita la "capacidade demostrable" del punto 2 de las bases) | [03](03-concurso-presentacion-valoracion.md) |
| 8 | Anexos (opcional) | — | Enlaces a mockups, prototipo, demo en vídeo o repositorio público (el punto 3 de las bases admite "mockup, prototipo ou demo funcional" como opcional) | — |

### Tabla del apartado 4 (condicionantes técnicos)
| Fila | Qué poner (según la plantilla) | Qué exigen las bases (1.2 y 8) | Requisito |
|------|--------------------------------|--------------------------------|-----------|
| Licenza de software libre | Licencia elegida (la plantilla da como ejemplos AGPL, MPL, EUPL...) | Licencia OSI/FSF; **recomendadas AGPL-3.0 o EUPL 1.2**; otra licencia resta en el criterio 4. Indicar también la titularidad (entidad participante) | T1 |
| Arquitectura | Stack tecnológico; arquitectura web responsive y modular | "solución web, responsive e modular" | T2 |
| Interoperabilidade | Estándares abiertos y **mecanismo de autenticación pública previsto** (p. ej. Cl@ve / Chave365) | "autenticación pública e estándares abertos" | T3 |
| Seguridade e RXPD | Medidas de seguridad y cumplimiento normativo previstos | "RXPD e xestión segura de usuarios" | T4 |
| Accesibilidade | Estándares de accesibilidad web aplicados | **"conformidade co nivel AA da norma WCAG 2.1, consonte ao RD 1112/2018 e á norma EN 301549"** | T5 |

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
- Reparto orientativo de las 10 páginas según el peso de cada criterio (bases):
  0–1 → 1 pág. · 2 → 1,5 · 3 → 2,5 · 4 → 1,5 · 5 → 1,5 · 6 → 1,25 · 7–8 → 0,75.
