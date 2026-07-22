import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
  try {
    const envFile = readFileSync(".env", "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      const raw = match[2];
      process.env[match[1]] = raw.replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch {
    // Production normally provides these values through the service environment.
  }
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required");
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

function slugify(value) {
  const transliterated = value
    .replaceAll("ı", "i")
    .replaceAll("İ", "I")
    .replaceAll("ş", "s")
    .replaceAll("Ş", "S")
    .replaceAll("ğ", "g")
    .replaceAll("Ğ", "G")
    .replaceAll("ü", "u")
    .replaceAll("Ü", "U")
    .replaceAll("ö", "o")
    .replaceAll("Ö", "O")
    .replaceAll("ç", "c")
    .replaceAll("Ç", "C");

  return (
    transliterated
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "emlak-ofisi"
  );
}

function nextAvailableSlug(base, usedSlugs) {
  let slug = base;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query("BEGIN");

  const existingAgencies = await client.query(
    'SELECT "id", "name", "slug" FROM "Agency" ORDER BY "createdAt" ASC',
  );
  const agenciesByName = new Map(
    existingAgencies.rows.map((agency) => [normalizeName(agency.name), agency]),
  );
  const usedSlugs = new Set(existingAgencies.rows.map((agency) => agency.slug));

  const agents = await client.query(
    `SELECT "id", "agency"
       FROM "Agent"
      WHERE "agencyId" IS NULL
        AND NULLIF(BTRIM("agency"), '') IS NOT NULL
      ORDER BY "createdAt" ASC
      FOR UPDATE`,
  );

  let createdAgencyCount = 0;
  let linkedAgentCount = 0;

  for (const agent of agents.rows) {
    const name = agent.agency.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeName(name);
    let agency = agenciesByName.get(normalizedName);

    if (!agency) {
      agency = {
        id: `agency_${randomUUID().replaceAll("-", "")}`,
        name,
        slug: nextAvailableSlug(slugify(name), usedSlugs),
      };

      await client.query(
        `INSERT INTO "Agency" ("id", "name", "slug", "updatedAt")
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [agency.id, agency.name, agency.slug],
      );
      agenciesByName.set(normalizedName, agency);
      createdAgencyCount += 1;
    }

    const updateAgent = await client.query(
      `UPDATE "Agent"
          SET "agencyId" = $1
        WHERE "id" = $2
          AND "agencyId" IS NULL`,
      [agency.id, agent.id],
    );
    linkedAgentCount += updateAgent.rowCount ?? 0;
  }

  const linkedListings = await client.query(
    `UPDATE "Listing" AS listing
        SET "agencyId" = agent."agencyId"
       FROM "Agent" AS agent
      WHERE listing."agentId" = agent."id"
        AND listing."agencyId" IS NULL
        AND agent."agencyId" IS NOT NULL`,
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify({
      createdAgencies: createdAgencyCount,
      linkedAgents: linkedAgentCount,
      linkedListings: linkedListings.rowCount ?? 0,
    }),
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error("Agency backfill failed");
  throw error;
} finally {
  await client.end().catch(() => undefined);
}
