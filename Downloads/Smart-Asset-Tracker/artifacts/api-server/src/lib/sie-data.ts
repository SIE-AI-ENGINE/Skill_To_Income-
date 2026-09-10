export const opportunities = [
  {
    id: "opp-1",
    rank: 1,
    title: "Power BI Executive Dashboard",
    platform: "Upwork",
    expectedEarnings: "$420–$780",
    demand: 92,
    competition: 38,
    effort: "4–6 days",
    score: 94,
    whyNow:
      "Operations teams are actively replacing spreadsheet reporting with self-serve dashboards before the next planning cycle.",
    description:
      "Build a decision-ready Power BI dashboard that turns messy operational data into a weekly executive view.",
    tags: ["Power BI", "Data storytelling", "High demand"],
  },
  {
    id: "opp-2",
    rank: 2,
    title: "SQL Data Quality Audit",
    platform: "Fiverr",
    expectedEarnings: "$180–$360",
    demand: 86,
    competition: 31,
    effort: "2–3 days",
    score: 89,
    whyNow:
      "More small teams are shipping analytics without dedicated data engineering support, creating a clear audit gap.",
    description:
      "Audit a small business database for duplicate records, broken joins, and reporting blind spots.",
    tags: ["SQL", "Data quality", "Beginner friendly"],
  },
  {
    id: "opp-3",
    rank: 3,
    title: "Python Reporting Automation",
    platform: "LinkedIn",
    expectedEarnings: "$560–$1,100",
    demand: 81,
    competition: 44,
    effort: "5–8 days",
    score: 84,
    whyNow:
      "Teams are looking for lightweight automations that save analysts from repetitive weekly reporting.",
    description:
      "Create a reliable Python workflow that turns recurring CSV exports into a polished reporting pack.",
    tags: ["Python", "Automation", "Recurring work"],
  },
];

export const decomposedSkills = [
  {
    id: "skill-1",
    skill: "Power BI",
    microService: "Executive dashboard design",
    category: "Data visualization",
    demand: 92,
    competition: 38,
    suitability: 96,
    trend: "Rising",
    beginnerFriendly: true,
    description:
      "Translate operational KPIs into a concise dashboard for leaders who need answers at a glance.",
  },
  {
    id: "skill-2",
    skill: "SQL",
    microService: "Data quality audit",
    category: "Analytics engineering",
    demand: 86,
    competition: 31,
    suitability: 91,
    trend: "Rising",
    beginnerFriendly: true,
    description:
      "Find duplicate records, broken relationships, and reporting risks before they affect decisions.",
  },
  {
    id: "skill-3",
    skill: "Python",
    microService: "Reporting workflow automation",
    category: "Automation",
    demand: 81,
    competition: 44,
    suitability: 84,
    trend: "Steady",
    beginnerFriendly: false,
    description:
      "Turn repeatable data preparation into a small, dependable automation that gives time back to a team.",
  },
  {
    id: "skill-4",
    skill: "Machine Learning",
    microService: "Forecasting prototype",
    category: "Applied AI",
    demand: 76,
    competition: 57,
    suitability: 72,
    trend: "Rising",
    beginnerFriendly: false,
    description:
      "Create a practical proof of concept that helps a business understand likely demand or risk.",
  },
];

export const dashboard = {
  userName: "User",
  profileCompletion: 76,
  opportunitiesFound: 12,
  assetsGenerated: 8,
  expectedEarnings: 2840,
  topOpportunity: opportunities[0],
  recentActivity: [
    {
      id: "activity-1",
      title: "Income kit generated",
      detail: "Power BI Executive Dashboard",
      time: "12 min ago",
      tone: "blue",
    },
    {
      id: "activity-2",
      title: "Market signal updated",
      detail: "Power BI demand is up 14%",
      time: "1 hr ago",
      tone: "green",
    },
    {
      id: "activity-3",
      title: "Portfolio asset deployed",
      detail: "SQL Data Quality Audit",
      time: "Yesterday",
      tone: "purple",
    },
  ],
  trend: [
    { label: "Mon", value: 62 },
    { label: "Tue", value: 66 },
    { label: "Wed", value: 64 },
    { label: "Thu", value: 72 },
    { label: "Fri", value: 78 },
    { label: "Sat", value: 82 },
    { label: "Sun", value: 86 },
  ],
};

export const market = {
  marketScore: 88,
  demand: 86,
  competition: 41,
  trend: "+14.8%",
  sources: [
    { name: "Upwork", value: 42, color: "#2f64e8" },
    { name: "Fiverr", value: 27, color: "#37b77a" },
    { name: "LinkedIn", value: 19, color: "#8c6ce6" },
    { name: "Other", value: 12, color: "#b8c4d8" },
  ],
  categories: [
    { name: "Data visualization", demand: 92, competition: 38, score: 94 },
    { name: "Analytics engineering", demand: 86, competition: 31, score: 89 },
    { name: "Automation", demand: 81, competition: 44, score: 84 },
    { name: "Applied AI", demand: 76, competition: 57, score: 72 },
  ],
  weeklyTrend: [
    { label: "W1", value: 61 },
    { label: "W2", value: 65 },
    { label: "W3", value: 68 },
    { label: "W4", value: 70 },
    { label: "W5", value: 76 },
    { label: "W6", value: 83 },
  ],
};

export const analytics = {
  views: 1842,
  clicks: 416,
  responses: 78,
  conversions: 19,
  conversionRate: 4.4,
  performance: [
    { label: "Jan", value: 18 },
    { label: "Feb", value: 24 },
    { label: "Mar", value: 22 },
    { label: "Apr", value: 31 },
    { label: "May", value: 38 },
    { label: "Jun", value: 46 },
  ],
  recommendations: [
    "Lead with the measurable outcome in your first two lines. Variants with a clear business result receive 1.8× more replies.",
    "Your Power BI assets are outperforming Python assets by 22%. Prioritize dashboard work in the next two weeks.",
    "Shorten the first outreach message to 70 words or fewer to improve response quality.",
  ],
  experiments: [
    {
      id: "experiment-1",
      name: "Dashboard gig headline",
      status: "Completed",
      variantA: 3.1,
      variantB: 4.8,
      winner: "Variant B",
    },
    {
      id: "experiment-2",
      name: "Portfolio call to action",
      status: "Running",
      variantA: 42,
      variantB: 39,
      winner: "Collecting data",
    },
  ],
};

export const defaultProfile = {
  name: "User",
  email: "user@example.com",
  experience: "Intermediate",
  goals: ["Build a portfolio", "Find first client"],
  availability: "8–12 hours / week",
  platforms: ["Upwork", "LinkedIn"],
  incomeGoal: "$1,000–$2,500 / month",
  workType: "Freelance projects",
  skills: ["Python", "SQL", "Power BI", "Machine Learning"],
  completion: 76,
};

export const defaultAssets = [
  {
    id: "asset-1",
    name: "Power BI Dashboard — Gig Listing",
    type: "Gig listing",
    status: "Live",
    createdAt: "2026-08-12",
    views: 428,
    clicks: 94,
    responses: 14,
    content: "I build executive Power BI dashboards that make weekly decisions easier.",
    opportunityId: "opp-1",
  },
  {
    id: "asset-2",
    name: "Retail KPI Dashboard Case Study",
    type: "Portfolio project",
    status: "Draft",
    createdAt: "2026-08-11",
    views: 132,
    clicks: 26,
    responses: 5,
    content: "A before-and-after case study for a retail operations team.",
    opportunityId: "opp-1",
  },
  {
    id: "asset-3",
    name: "SQL Audit Outreach Sequence",
    type: "Outreach scripts",
    status: "Live",
    createdAt: "2026-08-09",
    views: 318,
    clicks: 71,
    responses: 11,
    content: "Three concise messages for starting a useful data quality conversation.",
    opportunityId: "opp-2",
  },
];

export const kitFor = (opportunityId: string) => {
  const opportunity =
    opportunities.find((item) => item.id === opportunityId) ?? opportunities[0];
  return {
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    generatedAt: "2026-08-14T09:30:00.000Z",
    assets: [
      {
        id: "kit-gig",
        type: "Gig listing",
        title: `${opportunity.title} gig listing`,
        status: "Ready to edit",
        content: `I help teams turn ${opportunity.title.toLowerCase()} into a clear weekly decision tool. In this project, you will receive a practical deliverable, a short walkthrough, and recommendations for keeping it useful after handoff.`,
        description: "A platform-ready listing that leads with the client's outcome.",
      },
      {
        id: "kit-portfolio",
        type: "Portfolio project",
        title: "Retail operations dashboard case study",
        status: "Ready to edit",
        content:
          "Show the messy starting point, the transformation, and three decisions the final dashboard made easier. Keep the story measurable and specific.",
        description: "A small portfolio brief that makes your skill visible.",
      },
      {
        id: "kit-landing",
        type: "Landing page",
        title: "Make your weekly reporting decision-ready",
        status: "Ready to edit",
        content:
          "Stop rebuilding the same report every Monday. Get a focused dashboard designed around the metrics your team actually uses.",
        description: "A focused page outline for sharing the offer directly.",
      },
      {
        id: "kit-outreach",
        type: "Outreach scripts",
        title: "Three warm outreach openers",
        status: "Ready to edit",
        content:
          "Hi — I noticed your team is growing its reporting workflow. I build concise dashboards that help operators spot the next action without digging through a spreadsheet. Would a quick example be useful?",
        description: "A short, respectful opener that starts with relevance.",
      },
    ],
  };
};