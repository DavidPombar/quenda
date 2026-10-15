# 04 · Estructura de la plantilla oficial de la memoria técnica

> Fuente: `plantilla_memoria_tecnica_gobtec_2026.odt`
> (https://www.agasol.gal/wp-content/uploads/2026/09/plantilla_memoria_tecnica_gobtec_2026.odt),
> descargada el 2026-10-15. Títulos literales en gallego; lo marcado como
> **[Interpretación]** es criterio propio.

## Instrucciones generales de la plantilla
- Cabecera: "MEMORIA TÉCNICA DA PROPOSTA — Plantilla oficial de presentación —
  I Certame GOBTEC de Software Libre — 2026 — Reto: Plataforma de xestión e reserva de
  instalacións deportivas municipais".
- Rellenar **todos** los apartados, con un **máximo de 10 páginas**.
- Sustituir el texto entre corchetes `[...]` por el contenido de la propuesta.
- **Eliminar las cajas de instrucciones (ℹ)** antes de exportar a PDF.
- Entrega en **PDF** mediante el **formulario habilitado en la web del certamen**
  (agasol.gal), antes de las **23:59 h del jueves 19 de noviembre de 2026**.
- La plantilla remite a las **Bases del concurso**: "punto 1.1" (bloques funcionales
  mínimos) y "punto 1.2" (condicionantes técnicos obligatorios).

> ⚠️ Discrepancia: la web dice que la memoria va "segundo a plantilla oficial", pero la
> plantilla dice que es "de uso recomendado". **[Interpretación]** Usarla siempre: facilita
> al jurado puntuar cada criterio.

## Apartados

| # | Apartado (literal) | Criterio / peso | Contenido pedido | Contexto relacionado |
|---|--------------------|-----------------|------------------|----------------------|
| 0 | Datos de identificación da entidade | — | Tabla: nombre/razón social, forma jurídica, concello/provincia (domicilio o centro de trabajo en Galicia), nombre de la propuesta, persona de contacto, teléfono, correo, web/portfolio (opcional) | [03](03-concurso-presentacion-valoracion.md) |
| 1 | Resumo executivo | — | **Máximo 150 palabras**: qué es, a quién va dirigida y qué problema resuelve | — |
| 2 | Comprensión do reto | **25 %** | Problema identificado y cómo lo aborda la propuesta; conocimiento de la problemática real de concellos y ciudadanía | [01](01-alcance-funcional.md) |
| 3 | Cobertura funcional | **35 %** | Cómo se cubre cada bloque funcional mínimo; se pueden añadir capturas, esquemas o diagramas de flujo | [01](01-alcance-funcional.md) |
| 3.1 | Funcionalidades para a cidadanía | | Consulta de instalaciones · Reserva online · Modificación y cancelación · Historial y avisos | C1–C4 |
| 3.2 | Funcionalidades para o concello | | Alta y mantenimiento de instalaciones · Gestión de horarios y normas de uso · Información y seguimiento mediante indicadores básicos | M1–M3 |
| 3.3 | Reutilización pública e multi-municipio | | Cómo puede reutilizarse por varios concellos | R1–R3 |
| 3.4 | Aspectos valorables adicionais (opcional) | | App móvil, calendarios personales, QR, analítica de uso, recomendación horaria, etc. | Opcionales |
| 4 | Arquitectura técnica e condicionantes obrigatorios | (cuenta en "Cobertura funcional") | Tabla con cinco filas (ver abajo) | [02](02-requisitos-tecnicos.md) |
| 5 | Viabilidade de implantación | **25 %** | Facilidad de adopción por un concello: **fases de implantación, recursos necesarios, plazo estimado de desarrollo y principales riesgos** | [03](03-concurso-presentacion-valoracion.md) |
| 6 | Potencial de reutilización | **15 %** | Activo público replicable: **escalabilidad, configurabilidad y aplicabilidad** a otros concellos o administraciones | R1–R3 |
| 7 | Equipo do proxecto | — | Perfiles profesionales y experiencia en proyectos similares o en software libre (acredita la "capacidade demostrable") | [03](03-concurso-presentacion-valoracion.md) |
| 8 | Anexos (opcional) | — | Enlaces a mockups, prototipo, demo en vídeo o repositorio público | — |

### Tabla del apartado 4 (condicionantes técnicos)
| Fila | Qué poner (según la plantilla) | Requisito |
|------|--------------------------------|-----------|
| Licenza de software libre | Licencia elegida (la plantilla da como ejemplos AGPL, MPL, EUPL...) | T1 |
| Arquitectura | Stack tecnológico; arquitectura web responsive y modular | T2 |
| Interoperabilidade | Estándares abiertos y **mecanismo de autenticación pública previsto** (p. ej. Cl@ve / Chave365) | T3 |
| Seguridade e RXPD | Medidas de seguridad y cumplimiento normativo previstos | T4 |
| Accesibilidade | Estándares de accesibilidad web aplicados | T5 |

## Implicaciones para el desarrollo **[Interpretación]**
- Lo que se construya tiene que poder **contarse y enseñarse** en los apartados 3.1–3.4
  y 4: guardar capturas y diagramas de cada funcionalidad a medida que se terminan.
- El apartado 5 pide **plazos, recursos y riesgos**: mantener un roadmap y un registro de
  riesgos en el repositorio.
- El apartado 8 valora un repositorio público y una demo: mantener `README`, instrucciones
  de despliegue y una demo pública con datos ficticios.
- El resumen ejecutivo es de 150 palabras como máximo: comprobarlo con un contador de palabras.
- Reparto orientativo de las 10 páginas según el peso de cada criterio:
  0–1 → 1 pág. · 2 → 1,5 · 3 → 3 · 4 → 1,5 · 5 → 1,5 · 6 → 0,75 · 7–8 → 0,75.
