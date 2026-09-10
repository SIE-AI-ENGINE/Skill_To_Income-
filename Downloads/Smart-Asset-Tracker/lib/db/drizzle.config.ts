import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://neondb_owner:npg_FijQL5PD3bXt@ep-wispy-grass-axg4d74u.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});