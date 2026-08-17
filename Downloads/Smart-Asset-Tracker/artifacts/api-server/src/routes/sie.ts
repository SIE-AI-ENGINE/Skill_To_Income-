import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sieAssetsTable, sieProfilesTable } from "@workspace/db";
import {
  DecomposeSkillsBody,
  DecomposeSkillsResponse,
  GetAnalyticsResponse,
  GetAssetsResponse,
  GetDashboardResponse,
  GetIncomeKitResponse,
  GetMarketIntelligenceResponse,
  GetOpportunitiesResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  GetProfileResponse,
  GetSkillDecompositionQueryParams,
  GetSkillDecompositionResponse,
  GenerateIncomeKitBody,
  GenerateIncomeKitResponse,
  UpdateAssetBody,
  UpdateAssetParams,
  UpdateAssetResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import {
  analytics,
  dashboard,
  decomposedSkills,
  defaultAssets,
  kitFor,
  market,
  opportunities,
} from "../lib/sie-data";
import { requireAuth } from "../lib/auth";
import { ensureProfileForUser } from "../lib/profile";

const router: IRouter = Router();

let currentKit = kitFor("opp-1");

async function ensureSeedAssets(): Promise<void> {
  const assets = await db.select({ id: sieAssetsTable.id }).from(sieAssetsTable).limit(1);
  if (assets.length === 0) {
    await db.insert(sieAssetsTable).values(
      defaultAssets.map((asset) => ({
        ...asset,
        createdAt: new Date(`${asset.createdAt}T00:00:00.000Z`),
      })),
    );
  }
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  res.json(GetDashboardResponse.parse(dashboard));
});

router.get("/skills/decomposition", async (req, res): Promise<void> => {
  const parsed = GetSkillDecompositionQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const filter = parsed.data.filter?.toLowerCase();
  const filtered = filter
    ? decomposedSkills.filter((skill) => {
        if (filter.includes("demand")) return skill.demand >= 85;
        if (filter.includes("competition")) return skill.competition <= 40;
        if (filter.includes("trending")) return skill.trend === "Rising";
        if (filter.includes("beginner")) return skill.beginnerFriendly;
        return true;
      })
    : decomposedSkills;
  res.json(GetSkillDecompositionResponse.parse(filtered));
});

router.post("/skills/decomposition", async (req, res): Promise<void> => {
  const parsed = DecomposeSkillsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const normalized = new Set(parsed.data.skills.map((skill) => skill.toLowerCase()));
  const filtered = decomposedSkills.filter((skill) => normalized.has(skill.skill.toLowerCase()));
  res.json(DecomposeSkillsResponse.parse(filtered.length > 0 ? filtered : decomposedSkills));
});

router.get("/market", async (_req, res): Promise<void> => {
  res.json(GetMarketIntelligenceResponse.parse(market));
});

router.get("/opportunities", async (_req, res): Promise<void> => {
  res.json(GetOpportunitiesResponse.parse(opportunities));
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const parsed = GetOpportunityParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const opportunity = opportunities.find((item) => item.id === parsed.data.id);
  if (!opportunity) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(GetOpportunityResponse.parse(opportunity));
});

router.get("/income-kit", async (_req, res): Promise<void> => {
  res.json(GetIncomeKitResponse.parse(currentKit));
});

router.post("/income-kit", async (req, res): Promise<void> => {
  const parsed = GenerateIncomeKitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  currentKit = kitFor(parsed.data.opportunityId);
  res.json(GenerateIncomeKitResponse.parse(currentKit));
});

router.get("/assets", async (_req, res): Promise<void> => {
  await ensureSeedAssets();
  const assets = await db.select().from(sieAssetsTable);
  res.json(
    GetAssetsResponse.parse(
      assets.map((asset) => ({
        ...asset,
        createdAt: asset.createdAt.toISOString().slice(0, 10),
      })),
    ),
  );
});

router.patch("/assets/:id", async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateAssetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  await ensureSeedAssets();
  const [asset] = await db
    .update(sieAssetsTable)
    .set(body.data)
    .where(eq(sieAssetsTable.id, params.data.id))
    .returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(
    UpdateAssetResponse.parse({
      ...asset,
      createdAt: asset.createdAt.toISOString().slice(0, 10),
    }),
  );
});

router.get("/analytics", async (_req, res): Promise<void> => {
  res.json(GetAnalyticsResponse.parse(analytics));
});

// --- Profile -----------------------------------------------------------
// These two routes now require a signed-in user and always read/write that
// specific user's profile row (see lib/profile.ts), instead of a single
// shared demo row. This is also where the onboarding flow's data lands.

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const profile = await ensureProfileForUser(req.session.userId!);
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  await ensureProfileForUser(req.session.userId!);
  const [profile] = await db
    .update(sieProfilesTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(sieProfilesTable.userId, req.session.userId!))
    .returning();
  res.json(UpdateProfileResponse.parse(profile));
});

export default router;
