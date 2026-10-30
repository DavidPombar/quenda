# Borrador · Folla de ruta da memoria técnica

> **Borrador para a memoria técnica (#28).** Non é a memoria: é o texto da folla de ruta
> para pegar no apartado **5. Viabilidade de implantación** da plantilla oficial («fases de
> implantación, recursos necesarios, prazo estimado e principais riscos»). Os aspectos
> valorables do apartado **3.4** remiten aquí.
> Escrito en galego porque a plantilla e a memoria o están. Os prazos son estimacións
> para un concello piloto e deben revisarse antes da entrega.

## Texto para a memoria (≈ media páxina)

**Folla de ruta.** O prototipo xa cubre o alcance mínimo (C1–C4, M1–M3, R1–R3) e os
condicionantes T1–T5 cun despregamento reproducible. O que queda organízase en tres fases,
pensadas para que un concello pequeno poida empezar a usalo sen esperar ás seguintes:

1. **Piloto (meses 0–3).**
   - Alta real en Cl@ve a través da deputación e conector Chave365 cando AMTEGA o habilite.
     O cliente OIDC e o broker Keycloak xa están no código.
   - Documentación de operación: alta de concello, copias de seguridade e actualizacións.
   - Paginación no servidor e límite de peticións compartido entre réplicas.
   - Revisión independente de accesibilidade e seguridade antes de tratar datos reais.
2. **Extensión (meses 3–6).**
   - Reparto de tempadas a clubs con reservas recorrentes.
   - Catálogo con fotos, mapa, filtros no servidor e deportes configurables.
   - Aplicación instalable (PWA) con avisos push e preferencias de notificación por canle.
3. **Ecosistema (meses 6–12).**
   - **OpenActive**: fluxo RPDE de dispoñibilidade (`FacilityUse` e `Slot`) a partir dos
     datos que Quenda xa garda (pistas, calendarios de apertura e unidades reservadas), e,
     despois, reserva a través da Open Booking API. É o único estándar aberto europeo de
     dispoñibilidade deportiva: máis de 4.000 provedores no Reino Unido publícano. Queda
     nesta fase porque hoxe ningún agregador español ou galego o consome.
   - Base para un rexistro galego de instalacións deportivas, co modelo de LIPAS.
   - Validación automática do catálogo contra as formas DCAT-AP.
   - Analítica de uso e recomendación horaria con datos agregados, sen datos persoais.
   - Pagamento a través dunha pasarela pública e regras por empadroamento.

**Recursos.** Unha persoa de desenvolvemento a tempo completo e apoio puntual de
sistemas da deputación ou do concello. O software é libre (AGPL-3.0) e sen licenzas de
terceiros. **Riscos principais:**
- os prazos de alta en Cl@ve e Chave365, mitigados co conector xa probado contra un IdP
  simulado;
- as diferenzas de normativa entre concellos, mitigadas porque as regras son configuración;
- a accesibilidade con tecnoloxías de apoio reais, mitigada coa revisión manual da fase 1;
- a adopción de OpenActive en España, mitigada porque é opcional e non bloquea nada.

## Orixe de cada punto

Para revisar o texto antes de levalo ao PDF. Cada punto ten referencia no repositorio:

| Punto da folla de ruta                                        | Fase | Referencia                                                                                  |
| ------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------- |
| Cl@ve real e Chave365                                          | 1    | #8; cliente OIDC, Keycloak e Cl@ve simulado en #36                                          |
| Documentación de operación                                    | 1    | #27                                                                                         |
| Paginación no servidor, límite de peticións distribuído       | 1    | README, «V0 boundaries» e «Demo vs production»                                              |
| Revisión independente de accesibilidade e seguridade          | 1    | README, «V0 boundaries»; T5 no apartado 4                                                   |
| Reparto de tempadas a clubs                                    | 2    | #17                                                                                         |
| Fotos, mapa, filtros no servidor, deportes configurables       | 2    | #26                                                                                         |
| PWA, Web Push e preferencias de notificación                   | 2    | #24, #35                                                                                    |
| OpenActive (RPDE e Open Booking API)                           | 3    | `docs/architecture/open-data.md` («Not covered yet»); decisión no #21                       |
| Rexistro galego de instalacións (modelo LIPAS)                 | 3    | Comentario de referencias do #21; `docs/investigacion/05-mercado-europeo.md`                |
| Validación contra as formas DCAT-AP                            | 3    | `docs/architecture/open-data.md` («Validation»)                                             |
| Analítica e recomendación horaria                              | 3    | #25                                                                                         |
| Pagamento e regras por empadroamento                           | 3    | README, «V0 boundaries»                                                                     |

**Antes de levalo ao PDF:**
- Comprobar que ningún punto se pechou entre tanto: por exemplo, os issues #14, #17, #26 e
  #35 seguen abertos a 29/10/2026.
- Axustar os prazos ao calendario do piloto que se propoña.
- Non repetir no apartado 6 o que xa diga o 3.3.
