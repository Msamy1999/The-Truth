/**
 * Compatibility barrel. Existing code imports from "@/types/content";
 * the definitions now live in:
 *   - types/domain.ts — React-free content types (shared with mobile/CMS)
 *   - types/ui.ts     — web component prop types
 * New code should import from the specific module.
 */
export * from "./domain";
export * from "./ui";
