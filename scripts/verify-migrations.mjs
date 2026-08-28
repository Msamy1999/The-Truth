/* global console, process */

import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

async function runDatabaseHelper(mode) {
  const databaseUrl = process.env.DATABASE_URI;
  if (!databaseUrl) throw new Error("DATABASE_URI is required for migration verification");

  const client = createClient({ url: databaseUrl });
  try {
    if (mode === "--seed-lock-relation") {
      const article = await client.execute("SELECT id FROM articles LIMIT 1");
      const articleId = article.rows[0]?.id;
      if (articleId === undefined) {
        throw new Error("Schema fixture did not create the audit article");
      }

      const locked = await client.execute(
        "INSERT INTO payload_locked_documents (global_slug) VALUES (NULL) RETURNING id",
      );
      const lockedId = locked.rows[0]?.id;
      if (lockedId === undefined) {
        throw new Error("Could not create a lock-relation fixture");
      }

      await client.execute({
        sql: "INSERT INTO payload_locked_documents_rels (`order`, parent_id, path, articles_id) VALUES (?, ?, ?, ?)",
        args: [1, lockedId, "audit", articleId],
      });
      return;
    }

    const [foreignKeys, columns, indexes, tables, migrations, relationRows] =
      await Promise.all([
        client.execute("PRAGMA foreign_key_check"),
        client.execute("PRAGMA table_info(payload_locked_documents_rels)"),
        client.execute("PRAGMA index_list(payload_locked_documents_rels)"),
        client.execute(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'analytics_events'",
        ),
        client.execute({
          sql: "SELECT name FROM payload_migrations WHERE name = ?",
          args: ["20260823_analytics_events"],
        }),
        client.execute(
          "SELECT COUNT(*) AS count FROM payload_locked_documents_rels",
        ),
      ]);

    console.log(
      JSON.stringify({
        foreignKeyViolations: foreignKeys.rows.length,
        hasAnalyticsColumn: columns.rows.some(
          (column) => column.name === "analytics_events_id",
        ),
        hasAnalyticsIndex: indexes.rows.some(
          (index) =>
            index.name ===
            "payload_locked_documents_rels_analytics_events_id_idx",
        ),
        hasAnalyticsTable: tables.rows.length === 1,
        migrationApplied: migrations.rows.length === 1,
        relationRows: Number(relationRows.rows[0]?.count ?? 0),
      }),
    );
  } finally {
    client.close();
  }
}

const helperMode = process.argv[2];
if (helperMode === "--seed-lock-relation" || helperMode === "--schema-state") {
  await runDatabaseHelper(helperMode);
  process.exit(0);
}

const projectRoot = process.cwd();
const temporaryRoot = realpathSync(tmpdir());
const auditDirectory = mkdtempSync(
  path.join(temporaryRoot, "straight-path-migration-audit-"),
);
const databasePath = path.join(auditDirectory, "payload.db");
const databaseUrl = `file:${databasePath.replaceAll(path.sep, "/")}`;
const childEnvironment = {
  ...process.env,
  DATABASE_URI: databaseUrl,
  PAYLOAD_SECRET:
    process.env.PAYLOAD_SECRET ?? "migration-audit-only-placeholder",
};
const tsxCli = path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
const payloadCli = path.join(projectRoot, "node_modules", "payload", "bin.js");
const thisScript = fileURLToPath(import.meta.url);

function run(label, args, input) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    env: childEnvironment,
    encoding: "utf8",
    input,
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120_000,
  });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`${label} failed${details ? `:\n${details}` : ""}`);
  }
  return result.stdout.trim();
}

function schemaState() {
  return JSON.parse(run("Schema inspection", [thisScript, "--schema-state"]));
}

function seedLockRelation() {
  run("Lock-relation fixture", [thisScript, "--seed-lock-relation"]);
}

function assertState(label, state, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (state[key] !== value) {
      throw new Error(
        `${label}: expected ${key}=${String(value)}, received ${String(state[key])}`,
      );
    }
  }
}

let auditFailure;
try {
  // Initializing through the real importer creates the complete Payload schema
  // without copying a developer or production database into the audit.
  run("Temporary schema initialization", [
    tsxCli,
    "payload/import-drafts.ts",
    "--status=reviewed",
    "why-islam",
  ]);
  seedLockRelation();

  run("Migration up", [payloadCli, "migrate"], "y\n");
  assertState("after migration up", schemaState(), {
    foreignKeyViolations: 0,
    hasAnalyticsColumn: true,
    hasAnalyticsIndex: true,
    hasAnalyticsTable: true,
    migrationApplied: true,
    relationRows: 1,
  });

  run("Migration down", [payloadCli, "migrate:down"]);
  assertState("after migration down", schemaState(), {
    foreignKeyViolations: 0,
    hasAnalyticsColumn: false,
    hasAnalyticsIndex: false,
    hasAnalyticsTable: false,
    migrationApplied: false,
    relationRows: 1,
  });

  run("Migration re-apply", [payloadCli, "migrate"], "y\n");
  assertState("after migration re-apply", schemaState(), {
    foreignKeyViolations: 0,
    hasAnalyticsColumn: true,
    hasAnalyticsIndex: true,
    hasAnalyticsTable: true,
    migrationApplied: true,
    relationRows: 1,
  });

  console.log("Migration up/down/up verification passed.");
} catch (error) {
  auditFailure = error;
}

try {
  const resolvedAuditDirectory = realpathSync(auditDirectory);
  const expectedPrefix = `${temporaryRoot}${path.sep}`;
  if (!resolvedAuditDirectory.startsWith(expectedPrefix)) {
    throw new Error(
      `Refusing to remove audit directory outside the system temp folder: ${resolvedAuditDirectory}`,
    );
  }
  // On Windows realpathSync can return an extended-length `\\?\` path that
  // Node's recursive remover rejects even though the ordinary path is valid.
  // Validate the resolved target above, then remove through the original path.
  rmSync(auditDirectory, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 250,
  });
} catch (error) {
  auditFailure ??= error;
}

if (auditFailure) {
  throw auditFailure;
}
