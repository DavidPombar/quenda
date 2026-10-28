// SPDX-License-Identifier: AGPL-3.0-or-later
export type Locale = "gl" | "es";
export const copy = {
  gl: {
    documentTitle: "Quenda: reserva de instalacións deportivas municipais",
    skip: "Ir ao contido",
    navigation: "Navegación principal",
    language: "Idioma",
    how: "Como funciona",
    councils: "Para concellos",
    enter: "Entrar na app",
    title: "Reserva as pistas e piscinas do teu concello.",
    intro:
      "Mira que horas están libres e reserva desde o móbil ou o ordenador, sen ter que chamar por teléfono.",
    openApp: "Abrir a aplicación",
    discover: "Como funciona",
    demo: "Esta demo usa un concello e datos ficticios.",
    illustration:
      "Mapa ilustrado dun concello con catro instalacións deportivas numeradas.",
    mapLegend: "Instalacións do mapa",
    mapPlaces: [
      { sport: "tennis", name: "Pista de tenis" },
      { sport: "padel", name: "Pista de pádel" },
      { sport: "futsal", name: "Pavillón de fútbol sala" },
      { sport: "swimming", name: "Piscina municipal" },
    ],
    stepsTitle: "Como se reserva",
    stepsIntro: "Non precisas instalar nada: abre a aplicación no navegador.",
    step: "Paso",
    steps: [
      {
        title: "Busca a instalación",
        body: "Consulta onde está, os horarios, as normas de uso e a información de accesibilidade.",
      },
      {
        title: "Escolle unha hora libre",
        body: "O calendario mostra a dispoñibilidade real. Escolle a hora e confirma a reserva.",
      },
      {
        title: "Cambia ou cancela se o precisas",
        body: "Dentro dos prazos do teu concello. No historial tes todas as túas reservas e os avisos.",
      },
    ],
    councilTitle: "Para o persoal do concello",
    councilBody:
      "Quenda reúne as instalacións, os horarios e as reservas nun só panel. O persoal mantén a información ao día e a veciñanza reserva pola súa conta.",
    features: [
      {
        title: "Instalacións",
        body: "Alta de pistas e espazos, con fotos e estado: aberta, en mantemento ou pechada.",
      },
      {
        title: "Horarios e normas",
        body: "Horario de apertura, festivos e peches puntuais. Duración máxima, antelación, prazos de cancelación e prezos.",
      },
      {
        title: "Indicadores",
        body: "Ocupación, reservas, cancelacións e ausencias por instalación e franxa horaria.",
      },
      {
        title: "Varios concellos",
        body: "Unha deputación pode dar servizo a varios concellos desde o mesmo servidor, cos datos de cada un separados.",
      },
    ],
    management: "Explorar a demo municipal",
    openTitle: "Software libre",
    openBody:
      "Quenda publícase con licenza AGPL-3.0. Calquera concello ou deputación pode usala, adaptala e mellorala sen pagar licenzas.",
    openPoints: [
      "Instálase no servidor do concello ou da deputación con Docker e unha guía de despregamento.",
      "Funciona en galego e en castelán, no móbil e no ordenador.",
      "Está pensada para usarse co teclado e con lector de pantalla.",
    ],
    license: "Ler a licenza AGPL-3.0",
    footerTagline: "Reserva de instalacións deportivas municipais.",
    footerLinks: "Ligazóns",
    footerAppLink: "Aplicación para a veciñanza",
    footerAdminLink: "Demo para concellos",
    footerLicense: "Licenza AGPL-3.0",
    footerPrivacy:
      "A demo usa datos ficticios. Cada concello publica o seu propio aviso de privacidade.",
    footerContest: "Proposta para o I Certame GOBTEC de Software Libre.",
    searchNav: "Buscar instalacións",
    searchTitle: "Instalacións deportivas da contorna",
    searchIntro:
      "Busca nos concellos que usan Quenda e reserva no do lugar que mellor che veña.",
    searchFilters: "Filtros da busca",
    searchText: "Nome ou enderezo",
    searchMunicipalities: "Concellos",
    searchSport: "Deporte",
    searchAllSports: "Todos os deportes",
    searchAccessible: "Só con acceso sen barreiras",
    searchResults: "instalacións atopadas",
    searchOne: "instalación atopada",
    searchEmpty: "Non hai instalacións con estes filtros.",
    searchEmptyHint: "Proba con outro deporte ou engade máis concellos.",
    searchClear: "Quitar filtros",
    searchStepFree: "Acceso sen barreiras",
    searchBook: "Ver horarios e reservar",
    searchLoading: "Buscando instalacións…",
    searchError: "Non puidemos cargar as instalacións.",
    searchRetry: "Volver tentar",
    searchBack: "Volver á portada",
    searchCta: "Busca instalacións na túa contorna",
    sports: {
      padel: "Pádel",
      tennis: "Tenis",
      futsal: "Fútbol sala",
      swimming: "Natación",
    },
    footerAccessibility: "Declaración de accesibilidade",
    a11yDocumentTitle: "Declaración de accesibilidade · Quenda",
    a11yBack: "Volver ao inicio",
    a11yTitle: "Declaración de accesibilidade",
    a11yIntro:
      "Quenda comprométese a facer accesible este sitio web informativo, de conformidade co Real Decreto 1112/2018, do 7 de setembro, sobre accesibilidade dos sitios web e aplicacións para dispositivos móbiles do sector público.",
    a11yStatusTitle: "Situación de cumprimento",
    a11yStatus:
      "Este sitio web é parcialmente conforme co RD 1112/2018. Norma de referencia: WCAG 2.1 nivel AA e norma EN 301 549.",
    a11yContentTitle: "Contido non accesible",
    a11yContent:
      "Aínda non se fixo a revisión manual con tecnoloxías de apoio (lectores de pantalla, ampliadores e control por voz), polo que poden existir barreiras que as probas automáticas non detectan.",
    a11yPreparationTitle: "Preparación desta declaración",
    a11yPreparation:
      "Declaración preparada o 27 de outubro de 2026 mediante autoavaliación do equipo do proxecto, con análises automáticas axe (WCAG 2.1 AA) en cada cambio do código. Revísase polo menos unha vez ao ano.",
    a11yContactTitle: "Observacións e datos de contacto",
    a11yContact:
      "Para comunicar unha barreira neste sitio web, abre unha incidencia no repositorio público do proxecto.",
    a11yContactLink: "Abrir unha incidencia en GitHub",
    a11yMunicipalTitle: "Declaración de cada concello",
    a11yMunicipal:
      "Cada concello que usa Quenda publica a súa propia declaración na aplicación, coa unidade responsable, o correo e o teléfono. Diríxelle a ela as solicitudes de información accesible, as queixas e as reclamacións sobre o servizo de reservas, que se responden nun prazo máximo de 20 días hábiles.",
    a11yMunicipalLink: "Ir á aplicación do teu concello",
  },
  es: {
    documentTitle: "Quenda: reserva de instalaciones deportivas municipales",
    skip: "Ir al contenido",
    navigation: "Navegación principal",
    language: "Idioma",
    how: "Cómo funciona",
    councils: "Para ayuntamientos",
    enter: "Entrar en la app",
    title: "Reserva las pistas y piscinas de tu ayuntamiento.",
    intro:
      "Mira qué horas están libres y reserva desde el móvil o el ordenador, sin tener que llamar por teléfono.",
    openApp: "Abrir la aplicación",
    discover: "Cómo funciona",
    demo: "Esta demo usa un ayuntamiento y datos ficticios.",
    illustration:
      "Mapa ilustrado de un municipio con cuatro instalaciones deportivas numeradas.",
    mapLegend: "Instalaciones del mapa",
    mapPlaces: [
      { sport: "tennis", name: "Pista de tenis" },
      { sport: "padel", name: "Pista de pádel" },
      { sport: "futsal", name: "Pabellón de fútbol sala" },
      { sport: "swimming", name: "Piscina municipal" },
    ],
    stepsTitle: "Cómo se reserva",
    stepsIntro:
      "No necesitas instalar nada: abre la aplicación en el navegador.",
    step: "Paso",
    steps: [
      {
        title: "Busca la instalación",
        body: "Consulta dónde está, los horarios, las normas de uso y la información de accesibilidad.",
      },
      {
        title: "Elige una hora libre",
        body: "El calendario muestra la disponibilidad real. Elige la hora y confirma la reserva.",
      },
      {
        title: "Cambia o cancela si lo necesitas",
        body: "Dentro de los plazos de tu ayuntamiento. En el historial tienes todas tus reservas y los avisos.",
      },
    ],
    councilTitle: "Para el personal del ayuntamiento",
    councilBody:
      "Quenda reúne las instalaciones, los horarios y las reservas en un solo panel. El personal mantiene la información al día y la ciudadanía reserva por su cuenta.",
    features: [
      {
        title: "Instalaciones",
        body: "Alta de pistas y espacios, con fotos y estado: abierta, en mantenimiento o cerrada.",
      },
      {
        title: "Horarios y normas",
        body: "Horario de apertura, festivos y cierres puntuales. Duración máxima, antelación, plazos de cancelación y precios.",
      },
      {
        title: "Indicadores",
        body: "Ocupación, reservas, cancelaciones y ausencias por instalación y franja horaria.",
      },
      {
        title: "Varios ayuntamientos",
        body: "Una diputación puede dar servicio a varios ayuntamientos desde el mismo servidor, con los datos de cada uno separados.",
      },
    ],
    management: "Explorar la demo municipal",
    openTitle: "Software libre",
    openBody:
      "Quenda se publica con licencia AGPL-3.0. Cualquier ayuntamiento o diputación puede usarla, adaptarla y mejorarla sin pagar licencias.",
    openPoints: [
      "Se instala en el servidor del ayuntamiento o de la diputación con Docker y una guía de despliegue.",
      "Funciona en gallego y en castellano, en el móvil y en el ordenador.",
      "Está pensada para usarse con teclado y con lector de pantalla.",
    ],
    license: "Leer la licencia AGPL-3.0",
    footerTagline: "Reserva de instalaciones deportivas municipales.",
    footerLinks: "Enlaces",
    footerAppLink: "Aplicación para la ciudadanía",
    footerAdminLink: "Demo para ayuntamientos",
    footerLicense: "Licencia AGPL-3.0",
    footerPrivacy:
      "La demo usa datos ficticios. Cada ayuntamiento publica su propio aviso de privacidad.",
    footerContest: "Propuesta para el I Certame GOBTEC de Software Libre.",
    searchNav: "Buscar instalaciones",
    searchTitle: "Instalaciones deportivas del entorno",
    searchIntro:
      "Busca en los ayuntamientos que usan Quenda y reserva en el que mejor te venga.",
    searchFilters: "Filtros de la búsqueda",
    searchText: "Nombre o dirección",
    searchMunicipalities: "Ayuntamientos",
    searchSport: "Deporte",
    searchAllSports: "Todos los deportes",
    searchAccessible: "Solo con acceso sin barreras",
    searchResults: "instalaciones encontradas",
    searchOne: "instalación encontrada",
    searchEmpty: "No hay instalaciones con estos filtros.",
    searchEmptyHint: "Prueba con otro deporte o añade más ayuntamientos.",
    searchClear: "Quitar filtros",
    searchStepFree: "Acceso sin barreras",
    searchBook: "Ver horarios y reservar",
    searchLoading: "Buscando instalaciones…",
    searchError: "No pudimos cargar las instalaciones.",
    searchRetry: "Volver a intentar",
    searchBack: "Volver a la portada",
    searchCta: "Busca instalaciones en tu entorno",
    sports: {
      padel: "Pádel",
      tennis: "Tenis",
      futsal: "Fútbol sala",
      swimming: "Natación",
    },
    footerAccessibility: "Declaración de accesibilidad",
    a11yDocumentTitle: "Declaración de accesibilidad · Quenda",
    a11yBack: "Volver al inicio",
    a11yTitle: "Declaración de accesibilidad",
    a11yIntro:
      "Quenda se compromete a hacer accesible este sitio web informativo, de conformidad con el Real Decreto 1112/2018, de 7 de septiembre, sobre accesibilidad de los sitios web y aplicaciones para dispositivos móviles del sector público.",
    a11yStatusTitle: "Situación de cumplimiento",
    a11yStatus:
      "Este sitio web es parcialmente conforme con el RD 1112/2018. Norma de referencia: WCAG 2.1 nivel AA y norma EN 301 549.",
    a11yContentTitle: "Contenido no accesible",
    a11yContent:
      "Aún no se ha hecho la revisión manual con tecnologías de apoyo (lectores de pantalla, ampliadores y control por voz), por lo que pueden existir barreras que las pruebas automáticas no detectan.",
    a11yPreparationTitle: "Preparación de esta declaración",
    a11yPreparation:
      "Declaración preparada el 27 de octubre de 2026 mediante autoevaluación del equipo del proyecto, con análisis automáticos axe (WCAG 2.1 AA) en cada cambio del código. Se revisa al menos una vez al año.",
    a11yContactTitle: "Observaciones y datos de contacto",
    a11yContact:
      "Para comunicar una barrera en este sitio web, abre una incidencia en el repositorio público del proyecto.",
    a11yContactLink: "Abrir una incidencia en GitHub",
    a11yMunicipalTitle: "Declaración de cada ayuntamiento",
    a11yMunicipal:
      "Cada ayuntamiento que usa Quenda publica su propia declaración en la aplicación, con la unidad responsable, el correo y el teléfono. Dirígele a ella las solicitudes de información accesible, las quejas y las reclamaciones sobre el servicio de reservas, que se responden en un plazo máximo de 20 días hábiles.",
    a11yMunicipalLink: "Ir a la aplicación de tu ayuntamiento",
  },
};
