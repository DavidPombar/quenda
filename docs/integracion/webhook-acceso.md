# Control de acceso: credencial QR e webhook aberto (M3, #23)

Quenda non fabrica nin vende hardware. Cada reserva confirmada ten unha **credencial temporal asinada** que se pode comprobar sen conexión. Calquera pechadura, torno ou controlador de luces pode recibila por un **webhook aberto** e documentado. Non hai biometría nin Wiegand. Para hardware real recoméndase OSDP v2 con canle segura entre lector e controlador.

## 1. Credencial

É un JWT compacto (JWS, RFC 7515) asinado con **EdDSA / Ed25519** (RFC 8037). O QR que ve a veciñanza contén ese texto tal cal.

```
cabeceira: {"alg":"EdDSA","typ":"JWT","kid":"<id da clave>"}
claims:    {"iss":"vilaverde","sub":"<id da reserva>","fac":"<id da instalación>","nbf":1793000000,"exp":1793040000}
```

| Claim | Significado |
| --- | --- |
| `iss` | Slug do concello. Un lector só acepta o seu concello. |
| `sub` | Reserva. |
| `fac` | Instalación. Un lector pode limitarse á súa. |
| `nbf` | Segundos Unix. Primeira apertura do espazo o día da reserva, ou o comezo da reserva se é anterior. |
| `exp` | Segundos Unix. Fin da reserva. |

A credencial non leva datos persoais. Ademais da hora, válida no día da reserva desde a apertura do espazo ata o fin da reserva (resposta 3 da issue).

**Claves.** Cada concello ten a súa clave Ed25519, creada ao darlo de alta (`npm run db:seed`/`db:migrate`; tamén no primeiro uso nas instalacións anteriores). A parte privada gárdase cifrada con AES-256-GCM baixo `QUENDA_KEY_ENCRYPTION_KEY`. En produción, o servidor non arranca sen esa variable. Desde **Axustes → Control de acceso** o xestor ve a pegada e pode substituír a clave. Ao facelo, todas as credenciais anteriores deixan de valer.

**Comprobación sen conexión.** Hai que descargar unha vez a clave pública, en formato JWK OKP, de `GET /v2/access/keys` (rol `staff` ou `manager`). Despois:

1. Verificar a sinatura Ed25519 sobre `cabeceira.claims` coa clave do `kid`.
2. Comprobar que `iss` é o concello.
3. Comprobar `nbf ≤ agora < exp`.

O móbil do persoal fai exactamente isto con WebCrypto. O servidor repite as comprobacións ao rexistrar a entrada (`POST /v2/access/check-ins`). Tamén verifica o que só el sabe: que a reserva segue confirmada e sen cambios. Se se move a reserva, a credencial antiga deixa de casar.

## 2. Webhook «reserva confirmada → credencial temporal»

Configúrase en **Axustes → Control de acceso**: un enderezo HTTPS (ou `http://127.0.0.1` para probas). Ao gardar por primeira vez amósase **unha soa vez** un segredo `whsec_…`.

Cada cambio dunha reserva (alta, cambio de hora, cancelación, non presentado ou corrección) deixa unha entrega pendente na mesma transacción. O traballador `npm run db:webhooks` (por cron, ou `-- --watch`) envíaa despois. A entrega é **polo menos unha vez**: reinténtase con espera exponencial ata 10 veces e os cambios seguidos da mesma reserva agrúpanse nunha soa mensaxe co estado final.

Formato [Standard Webhooks](https://www.standardwebhooks.com):

```
POST <url>
content-type: application/json
webhook-id: msg_<entrega>_<versión>
webhook-timestamp: <segundos Unix>
webhook-signature: v1,<base64(HMAC-SHA256(base64decode(segredo sen "whsec_"), "<id>.<timestamp>.<corpo>"))>

{
  "type": "access.credential.issued",            // ou "access.credential.revoked"
  "timestamp": "2026-10-27T10:00:00Z",
  "data": {
    "municipality": "vilaverde",
    "bookingId": "…", "facilityId": "…", "facilityName": "Pistas de pádel da Carballeira",
    "start": "2026-10-28T17:00:00Z", "end": "2026-10-28T18:00:00Z",
    "status": "confirmed",                       // confirmed | cancelled | no_show
    "credential": { "token": "<JWS>", "keyId": "…", "notBefore": "…", "expiresAt": "…" }  // null se se revoga
  }
}
```

O receptor:

- comproba a sinatura e que o `timestamp` non teña máis de 5 minutos;
- descarta os `webhook-id` xa vistos;
- garda ou borra a credencial por `bookingId`;
- responde `2xx`.

As mensaxes non levan o nome da persoa.

## 3. Simulador

`scripts/access-simulator.mjs` fai de controlador de porta:

```
ACCESS_WEBHOOK_SECRET=whsec_… npm run simulator:access     # escoita en http://127.0.0.1:8787/hooks
npm run db:webhooks -- --watch                               # noutra terminal
curl -s localhost:8787/present -d '{"token":"<texto do QR>"}' # ou pega o texto no simulador
```

Imprime «Porta aberta» ou «Acceso denegado» e o motivo. Con `ACCESS_PUBLIC_KEY=<x>` verifica tamén a sinatura Ed25519.

## 4. Modo conserxe

O rol `staff` («Persoal de acceso») só ve **Control de acceso** e **Reservas** do día. Non pode cancelar, editar instalacións nin cambiar axustes.

O escáner usa a cámara do móbil: `BarcodeDetector` cando existe e, se non, jsQR (Apache-2.0). As entradas lidas sen cobertura gárdanse no móbil e envíanse ao volver a conexión, ata 24 horas despois.

Na lista do día aparece quen entrou. Ao pechar a quenda, «Marcar o resto como non presentado» aplica a regra de non presentados de #16 ás reservas xa comezadas sen escanear.
