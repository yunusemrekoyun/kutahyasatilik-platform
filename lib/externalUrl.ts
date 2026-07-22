export type ValidatedExternalUrl = {
  url: string;
  host: string;
  secure: boolean;
};

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  if (
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    (host.includes(":") && (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")))
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return true;
  const [first, second] = octets;
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

/** Validate an admin-managed external link before exposing it publicly. */
export function validateExternalHttpUrl(value: string): ValidatedExternalUrl | null {
  const input = value.trim();
  if (!input || input.length > 2048) return null;

  try {
    const parsed = new URL(input);
    const normalizedHost = parsed.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (
      parsed.username ||
      parsed.password ||
      !normalizedHost ||
      (!normalizedHost.includes(".") && !normalizedHost.includes(":")) ||
      isPrivateHost(normalizedHost)
    ) return null;

    return {
      url: parsed.toString(),
      host: parsed.hostname.replace(/^www\./i, ""),
      secure: parsed.protocol === "https:",
    };
  } catch {
    return null;
  }
}
