# Quenda

> 🇬🇧 **English version available below:** [read this README in English](#english-version).

**Reserva en liña de instalacións deportivas municipais para concellos pequenos.** A veciñanza
atopa unha pista ou unha piscina, ve a dispoñibilidade real e reserva, cambia ou cancela en poucos
toques; o concello xestiona as súas instalacións, horarios, normas e indicadores; e unha deputación
pode ofrecer unha soa instalación a moitos concellos. Software libre (AGPL-3.0-or-later),
autoaloxable, en galego por defecto e tamén en castelán.

Quenda é a proposta para o I Certame GOBTEC de Software Libre (AGASOL, 2026). Os seus requisitos
rastréxanse en todo o código e na documentación cos identificadores do certame: cidadanía
**C1–C4**, concello **M1–M3**, reutilización pública **R1–R3** e condicionantes técnicos
obrigatorios **T1–T5** ([alcance](docs/contexto/01-alcance-funcional.md), [requisitos técnicos](docs/contexto/02-requisitos-tecnicos.md)).

- **Demo pública:** https://91-99-68-27.sslip.io/ (datos ficticios; **Entrar** abre contas de demostración)
- **Tecnoloxía:** React 19, Chakra UI 3 e Vite · NestJS e Node 24 · PostgreSQL 17 · Docker Compose

## Contido

1. [Que fai](#que-fai)
2. [Probalo no teu ordenador](#probalo-no-teu-ordenador)
3. [Instalalo nun servidor](#instalalo-nun-servidor)
4. [Como está feito](#como-está-feito)
5. [Desenvolver e probar](#desenvolver-e-probar)
6. [Desenvolver con axentes de IA](#desenvolver-con-axentes-de-ia)
7. [Límites desta versión](#límites-desta-versión)
8. [Documentación](#documentación)
9. [Contribuír e licenza](#contribuír-e-licenza)

## Que fai

### Para a veciñanza (app cidadá, `/app/`)

- **Atopar unha instalación (C1):** un catálogo común a todos os concellos da instalación, con
  buscador, filtros por deporte, acceso sen barreiras, fotos, mapa, normas, prezos por categoría e o
  horario da semana.
- **Reservar en liña (C2):** dispoñibilidade real por día e pista, incluídas as pistas divididas en
  partes que se bloquean entre si; o servidor impide os solapamentos e aplica os límites por
  persoa e os prazos de reserva. Cando un día está cheo, Quenda suxire tres quendas libres a partir
  do histórico agregado (sen IA).
- **Cambiar e cancelar (C3)** dentro do prazo que fixe o concello.
- **Historial e avisos (C4):** próximas reservas e historial, avisos na app, correo electrónico e
  Web Push para confirmacións, cambios, cancelacións e lembretes.
- **Calendarios persoais:** cada reserva en `.ics`, ou unha subscrición `webcal://` revogable.
- **Pase QR** para a entrada, tamén sen conexión.
- **App instalable (PWA)** co nome, a cor e a icona de cada concello.
- **Privacidade:** aviso de privacidade versionado por concello, descarga dos datos e baixa da conta.

### Para o concello (xestión municipal, `/admin/`)

- **Instalacións (M1):** alta e edición de instalacións e das súas pistas ou rúas, fotos con texto
  alternativo, estados activa, en mantemento e pechada, e peches cun motivo (as reservas afectadas
  cancélanse e avísase a quen as fixo).
- **Horarios e normas (M2):** horarios de apertura en iCalendar (RFC 5545) con excepcións e
  importación de `.ics`, festivos locais, duración das quendas, prazo de reserva, prazo de
  cancelación, límites por persoa, prezos por categoría de usuario, penalizacións por non
  presentarse e reparto de tempadas entre clubs.
- **Indicadores (M3):** reservas, cancelacións, ocupación por instalación, pista, día da semana e
  hora, asistencia e non presentacións, e analítica web opcional sen cookies no Umami da propia
  instalación.
- **Reservas do día** con cancelación municipal, a **páxina da porta** para o persoal de control de
  accesos (lectura do QR ou lista con buscador, funciona sen conexión), **contas do persoal**, o
  **rexistro de auditoría**, os axustes de imaxe, idioma, textos legais e **declaración de
  accesibilidade**, e a **exportación dos datos**.

### Para a deputación ou entidade operadora (`/admin/operador`)

- Unha soa instalación dá servizo a moitos concellos, cos datos estritamente illados entre eles (R3).
- A entidade operadora dá de alta os concellos e as súas persoas xestoras e consulta indicadores
  agregados.

### Estándares e condicionantes (T1–T5)

| ID | Requisito | Como o cumpre Quenda |
|---|---|---|
| T1 | Software libre | AGPL-3.0-or-later; `npm run licenses` comproba cada dependencia contra unha lista de licenzas permitidas |
| T2 | Web aberta, responsive e modular | Tres frontends independentes e unha API REST modular (OpenAPI 3); funciona desde 320 px ata o escritorio |
| T3 | Autenticación pública e estándares abertos | OpenID Connect para Cl@ve/Chave365 (Keycloak como provedor de referencia), entrada cun código por correo, contas locais do persoal con TOTP; iCalendar, OpenAPI, CSV/JSON, JSON-LD de schema.org, GeoJSON, datos abertos DCAT-AP-ES, exportación e importación completas dos datos de cada concello |
| T4 | RXPD e xestión segura de usuarios | Minimización de datos, consentimento e avisos versionados, tarefa de conservación, rexistro de auditoría, datos persoais cifrados, contrasinais con scrypt e TOTP, límites de peticións, CSP e cabeceiras de seguridade |
| T5 | WCAG 2.1 AA (RD 1112/2018, EN 301 549) | Matriz de autoavaliación dos 50 criterios en [accessibility.md](docs/architecture/accessibility.md), 50 escaneos con axe en cada cambio e declaración de accesibilidade por concello. Non se declara ningunha certificación |

## Probalo no teu ordenador

Precisa Node 24, npm e Docker con Compose.

```bash
npm ci
```

```bash
npm run setup
```

```bash
npm run dev
```

`npm run setup` arranca PostgreSQL e Mailpit en Docker, aplica as migracións e carga dous concellos
ficticios, **Portomar** e **Vilaverde**. Pódese repetir sen sobrescribir os datos. `npm run dev`
arranca a API, o worker de avisos e os tres frontends coa entrada de demostración activada.

| Que | Onde |
|---|---|
| Web pública | http://127.0.0.1:5173 |
| App cidadá | http://127.0.0.1:5173/app/ |
| Xestión municipal | http://127.0.0.1:5173/admin/ |
| Área da entidade operadora | http://127.0.0.1:5173/admin/operador |
| Correo que envía a demo (Mailpit) | http://127.0.0.1:8025 |
| Documentación da API (Swagger, OpenAPI) | http://127.0.0.1:3001/api/docs, `/api/openapi.json` |

**Contas de demostración:** **Entrar** ofrece *Entrar como cidadanía* na app e *Entrar como
xestor/a* ou *Entrar como control de accesos* na xestión municipal. Ao cambiar de concello péchase a
sesión. Nada na demo fai unha reserva real nin cobra diñeiro.

**Servizos opcionais:**

- `npm run identity:up` arranca Keycloak cunha **Cl@ve simulada** en http://127.0.0.1:8081; define
  as variables OIDC de [`.env.example`](.env.example) e reinicia `npm run dev` para ver *Entrar con
  Cl@ve* ([identidade pública](docs/architecture/identity.md)).
- `npm run analytics:up` e `npm run analytics:setup` arrancan un Umami local
  ([analítica](docs/architecture/analytics.md)).
- `npm run access:simulator` fai de controlador dunha fechadura ([control de accesos](docs/architecture/access-control.md)).

Portos: web 5173, app 5174, xestión 5175 (a web fai de proxy das outras dúas e da API, así que unha
soa orixe serve todo), API 3001, PostgreSQL 55432, Mailpit 1025/8025. Os datos gárdanse no volume
`quenda_quenda-data`; `docker compose stop` para a base de datos sen perdelos.

### Todo en contedores

```bash
docker compose -f compose.yml -f compose.demo.yml up --build --wait
```

Constrúe as imaxes de produción e serve a demo en http://127.0.0.1:8080 (`/`, `/app/`, `/admin/`),
con migracións, datos de exemplo, o worker e Mailpit. Os portos só escoitan en loopback.

## Instalalo nun servidor

Un servidor Linux con Docker leva unha instalación completa: PostgreSQL, a API, o worker de avisos,
o contedor web, Caddy con HTTPS automático, a tarefa diaria de conservación e copias de seguridade
cifradas cada noite. Nada depende dun provedor concreto. A guía completa, para o persoal técnico de
concellos e deputacións, está en castelán: [guía de operación](docs/operacion/README.md).

**Requisitos:** 2 vCPU, 4 GB de RAM e 40 GB de SSD para un concello pequeno (2 GB chegan para unha
demo ou un piloto pequeno); Debian 12 ou Ubuntu 24.04 con Docker Engine e Compose v2; un dominio
que apunte ao servidor; os portos 80 e 443 abertos; e un provedor SMTP para os avisos e os códigos
de entrada.

```bash
sudo git clone https://github.com/DavidPombar/quenda.git /opt/quenda
```

```bash
cd /opt/quenda && sudo QUENDA_DOMAIN=reservas.concello.gal SMTP_URL=smtp://user:pass@smtp.example:587 MAIL_FROM=reservas@concello.gal sh deploy/install.sh
```

[`deploy/install.sh`](deploy/install.sh):

- engade swap nos servidores pequenos, activa as actualizacións automáticas de seguridade e limita
  o SSH a claves;
- escribe `deploy/.env` (dominio, base de datos, copias) e `deploy/quenda.env` (segredos da
  aplicación) con segredos novos, que só pode ler root. **Garda unha copia de ambos fóra do
  servidor**: sen `QUENDA_DATA_KEY` non se poden ler os datos cifrados, e sen `RESTIC_PASSWORD`
  non se pode ler ningunha copia;
- constrúe as imaxes e arranca [`deploy/compose.prod.yml`](deploy/compose.prod.yml).

Pódese executar de novo: mantén a configuración existente e reconstrúe e reinicia os contedores.
Así tamén se **actualiza**: `git pull` (ou cambiar a unha etiqueta de versión) e executalo outra
vez; as migracións aplícanse ao arrancar a API ([actualizacións](docs/operacion/actualizacion.md)).

**Unha demo pública** usa o mesmo script con `DEMO_MODE=true`: concellos e contas ficticios, e sen
entrada por correo. Se non tes dominio propio, `<ip-con-guións>.sslip.io` funciona con Let's
Encrypt. A demo de referencia corre nun Hetzner CPX12 creado coa CLI `hcloud`
([exemplo](docs/operacion/despliegue-concello.md#ejemplo-servidor-en-hetzner-cloud)).

**Primeiras contas.** O persoal entra cun usuario, un contrasinal e unha app de autenticación. A
conta da entidade operadora, e se fai falta a primeira persoa xestora dun concello, créanse no
servidor, dentro de `/opt/quenda`; a orde mostra un contrasinal temporal unha soa vez:

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/staff.js create --operator --login operacion --name "Deputación · operación"
```

Despois, a entidade operadora crea os concellos e as súas persoas xestoras na xestión municipal, e
cada xestor/a crea o persoal da porta en **Persoal** ([alta dun concello](docs/operacion/alta-concello.md)).
A veciñanza entra con Cl@ve/Chave365 mediante OpenID Connect, ou cun código dun só uso por correo.

**Comprobar a instalación:**

```bash
HEADERS_URL=https://reservas.concello.gal EXPECT_SECURE_COOKIE=true npm run test:headers
```

| | Demo | Produción |
|---|---|---|
| Contas | `DEMO_MODE=true`: contas ficticias cun clic | Cl@ve/Chave365 ou código por correo para a veciñanza, contas locais con TOTP para o persoal |
| Datos | Concellos ficticios | Ningún; a entidade operadora crea os concellos |
| Transporte | HTTPS con Caddy (HTTP simple só en loopback con `compose.demo.yml`) | HTTPS con HSTS; cookies `Secure` |
| Operación | As mesmas imaxes e o mesmo ficheiro Compose | Ademais, copias fóra do servidor ([copias de seguridade](docs/operacion/copias-de-seguridad.md)), [soporte](docs/operacion/soporte.md) e o [plan de implantación](docs/operacion/plan-implantacion.md) |

Todos os axustes están en [`.env.example`](.env.example) (desenvolvemento) e en
[`deploy/prod.env.example`](deploy/prod.env.example) / [`deploy/quenda.env.example`](deploy/quenda.env.example) (produción).

## Como está feito

```
frontend/web     web pública (/)                          React + Chakra UI + Vite
frontend/app     app cidadá (/app/), instalable           React + Chakra UI + Vite + service worker
frontend/admin   xestión municipal e operadora (/admin/)  React + Chakra UI + Vite
backend          API REST (/v2) e worker de avisos        NestJS, PostgreSQL 17
deploy           Compose de produción, instalador, Caddy, nginx, realm de Keycloak
docs             arquitectura, operación, modelos legais, contexto do certame
scripts          comprobación da arquitectura, licenzas, smoke test con axe, cabeceiras, ferramentas
```

- **Tres frontends independentes.** Cada un ten o seu router, estilos, compilación e probas; non
  comparten código e enlázanse entre si con ligazóns normais. Dentro de cada un: ruta → vista →
  controlador → consulta ou mutación (TanStack Query) → repositorio → cliente da API. Un compoñente
  por cartafol homónimo, vistas sen acceso aos datos e `NativeSelect` de Chakra en todos os
  despregables.
- **Backend en módulos** (`backend/src/v2/modules`: reservas, instalacións, identidade, avisos,
  indicadores, tempadas, accesos, datos abertos, portabilidade, conservación…), cada un con
  `domain`, `application` e `infrastructure`. Un endpoint por controlador; os comandos e as
  consultas devolven `Result` tipados; os comandos son donos da transacción e nunca producen
  efectos externos; a hora vén dun `Clock` inxectado e os identificadores dun `IdGenerator`; o
  concello sempre sae da sesión.
- **Datos.** PostgreSQL con migracións numeradas e con suma de comprobación
  ([migracións](docs/architecture/migrations.md)); os horarios e os calendarios gárdanse como texto
  iCalendar; toda a aritmética de datas usa Temporal ([calendarios](docs/architecture/calendars.md)).
  Os avisos e os eventos de auditoría confírmanse coa reserva (outbox) e o worker entrégaos.

Máis en [implementación](docs/architecture/implementation.md) e nas
[pautas de deseño](docs/architecture/design-guidelines.md).

## Desenvolver e probar

```bash
npx playwright install chromium
```

```bash
npm run check
```

```bash
npm run licenses
```

```bash
npm run test:smoke
```

- `npm run check` executa a comprobación da arquitectura, o lint, os tipos, as probas unitarias, as
  probas no navegador (Vitest Browser Mode cos provedores reais e selectores accesibles), as probas
  HTTP contra bases de datos PostgreSQL desbotables e todas as compilacións. A CI executa o mesmo
  en cada pull request.
- `npm run licenses` comproba cada dependencia instalada contra a lista de licenzas libres permitidas.
- `npm run test:smoke` precisa `npm run dev`: un navegador real percorre web → app → xestión →
  operadora, fai, move e cancela unha reserva, comproba o reflow a 320, 390 e 640 px e fai 50
  escaneos con axe (WCAG 2.1 A/AA). As capturas e os informes van a `.dev-logs/`.

As probas HTTP nunca tocan a base de datos de desenvolvemento; a conta de PostgreSQL precisa
`CREATEDB` (`TEST_DATABASE_URL` apunta a outro sitio se fai falta). Outras ordes útiles:
`npm run db:migrate`, `npm run db:seed`, `npm run db:retention`,
`npm run db:import -- <ficheiro> [--slug novo]`, `npm run staff -- create|reset …` e `npm run format`.

## Desenvolver con axentes de IA

Quenda está escrita para que a amplíen tanto persoas como axentes de programación (Claude Code,
Codex, Cursor e semellantes). O proxecto dálle ao axente o contexto que precisa, regras que non
pode saltar en silencio e comprobacións que lle avisan, a el e a quen revisa, cando algo está mal.

### O contexto que le primeiro o axente

- **[`AGENTS.md`](AGENTS.md)**, o ficheiro estándar de instrucións que a maioría dos axentes le pola
  súa conta. Importa o contexto do certame (alcance, requisitos técnicos, valoración e a plantilla
  oficial), indica as regras que non se poden romper (só software libre, WCAG 2.1 AA, todo o
  municipal é configuración, pensar nun concello pequeno, citar os identificadores dos requisitos)
  e resume as convencións de enxeñaría dos frontends e do backend.
- **[`CLAUDE.md`](CLAUDE.md)** importa `AGENTS.md` para Claude Code e engade o específico del: como
  arrancar o entorno de desenvolvemento no seu navegador integrado e cando comprobar a accesibilidade.
- **Documentos de arquitectura** en [`docs/architecture`](docs/architecture), un por área
  (identidade, avisos, calendarios, datos abertos, protección de datos, accesibilidade…), escritos
  para que un axente cargue só o que precisa.

### Garantías que fallan á vista

- **`scripts/check-architecture.mjs`** (parte de `npm run check`) converte as convencións en erros
  cunha mensaxe clara: as vistas non poden chegar á capa de datos, os controladores teñen que usar
  hooks de consulta ou mutación, os frontends non se poden importar entre si, o dominio non pode
  depender de frameworks, o código de aplicación non pode depender da infraestrutura, os comandos
  teñen que usar `Clock` e `IdGenerator`, un endpoint por controlador, sen ficheiros barril e
  `NativeSelect` nos despregables. Se un axente se desvía, dísselle exactamente que cambiar.
- **Probas que comproban o comportamento, non a implementación.** As probas no navegador manexan a
  app real polos roles e nomes accesibles, así que tamén detectan regresións de accesibilidade; as
  probas HTTP executan a app Nest real contra un PostgreSQL real e desbotable. A lóxica de negocio
  interna nunca se simula, así que se as probas pasan, a funcionalidade funciona.
- **O smoke test con axe** detecta calquera nova violación de WCAG en 50 pantallas; as violacións
  coñecidas teñen que figurar xunto a unha issue.
- **`npm run licenses`** bloquea as dependencias con licenza non libre, que os axentes engaden con
  facilidade.
- **A CI** executa todo o anterior en cada pull request; o traballo vai por unha rama e un pull
  request, nunca directamente a `main`.

### Ferramentas para Claude Code

- **[`.claude/launch.json`](.claude/launch.json)** arranca todo o entorno (`quenda-dev`) para o
  navegador integrado, para que o axente poida abrir a app, entrar cos botóns da demo e comprobar o
  seu propio cambio en vez de pedirllo a unha persoa.
- **A skill `accesibilidade`** ([`.claude/skills/accesibilidade/SKILL.md`](.claude/skills/accesibilidade/SKILL.md)):
  despois dun cambio importante no frontend (unha pantalla ou un diálogo novos, un compoñente
  compartido, o tema, a reserva ou un fluxo de entrada) o axente execútaa sen que llo pidan.
  Inxecta axe na páxina, percorre a pantalla co teclado, le a árbore de accesibilidade, comproba o
  reflow a 320 px, o zoom ao 200 % e o espazado do texto, informa contra a matriz WCAG e propón unha
  issue por cada problema novo. `node scripts/axe-page.mjs <url>` é a alternativa sen interface.

### Un cambio típico

1. Partir dunha issue que cite os identificadores do requisito (por exemplo *C3* ou *T5 · 2.4.3*).
2. O axente le `AGENTS.md`, o documento de arquitectura da área e o código, e propón un plan; os
   cambios non triviais acórdanse antes de programar.
3. Traballa nunha rama e respecta as capas; unha migración leva o seguinte número e a súa nota en
   [migracións](docs/architecture/migrations.md).
4. Engade ou actualiza as probas no navegador e HTTP, executa `npm run check`, `npm run licenses`
   e, con `npm run dev`, `npm run test:smoke`, e comproba o cambio no navegador.
5. Actualiza os documentos aos que afecta o cambio: a matriz WCAG se toca un criterio de
   accesibilidade, a páxina de arquitectura da área e a guía de operación se cambia algo que
   executa o persoal técnico.
6. Abre un pull request que explica que cambiou e como se comprobou; unha persoa revísao e fusiónao.

Para ensinarlles aos axentes un procedemento novo e repetido, engade unha skill en
`.claude/skills/<nome>/SKILL.md` (unha descrición curta de cando usala e os pasos) e menciónaa en
`CLAUDE.md`; as regras que valen para todos os axentes van en `AGENTS.md`.

## Límites desta versión

Quenda é unha V0 que funciona con datos ficticios; aínda non é un servizo que trate datos persoais
da veciñanza. Antes dun piloto real falta: a alta en produción con Cl@ve/Chave365, unha revisión
de seguridade independente e unha revisión externa de accesibilidade con tecnoloxías de apoio
([#77](https://github.com/DavidPombar/quenda/issues/77)), avisos por SMS, límites de peticións
compartidos entre réplicas da API, paxinación no servidor dos historiais longos, pagamentos e
capacidade compartida (varias persoas nunha mesma rúa). Non se declara ningunha certificación RXPD,
ENS nin WCAG; os concellos poden partir dos modelos en castelán do
[rexistro de actividades de tratamento](docs/legal/registro-actividades-tratamiento.md) e do
[contrato de encargo do tratamento](docs/legal/contrato-encargado-tratamiento.md), que debe revisar
a súa persoa delegada de protección de datos.

## Documentación

| Área | Documentos |
|---|---|
| Operación (en castelán) | [Guía](docs/operacion/README.md) · [despregamento nun concello](docs/operacion/despliegue-concello.md) · [despregamento nunha deputación](docs/operacion/despliegue-deputacion.md) · [alta dun concello](docs/operacion/alta-concello.md) · [copias de seguridade](docs/operacion/copias-de-seguridad.md) · [actualizacións](docs/operacion/actualizacion.md) · [soporte](docs/operacion/soporte.md) · [plan de implantación](docs/operacion/plan-implantacion.md) · [kit ENS](docs/operacion/ens) |
| Arquitectura (en inglés) | [Implementación](docs/architecture/implementation.md) · [identidade](docs/architecture/identity.md) · [avisos](docs/architecture/notifications.md) · [calendarios](docs/architecture/calendars.md) · [catálogo](docs/architecture/catalogue.md) · [tempadas](docs/architecture/seasons.md) · [control de accesos](docs/architecture/access-control.md) · [app instalable](docs/architecture/pwa.md) · [analítica](docs/architecture/analytics.md) · [migracións](docs/architecture/migrations.md) |
| Datos e dereitos | [Datos abertos](docs/architecture/open-data.md) · [portabilidade dos datos](docs/architecture/data-portability.md) · [protección de datos](docs/architecture/data-protection.md) · [modelos legais](docs/legal) |
| Accesibilidade e deseño | [Matriz WCAG 2.1 AA](docs/architecture/accessibility.md) · [pautas de deseño](docs/architecture/design-guidelines.md) |
| Certame | [Alcance](docs/contexto/01-alcance-funcional.md) · [requisitos técnicos](docs/contexto/02-requisitos-tecnicos.md) · [valoración](docs/contexto/03-concurso-presentacion-valoracion.md) · [folla de ruta](docs/memoria/roadmap.md) · [investigación](docs/investigacion/00-resumen-ejecutivo.md) |

## Contribuír e licenza

Quenda publícase como un activo público reutilizable baixo a
[GNU Affero General Public License v3.0 ou posterior](LICENSE). Consulta
[CONTRIBUTING.md](CONTRIBUTING.md), a [política de seguridade](SECURITY.md), o
[código de conduta](CODE_OF_CONDUCT.md), o [rexistro de cambios](CHANGELOG.md) e os metadatos de
catálogo [publiccode.yml](publiccode.yml).

---

# English version

> The project's main language is Galician; this is the same content in English. [Ler en galego](#quenda).

**Online booking of municipal sports facilities for small councils.** Residents find a court or a
pool, see real availability and book, change or cancel in a few taps; the council manages its
facilities, timetables, rules and indicators; a provincial council (*deputación*) can run one
instance for many councils. Free software (AGPL-3.0-or-later), self-hostable, Galician by default
and Spanish available.

Quenda is the proposal for the I Certame GOBTEC de Software Libre (AGASOL, 2026). Its requirements
are traced throughout the code and documentation with the contest's IDs: citizens **C1–C4**,
council **M1–M3**, public reuse **R1–R3** and mandatory technical conditions **T1–T5**
([scope](docs/contexto/01-alcance-funcional.md), [technical requirements](docs/contexto/02-requisitos-tecnicos.md)).

- **Public demo:** https://91-99-68-27.sslip.io/ (synthetic data; **Entrar** opens demo accounts)
- **Stack:** React 19, Chakra UI 3 and Vite · NestJS and Node 24 · PostgreSQL 17 · Docker Compose

## Contents

1. [What it does](#what-it-does)
2. [Try it on your computer](#try-it-on-your-computer)
3. [Install it on a server](#install-it-on-a-server)
4. [How it is built](#how-it-is-built)
5. [Develop and test](#develop-and-test)
6. [Developing with AI agents](#developing-with-ai-agents)
7. [Limits of this version](#limits-of-this-version)
8. [Documentation](#documentation)
9. [Contributing and licence](#contributing-and-licence)

## What it does

### For residents (citizen app, `/app/`)

- **Find a facility (C1):** a catalogue shared by every council of the instance, with search, sport
  filters, step-free access, photos, map, rules, prices by category and the week's opening hours.
- **Book online (C2):** real availability by day and court, including courts split into parts that
  block each other; overlap protection, per-person limits and booking windows are enforced by the
  server. When a day is full, Quenda suggests three free slots from aggregated history (no AI).
- **Change and cancel (C3)** within the council's notice period.
- **History and notices (C4):** upcoming bookings and history, in-app notices, email and Web Push
  for confirmations, changes, cancellations and reminders.
- **Personal calendars:** each booking as `.ics`, or a revocable `webcal://` subscription.
- **QR pass** for the door, also offline.
- **Installable app (PWA)** with each council's name, colour and icon.
- **Privacy:** versioned privacy notice per council, data download and account deletion.

### For the council (backoffice, `/admin/`)

- **Facilities (M1):** create and edit facilities and their courts or lanes, photos with
  alternative text, active, maintenance and closed states, closures with a reason (affected
  bookings are cancelled and notified).
- **Timetables and rules (M2):** opening hours as iCalendar (RFC 5545) with exceptions and `.ics`
  import, municipal holidays, slot duration, booking window, cancellation deadline, per-person
  limits, prices by user category, no-show penalties and season allocation to clubs.
- **Indicators (M3):** bookings, cancellations, occupancy by facility, court, weekday and hour,
  attendance and no-shows, and optional cookieless web analytics in the deployment's own Umami.
- **Day bookings** with municipal cancellation, the **door page** for access staff (QR scanning or a
  searchable list, works offline), **staff accounts**, the **audit log**, settings for branding,
  language, legal texts and the **accessibility statement**, and **data export**.

### For the provincial council or operator (`/admin/operador`)

- One instance serves many councils, with strict data isolation between them (R3).
- The operator creates councils and their managers and reads aggregated indicators.

### Standards and conditions (T1–T5)

| ID | Requirement | How Quenda meets it |
|---|---|---|
| T1 | Free software | AGPL-3.0-or-later; every dependency checked by `npm run licenses` against an allowlist |
| T2 | Open, responsive and modular web | Three independent frontends and a modular REST API (OpenAPI 3); works from 320 px to desktop |
| T3 | Public authentication and open standards | OpenID Connect for Cl@ve/Chave365 (Keycloak as reference provider), sign-in by email code, local staff accounts with TOTP; iCalendar, OpenAPI, CSV/JSON, schema.org JSON-LD, GeoJSON, DCAT-AP-ES open data, full municipal data export and import |
| T4 | GDPR and secure user management | Data minimisation, consent and versioned notices, retention job, audit log, encrypted personal data, scrypt passwords and TOTP, rate limits, CSP and security headers |
| T5 | WCAG 2.1 AA (RD 1112/2018, EN 301 549) | Self-assessed matrix of all 50 criteria in [accessibility.md](docs/architecture/accessibility.md), 50 axe scans on every change, per-council accessibility statement. No certification is claimed |

## Try it on your computer

Requires Node 24, npm and Docker with Compose.

```bash
npm ci
```

```bash
npm run setup
```

```bash
npm run dev
```

`npm run setup` starts PostgreSQL and Mailpit in Docker, applies the migrations and loads two
synthetic councils, **Portomar** and **Vilaverde**. It can be run again without overwriting data.
`npm run dev` starts the API, the notice worker and the three frontends with demo sign-in enabled.

| What | Where |
|---|---|
| Public website | http://127.0.0.1:5173 |
| Citizen app | http://127.0.0.1:5173/app/ |
| Council backoffice | http://127.0.0.1:5173/admin/ |
| Operator area | http://127.0.0.1:5173/admin/operador |
| Email sent by the demo (Mailpit) | http://127.0.0.1:8025 |
| API documentation (Swagger, OpenAPI) | http://127.0.0.1:3001/api/docs, `/api/openapi.json` |

**Demo accounts:** **Entrar** offers *Entrar como cidadanía* in the app and *Entrar como xestor/a*
or *Entrar como control de accesos* in the backoffice. Switching council signs out. Nothing in the
demo makes a real booking or charges money.

**Optional services:**

- `npm run identity:up` starts Keycloak with a **simulated Cl@ve** at http://127.0.0.1:8081; set
  the OIDC variables from [`.env.example`](.env.example) and restart `npm run dev` to see
  *Entrar con Cl@ve* ([public identity](docs/architecture/identity.md)).
- `npm run analytics:up` and `npm run analytics:setup` start a local Umami
  ([analytics](docs/architecture/analytics.md)).
- `npm run access:simulator` stands in for a door lock controller ([access control](docs/architecture/access-control.md)).

Ports: website 5173, app 5174, backoffice 5175 (the website proxies both and the API, so one
origin serves everything), API 3001, PostgreSQL 55432, Mailpit 1025/8025. Data persists in the
`quenda_quenda-data` volume; `docker compose stop` stops the database without losing it.

### Everything in containers

```bash
docker compose -f compose.yml -f compose.demo.yml up --build --wait
```

Builds the production images and serves the demo at http://127.0.0.1:8080 (`/`, `/app/`,
`/admin/`), with migrations, seed data, the worker and Mailpit. Ports bind to loopback only.

## Install it on a server

One Linux server with Docker runs a whole instance: PostgreSQL, the API, the notice worker, the
web container, Caddy with automatic HTTPS, the daily retention job and nightly encrypted backups.
Nothing depends on a particular provider. The full guide, for council and *deputación*
technicians, is in Spanish: [operations guide](docs/operacion/README.md).

**Requirements:** 2 vCPU, 4 GB RAM and 40 GB SSD for a small council (2 GB is enough for a demo or
small pilot); Debian 12 or Ubuntu 24.04 with Docker Engine and Compose v2; a domain pointing at the
server; ports 80 and 443 open; an SMTP provider for notices and sign-in codes.

```bash
sudo git clone https://github.com/DavidPombar/quenda.git /opt/quenda
```

```bash
cd /opt/quenda && sudo QUENDA_DOMAIN=reservas.concello.gal SMTP_URL=smtp://user:pass@smtp.example:587 MAIL_FROM=reservas@concello.gal sh deploy/install.sh
```

[`deploy/install.sh`](deploy/install.sh):

- adds swap on small servers, turns on automatic security updates and limits SSH to keys;
- writes `deploy/.env` (domain, database, backups) and `deploy/quenda.env` (application secrets)
  with fresh secrets, readable only by root. **Keep a copy of both outside the server**: without
  `QUENDA_DATA_KEY` the encrypted data cannot be read, and without `RESTIC_PASSWORD` no backup can;
- builds the images and starts [`deploy/compose.prod.yml`](deploy/compose.prod.yml).

It can be run again: it keeps existing settings and rebuilds and restarts the containers. That is
also how to **update**: `git pull` (or check out a release tag) and run it again; migrations run
when the API starts ([upgrades](docs/operacion/actualizacion.md)).

**A public demo** uses the same script with `DEMO_MODE=true`: synthetic councils and accounts, and
sign-in by email off. Without a domain of your own, `<ip-with-dashes>.sslip.io` works with Let's
Encrypt. The reference demo runs on a Hetzner CPX12 created with the `hcloud` CLI
([example](docs/operacion/despliegue-concello.md#ejemplo-servidor-en-hetzner-cloud)).

**First accounts.** Staff sign in with a login, a password and an authenticator app. Create the
operator, and if needed a council's first manager, on the server, inside `/opt/quenda`; the command
prints a temporary password once:

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/staff.js create --operator --login operacion --name "Deputación · operación"
```

The operator then creates councils and their managers in the backoffice, and each manager creates
door staff under **Persoal** ([onboarding a council](docs/operacion/alta-concello.md)). Residents
sign in with Cl@ve/Chave365 through OpenID Connect, or with a one-time code by email.

**Check the instance:**

```bash
HEADERS_URL=https://reservas.concello.gal EXPECT_SECURE_COOKIE=true npm run test:headers
```

| | Demo | Production |
|---|---|---|
| Accounts | `DEMO_MODE=true`: one-click synthetic accounts | Cl@ve/Chave365 or email code for residents, local accounts with TOTP for staff |
| Data | Synthetic councils | None; the operator creates councils |
| Transport | HTTPS through Caddy (plain HTTP only on loopback with `compose.demo.yml`) | HTTPS with HSTS; `Secure` cookies |
| Operation | Same images and Compose file | Plus off-server backups ([backups](docs/operacion/copias-de-seguridad.md)), [support](docs/operacion/soporte.md) and the [rollout plan](docs/operacion/plan-implantacion.md) |

All settings are listed in [`.env.example`](.env.example) (development) and
[`deploy/prod.env.example`](deploy/prod.env.example) / [`deploy/quenda.env.example`](deploy/quenda.env.example) (production).

## How it is built

```
frontend/web     public website (/)                  React + Chakra UI + Vite
frontend/app     citizen app (/app/), installable    React + Chakra UI + Vite + service worker
frontend/admin   backoffice and operator (/admin/)   React + Chakra UI + Vite
backend          REST API (/v2) and notice worker    NestJS, PostgreSQL 17
deploy           production Compose, installer, Caddy, nginx, Keycloak realm
docs             architecture, operations, legal templates, contest context
scripts          architecture check, licences, smoke test with axe, headers, tools
```

- **Three independent frontends.** Each has its own router, styles, build and tests; they share no
  source and link to each other with ordinary links. Inside each: route → view → controller →
  query or mutation (TanStack Query) → repository → API client. One component per homonymous
  folder, views without data access, Chakra `NativeSelect` for every select.
- **Backend in modules** (`backend/src/v2/modules`: bookings, facilities, identity, notifications,
  insights, seasons, access, open data, portability, retention…), each with `domain`,
  `application` and `infrastructure`. One endpoint per controller; commands and queries return
  typed `Result`s; commands own the transaction and never perform external effects; time comes from
  an injected `Clock` and ids from an `IdGenerator`; the municipality always comes from the
  session.
- **Data.** PostgreSQL with numbered, checksummed migrations
  ([migrations](docs/architecture/migrations.md)); opening hours and calendars are iCalendar text;
  all time arithmetic uses Temporal ([calendars](docs/architecture/calendars.md)). Notices and audit
  events commit with the booking (outbox) and the worker delivers them.

More in [implementation](docs/architecture/implementation.md) and the
[design guidelines](docs/architecture/design-guidelines.md).

## Develop and test

```bash
npx playwright install chromium
```

```bash
npm run check
```

```bash
npm run licenses
```

```bash
npm run test:smoke
```

- `npm run check` runs the architecture check, lint, types, unit tests, browser tests (Vitest
  Browser Mode with real providers and accessible selectors), HTTP tests against disposable
  PostgreSQL databases, and all builds. CI runs the same on every pull request.
- `npm run licenses` checks every installed dependency against the free-software allowlist.
- `npm run test:smoke` needs `npm run dev`: a real browser goes website → app → backoffice →
  operator, makes, moves and cancels a booking, checks reflow at 320, 390 and 640 px and runs 50 axe
  scans (WCAG 2.1 A/AA). Screenshots and reports go to `.dev-logs/`.

HTTP tests never touch the development database; the PostgreSQL account needs `CREATEDB`
(`TEST_DATABASE_URL` points elsewhere if needed). Other useful commands: `npm run db:migrate`,
`npm run db:seed`, `npm run db:retention`, `npm run db:import -- <file> [--slug new]`,
`npm run staff -- create|reset …` and `npm run format`.

## Developing with AI agents

Quenda is written to be extended by coding agents (Claude Code, Codex, Cursor and similar) as well
as by people. The project gives an agent the context it needs, rules it cannot break silently and
checks that tell it, and the reviewer, when something is wrong.

### Context the agent reads first

- **[`AGENTS.md`](AGENTS.md)**, the standard instructions file most agents read on their own. It
  imports the contest context (scope, technical requirements, evaluation and the official template),
  states the rules that cannot be broken (free software only, WCAG 2.1 AA, everything municipal is
  configuration, think of a small council, cite requirement IDs) and summarises the engineering
  conventions of the frontends and the backend.
- **[`CLAUDE.md`](CLAUDE.md)** imports `AGENTS.md` for Claude Code and adds what is specific to it:
  how to start the development stack in its built-in browser and when to check accessibility.
- **Architecture documents** in [`docs/architecture`](docs/architecture), one per area (identity,
  notifications, calendars, open data, data protection, accessibility…), written so an agent can
  load just the one it needs.

### Guardrails that fail loudly

- **`scripts/check-architecture.mjs`** (part of `npm run check`) turns the conventions into errors
  with a plain message: views cannot reach the data layer, controllers must use query or mutation
  hooks, frontends cannot import each other, the domain cannot depend on frameworks, application
  code cannot depend on infrastructure, commands must use `Clock` and `IdGenerator`, one endpoint
  per controller, no barrel files, `NativeSelect` for selects. An agent that drifts gets told
  exactly what to change.
- **Tests that check behaviour, not implementation.** Browser tests drive the real app through
  accessible roles and names, so they also catch accessibility regressions; HTTP tests run the real
  Nest app against a real, disposable PostgreSQL. Internal business logic is never mocked, so
  passing tests mean the feature works.
- **The smoke test with axe** catches any new WCAG violation on 50 screens; known violations must
  be listed against an issue.
- **`npm run licenses`** blocks a dependency with a non-free licence, which agents add easily.
- **CI** runs all of the above on every pull request; work goes through a branch and a pull
  request, never straight to `main`.

### Tools for Claude Code

- **[`.claude/launch.json`](.claude/launch.json)** starts the whole stack (`quenda-dev`) for the
  built-in browser, so the agent can open the app, sign in with the demo buttons and check its own
  change instead of asking a person to.
- **The `accesibilidade` skill** ([`.claude/skills/accesibilidade/SKILL.md`](.claude/skills/accesibilidade/SKILL.md)):
  after a significant frontend change (a new screen or dialog, a shared component, the theme, the
  booking or a sign-in flow) the agent runs it without being asked. It injects axe into the page,
  walks the screen with the keyboard, reads the accessibility tree, checks 320 px reflow, 200 %
  zoom and text spacing, reports against the WCAG matrix and proposes an issue for each new problem.
  `node scripts/axe-page.mjs <url>` is the headless fallback.

### A typical change

1. Start from an issue that cites its requirement IDs (for example *C3* or *T5 · 2.4.3*).
2. The agent reads `AGENTS.md`, the relevant architecture document and the code, and proposes a
   plan; non-trivial changes are agreed before coding.
3. It works on a branch, following the layering; a migration gets the next number and its note in
   [migrations](docs/architecture/migrations.md).
4. It adds or updates browser and HTTP tests, runs `npm run check`, `npm run licenses` and, with
   `npm run dev`, `npm run test:smoke`, and checks the change in the browser.
5. It updates the documents the change affects: the WCAG matrix for an accessibility criterion,
   the architecture page of the area, the operations guide for anything a technician runs.
6. It opens a pull request describing what changed and how it was verified; a person reviews and
   merges.

To teach agents a new recurring procedure, add a skill under `.claude/skills/<name>/SKILL.md` (a
short description of when to use it and the steps) and mention it in `CLAUDE.md`; rules that apply
to every agent belong in `AGENTS.md`.

## Limits of this version

Quenda is a working V0 with synthetic data, not yet a service processing residents' personal data.
Still to do before a real pilot: production onboarding with Cl@ve/Chave365, an independent security
review and an external accessibility review with assistive technology
([#77](https://github.com/DavidPombar/quenda/issues/77)), SMS notices, rate limiting shared across
API replicas, server-side pagination of long histories, payments and shared capacity (several
people in one lane). No GDPR, ENS or WCAG certification is claimed; councils can start from the
Spanish templates for the [record of processing activities](docs/legal/registro-actividades-tratamiento.md)
and the [processor agreement](docs/legal/contrato-encargado-tratamiento.md), to be reviewed by
their data protection officer.

## Documentation

| Area | Documents |
|---|---|
| Operations (Spanish) | [Guide](docs/operacion/README.md) · [council deployment](docs/operacion/despliegue-concello.md) · [deputación deployment](docs/operacion/despliegue-deputacion.md) · [onboarding](docs/operacion/alta-concello.md) · [backups](docs/operacion/copias-de-seguridad.md) · [upgrades](docs/operacion/actualizacion.md) · [support](docs/operacion/soporte.md) · [rollout plan](docs/operacion/plan-implantacion.md) · [ENS kit](docs/operacion/ens) |
| Architecture | [Implementation](docs/architecture/implementation.md) · [identity](docs/architecture/identity.md) · [notifications](docs/architecture/notifications.md) · [calendars](docs/architecture/calendars.md) · [catalogue](docs/architecture/catalogue.md) · [seasons](docs/architecture/seasons.md) · [access control](docs/architecture/access-control.md) · [installable app](docs/architecture/pwa.md) · [analytics](docs/architecture/analytics.md) · [migrations](docs/architecture/migrations.md) |
| Data and rights | [Open data](docs/architecture/open-data.md) · [data portability](docs/architecture/data-portability.md) · [data protection](docs/architecture/data-protection.md) · [legal templates](docs/legal) |
| Accessibility and design | [WCAG 2.1 AA matrix](docs/architecture/accessibility.md) · [design guidelines](docs/architecture/design-guidelines.md) |
| Contest | [Scope](docs/contexto/01-alcance-funcional.md) · [technical requirements](docs/contexto/02-requisitos-tecnicos.md) · [evaluation](docs/contexto/03-concurso-presentacion-valoracion.md) · [roadmap](docs/memoria/roadmap.md) · [research](docs/investigacion/00-resumen-ejecutivo.md) |

## Contributing and licence

Quenda is published as a reusable public asset under the
[GNU Affero General Public License v3.0 or later](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md),
the [security policy](SECURITY.md), the [code of conduct](CODE_OF_CONDUCT.md), the
[changelog](CHANGELOG.md) and the [publiccode.yml](publiccode.yml) catalogue metadata.
