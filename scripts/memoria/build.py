# SPDX-License-Identifier: AGPL-3.0-or-later
"""Fills the official GOBTEC template with docs/memoria/memoria-tecnica.md (#28).

Writes docs/memoria/memoria-tecnica.odt and exports memoria-tecnica.pdf with LibreOffice, then
checks the limits of the bases (points 3 and 4): at most 10 pages and 15 MB, and a summary of at
most 150 words. Python standard library only; LibreOffice (`soffice`) does the PDF export.
"""
import html
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOCS = os.path.join(ROOT, "docs", "memoria")
TEMPLATE = os.path.join(DOCS, "plantilla_memoria_tecnica_gobtec_2026.odt")
SOURCE = os.path.join(DOCS, "memoria-tecnica.md")
ODT = os.path.join(DOCS, "memoria-tecnica.odt")
PDF = os.path.join(DOCS, "memoria-tecnica.pdf")
MAX_PAGES, MAX_BYTES, MAX_SUMMARY_WORDS = 10, 15 * 1024 * 1024, 150
TEXT_WIDTH_IN = 6.69  # The text width of an A4 page with LibreOffice's default margins.

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    "meta": "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
    "dc": "http://purl.org/dc/elements/1.1/",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
}
for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


def q(name):
    prefix, local = name.split(":")
    return f"{{{NS[prefix]}}}{local}"


def el(name, attrs=None, text=None):
    node = ET.Element(q(name), {q(k): v for k, v in (attrs or {}).items()})
    node.text = text
    return node


# Styles added to the template: inline emphasis, value cells, figures and new tables.
EXTRA_STYLES = """
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="Strong" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="Em" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" xmlns:table="{table}" style:name="MdTable" style:family="table"><style:table-properties style:width="{width}in" table:align="center" fo:margin-top="0.04in" fo:margin-bottom="0.12in"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="RowKeep" style:family="table-row"><style:table-row-properties fo:keep-together="always"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="BodyKeep" style:family="paragraph" style:parent-style-name="BodyStyle"><style:paragraph-properties fo:keep-with-next="always"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="BodySpaced" style:family="paragraph" style:parent-style-name="BodyStyle"><style:paragraph-properties fo:margin-top="0.12in"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="CellValue" style:family="paragraph"><style:paragraph-properties fo:text-align="left" fo:line-height="120%"/><style:text-properties style:font-name="Liberation Sans" fo:font-size="9.5pt" fo:color="#000000"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="Figure" style:family="paragraph"><style:paragraph-properties fo:text-align="center" fo:margin-top="0.06in" fo:margin-bottom="0.02in" fo:keep-with-next="always"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="Caption" style:family="paragraph"><style:paragraph-properties fo:text-align="center" fo:margin-bottom="0.1in"/><style:text-properties style:font-name="Liberation Sans" fo:font-size="9pt" fo:font-style="italic" fo:color="#595959"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="Img" style:family="graphic"><style:graphic-properties style:vertical-pos="middle" style:vertical-rel="text" fo:border="0.5pt solid #BFBFBF" fo:margin-left="0.05in" fo:margin-right="0.05in"/></style:style>
<style:style xmlns:style="{style}" xmlns:fo="{fo}" style:name="H2Keep" style:family="paragraph" style:parent-style-name="H2Style"><style:paragraph-properties fo:keep-with-next="always"/></style:style>
""".format(width=TEXT_WIDTH_IN, **NS)

INLINE = re.compile(r"\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(https?://[^\s)·]+[^\s)·.,;:])")


def inline(parent, source):
    """Appends `source` to `parent` with **bold**, *italic*, `code` and links."""
    last = None
    pos = 0

    def add_text(value):
        nonlocal last
        if not value:
            return
        if last is None:
            parent.text = (parent.text or "") + value
        else:
            last.tail = (last.tail or "") + value

    for match in INLINE.finditer(source):
        add_text(source[pos : match.start()])
        bold, italic, code, url = match.groups()
        if code:
            add_text(code)  # File names read as ordinary text in the report.
            pos = match.end()
            continue
        if url:
            node = el("text:a", {"xlink:type": "simple", "xlink:href": url}, url)
        else:
            style = "Strong" if bold else "Em"
            node = el("text:span", {"text:style-name": style})
            inline(node, bold or italic)
        parent.append(node)
        last = node
        pos = match.end()
    add_text(source[pos:])


def paragraph(style, source):
    node = el("text:p", {"text:style-name": style})
    inline(node, source)
    return node


def png_size(path):
    with open(path, "rb") as file:
        header = file.read(24)
    return struct.unpack(">II", header[16:24])


IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)\{([\d.]+)\}")


class Document:
    def __init__(self):
        self.pictures = []  # (zip name, local path)
        self.column_styles = []  # (style name, width in inches)
        self.row_tables = {}  # Section key -> rows for the template's own table.
        self.tables = 0
        self.figures = 0

    def figure(self, line):
        """A paragraph with one or more images side by side, and its caption."""
        frames = el("text:p", {"text:style-name": "Figure"})
        alts = []
        for alt, path, width_cm in IMAGE.findall(line):
            local = os.path.join(DOCS, path)
            px_w, px_h = png_size(local)
            width = float(width_cm)
            name = f"Pictures/{len(self.pictures) + 1:02d}-{os.path.basename(path)}"
            self.pictures.append((name, local))
            frame = el(
                "draw:frame",
                {
                    "draw:style-name": "Img",
                    "draw:name": f"Imaxe {len(self.pictures)}",
                    "text:anchor-type": "as-char",
                    "svg:width": f"{width:.2f}cm",
                    "svg:height": f"{width * px_h / px_w:.2f}cm",
                },
            )
            frame.append(
                el(
                    "draw:image",
                    {
                        "xlink:href": name,
                        "xlink:type": "simple",
                        "xlink:show": "embed",
                        "xlink:actuate": "onLoad",
                    },
                )
            )
            frame.append(el("svg:title", text=alt))
            frame.append(el("svg:desc", text=alt))
            frames.append(frame)
            alts.append(alt)
        self.figures += 1
        caption = paragraph("Caption", f"Figura {self.figures}. " + " · ".join(alts) + ".")
        return [frames, caption]

    def table(self, rows):
        """A new table in the template's look: label header and bordered cells."""
        self.tables += 1
        name = f"Taboa{self.tables}"
        lengths = [max(len(row[i]) for row in rows) for i in range(len(rows[0]))]
        weights = [min(max(n, len(rows[0][i]) + 3, 12), 60) for i, n in enumerate(lengths)]
        table = el("table:table", {"table:name": name, "table:style-name": "MdTable"})
        for weight in weights:
            col = f"{name}C{len(table)}"
            self.column_styles.append((col, TEXT_WIDTH_IN * weight / sum(weights)))
            table.append(el("table:table-column", {"table:style-name": col}))
        for index, row in enumerate(rows):
            tr = el("table:table-row", {"table:style-name": "RowKeep"})
            if index == 0:
                header = el("table:table-header-rows")
                header.append(tr)
                table.append(header)
            else:
                table.append(tr)
            for cell in row:
                td = el(
                    "table:table-cell",
                    {
                        "table:style-name": "CellLabel" if index == 0 else "CellFill",
                        "office:value-type": "string",
                    },
                )
                td.append(paragraph("CellLabelText" if index == 0 else "CellValue", cell))
                tr.append(td)
        return table

    def blocks(self, lines):
        """Converts the Markdown of one section into ODF paragraphs, lists, tables and images."""
        out, rows = [], []
        for line in lines + [""]:
            if line.startswith("|"):
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", c) for c in cells):
                    rows.append(cells)
                continue
            if rows:
                out.append(("table", rows))
                rows = []
            if not line.strip():
                continue
            if IMAGE.match(line.strip()):
                out.append(("figure", line))
            elif line.startswith("- "):
                out.append(("item", line[2:]))
            else:
                out.append(("p", line))
        return out

    def render(self, block):
        kind, value = block
        if kind == "table":
            return [self.table(value)]
        if kind == "figure":
            return self.figure(value)
        if kind == "item":
            return [paragraph("ListStyle", "•  " + value)]
        return [paragraph("BodyStyle", value)]


def parse(source):
    """Sections of the Markdown by heading number: {"0": [...lines], "3.1": [...]}."""
    source = re.sub(r"<!--.*?-->", "", source, flags=re.S)
    sections, key = {}, None
    for line in source.splitlines():
        heading = re.match(r"^#{2,3} (\d+(?:\.\d+)?)\.? ", line)
        if heading:
            key = heading.group(1)
            sections[key] = []
        elif key is not None:
            sections[key].append(line)
    return sections


def heading_key(node):
    text = "".join(node.itertext()).strip()
    match = re.match(r"^(\d+(?:\.\d+)?)\.? ", text)
    return match.group(1) if match else None


def fill_row_table(table, rows):
    """Writes the values of a two-column Markdown table into the template's table, row by row."""
    template_rows = table.findall(q("table:table-row"))
    values = [r[1] for r in rows[1:]]
    if len(values) != len(template_rows):
        sys.exit(f"Table with {len(template_rows)} rows gets {len(values)} values")
    for tr, value in zip(template_rows, values):
        tr.set(q("table:style-name"), "RowKeep")  # A row never splits across pages.
        cell = tr.findall(q("table:table-cell"))[1]
        for child in list(cell):
            cell.remove(child)
        for part in value.split("<br>"):
            cell.append(paragraph("CellValue", part.strip()))


def build():
    sections = parse(open(SOURCE, encoding="utf-8").read())
    summary = " ".join(sections["1"]).split()
    if len(summary) > MAX_SUMMARY_WORDS:
        sys.exit(f"The summary has {len(summary)} words; the template allows {MAX_SUMMARY_WORDS}")
    with zipfile.ZipFile(TEMPLATE) as template:
        files = {name: template.read(name) for name in template.namelist()}
    content = ET.fromstring(files["content.xml"])
    body = content.find(f"{q('office:body')}/{q('office:text')}")
    doc = Document()
    children = list(body)
    for child in children:
        body.remove(child)
    current, pending, placed = None, [], set()
    checkboxes = [line for line in sections.get("9", []) if line.startswith("- [")]
    checkbox = 0

    def flush():
        """Content of a section with no «[…]» box goes just before the next heading."""
        nonlocal pending
        for node in pending:
            body.append(node)
        pending = []

    for node in children:
        style = node.get(q("text:style-name"))
        tag = node.tag
        if tag == q("text:h"):
            flush()
            current = heading_key(node)
            if style == "H2Style":
                node.set(q("text:style-name"), "H2Keep")
            body.append(node)
            if current in sections and current != "9":
                blocks = doc.blocks(sections[current])
                tables = [b for b in blocks if b[0] == "table"] if current in ("0", "4") else []
                rest = [b for b in blocks if b not in tables]
                for b in tables:
                    doc.row_tables[current] = b[1]
                pending = [n for b in rest for n in doc.render(b)]
            continue
        if style in ("InstrStyle",):
            continue  # The ℹ boxes are removed before exporting (template instructions).
        text = "".join(node.itertext())
        if style == "NoteStyle" and (text.startswith("Versión 3") or text.startswith("Lembra")):
            continue
        if style == "ListStyle" and current in ("3.1", "3.2"):
            continue  # The same items open each bullet of the text.
        if style == "FillBoxStyle":
            for n in pending:
                body.append(n)
            pending = []
            placed.add(current)
            continue
        if tag == q("table:table") and current in ("0", "4"):
            fill_row_table(node, doc.row_tables[current])
            body.append(node)
            continue
        if style == "ListStyle" and current == "9" and text.startswith("☐"):
            if checkbox >= len(checkboxes):
                sys.exit("Section 9 has more declarations than the Markdown")
            if checkboxes[checkbox].startswith("- [x]"):
                first = node
                first.text = (first.text or "").replace("☐", "☒", 1)
                if not first.text.startswith("☒"):
                    for sub in first.iter():
                        if sub.text and "☐" in sub.text:
                            sub.text = sub.text.replace("☐", "☒", 1)
                            break
            checkbox += 1
        body.append(node)
    flush()
    nodes = list(body)
    for previous, node in zip(nodes, nodes[1:]):
        if previous.tag == q("table:table") and node.get(q("text:style-name")) == "BodyStyle":
            node.set(q("text:style-name"), "BodySpaced")
        # A lead-in paragraph («Riscos e mitigación.», the one before a table) stays with what follows.
        lead = previous.get(q("text:style-name")) == "BodyStyle" and (
            node.tag == q("table:table") or "".join(previous.itertext()).strip().endswith((":", "."))
            and len(previous) == 1 and not (previous.text or "").strip() and not (previous[0].tail or "").strip()
        )
        if lead:
            previous.set(q("text:style-name"), "BodyKeep")
    if checkbox != len(checkboxes):
        sys.exit("Section 9 does not match the template's declarations")

    automatic = content.find(q("office:automatic-styles"))
    for style in ET.fromstring(f"<x>{EXTRA_STYLES}</x>"):
        automatic.append(style)
    for name, width in doc.column_styles:
        style = el("style:style", {"style:name": name, "style:family": "table-column"})
        style.append(el("style:table-column-properties", {"style:column-width": f"{width:.3f}in"}))
        automatic.append(style)
    files["content.xml"] = b"<?xml version='1.0' encoding='UTF-8'?>\n" + ET.tostring(content)

    # Document language (Galician) for spelling, hyphenation and the tagged PDF.
    styles = files["styles.xml"].decode("utf-8")
    styles = styles.replace(
        "<office:styles>",
        '<office:styles><style:default-style style:family="paragraph">'
        '<style:text-properties fo:language="gl" fo:country="ES"/></style:default-style>',
        1,
    )
    files["styles.xml"] = styles.encode("utf-8")
    meta = files["meta.xml"].decode("utf-8")
    title = "Memoria técnica — Quenda — I Certame GOBTEC de Software Libre 2026"
    meta = re.sub(r"<dc:title>.*?</dc:title>", "", meta, flags=re.S)
    meta = meta.replace(
        "<office:meta>",
        f"<office:meta><dc:title>{html.escape(title)}</dc:title><dc:language>gl-ES</dc:language>",
        1,
    )
    files["meta.xml"] = meta.encode("utf-8")
    manifest = files["META-INF/manifest.xml"].decode("utf-8")
    entries = "".join(
        f'<manifest:file-entry manifest:full-path="{name}" manifest:media-type="image/png"/>'
        for name, _ in doc.pictures
    )
    files["META-INF/manifest.xml"] = manifest.replace(
        "</manifest:manifest>", entries + "</manifest:manifest>"
    ).encode("utf-8")
    for name, local in doc.pictures:
        files[name] = open(local, "rb").read()

    with zipfile.ZipFile(ODT, "w") as out:
        # The mimetype entry goes first and uncompressed (ODF 1.2, section 3.3).
        out.writestr(zipfile.ZipInfo("mimetype"), files.pop("mimetype"), zipfile.ZIP_STORED)
        for name, data in files.items():
            out.writestr(name, data, zipfile.ZIP_DEFLATED)
    return sections


def soffice():
    for candidate in ("soffice", "/Applications/LibreOffice.app/Contents/MacOS/soffice"):
        path = shutil.which(candidate) or (candidate if os.path.exists(candidate) else None)
        if path:
            return path
    sys.exit("LibreOffice (soffice) is needed for the PDF: https://www.libreoffice.org/")


def export_pdf():
    options = '{"UseTaggedPDF":{"type":"boolean","value":"true"},"ExportBookmarks":{"type":"boolean","value":"true"}}'
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run(
            [
                soffice(),
                f"-env:UserInstallation=file://{profile}",
                "--headless",
                "--convert-to",
                f"pdf:writer_pdf_Export:{options}",
                "--outdir",
                DOCS,
                ODT,
            ],
            check=True,
            capture_output=True,
        )
    data = open(PDF, "rb").read()
    pages = len(re.findall(rb"/Type\s*/Page[^s]", data))
    return pages, len(data)


def main():
    build()
    pages, size = export_pdf()
    text = open(SOURCE, encoding="utf-8").read()
    pending = sorted(set(re.findall(r"\[PENDENTE[^\]]*\]", text)))
    print(f"{os.path.relpath(PDF, ROOT)}: {pages} pages, {size / 1024:.0f} KB")
    for item in pending:
        print(f"  pending: {item}")
    if pages > MAX_PAGES:
        sys.exit(f"The PDF has {pages} pages; the bases allow {MAX_PAGES}")
    if size > MAX_BYTES:
        sys.exit(f"The PDF is {size} bytes; the bases allow 15 MB")


if __name__ == "__main__":
    main()
