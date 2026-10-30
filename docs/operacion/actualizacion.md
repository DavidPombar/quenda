# Actualización entre versiones

Quenda se publica con [versionado semántico](https://semver.org/lang/es/) y cada versión
describe sus cambios en el [registro de cambios](../../CHANGELOG.md):

- **Parche** (`0.2.0 → 0.2.1`): correcciones. Se aplica en cuanto sale.
- **Menor** (`0.2 → 0.3`): funciones nuevas compatibles. Puede traer migraciones.
- **Mayor** (`1.x → 2.0`): puede requerir pasos manuales, descritos en el registro de
  cambios. Léalos antes.

## Qué hacen las migraciones

La API aplica al arrancar las migraciones de base de datos pendientes
(`node backend/dist/database/migrate.js`):

- cada migración va en su propia transacción y queda anotada en `schema_migrations`;
- si dos procesos arrancan a la vez, un bloqueo hace que solo uno las aplique;
- si una migración ya aplicada cambió, la API se niega a arrancar en vez de seguir con
  una base inconsistente.

No hay migraciones «hacia atrás»: volver a una versión anterior es restaurar la copia
hecha antes de actualizar. Detalles en [migraciones](../architecture/migrations.md).

## Pasos

Elija una ventana de poco uso, por ejemplo de noche o un lunes por la mañana; el corte
dura unos minutos. Los comandos se ejecutan en `/opt/quenda`.

1. **Lea** el registro de cambios entre su versión y la nueva.
2. **Copia inmediata**, y compruebe que acaba sin errores:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml exec backup backup.sh
   ```

3. **Descargue** la versión nueva:

   ```bash
   sudo git fetch --tags && sudo git checkout vX.Y.Z
   ```

4. **Compare** los ficheros de ejemplo con los suyos, por si hay variables nuevas:

   ```bash
   git diff vANTERIOR vX.Y.Z -- deploy/prod.env.example deploy/quenda.env.example
   ```

5. **Construya y arranque.** Compose recrea solo lo que cambia; la API migra al
   arrancar:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml up -d --build --wait
   ```

6. **Compruebe** la web, una reserva de prueba y `logs api` sin errores.

En Coolify, los pasos 3 a 5 son cambiar la etiqueta del recurso y pulsar _Redeploy_.

## Si algo sale mal

1. Vuelva al código anterior: `sudo git checkout vANTERIOR`.
2. Si la versión nueva ya migró la base, restaure la copia del paso 2
   ([restaurar la instancia](copias-de-seguridad.md#restaurar-la-instancia)).
3. Arranque: `sudo docker compose -f deploy/compose.prod.yml up -d --build --wait`.
4. Abra una incidencia con los registros ([soporte](soporte.md)).

## Actualizar las piezas de terceros

- **PostgreSQL, nginx, Caddy y la base de las imágenes:** llegan con las versiones de
  Quenda, que fijan sus etiquetas. Para traer parches de seguridad de esas imágenes sin
  cambiar de versión de Quenda, reconstruya con
  `sudo docker compose -f deploy/compose.prod.yml build --pull` y arranque.
- **Saltos de versión mayor de PostgreSQL** (17 → 18): no se hacen solos. Requieren
  volcado y restauración; el registro de cambios de esa versión de Quenda dirá cómo.
- **El sistema operativo y Docker:** con las actualizaciones de seguridad habituales del
  servidor.
