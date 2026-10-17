// SPDX-License-Identifier: AGPL-3.0-or-later
// Generates Quenda's illustration set as standalone SVG files.
// Scenes are drawn in metres (real court dimensions) and projected with a
// single transform, so every facility shares the same scale, light and palette.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../frontend/", import.meta.url).pathname;

const P = {
  ink: "#183f30",
  brand: "#205540",
  grass: "#cddfba",
  grassStripe: "#c4d8ae",
  grassDeep: "#b8cf9f",
  path: "#efe7d6",
  pathEdge: "#e2d6bd",
  shadow: "#173326",
  treeDark: "#3f6b45",
  tree: "#5a8a57",
  treeLight: "#7fae6c",
  treeTop: "#a3c98a",
  clay: "#cd7a50",
  clayDeep: "#b9653d",
  padel: "#2f6fa3",
  padelDeep: "#24578a",
  glass: "#dff1f6",
  wood: "#e3b57c",
  woodPlank: "#d6a46a",
  woodDeep: "#c48c52",
  futsalBlue: "#2c5d86",
  water: "#4fb3c8",
  waterDeep: "#3897ad",
  waterLight: "#9bd8e3",
  deck: "#f2ede2",
  deckLine: "#e4dccb",
  roof: "#e9e4d8",
  wall: "#f8f5ee",
  wallEdge: "#d9d0bd",
  white: "#ffffff",
  ball: "#e6ec6c",
  cone: "#e8743b",
  sky: "#eef3e6",
  river: "#9fd0d6",
  riverDeep: "#86c1c9",
  roofRed: "#c96f52",
};

const header = (w, h, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- Quenda illustration set · ${title} -->`;

const ns = 'vector-effect="non-scaling-stroke"';
const line = (d, stroke, w, extra = "") =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" ${ns} ${extra.includes("stroke-linecap") ? "" : 'stroke-linecap="square"'} ${extra}/>`;
const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;

// A scene is drawn twice: once flattened as a soft shadow, once in colour.
function lit(transform, shadowShapes, shapes, offset = [7, 10], opacity = 0.2) {
  return `<g transform="translate(${offset[0]} ${offset[1]})" opacity="${opacity}"><g transform="${transform}" fill="${P.shadow}">${shadowShapes}</g></g>
<g transform="${transform}">${shapes}</g>`;
}

// Deterministic pseudo-random so builds are reproducible.
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

// Canopy: overlapping blobs with a lit crown.
function tree(x, y, r, seed = 1) {
  const rand = rng(seed);
  const lobes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + rand();
    const d = r * 0.42;
    return [
      x + Math.cos(a) * d,
      y + Math.sin(a) * d,
      r * (0.55 + rand() * 0.15),
    ];
  });
  const body = lobes.map(([cx, cy, rr]) => circle(cx, cy, rr, P.tree)).join("");
  const dark = lobes
    .filter((_, i) => i % 2 === 0)
    .map(([cx, cy, rr]) =>
      circle(
        cx + rr * 0.25,
        cy + rr * 0.3,
        rr * 0.7,
        P.treeDark,
        'opacity=".55"',
      ),
    )
    .join("");
  return {
    shadow: circle(x, y, r * 1.02, P.shadow),
    shape: `${circle(x, y, r * 0.9, P.tree)}${body}${dark}${circle(x - r * 0.28, y - r * 0.3, r * 0.42, P.treeLight)}${circle(x - r * 0.38, y - r * 0.42, r * 0.17, P.treeTop)}`,
  };
}
function trees(list) {
  const ts = list.map(([x, y, r], i) => tree(x, y, r, i * 7 + 3));
  return {
    shadow: ts.map((t) => t.shadow).join(""),
    shape: ts.map((t) => t.shape).join(""),
  };
}

function grassField(w, h, stripe = 3.2) {
  let s = rect(-w, -h, w * 2, h * 2, P.grass);
  for (let y = -h; y < h; y += stripe * 2)
    s += rect(-w, y, w * 2, stripe, P.grassStripe);
  return s;
}

// Stylised tennis ball seen from above.
const ball = (x, y, r = 0.35) =>
  `${circle(x + 0.12, y + 0.16, r, P.shadow, 'opacity=".25"')}${circle(x, y, r, P.ball)}<path d="M${x - r * 0.75} ${y - r * 0.55}q${r * 0.8} ${r * 0.6} 0 ${r * 1.2}M${x + r * 0.75} ${y - r * 0.55}q${-r * 0.8} ${r * 0.6} 0 ${r * 1.2}" fill="none" stroke="#fff" stroke-width="1" ${ns} opacity=".85"/>`;

// ---------------------------------------------------------------- Tennis
function tennis() {
  const W = 640,
    H = 320;
  const L = 23.77,
    D = 10.97,
    S = 8.23,
    SL = 6.4;
  const t = `translate(${W * 0.53} ${H * 0.52}) rotate(-14) scale(10.6)`;
  const surround = rect(-18.3, -9.15, 36.6, 18.3, P.clayDeep, 'rx=".4"');
  const court = rect(-L / 2, -D / 2, L, D, P.clay);
  const lw = 2;
  const lines = [
    `M${-L / 2} ${-D / 2}h${L}v${D}h${-L}z`,
    `M${-L / 2} ${-S / 2}h${L}M${-L / 2} ${S / 2}h${L}`,
    `M${-SL} ${-S / 2}v${S}M${SL} ${-S / 2}v${S}`,
    `M${-SL} 0h${SL * 2}`,
    `M${-L / 2} 0h.3M${L / 2} 0h-.3`,
  ]
    .map((d) => line(d, P.white, lw))
    .join("");
  // Clay texture: faint drag marks.
  const rand = rng(11);
  let drag = "";
  for (let i = 0; i < 26; i++) {
    const x = -17 + rand() * 34,
      y = -8.5 + rand() * 17;
    drag += `<path d="M${x} ${y}q${1 + rand() * 2} ${rand() - 0.5} ${2.5 + rand() * 3} ${rand() - 0.5}" stroke="#fff" stroke-opacity=".09" stroke-width="2" fill="none" ${ns}/>`;
  }
  const fence = line(
    `M-18.3 -9.15h36.6v18.3h-36.6z`,
    "#2c3f36",
    1.4,
    'stroke-dasharray="1 2.5" opacity=".55"',
  );
  const net = `${line(`M0 ${-D / 2 - 0.9}v${D + 1.8}`, "#25332c", 3)}${line(`M0 ${-D / 2 - 0.9}v${D + 1.8}`, P.white, 1)}${circle(0, -D / 2 - 0.9, 0.22, "#25332c")}${circle(0, D / 2 + 0.9, 0.22, "#25332c")}`;
  const netShadow = rect(
    0.05,
    -D / 2 - 0.9,
    0.5,
    D + 1.8,
    P.shadow,
    'opacity=".22"',
  );
  const bench = `${rect(-2.2, -11.4, 4.4, 0.9, "#8a6a4a", 'rx=".2"')}${rect(-2.2, -11.4, 4.4, 0.25, "#a7845f")}`;
  const umpire = `${rect(-0.6, 6.7, 1.2, 1.3, "#e9e3d4", 'rx=".2"')}`;
  const tr = trees([
    [-24, -8, 3.4],
    [-21.5, 2.5, 2.6],
    [-25, 9, 3.1],
    [22.5, -11, 3.3],
    [26, -3, 2.4],
    [23.5, 9.5, 3.6],
    [-6, -15, 2.8],
    [5, -15.5, 3.2],
    [13, 14.5, 2.9],
    [-14, 14, 2.6],
  ]);
  const shapes = `${surround}${court}${drag}${lines}${netShadow}${net}${fence}${bench}${umpire}${ball(-7.2, 2.6)}${ball(9.6, -3.1, 0.3)}`;
  const shadowShapes = `${rect(-18.3, -9.15, 36.6, 0.25, "#000")}${rect(-2.2, -11.4, 4.4, 0.9, "#000")}`;
  return `${header(W, H, "Tennis court")}
<rect width="${W}" height="${H}" fill="${P.grass}"/>
<g transform="${t}">${grassField(60, 40)}${pathStrip(-36, 12.3, 72, 3)}</g>
${lit(t, shadowShapes, shapes, [3, 4], 0.25)}
${lit(t, tr.shadow, tr.shape, [8, 11], 0.22)}
</svg>`;
}

function pathStrip(x, y, w, h) {
  return `${rect(x, y, w, h, P.path)}${rect(x, y, w, 0.25, P.pathEdge)}${rect(x, y + h - 0.25, w, 0.25, P.pathEdge)}`;
}

// ---------------------------------------------------------------- Padel
function padelCourt(cx, cy) {
  const L = 20,
    D = 10,
    SV = 6.95;
  const base = rect(cx - L / 2, cy - D / 2, L, D, P.padel);
  const lines = [
    `M${cx - SV} ${cy - D / 2}v${D}M${cx + SV} ${cy - D / 2}v${D}`,
    `M${cx - SV} ${cy}h${SV * 2}`,
  ]
    .map((d) => line(d, P.white, 1.8))
    .join("");
  // Glass back walls (4 m at each end) and mesh sides.
  const glass = [
    `M${cx - L / 2} ${cy - D / 2}v${D}`,
    `M${cx + L / 2} ${cy - D / 2}v${D}`,
    `M${cx - L / 2} ${cy - D / 2}h4M${cx - L / 2} ${cy + D / 2}h4`,
    `M${cx + L / 2} ${cy - D / 2}h-4M${cx + L / 2} ${cy + D / 2}h-4`,
  ]
    .map((d) => line(d, P.glass, 4.5, 'stroke-linecap="butt"'))
    .join("");
  const glare = [
    `M${cx - L / 2} ${cy - D / 2 + 1.2}v1.8`,
    `M${cx + L / 2} ${cy + 1.5}v1.6`,
  ]
    .map((d) => line(d, "#fff", 4.5, 'stroke-linecap="butt"'))
    .join("");
  const mesh = line(
    `M${cx - L / 2 + 4} ${cy - D / 2}h${L - 8}M${cx - L / 2 + 4} ${cy + D / 2}h${L - 8}`,
    "#1f2c35",
    2,
    'stroke-dasharray="1.5 1.5" stroke-linecap="butt"',
  );
  const posts = [
    [-L / 2, -D / 2],
    [L / 2, -D / 2],
    [-L / 2, D / 2],
    [L / 2, D / 2],
    [-L / 2 + 4, -D / 2],
    [L / 2 - 4, -D / 2],
    [-L / 2 + 4, D / 2],
    [L / 2 - 4, D / 2],
    [0, -D / 2],
    [0, D / 2],
  ]
    .map(([x, y]) => rect(cx + x - 0.2, cy + y - 0.2, 0.4, 0.4, "#1f2c35"))
    .join("");
  const net = `${rect(cx + 0.05, cy - D / 2, 0.45, D, P.shadow, 'opacity=".25"')}${line(`M${cx} ${cy - D / 2}v${D}`, "#1a2630", 3)}${line(`M${cx} ${cy - D / 2}v${D}`, "#fff", 0.9)}`;
  // Floodlights sitting on the long sides.
  const lights = [-6, 6]
    .flatMap((x) =>
      [-1, 1].map(
        (s) =>
          `${rect(cx + x - 0.6, cy + s * (D / 2 + 0.35) - 0.25, 1.2, 0.5, "#e8e4d8", 'rx=".2"')}`,
      ),
    )
    .join("");
  return {
    shadow: `${rect(cx - L / 2, cy - D / 2, 0.6, D, "#000")}${rect(cx + L / 2 - 0.6, cy - D / 2, 0.6, D, "#000")}${rect(cx - L / 2, cy - D / 2, L, 0.3, "#000")}`,
    shape: `${base}${lines}${net}${glass}${glare}${mesh}${posts}${lights}`,
  };
}
function padel() {
  const W = 640,
    H = 320;
  const t = `translate(${W * 0.53} ${H * 0.5}) rotate(-14) scale(9.4)`;
  const a = padelCourt(0, -6.6),
    b = padelCourt(0, 6.6);
  const slab = rect(-12, -12.8, 24, 25.6, P.padelDeep, 'rx=".5"');
  const pathway = rect(-12, -1.6, 24, 3.2, "#d9d4c6");
  const tr = trees([
    [-17, -10, 3.2],
    [-18.5, 0, 2.5],
    [-16.5, 9.5, 3.4],
    [16.5, -11.5, 2.8],
    [18, -2, 3.4],
    [16.8, 10, 2.6],
    [-4, -17.5, 3.1],
    [7, -17, 2.7],
    [1, 17.4, 3.3],
    [-9, 16.8, 2.4],
  ]);
  const props = `${ball(-4.2, -8.1)}${ball(5.3, 4.2, 0.3)}${racket(-6.2, 4.8, 30)}`;
  return `${header(W, H, "Padel courts")}
<rect width="${W}" height="${H}" fill="${P.grass}"/>
<g transform="${t}">${grassField(60, 40)}${pathStrip(-40, -1.6, 80, 3.2)}</g>
${lit(t, `${rect(-12, -12.8, 24, 25.6, "#000")}`, `${slab}${pathway}${a.shape}${b.shape}${props}`, [3, 4], 0.22)}
${lit(t, `${a.shadow}${b.shadow}`, "", [5, 7], 0.18)}
${lit(t, tr.shadow, tr.shape, [8, 11], 0.22)}
</svg>`;
}
function racket(x, y, rot) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
${rect(-0.12, 0.5, 0.5, 0.25, P.shadow, 'opacity=".2"')}<ellipse cx=".12" cy=".14" rx=".95" ry="1.05" fill="${P.shadow}" opacity=".22"/>
<ellipse cx="0" cy="0" rx=".95" ry="1.05" fill="#1e2a33"/><ellipse cx="0" cy="0" rx=".72" ry=".82" fill="#f2c94c"/>
${[-0.35, 0, 0.35].flatMap((dx) => [-0.35, 0, 0.35].map((dy) => circle(dx, dy, 0.08, "#1e2a33"))).join("")}
${rect(-0.17, 0.95, 0.34, 1.3, "#1e2a33", 'rx=".1"')}</g>`;
}

// ---------------------------------------------------------------- Futsal (indoor pavilion, roof cut away)
function futsal() {
  const W = 640,
    H = 320;
  const L = 40,
    D = 20;
  const t = `translate(${W * 0.53} ${H * 0.5}) rotate(-12) scale(8.4)`;
  const hallW = 50,
    hallH = 34;
  const wall = `${rect(-hallW / 2, -hallH / 2, hallW, hallH, P.wall, 'rx=".6"')}${rect(-hallW / 2 + 1, -hallH / 2 + 1, hallW - 2, hallH - 2, P.woodDeep)}`;
  let planks = rect(-L / 2 - 2, -D / 2 - 2, L + 4, D + 4, P.wood);
  for (let y = -D / 2 - 2; y < D / 2 + 2; y += 1.1)
    planks += line(`M${-L / 2 - 2} ${y}h${L + 4}`, P.woodPlank, 0.8);
  const rand = rng(5);
  for (let i = 0; i < 70; i++) {
    const y = -D / 2 - 2 + Math.floor(rand() * 22) * 1.1,
      x = -L / 2 - 2 + rand() * (L + 4);
    planks += line(`M${x} ${y}v1.1`, P.woodPlank, 0.8);
  }
  // Court markings: boundary, halfway, centre circle (3 m), 6 m penalty areas.
  const pa = (s) => {
    const x0 = (s * L) / 2,
      xi = x0 - s * 6;
    return `M${x0} -7.58A6 6 0 0 ${s > 0 ? 0 : 1} ${xi} -1.58V1.58A6 6 0 0 ${s > 0 ? 0 : 1} ${x0} 7.58`;
  };
  const lines = [
    `M${-L / 2} ${-D / 2}h${L}v${D}h${-L}z`,
    `M0 ${-D / 2}v${D}`,
    pa(1),
    pa(-1),
  ]
    .map((d) => line(d, P.white, 2))
    .join("");
  const marks = `${circle(0, 0, 3, "none", `stroke="${P.white}" stroke-width="2" ${ns}`)}${circle(0, 0, 0.25, P.white)}${[1, -1].map((s) => `${circle(s * (L / 2 - 6), 0, 0.2, P.white)}${circle(s * (L / 2 - 10), 0, 0.2, P.white)}`).join("")}`;
  const goalArea = [1, -1]
    .map((s) => `<path d="${pa(s)}Z" fill="${P.futsalBlue}" opacity=".18"/>`)
    .join("");
  const goal = (s) => {
    const x = (s * L) / 2;
    let net = "";
    for (let i = 0; i <= 6; i++)
      net += line(
        `M${x} ${-1.5 + i * 0.5}h${s * 1}`,
        "#fff",
        0.6,
        'opacity=".8"',
      );
    for (let i = 0; i <= 2; i++)
      net += line(`M${x + s * i * 0.5} -1.5v3`, "#fff", 0.6, 'opacity=".8"');
    return `${rect(Math.min(x, x + s * 1), -1.5, 1, 3, "#3c3c3c", 'opacity=".25"')}${net}${line(`M${x} -1.5h${s * 1}v3h${-s * 1}`, "#d23c3c", 3)}`;
  };
  // Bleachers along the top wall.
  let stands = "";
  for (let r = 0; r < 3; r++)
    stands += rect(
      -16,
      -hallH / 2 + 1.4 + r * 1.3,
      32,
      1,
      r % 2 ? "#e5dccb" : "#efe8da",
    );
  for (let i = 0; i < 18; i++)
    stands += circle(
      -15 + i * 1.75 + (i % 3) * 0.2,
      -hallH / 2 + 1.9 + (i % 3) * 1.3,
      0.38,
      ["#205540", "#c96f52", "#e3b04b", "#2f6fa3"][i % 4],
    );
  // Roof beams cut-away: draw only the cut edge + skylight rays.
  const rays = `<g opacity=".16">${[-14, -2, 10].map((x) => `<path d="M${x} ${-hallH / 2}l6 0l-9 ${hallH}l-6 0z" fill="#fff"/>`).join("")}</g>`;
  const ballX = 5.5,
    ballY = 3.2;
  const fball = `${circle(ballX + 0.15, ballY + 0.2, 0.42, P.shadow, 'opacity=".3"')}${circle(ballX, ballY, 0.42, "#fff", `stroke="#222" stroke-width="1" ${ns}`)}${circle(ballX, ballY, 0.15, "#222")}`;
  const outside = trees([
    [-30, -14, 3.6],
    [-31, -2, 2.8],
    [-29, 11, 3.5],
    [30.5, -12, 3.1],
    [31.5, 1, 2.6],
    [29.5, 13, 3.8],
  ]);
  return `${header(W, H, "Futsal pavilion")}
<rect width="${W}" height="${H}" fill="${P.grass}"/>
<g transform="${t}">${grassField(70, 50)}${pathStrip(-60, hallH / 2 + 1.5, 120, 3.4)}</g>
${lit(t, rect(-hallW / 2, -hallH / 2, hallW, hallH, "#000"), `${wall}${planks}${goalArea}${lines}${marks}${goal(1)}${goal(-1)}${stands}${fball}${rays}${line(`M${-hallW / 2 + 0.5} ${-hallH / 2 + 0.5}h${hallW - 1}v${hallH - 1}h${-hallW + 1}z`, P.wallEdge, 1.5)}`, [7, 9], 0.25)}
${lit(t, outside.shadow, outside.shape, [8, 11], 0.22)}
</svg>`;
}

// ---------------------------------------------------------------- Swimming pool
function swimming() {
  const W = 640,
    H = 320;
  const L = 25,
    lanes = 6,
    lane = 2.5,
    D = lanes * lane;
  const t = `translate(${W * 0.53} ${H * 0.5}) rotate(-14) scale(11.4)`;
  let deck = rect(-L / 2 - 4, -D / 2 - 4, L + 8, D + 8, P.deck, 'rx=".4"');
  for (let x = -L / 2 - 4; x <= L / 2 + 4; x += 1)
    deck += line(`M${x} ${-D / 2 - 4}v${D + 8}`, P.deckLine, 0.7);
  for (let y = -D / 2 - 4; y <= D / 2 + 4; y += 1)
    deck += line(`M${-L / 2 - 4} ${y}h${L + 8}`, P.deckLine, 0.7);
  const coping = rect(-L / 2 - 0.5, -D / 2 - 0.5, L + 1, D + 1, "#fbfaf6");
  const basin = rect(-L / 2, -D / 2, L, D, P.water);
  const depth = `<rect x="${-L / 2}" y="${-D / 2}" width="${L}" height="${D}" fill="url(#poolDepth)"/>`;
  let bottom = "";
  for (let i = 0; i < lanes; i++) {
    const y = -D / 2 + lane * (i + 0.5);
    bottom += line(
      `M${-L / 2 + 2} ${y}h${L - 4}M${-L / 2 + 2} ${y - 0.5}v1M${L / 2 - 2} ${y - 0.5}v1`,
      "#1f5f73",
      2.2,
      'opacity=".35"',
    );
  }
  const rand = rng(21);
  let caustics = "";
  for (let i = 0; i < 46; i++) {
    const x = -L / 2 + 0.5 + rand() * (L - 1),
      y = -D / 2 + 0.5 + rand() * (D - 1);
    caustics += `<path d="M${x} ${y}q.5 -.35 1 0t1 0" stroke="#fff" stroke-opacity="${0.18 + rand() * 0.25}" stroke-width="1.2" fill="none" ${ns}/>`;
  }
  let ropes = "";
  const colours = ["#d84b3f", "#fff", "#2f6fa3"];
  for (let i = 1; i < lanes; i++) {
    const y = -D / 2 + lane * i;
    for (let x = -L / 2, k = 0; x < L / 2; x += 0.5, k++) {
      const c =
        x < -L / 2 + 5 || x > L / 2 - 5.5 ? colours[0] : colours[1 + (k % 2)];
      ropes += circle(x + 0.25, y, 0.2, c);
    }
  }
  const blocks = Array.from({ length: lanes }, (_, i) =>
    rect(
      -L / 2 - 1.3,
      -D / 2 + lane * (i + 0.5) - 0.3,
      0.9,
      0.6,
      "#fbfaf6",
      `stroke="${P.wallEdge}" stroke-width="1" ${ns}`,
    ),
  ).join("");
  const numbers = Array.from(
    { length: lanes },
    (_, i) =>
      `<text x="${-L / 2 - 2.6}" y="${-D / 2 + lane * (i + 0.5) + 0.32}" font-size=".9" font-family="Inter, sans-serif" font-weight="700" fill="#9a907a" text-anchor="middle">${i + 1}</text>`,
  ).join("");
  const ladder = `${line(`M${L / 2 - 3} ${D / 2 + 0.6}v-1.6M${L / 2 - 2} ${D / 2 + 0.6}v-1.6`, "#b9c2c4", 2.2)}`;
  const swimmer = (
    x,
    y,
    dir,
  ) => `<g transform="translate(${x} ${y}) scale(${dir} 1)">
<path d="M-2.2 0q1.2 -.5 2.2 0" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" ${ns}/>
<ellipse cx=".9" cy="0" rx=".95" ry=".34" fill="#e0a982"/><circle cx="1.8" cy="0" r=".33" fill="#d84b3f"/>
<path d="M1.4 -.2l1.2 -.75M1.4 .2l-.9 .7" stroke="#e0a982" stroke-width="2.2" stroke-linecap="round" ${ns}/></g>`;
  const loungers = [-8, -4.5, -1]
    .map(
      (x) =>
        `${rect(x, D / 2 + 1.6, 2.4, 1.2, "#fff", `rx=".25" stroke="${P.wallEdge}" stroke-width="1" ${ns}`)}${rect(x + 1.7, D / 2 + 1.6, 0.7, 1.2, "#dcd2bd", 'rx=".2"')}`,
    )
    .join("");
  const towel = rect(-0.2, D / 2 + 1.6, 2.4, 1.2, "#e3b04b", 'rx=".2"');
  const umbrella = `${circle(4.5, D / 2 + 2.3, 1.6, "#d84b3f")}<path d="M4.5 ${D / 2 + 0.7}v3.2M2.9 ${D / 2 + 2.3}h3.2" stroke="#fff" stroke-width="1" ${ns} opacity=".6"/>`;
  const tr = trees([
    [-22, -9, 3.4],
    [-23.5, 1.5, 2.5],
    [-21.5, 10, 3.2],
    [21.5, -10, 3.1],
    [23, 0, 2.6],
    [21, 10.5, 3.5],
    [-6, -15.8, 2.6],
    [5, -16.3, 3.1],
    [-11, 15.5, 2.7],
    [11, 16, 2.4],
  ]);
  return `${header(W, H, "Swimming pool")}
<defs><linearGradient id="poolDepth" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${P.waterLight}" stop-opacity=".45"/><stop offset=".5" stop-color="${P.water}" stop-opacity="0"/><stop offset="1" stop-color="${P.waterDeep}" stop-opacity=".55"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${P.grass}"/>
<g transform="${t}">${grassField(60, 40)}${pathStrip(-40, D / 2 + 5.2, 80, 3)}</g>
${lit(t, rect(-L / 2 - 4, -D / 2 - 4, L + 8, D + 8, "#000"), `${deck}${coping}${basin}${depth}${bottom}${caustics}${ropes}${line(`M${-L / 2} ${-D / 2}h${L}v${D}h${-L}z`, "#2c7f93", 1.6)}${blocks}${numbers}${ladder}${swimmer(-4, -D / 2 + lane * 1.5, 1)}${swimmer(6, -D / 2 + lane * 4.5, -1)}${loungers}${towel}${umbrella}`, [3, 4], 0.22)}
${lit(t, tr.shadow, tr.shape, [8, 11], 0.22)}
</svg>`;
}

// ---------------------------------------------------------------- Maintenance overlay (cones + tape), stacks over any cover
function maintenance() {
  const W = 640,
    H = 320;
  const cone = (
    x,
    y,
    k = 1,
  ) => `<g transform="translate(${x} ${y}) scale(${k})">
<ellipse cx="8" cy="2" rx="22" ry="5" fill="${P.shadow}" opacity=".25"/>
<rect x="-17" y="-6" width="34" height="7" rx="2" fill="#2b2b2b"/>
<path d="M-11 -6L-3 -46h6L11 -6Z" fill="${P.cone}"/>
<path d="M-8.2 -20h16.4l-1.4 -7h-13.6zM-5.4 -34h10.8l-1 -5h-8.8z" fill="#fff"/>
<path d="M-3 -46h2L-6 -6h-5Z" fill="#fff" opacity=".22"/></g>`;
  const tape = (
    y,
    rot,
  ) => `<g transform="translate(${W / 2} ${y}) rotate(${rot})"><rect x="-420" y="-9" width="840" height="18" fill="#f2c230"/>
<g>${Array.from({ length: 60 }, (_, i) => `<path d="M${-420 + i * 28} -9l14 0l-10 18l-14 0z" fill="#1d1d1b"/>`).join("")}</g></g>`;
  return `${header(W, H, "Maintenance overlay")}
${tape(H * 0.68, -9)}
${cone(W * 0.2, H * 0.6, 1.1)}${cone(W * 0.79, H * 0.5)}${cone(W * 0.58, H * 0.95, 1.2)}
</svg>`;
}

// ---------------------------------------------------------------- Hero: the town's sports map
function hero(W = 720, H = 420, scale = 4.6, dy = 0) {
  // dy lowers the town so the northern pins stay inside short, wide crops.
  const t = `translate(${W / 2} ${H / 2 + dy}) rotate(-8) scale(${scale})`;
  const river = `<path d="M-140 44C-90 34 -60 50 -20 42S40 26 80 36S130 30 160 22L160 38C130 46 100 50 78 48S30 40 -18 54S-90 48 -140 60Z" fill="${P.river}"/>
<path d="M-140 50C-90 40 -60 56 -20 48S40 32 80 42S130 36 160 28" stroke="#fff" stroke-opacity=".4" stroke-width="1.5" fill="none" ${ns}/>`;
  const road = (d, w) =>
    `<path d="${d}" stroke="${P.pathEdge}" stroke-width="${w + 4}" fill="none" ${ns} stroke-linecap="round"/><path d="${d}" stroke="${P.path}" stroke-width="${w}" fill="none" ${ns}/>`;
  const main = "M-160 -2C-100 -8 -50 6 0 -2S100 -14 170 -6";
  const roads = `${road(main, 20)}<path d="${main}" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 7" fill="none" ${ns}/>
${road("M2 -80C0 -40 6 -20 2 0S-4 50 2 90", 13)}${road("M-46 -6C-48 -14 -46 -22 -44 -26", 8)}${road("M30 -8C32 -14 32 -20 30 -26", 8)}${road("M-36 -4C-38 4 -38 10 -38 14", 8)}${road("M44 -10C46 0 46 8 44 14", 8)}`;
  const bridge = `<g transform="translate(1 48) rotate(-6)">${rect(-3, -9, 6, 18, "#d8cdb6")}${rect(-3, -9, 0.7, 18, "#bfb196")}${rect(2.3, -9, 0.7, 18, "#bfb196")}</g>`;
  const miniTennis = `<g transform="translate(-48 -34)">${rect(-9, -4.6, 18, 9.2, P.clayDeep, 'rx=".4"')}${rect(-6, -2.8, 12, 5.6, P.clay)}${line("M-6 -2.8h12v5.6h-12zM-6 -2.1h12M-6 2.1h12M-3.2 -2.1v4.2M3.2 -2.1v4.2M-3.2 0h6.4", "#fff", 1)}${line("M0 -3.6v7.2", "#25332c", 1.6)}</g>`;
  const miniPadel = `<g transform="translate(32 -36)">${rect(-7.5, -8, 15, 16, P.padelDeep, 'rx=".4"')}${[-3.8, 3.8].map((y) => `${rect(-6, y - 3, 12, 6, P.padel)}${line(`M-6 ${y - 3}v6M6 ${y - 3}v6`, P.glass, 2.2, 'stroke-linecap="butt"')}${line(`M-4.2 ${y - 3}v6M4.2 ${y - 3}v6M-4.2 ${y}h8.4`, "#fff", 0.9)}${line(`M0 ${y - 3}v6`, "#1a2630", 1.4)}`).join("")}</g>`;
  const miniPavilion = `<g transform="translate(-40 24)">${rect(-12, -8, 24, 16, P.roof, 'rx=".6"')}${[-8, -4, 0, 4, 8].map((x) => line(`M${x} -8v16`, "#d9d1c0", 1)).join("")}${rect(-12, -1.2, 24, 2.4, "#cfe4ea")}<path d="M-12 -8h24v16h-24z" fill="none" stroke="${P.wallEdge}" stroke-width="1.2" ${ns}/></g>`;
  const miniPool = `<g transform="translate(42 22)">${rect(-10, -6.5, 20, 13, P.deck, 'rx=".4"')}${rect(-7.5, -4, 15, 8, P.water)}${[-2, 0, 2].map((y) => line(`M-7.5 ${y}h15`, "#fff", 0.8, 'stroke-dasharray="1 1" opacity=".9"')).join("")}${circle(5, 5.2, 1, "#d84b3f")}</g>`;
  const rand = rng(42);
  let houses = "",
    housesShadow = "";
  const spots = [
    [-12, -14],
    [-18, -16],
    [-8, -20],
    [12, -16],
    [17, -20],
    [10, 8],
    [16, 12],
    [-10, 10],
    [-14, 16],
    [-20, 8],
    [20, 4],
    [-72, -16],
    [-80, -10],
    [-66, 14],
    [74, -24],
    [80, -16],
    [72, 4],
    [84, 10],
    [-92, 22],
    [-24, -40],
    [14, -44],
    [92, -34],
    [-96, -30],
    [-6, 20],
    [24, 30],
    [-58, 2],
    [62, 4],
  ];
  for (const [x, y] of spots) {
    const w = 3.6 + rand() * 2.4,
      h = 3 + rand() * 1.8,
      r = (rand() - 0.5) * 30;
    housesShadow += `<g transform="translate(${x} ${y}) rotate(${r})">${rect(-w / 2, -h / 2, w, h, "#000")}</g>`;
    houses += `<g transform="translate(${x} ${y}) rotate(${r})">${rect(-w / 2, -h / 2, w, h / 2, P.roofRed)}${rect(-w / 2, 0, w, h / 2, "#b35d43")}${line(`M${-w / 2} 0h${w}`, "#e48f6f", 0.8)}</g>`;
  }
  const church = `<g transform="translate(-2 -12) rotate(3)">${rect(-3.5, -4, 7, 3.5, "#c8b896")}${rect(-3.5, -0.5, 7, 3.5, "#b3a27e")}${rect(-1.4, -7.5, 2.8, 3.5, "#d8cdb6")}</g>`;
  const plaza = rect(-8, -16, 12, 9, "#ebe2cf", 'rx="1"');
  const fields = `${rect(-130, -70, 46, 30, P.grassDeep, 'rx="1" transform="rotate(6)"')}${rect(90, 44, 50, 28, "#d6e3bf", 'rx="1" transform="rotate(-4)"')}${rect(100, -78, 44, 26, "#d9e4c4", 'rx="1"')}`;
  const tr = trees([
    [-64, -36, 3.4],
    [-58, -44, 2.6],
    [-70, -26, 2.8],
    [-30, -34, 2.6],
    [-28, -46, 3],
    [52, -44, 3.2],
    [58, -34, 2.6],
    [16, -32, 2.4],
    [-60, 28, 3.2],
    [-62, 18, 2.4],
    [-20, 30, 2.6],
    [-22, 22, 2],
    [62, 22, 3],
    [64, 14, 2.4],
    [22, 18, 2.6],
    [58, -8 + 22, 2.2],
    [-100, -6, 3.4],
    [-110, 10, 2.8],
    [-104, -44, 3.2],
    [100, -6, 3],
    [108, 10, 3.6],
    [96, 26, 2.4],
    [-80, 34, 2.6],
    [-120, 30, 3.2],
    [-40, 60, 3],
    [40, 64, 3.4],
    [-90, 70, 3],
    [90, 70, 2.8],
    [-8, 70, 2.6],
    [120, -50, 3],
    [-140, -50, 3.4],
    [0, -62, 2.8],
    [-60, -66, 3],
    [60, -66, 2.6],
  ]);
  const pin = (
    x,
    y,
    n,
  ) => `<g transform="translate(${x} ${y}) rotate(8) scale(.2)">
<ellipse cx="2" cy="2" rx="7" ry="3" fill="${P.shadow}" opacity=".3"/>
<path d="M0 0C-4 -9 -14 -14 -14 -26a14 14 0 0 1 28 0C14 -14 4 -9 0 0Z" fill="${P.brand}" stroke="#fff" stroke-width="2.4" ${ns}/>
<circle cx="0" cy="-26" r="8.5" fill="#fff"/><text x="0" y="-22.4" font-size="11" font-family="Inter, sans-serif" font-weight="800" text-anchor="middle" fill="${P.brand}">${n}</text></g>`;
  return `${header(W, H, "Municipal sports map")}
<rect width="${W}" height="${H}" fill="${P.grass}"/>
<g transform="${t}">${grassField(200, 140, 4)}${fields}${river}${roads}${plaza}${bridge}</g>
${lit(t, `${housesShadow}${rect(-57, -38.6, 18, 9.2, "#000")}${rect(24.5, -44, 15, 16, "#000")}${rect(-52, 16, 24, 16, "#000")}${rect(32, 15.5, 20, 13, "#000")}`, `${miniTennis}${miniPadel}${miniPavilion}${miniPool}${houses}${church}`, [4, 6], 0.22)}
${lit(t, tr.shadow, tr.shape, [6, 8], 0.22)}
<g transform="${t}">${pin(-48, -38, 1)}${pin(32, -45, 2)}${pin(-40, 15, 3)}${pin(42, 14, 4)}</g>
</svg>`;
}

// ---------------------------------------------------------------- Basketball (generic fallback for other facility types)
function basketball() {
  const W = 640,
    H = 320;
  const L = 28,
    D = 15;
  const t = `translate(${W * 0.53} ${H * 0.5}) rotate(-14) scale(10.4)`;
  const slab = rect(
    -L / 2 - 2.5,
    -D / 2 - 2.5,
    L + 5,
    D + 5,
    "#7a9a6e",
    'rx=".5"',
  );
  const court = rect(-L / 2, -D / 2, L, D, "#5f8f8a");
  const keyF = (s) => `M${(s * L) / 2} -2.45h${-s * 5.8}v4.9h${s * 5.8}z`;
  const keys = [1, -1]
    .map((s) => `<path d="${keyF(s)}" fill="#d9844f"/>`)
    .join("");
  const arc = (s) =>
    `M${(s * L) / 2} -6.6h${-s * 2.99}A6.75 6.75 0 0 ${s > 0 ? 0 : 1} ${s * (L / 2 - 1.575 - 6.75 + 0.0)} 0A6.75 6.75 0 0 ${s > 0 ? 0 : 1} ${s * (L / 2 - 2.99)} 6.6h${s * 2.99}`;
  const lines = [
    `M${-L / 2} ${-D / 2}h${L}v${D}h${-L}z`,
    `M0 ${-D / 2}v${D}`,
    keyF(1),
    keyF(-1),
    arc(1),
    arc(-1),
  ]
    .map((d) => line(d, "#fff", 2))
    .join("");
  const rings = [1, -1]
    .map(
      (s) =>
        `${circle(s * (L / 2 - 4.2), 0, 1.8, "none", `stroke="#fff" stroke-width="2" ${ns}`)}${rect(s > 0 ? L / 2 - 1.2 : -L / 2 + 1, -0.9, 0.2, 1.8, "#fff")}${circle(s * (L / 2 - 1.575), 0, 0.23, "none", `stroke="${P.cone}" stroke-width="2" ${ns}`)}`,
    )
    .join("");
  const bball = `${circle(-4.15, 3.2, 0.5, P.shadow, 'opacity=".3"')}${circle(-4.3, 3, 0.5, "#e07a3b")}${line("M-4.8 3h1M-4.3 2.5v1", "#5b2d14", 0.8)}`;
  const tr = trees([
    [-21, -9, 3.2],
    [-22.5, 1.5, 2.5],
    [-20.5, 10, 3.4],
    [20.5, -10, 3],
    [22, 0, 2.6],
    [20, 10.5, 3.3],
    [-5, -13.8, 2.6],
    [6, -14.3, 3.1],
    [-10, 13.6, 2.7],
    [10, 14, 2.4],
  ]);
  return `${header(W, H, "Outdoor court")}
<rect width="${W}" height="${H}" fill="${P.grass}"/>
<g transform="${t}">${grassField(60, 40)}${pathStrip(-40, D / 2 + 3.4, 80, 3)}</g>
${lit(t, rect(-L / 2 - 2.5, -D / 2 - 2.5, L + 5, D + 5, "#000"), `${slab}${court}${keys}${lines}${circle(0, 0, 1.8, "none", `stroke="#fff" stroke-width="2" ${ns}`)}${rings}${bball}`, [3, 4], 0.22)}
${lit(t, tr.shadow, tr.shape, [8, 11], 0.22)}
</svg>`;
}

// ---------------------------------------------------------------- Brand
// A "q" whose bowl is a clock face: your turn (quenda) on the timetable.
const markPaths = `<circle cx="29" cy="29" r="13.5" fill="none" stroke="#fff" stroke-width="6"/>
<path d="M42.5 27v26" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
<path d="M29 21.5V29l5 3.2" stroke="${P.ball}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
function logoMark(size = 64, bg = P.brand) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<title>Quenda</title>
<rect width="64" height="64" rx="16" fill="${bg}"/>
${markPaths}
</svg>`;
}
// Full-bleed square for installable icons: the platform applies its own mask,
// and the mark stays inside the 80 % maskable safe zone.
function appIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
<rect width="64" height="64" fill="${P.brand}"/>
<g transform="translate(32 34) scale(.8) translate(-30.5 -34)">${markPaths}</g>
</svg>`;
}
// Social preview for the public website (Open Graph / link unfurls).
function socialCard() {
  const W = 1200,
    H = 630;
  const font =
    "font-family=\"'Atkinson Hyperlegible Next Variable', sans-serif\"";
  const map = hero(560, 630, 3.9, 8).replace(
    "<svg ",
    `<svg x="${W - 560}" y="0" `,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#fff"/>
${map}
<path d="M${W - 560} 0V${H}" stroke="#fff" stroke-width="8"/>
<g transform="translate(80 80)"><rect width="64" height="64" rx="16" fill="${P.brand}"/>${markPaths}</g>
<text x="164" y="126" ${font} font-weight="800" font-size="44" letter-spacing="-1" fill="#14261d">quenda</text>
<text ${font} font-weight="800" font-size="62" letter-spacing="-1.2" fill="#14261d"><tspan x="78" y="304">Reserva as pistas</tspan><tspan x="78" y="374">e piscinas do</tspan><tspan x="78" y="444">teu concello.</tspan></text>
<text ${font} font-size="26" fill="#4a5a51"><tspan x="80" y="526">Horarios libres en tempo real, sen chamadas.</tspan><tspan x="80" y="562">Software libre para concellos galegos.</tspan></text>
</svg>`;
}

// ---------------------------------------------------------------- Empty states (line art, brand ink)
const spot = (w, h, title, body) => `${header(w, h, title)}
<g fill="none" stroke="${P.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</g>
</svg>`;

function emptyBookings() {
  return spot(
    240,
    170,
    "No bookings yet",
    `
<ellipse cx="120" cy="150" rx="86" ry="9" fill="${P.grass}" stroke="none"/>
<rect x="58" y="30" width="112" height="108" rx="12" fill="#fff"/>
<path d="M58 58h112" /><rect x="58" y="30" width="112" height="28" rx="12" fill="${P.grassDeep}" stroke="none"/><rect x="58" y="30" width="112" height="108" rx="12"/>
<path d="M84 22v18M144 22v18"/>
${[0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((r) => `<rect x="${72 + c * 22}" y="${70 + r * 20}" width="12" height="10" rx="3" fill="${c === 2 && r === 1 ? P.ball : "#f2efe6"}" stroke="${c === 2 && r === 1 ? P.ink : "none"}"/>`)).join("")}
<circle cx="182" cy="124" r="20" fill="${P.ball}"/><path d="M168 110c8 6 8 22 0 28M196 110c-8 6 -8 22 0 28"/>
<path d="M30 62l6 -6M30 50l6 6" stroke="${P.clay}"/><path d="M200 40h10M205 35v10" stroke="${P.padel}"/>`,
  );
}
function emptySearch() {
  return spot(
    240,
    170,
    "No results",
    `
<ellipse cx="120" cy="150" rx="86" ry="9" fill="${P.grass}" stroke="none"/>
<g transform="rotate(-10 110 90)"><rect x="40" y="56" width="140" height="76" rx="4" fill="${P.clay}"/>
<path d="M50 64h120v60H50zM110 56v76M50 72h120M50 116h120M78 72v44M142 72v44M78 94h64" stroke="#fff" stroke-width="2"/></g>
<circle cx="150" cy="70" r="30" fill="#fff" fill-opacity=".75"/><circle cx="150" cy="70" r="30"/>
<path d="M172 92l22 22" stroke-width="8"/><path d="M140 64q10 -10 20 0" />
<path d="M30 40l6 -6M30 28l6 6" stroke="${P.padel}"/>`,
  );
}
function emptyError() {
  return spot(
    240,
    170,
    "Something went wrong",
    `
<ellipse cx="120" cy="150" rx="86" ry="9" fill="${P.grass}" stroke="none"/>
<path d="M44 140V58M196 140V58"/>
<path d="M44 62h152" stroke-width="4"/>
${Array.from({ length: 9 }, (_, i) => `<path d="M${56 + i * 16} 62v48"/>`).join("")}
${Array.from({ length: 3 }, (_, i) => `<path d="M44 ${78 + i * 16}h152"/>`).join("")}
<path d="M44 110h152"/>
<circle cx="138" cy="86" r="14" fill="${P.ball}"/><path d="M128 76c6 5 6 15 0 20M148 76c-6 5 -6 15 0 20"/>
<path d="M162 30l6 -10M174 36l10 -6M150 26l-1 -11" stroke="${P.cone}"/>`,
  );
}

function emptyAccess() {
  return spot(
    240,
    170,
    "Restricted area",
    `
<ellipse cx="120" cy="150" rx="86" ry="9" fill="${P.grass}" stroke="none"/>
<path d="M40 144V40M200 144V40" stroke-width="5"/>
<rect x="48" y="46" width="70" height="94" rx="3" fill="#fff"/><rect x="122" y="46" width="70" height="94" rx="3" fill="#fff"/>
<g stroke-width="1.4" opacity=".55">${Array.from({ length: 8 }, (_, i) => `<path d="M${48 + i * 18} 46l${Math.min(94, 192 - 48 - i * 18)} ${Math.min(94, 192 - 48 - i * 18)}M${192 - i * 18} 46l${-Math.min(94, 192 - 48 - i * 18)} ${Math.min(94, 192 - 48 - i * 18)}"/>`).join("")}</g>
<rect x="48" y="46" width="70" height="94" rx="3"/><rect x="122" y="46" width="70" height="94" rx="3"/>
<path d="M108 96c-6 0 -6 10 0 10h24c6 0 6 -10 0 -10" stroke="#8a8f86" stroke-width="3"/>
<path d="M110 102v-12a10 10 0 0 1 20 0v12" stroke-width="4"/>
<rect x="104" y="100" width="32" height="28" rx="6" fill="${P.ball}"/><path d="M120 110v8" stroke-width="3"/>
<path d="M206 36l8 -8M210 46h11" stroke="${P.clay}"/><path d="M24 70h10M29 65v10" stroke="${P.padel}"/>`,
  );
}

const files = {
  "facility-tennis.svg": tennis(),
  "facility-padel.svg": padel(),
  "facility-futsal.svg": futsal(),
  "facility-swimming.svg": swimming(),
  "facility-generic.svg": basketball(),
  "facility-maintenance.svg": maintenance(),
  "hero-map.svg": hero(640, 560, 3.9),
  "hero-map-wide.svg": hero(1000, 400, 3.4, 22),
  "logo-mark.svg": logoMark(64),
  "favicon.svg": logoMark(32),
  "empty-bookings.svg": emptyBookings(),
  "empty-search.svg": emptySearch(),
  "empty-error.svg": emptyError(),
  "empty-access.svg": emptyAccess(),
};
// Each workspace owns its copy: no cross-workspace imports.
const targets = {
  web: [
    "hero-map.svg",
    "logo-mark.svg",
    "facility-tennis.svg",
    "facility-padel.svg",
    "facility-swimming.svg",
  ],
  app: Object.keys(files).filter(
    (name) => name !== "favicon.svg" && name !== "hero-map.svg",
  ),
  admin: Object.keys(files).filter(
    (name) =>
      name.startsWith("facility-") ||
      name.startsWith("empty-") ||
      name === "logo-mark.svg",
  ),
};
for (const [workspace, names] of Object.entries(targets)) {
  const dir = join(ROOT, workspace, "src/assets/illustrations");
  mkdirSync(dir, { recursive: true });
  for (const name of names) writeFileSync(join(dir, name), files[name]);
  mkdirSync(join(ROOT, workspace, "public"), { recursive: true });
  writeFileSync(
    join(ROOT, workspace, "public/favicon.svg"),
    files["favicon.svg"],
  );
  console.log(`${workspace}: ${names.length} illustrations + favicon`);
}

// ---------------------------------------------------------------- Installable icons and social card
// Rasterised with the Playwright Chromium already used by the test suite so the
// PNGs use the same self-hosted (OFL) fonts as the web.
const manifests = {
  web: { name: "Quenda", start: "/" },
  app: { name: "Quenda: reservas", start: "/app/" },
  admin: { name: "Quenda: xestión municipal", start: "/admin/" },
};
// Inlined as data URLs: Chromium refuses file:// fonts on an about:blank page.
const fontFace = (family, pkg, file) =>
  `@font-face{font-family:'${family}';font-weight:100 900;src:url(data:font/woff2;base64,${readFileSync(join(ROOT, "../node_modules/@fontsource-variable", pkg, "files", file)).toString("base64")}) format('woff2');}`;
const fonts = ["latin", "latin-ext"]
  .map((subset) =>
    fontFace(
      "Atkinson Hyperlegible Next Variable",
      "atkinson-hyperlegible-next",
      `atkinson-hyperlegible-next-${subset}-wght-normal.woff2`,
    ),
  )
  .join("");
const rasters = {
  "apple-touch-icon.png": [appIcon(180), 180, 180],
  "icon-192.png": [appIcon(192), 192, 192],
  "icon-512.png": [appIcon(512), 512, 512],
  "og-image.png": [socialCard(), 1200, 630],
};
const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
const png = {};
for (const [name, [svg, width, height]] of Object.entries(rasters)) {
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>${fonts}html,body{margin:0}svg{display:block}</style>${svg}`,
  );
  await page.evaluate(() => document.fonts.ready);
  png[name] = await page.screenshot({ type: "png" });
}
await browser.close();
for (const [workspace, { name, start }] of Object.entries(manifests)) {
  const pub = join(ROOT, workspace, "public");
  for (const icon of ["apple-touch-icon.png", "icon-192.png", "icon-512.png"])
    writeFileSync(join(pub, icon), png[icon]);
  if (workspace === "web")
    writeFileSync(join(pub, "og-image.png"), png["og-image.png"]);
  const manifest = {
    name,
    short_name: "Quenda",
    lang: "gl",
    start_url: start,
    scope: start,
    display: workspace === "web" ? "browser" : "standalone",
    background_color: "#ffffff",
    theme_color: "#1f5b43",
    icons: [
      { src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  writeFileSync(
    join(pub, "manifest.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`${workspace}: icons + manifest`);
}
