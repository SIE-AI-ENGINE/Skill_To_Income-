import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

const isProduction = process.env.NODE_ENV === "production";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not provided. " +
      "Generate one with: openssl rand -base64 32",
  );
}

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session", // created automatically on first run
    createTableIfMissing: true,
  }),
  name: "sie.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    // In production the API and frontend are served over HTTPS, so the
    // cookie can be marked secure + sameSite "none" to safely support a
    // separate frontend origin. In local dev (http://localhost) that
    // combination is rejected by browsers, so we relax it.
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
});
