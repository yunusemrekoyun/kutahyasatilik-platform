import { closeSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("file:")) {
  console.log("SQLite database preparation skipped.");
  process.exit(0);
}

const rawPath = databaseUrl.slice("file:".length).split("?")[0];
const databasePath = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(process.cwd(), rawPath);

mkdirSync(path.dirname(databasePath), { recursive: true });
closeSync(openSync(databasePath, "a"));

console.log(`SQLite database ready: ${databasePath}`);
