# Alta de un concello

El personal entra con **cuentas locales**: un usuario, una contraseña y un código de una
app de autenticación (segundo factor). Hay tres papeles:

- **Operación** (la deputación, o el técnico del concello en una instancia propia): da de
  alta concellos y sus gestores en `/admin/operador`.
- **Xestión** del concello: configura el concello y crea las cuentas de su personal de
  puerta.
- **Control de accesos:** la página de puerta.

La primera cuenta de operación se crea en el servidor; el resto se hace desde el
backoffice. Detalles técnicos en [identidad](../architecture/identity.md).

Necesita `QUENDA_DATA_KEY` en `deploy/quenda.env`: cifra el segundo factor.

## 1. Primera cuenta de operación (una vez por instancia)

En `/opt/quenda`:

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/staff.js create --operator --login operacion --name "Deputación · operación"
```

El comando muestra **una sola vez** una contraseña temporal. Entréguela a la persona por un
canal seguro. Con la misma orden y otro `--login` puede crear más cuentas de operación. Si
alguien pierde la contraseña o el móvil, se restablece así:

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/staff.js reset --operator --login operacion
```

En la primera entrada, en `https://<dominio>/admin/operador`, la persona cambia la
contraseña temporal y escanea el código QR con una app de autenticación libre (por
ejemplo FreeOTP o Aegis), o con la que use su organización.

## 2. Preparar los datos del concello

Pida al concello:

- **Nombre** tal como debe verse, por ejemplo «Concello de Vilaverde».
- **Identificador** para las direcciones: minúsculas, números y guiones, por ejemplo
  `vilaverde`. Las direcciones serán `/app/vilaverde/` y `/admin/vilaverde/`.
- **Contacto** para la ciudadanía, por ejemplo «Deportes: 986 000 000,
  deportes@vilaverde.gal».
- **Nombre y correo de trabajo** de cada persona gestora.
- **Aviso de privacidad** en gallego y en castellano, aprobado por su delegado o
  delegada de protección de datos. Puede partir del
  [registro de actividades de tratamiento](../legal/registro-actividades-tratamiento.md).

## 3. Dar de alta el concello y sus gestores

En `https://<dominio>/admin/operador`, en **Concellos**:

1. **Novo concello:** nombre, identificador, huso horario, idioma, contacto y el aviso de
   privacidad en gallego y en castellano, y **Dar de alta**. Las normas
   de reserva empiezan en 14 días de antelación, 2 horas para cancelar y 5 reservas
   activas por persona; el gestor las cambia después.
2. En el concello, **Engadir xestor/a** con su nombre, correo de trabajo y usuario. Se
   muestra una vez la contraseña temporal: entréguela por un canal seguro.
3. **Restablecer a conta** da una contraseña temporal nueva si la persona la pierde o
   pierde el móvil.

El área de operación solo muestra configuración y cifras agregadas: nunca reservas ni
datos personales.

**Instancia de un solo concello:** con el concello ya dado de alta, los gestores también
se pueden crear desde el servidor:

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/staff.js create --slug vilaverde --login ana.rivas --name "Ana Rivas"
```

## 4. Primera entrada del gestor

La persona gestora abre `https://<dominio>/admin/vilaverde/`, entra con su usuario y la
contraseña temporal, elige una contraseña nueva y activa el segundo factor con el código
QR.

## 5. Configurar y abrir

Con la persona gestora, en el backoffice:

1. **Axustes:** logo, color, idioma, textos legales, normas de reserva, penalizaciones y datos abiertos (licencia y código
   DIR3). La declaración de accesibilidad tiene su propia página.
2. **Persoal:** las cuentas de control de accesos de la puerta, que se restablecen o
   desactivan desde ahí.
3. **Instalacións:** cada instalación con sus pistas, horario (o importación `.ics`),
   fotos, normas y tarifas.
4. **Temporadas**, si hay reparto a clubes.
5. **Una reserva de prueba** desde la app con una cuenta personal, cancelada después.
6. **Publicar** el enlace `https://<dominio>/app/vilaverde/` en la web del concello.

## Traer un concello desde otra instancia

Si el concello ya usaba Quenda en otra instancia (por ejemplo, la de un piloto o la de otra
deputación), su gestor exporta los datos (**Exportar datos** en el backoffice) y aquí se
importan:

```bash
sudo docker compose -f deploy/compose.prod.yml run --rm -v /opt/quenda/altas:/altas:ro api node backend/dist/database/import.js /altas/vilaverde-export.json
```

`--slug otro-nombre` lo importa con otro identificador. Las cuentas del personal no viajan
en la exportación: se crean de nuevo en esta instancia (pasos 3 y 4). Detalles en
[portabilidad de datos](../architecture/data-portability.md).

## Lo que aún no se puede hacer desde aquí

- **Cambiar el plazo de conservación:** cada concello guarda el historial 24 meses por
  defecto y el backoffice aún no permite cambiarlo. Si el concello necesita otro plazo,
  abra una incidencia.
- **Dar de baja un concello:** no hay función. Exporte sus datos y abra una incidencia
  ([soporte](soporte.md)).
