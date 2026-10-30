# Operación de Quenda

Guía para el personal técnico de un concello o de una deputación que instala y mantiene
Quenda (#27). Cubre la viabilidad de implantación (apartado 5 de la memoria) y los
requisitos R1 y T4.

| Guía                                                     | Para qué                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Despliegue en un concello](despliegue-concello.md)      | Un servidor propio con Docker Compose, TLS automático y copias programadas |
| [Despliegue en una deputación](despliegue-deputacion.md) | Una instancia para varios concellos con Coolify; k3s como alternativa      |
| [Alta de un concello](alta-concello.md)                  | Crear el concello, su primer gestor y dejarlo listo para abrir             |
| [Copias de seguridad](copias-de-seguridad.md)            | Qué se copia, dónde, cómo restaurar y cómo comprobarlo                     |
| [Actualización](actualizacion.md)                        | Pasar de una versión a otra y volver atrás                                 |
| [Soporte](soporte.md)                                    | Cómo pedir ayuda la primera temporada                                      |
| [Plan de implantación](plan-implantacion.md)             | Doce semanas del convenio a la primera temporada                           |
| [Kit ENS (borrador)](ens/README.md)                      | Análisis de riesgos, declaración de aplicabilidad y de conformidad         |

## Requisitos del servidor

Cifras orientativas, sin pruebas de carga todavía:

- **Máquina:** 2 vCPU, 4 GB de RAM y 40 GB de disco SSD para un concello pequeño (hasta
  unas 20 instalaciones y unos miles de personas usuarias). Una deputación con 20–50
  concellos en una sola instancia: 4 vCPU, 8 GB y 100 GB.
- **Sistema:** Linux de 64 bits (x86_64 o arm64) con Docker Engine y el plugin Compose
  v2 (`docker compose`), por ejemplo Debian 12 o Ubuntu 24.04.
- **Red:**
  - un nombre de dominio, por ejemplo `reservas.concello.gal`, con un registro A/AAAA
    hacia el servidor;
  - los puertos 80 y 443 abiertos desde Internet, para el certificado de Let's Encrypt y
    el tráfico;
  - salida SMTP hacia el servidor de correo del concello o de la deputación.
- **Copias:** un segundo disco o, mejor, un almacenamiento externo (S3, MinIO o SFTP de
  la deputación). Ver [copias de seguridad](copias-de-seguridad.md).
- **Hosting:** para el ENS conviene un CPD propio o un proveedor con certificación ENS de
  la categoría del sistema. Ver el [kit ENS](ens/README.md).

No hace falta Node.js en el servidor: todo va en contenedores construidos desde el
repositorio.

## Qué se instala

`deploy/compose.prod.yml` arranca estos servicios, todos con licencia libre:

| Servicio    | Imagen              | Qué hace                                                                                          |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `db`        | PostgreSQL 17       | Todos los datos: concellos, reservas, logos y fotos. No publica ningún puerto                     |
| `api`       | Quenda (Node.js)    | La API. Aplica las migraciones pendientes al arrancar                                             |
| `worker`    | Quenda              | Envía avisos, recordatorios y códigos de acceso por correo y Web Push                             |
| `retention` | Quenda              | Aplica una vez al día la política de conservación de cada concello (RGPD)                         |
| `web`       | nginx               | Sirve la web pública (`/`), la app ciudadana (`/app/`) y el backoffice (`/admin/`), y pasa la API |
| `caddy`     | Caddy 2             | TLS con certificados de Let's Encrypt renovados solos, y HSTS                                     |
| `backup`    | PostgreSQL + restic | Copia cifrada cada noche, poda de copias antiguas y comprobación del repositorio                  |

## Lo que hay que guardar fuera del servidor

Si se pierde el servidor, con esto se reconstruye todo:

1. **El repositorio de copias** (restic) y su contraseña, `RESTIC_PASSWORD`.
2. **Los secretos de la aplicación** de `deploy/quenda.env`:
   - `ACCESS_KEY_SECRET`: sin él, cada gestor tiene que rotar la clave de acceso QR y
     el secreto del webhook;
   - `QUENDA_DATA_KEY`: sin él, los NIF guardados no se pueden leer y todo el personal
     tiene que restablecer su cuenta para volver a activar el segundo factor;
   - el par VAPID: sin él, cada dispositivo tiene que volver a activar los avisos.
3. **`deploy/.env`** y **`deploy/quenda.env`** completos.

Guárdelos en el gestor de contraseñas o en la caja fuerte de credenciales del concello,
no en el mismo servidor.
