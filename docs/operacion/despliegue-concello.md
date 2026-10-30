# Despliegue en un concello: Docker Compose con TLS

Una instancia en un servidor del concello, con certificado TLS automático y copia de
seguridad cada noche. Se tarda alrededor de una hora contando la espera del DNS. Antes,
revise los [requisitos del servidor](README.md#requisitos-del-servidor).

## 1. Preparar el servidor

Instale Docker Engine y el plugin Compose siguiendo la guía oficial de Docker para su
distribución, y compruebe:

```bash
docker compose version
```

Cree el registro DNS del dominio (por ejemplo `reservas.concello.gal`) hacia la IP
pública del servidor y abra los puertos 80 y 443. Compruebe que el nombre ya resuelve
antes de seguir:

```bash
getent hosts reservas.concello.gal
```

## 2. Descargar Quenda

```bash
sudo git clone https://github.com/DavidPombar/quenda.git /opt/quenda
```

En producción use una versión etiquetada (`vX.Y.Z`, ver el
[registro de cambios](../../CHANGELOG.md)) con `sudo git checkout vX.Y.Z` dentro de
`/opt/quenda`. Mientras no haya ninguna publicada, quédese en `main`.

Los comandos que siguen se ejecutan dentro de `/opt/quenda`.

## 3. Configurar

Hay dos ficheros, los dos en `deploy/` y fuera del control de versiones:

- **`deploy/.env`**: dominio, base de datos y copias. Lo lee Docker Compose.
- **`deploy/quenda.env`**: secretos y servicios de la aplicación. Lo leen la API y el
  worker.

```bash
sudo cp deploy/prod.env.example deploy/.env
```

```bash
sudo cp deploy/quenda.env.example deploy/quenda.env
```

```bash
sudo chmod 600 deploy/.env deploy/quenda.env
```

Genere cada secreto con `openssl rand -base64 32` y rellene:

| Fichero      | Variable                          | Valor                                                                                                            |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.env`       | `QUENDA_DOMAIN`                   | El dominio, sin `https://`                                                                                       |
| `.env`       | `POSTGRES_PASSWORD`               | Un secreto nuevo                                                                                                 |
| `.env`       | `RESTIC_PASSWORD`                 | Un secreto nuevo; guárdelo también fuera del servidor                                                            |
| `.env`       | `RESTIC_REPOSITORY`, `BACKUP_DIR` | Dónde van las copias ([copias de seguridad](copias-de-seguridad.md))                                             |
| `quenda.env` | `ACCESS_KEY_SECRET`               | Un secreto nuevo                                                                                                 |
| `quenda.env` | `UNSUBSCRIBE_SECRET`              | Un secreto nuevo                                                                                                 |
| `quenda.env` | `SMTP_URL`, `MAIL_FROM`           | El servidor de correo del concello o de la deputación                                                            |
| `quenda.env` | `VAPID_*`                         | Opcional: avisos push. Se generan una vez con `npx web-push generate-vapid-keys` en cualquier equipo con Node.js |
| `quenda.env` | `QUENDA_DATA_KEY`                 | Un secreto nuevo: cifra el segundo factor del personal y, si se usa, el NIF                                      |

Deje comentado lo que no use: una variable vacía no es lo mismo que una variable sin
definir.

## 4. Arrancar

```bash
sudo docker compose -f deploy/compose.prod.yml up -d --build --wait
```

La primera vez construye las imágenes (unos minutos), crea la base de datos, aplica las
migraciones, pide el certificado a Let's Encrypt y programa las copias. Cuando termina,
todos los servicios están `healthy`:

```bash
sudo docker compose -f deploy/compose.prod.yml ps
```

## 5. Comprobar

1. Abra `https://reservas.concello.gal/`: la web carga con candado y sin avisos.
2. `http://reservas.concello.gal/` redirige a `https://`.
3. Las cabeceras de seguridad y la cookie `Secure`, desde cualquier equipo con el
   repositorio y Node.js:

   ```bash
   HEADERS_URL=https://reservas.concello.gal EXPECT_SECURE_COOKIE=true npm run test:headers
   ```

4. Haga la primera copia sin esperar a la noche y mire que acaba con `no errors were
found`:

   ```bash
   sudo docker compose -f deploy/compose.prod.yml exec backup backup.sh
   ```

5. Haga un simulacro de restauración en una base aparte, como se explica en
   [copias de seguridad](copias-de-seguridad.md#simulacro-sin-tocar-la-base-en-uso).

La instancia está vacía: siga con el [alta de un concello](alta-concello.md).

## Funcionamiento diario

- **Registros:** `sudo docker compose -f deploy/compose.prod.yml logs --since 1h api worker`.
- **Reinicios:** todos los servicios tienen `restart: unless-stopped` y vuelven solos tras
  un reinicio del servidor.
- **Supervisión:** basta con vigilar desde fuera que
  `https://reservas.concello.gal/v2/public/municipalities` responde 200. Esa ruta pasa
  por nginx, la API y PostgreSQL.
- **Espacio en disco:** `docker system df` y el tamaño del directorio de copias.
- **Certificado:** Caddy lo renueva solo 30 días antes de caducar; los datos de Caddy
  están en el volumen `caddy-data`.

## Problemas frecuentes

| Síntoma                                         | Causa probable                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `set QUENDA_DOMAIN` u otra variable al arrancar | Falta un valor obligatorio en `deploy/.env`                                               |
| La API no llega a `healthy`                     | Mire `logs api`: suele faltar `ACCESS_KEY_SECRET` o haber un valor vacío en `quenda.env`  |
| Caddy no obtiene el certificado                 | El DNS aún no apunta al servidor o el puerto 80 está cerrado                              |
| No llegan correos                               | `SMTP_URL` incorrecto o el relé no acepta el remitente de `MAIL_FROM`; mire `logs worker` |
| Los enlaces de los correos apuntan a otro sitio | `QUENDA_DOMAIN` no es el dominio público                                                  |
