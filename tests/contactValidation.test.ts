import { describe, expect, it } from "vitest";
import {
  parsePublicContactNumber,
  resolvePublicContactNumber,
} from "../lib/contactValidation";

const plausibleNumber = `+${[90, 532, 748, 26, 19].join("")}`;
const repeatedPlaceholder = `+90 555 ${"0".repeat(7)}`;
const sequentialPlaceholder = `+90 ${["123", "456", "78", "90"].join(" ")}`;

describe("public contact number validation", () => {
  it("keeps a plausibly formatted public contact number", () => {
    expect(parsePublicContactNumber(plausibleNumber)).toEqual({
      display: plausibleNumber,
      dial: plausibleNumber,
      digits: plausibleNumber.slice(1),
    });
  });

  it("rejects empty, too short and obvious placeholder values", () => {
    expect(parsePublicContactNumber("")).toBeNull();
    expect(parsePublicContactNumber("12345")).toBeNull();
    expect(parsePublicContactNumber(repeatedPlaceholder)).toBeNull();
    expect(parsePublicContactNumber(sequentialPlaceholder)).toBeNull();
  });

  it("falls back to the next valid configured value", () => {
    expect(
      resolvePublicContactNumber(repeatedPlaceholder, plausibleNumber)?.display,
    ).toBe(plausibleNumber);
  });
});
