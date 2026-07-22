import { describe, expect, it } from "vitest";
import { CsvError, parseCsv } from "../lib/csv";

describe("parseCsv", () => {
  it("parses quoted commas, escaped quotes, and CRLF", () => {
    const rows = parseCsv('externalId,title,price\r\nA-1,"Merkez, 3+1",2500000\r\nA-2,"Bahçeli ""özel"" ev",3000000');
    expect(rows).toEqual([
      { externalId: "A-1", title: "Merkez, 3+1", price: "2500000" },
      { externalId: "A-2", title: 'Bahçeli "özel" ev', price: "3000000" },
    ]);
  });

  it("rejects malformed quoted fields", () => {
    expect(() => parseCsv('externalId,title\nA-1,"Eksik')).toThrow(CsvError);
  });
});
