# Soporte

El soporte se da **mediante incidencias en el repositorio de GitHub**:
<https://github.com/DavidPombar/quenda/issues>. Así cada problema y su solución quedan
públicos y sirven al resto de concellos, y no depende de un contrato con un proveedor.

## Cómo abrir una incidencia

Antes, busque si ya existe una abierta. En la nueva, indique:

- **Instancia y versión:** dominio y salida de `git describe --tags` en `/opt/quenda`.
- **Qué pasó y qué esperaba**, con los pasos para repetirlo.
- **Quién lo nota:** ciudadanía, gestor, puerta u operación.
- **Registros** del momento, sin datos personales:
  `sudo docker compose -f deploy/compose.prod.yml logs --since 1h api worker`.
- **Capturas**, tapando nombres, correos y NIF.

**Nunca publique datos personales, contraseñas, secretos ni copias de la base en una
incidencia.** Los fallos de seguridad no van en incidencias públicas: siga la
[política de seguridad](../../SECURITY.md).

## Primera temporada

Compromiso propuesto para la memoria (por confirmar antes de entregarla). Durante la
primera temporada de cada concello piloto:

- se revisan las incidencias **cada día laborable**;
- un fallo que impida reservar o entrar en una instalación se atiende primero;
- los avisos recurrentes de la ciudadanía que llegan al concello se agrupan en una sola
  incidencia, con la etiqueta del concello;
- al terminar la temporada, una revisión con el concello decide qué entra en la
  siguiente versión.

Son objetivos de servicio de un proyecto de software libre, no un acuerdo de nivel de
servicio con penalizaciones. Un concello o una deputación que necesite un contrato de
soporte con plazos garantizados puede contratarlo con cualquier empresa: el código y
esta documentación son públicos.

## Quién hace qué

| Quién                                   | Atiende                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Personal de deportes del concello       | Dudas de la ciudadanía, configuración de instalaciones, horarios y normas  |
| Gestor del concello en Quenda           | Abre incidencias de funcionamiento con lo que ve en el backoffice          |
| Técnico del concello o de la deputación | Servidor, copias, actualizaciones, correo y DNS; abre incidencias técnicas |
| Proyecto Quenda (GitHub)                | Fallos y mejoras del software, nuevas versiones                            |
