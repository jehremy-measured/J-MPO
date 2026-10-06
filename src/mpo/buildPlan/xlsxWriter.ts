/** Minimal from-scratch OOXML (.xlsx) writer -- no third-party zip/spreadsheet library is
 * available in this project, and the one real xlsx already embedded (budgetTemplateData.ts)
 * is a static reference file we can't re-populate with a specific plan's numbers without
 * parsing and rewriting its internal XML. This instead builds a small, genuinely valid
 * single-sheet workbook (uncompressed ZIP entries -- valid per the ZIP spec, and avoids
 * needing a DEFLATE implementation) directly from a table of rows. */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function concatBytes(chunks: number[][]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Builds an uncompressed (STORED) ZIP archive from a set of named text files. */
function buildZip(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: number[][] = [];
  const centralChunks: number[][] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = Array.from(encoder.encode(file.name));
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0), // flags
      ...u16(0), // compression: stored
      ...u16(0), // mod time
      ...u16(0), // mod date
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0), // extra length
    ];
    localChunks.push(localHeader, nameBytes, Array.from(dataBytes));

    const centralHeader = [
      ...u32(0x02014b50),
      ...u16(20), // version made by
      ...u16(20), // version needed
      ...u16(0), // flags
      ...u16(0), // compression
      ...u16(0), // mod time
      ...u16(0), // mod date
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0), // extra length
      ...u16(0), // comment length
      ...u16(0), // disk number
      ...u16(0), // internal attrs
      ...u32(0), // external attrs
      ...u32(offset), // offset of local header
    ];
    centralChunks.push(centralHeader, nameBytes);

    offset += localHeader.length + nameBytes.length + dataBytes.length;
  }

  const centralStart = offset;
  const centralSize = centralChunks.reduce((sum, c) => sum + c.length, 0);
  const endRecord = [
    ...u32(0x06054b50),
    ...u16(0), // disk number
    ...u16(0), // disk with central directory
    ...u16(files.length), // entries this disk
    ...u16(files.length), // total entries
    ...u32(centralSize),
    ...u32(centralStart),
    ...u16(0), // comment length
  ];

  return concatBytes([...localChunks, ...centralChunks, endRecord]);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colLetter(n: number): string {
  let s = "";
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

function cellXml(colIndex: number, rowIndex: number, value: string | number): string {
  const ref = `${colLetter(colIndex + 1)}${rowIndex}`;
  if (typeof value === "number") {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

/** Builds a minimal, valid single-sheet .xlsx workbook from a header row plus data rows. */
export function buildSimpleXlsx(sheetName: string, header: string[], rows: (string | number)[][]): Uint8Array {
  const allRows = [header as (string | number)[], ...rows];
  const rowsXml = allRows
    .map((row, i) => `<row r="${i + 1}">${row.map((v, c) => cellXml(c, i + 1, v)).join("")}</row>`)
    .join("");

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;

  return buildZip([
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRels },
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRels },
    { name: "xl/worksheets/sheet1.xml", content: sheet },
  ]);
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Shared blob-delivery tail: saves via the host's download capability when available (the
 * Claude Artifact "downloads" tool), falling back to a plain anchor click. */
export async function saveBlob(filename: string, blob: Blob): Promise<void> {
  const claude = (window as { claude?: { use: (name: string) => Promise<unknown> } }).claude;
  if (claude) {
    const downloads = (await claude.use("downloads")) as
      | { save: (req: { filename: string; data: Blob }) => Promise<unknown> }
      | null;
    if (downloads) {
      try {
        await downloads.save({ filename, data: blob });
      } catch {
        // Viewer declined or the prompt was rate-limited; nothing more to do.
      }
      return;
    }
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadXlsx(
  filename: string,
  sheetName: string,
  header: string[],
  rows: (string | number)[][]
): Promise<void> {
  const bytes = buildSimpleXlsx(sheetName, header, rows);
  const blob = new Blob([bytes], { type: XLSX_MIME });
  await saveBlob(filename, blob);
}
