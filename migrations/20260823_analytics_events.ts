import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-sqlite";

/** Adds the consented first-party analytics table to an existing Payload DB. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`analytics_events\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`visitor_id\` text NOT NULL,
    \`session_id\` text NOT NULL,
    \`recorded_at\` text NOT NULL,
    \`entered_at\` text NOT NULL,
    \`path\` text NOT NULL,
    \`title\` text NOT NULL,
    \`entry_referrer\` text,
    \`duration_ms\` numeric NOT NULL,
    \`duration_label\` text NOT NULL DEFAULT '0s',
    \`device_category\` text NOT NULL,
    \`browser_category\` text NOT NULL,
    \`language\` text,
    \`country\` text,
    \`region\` text,
    \`city\` text,
    \`exit_reason\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_visitor_id_idx\` ON \`analytics_events\` (\`visitor_id\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_session_id_idx\` ON \`analytics_events\` (\`session_id\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_recorded_at_idx\` ON \`analytics_events\` (\`recorded_at\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_path_idx\` ON \`analytics_events\` (\`path\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_country_idx\` ON \`analytics_events\` (\`country\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_updated_at_idx\` ON \`analytics_events\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`analytics_events_created_at_idx\` ON \`analytics_events\` (\`created_at\`);`);
  const analyticsColumns = (await db.run(
    sql`PRAGMA table_info(\`analytics_events\`);`,
  )) as unknown as { rows?: Array<{ name?: string }> };
  if (
    !analyticsColumns.rows?.some(
      (column) => column.name === "duration_label",
    )
  ) {
    await db.run(sql`ALTER TABLE \`analytics_events\` ADD \`duration_label\` text NOT NULL DEFAULT '0s';`);
  }
  const lockedRelationColumns = (await db.run(
    sql`PRAGMA table_info(\`payload_locked_documents_rels\`);`,
  )) as unknown as { rows?: Array<{ name?: string }> };
  if (
    !lockedRelationColumns.rows?.some(
      (column) => column.name === "analytics_events_id",
    )
  ) {
    await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`analytics_events_id\` integer REFERENCES \`analytics_events\`(\`id\`) ON DELETE cascade;`);
  }
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_analytics_events_id_idx\` ON \`payload_locked_documents_rels\` (\`analytics_events_id\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_analytics_events_id_idx\`;`);
  const lockedRelationColumns = (await db.run(
    sql`PRAGMA table_info(\`payload_locked_documents_rels\`);`,
  )) as unknown as { rows?: Array<{ name?: string }> };
  if (
    lockedRelationColumns.rows?.some(
      (column) => column.name === "analytics_events_id",
    )
  ) {
    await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`analytics_events_id\`;`);
  }
  await db.run(sql`DROP TABLE IF EXISTS \`analytics_events\`;`);
}
