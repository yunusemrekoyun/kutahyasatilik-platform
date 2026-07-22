export type CsvRecord = Record<string, string>;

export class CsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvError";
  }
}

export function parseCsv(input: string): CsvRecord[] {
  const source = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      if (field.length > 0) throw new CsvError("Tırnak işareti alanın başında olmalıdır.");
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (quoted) throw new CsvError("Kapanmamış tırnak işareti bulundu.");
  row.push(field.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  if (rows.length < 2) throw new CsvError("CSV başlık satırı ve en az bir ilan içermelidir.");

  const headers = rows[0].map((value) => value.trim());
  if (headers.some((value) => !value)) throw new CsvError("CSV başlıkları boş olamaz.");
  if (new Set(headers).size !== headers.length) throw new CsvError("CSV başlıkları benzersiz olmalıdır.");

  return rows.slice(1).map((values) => {
    const result: CsvRecord = {};
    headers.forEach((header, index) => {
      result[header] = values[index] ?? "";
    });
    return result;
  });
}

export function csvTemplate(headers: string[]) {
  return `${headers.join(",")}\n`;
}
