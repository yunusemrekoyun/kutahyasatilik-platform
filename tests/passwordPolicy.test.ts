import { describe, expect, it } from "vitest";

import {
  isPasswordLengthValid,
  PASSWORD_ERROR,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT,
} from "../lib/passwordPolicy";

describe("password policy", () => {
  it("keeps the public copy aligned with both boundaries", () => {
    expect(PASSWORD_REQUIREMENT).toContain(String(PASSWORD_MIN_LENGTH));
    expect(PASSWORD_REQUIREMENT).toContain(String(PASSWORD_MAX_LENGTH));
    expect(PASSWORD_ERROR).toContain(String(PASSWORD_MIN_LENGTH));
    expect(PASSWORD_ERROR).toContain(String(PASSWORD_MAX_LENGTH));
  });

  it("rejects passwords below the minimum length", () => {
    expect(isPasswordLengthValid("x".repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      false,
    );
  });

  it("accepts both inclusive length boundaries", () => {
    expect(isPasswordLengthValid("x".repeat(PASSWORD_MIN_LENGTH))).toBe(true);
    expect(isPasswordLengthValid("x".repeat(PASSWORD_MAX_LENGTH))).toBe(true);
  });

  it("rejects passwords above the maximum length", () => {
    expect(isPasswordLengthValid("x".repeat(PASSWORD_MAX_LENGTH + 1))).toBe(
      false,
    );
  });
});
