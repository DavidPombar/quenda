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

## 3. Instalar

```bash
sudo QUENDA_DOMAIN=reservas.concello.gal SMTP_URL=smtp://usuario:contrasinal@smtp.concello.gal:587 MAIL_FROM=reservas@concello.gal sh deploy/install.sh
```

`deploy/install.sh`:

- añade 4 GB de swap si el servidor tiene menos de 4 GB de RAM, porque construir las
  imágenes lo necesita;
- instala las actualizaciones automáticas de seguridad (`unattended-upgrades`);
- deja el SSH solo con clave, si `root` ya tiene una clave autorizada;
- escribe `deploy/.env` y `deploy/quenda.env` (ver abajo) con secretos nuevos y permisos
  `600`;
- construye las imágenes y arranca todos los servicios.

Variables opcionales: `DEPLOYMENT_TIMEZONE`, y `RESTIC_REPOSITORY` o `BACKUP_DIR` para el
destino de las copias ([copias de seguridad](copias-de-seguridad.md)). Sin ellas, las copias
van a `deploy/backups/` en el mismo servidor: cámbielo antes de tratar datos reales.

Se puede volver a ejecutar: conserva los ficheros que ya existen y solo reconstruye y
reinicia los contenedores.

**Guarde una copia de `deploy/.env` y `deploy/quenda.env` fuera del servidor** (ver
[lo que hay que guardar](README.md#lo-que-hay-que-guardar-fuera-del-servidor)).

### Configuración a mano

Si prefiere no usar el script, o el servidor ya está preparado, hay dos ficheros, los dos en
`deploy/` y fuera del control de versiones:

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

#### Servidor de mapas

La ficha de cada instalación muestra un mapa. Por defecto las teselas salen de los
servidores de OpenStreetMap, que mantienen voluntarios: su
[política de uso](https://operations.osmfoundation.org/policies/tiles/) admite un uso
moderado como el de una demo, pero desaconseja el uso intenso. En producción, use el
servidor de teselas de la deputación, uno propio o un proveedor comercial:

| Fichero      | Variable          | Valor                                                                                        |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------- |
| `quenda.env` | `MAP_TILE_URL`    | Plantilla XYZ con `{z}`, `{x}` e `{y}`, p. ej. `https://teselas.example.gal/{z}/{x}/{y}.png` |
| `quenda.env` | `MAP_ATTRIBUTION` | La atribución que exija el proveedor                                                         |
| `.env`       | `MAP_TILE_ORIGIN` | El origen del mismo servidor (`https://teselas.example.gal`), para la CSP                    |

El servidor de teselas recibe la IP de cada visitante y, como `Referer`, solo el origen de
la web (nunca la página que se mira); el aviso de privacidad debe decirlo. Si el mapa
muestra «Access blocked», el servidor rechaza las peticiones: revise que la instancia sea la
versión actual y, si el uso es intenso, cambie de servidor.

#### Arrancar

```bash
sudo docker compose -f deploy/compose.prod.yml up -d --build --wait
```

La primera vez construye las imágenes (unos minutos), crea la base de datos, aplica las
migraciones, pide el certificado a Let's Encrypt y programa las copias. Cuando termina,
todos los servicios están `healthy`:

```bash
sudo docker compose -f deploy/compose.prod.yml ps
```

## 4. Comprobar

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
| El mapa muestra «Access blocked»                | Vea [servidor de mapas](#servidor-de-mapas): el servidor rechaza las teselas              |

## Demo pública

La misma instalación sirve para una demostración con concellos y cuentas ficticios. Con
`DEMO_MODE=true` la API carga los datos de demostración al arrancar y la entrada por correo
queda desactivada, porque nadie podría leer los códigos:

```bash
sudo QUENDA_DOMAIN=203-0-113-10.sslip.io DEMO_MODE=true sh deploy/install.sh
```

Sin dominio propio, `<ip-con-guiones>.sslip.io` resuelve a la IP del servidor y vale para
Let's Encrypt. No use nunca `DEMO_MODE=true` con datos reales.

## Ejemplo: servidor en Hetzner Cloud

La demo de referencia corre en un Hetzner CPX12 (Núremberg) con la imagen `docker-ce`, que
ya trae Docker. Con la herramienta `hcloud`:

```bash
hcloud ssh-key create --name yo --public-key-from-file ~/.ssh/id_ed25519.pub
```

```bash
hcloud firewall create --name quenda-web
```

```bash
for p in 22 80 443; do hcloud firewall add-rule quenda-web --direction in --protocol tcp --port $p --source-ips 0.0.0.0/0 --source-ips ::/0; done
```

```bash
hcloud firewall add-rule quenda-web --direction in --protocol udp --port 443 --source-ips 0.0.0.0/0 --source-ips ::/0
```

```bash
hcloud server create --name quenda --type cpx12 --image docker-ce --location nbg1 --ssh-key yo --firewall quenda-web
```

Después, por SSH, siga desde el [paso 2](#2-descargar-quenda). Hetzner bloquea la salida por
los puertos 25 y 465 en servidores nuevos: el correo tiene que ir por un proveedor SMTP en el
puerto 587. Cualquier otro proveedor o un servidor propio sirven igual: nada de la
instalación depende de Hetzner.
