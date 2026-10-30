# Installable app and offline use (#24)

The citizen app (`/app/`) and the backoffice (`/admin/`) are Progressive Web Apps: they install on
Android, iOS and desktop from the browser, with no app store and no per-platform cost. The public
website (`/`) stays a plain website.

## Installing

- **Android and desktop Chrome or Edge:** the browser offers **Instalar** (or _Add to home
  screen_) once the page has a manifest and an active service worker.
- **iOS and iPadOS (Safari):** there is no install prompt. People use **Compartir → Engadir á
  pantalla de inicio**. Web Push only works in an app added this way, from iOS 16.4 (see
  [notifications](notifications.md)); the account page explains it.

**Each council is its own app.** When the citizen app knows the council, the shell points
`<link rel="manifest">` at `GET /v2/public/municipalities/:slug/manifest`, which returns:

- `id` and `start_url` `/app/<slug>/`, so two councils install as two apps;
- `scope` `/app/`;
- name «<council>: reservas» and short name «<council>»;
- `theme_color` from the council's colour;
- the council's icon, or Quenda's when it has none.

The shell also sets `apple-touch-icon`, `apple-mobile-web-app-title` and `theme-color`, which iOS
reads instead of the manifest. The manifest is served with `Cache-Control: no-cache`.

**The council icon.** Launchers need a square raster icon, and logos come in any shape. The
backend has no image library: sharp depends on libvips, which is LGPL and fails
`npm run licenses`. So the backoffice draws the icon when a manager uploads the logo:

- it is a 512 × 512 PNG on white;
- the logo is centred and fits inside the circle that launchers keep visible on maskable icons
  (80 % of the side).

It goes to `PUT /v2/manager/municipality/icon`.

The icon is stored next to the logo (`municipality_logos.icon`, migration `0019`):

- a new logo drops it until the backoffice sends the new one;
- deleting the logo deletes it;
- data transfers carry it.

If the browser cannot read the logo, the upload still counts and the app keeps Quenda's icon.

## Service worker

Each app has its own worker:

- `frontend/app/public/sw.js`, scope `/app/`, which also handles Web Push;
- `frontend/admin/public/sw.js`, scope `/admin/`.

`main.tsx` registers it at start-up, only in production builds. In development Vite serves the
files, and in tests MSW's own worker intercepts the requests.

**What it keeps.** A build plugin (`frontend/vite-precache.mts`) writes into the built `sw.js` the
list of files to keep:

- every file of the build, including `index.html`, the hashed `assets/` and the fonts;
- the icons and the static manifest;
- a version that changes when any of them changes.

Browsers only install a new worker when `sw.js` itself changes, so the list lives inside it rather
than in a separate file.

On `install` the worker stores them in `quenda-app-<version>` (or `quenda-admin-<version>`). On
`activate` it deletes the other versions.

**How it answers:**

- Navigations go to the network first; with no network, the stored `index.html` answers.
- Built files are served from the cache first, because their names carry a content hash.
- **`/v2/` and `/api/` never go through the worker's cache.** The API answers `no-store` and per
  session, and caching them there could show one person's data to another.

**Updates.** nginx serves `sw.js` and `manifest.webmanifest` with
`Cache-Control: no-cache` (checked by `npm run test:headers`). A new deploy installs a new worker
the next time the app opens. It takes over once every window of the old version is closed, so a
page already open keeps the files it started with.

## Data without a network

**Citizen app.** TanStack Query keeps a selected set of answers in `localStorage` under
`quenda.app.offline`, through `@tanstack/react-query-persist-client` (MIT). The app and the
backoffice share the origin, so the backoffice keeps its own copy under `quenda.admin.offline`.
The app keeps:

- councils, session, facilities and sports;
- the person's bookings, notices and penalty standing;
- **access passes**.

Copies older than 7 days are dropped, and raising `OFFLINE_FORMAT` in `client/query-client.ts`
drops every kept copy after a change of shape.

- **Passes at the door.** With a network, the app fetches ahead the passes of bookings that start
  within 24 hours. The QR then opens at the door even without coverage. Passes are signed JWTs
  checked offline by the door device ([access control](access-control.md)).
- **Without a network:**
  - a banner says the data shown is the stored copy;
  - change and cancel are not offered;
  - pages show the stored data rather than an error.
- **Shared devices.** Signing out, or deleting the account, removes the kept bookings, notices,
  passes and penalty standing, from memory and from the device.

**Backoffice.** Only the councils and the session are kept, so the door page opens without a
network for the staff member already signed in. A rejected session still signs them out. The door
data has its own offline store ([access control](access-control.md)).

## What does not work offline

- Booking, changing or cancelling.
- Facility availability and the map tiles.
- Account settings.
- Every backoffice page except the door.

Background Sync is not used: the door queue is sent when the browser reports it is back online.

## App stores: Capacitor

The PWA covers what the issue asks for. If a council needs the stores, for distribution, NFC
passes or a store listing, [Capacitor](https://capacitorjs.com/) (MIT) can wrap the same built app
in a native shell:

- **Same code.** `frontend/app/dist` becomes the web content of an Android and an iOS project.
  The API stays at the deployment's URL (CORS or a fixed origin must be configured).
- **Push changes channel.** Native apps receive notices through FCM (Android) and APNs (iOS), not
  VAPID. That means a second sender behind the `PushSender` port and storing native device
  tokens.
- **Costs and upkeep.** Each council (or the operator) needs Google Play and Apple developer
  accounts (USD 25 once; USD 99 a year), with a store review for each release.
- **When it pays off:**
  - a council requires a store listing;
  - NFC or other device features the web cannot reach are needed;
  - iOS users must get push without adding the app to the home screen.
