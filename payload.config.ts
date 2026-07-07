import path from "path";
import { fileURLToPath } from "url";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { Articles } from "./payload/collections/Articles";
import { Citations } from "./payload/collections/Citations";
import { ComparisonArticles } from "./payload/collections/ComparisonArticles";
import { GlossaryTerms } from "./payload/collections/Glossary";
import { BibleVerses, QuranVerses } from "./payload/collections/Scripture";
import {
  SourceLibraryCategories,
  SourceLibraryItems,
} from "./payload/collections/SourceLibrary";
import { Users } from "./payload/collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Payload CMS config. Notes:
 * - Site categories, navigation, and research trees deliberately stay in
 *   code (data/site.ts, lib/navigation.ts): their icons, routes, and slug
 *   unions are code-level concerns. Everything editorial lives here.
 * - Localization is enabled from day one (en default, ar planned) because
 *   retrofitting localized fields later is a painful migration.
 * - GraphQL is disabled; the site uses the Local API and (later) REST.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Articles,
    ComparisonArticles,
    Citations,
    QuranVerses,
    BibleVerses,
    GlossaryTerms,
    SourceLibraryCategories,
    SourceLibraryItems,
  ],
  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "العربية", code: "ar", rtl: true },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI ?? "file:./payload/payload.db",
    },
  }),
  graphQL: {
    disable: true,
  },
  secret: process.env.PAYLOAD_SECRET ?? "",
  typescript: {
    outputFile: path.resolve(dirname, "types/payload-types.ts"),
  },
});
