// SPDX-License-Identifier: AGPL-3.0-or-later
const copy = {
  gl: {
    subject: (code: string) => `${code} é o teu código para entrar`,
    intro: (municipality: string) =>
      `Este é o código para entrar nas reservas deportivas de ${municipality}:`,
    expiry: "Caduca en 10 minutos e só se pode usar unha vez.",
    ignore:
      "Se non pediches este código, non fagas nada: ninguén pode entrar sen el.",
  },
  es: {
    subject: (code: string) => `${code} es tu código para entrar`,
    intro: (municipality: string) =>
      `Este es el código para entrar en las reservas deportivas de ${municipality}:`,
    expiry: "Caduca en 10 minutos y solo se puede usar una vez.",
    ignore:
      "Si no pediste este código, no hagas nada: nadie puede entrar sin él.",
  },
};
const escape = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
/** The one-time code mail; transactional, so it carries no unsubscribe link. */
export function renderLoginCode(args: {
  code: string;
  locale: "gl" | "es";
  municipality: string;
}) {
  const t = copy[args.locale];
  const text = [
    t.intro(args.municipality),
    "",
    args.code,
    "",
    t.expiry,
    t.ignore,
  ].join("\n");
  const html = `<!doctype html>
<html lang="${args.locale}"><body style="font-family:sans-serif;color:#14261d;line-height:1.5">
<p>${escape(t.intro(args.municipality))}</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">${escape(args.code)}</p>
<p>${escape(t.expiry)}<br>${escape(t.ignore)}</p>
</body></html>`;
  return { subject: t.subject(args.code), text, html };
}
