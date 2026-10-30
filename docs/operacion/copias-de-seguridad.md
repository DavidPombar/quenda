# Copias de seguridad y restauración

## Qué se copia

**Todos los datos de Quenda están en PostgreSQL**: concellos, instalaciones, reservas,
cuentas, avisos, auditoría, y también los logos, iconos y fotos (como `bytea`). La
aplicación no escribe ficheros en disco. Una copia de la base de datos es una copia
completa.

Lo que **no** está en la base y hay que guardar aparte una vez (ver
[README](README.md#lo-que-hay-que-guardar-fuera-del-servidor)): `deploy/.env`,
`deploy/quenda.env` y, sobre todo, `RESTIC_PASSWORD`. Sin esa contraseña ninguna copia
se puede leer.

## Cómo funciona

El servicio `backup` de `deploy/compose.prod.yml` (imagen en `deploy/backup/`):

1. al arrancar, crea el repositorio de [restic](https://restic.net/) (BSD-2-Clause) si no
   existe;
2. a la hora de `BACKUP_SCHEDULE` (por defecto las 03:30, hora de
   `DEPLOYMENT_TIMEZONE`) ejecuta `backup.sh`:
   - `pg_dump` en formato _custom_, enviado directamente a restic, que lo **cifra**
     (AES-256) y lo deduplica;
   - `restic forget --prune` con la política `BACKUP_KEEP`, por defecto 7 diarias, 5
     semanales y 12 mensuales;
   - `restic check`, que verifica el repositorio;
3. escribe el resultado en sus registros: `logs backup`.

Si `pg_dump` falla, la copia se interrumpe y no se guarda una copia a medias.

## Dónde guardar las copias

`RESTIC_REPOSITORY` decide el destino. Siga la regla 3-2-1: tres copias, en dos soportes,
una fuera del edificio.

| Destino                     | `RESTIC_REPOSITORY`                                                                                  | Cuándo                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Disco del servidor          | `/backups` (por defecto), montado desde `BACKUP_DIR`                                                 | Solo si `BACKUP_DIR` es **otro disco**. No basta como única copia |
| S3 o MinIO de la deputación | `s3:https://minio.deputacion.gal/quenda-vilaverde` con `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` | Recomendado: fuera del servidor y del edificio                    |
| SFTP                        | `sftp:copias@copias.deputacion.gal:/quenda`                                                          | Si la deputación ofrece un servidor de copias por SSH             |

Para el SFTP el contenedor necesita la clave SSH: monte `~/.ssh` del usuario de copias
en `/root/.ssh` del servicio `backup`.

## Operaciones

**Copia inmediata**, antes de una actualización o un cambio grande:

```bash
sudo docker compose -f deploy/compose.prod.yml exec backup backup.sh
```

**Ver las copias:**

```bash
sudo docker compose -f deploy/compose.prod.yml exec backup restic snapshots
```

### Simulacro sin tocar la base en uso

Restaura la última copia en una base aparte, la comprueba y la borra. Hágalo al poner la
instancia en marcha y después cada trimestre:

```bash
sudo docker compose -f deploy/compose.prod.yml exec backup sh -c 'createdb quenda_simulacro && restore.sh latest quenda_simulacro && psql -d quenda_simulacro -c "SELECT slug, name FROM municipalities" && dropdb quenda_simulacro'
```

Debe listar los concellos de la instancia. Anote la fecha del simulacro: el ENS pide
poder demostrar que las copias se restauran (medida `mp.info.6`).

### Restaurar la instancia

Cuando hay que volver a un punto anterior (un error grave, una actualización fallida):

1. Pare la API y los procesos, para que nadie escriba durante la restauración:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml stop api worker retention
   ```

2. Elija la copia (`restic snapshots`) y restáurela. Sin identificador, usa la última:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml exec backup restore.sh <id-de-la-copia>
   ```

   La restauración va en una sola transacción: si falla, la base queda como estaba.

3. Vuelva a arrancar:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml start api worker retention
   ```

Se pierde lo ocurrido desde la copia restaurada. Avise a los concellos para que revisen
las reservas de ese intervalo.

### Servidor nuevo desde cero

1. Instale como en el [despliegue](despliegue-concello.md), con los mismos `deploy/.env` y
   `deploy/quenda.env` guardados, y la **misma versión** de Quenda que tenía la copia.
2. Arranque solo la base y el servicio de copias:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml up -d --build --wait db backup
   ```

3. Restaure la última copia con `restore.sh` y arranque el resto con `up -d --wait`.
