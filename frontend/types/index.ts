/**
 * Shared domain types now live in the backend workspace package
 * (`@style-sync/backend`), where Prisma models are the source of truth.
 *
 * This module re-exports the type-only entry point so existing `@/types`
 * imports across the frontend keep working unchanged. The `/types` subpath is
 * runtime-free, so importing it from Client Components pulls in no server code.
 */
export type * from "@style-sync/backend/types";
