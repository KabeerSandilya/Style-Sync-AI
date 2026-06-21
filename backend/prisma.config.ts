// Prisma config for the @style-sync/backend workspace package.
// Env vars (DATABASE_URL, etc.) live in `frontend/.env` as the single source of
// truth shared with the Next.js runtime, so we load that file here for Prisma
// CLI commands run from the backend package.
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "prisma/config";

const here = fileURLToPath(new URL(".", import.meta.url));

config({ path: resolve(here, "../frontend/.env") });
config({ path: resolve(here, "../frontend/.env.local"), override: true });

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
