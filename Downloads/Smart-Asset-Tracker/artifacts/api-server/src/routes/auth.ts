import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { AuthUser, LoginBody, SignupBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/auth";
import { ensureProfileForUser } from "../lib/profile";

const router: IRouter = Router();

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash }).returning();
  if (!user) {
    res.status(500).json({ error: "Could not create account" });
    return;
  }

  const profile = await ensureProfileForUser(user.id, { name: user.name, email: user.email });

  // Regenerate the session on privilege change (signup) to prevent session fixation.
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "Could not start session" });
      return;
    }
    req.session.userId = user.id;
    res.status(201).json(
      AuthUser.parse({ id: user.id, name: user.name, email: user.email, onboarded: profile.onboarded }),
    );
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordOk) {
    res.status(401).json({ error: "Incorrect email or password" });
    return;
  }

  const profile = await ensureProfileForUser(user.id, { name: user.name, email: user.email });

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "Could not start session" });
      return;
    }
    req.session.userId = user.id;
    res.json(AuthUser.parse({ id: user.id, name: user.name, email: user.email, onboarded: profile.onboarded }));
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Could not log out" });
      return;
    }
    res.clearCookie("sie.sid");
    res.status(204).end();
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    // Session points at a user that no longer exists — clear it.
    req.session.destroy(() => undefined);
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const profile = await ensureProfileForUser(user.id, { name: user.name, email: user.email });
  res.json(AuthUser.parse({ id: user.id, name: user.name, email: user.email, onboarded: profile.onboarded }));
});

export default router;
