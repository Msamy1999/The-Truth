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
    // SQLite cannot DROP a column that is still named by an inline foreign-key
    // definition. Rebuild Payload's polymorphic lock-relation table without
    // the analytics column instead. The migration runner wraps this sequence
    // in a transaction, so rows and indexes are restored together or not at
    // all if a statement fails.
    await db.run(sql`DROP TABLE IF EXISTS \`payload_locked_documents_rels_without_analytics\`;`);
    await db.run(sql`CREATE TABLE \`payload_locked_documents_rels_without_analytics\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`order\` integer,
      \`parent_id\` integer NOT NULL,
      \`path\` text NOT NULL,
      \`users_id\` integer,
      \`articles_id\` integer,
      \`comparison_articles_id\` integer,
      \`citations_id\` integer,
      \`quran_verses_id\` integer,
      \`bible_verses_id\` integer,
      \`glossary_terms_id\` integer,
      \`source_library_categories_id\` integer,
      \`source_library_items_id\` integer,
      FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`comparison_articles_id\`) REFERENCES \`comparison_articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`citations_id\`) REFERENCES \`citations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`quran_verses_id\`) REFERENCES \`quran_verses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`bible_verses_id\`) REFERENCES \`bible_verses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`glossary_terms_id\`) REFERENCES \`glossary_terms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`source_library_categories_id\`) REFERENCES \`source_library_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`source_library_items_id\`) REFERENCES \`source_library_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );`);
    await db.run(sql`INSERT INTO \`payload_locked_documents_rels_without_analytics\` (
      \`id\`, \`order\`, \`parent_id\`, \`path\`, \`users_id\`, \`articles_id\`,
      \`comparison_articles_id\`, \`citations_id\`, \`quran_verses_id\`,
      \`bible_verses_id\`, \`glossary_terms_id\`,
      \`source_library_categories_id\`, \`source_library_items_id\`
    ) SELECT
      \`id\`, \`order\`, \`parent_id\`, \`path\`, \`users_id\`, \`articles_id\`,
      \`comparison_articles_id\`, \`citations_id\`, \`quran_verses_id\`,
      \`bible_verses_id\`, \`glossary_terms_id\`,
      \`source_library_categories_id\`, \`source_library_items_id\`
    FROM \`payload_locked_documents_rels\`;`);
    await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
    await db.run(sql`ALTER TABLE \`payload_locked_documents_rels_without_analytics\` RENAME TO \`payload_locked_documents_rels\`;`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_comparison_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`comparison_articles_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_citations_id_idx\` ON \`payload_locked_documents_rels\` (\`citations_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quran_verses_id_idx\` ON \`payload_locked_documents_rels\` (\`quran_verses_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bible_verses_id_idx\` ON \`payload_locked_documents_rels\` (\`bible_verses_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_glossary_terms_id_idx\` ON \`payload_locked_documents_rels\` (\`glossary_terms_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_source_library_categories__idx\` ON \`payload_locked_documents_rels\` (\`source_library_categories_id\`);`);
    await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_source_library_items_id_idx\` ON \`payload_locked_documents_rels\` (\`source_library_items_id\`);`);
  }
  await db.run(sql`DROP TABLE IF EXISTS \`analytics_events\`;`);
}
