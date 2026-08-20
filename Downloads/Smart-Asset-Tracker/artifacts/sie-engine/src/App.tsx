import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Globe2,
  Grid2X2,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, Route, Switch, useLocation, useParams } from "wouter";
import {
  getGetAssetsQueryKey,
  getGetIncomeKitQueryKey,
  getGetOpportunityQueryKey,
  getGetProfileQueryKey,
  getGetSkillDecompositionQueryKey,
  getMeQueryKey,
  useDecomposeSkills,
  useGenerateIncomeKit,
  useGetAnalytics,
  useGetAssets,
  useGetDashboard,
  useGetIncomeKit,
  useGetMarketIntelligence,
  useGetOpportunity,
  useGetOpportunities,
  useGetProfile,
  useGetSkillDecomposition,
  useUpdateAsset,
  useUpdateProfile,
} from "@workspace/api-client-react";
import type {
  Asset,
  IncomeKit,
  KitAsset,
  Opportunity,
  SkillDecomposition,
} from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, authErrorMessage, useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient();

type Skill = SkillDecomposition;

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-logo">
      <div
        className={`relative grid h-9 w-9 place-items-center rounded-xl ${inverse ? "bg-white/12 text-white" : "bg-primary text-primary-foreground"}`}
      >
        <span className="display text-lg font-extrabold">S</span>
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" />
      </div>
      <div
        className={`leading-tight ${inverse ? "text-white" : "text-foreground"}`}
      >
        <div className="display text-[14px] font-extrabold tracking-[-.03em]">
          Skill-to-Income
        </div>
        <div
          className={`text-[10px] font-semibold tracking-[.08em] ${inverse ? "text-white/55" : "text-muted-foreground"}`}
        >
          AI ENGINE <span className="text-primary">(SIE)</span>
        </div>
      </div>
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  testId,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  testId?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[.98] ${variant === "primary" ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(33,105,195,.18)] hover:-translate-y-0.5 hover:brightness-105" : variant === "dark" ? "bg-[#17263e] text-white hover:bg-[#203451]" : variant === "secondary" ? "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-primary"} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl`}
    >
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="display text-balance text-3xl font-extrabold leading-[1.08] tracking-[-.055em] text-foreground md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function Sparkline({
  values = [],
  color = "#2169c3",
  height = 80,
}: {
  values?: number[];
  color?: string;
  height?: number;
}) {
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 100},${height - 10 - ((v - Math.min(...values)) / (Math.max(...values) - Math.min(...values) || 1)) * (height - 24)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="h-full w-full overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="chart-line"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function BarChart({
  values = [],
  labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
}: {
  values?: number[];
  labels?: string[];
}) {
  const shown = values.slice(-labels.length);
  return (
    <div className="flex h-full items-end gap-2">
      {shown.map((value, i) => (
        <div
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          key={`${value}-${i}`}
        >
          <div
            className={`w-full rounded-t-md transition-all duration-500 ${i === shown.length - 1 ? "bg-primary" : "bg-primary/15"}`}
            style={{ height: `${Math.max(12, value)}%` }}
          />
          <span className="mono text-[9px] text-muted-foreground">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusPill({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "slate";
}) {
  const tones = {
    blue: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-secondary text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function PublicNav({ onLogin }: { onLogin: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            ["Features", "/features"],
            ["How it works", "/how-it-works"],
            ["About", "/about"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onLogin} testId="button-login">
            Log in
          </Button>
          <Button
            onClick={onLogin}
            className="hidden sm:inline-flex"
            testId="button-get-started"
          >
            Get started <ArrowRight size={15} />
          </Button>
          <button
            onClick={onLogin}
            aria-label="Open demo sign in"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
            data-testid="button-mobile-login"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(
        authErrorMessage(
          err,
          mode === "signup"
            ? "Could not create your account."
            : "Incorrect email or password.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#10213b]/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="modal-login"
    >
      <div className="surface animate-rise relative w-full max-w-[430px] p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Close sign in"
          data-testid="button-close-login"
        >
          <X size={17} />
        </button>
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-2xl font-extrabold text-white">
            S
          </div>
          <h2 className="display text-2xl font-extrabold tracking-[-.04em]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Set up your SIE workspace in under a minute."
              : "Sign in to continue to your workspace."}
          </p>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            data-testid="button-mode-login"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            data-testid="button-mode-signup"
          >
            Sign up
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block text-xs font-bold text-foreground">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:ring-4"
                placeholder="Your name"
                required
                minLength={1}
                data-testid="input-signup-name"
              />
            </label>
          )}
          <label className="block text-xs font-bold text-foreground">
            Email address
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:ring-4"
              placeholder="you@example.com"
              type="email"
              required
              data-testid="input-login-email"
            />
          </label>
          <label className="block text-xs font-bold text-foreground">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-primary/20 transition focus:ring-4"
              placeholder={
                mode === "signup" ? "At least 8 characters" : "••••••••"
              }
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              data-testid="input-login-password"
            />
          </label>
          {error && (
            <p
              className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
              data-testid="text-auth-error"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="h-12 w-full"
            testId="button-submit-auth"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === "signup" ? "Create account" : "Log in"}{" "}
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
          Your account and data stay in your own database — this is a real
          sign-in, not a demo.
        </p>
      </div>
    </div>
  );
}

function Landing({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="noise overflow-hidden">
      <PublicNav onLogin={onLogin} />
      <main>
        <section className="blue-grid relative border-b border-border/70">
          <div className="absolute -right-40 -top-52 h-[530px] w-[530px] rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 md:grid-cols-[.9fr_1.1fr] md:items-center md:px-8 md:pb-28 md:pt-24">
            <div className="animate-rise">
              <div className="eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> An
                explainable AI project for practical work
              </div>
              <h1 className="display max-w-xl text-balance text-5xl font-extrabold leading-[.98] tracking-[-.075em] md:text-[76px]">
                From learning
                <br />
                <span className="text-primary">to earning.</span>
              </h1>
              <p className="mt-6 max-w-md text-[16px] leading-7 text-muted-foreground">
                SIE maps the skills you already have to realistic, evidence-led
                income opportunities — then helps you take the first useful
                step.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={onLogin}
                  className="h-12 px-5"
                  testId="button-hero-start"
                >
                  Explore the engine <ArrowRight size={16} />
                </Button>
                <Link
                  href="/how-it-works"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-secondary"
                  data-testid="link-hero-how-it-works"
                >
                  <Play size={15} className="text-primary" /> See how it works
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-5 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  {["AR", "JM", "LK"].map((x) => (
                    <div
                      key={x}
                      className="grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-secondary text-[10px] font-bold text-primary"
                    >
                      {x}
                    </div>
                  ))}
                </div>
                <span>
                  Built for a thoughtful first move,
                  <br />
                  not a noisy side-hustle pitch.
                </span>
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <SectionTitle
            eyebrow="The SIE method"
            title="A clearer path from capability to possibility."
            description="Most career tools start with a job title. SIE starts with your evidence: the things you can already do, and the conditions where those skills are useful."
          />
          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {[
              ["01", "Skill", "Start with what you can already do."],
              ["02", "Decompose", "Turn broad skills into small services."],
              [
                "03",
                "Analyze market",
                "Read demand without hiding the trade-offs.",
              ],
              ["04", "Rank opportunity", "Choose the next move with reasons."],
              [
                "05",
                "Generate income kit",
                "Leave with words and proof to share.",
              ],
            ].map(([num, title, desc], i) => (
              <div
                key={num}
                className={`surface-tight group p-5 transition hover:-translate-y-1 hover:border-primary/30 ${i === 0 ? "bg-primary text-white" : ""}`}
              >
                <div
                  className={`mono text-[11px] ${i === 0 ? "text-white/60" : "text-primary"}`}
                >
                  {num}
                </div>
                <div
                  className={`mt-10 text-lg font-extrabold ${i === 0 ? "text-white" : ""}`}
                >
                  {title}
                </div>
                <p
                  className={`mt-2 text-xs leading-5 ${i === 0 ? "text-white/65" : "text-muted-foreground"}`}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-y border-border/70 bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[.75fr_1.25fr] md:items-center md:px-8">
            <SectionTitle
              eyebrow="Made to be understood"
              title="Every recommendation comes with a why."
              description="SIE is designed for a final-year demonstration, so the intelligence stays visible. See the signal, the trade-off and the reason behind the recommendation — not just a confident answer."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Feature
                icon={Network}
                title="Skill decomposition"
                copy="Break a broad skill into a service someone can actually buy."
              />
              <Feature
                icon={TrendingUp}
                title="Market intelligence"
                copy="Compare demand, competition and momentum in one view."
              />
              <Feature
                icon={Target}
                title="Opportunity ranking"
                copy="See what fits your constraints, not a generic top ten list."
              />
              <Feature
                icon={FileText}
                title="Income kit"
                copy="Generate an offer, proof project, page and outreach scripts."
              />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="surface overflow-hidden bg-[#173762] p-7 text-white md:p-12">
            <div className="grid gap-10 md:grid-cols-[1fr_.85fr] md:items-center">
              <div>
                <div className="eyebrow text-[#7edbea]">
                  Start with one honest input
                </div>
                <h2 className="display mt-4 max-w-lg text-4xl font-extrabold tracking-[-.06em] md:text-6xl">
                  Your next income stream may already be in your notes.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
                  Bring the skills, projects and tools you have now. SIE will
                  help you make the next step smaller and more specific.
                </p>
                <Button
                  onClick={onLogin}
                  variant="secondary"
                  className="mt-8 border-white/20 bg-white/10 text-white hover:bg-white/15"
                  testId="button-final-cta"
                >
                  Open the demo <ArrowRight size={16} />
                </Button>
              </div>
              <div className="relative hidden min-h-[250px] md:block">
                <div className="absolute right-5 top-2 h-48 w-48 rounded-full border border-[#7edbea]/20" />
                <div className="absolute right-16 top-12 h-28 w-28 rounded-full border border-[#7edbea]/30" />
                <div className="absolute right-28 top-[92px] h-3 w-3 rounded-full bg-[#7edbea]" />
                <div className="absolute right-5 top-28 w-56 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Fit score</span>
                    <span className="mono text-sm text-[#7edbea]">
                      92 / 100
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[92%] rounded-full bg-[#7edbea]" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
                    <Check size={13} className="text-[#7edbea]" /> Strong match
                    for current skills
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <div className="flex gap-5">
            <Link href="/features" className="hover:text-primary">
              Features
            </Link>
            <Link href="/how-it-works" className="hover:text-primary">
              How it works
            </Link>
            <Link href="/about" className="hover:text-primary">
              About
            </Link>
          </div>
          <span>Final-year project demonstration · SIE 2025</span>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="surface animate-rise-2 relative overflow-hidden bg-white/90 p-4 shadow-[0_30px_80px_rgba(29,74,137,.16)] md:p-5">
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ef6b61]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#f2bf57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#6fc38b]" />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <Search size={11} /> Search insights
        </div>
        <div className="h-7 w-7 rounded-full bg-primary/10" />
      </div>
      <div className="grid grid-cols-[48px_1fr] gap-4 pt-5">
        <div className="space-y-3 border-r border-border/70 pr-3">
          <div className="grid h-8 place-items-center rounded-lg bg-primary text-white">
            <LayoutDashboard size={15} />
          </div>
          {[Grid2X2, FileText, BriefcaseBusiness, BarChart3, Settings2].map(
            (Icon, i) => (
              <div
                key={i}
                className="grid h-8 place-items-center rounded-lg text-muted-foreground"
              >
                <Icon size={15} />
              </div>
            ),
          )}
        </div>
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.08em] text-primary">
                Overview
              </div>
              <h3 className="display mt-1 text-2xl font-extrabold tracking-[-.05em]">
                Workspace overview
              </h3>
            </div>
            <div className="rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-white">
              New insight
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              "Profile signal",
              "Opportunities",
              "Expected range",
            ].map((label) => (
              <div className="surface-tight h-[76px] p-3" key={label}>
                <div className="text-[10px] text-muted-foreground">{label}</div>
                <div className="skeleton mt-3 h-5 w-2/3 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_.75fr]">
            <div className="surface-tight p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">Market momentum</span>
                <span className="text-[10px] text-emerald-600">Live</span>
              </div>
              <div className="mt-4 h-28">
                <Sparkline />
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                <span>Trend</span>
              </div>
            </div>
            <div className="surface-tight p-3">
              <span className="text-[11px] font-bold">Top opportunity</span>
              <div className="mt-3 text-sm font-extrabold leading-tight">
                Live opportunity data
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-secondary">
                  <div className="h-full w-1/2 rounded-full bg-accent" />
                </div>
                  <span className="mono text-[10px] text-accent">API</span>
              </div>
              <div className="mt-3 text-[10px] text-muted-foreground">
                Available after sign in
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Feature({
  icon: Icon,
  title,
  copy,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
}) {
  return (
    <div className="surface-tight p-5 transition hover:-translate-y-1 hover:border-primary/30">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <h3 className="mt-5 text-sm font-extrabold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy}</p>
    </div>
  );
}

function PublicExplainer({
  page,
  onLogin,
}: {
  page: "features" | "how" | "about";
  onLogin: () => void;
}) {
  const data =
    page === "features"
      ? {
          label: "Five modules",
          title: "A complete loop, without the black box.",
          copy: "SIE makes the distance between a skill and a paid experiment visible. Each module earns its place in the pipeline.",
          items: [
            [
              "Skill decomposition",
              "Turn broad capability into specific, deliverable micro-services.",
              Network,
            ],
            [
              "Market intelligence",
              "Read demand, competition and momentum across relevant channels.",
              BarChart3,
            ],
            [
              "Opportunity ranking",
              "Balance fit, effort and signal so the best next move rises to the top.",
              Target,
            ],
            [
              "Income kit",
              "Create the practical assets needed to test an offer in the real world.",
              FileText,
            ],
            [
              "Feedback & analytics",
              "Learn from views, clicks and replies instead of guessing what to improve.",
              Activity,
            ],
          ] as [string, string, LucideIcon][],
        }
      : page === "how"
        ? {
            label: "The pipeline",
            title: "Six steps from a skill to a useful experiment.",
            copy: "The engine is intentionally sequential. It keeps the reasoning inspectable and helps a learner move forward one decision at a time.",
            items: [
              [
                "01 · Skill",
                "Name the skills, tools and experience you want to make useful.",
                BookOpen,
              ],
              [
                "02 · Decompose",
                "SIE translates a broad skill into small services with clear outcomes.",
                Network,
              ],
              [
                "03 · Analyze market",
                "Demand, competition and trend signals create the context.",
                TrendingUp,
              ],
              [
                "04 · Rank opportunity",
                "Fit, effort and timing combine into an opportunity score.",
                Target,
              ],
              [
                "05 · Generate income kit",
                "Create a first listing, proof project, page and outreach scripts.",
                FileText,
              ],
              [
                "06 · Learn from feedback",
                "Performance data feeds the next recommendation cycle.",
                RefreshCw,
              ],
            ] as [string, string, LucideIcon][],
          }
        : {
            label: "Why SIE exists",
            title: "A small academic project about practical agency.",
            copy: "SIE explores how explainable AI can help someone turn existing capability into a realistic, testable income path — without promising certainty.",
            items: [
              [
                "The problem",
                "People often have useful skills but no clear translation from capability to a service someone can buy.",
                CircleHelp,
              ],
              [
                "Our approach",
                "Structure the ambiguity: make the inputs, signals, trade-offs and next actions visible.",
                Compass,
              ],
              [
                "Academic context",
                "A final-year demonstration focused on user flow, explainability and responsible use of live data.",
                ShieldCheck,
              ],
            ] as [string, string, LucideIcon][],
          };
  return (
    <div className="noise">
      <PublicNav onLogin={onLogin} />
      <main>
        <section className="blue-grid border-b border-border/70">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
            <div className="max-w-3xl animate-rise">
              <div className="eyebrow">{data.label}</div>
              <h1 className="display mt-4 text-balance text-5xl font-extrabold leading-[.98] tracking-[-.075em] md:text-7xl">
                {data.title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
                {data.copy}
              </p>
            </div>
            <div className="mt-16 grid gap-3 md:grid-cols-2">
              {data.items.map(([title, copy, Icon], i) => (
                <div
                  className={`surface animate-rise-${(i % 3) + 1} flex gap-5 p-6 ${i === 0 ? "border-primary/25 bg-primary/[.03]" : ""}`}
                  key={title}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={19} />
                  </div>
                  <div>
                    <div className="mono text-[10px] text-primary">
                      {page === "how" ? title.split(" · ")[0] : `0${i + 1}`}
                    </div>
                    <h2 className="mt-1 text-lg font-extrabold">
                      {page === "how" ? title.split(" · ")[1] : title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionTitle
                eyebrow="A visible system"
                title="The interface is part of the explanation."
                description="Rather than hide intelligence behind a chat bubble, SIE puts the evidence beside the action: scores, sources, fit notes, drafts and feedback."
              />
              <Button
                onClick={onLogin}
                className="mt-8"
                testId="button-explainer-open-demo"
              >
                Open the demo <ArrowRight size={16} />
              </Button>
            </div>
            <div className="surface blue-grid p-6">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <span className="text-sm font-extrabold">
                  Recommendation trace
                </span>
                <StatusPill tone="green">Explainable</StatusPill>
              </div>
              {[
                "Your SQL + Power BI skills",
                "Demand is strong in small teams",
                "Competition remains manageable",
                "Best first test: weekly KPI reporting",
              ].map((x, i) => (
                <div
                  key={x}
                  className="flex items-center gap-3 border-b border-border/60 py-4 last:border-0"
                >
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${i === 3 ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
                  >
                    {i === 3 ? <Check size={14} /> : i + 1}
                  </div>
                  <span className="text-sm font-semibold">{x}</span>
                  <ChevronRight
                    size={15}
                    className="ml-auto text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/70">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Logo />
        </div>
      </footer>
    </div>
  );
}

const navGroups = [
  {
    label: "Workspace",
    items: [
      ["/dashboard", "Dashboard", LayoutDashboard],
      ["/skills", "Skill decomposition", Network],
      ["/market", "Market intelligence", BarChart3],
      ["/opportunities", "Opportunities", Target],
    ] as [string, string, LucideIcon][],
  },
  {
    label: "Build",
    items: [
      ["/income-kit", "Income kit", FileText],
      ["/assets", "My assets", BriefcaseBusiness],
      ["/analytics", "Feedback & analytics", Activity],
    ] as [string, string, LucideIcon][],
  },
];
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars =
    parts.length >= 2 ? [parts[0][0], parts[1][0]] : [parts[0]?.[0] ?? "?"];
  return chars.join("").toUpperCase();
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const displayName = user?.name ?? "Your workspace";
  return (
    <div className="app-shell flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-[hsl(var(--sidebar))] px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:sticky md:top-0 md:h-[100dvh] md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 px-2">
          <Logo inverse />
        </div>
        <nav className="flex-1 space-y-7">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map(([href, label, Icon]) => (
                  <Link
                    href={href}
                    key={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${location === href ? "bg-sidebar-primary text-white shadow-[0_8px_18px_rgba(39,113,216,.18)]" : "text-white/56 hover:bg-white/[.07] hover:text-white"}`}
                    data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={location === href ? 2.4 : 1.8}
                    />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/35">
              Account
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold ${location === "/settings" ? "bg-sidebar-primary text-white" : "text-white/56 hover:bg-white/[.07] hover:text-white"}`}
              data-testid="link-nav-settings"
            >
              <Settings2 size={16} />
              Settings
            </Link>
          </div>
        </nav>
        <div className="rounded-2xl border border-white/10 bg-white/[.05] p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#78d6df] text-[10px] font-extrabold text-[#173762]">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <div
                className="truncate text-xs font-bold text-white"
                data-testid="text-account-name"
              >
                {displayName}
              </div>
              <div className="truncate text-[10px] text-white/45">
                {user?.email ?? ""}
              </div>
            </div>
            <button
              onClick={() => logout()}
              aria-label="Log out"
              className="ml-auto rounded-lg p-1.5 text-white/45 hover:bg-white/10 hover:text-white"
              data-testid="button-logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-[#10213b]/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          data-testid="button-close-sidebar"
        />
      )}
      <div className="min-w-0 flex-1">
        <TopBar onMenu={() => setOpen(true)} />
        {children}
      </div>
    </div>
  );
}
function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl md:px-8">
      <button
        onClick={onMenu}
        className="mr-3 rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
        aria-label="Open navigation"
        data-testid="button-open-sidebar"
      >
        <Menu size={20} />
      </button>
      <div className="hidden items-center gap-2 text-sm font-bold md:flex">
        <span className="text-muted-foreground">Workspace</span>
        <ChevronRight size={14} className="text-muted-foreground/60" />
        <span>Overview</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground sm:flex"
          data-testid="button-search"
        >
          <Search size={14} /> Search workspace{" "}
          <span className="mono ml-3 text-[9px] text-muted-foreground/70">
            ⌘ K
          </span>
        </button>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
          data-testid="button-notifications"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#dceef1] text-[10px] font-extrabold text-primary">
          {initials(user?.name ?? "?")}
        </div>
      </div>
    </header>
  );
}
function Page({
  children,
  title,
  eyebrow,
  action,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h1 className="display text-3xl font-extrabold tracking-[-.06em] md:text-4xl">
            {title}
          </h1>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
function QueryState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface h-32 p-5">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton mt-5 h-8 w-2/3 rounded" />
            <div className="skeleton mt-3 h-2 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  if (error)
    return (
      <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <RefreshCw size={20} />
        </div>
        <h3 className="mt-4 font-extrabold">Live data is unavailable</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The view could not reach the data service. Retry when you are
          connected.
        </p>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={onRetry}
          testId="button-retry"
        >
          Retry connection
        </Button>
      </div>
    );
  return <>{children}</>;
}
function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "blue" | "teal" | "amber";
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between">
        <div
          className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "teal" ? "bg-accent/10 text-accent" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"}`}
        >
          <Icon size={17} />
        </div>
        <MoreHorizontal size={16} className="text-muted-foreground/60" />
      </div>
      <div className="mt-5 text-[11px] font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="metric-number mt-1 text-3xl">{value}</div>
      <div className="mt-2 text-[11px] font-semibold text-emerald-600">
        {detail}
      </div>
    </div>
  );
}

function DashboardPage() {
  const q = useGetDashboard();
  const d = q.data;
  if (!d) {
    return (
      <Page eyebrow="Overview" title="Your workspace">
        <QueryState
          loading={q.isLoading}
          error={q.isError}
          onRetry={() => q.refetch()}
        >
          {null}
        </QueryState>
      </Page>
    );
  }
  return (
    <Page
      eyebrow="Tuesday, 21 February"
      title={`Good morning, ${d.userName}.`}
      action={
        <Button
          variant="secondary"
          testId="button-dashboard-refresh"
          onClick={() => q.refetch()}
        >
          <RefreshCw size={15} /> Refresh signals
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="surface blue-grid mb-5 overflow-hidden bg-primary/[.03] p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_300px] md:items-center">
            <div>
              <div className="eyebrow">Your SIE snapshot</div>
              <h2 className="display mt-2 max-w-xl text-3xl font-extrabold leading-tight tracking-[-.06em] md:text-4xl">
                You are closer to a testable offer than you think.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                {d.topOpportunity.description}
              </p>
              <Link
                href="/opportunities"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3"
                data-testid="link-dashboard-opportunities"
              >
                Review your ranked opportunities <ArrowRight size={16} />
              </Link>
            </div>
            <div className="surface-tight bg-card/80 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Profile completeness</span>
                <span className="mono text-xs text-primary">
                  {d.profileCompletion}%
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${d.profileCompletion}%` }}
                />
              </div>
              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                Add your preferred platforms to sharpen the ranking.
              </p>
              <Link
                href="/settings"
                className="mt-2 inline-flex text-[11px] font-bold text-primary"
                data-testid="link-complete-profile"
              >
                Complete profile <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Opportunities found"
            value={String(d.opportunitiesFound)}
            detail="From the live opportunity ranking"
            icon={Target}
          />
          <MetricCard
            label="Assets generated"
            value={String(d.assetsGenerated)}
            detail="Generated from your live workspace"
            icon={FileText}
            tone="teal"
          />
          <MetricCard
            label="Expected monthly range"
            value={`$${d.expectedEarnings}`}
            detail="Based on current fit"
            icon={TrendingUp}
            tone="amber"
          />
          <MetricCard
            label="Recent activity"
            value={String(d.recentActivity.length)}
            detail="Live workspace events"
            icon={Network}
          />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold">Market momentum</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Demand signals across your mapped services
                </p>
              </div>
              <StatusPill tone="green">Live signal</StatusPill>
            </div>
            <div className="mt-7 h-48">
              <Sparkline
                values={
                  d.trend.map((x) => x.value)
                }
              />
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              {d.trend.map((point) => <span key={point.label}>{point.label}</span>)}
            </div>
          </div>
          <div className="surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold">Top opportunity</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Best current match
                </p>
              </div>
              <span className="mono text-2xl font-bold text-primary">
                #{d.topOpportunity.rank}
              </span>
            </div>
            <div className="mt-6 rounded-xl bg-secondary/70 p-4">
              <div className="flex items-center gap-2">
                <StatusPill>{d.topOpportunity.platform}</StatusPill>
                <span className="text-[10px] font-semibold text-emerald-600">
                  High fit
                </span>
              </div>
              <h4 className="mt-3 font-extrabold">{d.topOpportunity.title}</h4>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {d.topOpportunity.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="text-xs font-bold">
                  {d.topOpportunity.expectedEarnings}
                </span>
                <span className="mono text-xs text-primary">
                  {d.topOpportunity.score}/100
                </span>
              </div>
            </div>
            <Link
              href={`/opportunities/${d.topOpportunity.id}`}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary"
              data-testid="link-top-opportunity"
            >
              See the reasoning <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="surface mt-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold">Recent activity</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                A quiet log of your engine sessions
              </p>
            </div>
            <Button
              variant="ghost"
              className="px-2"
              testId="button-view-activity"
            >
              View all <ArrowRight size={14} />
            </Button>
          </div>
          <div className="mt-4 divide-y divide-border/70">
            {d.recentActivity?.map(
              (activity: {
                id: string;
                title: string;
                detail: string;
                time: string;
                tone: string;
              }) => (
                <div
                  className="flex items-center gap-3 py-3"
                  key={activity.id}
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Activity size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{activity.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {activity.detail}
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </QueryState>
    </Page>
  );
}

function SkillsPage() {
  const [skills, setSkills] = useState("");
  const [filter, setFilter] = useState("All signals");
  const qc = useQueryClient();
  const filterParams = filter === "All signals" ? undefined : { filter };
  const q = useGetSkillDecomposition(filterParams, {
    query: { queryKey: getGetSkillDecompositionQueryKey(filterParams) },
  });
  const mutation = useDecomposeSkills({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSkillDecompositionQueryKey() });
      },
    },
  });
  const results = q.data ?? [];
  const submit = () => {
    const values = skills
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (values.length) mutation.mutate({ data: { skills: values } });
  };
  return (
    <Page
      eyebrow="01 / Decompose"
      title="Skill decomposition"
      action={
        <Button onClick={submit} testId="button-run-decomposition">
          <Sparkles size={15} /> Re-run analysis
        </Button>
      }
    >
      <div className="surface mb-5 p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end">
          <label className="flex-1 text-xs font-bold">
            Your current skills
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="e.g. SQL, research, writing"
              data-testid="input-skills"
            />
          </label>
          <Button
            onClick={submit}
            className="h-12"
            testId="button-decompose-skills"
          >
            Decompose skills <ArrowRight size={15} />
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Lightbulb size={14} className="text-amber-500" /> Use commas to
          separate skills. SIE looks for combinations, not isolated keywords.
        </p>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter size={15} className="mr-1 text-muted-foreground" />
        {[
          "All signals",
          "High demand",
          "Low competition",
          "Trending",
          "Beginner friendly",
        ].map((x) => (
          <button
            key={x}
            onClick={() => setFilter(x)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${filter === x ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
            data-testid={`button-filter-${x.toLowerCase().replaceAll(" ", "-")}`}
          >
            {x}
          </button>
        ))}
      </div>
      <QueryState
        loading={q.isLoading || mutation.isPending}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-3">
          {results.length ? (
            results.map((skill) => (
              <div
                className="surface p-5 transition hover:border-primary/35"
                key={skill.id}
                data-testid={`card-skill-${skill.id}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Network size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold">{skill.microService}</h3>
                        <StatusPill tone="slate">{skill.category}</StatusPill>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Built from{" "}
                        <span className="font-bold text-foreground">
                          {skill.skill}
                        </span>{" "}
                        <span className="text-emerald-600">
                          · {skill.trend} trend
                        </span>
                      </div>
                      <p className="mt-3 max-w-2xl text-xs leading-5 text-muted-foreground">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-5 border-t border-border/70 pt-4 sm:flex sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <Score label="Demand" value={skill.demand} color="blue" />
                    <Score
                      label="Competition"
                      value={skill.competition}
                      color="amber"
                      inverse
                    />
                    <Score label="Fit" value={skill.suitability} color="teal" />
                  </div>
                  <Button
                    variant="ghost"
                    className="shrink-0 px-2"
                    testId={`button-view-skill-${skill.id}`}
                  >
                    View detail <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="surface py-16 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Search size={20} />
              </div>
              <h3 className="mt-4 font-extrabold">
                No services match this filter
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another signal to widen your view.
              </p>
            </div>
          )}
        </div>
      </QueryState>
    </Page>
  );
}
function Score({
  label,
  value,
  color,
  inverse = false,
}: {
  label: string;
  value: number;
  color: "blue" | "amber" | "teal";
  inverse?: boolean;
}) {
  const c =
    color === "teal"
      ? "bg-accent"
      : color === "amber"
        ? "bg-amber-400"
        : "bg-primary";
  return (
    <div className="min-w-[68px]">
      <div className="mb-1 flex justify-between gap-2 text-[10px] font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="mono text-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${c}`}
          style={{ width: `${inverse ? 100 - value : value}%` }}
        />
      </div>
    </div>
  );
}

function MarketPage() {
  const q = useGetMarketIntelligence();
  const m = q.data;
  if (!m) {
    return (
      <Page eyebrow="02 / Context" title="Market intelligence">
        <QueryState
          loading={q.isLoading}
          error={q.isError}
          onRetry={() => q.refetch()}
        >
          {null}
        </QueryState>
      </Page>
    );
  }
  return (
    <Page
      eyebrow="02 / Context"
      title="Market intelligence"
      action={
        <Button
          variant="secondary"
          onClick={() => q.refetch()}
          testId="button-refresh-market"
        >
          <RefreshCw size={15} /> Refresh market
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface p-5 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Opportunity climate</span>
              <StatusPill tone="green">Healthy</StatusPill>
            </div>
            <div className="mt-6 flex items-center gap-6">
              <div
                className="relative grid h-28 w-28 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${m.marketScore * 3.6}deg, hsl(var(--secondary)) 0deg)`,
                }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-card">
                  <span className="metric-number text-3xl">
                    {m.marketScore}
                  </span>
                </div>
              </div>
              <div>
                <div className="eyebrow">Market score</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Demand is outpacing competition in the service combinations
                  closest to your profile.
                </p>
              </div>
            </div>
          </div>
          <div className="surface p-5">
            <div className="text-xs font-bold">Demand signal</div>
            <div className="metric-number mt-5 text-4xl text-primary">
              {m.demand}
              <span className="text-base text-muted-foreground"> / 100</span>
            </div>
            <Score label="Current demand" value={m.demand} color="blue" />
            <div className="mt-5 text-[11px] text-muted-foreground">
              Strongest in analytics and workflow setup.
            </div>
          </div>
          <div className="surface p-5">
            <div className="text-xs font-bold">Competition signal</div>
            <div className="metric-number mt-5 text-4xl text-amber-500">
              {m.competition}
              <span className="text-base text-muted-foreground"> / 100</span>
            </div>
            <Score
              label="Market crowding"
              value={m.competition}
              color="amber"
              inverse
            />
            <div className="mt-5 text-[11px] text-muted-foreground">
              Lower is better. Niche combinations remain open.
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <div className="surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold">Weekly demand trend</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Indexed signal across observed sources
                </p>
              </div>
              <span className="mono text-sm font-bold text-emerald-600">
                {m.trend}
              </span>
            </div>
            <div className="mt-6 h-56">
              <Sparkline
                values={m.weeklyTrend.map((x: { value: number }) => x.value)}
                color="#29a9b7"
                height={160}
              />
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              {m.weeklyTrend.slice(0, 4).map((x: { label: string }) => (
                <span key={x.label}>{x.label}</span>
              ))}
              <span>Now</span>
            </div>
          </div>
          <div className="surface p-6">
            <h3 className="font-extrabold">Signal sources</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Weighted for freshness and relevance
            </p>
            <div className="mt-6 space-y-4">
              {m.sources.map(
                (source: { name: string; value: number; color: string }) => (
                  <div key={source.name}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-semibold">{source.name}</span>
                      <span className="mono text-muted-foreground">
                        {source.value}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${source.value * 2.1}%`,
                          backgroundColor: source.color,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="mt-7 border-t border-border/70 pt-4 text-[11px] leading-5 text-muted-foreground">
              <Globe2 size={13} className="mr-1 inline text-primary" /> Source
              weights are returned by the market intelligence service.
            </div>
          </div>
        </div>
        <div className="surface mt-5 overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-extrabold">Category breakdown</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Where your current skill mix has the most room
              </p>
            </div>
            <Button
              variant="ghost"
              className="px-2"
              testId="button-market-method"
            >
              How scores work <CircleHelp size={15} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="border-y border-border/70 bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-bold">Category</th>
                  <th className="px-6 py-3 font-bold">Demand</th>
                  <th className="px-6 py-3 font-bold">Competition</th>
                  <th className="px-6 py-3 font-bold">SIE score</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {m.categories.map(
                  (category: {
                    name: string;
                    demand: number;
                    competition: number;
                    score: number;
                  }) => (
                    <tr
                      key={category.name}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-6 py-4 text-sm font-bold">
                        {category.name}
                      </td>
                      <td className="px-6 py-4">
                        <Score label="" value={category.demand} color="blue" />
                      </td>
                      <td className="px-6 py-4">
                        <Score
                          label=""
                          value={category.competition}
                          color="amber"
                          inverse
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="mono text-sm font-bold text-primary">
                          {category.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight
                          size={15}
                          className="ml-auto text-muted-foreground"
                        />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </QueryState>
    </Page>
  );
}

function OpportunitiesPage() {
  const params = useParams<{ id?: string }>();
  const q = useGetOpportunities();
  const detail = useGetOpportunity(params.id ?? "", {
    query: {
      enabled: Boolean(params.id),
      queryKey: getGetOpportunityQueryKey(params.id ?? ""),
    },
  });
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const opportunities = q.data ?? [];
  const detailOpportunity = detail.data;
  return (
    <Page
      eyebrow="03 / Decide"
      title="Ranked opportunities"
      action={
        <Button variant="secondary" testId="button-opportunity-sort">
          <Filter size={15} /> Best fit first <ChevronDown size={14} />
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_390px]">
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <button
                onClick={() => setSelected(opp)}
                key={opp.id}
                className={`surface block w-full p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 ${selected?.id === opp.id ? "border-primary ring-2 ring-primary/10" : ""}`}
                data-testid={`card-opportunity-${opp.id}`}
              >
                <div className="flex gap-4">
                  <div className="mono grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    #{opp.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold">{opp.title}</h3>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{opp.platform}</span>
                          <span>·</span>
                          <span className="text-emerald-600">Strong fit</span>
                        </div>
                      </div>
                      <span className="mono rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                        {opp.score}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {opp.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {opp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/70 pt-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground">
                          Demand
                        </div>
                        <div className="mt-1 text-xs font-bold text-primary">
                          {opp.demand}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">
                          Competition
                        </div>
                        <div className="mt-1 text-xs font-bold text-amber-600">
                          {opp.competition}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">
                          Return
                        </div>
                        <div className="mt-1 text-xs font-bold">
                          {opp.expectedEarnings}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <OpportunityDetail
            opportunity={selected ?? detailOpportunity ?? opportunities[0]}
          />
        </div>
      </QueryState>
    </Page>
  );
}
function OpportunityDetail({ opportunity }: { opportunity?: Opportunity }) {
  const kit = useGenerateIncomeKit();
  const [, setLocation] = useLocation();
  if (!opportunity)
    return (
      <div className="surface grid min-h-[360px] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Target size={20} />
          </div>
          <h3 className="mt-4 font-extrabold">Select an opportunity</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a ranked option to inspect its reasoning.
          </p>
        </div>
      </div>
    );
  return (
    <div className="surface h-fit p-6 lg:sticky lg:top-24">
      <div className="eyebrow">Why this, why now</div>
      <h2 className="display mt-3 text-2xl font-extrabold leading-tight tracking-[-.05em]">
        {opportunity.title}
      </h2>
      <div className="mt-5 flex items-center gap-3">
        <div
          className="relative grid h-16 w-16 place-items-center rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${opportunity.score * 3.6}deg, hsl(var(--secondary)) 0deg)`,
          }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-card">
            <span className="mono text-sm font-bold">{opportunity.score}</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold">Opportunity score</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            High fit for your current profile
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        {opportunity.whyNow}
      </p>
      <div className="mt-6 space-y-3 border-t border-border/70 pt-5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Estimated effort</span>
          <span className="font-bold">{opportunity.effort}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Expected range</span>
          <span className="font-bold text-emerald-600">
            {opportunity.expectedEarnings}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Suggested platform</span>
          <span className="font-bold">{opportunity.platform}</span>
        </div>
      </div>
      <Button
        className="mt-7 w-full"
        onClick={() => {
          kit.mutate(
            { data: { opportunityId: opportunity.id } },
            { onSuccess: () => setLocation("/income-kit") },
          );
        }}
        testId="button-generate-kit"
      >
        {kit.isPending ? "Generating kit…" : "Generate income kit"}{" "}
        <ArrowRight size={15} />
      </Button>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Creates four editable assets from this opportunity.
      </p>
    </div>
  );
}

function IncomeKitPage() {
  const q = useGetIncomeKit();
  const generation = useGenerateIncomeKit();
  const update = useUpdateAsset();
  const qc = useQueryClient();
  const [kit, setKit] = useState<IncomeKit | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const current = kit ?? q.data;
  const generate = () => {
    if (!current) return;
    generation.mutate(
      { data: { opportunityId: current.opportunityId } },
      {
        onSuccess: (result) => {
          setKit(result);
          qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
        },
      },
    );
  };
  const saveAsset = (asset: KitAsset) => {
    update.mutate(
      { id: asset.id, data: { status: "Live", name: asset.title } },
      {
        onSuccess: () => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
        },
      },
    );
  };
  if (!current) {
    return (
      <Page eyebrow="04 / Build" title="Income kit">
        <QueryState
          loading={q.isLoading || generation.isPending}
          error={q.isError}
          onRetry={() => q.refetch()}
        >
          {null}
        </QueryState>
      </Page>
    );
  }
  return (
    <Page
      eyebrow="04 / Build"
      title="Income kit"
      action={
        <Button onClick={generate} testId="button-generate-income-kit">
          <Sparkles size={15} />{" "}
          {generation.isPending ? "Generating…" : "Generate fresh kit"}
        </Button>
      }
    >
      <div className="surface mb-5 flex flex-col gap-4 bg-primary/[.03] p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="eyebrow">Selected opportunity</div>
          <h2 className="mt-2 text-lg font-extrabold">
            {current.opportunityTitle}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated{" "}
            {new Date(current.generatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · Each asset is a starting point, not a promise.
          </p>
        </div>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 text-xs font-bold text-primary"
          data-testid="link-change-opportunity"
        >
          Change opportunity <ArrowRight size={14} />
        </Link>
      </div>
      <QueryState
        loading={q.isLoading || generation.isPending}
        error={q.isError && !current}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {current.assets.map((asset) => (
            <KitAssetCard
              asset={asset}
              key={asset.id}
              editing={editing === asset.id}
              onEdit={() => setEditing(editing === asset.id ? null : asset.id)}
              onSave={() => saveAsset(asset)}
              updatePending={update.isPending}
            />
          ))}
        </div>
      </QueryState>
    </Page>
  );
}
function KitAssetCard({
  asset,
  editing,
  onEdit,
  onSave,
  updatePending,
}: {
  asset: KitAsset;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  updatePending: boolean;
}) {
  const [content, setContent] = useState(asset.content);
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-start gap-4 border-b border-border/70 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {asset.type === "Outreach scripts" ? (
            <MessageSquareText size={18} />
          ) : asset.type === "Portfolio project" ? (
            <BriefcaseBusiness size={18} />
          ) : asset.type === "Landing page" ? (
            <Globe2 size={18} />
          ) : (
            <FileText size={18} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold">{asset.type}</h3>
            <StatusPill tone={asset.status === "Live" ? "green" : "amber"}>
              {asset.status}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {asset.description}
          </p>
        </div>
        <button
          className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          onClick={onEdit}
          aria-label={`Edit ${asset.type}`}
          data-testid={`button-edit-kit-${asset.id}`}
        >
          <Pencil size={15} />
        </button>
      </div>
      <div className="p-5">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] w-full resize-y rounded-xl border border-input bg-background p-3 text-sm leading-6 outline-none focus:ring-4 focus:ring-primary/10"
            data-testid={`textarea-kit-${asset.id}`}
          />
        ) : (
          <div className="min-h-[160px] whitespace-pre-line rounded-xl bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
            {content}
          </div>
        )}
        <div className="mt-4 flex items-center gap-2">
          {editing && (
            <Button
              variant="secondary"
              onClick={onEdit}
              testId={`button-cancel-kit-${asset.id}`}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={onSave}
            className="ml-auto"
            testId={`button-save-kit-${asset.id}`}
          >
            {updatePending
              ? "Saving…"
              : asset.status === "Live"
                ? "Saved"
                : "Save & deploy"}{" "}
            <Check size={14} />
          </Button>
          <Button
            variant="ghost"
            className="px-2"
            testId={`button-preview-kit-${asset.id}`}
          >
            Preview <ExternalLink size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssetsPage() {
  const q = useGetAssets();
  const update = useUpdateAsset();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("All");
  const assets: Asset[] = q.data ?? [];
  const rows = assets.filter((a) => filter === "All" || a.status === filter);
  const publish = (id: string, status: string) =>
    update.mutate(
      { id, data: { status } },
      {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() }),
      },
    );
  return (
    <Page
      eyebrow="05 / Ship"
      title="My assets"
      action={
        <Link
          href="/income-kit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(33,105,195,.18)] hover:brightness-105"
          data-testid="link-create-asset"
        >
          <Plus size={16} /> Create from kit
        </Link>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {["All", "Live", "Draft"].map((x) => (
          <button
            key={x}
            onClick={() => setFilter(x)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${filter === x ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}
            data-testid={`button-assets-${x.toLowerCase()}`}
          >
            {x}
          </button>
        ))}
      </div>
      <QueryState
        loading={q.isLoading}
        error={q.isError && !assets.length}
        onRetry={() => q.refetch()}
      >
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-border/70 bg-secondary/35 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Reach</th>
                  <th className="px-6 py-4">Responses</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {rows.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-border/60 last:border-0 hover:bg-secondary/25"
                    data-testid={`row-asset-${asset.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FileText size={15} />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{asset.name}</div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {asset.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill
                        tone={asset.status === "Live" ? "green" : "amber"}
                      >
                        {asset.status}
                      </StatusPill>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold">
                        {asset.views} views
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {asset.clicks} clicks
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {asset.responses}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="px-2"
                          onClick={() =>
                            publish(
                              asset.id,
                              asset.status === "Live" ? "Draft" : "Live",
                            )
                          }
                          testId={`button-toggle-asset-${asset.id}`}
                        >
                          {asset.status === "Live" ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2"
                          testId={`button-edit-asset-${asset.id}`}
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No assets in this view yet.
            </div>
          )}
        </div>
      </QueryState>
    </Page>
  );
}

function AnalyticsPage() {
  const q = useGetAnalytics();
  const a = q.data;
  if (!a) {
    return (
      <Page eyebrow="06 / Learn" title="Feedback & analytics">
        <QueryState
          loading={q.isLoading}
          error={q.isError}
          onRetry={() => q.refetch()}
        >
          {null}
        </QueryState>
      </Page>
    );
  }
  return (
    <Page
      eyebrow="06 / Learn"
      title="Feedback & analytics"
      action={
        <Button
          variant="secondary"
          onClick={() => q.refetch()}
          testId="button-refresh-analytics"
        >
          <RefreshCw size={15} /> Refresh feedback
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Views"
            value={String(a.views)}
            detail="Live asset reach"
            icon={Activity}
          />
          <MetricCard
            label="Clicks"
            value={String(a.clicks)}
            detail="Live engagement"
            icon={ExternalLink}
            tone="teal"
          />
          <MetricCard
            label="Responses"
            value={String(a.responses)}
            detail="Live responses"
            icon={MessageSquareText}
            tone="amber"
          />
          <MetricCard
            label="Conversions"
            value={String(a.conversions)}
            detail={`${a.conversionRate}% conversion rate`}
            icon={Check}
          />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold">Asset performance</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Engagement over the last eight weeks
                </p>
              </div>
              <StatusPill tone="green">Learning</StatusPill>
            </div>
            <div className="mt-7 h-56">
              <Sparkline
                values={a.performance.map((x) => x.value)}
                height={160}
              />
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              {a.performance.map((point) => <span key={point.label}>{point.label}</span>)}
            </div>
          </div>
          <div className="surface p-6">
            <h3 className="font-extrabold">Recommendations</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Small changes, backed by your signals
            </p>
            <div className="mt-4 space-y-3">
              {a.recommendations.map((recommendation: string, i: number) => (
                <div
                  className="flex gap-3 rounded-xl bg-secondary/60 p-3"
                  key={recommendation}
                >
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Lightbulb size={13} />
                  </div>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    <span className="font-bold text-foreground">{i + 1}. </span>
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {a.experiments[0] && <div className="surface mt-5 overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-extrabold">A/B demonstration</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                How feedback can improve the next version
              </p>
            </div>
            <StatusPill tone="blue">Live experiment</StatusPill>
          </div>
          <div className="border-y border-border/70 bg-secondary/30 p-5">
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white">
                <Zap size={14} />
              </span>
              {a.experiments[0].name}
              <span className="ml-auto text-[10px] text-muted-foreground">
                Audience split 50 / 50
              </span>
            </div>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Variant
              label="Variant A"
              value={a.experiments[0].variantA}
            />
            <Variant
              label="Variant B"
              value={a.experiments[0].variantB}
              winner
            />
          </div>
        </div>}
      </QueryState>
    </Page>
  );
}
function Variant({
  label,
  value,
  description,
  winner = false,
}: {
  label: string;
  value: number;
  description?: string;
  winner?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${winner ? "border-primary/35 bg-primary/[.035]" : "border-border"}`}
    >
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {winner && <StatusPill tone="green">Leading</StatusPill>}
      </div>
      {description && <p className="mt-4 text-sm font-bold">{description}</p>}
      <div className="mt-5 flex items-end justify-between">
        <span className="metric-number text-3xl">{value}%</span>
        <span className="text-[11px] text-muted-foreground">conversion</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${winner ? "bg-primary" : "bg-primary/30"}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function SettingsPage() {
  const q = useGetProfile();
  const update = useUpdateProfile();
  const qc = useQueryClient();
  const p = q.data;
  const [form, setForm] = useState({
    name: "",
    email: "",
    experience: "",
    availability: "",
    incomeGoal: "",
    workType: "",
  });
  useEffect(() => {
    if (!p) return;
    setForm({
      name: p.name,
      email: p.email,
      experience: p.experience,
      availability: p.availability,
      incomeGoal: p.incomeGoal,
      workType: p.workType,
    });
  }, [p]);
  const [saved, setSaved] = useState(false);
  const save = () =>
    update.mutate(
      { data: form },
      {
        onSuccess: () => {
          setSaved(true);
          qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          setTimeout(() => setSaved(false), 2200);
        },
      },
    );
  if (!p) {
    return (
      <Page eyebrow="Account" title="Settings">
        <QueryState
          loading={q.isLoading}
          error={q.isError}
          onRetry={() => q.refetch()}
        >
          {null}
        </QueryState>
      </Page>
    );
  }
  return (
    <Page
      eyebrow="Account"
      title="Settings"
      action={
        <Button onClick={save} testId="button-save-settings">
          {update.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}{" "}
          <Check size={15} />
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-5">
            <div className="surface p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold">Profile details</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    What SIE uses to calibrate your recommendations.
                  </p>
                </div>
                <UserRound size={18} className="text-primary" />
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  testId="input-profile-name"
                />
                <Field
                  label="Email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  testId="input-profile-email"
                />
                <Field
                  label="Experience"
                  value={form.experience}
                  onChange={(v) => setForm({ ...form, experience: v })}
                  testId="input-profile-experience"
                />
                <Field
                  label="Availability"
                  value={form.availability}
                  onChange={(v) => setForm({ ...form, availability: v })}
                  testId="input-profile-availability"
                />
                <Field
                  label="Income goal"
                  value={form.incomeGoal}
                  onChange={(v) => setForm({ ...form, incomeGoal: v })}
                  testId="input-profile-income"
                />
                <Field
                  label="Preferred work type"
                  value={form.workType}
                  onChange={(v) => setForm({ ...form, workType: v })}
                  testId="input-profile-work"
                />
              </div>
            </div>
            <div className="surface p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold">Your skills</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These inputs feed decomposition and ranking.
                  </p>
                </div>
                <Link
                  href="/skills"
                  className="text-xs font-bold text-primary"
                  data-testid="link-settings-skills"
                >
                  Edit skills
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {p.skills.map((skill) => (
                  <StatusPill key={skill}>{skill}</StatusPill>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="surface p-6">
              <h3 className="font-extrabold">Connected accounts</h3>
              <div className="mt-5 space-y-3">
                <Connected
                  icon={Github}
                  name="GitHub"
                  detail="Connected for portfolio context"
                />
                <Connected
                  icon={Globe2}
                  name="LinkedIn"
                  detail="Not connected"
                  muted
                />
              </div>
            </div>
            <div className="surface p-6">
              <h3 className="font-extrabold">Notifications</h3>
              <div className="mt-5 space-y-4">
                <Toggle label="Weekly market digest" enabled />
                <Toggle label="New opportunity signals" enabled />
                <Toggle label="Asset performance notes" />
              </div>
            </div>
          </div>
        </div>
      </QueryState>
    </Page>
  );
}
function Field({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <label className="text-xs font-bold">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-4 focus:ring-primary/10"
        data-testid={testId}
      />
    </label>
  );
}
function Connected({
  icon: Icon,
  name,
  detail,
  muted = false,
}: {
  icon: LucideIcon;
  name: string;
  detail: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xs font-bold">{name}</div>
        <div className="text-[10px] text-muted-foreground">{detail}</div>
      </div>
      <Button
        variant="ghost"
        className="ml-auto px-2 text-[11px]"
        testId={`button-connect-${name.toLowerCase()}`}
      >
        {muted ? "Connect" : "Manage"}
      </Button>
    </div>
  );
}
function Toggle({
  label,
  enabled = false,
}: {
  label: string;
  enabled?: boolean;
}) {
  const [on, setOn] = useState(enabled);
  return (
    <button
      onClick={() => setOn(!on)}
      className="flex w-full items-center justify-between text-left"
      data-testid={`button-toggle-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span
        className={`relative h-6 w-10 rounded-full transition ${on ? "bg-primary" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${on ? "left-5" : "left-1"}`}
        />
      </span>
    </button>
  );
}

function OnboardingModal({ onDone }: { onDone: () => void }) {
  const { markOnboarded } = useAuth();
  const update = useUpdateProfile();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [error, setError] = useState<string | null>(null);
  const steps = [
    {
      title: "Start with your useful skills",
      copy: "List the tools, subjects or abilities you have used recently, separated by commas.",
      placeholder: "e.g. Excel, photography, research",
    },
    {
      title: "What kind of work fits?",
      copy: "Tell SIE enough to filter out opportunities that do not fit your life.",
      placeholder: "e.g. 5 hours weekly, async work",
    },
  ];

  const finish = (markComplete: boolean) => {
    setError(null);
    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    update.mutate(
      {
        data: {
          onboarded: true,
          ...(markComplete && skillList.length > 0
            ? { skills: skillList }
            : {}),
          ...(markComplete && availability.trim()
            ? { availability: availability.trim() }
            : {}),
        },
      },
      {
        onSuccess: () => {
          qc.setQueryData(getMeQueryKey(), (old: any) =>
            old ? { ...old, onboarded: true } : old,
          );
          qc.invalidateQueries({ queryKey: getMeQueryKey() });
          qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          markOnboarded();
          onDone();
        },
        onError: (err) =>
          setError(
            authErrorMessage(
              err,
              "Could not save your answers. You can update this later in Settings.",
            ),
          ),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10213b]/55 p-4 backdrop-blur-sm">
      <div className="surface w-full max-w-lg p-7 md:p-9">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="mono text-[10px] text-muted-foreground">
            STEP {step + 1} / 2
          </span>
        </div>
        <div className="mt-10">
          <div className="eyebrow">A two-minute setup</div>
          <h2 className="display mt-3 text-3xl font-extrabold tracking-[-.06em]">
            {steps[step].title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {steps[step].copy}
          </p>
          <textarea
            value={step === 0 ? skills : availability}
            onChange={(e) =>
              step === 0
                ? setSkills(e.target.value)
                : setAvailability(e.target.value)
            }
            className="mt-6 min-h-[110px] w-full resize-none rounded-xl border border-input bg-background p-4 text-sm outline-none focus:ring-4 focus:ring-primary/10"
            placeholder={steps[step].placeholder}
            data-testid={`textarea-onboarding-${step}`}
          />
          {error && (
            <p
              className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
              data-testid="text-onboarding-error"
            >
              {error}
            </p>
          )}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => finish(false)}
            className="text-xs font-bold text-muted-foreground hover:text-primary"
            data-testid="button-skip-onboarding"
          >
            Skip for now
          </button>
          <Button
            onClick={() => (step === 1 ? finish(true) : setStep(1))}
            testId="button-next-onboarding"
          >
            {update.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                {step === 1 ? "Open my workspace" : "Continue"}{" "}
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/skills" component={SkillsPage} />
      <Route path="/market" component={MarketPage} />
      <Route path="/opportunities" component={OpportunitiesPage} />
      <Route path="/opportunities/:id" component={OpportunitiesPage} />
      <Route path="/income-kit" component={IncomeKitPage} />
      <Route path="/assets" component={AssetsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function FullScreenLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const openLogin = () => setLoginOpen(true);

  // Auth state is still loading (first paint) — avoid flashing the landing
  // page before we know whether there's an active session.
  if (isLoading) return <FullScreenLoader />;

  // Signed out: always show public marketing pages, regardless of which
  // (possibly protected) path was requested — there is nothing to protect
  // if there's no session yet.
  if (!user) {
    const publicPage =
      location === "/" ||
      location === "/features" ||
      location === "/how-it-works" ||
      location === "/about";
    return (
      <>
        {publicPage && location !== "/" ? (
          <PublicExplainer
            onLogin={openLogin}
            page={
              location === "/features"
                ? "features"
                : location === "/about"
                  ? "about"
                  : "how"
            }
          />
        ) : (
          <Landing onLogin={openLogin} />
        )}
        {loginOpen && (
          <AuthModal
            onClose={() => setLoginOpen(false)}
            onSuccess={() => setLoginOpen(false)}
          />
        )}
      </>
    );
  }

  // Signed in but hasn't finished (or skipped) onboarding yet.
  if (!user.onboarded) {
    return <OnboardingModal onDone={() => setLocation("/dashboard")} />;
  }

  return (
    <AppShell>
      <AppRouter />
    </AppShell>
  );
}

function App() {
  const [location] = useLocation();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary resetKey={location}>
            <div className="min-h-[100dvh]">
              <AppContent />
            </div>
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
