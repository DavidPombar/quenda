# Despliegue en una deputación: varios concellos en una instancia

Quenda es multi-municipio (R3): una sola instancia da servicio a todos los concellos que
se adhieran por convenio, cada uno con sus datos aislados, su marca, sus normas y su
gestor. Es el modelo que ya usan las deputacións de A Coruña y Pontevedra para otras
plataformas compartidas ([investigación](../investigacion/00-resumen-ejecutivo.md)).

- **Una instancia** con el dominio de la deputación, por ejemplo
  `reservas.dacoruna.gal`. Cada concello vive en `/app/<concello>/` y
  `/admin/<concello>/`.
- **Una base de datos**, una copia y una actualización para todos.
- **El personal de la deputación**, con su cuenta de operación, da de alta cada concello y
  sus gestores en `/admin/operador` ([alta de un concello](alta-concello.md)). Desde ahí,
  cada concello se gestiona solo.

Recomendamos **Coolify**. Si la deputación ya trabaja con Kubernetes, ver
[k3s](#alternativa-k3s).

## Con Coolify

[Coolify](https://coolify.io/) (Apache-2.0) es un panel autoalojado para desplegar
aplicaciones con Docker. Pone su propio proxy con TLS y renueva los certificados, así que
Quenda no necesita Caddy. Ayuda al personal que no trabaja a diario con contenedores:
despliegues desde la web, variables, registros y reinicios.

1. **Instalar Coolify** en el servidor siguiendo su documentación, y añadir el servidor
   si es distinto del de Coolify.
2. **Crear el recurso:** en un proyecto, _New resource → Public repository_ con
   `https://github.com/DavidPombar/quenda`, la etiqueta de la versión como rama (`vX.Y.Z`;
   `main` mientras no haya ninguna), _Build pack: Docker Compose_ y como fichero
   `/deploy/compose.prod.yml`.
3. **Variables:** en _Environment variables_, las de
   [`deploy/prod.env.example`](../../deploy/prod.env.example) **sin** `COMPOSE_PROFILES`,
   para que no arranque Caddy. Las de la aplicación van en `deploy/quenda.env`: créelo en
   el servidor dentro del directorio que Coolify usa para el recurso, con el contenido de
   [`deploy/quenda.env.example`](../../deploy/quenda.env.example), o declárelas también
   en Coolify y añada al servicio `api` y al `worker` las que necesite.
4. **Dominio:** asigne el dominio al servicio `web`, puerto 80, con `https://`. Coolify
   pide el certificado.
5. **Copias:** fije `RESTIC_REPOSITORY` en el almacenamiento de objetos de la deputación
   (por ejemplo `s3:https://minio.deputacion.gal/quenda`) con sus credenciales
   `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`.
6. **Desplegar** y seguir con la [comprobación](despliegue-concello.md#5-comprobar) y el
   [alta de los concellos](alta-concello.md). Los comandos de esas guías se ejecutan
   desde el terminal de Coolify en el contenedor indicado (`api` o `backup`).

Una actualización es cambiar la etiqueta y pulsar _Redeploy_, después de una copia
([actualización](actualizacion.md)).

> No hemos probado aún el despliegue en una instancia real de Coolify; los pasos siguen
> su documentación para recursos Docker Compose. Si algo no encaja, abra una incidencia
> ([soporte](soporte.md)).

## Alternativa: k3s

Si la deputación ya opera Kubernetes (k3s, Apache-2.0), las mismas imágenes sirven:

- `api`, `worker` y `retention` como `Deployment`s de la imagen `api`, con los secretos
  en un `Secret`;
- `web` detrás del `Ingress` de la deputación, que pone el TLS;
- PostgreSQL gestionado por la deputación o con un operador como CloudNativePG;
- las copias con el mismo `deploy/backup` como `CronJob`.

No publicamos manifiestos ni charts: un concello pequeño no necesita esta complejidad y
la deputación que la tiene ya sabe adaptar un Compose.

## Varios concellos: lo que cambia

- **Aislamiento:** los datos de cada concello van separados por su identificador en la
  API; un gestor no puede leer ni cambiar otro concello.
- **Correo:** un solo `SMTP_URL` y `MAIL_FROM` para toda la instancia.
- **Identidad:** el cliente OIDC de Cl@ve es de la instancia; la deputación da de alta
  una vez en Cl@ve ([identidad](../architecture/identity.md)).
- **Conservación de datos:** cada concello fija sus meses en su configuración; el
  servicio `retention` las aplica todas.
- **Contrato:** la deputación actúa como encargada del tratamiento de cada concello.
  Plantilla en [contrato de encargo](../legal/contrato-encargado-tratamiento.md).
