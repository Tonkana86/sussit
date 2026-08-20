/**
 * Resolves the Postgres connection string from whichever environment
 * variable name the hosting provider's integration actually used.
 *
 * Different Postgres marketplace integrations on Vercel name this
 * differently — a generic "DATABASE_URL" is the most portable name, but
 * Vercel's Neon integration instead creates POSTGRES_URL (pooled, via
 * PgBouncer — preferred for serverless functions, which open many short-lived
 * connections) and DATABASE_URL_UNPOOLED (direct connection). Checking all
 * three means a non-technical user doesn't need to manually copy a sensitive
 * value into a new variable after connecting a database.
 */
export function getPgConnectionString(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;
}
