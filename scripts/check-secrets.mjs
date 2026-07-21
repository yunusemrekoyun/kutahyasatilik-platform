import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const sensitiveAssignment = /^\s*(?:export\s+)?(POSTGRES_PASSWORD|MYSQL_PASSWORD|MARIADB_PASSWORD|ADMIN_PASSWORD|AUTH_SECRET|CRON_SECRET|SENTRY_AUTH_TOKEN|EXPO_ACCESS_TOKEN|[A-Z0-9_]*API_KEY|[A-Z0-9_]*PRIVATE_KEY)\s*[:=]\s*(.*?)\s*$/i;
const credentialUrl = /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i;
const privateKeyHeader = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

const findings = [];

function isSensitivePath(file) {
  const normalized = file.replaceAll("\\", "/");
  const parts = normalized.split("/");
  const base = parts.at(-1) ?? "";
  const isEnv = /^\.env(?:\.|$)/.test(base) && !/\.example$/i.test(base);
  const isCredentialFile =
    /\.(?:pem|key|p12|pfx|jks|keystore|mobileprovision)$/i.test(base) ||
    /^(?:credentials.*|service-account.*|google-services)\.json$/i.test(base) ||
    base === "GoogleService-Info.plist";
  const isSecretDirectory = parts.some((part) => part === ".secrets" || part === "secrets");
  return isEnv || isCredentialFile || isSecretDirectory;
}

function isSafeAssignment(value) {
  const trimmed = value.trim();
  return (
    trimmed === "" ||
    trimmed === '""' ||
    trimmed === "''" ||
    trimmed.startsWith("$") ||
    trimmed.includes("process.env")
  );
}

for (const file of trackedFiles) {
  if (isSensitivePath(file)) {
    findings.push(`${file}: takip edilen hassas dosya`);
    continue;
  }

  if (statSync(file).size > 5_000_000) continue;
  const content = readFileSync(file);
  if (content.includes(0)) continue;

  const lines = content.toString("utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (privateKeyHeader.test(line)) {
      findings.push(`${file}:${index + 1}: private key içeriği`);
      return;
    }
    if (credentialUrl.test(line)) {
      findings.push(`${file}:${index + 1}: kullanıcı/parola içeren URL`);
      return;
    }
    if (line.trimStart().startsWith("#") || line.trimStart().startsWith("//")) return;
    const assignment = line.match(sensitiveAssignment);
    if (assignment && !isSafeAssignment(assignment[2])) {
      findings.push(`${file}:${index + 1}: sabit hassas değer ataması (${assignment[1]})`);
    }
  });
}

if (findings.length > 0) {
  console.error("Secret kontrolü başarısız. Değerler güvenlik için gösterilmedi:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log("Secret kontrolü geçti.");
