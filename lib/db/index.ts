import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Provision a Neon Postgres database via the " +
      "Vercel Marketplace integration and copy the connection string into " +
      "your local .env (see .env.example).",
  );
}

// Reuse the postgres client across hot reloads in development to avoid
// exhausting the Neon connection pool.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(connectionString, {
    // Neon serverless tier: keep the pool small per serverless instance.
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
