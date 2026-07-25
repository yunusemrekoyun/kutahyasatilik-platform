const SEQUENTIAL_RUNS = [
  "012345",
  "123456",
  "234567",
  "345678",
  "456789",
  "987654",
  "876543",
  "765432",
  "654321",
];

export type PublicContactNumber = {
  display: string;
  dial: string;
  digits: string;
};

export function parsePublicContactNumber(
  value: string | null | undefined,
): PublicContactNumber | null {
  const display = value?.trim() || "";
  const digits = display.replace(/\D/g, "");

  if (
    digits.length < 7 ||
    digits.length > 15 ||
    /(\d)\1{5,}/.test(digits) ||
    SEQUENTIAL_RUNS.some((sequence) => digits.includes(sequence))
  ) {
    return null;
  }

  return {
    display,
    dial: display.startsWith("+") ? `+${digits}` : digits,
    digits,
  };
}

export function resolvePublicContactNumber(
  ...values: Array<string | null | undefined>
): PublicContactNumber | null {
  for (const value of values) {
    const parsed = parsePublicContactNumber(value);
    if (parsed) return parsed;
  }
  return null;
}
