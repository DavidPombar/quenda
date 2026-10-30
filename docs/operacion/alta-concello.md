# Alta de un concello

Se hace desde el servidor, con dos comandos de la imagen de Quenda. Cada acción queda en
el registro de operación a nombre de «Consola do servidor». Los dos comandos se pueden
repetir sin duplicar nada.

> **Por qué desde el servidor.** El panel de operación del backoffice (`/admin/operador`)
> solo funciona en la demo: el personal de la deputación aún no entra con una identidad
> real (#8). Hasta entonces, estos comandos lo sustituyen.

Los comandos se ejecutan en `/opt/quenda`.

## 1. Preparar los datos

Pida al concello:

- **Nombre** tal como debe verse, por ejemplo «Concello de Vilaverde».
- **Identificador** para las direcciones: minúsculas, números y guiones, por ejemplo
  `vilaverde`. Las direcciones serán `/app/vilaverde/` y `/admin/vilaverde/`.
- **Contacto** para la ciudadanía, por ejemplo «Deportes: 986 000 000,
  deportes@vilaverde.gal».
- **Aviso de privacidad** en gallego y en castellano, aprobado por su delegado o
  delegada de protección de datos. Puede partir del
  [registro de actividades de tratamiento](../legal/registro-actividades-tratamiento.md).
  Guárdelos como texto plano en el servidor, por ejemplo en `/opt/quenda/altas/vilaverde/`
  como `gl.txt` y `es.txt`.
- **Correo de la persona gestora**, que no debe tener ya una cuenta de ciudadanía en ese
  concello.

## 2. Crear el concello

El comando monta la carpeta con los avisos dentro de un contenedor temporal:

```bash
sudo docker compose -f deploy/compose.prod.yml run --rm -v /opt/quenda/altas/vilaverde:/altas:ro api node backend/dist/database/create-municipality.js --slug vilaverde --name "Concello de Vilaverde" --contact "Deportes: 986 000 000, deportes@vilaverde.gal" --privacy-gl /altas/gl.txt --privacy-es /altas/es.txt
```

Opciones: `--timezone` (por defecto `Europe/Madrid`) y `--locale gl|es` (idioma por
defecto, `gl`). Las normas de reserva empiezan en 14 días de antelación, 2 horas para
cancelar y 5 reservas activas por persona; el gestor las cambia después.

## 3. Dar de alta a la persona gestora

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/add-manager.js --municipality vilaverde --name "Ana Rivas" --email ana.rivas@vilaverde.gal
```

Puede repetirlo para cada gestor. Para entrar, la persona gestora:

1. abre `https://<dominio>/app/vilaverde/`, pulsa **Entrar** y elige **Entrar co
   correo**;
2. escribe el código de seis cifras que recibe;
3. abre `https://<dominio>/admin/vilaverde/`, que ya la reconoce como gestora.

Esto necesita `SMTP_URL` configurado. Cuando la instancia tenga Cl@ve, la persona
gestora podrá entrar también así, siempre que se vincule su identidad (#8).

## 4. Configurar y abrir

Con la persona gestora, en el backoffice:

1. **Axustes:** logo, color, idioma, textos legales, normas de reserva, penalizaciones
   y datos abiertos (licencia y código DIR3). La declaración de accesibilidad tiene su
   propia página en el backoffice.
2. **Instalacións:** cada instalación con sus pistas, horario (o importación `.ics`),
   fotos, normas y tarifas.
3. **Temporadas**, si hay reparto a clubes.
4. **Una reserva de prueba** desde la app con una cuenta personal, cancelada después.
5. **Publicar** el enlace `https://<dominio>/app/vilaverde/` en la web del concello.

## Traer un concello desde otra instancia

Si el concello ya usaba Quenda en otra instancia (por ejemplo, la demo de un piloto o la
instancia de otra deputación), su gestor exporta los datos (**Exportar datos** en el
backoffice) y aquí se importan:

```bash
sudo docker compose -f deploy/compose.prod.yml run --rm -v /opt/quenda/altas:/altas:ro api node backend/dist/database/import.js /altas/vilaverde-export.json
```

`--slug otro-nombre` lo importa con otro identificador. Detalles en
[portabilidad de datos](../architecture/data-portability.md).

## Lo que aún no se puede hacer desde aquí

- **Personal de acceso** (rol `access`, la página de puerta): no hay comando. Mientras
  tanto, la persona gestora hace el control de acceso, que también puede usar la página
  de puerta.
- **Cambiar el plazo de conservación:** cada concello guarda el historial 24 meses por
  defecto y el backoffice aún no permite cambiarlo. Si el concello necesita otro plazo,
  abra una incidencia.
- **Dar de baja un concello:** no hay comando. Exporte sus datos y abra una incidencia
  ([soporte](soporte.md)).
