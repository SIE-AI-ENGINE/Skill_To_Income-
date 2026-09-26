import { useEffect, useMemo, useState, useRef } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleHelp,
  Code,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Github,
  Globe2,
  Grid2X2,
  LayoutDashboard,
  Layers,
  Lightbulb,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, Route, Switch, useLocation, useParams } from "wouter";
import {
  getGetAnalyticsQueryKey,
  getGetAssetsQueryKey,
  getGetIncomeKitQueryKey,
  getGetOpportunitiesQueryKey,
  getGetOpportunityQueryKey,
  getGetProfileQueryKey,
  getGetSkillDecompositionQueryKey,
  getMeQueryKey,
  useDecomposeSkills,
  useDeleteAsset,
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
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

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
  disabled = false,
  type = "button",
  testId,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  testId?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[.98] ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${variant === "primary" ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(33,105,195,.18)] hover:-translate-y-0.5 hover:brightness-105" : variant === "dark" ? "bg-[#17263e] text-white hover:bg-[#203451]" : variant === "secondary" ? "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-primary"} ${className}`}
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password complexity criteria
  const isMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const isComplexityValid = isMinLength && hasUpper && hasNumber && hasSpecial;
  const isConfirmValid = password === confirmPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (!isMinLength) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!hasUpper) {
        setError("Password must contain at least one uppercase letter (A-Z).");
        return;
      }
      if (!hasNumber) {
        setError("Password must contain at least one numeric digit (0-9).");
        return;
      }
      if (!hasSpecial) {
        setError("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?).");
        return;
      }
      if (!isConfirmValid) {
        setError("Passwords must match.");
        return;
      }
    }

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
            {mode === "signup" ? "Create Your Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Transform your skills into monetizable micro-services."
              : "Sign in to access your skills dashboard and income kits."}
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
              setConfirmPassword("");
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
              className={`mt-2 h-12 w-full rounded-xl border ${mode === "signup" && password && !isComplexityValid ? "border-destructive ring-destructive/20" : "border-input"} bg-background px-4 text-sm outline-none ring-primary/20 transition focus:ring-4`}
              placeholder={
                mode === "signup" ? "Min 8 chars, 1 uppercase, 1 number, 1 special" : "••••••••"
              }
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              data-testid="input-login-password"
            />
            {mode === "signup" && password && !isComplexityValid && (
              <span className="mt-1.5 block text-[11px] font-semibold text-destructive">
                Must contain uppercase, number, and special character
              </span>
            )}
          </label>
          {mode === "signup" && (
            <label className="block text-xs font-bold text-foreground">
              Confirm Password
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-2 h-12 w-full rounded-xl border ${confirmPassword && !isConfirmValid ? "border-destructive ring-destructive/20" : "border-input"} bg-background px-4 text-sm outline-none ring-primary/20 transition focus:ring-4`}
                placeholder="Re-enter your password"
                type="password"
                required
                data-testid="input-signup-confirm-password"
              />
              {confirmPassword && !isConfirmValid && (
                <span className="mt-1.5 block text-[11px] font-semibold text-destructive">
                  Passwords must match
                </span>
              )}
            </label>
          )}
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
          Your account and data are secured with enterprise-grade encryption and privacy controls.
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
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> INTELLIGENT CAREER ACCELERATION ENGINE
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
          <div className="mb-14">
            <SectionTitle
              eyebrow="The SIE method"
              title="A clearer path from capability to possibility."
              description="Most career tools start with a job title. SIE starts with your evidence: the things you can already do, and the conditions where those skills are useful."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto px-4">
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
            ].map(([num, title, desc]) => (
              <div
                key={num}
                className="surface-tight group flex h-full flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-primary/30"
              >
                <div>
                  <div className="mono text-[11px] text-primary">
                    {num}
                  </div>
                  <div className="mt-10 text-lg font-extrabold">
                    {title}
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
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
              description="SIE is designed for explainable career acceleration, so the intelligence stays visible. See the signal, the trade-off and the reason behind the recommendation — not just a confident answer."
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
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#173762] p-7 text-white shadow-2xl md:p-12">
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
              <div className="relative mt-8 md:mt-0">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7edbea]/20 text-[#7edbea]">
                        <Play size={15} className="fill-[#7edbea] translate-x-0.5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Engine Interactive Walkthrough
                        </div>
                        <div className="text-[11px] text-white/60">
                          Architecture & End-to-End Pipeline
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7edbea]" />
                      Preview
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-black/20 px-3.5 py-2 text-xs">
                      <span className="text-white/70">Pipeline Mode</span>
                      <span className="mono text-[#7edbea]">5-Stage Execution</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/20 px-3.5 py-2 text-xs">
                      <span className="text-white/70">Vector Match Engine</span>
                      <span className="mono text-[#7edbea]">384-Dim Vector Space</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/20 px-3.5 py-2 text-xs">
                      <span className="text-white/70">Demonstration Status</span>
                      <span className="flex items-center gap-1 font-medium text-emerald-400">
                        <Check size={13} /> Verified
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 p-5 text-center">
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/40">
                      <Play size={18} className="translate-x-0.5 opacity-60" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      <Lock size={12} className="opacity-70" /> Full Walkthrough Available Upon Build Completion
                    </div>
                    <p className="mt-2 text-[11px] text-white/50">
                      Interactive sandbox compiles alongside final pipeline deployment.
                    </p>
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
          <span>© 2025 Skill-to-Income AI Engine · All rights reserved</span>
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
            title: "An intelligent platform for practical career agency.",
            copy: "SIE explores how explainable AI can help someone turn existing capability into a realistic, testable income path — without promising false certainty.",
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
                "Our mission",
                "An intelligent engine focused on user clarity, explainable recommendations and responsible use of live market data.",
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
                {group.items.map(([href, label, Icon]) => {
                  const isActive =
                    location === href ||
                    (href === "/dashboard" && (location === "/" || location === "/overview"));
                  return (
                    <Link
                      href={href}
                      key={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${isActive ? "bg-sidebar-primary text-white shadow-[0_8px_18px_rgba(39,113,216,.18)]" : "text-white/56 hover:bg-white/[.07] hover:text-white"}`}
                      data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={isActive ? 2.4 : 1.8}
                      />
                      {label}
                    </Link>
                  );
                })}
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
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getBreadcrumbTitle = () => {
    if (location === "/" || location === "/overview" || location === "/dashboard") return "Overview";
    if (location.startsWith("/skills")) return "Skill decomposition";
    if (location.startsWith("/market")) return "Market intelligence";
    if (location.startsWith("/opportunities")) return "Opportunities";
    if (location.startsWith("/income-kit")) return "Income kit";
    if (location.startsWith("/assets")) return "My assets";
    if (location.startsWith("/analytics")) return "Feedback & analytics";
    if (location.startsWith("/settings")) return "Settings";
    return "Overview";
  };

  const displayName = user?.name || (user as any)?.full_name || "Account";
  const displayEmail = user?.email || "";

  const notificationItems = [
    {
      id: "notif-1",
      text: "Market Spike: +24% demand detected for Python ETL & FastAPI endpoints.",
      time: "2 hrs ago",
      icon: TrendingUp,
      tone: "text-emerald-500 bg-emerald-500/10",
    },
    {
      id: "notif-2",
      text: "Calibration complete: 17 monetizable micro-services mapped to your profile.",
      time: "1 day ago",
      icon: Sparkles,
      tone: "text-sky-500 bg-sky-500/10",
    },
    {
      id: "notif-3",
      text: "Engine Ready: 1-Click Income Kit ready for deployment.",
      time: "3 days ago",
      icon: Zap,
      tone: "text-purple-500 bg-purple-500/10",
    },
  ];

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
        <span>{getBreadcrumbTitle()}</span>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Notification Bell with Floating Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowUserMenu(false);
            }}
            className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            data-testid="button-notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {hasUnread && (
              <span
                data-testid="badge-notifications"
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
              data-testid="popover-notifications"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-foreground">Notifications</h4>
                  {hasUnread && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      3 New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setHasUnread(false)}
                  className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                  data-testid="button-mark-all-read"
                >
                  Mark all read
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {notificationItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-secondary/50 transition-colors"
                      data-testid={`notification-item-${item.id}`}
                    >
                      <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${item.tone}`}>
                        <ItemIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-relaxed text-foreground">
                          {item.text}
                        </p>
                        <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Circle with Interactive Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#dceef1] text-[11px] font-extrabold text-primary ring-2 ring-transparent hover:ring-primary/30 transition-all cursor-pointer"
            data-testid="button-user-avatar"
            aria-label="User profile menu"
          >
            {initials(displayName)}
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
              data-testid="menu-user-dropdown"
            >
              <div className="px-2 py-2 border-b border-border/60">
                <div className="truncate text-xs font-extrabold text-foreground" data-testid="text-user-name">
                  {displayName}
                </div>
                <div className="truncate text-[11px] text-muted-foreground" data-testid="text-user-email">
                  {displayEmail}
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setLocation("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary hover:text-primary transition-colors text-left cursor-pointer"
                  data-testid="link-menu-settings"
                >
                  <Settings2 size={15} />
                  Account Settings
                </button>
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                    setLocation("/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                  data-testid="button-menu-signout"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
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
  const { user } = useAuth();
  const d = q.data;

  const profilePercent = useMemo(() => {
    if (!d) return 20;
    if (typeof d.profileCompletion === "number" && d.profileCompletion > 0) {
      return d.profileCompletion;
    }
    const u: any = user;
    let score = 20;
    if (u?.full_name || u?.name) score += 15;
    if (u?.education) score += 10;
    if (u?.experience) score += 10;
    if (u?.income_goal) score += 10;
    if (u?.github_username) score += 10;
    if (u?.linkedin_url) score += 10;
    if (d?.opportunitiesFound && d.opportunitiesFound > 0) score += 15;
    return Math.min(100, score);
  }, [user, d]);

  const [pitchSent, setPitchSent] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sie_first_pitch_sent") === "true";
    } catch {
      return false;
    }
  });

  const togglePitchSent = () => {
    setPitchSent((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sie_first_pitch_sent", String(next));
      } catch {}
      return next;
    });
  };

  const step1Done = Boolean(d?.opportunitiesFound && d.opportunitiesFound > 0);
  const step2Done = Boolean(d?.assetsGenerated && d.assetsGenerated > 0);
  const step3Done = Boolean(pitchSent || (d?.assetsGenerated && d.assetsGenerated >= 3));
  const completedSteps = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);
  const milestoneProgress = Math.round((completedSteps / 3) * 100);
  const milestoneAmount = Math.round((completedSteps / 3) * 10000);

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
        <div className="mb-5 grid gap-5 lg:grid-cols-[1.3fr_0.85fr]">
          {/* Actionable Next Step Card */}
          <div
            className="surface blue-grid relative flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[.05] via-card to-card p-6 md:p-7 shadow-sm"
            data-testid="card-immediate-next-step"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  <Zap size={12} /> Immediate Next Step
                </span>
                <div className="flex items-center gap-2">
                  <StatusPill tone="green">{d.topOpportunity.platform}</StatusPill>
                  <span className="mono rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    Score: {d.topOpportunity.score}/100
                  </span>
                </div>
              </div>

              <h2 className="display mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
                {d.topOpportunity.title?.replace(/\*\*/g, "")}
              </h2>

              <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-muted-foreground md:text-sm">
                {(d.topOpportunity.whyNow || d.topOpportunity.description || "").replace(/\*\*/g, "")}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
              <Link href="/income-kit" data-testid="button-next-step-kit">
                <Button variant="primary" className="gap-2 text-xs font-bold shadow-sm">
                  <FileText size={14} /> Open Income Kit <ArrowRight size={13} />
                </Button>
              </Link>
              <Link href="/market" data-testid="button-next-step-market">
                <Button variant="secondary" className="gap-2 text-xs font-bold">
                  <BarChart3 size={14} /> View Market Demand
                </Button>
              </Link>
              <Link
                href="/opportunities"
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary"
                data-testid="link-dashboard-opportunities"
              >
                All Opportunities ({d.opportunitiesFound}) <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* First Income Milestone Card */}
          <div
            className="surface relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
            data-testid="card-first-income-milestone"
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Target size={15} className="text-primary" /> First Income Milestone
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    First Freelance Payout Target
                  </div>
                </div>
                <div className="text-right">
                  <span className="mono rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    Target: ₹10,000
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">Launch Progress</span>
                  <span className="mono font-bold text-primary">
                    ₹{milestoneAmount.toLocaleString()} / ₹10,000 ({milestoneProgress}%)
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
              </div>

              {/* 3-Step Checklist */}
              <div className="mt-4 space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {step1Done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-muted-foreground" />
                    )}
                    <span className={step1Done ? "font-bold text-foreground" : "text-muted-foreground"}>
                      1. Skills Decomposed
                    </span>
                  </div>
                  <span className="mono text-[10px] text-muted-foreground">
                    {step1Done ? `${d.opportunitiesFound} niches` : "Pending"}
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {step2Done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-muted-foreground" />
                    )}
                    <span className={step2Done ? "font-bold text-foreground" : "text-muted-foreground"}>
                      2. Income Kit Generated
                    </span>
                  </div>
                  <span className="mono text-[10px] text-muted-foreground">
                    {step2Done ? `${d.assetsGenerated} assets` : "Pending"}
                  </span>
                </div>

                {/* Step 3 */}
                <div
                  onClick={togglePitchSent}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-xs transition-colors hover:bg-secondary/70"
                  title="Click to toggle status"
                >
                  <div className="flex items-center gap-2">
                    {step3Done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-muted-foreground" />
                    )}
                    <span className={step3Done ? "font-bold text-foreground" : "text-muted-foreground"}>
                      3. First Pitch Sent
                    </span>
                  </div>
                  <span className="mono text-[10px] text-primary underline underline-offset-2">
                    {step3Done ? "Completed" : "Mark Sent"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completeness footer */}
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
              <span className="text-muted-foreground">
                Profile setup: <strong className="font-mono text-foreground">{profilePercent}%</strong>
              </span>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                data-testid="link-complete-profile"
              >
                Complete profile <ChevronRight size={12} />
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
          <Link
            href="/assets"
            className="group block cursor-pointer transition-all hover:scale-[1.01]"
            data-testid="link-dashboard-assets"
          >
            <div className="surface p-5 transition-colors group-hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
                  <FileText size={17} />
                </div>
                <ExternalLink size={15} className="text-muted-foreground/60 transition-colors group-hover:text-primary" />
              </div>
              <div className="mt-5 text-[11px] font-semibold text-muted-foreground">
                Assets generated
              </div>
              <div className="metric-number mt-1 text-3xl">{d.assetsGenerated}</div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                Click to view all {d.assetsGenerated} active deliverables <ChevronRight size={12} />
              </div>
            </div>
          </Link>
          <MetricCard
            label="Part-time potential (2–4 projects)"
            value={
              d.topOpportunity?.expectedEarnings && d.topOpportunity.expectedEarnings !== "$0" && d.topOpportunity.expectedEarnings !== "₹0"
                ? d.topOpportunity.expectedEarnings.replace(/\$/g, "₹")
                : "₹14,000–₹36,000"
            }
            detail="Calibrated for 2–4 projects/month"
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
                  {d.topOpportunity.expectedEarnings?.replace(/\$/g, "₹")}
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
  const { user } = useAuth();
  const profileQuery = useGetProfile();
  const profile = profileQuery.data;

  const [inputSkills, setInputSkills] = useState(() => {
    return localStorage.getItem("sie_active_skills_input") || "";
  });
  const hasInitializedRef = useRef(false);
  const isTypingRef = useRef(false);
  const [filter, setFilter] = useState("All signals");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [activeResults, setActiveResults] = useState<Skill[] | null>(() => {
    try {
      const cached = localStorage.getItem("sie_decomposed_skills");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const qc = useQueryClient();
  const filterParams = filter === "All signals" ? undefined : { filter };
  const q = useGetSkillDecomposition(filterParams, {
    query: { queryKey: getGetSkillDecompositionQueryKey(filterParams) },
  });

  // Pre-fill inputSkills strictly once on mount if not yet set and user has not typed
  useEffect(() => {
    if (hasInitializedRef.current || isTypingRef.current) return;
    const cached = localStorage.getItem("sie_active_skills_input");
    if (cached) {
      hasInitializedRef.current = true;
      setInputSkills(cached);
      return;
    }
    const fromUser = (user as any)?.primary_skill || (user as any)?.skills?.join(", ");
    if (fromUser) {
      hasInitializedRef.current = true;
      setInputSkills(fromUser);
      return;
    }
    if (profile?.skills?.length) {
      hasInitializedRef.current = true;
      setInputSkills(profile.skills.join(", "));
      return;
    }
    if (q.data?.length) {
      const unique = Array.from(new Set(q.data.map((s) => s.skill))).filter(Boolean);
      if (unique.length) {
        hasInitializedRef.current = true;
        setInputSkills(unique.join(", "));
      }
    }
  }, [user, profile?.skills, q.data]);

  const results = activeResults && activeResults.length > 0 ? activeResults : (q.data ?? []);
  const visibleSkills = useMemo(() => {
    if (filter === "All signals") return results;
    return results.filter((skill) => {
      if (filter === "High demand") return skill.demand >= 80;
      if (filter === "Low competition") return skill.competition <= 40;
      if (filter === "Trending") {
        return /^\+\d+%?$/.test((skill.trend ?? "").trim()) || /\+\d+/.test((skill.trend ?? "").trim());
      }
      if (filter === "Beginner friendly") return skill.beginnerFriendly === true;
      return true;
    });
  }, [results, filter]);

  const handleSelectSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    localStorage.setItem("sie_active_microservice", skill.microService);
    localStorage.setItem("sie_active_skill", skill.skill);
    localStorage.setItem("sie_active_category", skill.category);
  };

  const submit = async () => {
    const values = inputSkills
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (!values.length) return;

    setIsDecomposing(true);
    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("sie_token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/skills/decompose", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ skills: values }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to decompose skills");
      }

      const data: Skill[] = await res.json();
      setActiveResults(data);
      localStorage.setItem("sie_active_skills_input", inputSkills);
      localStorage.setItem("sie_decomposed_skills", JSON.stringify(data));
      if (data.length > 0) {
        localStorage.setItem("sie_active_microservice", data[0].microService);
        localStorage.setItem("sie_active_skill", data[0].skill);
        localStorage.setItem("sie_active_category", data[0].category);
      }

      qc.invalidateQueries({ queryKey: getGetSkillDecompositionQueryKey() });
      qc.invalidateQueries({ queryKey: getGetOpportunitiesQueryKey() });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["getMarketIntelligence"] });
      qc.invalidateQueries({ queryKey: ["market"] });
      qc.invalidateQueries({ queryKey: ["getDashboard"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    } catch (err) {
      console.error("Decomposition error:", err);
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <Page
      eyebrow="01 / Decompose"
      title="Skill decomposition"
      action={
        <Button onClick={submit} testId="button-run-decomposition" disabled={isDecomposing}>
          {isDecomposing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Re-run analysis
        </Button>
      }
    >
      <div className="surface mb-5 p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end">
          <label className="flex-1 text-xs font-bold">
            Your current skills
            <input
              data-testid="input-skills"
              type="text"
              value={inputSkills}
              onFocus={() => {
                isTypingRef.current = true;
              }}
              onChange={(e) => {
                isTypingRef.current = true;
                hasInitializedRef.current = true;
                setInputSkills(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-4 focus:ring-primary/10"
              placeholder="e.g. Python, FastAPI, React, PostgreSQL"
            />
          </label>
          <Button
            onClick={submit}
            className="h-12"
            testId="button-decompose-skills"
            disabled={isDecomposing}
          >
            {isDecomposing ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Decomposing...
              </>
            ) : (
              <>
                Decompose skills <ArrowRight size={15} />
              </>
            )}
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
        loading={q.isLoading || isDecomposing}
        error={q.isError}
        onRetry={() => q.refetch()}
      >
        <div className="grid gap-3">
          {visibleSkills.length ? (
            visibleSkills.map((skill) => (
              <div
                className="surface p-5 transition hover:border-primary/35 cursor-pointer"
                key={skill.id}
                data-testid={`card-skill-${skill.id}`}
                onClick={() => handleSelectSkill(skill)}
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
                        {skill.semanticFit && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/20 cursor-help"
                            title="Calculated via cosine similarity in 384-dimensional latent embedding space"
                            data-testid={`badge-semantic-fit-${skill.id}`}
                          >
                            <Sparkles size={12} className="text-emerald-500 shrink-0" />
                            {skill.semanticFit}% Semantic Fit
                          </span>
                        )}
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
                    onClick={() => handleSelectSkill(skill)}
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
      {selectedSkill && (
        <SkillDetailSheet skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </Page>
  );
}

function SkillDetailSheet({
  skill,
  onClose,
}: {
  skill: Skill;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();

  const handleFindOpportunities = () => {
    onClose();
    localStorage.setItem("sie_active_microservice", skill.microService);
    localStorage.setItem("sie_active_skill", skill.skill);
    localStorage.setItem("sie_active_category", skill.category);
    const serviceQuery = encodeURIComponent(skill.microService);
    setLocation(`/opportunities?service=${serviceQuery}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#10213b]/55 p-4 backdrop-blur-sm md:items-center md:justify-center">
      <div className="surface relative w-full max-w-md p-6 shadow-2xl md:rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Close detail panel"
        >
          <X size={17} />
        </button>

        <div className="eyebrow">Micro-service detail</div>
        <h2 className="display mt-3 text-2xl font-extrabold tracking-[-.05em]">
          {skill.microService}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill tone="slate">{skill.category}</StatusPill>
          <StatusPill tone={skill.beginnerFriendly ? "green" : "amber"}>
            {skill.beginnerFriendly ? "Beginner friendly" : "Advanced"}
          </StatusPill>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {skill.description}
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Demand</span>
            <span className="font-bold text-primary">{skill.demand}/100</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Market crowding</span>
            <span className="font-bold text-amber-600">{skill.competition}/100</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">User fit</span>
            <span className="font-bold text-emerald-600">{skill.suitability}/100</span>
          </div>
          {skill.semanticFit && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles size={13} className="text-emerald-500" />
                Semantic Vector Fit
              </span>
              <span
                className="font-bold text-emerald-600"
                title="Calculated via cosine similarity in 384-dimensional latent embedding space"
              >
                {skill.semanticFit}% Match
              </span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            Target deliverable
          </div>
          <p className="text-sm leading-6 text-foreground">
            {skill.description}
          </p>
        </div>

        <Button className="mt-6 w-full" onClick={handleFindOpportunities}>
          Find opportunities for this service <ArrowRight size={15} />
        </Button>
      </div>
    </div>
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
  const [, setLocation] = useLocation();
  const q = useGetMarketIntelligence();
  const oppsQuery = useGetOpportunities();
  const rawData: any = q.data;
  const isArray = Array.isArray(rawData);
  const m = isArray ? null : rawData;
  const opportunities = oppsQuery.data ?? [];

  const marketScore = typeof m?.marketScore === "number" ? m.marketScore : 78;
  const demand = typeof m?.demand === "number" ? m.demand : 86;
  const competition = typeof m?.competition === "number" ? m.competition : 38;
  const trend = typeof m?.trend === "string" ? m.trend : "+16.2%";

  const weeklyTrend: { label: string; value: number }[] =
    Array.isArray(m?.weeklyTrend) && m.weeklyTrend.length > 0
      ? m.weeklyTrend
      : [
          { label: "W1", value: 60 },
          { label: "W2", value: 68 },
          { label: "W3", value: 75 },
          { label: "W4", value: 84 },
        ];

  const sources: { name: string; value: number; color: string }[] =
    Array.isArray(m?.sources) && m.sources.length > 0
      ? m.sources
      : [
          { name: "Upwork", value: 45, color: "#2f64e8" },
          { name: "Fiverr", value: 30, color: "#37b77a" },
          { name: "LinkedIn", value: 25, color: "#8c6ce6" },
        ];

  const categories: {
    name: string;
    demand: number;
    competition: number;
    score: number;
    average_rate?: string;
    averageRate?: string;
  }[] =
    Array.isArray(m?.categories) && m.categories.length > 0
      ? m.categories
      : [
          { name: "Data & Automation", demand: 92, competition: 35, score: 94, average_rate: "₹4,500/order" },
          { name: "Backend APIs", demand: 88, competition: 32, score: 90, average_rate: "₹6,000/project" },
          { name: "Full-Stack Web", demand: 85, competition: 40, score: 88, average_rate: "₹8,000/project" },
        ];

  const activeCategory = localStorage.getItem("sie_active_category");
  const viableCategories = categories.filter((c) => c.demand > 70);
  const bestCategory = (activeCategory ? categories.find((c) => c.name.toLowerCase().includes(activeCategory.toLowerCase())) : null) || (viableCategories.length > 0 ? viableCategories : categories).reduce(
    (best, c) => (!best || c.competition < best.competition ? c : best),
    null as (typeof categories)[0] | null,
  );

  const matchedOpportunity = (opportunities ?? []).find((opp) => {
    if (!bestCategory?.name) return false;
    const catLower = bestCategory.name.toLowerCase();
    const oppCat = ((opp as any).category as string | undefined)?.toLowerCase() || "";
    return (
      oppCat.includes(catLower) ||
      catLower.includes(oppCat) ||
      opp.title.toLowerCase().includes(catLower) ||
      opp.tags?.some((t) => catLower.includes(t.toLowerCase()))
    );
  }) || (opportunities ?? [])[0];

  const targetServiceTitle = matchedOpportunity?.title || bestCategory?.name || "Professional Micro-Service Automation";
  const targetOppId = matchedOpportunity?.id || (bestCategory?.name ? `opp-${bestCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "opp-top-niche");

  const renderOpportunityBadge = (dem: number, comp: number) => {
    if (dem >= 80 && comp <= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Prime Niche (High ROI)
        </span>
      );
    }
    if (dem >= 80 && comp > 50) {
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          High Volume (Niche Down)
        </span>
      );
    }
    if (dem < 70 && comp > 60) {
      return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Crowded (Low Priority)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
        Balanced Signal
      </span>
    );
  };

  return (
    <Page
      eyebrow="02 / Understand"
      title="Market intelligence"
      action={
        <Button
          onClick={() => {
            const targetUrl = `/income-kit?opportunityId=${encodeURIComponent(targetOppId)}&service=${encodeURIComponent(targetServiceTitle)}`;
            setLocation(targetUrl);
          }}
          testId="button-generate-niche-kit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20"
        >
          <Sparkles size={15} /> Build income kit for {bestCategory?.name || "top niche"} <ArrowRight size={15} />
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading && !rawData}
        error={q.isError && !rawData}
        onRetry={() => q.refetch()}
      >
        {/* Plain-English Market Verdict Banner */}
        <div
          className="surface blue-grid mb-5 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[.08] via-emerald-500/[.05] to-card p-5 md:p-6 shadow-sm"
          data-testid="market-verdict-banner"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Market Takeaway
                  </span>
                  <StatusPill tone="green">Strategic Focus</StatusPill>
                </div>
                <p className="mt-1.5 text-sm md:text-base font-semibold leading-relaxed text-foreground">
                  Buyer activity is healthy across your skills.{" "}
                  <strong className="font-extrabold text-primary underline decoration-primary/40 underline-offset-4">
                    {bestCategory?.name || "Data & Automation"}
                  </strong>{" "}
                  offers the lowest competition ({bestCategory?.competition ?? 32}/100) with strong demand. Focus your initial gigs here to get ranked faster.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/income-kit?service=${encodeURIComponent(targetServiceTitle)}&opportunityId=${encodeURIComponent(targetOppId)}`}
                data-testid="button-launch-market-takeaway"
              >
                <Button variant="primary" className="text-xs font-bold gap-1.5 whitespace-nowrap shadow-sm">
                  <Zap size={13} /> Launch In {bestCategory?.name?.split(" ")[0] || "Top Niche"}
                </Button>
              </Link>
            </div>
          </div>
        </div>

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
                  background: `conic-gradient(hsl(var(--primary)) ${marketScore * 3.6}deg, hsl(var(--secondary)) 0deg)`,
                }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-card">
                  <span className="metric-number text-3xl">
                    {marketScore}
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
              {demand}
              <span className="text-base text-muted-foreground"> / 100</span>
            </div>
            <Score label="Current demand" value={demand} color="blue" />
            <div className="mt-5 text-[11px] text-muted-foreground">
              Strongest in analytics and workflow setup.
            </div>
          </div>
          <div className="surface p-5">
            <div className="text-xs font-bold">Competition signal</div>
            <div className="metric-number mt-5 text-4xl text-amber-500">
              {competition}
              <span className="text-base text-muted-foreground"> / 100</span>
            </div>
            <Score
              label="Market crowding"
              value={competition}
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
                {trend}
              </span>
            </div>
            <div className="mt-6 h-56">
              <Sparkline
                values={(weeklyTrend ?? []).map((x: { value: number }) => x.value)}
                color="#29a9b7"
                height={160}
              />
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              {(weeklyTrend ?? []).slice(0, 4).map((x: { label: string }) => (
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
              {(sources ?? []).map(
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
                Where your current skill mix has the most room (all rates calibrated in INR)
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
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-y border-border/70 bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-bold">Category</th>
                  <th className="px-6 py-3 font-bold">Demand</th>
                  <th className="px-6 py-3 font-bold">Competition</th>
                  <th className="px-6 py-3 font-bold">Average Rate</th>
                  <th className="px-6 py-3 font-bold">Strategic Status</th>
                  <th className="px-6 py-3 font-bold">SIE score</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {(categories ?? []).map((category) => {
                  const categoryOpp = (opportunities ?? []).find((opp) => {
                    const catLower = category.name.toLowerCase();
                    const oppCat = ((opp as any).category as string | undefined)?.toLowerCase() || "";
                    return (
                      oppCat.includes(catLower) ||
                      catLower.includes(oppCat) ||
                      opp.title.toLowerCase().includes(catLower) ||
                      opp.tags?.some((t) => catLower.includes(t.toLowerCase()))
                    );
                  });
                  return (
                    <tr
                      key={category.name}
                      onClick={() => setLocation(`/opportunities?category=${encodeURIComponent(category.name)}`)}
                      className="border-b border-border/60 last:border-0 transition-colors cursor-pointer hover:bg-muted/40 group"
                      data-testid={`row-category-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      <td className="px-6 py-4 text-sm font-bold group-hover:text-primary transition-colors">
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
                      <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600 whitespace-nowrap">
                        {category.average_rate || (category as any).averageRate || (category.score >= 90 ? "₹6,000/project" : "₹4,500/order")}
                      </td>
                      <td className="px-6 py-4">
                        {renderOpportunityBadge(category.demand, category.competition)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="mono text-sm font-bold text-primary">
                          {category.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={
                            categoryOpp
                              ? `/income-kit?service=${encodeURIComponent(categoryOpp.title)}&opportunityId=${encodeURIComponent(categoryOpp.id)}`
                              : `/income-kit?service=${encodeURIComponent(category.name)}`
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary group-hover:text-primary"
                          data-testid={`link-launch-category-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        >
                          <span className="hidden sm:inline">Launch</span>
                          <ChevronRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
  const [location] = useLocation();
  const q = useGetOpportunities();
  const detail = useGetOpportunity(params.id ?? "", {
    query: {
      enabled: Boolean(params.id),
      queryKey: getGetOpportunityQueryKey(params.id ?? ""),
    },
  });
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const opportunities = q.data ?? [];
  const searchParams = new URLSearchParams((location.split("?")[1] ?? ""));
  const urlFilter = searchParams.get("service") || searchParams.get("category") || "";
  const storedFilter = localStorage.getItem("sie_active_microservice") || localStorage.getItem("sie_active_category") || "";
  const filterTerm = urlFilter || storedFilter;
  const matchedOpportunities = filterTerm
    ? opportunities.filter((opp) => {
        const term = filterTerm.toLowerCase();
        const oppCat = ((opp as any).category as string | undefined)?.toLowerCase() || "";
        return (
          opp.title.toLowerCase().includes(term) ||
          oppCat.includes(term) ||
          opp.description.toLowerCase().includes(term) ||
          opp.tags.some((tag) => tag.toLowerCase().includes(term))
        );
      })
    : opportunities;
  const filteredOpportunities = matchedOpportunities.length > 0 ? matchedOpportunities : opportunities;
  const detailOpportunity = detail.data;
  const activeOpportunity = selected ?? detailOpportunity ?? filteredOpportunities[0] ?? opportunities[0];

  useEffect(() => {
    if (!filterTerm || !filteredOpportunities.length) return;
    setSelected(filteredOpportunities[0]);
  }, [filterTerm, filteredOpportunities]);

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
            {filteredOpportunities.map((opp) => (
              <button
                onClick={() => setSelected(opp)}
                key={opp.id}
                className={`surface block w-full p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 ${activeOpportunity?.id === opp.id ? "border-primary ring-2 ring-primary/10" : ""}`}
                data-testid={`card-opportunity-${opp.id}`}
              >
                <div className="flex gap-4">
                  <div className="mono grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    #{opp.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold">{opp.title?.replace(/\*\*/g, "")}</h3>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{opp.platform}</span>
                          <span>·</span>
                          <span className="text-emerald-600">Strong fit</span>
                          {opp.semanticFit && (
                            <>
                              <span>·</span>
                              <span
                                className="inline-flex items-center gap-1 font-bold text-emerald-600"
                                title="Calculated via cosine similarity in 384-dimensional latent embedding space"
                              >
                                <Sparkles size={11} className="text-emerald-500 shrink-0" />
                                {opp.semanticFit}% Semantic Fit
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="mono rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                        {opp.score}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {(opp.description || "").replace(/\*\*/g, "")}
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
                          {opp.expectedEarnings?.replace(/\$/g, "₹")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <OpportunityDetail
            opportunity={activeOpportunity}
          />
        </div>
      </QueryState>
    </Page>
  );
}

function OpportunityDetail({ opportunity }: { opportunity?: Opportunity }) {
  const kit = useGenerateIncomeKit();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
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
        {opportunity.title?.replace(/\*\*/g, "")}
      </h2>
      <div className="mt-5 flex items-center gap-3">
        <div
          className={`tag uppercase ${
            opportunity.effort === "Low"
              ? "tag-emerald"
              : opportunity.effort === "Medium"
                ? "tag-amber"
                : "tag-purple"
          }`}
        >
          {opportunity.effort} effort
        </div>
        <span className="mono text-xs font-bold text-muted-foreground">
          Score {opportunity.score}/100
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        {(opportunity.whyNow || opportunity.description || "").replace(/\*\*/g, "")}
      </p>
      <div className="mt-6 space-y-3 border-t border-border/70 pt-6">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Expected return</span>
          <span className="font-bold text-primary">
            {opportunity.expectedEarnings?.replace(/\$/g, "₹")}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Market demand</span>
          <span className="font-bold">{opportunity.demand}/100</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Competition</span>
          <span className="font-bold">{opportunity.competition}/100</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Suggested platform</span>
          <span className="font-bold">{opportunity.platform}</span>
        </div>
        {opportunity.semanticFit && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500" />
              Semantic latent fit
            </span>
            <span
              className="font-bold text-emerald-600"
              title="Calculated via cosine similarity in 384-dimensional latent embedding space"
            >
              {opportunity.semanticFit}% cosine match
            </span>
          </div>
        )}
      </div>
      <Button
        className="mt-7 w-full"
        disabled={isGenerating || kit.isPending}
        onClick={() => {
          if (!opportunity) return;
          const selectedOpp = opportunity;
          const skillName =
            (selectedOpp as any).skillName ||
            (selectedOpp as any).skill ||
            (selectedOpp.tags && selectedOpp.tags[0]) ||
            "";
          setLocation(
            '/income-kit?service=' +
              encodeURIComponent(selectedOpp.title) +
              '&skill=' +
              encodeURIComponent(skillName)
          );
        }}
        testId="button-generate-kit"
      >
        {isGenerating || kit.isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Generating kit…
          </>
        ) : (
          <>
            Generate income kit <ArrowRight size={15} />
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Creates four editable assets from this opportunity.
      </p>
    </div>
  );
}

const ASSET_TABS = [
  { id: "all", label: "7-Day Launchpad", icon: Rocket },
  { id: "Gig listing", label: "Gig Listing", icon: FileText },
  { id: "Portfolio project", label: "GitHub Project", icon: BriefcaseBusiness },
  { id: "Landing page", label: "Landing Page", icon: Globe2 },
  { id: "Outreach scripts", label: "Outreach Script", icon: MessageSquareText },
];

function ClipboardButton({
  text,
  label = "Copy",
  size = "sm",
  variant = "ghost",
  className = "",
}: {
  text: string;
  label?: string;
  size?: "sm" | "xs";
  variant?: "ghost" | "secondary" | "primary";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold transition-all ${
        size === "xs" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
      } ${
        copied
          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-extrabold"
          : variant === "primary"
            ? "bg-primary text-primary-foreground shadow-sm hover:brightness-105"
            : variant === "secondary"
              ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border/80"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      } ${className}`}
      title={label}
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
}

function calculateDynamicTiers(options: {
  expectedReturn?: string;
  expectedEarnings?: string;
  demand?: number;
  competition?: number;
}) {
  const returnStr = options.expectedReturn || options.expectedEarnings || "";
  const cleanStr = returnStr.replace(/,/g, "");
  const matches = cleanStr.match(/\d+(?:\.\d+)?/g);
  const parsedNums = matches ? matches.map(Number).filter((n) => n >= 100) : [];

  let minReturn = 0;
  let maxReturn = 0;

  if (parsedNums.length >= 2) {
    minReturn = Math.min(parsedNums[0], parsedNums[1]);
    maxReturn = Math.max(parsedNums[0], parsedNums[1]);
  } else if (parsedNums.length === 1) {
    minReturn = Math.round((parsedNums[0] * 0.7) / 100) * 100;
    maxReturn = Math.round((parsedNums[0] * 1.3) / 100) * 100;
  }

  if (!minReturn || !maxReturn || minReturn <= 0 || maxReturn <= 0) {
    const demand = typeof options.demand === "number" && !isNaN(options.demand) ? options.demand : 85;
    const competition = typeof options.competition === "number" && !isNaN(options.competition) && options.competition > 0 ? options.competition : 35;
    const basePrice = Math.round((1500 * Math.max(1.2, demand / competition)) / 100) * 100;
    minReturn = basePrice * 2;
    maxReturn = basePrice * 4;
  }

  const basic = Math.round((minReturn * 0.6) / 100) * 100;
  const standard = Math.round(((minReturn + maxReturn) / 2) / 100) * 100;
  const premium = Math.round((maxReturn * 1.4) / 100) * 100;

  return {
    minReturn,
    maxReturn,
    basic,
    standard,
    premium,
    basicInr: `₹${basic.toLocaleString("en-IN")}`,
    standardInr: `₹${standard.toLocaleString("en-IN")}`,
    premiumInr: `₹${premium.toLocaleString("en-IN")}`,
    basicUsd: `$${Math.round(basic / 85)}`,
    standardUsd: `$${Math.round(standard / 85)}`,
    premiumUsd: `$${Math.round(premium / 85)}`,
  };
}

function ExecutionLaunchpad({
  current,
  onSelectTab,
  onOpenGithubDeploy,
  dynamicTiers,
}: {
  current: IncomeKit;
  onSelectTab: (tabId: string) => void;
  onOpenGithubDeploy: () => void;
  dynamicTiers: ReturnType<typeof calculateDynamicTiers>;
}) {
  const kitId = Number(current.id) || 1;
  const gigAsset = current.assets.find((a) => a.type === "Gig listing") || current.assets[0];
  const repoAsset = current.assets.find((a) => a.type === "Portfolio project") || current.assets[1];
  const landingAsset = current.assets.find((a) => a.type === "Landing page") || current.assets[2];
  const outreachAsset = current.assets.find((a) => a.type === "Outreach scripts") || current.assets[3];

  const cards = [
    {
      tabId: "Gig listing",
      icon: FileText,
      name: "Gig Listing Specification",
      badge: "Fiverr / Upwork Ready",
      description: "Search tags, 3-tier delivery milestones, and objection-handling FAQs.",
      asset: gigAsset,
    },
    {
      tabId: "Portfolio project",
      icon: BriefcaseBusiness,
      name: "GitHub Proof & Code Scaffold",
      badge: "Architecture & Code",
      description: "Complete modular codebase, architecture README, and verification test suite.",
      asset: repoAsset,
    },
    {
      tabId: "Landing page",
      icon: Globe2,
      name: "High-Conversion Landing Page",
      badge: "Single-Page Web",
      description: "Client demonstration site, ROI calculator, and lead intake form.",
      asset: landingAsset,
    },
    {
      tabId: "Outreach scripts",
      icon: MessageSquareText,
      name: "Multi-Channel Outreach Engine",
      badge: "Email / LinkedIn / DM",
      description: "Targeted cold email sequence, 300-char LinkedIn note, and WhatsApp pitch.",
      asset: outreachAsset,
    },
  ];

  const roadmapPhases = [
    {
      phase: "Phase 1",
      days: "Days 1–2",
      title: "GitHub Proof & Code Scaffold",
      icon: Code,
      steps: [
        "Deploy scaffold repo to GitHub with 1-click publisher",
        "Verify all automated tests run clean and pass",
        "Add live showcase link to your profile bio",
      ],
      deliverable: "Live GitHub Repository with README proof",
    },
    {
      phase: "Phase 2",
      days: "Day 3",
      title: "Service Listing & Packaging",
      icon: FileText,
      steps: [
        "Publish gig on Fiverr and Upwork Project Catalog",
        "Configure Basic, Standard, and Premium price tiers",
        "Paste 5 high-intent tags to secure search indexing",
      ],
      deliverable: "2 Published Platform Gigs",
    },
    {
      phase: "Phase 3",
      days: "Days 4–5",
      title: "Multi-Channel Direct Outreach",
      icon: Send,
      steps: [
        "Send tailored cold email sequence to 15 targeted companies",
        "Connect with 20 engineering managers via LinkedIn note",
        "Engage relevant developer communities with proof case-study",
      ],
      deliverable: "35 High-Intent Outreach Contacts",
    },
    {
      phase: "Phase 4",
      days: "Days 6–7",
      title: "Follow-up & Client Closing",
      icon: CheckCircle2,
      steps: [
        "Follow up with opens & warm profile viewers",
        "Send WhatsApp/DM pitch for immediate scoping call",
        "Offer 48-hr pilot sprint at Basic Tier pricing",
      ],
      deliverable: "First Paid Milestone / Pilot Sprint Secured",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Launchpad Header & Quick Actions Bar */}
      <div className="surface flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] via-card to-primary/[0.02] p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            <Rocket size={14} /> 7-Day First-Client Launchpad
          </div>
          <h3 className="mt-2 text-xl font-extrabold text-foreground">
            From Raw Skills to Client Income in 7 Days
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your 4 assets are fully generated and calibrated. Follow the structured sequence to launch your service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/v1/assets/${kitId}/download`}
            download
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/80 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-foreground"
            data-testid="button-launchpad-download-zip"
            title="Export Income Kit (.zip)"
          >
            <Download size={14} />
            <span>Export Income Kit (.zip)</span>
          </a>
          <button
            type="button"
            onClick={onOpenGithubDeploy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#24292F] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#1b1f23] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            data-testid="button-launchpad-deploy-github"
          >
            <Github size={14} />
            <span>1-Click Deploy to GitHub</span>
          </button>
        </div>
      </div>

      {/* Part 1: Asset Readiness & Status */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              1. Asset Readiness & Status
            </h4>
            <p className="text-xs text-muted-foreground">
              Click any card to inspect or customize the full asset in its dedicated workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectTab(c.tabId)}
                className="group surface relative flex flex-col justify-between cursor-pointer rounded-2xl border border-border/80 p-5 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
                data-testid={`card-launchpad-asset-${idx}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon size={18} />
                    </div>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Ready
                    </span>
                  </div>

                  <h5 className="mt-4 font-bold text-foreground group-hover:text-primary transition-colors">
                    {c.name}
                  </h5>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {(c.asset?.description || c.description).replace(/\*\*/g, "")}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="text-[11px] font-semibold text-primary flex items-center gap-1 group-hover:underline">
                    Open Editor <ArrowRight size={11} />
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ClipboardButton
                      text={c.asset?.content || ""}
                      label="Copy"
                      size="xs"
                      variant="secondary"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2: 7-Day First-Client Roadmap */}
      <div>
        <div className="mb-4">
          <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            2. 7-Day First-Client Roadmap
          </h4>
          <p className="text-xs text-muted-foreground">
            A battle-tested 4-phase execution path to validate and monetize this opportunity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roadmapPhases.map((phase, idx) => {
            const PhaseIcon = phase.icon;
            return (
              <div
                key={idx}
                className="surface relative flex flex-col justify-between rounded-2xl border border-border/80 p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="mono rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
                      {phase.days}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {phase.phase}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <PhaseIcon size={16} className="text-primary" />
                    <h5 className="font-extrabold text-foreground text-sm">{phase.title}</h5>
                  </div>

                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {phase.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 rounded-xl bg-secondary/50 p-2.5 text-[11px]">
                  <span className="font-bold text-foreground">Milestone: </span>
                  <span className="text-muted-foreground">{phase.deliverable}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 3: Commercial Strategy */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              3. Commercial Strategy & Calibrated Pricing
            </h4>
            <p className="text-xs text-muted-foreground">
              Real-time dynamically calculated rate cards calibrated to current market demand.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Basic */}
          <div className="surface rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Basic Tier</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">2 Days</span>
              </div>
              <h5 className="mt-2 text-base font-extrabold text-foreground">Starter Pilot Sprint</h5>
              <div className="mt-3 text-2xl font-black text-foreground">
                {dynamicTiers.basicInr}
                <span className="ml-1 text-xs font-normal text-muted-foreground">({dynamicTiers.basicUsd})</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Zero-friction introductory offer for fast-turnaround single deliverables or bug fixes.
              </p>
            </div>
            <div className="mt-4 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
              ✓ 1 Core deliverable · 1 Revision cycle
            </div>
          </div>

          {/* Standard */}
          <div className="surface relative rounded-2xl border-2 border-primary bg-card p-5 shadow-md ring-4 ring-primary/5 flex flex-col justify-between">
            <div className="absolute -top-3 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Standard Tier</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">4 Days</span>
              </div>
              <h5 className="mt-2 text-base font-extrabold text-foreground">Full Solution Package</h5>
              <div className="mt-3 text-2xl font-black text-foreground">
                {dynamicTiers.standardInr}
                <span className="ml-1 text-xs font-normal text-muted-foreground">({dynamicTiers.standardUsd})</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Complete end-to-end service implementation with tests, deployment guide, and integration.
              </p>
            </div>
            <div className="mt-4 border-t border-border/70 pt-3 text-[11px] font-semibold text-primary">
              ✓ Full solution · 3 Revisions · Deployment support
            </div>
          </div>

          {/* Premium */}
          <div className="surface rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Premium Tier</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">7 Days</span>
              </div>
              <h5 className="mt-2 text-base font-extrabold text-foreground">Enterprise Retainer</h5>
              <div className="mt-3 text-2xl font-black text-foreground">
                {dynamicTiers.premiumInr}
                <span className="ml-1 text-xs font-normal text-muted-foreground">({dynamicTiers.premiumUsd})</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Custom production architecture, performance tuning, priority 24/7 SLA, and ongoing advisory.
              </p>
            </div>
            <div className="mt-4 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
              ✓ Production deployment · Unlimited revisions · 14-day warranty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncomeKitPage() {
  const [location, setLocation] = useLocation();
  const searchParams = useMemo(() => {
    const query = location.includes("?")
      ? location.slice(location.indexOf("?") + 1)
      : typeof window !== "undefined"
        ? window.location.search.replace(/^\?/, "")
        : "";
    return new URLSearchParams(query);
  }, [location]);

  const serviceParam = searchParams.get("service") || "";
  const skillParam = searchParams.get("skill") || "";
  const opportunityIdParam = searchParams.get("opportunityId") || "";
  const kitIdParam =
    searchParams.get("id") ||
    searchParams.get("kit_id") ||
    (!serviceParam && typeof window !== "undefined" ? localStorage.getItem("sie_active_kit_id") : null);

  const q = useGetIncomeKit();
  const generation = useGenerateIncomeKit();
  const update = useUpdateAsset();
  const qc = useQueryClient();
  const [kit, setKit] = useState<IncomeKit | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [triggeredKey, setTriggeredKey] = useState<string>("");
  const [isGeneratingService, setIsGeneratingService] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  const current = kit ?? q.data;

  const opportunitiesQuery = useGetOpportunities();
  const opportunities = opportunitiesQuery.data || [];

  const matchedOpp = useMemo(() => {
    if (!current) return null;
    return (
      opportunities.find(
        (o) =>
          o.id === current.opportunityId ||
          o.title.toLowerCase() === (current.opportunityTitle || current.title || "").toLowerCase()
      ) || null
    );
  }, [current, opportunities]);

  const dynamicTiers = useMemo(() => {
    return calculateDynamicTiers({
      expectedReturn: (matchedOpp as any)?.expectedReturn || matchedOpp?.expectedEarnings || (current as any)?.expectedEarnings,
      expectedEarnings: matchedOpp?.expectedEarnings || (current as any)?.expectedEarnings,
      demand: matchedOpp?.demand,
      competition: matchedOpp?.competition,
    });
  }, [matchedOpp, current]);

  // Auto-generate or fetch with auth token on mount if no kit is loaded or if route params provided
  useEffect(() => {
    const currentKey = `${serviceParam}:${skillParam}:${kitIdParam || ""}:${opportunityIdParam}`;
    if (triggeredKey === currentKey && currentKey !== ":::") return;

    // Priority 1: If a service title is present, dynamically synthesize and load the tailored Income Kit
    if (serviceParam) {
      setTriggeredKey(currentKey);
      setIsGeneratingService(true);
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("sie_token") ||
        "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      fetch("/api/v1/assets/generate", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          service: serviceParam,
          skill: skillParam,
          opportunityId: opportunityIdParam || undefined,
          opp_title: serviceParam,
          skill_name: skillParam,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            return fetch(
              `/api/v1/income-kit?service=${encodeURIComponent(serviceParam)}&skill=${encodeURIComponent(skillParam)}&opportunityId=${encodeURIComponent(opportunityIdParam)}`,
              { headers, credentials: "include" }
            ).then((r) => {
              if (!r.ok) throw new Error("Failed to load or generate kit for service");
              return r.json();
            });
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.assets && data.assets.length > 0) {
            setKit(data);
            if (data.id) {
              localStorage.setItem("sie_active_kit_id", String(data.id));
            }
            if (data.opportunityTitle || data.title) {
              localStorage.setItem(
                "sie_active_opportunity_title",
                data.opportunityTitle || data.title
              );
            }
            qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
            qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
          }
        })
        .catch((err) => {
          console.error("Failed to generate income kit for service:", err);
        })
        .finally(() => {
          setIsGeneratingService(false);
        });
      return;
    }

    // Priority 2: If a kit ID is explicitly given in the query parameters (without a service override)
    if (kitIdParam) {
      setTriggeredKey(currentKey);
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("sie_token") ||
        "";
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      fetch(`/api/v1/income-kit?kit_id=${encodeURIComponent(kitIdParam)}`, {
        headers,
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load kit");
          return res.json();
        })
        .then((data) => {
          if (data && data.id) {
            setKit(data);
            localStorage.setItem("sie_active_kit_id", String(data.id));
            if (data.opportunityTitle || data.title) {
              localStorage.setItem("sie_active_opportunity_title", data.opportunityTitle || data.title);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load kit by ID:", err);
        });
      return;
    }

    if (opportunityIdParam) {
      setTriggeredKey(currentKey);
      generation.mutate(
        {
          data: {
            opportunityId: opportunityIdParam || undefined,
            service: serviceParam || undefined,
          },
        },
        {
          onSuccess: (result) => {
            setKit(result);
            if (result?.id) {
              localStorage.setItem("sie_active_kit_id", String(result.id));
            }
            if (result?.opportunityTitle || result?.title) {
              localStorage.setItem("sie_active_opportunity_title", result.opportunityTitle || result.title);
            }
            qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
            qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
          },
        },
      );
    } else if (!current && !q.isLoading && !generation.isPending && triggeredKey !== "auto-default") {
      setTriggeredKey("auto-default");
      generation.mutate(
        { data: {} },
        {
          onSuccess: (result) => {
            setKit(result);
            if (result?.id) {
              localStorage.setItem("sie_active_kit_id", String(result.id));
            }
            qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
            qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
          },
        },
      );
    }
  }, [kitIdParam, opportunityIdParam, serviceParam, skillParam, current, q.isLoading, generation.isPending, triggeredKey, qc]);

  const generate = () => {
    const oppId = current?.opportunityId || opportunityIdParam || undefined;
    const srv = current?.opportunityTitle || current?.title || serviceParam || undefined;
    generation.mutate(
      { data: { opportunityId: oppId, service: srv, skill: skillParam || undefined } as any },
      {
        onSuccess: (result) => {
          setKit(result);
          if (result?.id) {
            localStorage.setItem("sie_active_kit_id", String(result.id));
          }
          qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
        },
      },
    );
  };

  const saveAsset = (asset: KitAsset, updatedContent?: string) => {
    update.mutate(
      {
        id: asset.id,
        data: {
          status: "Live",
          name: asset.title,
          content: updatedContent ?? asset.content,
        },
      },
      {
        onSuccess: () => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
        },
      },
    );
  };

  if (!current) {
    return (
      <Page eyebrow="04 / Build" title="Income kit">
        {generation.isPending || q.isLoading || isGeneratingService ? (
          <div className="space-y-5">
            <div className="surface p-6">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton mt-3 h-7 w-72 rounded" />
              <div className="skeleton mt-2 h-3 w-56 rounded" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="surface h-64 p-5">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton mt-4 h-32 w-full rounded" />
                  <div className="skeleton mt-4 h-9 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <h3 className="mt-4 font-extrabold">Generate Income Kit</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Ready to generate platform-ready assets calibrated to your skill profile.
            </p>
            <Button
              className="mt-5"
              onClick={generate}
              testId="button-generate-income-kit"
            >
              <Sparkles size={14} /> Generate income kit
            </Button>
          </div>
        )}
      </Page>
    );
  }

  const displayedAssets = activeTab === "all"
    ? current.assets
    : current.assets.filter((a) => a.type.toLowerCase().includes(activeTab.toLowerCase()) || activeTab.toLowerCase().includes(a.type.toLowerCase()));

  const portfolioAsset = current.assets.find(
    (a) => a.type === "Portfolio project"
  );
  const existingRepoUrl =
    (portfolioAsset as any)?.url ||
    portfolioAsset?.content?.match(
      /https:\/\/github\.com\/[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+/
    )?.[0] ||
    null;

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
            {(current.opportunityTitle || current.title || (typeof window !== "undefined" ? localStorage.getItem("sie_active_opportunity_title") : "") || "Micro-Service Income Kit").replace(/\*\*/g, "")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated{" "}
            {current.generatedAt || current.createdAt
              ? new Date(current.generatedAt || current.createdAt!).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Today"}{" "}
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

      {/* 4 Asset Navigation Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-border/70 pb-3" role="tablist">
        {ASSET_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-[0_4px_12px_rgba(33,105,195,.2)]"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              data-testid={`tab-${tab.id.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "all" ? (
        <ExecutionLaunchpad
          current={current}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onOpenGithubDeploy={() => setIsDeployModalOpen(true)}
          dynamicTiers={dynamicTiers}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {displayedAssets.map((asset) => (
            <KitAssetCard
              asset={asset}
              key={asset.id}
              kitId={Number(current.id) || 1}
              opportunityTitle={current.opportunityTitle || current.title || ""}
              existingRepoUrl={existingRepoUrl}
              editing={editing === asset.id}
              onEdit={() => setEditing(editing === asset.id ? null : asset.id)}
              onSave={(updatedContent) => saveAsset(asset, updatedContent)}
              updatePending={update.isPending}
              dynamicTiers={dynamicTiers}
              onDeploySuccess={() => {
                qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
                qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
                qc.invalidateQueries({ queryKey: ["deployments"] });
                qc.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          ))}
        </div>
      )}

      <GitHubDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        kitId={Number(current.id) || 1}
        opportunityTitle={current.opportunityTitle || current.title || ""}
        onSuccess={(repoUrl) => {
          setIsDeployModalOpen(false);
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
          qc.invalidateQueries({ queryKey: ["deployments"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
        }}
      />
    </Page>
  );
}

interface PricingTierData {
  tier: string;
  packageTitle: string;
  deliverables: string[];
  delivery: string;
  revisions: string;
  priceInr: string;
  priceUsd: string;
}

function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/###+\s*/g, "")
    .replace(/##+\s*/g, "")
    .replace(/#+\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-[11px] text-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedMarkdownText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className={`space-y-2 text-xs leading-relaxed text-muted-foreground ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        if (/^###+\s+/.test(trimmed)) {
          const heading = trimmed.replace(/^###+\s+/, "");
          return (
            <h5 key={idx} className="mt-3 text-xs font-bold uppercase tracking-wider text-foreground">
              {renderInlineMarkdown(heading)}
            </h5>
          );
        }
        if (/^##+\s+/.test(trimmed)) {
          const heading = trimmed.replace(/^##+\s+/, "");
          return (
            <h4 key={idx} className="mt-3 text-sm font-extrabold text-foreground">
              {renderInlineMarkdown(heading)}
            </h4>
          );
        }
        if (/^#+\s+/.test(trimmed)) {
          const heading = trimmed.replace(/^#+\s+/, "");
          return (
            <h3 key={idx} className="mt-3 text-base font-extrabold text-foreground">
              {renderInlineMarkdown(heading)}
            </h3>
          );
        }
        if (/^[-*•]\s+/.test(trimmed)) {
          const bullet = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="flex-1 leading-snug">{renderInlineMarkdown(bullet)}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function GigListingViewer({
  content,
  dynamicTiers,
}: {
  content: string;
  dynamicTiers?: ReturnType<typeof calculateDynamicTiers>;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Parse title
  const titleMatch = content.match(/^#\s*(?:Gig Title:)?\s*([^\n]+)/m);
  const gigTitle = titleMatch ? titleMatch[1].replace(/\*\*/g, "").trim() : "";

  // Parse description
  const descMatch = content.match(/## Description\s*\n([\s\S]*?)(?=\n## Pricing Tiers|\n## Platform Search Tags|$)/i);
  const description = descMatch ? descMatch[1].trim() : "";

  // Parse Search Tags
  const tagsMatch = content.match(/## Platform Search Tags\s*\n([\s\S]*?)(?=\n## Frequently Asked Questions|$)/i);
  let tags: string[] = [];
  if (tagsMatch) {
    const raw = tagsMatch[1].match(/`([^`]+)`/g);
    if (raw) tags = raw.map((t) => t.replace(/`/g, "").trim());
  }

  // Parse Pricing Tiers from Markdown Table
  const tiersMatch = content.match(/## Pricing Tiers[^\n]*\s*\n([\s\S]*?)(?=\n## Platform Search Tags|\n## Frequently Asked Questions|$)/i);
  const tiers: PricingTierData[] = [];
  if (tiersMatch) {
    const lines = tiersMatch[1].split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|") && !l.includes(":---"));
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
        if (cols.length >= 7) {
          // | Tier | Package Name | Deliverables | Delivery | Revisions | Price (INR) | Price (USD) |
          tiers.push({
            tier: cols[0].replace(/\*\*/g, ""),
            packageTitle: cols[1].replace(/\*\*/g, ""),
            deliverables: cols[2].split(/[,;•]/).map((s) => s.trim().replace(/\*\*/g, "")).filter(Boolean),
            delivery: cols[3],
            revisions: cols[4],
            priceInr: cols[5],
            priceUsd: cols[6],
          });
        } else if (cols.length >= 5) {
          // | Tier | Price (INR / USD) | Delivery | Revisions | Scope & Deliverables |
          const p = cols[1];
          const [inr, usd] = p.includes("/") ? p.split("/").map((s) => s.trim()) : [p, ""];
          tiers.push({
            tier: cols[0].replace(/\*\*/g, ""),
            packageTitle: `${cols[0].replace(/\*\*/g, "")} Package`,
            deliverables: cols[4].split(/[,;•]/).map((s) => s.trim().replace(/\*\*/g, "")).filter(Boolean),
            delivery: cols[2],
            revisions: cols[3],
            priceInr: inr || "₹3,500",
            priceUsd: usd || "$45",
          });
        }
      }
    }
  }

  const effectiveTiers: PricingTierData[] = tiers.length > 0 ? tiers : [
    {
      tier: "Basic",
      packageTitle: "Starter Pilot Sprint",
      deliverables: ["1 Core deliverable / microservice", "Verification test suite", "Basic README documentation"],
      delivery: "2 Days",
      revisions: "1 Revision",
      priceInr: dynamicTiers?.basicInr || "₹4,300",
      priceUsd: dynamicTiers?.basicUsd || "$51",
    },
    {
      tier: "Standard",
      packageTitle: "Complete Solution Package",
      deliverables: ["Full microservice implementation", "Automated tests & API schemas", "Deployment guide & script", "Client onboarding support"],
      delivery: "4 Days",
      revisions: "3 Revisions",
      priceInr: dynamicTiers?.standardInr || "₹10,800",
      priceUsd: dynamicTiers?.standardUsd || "$127",
    },
    {
      tier: "Premium",
      packageTitle: "Enterprise Production Grade",
      deliverables: ["Production-ready architecture", "Multi-platform integration", "Performance optimization", "Priority 24/7 SLA & 14-day warranty"],
      delivery: "7 Days",
      revisions: "Unlimited Revisions",
      priceInr: dynamicTiers?.premiumInr || "₹20,200",
      priceUsd: dynamicTiers?.premiumUsd || "$238",
    },
  ];

  // Parse FAQs
  const faqMatch = content.match(/## Frequently Asked Questions[^\n]*\s*\n([\s\S]*)/i);
  const faqs: { q: string; a: string }[] = [];
  if (faqMatch) {
    const blocks = faqMatch[1].split(/\n(?=\*\*Q)/g);
    for (const b of blocks) {
      const qm = b.match(/\*\*Q[0-9:]*\s*([^*]+)\*\*/i);
      const am = b.match(/\bA:\s*([\s\S]+)/i);
      if (qm && am) {
        faqs.push({
          q: qm[1].trim(),
          a: am[1].trim(),
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      {gigTitle && (
        <div className="rounded-xl border border-border/80 bg-secondary/30 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Search-Optimized Gig Title</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h4 className="font-extrabold text-foreground">{renderInlineMarkdown(gigTitle)}</h4>
            <ClipboardButton text={stripMarkdown(gigTitle)} label="Copy Title" size="xs" variant="secondary" />
          </div>
        </div>
      )}

      {/* Platform Search Tags */}
      {tags.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search Tags ({tags.length})</span>
            <ClipboardButton text={tags.join(", ")} label="Copy Tags" size="xs" />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
              >
                <span className="text-primary font-bold">#</span>
                <span>{t}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Pricing Tier Cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-foreground">3-Tier Pricing Architecture</h4>
            <p className="text-xs text-muted-foreground">Calibrated INR & USD pricing with delivery timelines and scope.</p>
          </div>
          <ClipboardButton
            text={tiersMatch ? tiersMatch[0] : ""}
            label="Copy Pricing Tiers"
            size="xs"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {effectiveTiers.map((t, idx) => {
            const isPopular = t.tier.toLowerCase().includes("standard");
            const tierNameLower = t.tier.toLowerCase();
            const displayPriceInr = dynamicTiers
              ? tierNameLower.includes("basic")
                ? dynamicTiers.basicInr
                : tierNameLower.includes("standard")
                  ? dynamicTiers.standardInr
                  : tierNameLower.includes("premium")
                    ? dynamicTiers.premiumInr
                    : t.priceInr
              : t.priceInr;
            const displayPriceUsd = dynamicTiers
              ? tierNameLower.includes("basic")
                ? dynamicTiers.basicUsd
                : tierNameLower.includes("standard")
                  ? dynamicTiers.standardUsd
                  : tierNameLower.includes("premium")
                    ? dynamicTiers.premiumUsd
                    : t.priceUsd
              : t.priceUsd;

            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between rounded-2xl p-4.5 transition-all ${
                  isPopular
                    ? "border-2 border-primary bg-card shadow-[0_12px_28px_rgba(33,105,195,.12)] ring-4 ring-primary/5"
                    : "border border-border/80 bg-card/60 hover:border-border hover:bg-card"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                    Most Popular
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t.tier.replace(/\*\*/g, "")}
                    </span>
                    <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {t.delivery}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-foreground">
                    {renderInlineMarkdown((t.packageTitle || "").replace(/\*\*/g, ""))}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground tracking-tight">
                      {displayPriceInr}
                    </span>
                    {displayPriceUsd && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({displayPriceUsd})
                      </span>
                    )}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <span>•</span> {t.revisions}
                  </div>

                  <div className="mt-4 border-t border-border/70 pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Deliverables:
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {t.deliverables.map((d, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2">
                          <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                          <span className="leading-snug">{renderInlineMarkdown(d.replace(/\*\*/g, ""))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="rounded-xl border border-border/80 bg-secondary/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gig Description</span>
            <ClipboardButton text={stripMarkdown(description)} label="Copy Description" size="xs" />
          </div>
          <FormattedMarkdownText text={description} />
        </div>
      )}

      {/* FAQs Accordion */}
      {faqs.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Frequently Asked Questions ({faqs.length})
          </div>
          <div className="space-y-2">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <span>{renderInlineMarkdown(f.q)}</span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/60 bg-secondary/20 p-3.5 text-xs leading-relaxed text-muted-foreground">
                      <FormattedMarkdownText text={f.a} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioScaffoldViewer({ content }: { content: string }) {
  const [activeSubTab, setActiveSubTab] = useState<"readme" | "second">("readme");

  // Extract README and multi-domain second file (specification.md, framework.md, or app.py)
  let readme = "";
  let secondFileName = "app.py";
  let secondFileType: "code" | "spec" | "framework" = "code";
  let secondContent = "";

  if (content.includes("# File: specification.md")) {
    const parts = content.split("# File: specification.md");
    readme = parts[0].replace(/# File: README\.md\s*/i, "").trim();
    secondFileName = "specification.md";
    secondFileType = "spec";
    secondContent = parts[1].trim();
  } else if (content.includes("# File: framework.md")) {
    const parts = content.split("# File: framework.md");
    readme = parts[0].replace(/# File: README\.md\s*/i, "").trim();
    secondFileName = "framework.md";
    secondFileType = "framework";
    secondContent = parts[1].trim();
  } else if (content.includes("# File: app.py")) {
    const parts = content.split("# File: app.py");
    readme = parts[0].replace(/# File: README\.md\s*/i, "").trim();
    secondFileName = "app.py";
    secondFileType = "code";
    secondContent = parts[1].trim();
  } else if (content.includes("# File: README.md")) {
    readme = content.replace(/# File: README\.md\s*/i, "").trim();
  } else {
    readme = content;
  }

  const cleanReadme = readme.replace(/^```(?:markdown)?\s*\n/i, "").replace(/\n```\s*$/i, "").trim();
  const cleanSecond = secondContent.replace(/^```(?:python|markdown|yaml)?\s*\n/i, "").replace(/\n```\s*$/i, "").trim();

  const secondTabLabel =
    secondFileType === "spec"
      ? "specification.md (Specification)"
      : secondFileType === "framework"
        ? "framework.md (Framework)"
        : "app.py (Scaffold)";

  const activeContent = activeSubTab === "readme" ? cleanReadme : cleanSecond;

  const isCreative = secondFileType === "spec" || content.toLowerCase().includes("video") || content.toLowerCase().includes("premiere");
  const isBusiness = secondFileType === "framework" || content.toLowerCase().includes("audit") || content.toLowerCase().includes("strategy");

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("readme")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === "readme"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-readme"
          >
            <FileText size={13} />
            <span>README.md</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("second")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === "second"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-second-file"
          >
            {secondFileType === "code" ? (
              <Code size={13} />
            ) : secondFileType === "spec" ? (
              <BookOpen size={13} />
            ) : (
              <Target size={13} />
            )}
            <span>{secondTabLabel}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ClipboardButton
            text={activeContent}
            label={`Copy ${activeSubTab === "readme" ? "README.md" : secondFileName}`}
            size="xs"
            variant="secondary"
          />
          <ClipboardButton
            text={content}
            label="Copy All Files"
            size="xs"
            variant="ghost"
          />
        </div>
      </div>

      {/* Content View */}
      {activeSubTab === "readme" ? (
        <div className="rounded-xl border border-border/80 bg-secondary/20 p-5">
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border/60">
            {isCreative ? (
              <>
                <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500 border border-purple-500/20">
                  4K / 60fps
                </span>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20">
                  -14 LUFS Audio
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                  Broadcast Ready
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  Client Rubric
                </span>
              </>
            ) : isBusiness ? (
              <>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20">
                  Executive Deck
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                  KPI Scorecard
                </span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                  Benchmark Model
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  Client Ready
                </span>
              </>
            ) : (
              <>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20">
                  Python 3.10+
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                  MIT License
                </span>
                <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500 border border-purple-500/20">
                  PEP 8 / Typed
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  Production Ready
                </span>
              </>
            )}
          </div>
          <div className="mt-4 whitespace-pre-line font-sans text-xs leading-relaxed text-muted-foreground selection:bg-primary/20">
            {cleanReadme}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0b1019] overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#121824] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] font-semibold text-slate-400">
                {secondFileName} • {secondFileType === "code" ? "Python Runner" : secondFileType === "spec" ? "Production Workflow Specification" : "Strategic Audit Framework"}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {cleanSecond.split("\n").length} lines
            </div>
          </div>
          <pre className="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
            <code>{cleanSecond || `# No ${secondFileName} content available`}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function LandingPageViewer({ content }: { content: string }) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [refreshKey, setRefreshKey] = useState(0);

  const openInNewWindow = () => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const downloadHtml = () => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "preview"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye size={13} />
            <span>Interactive Live Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "code"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code size={13} />
            <span>Raw HTML / Tailwind Code</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            title="Reload Preview Frame"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openInNewWindow}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            title="Open preview in new tab"
          >
            <ExternalLink size={12} />
            <span>Full Window</span>
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            title="Download index.html file"
          >
            <Download size={12} />
            <span>Download HTML</span>
          </button>
          <ClipboardButton text={content} label="Copy HTML" size="xs" variant="primary" />
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "preview" ? (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg">
          <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">https://preview.sie-engine.local/landing</span>
            </div>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Live Sandboxed Iframe
            </span>
          </div>
          <iframe
            key={refreshKey}
            srcDoc={content}
            sandbox="allow-scripts allow-same-origin"
            className="h-[620px] w-full border-0 bg-white"
            title="Landing Page Live Preview"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0b1019] overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#121824] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] font-semibold text-slate-400">
                index.html • HTML5 / Tailwind CDN
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {content.split("\n").length} lines
            </div>
          </div>
          <pre className="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function OutreachScriptsViewer({ content }: { content: string }) {
  const [activeScript, setActiveScript] = useState<"linkedin" | "email" | "whatsapp">("linkedin");
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  // Parse LinkedIn Note
  let linkedinNote = "";
  const liMatch = content.match(/### Template 1:[^\n]*\n([\s\S]*?)(?=\n---|\n### Template 2|$)/i);
  if (liMatch) {
    linkedinNote = liMatch[1].replace(/\*Context:[^*]+\*/i, "").replace(/```(?:text)?\s*/gi, "").replace(/```/g, "").trim();
  }

  // Parse Cold Email
  let emailSubject = "";
  let emailBody = "";
  const emailMatch = content.match(/### Template 2:[^\n]*\n([\s\S]*?)(?=\n---|\n### Template 3|$)/i);
  if (emailMatch) {
    const rawEmail = emailMatch[1].replace(/\*Context:[^*]+\*/i, "").trim();
    const subjMatch = rawEmail.match(/(?:Subject:\s*|\*\*Subject:\*\*\s*)([^\n]+)/i);
    if (subjMatch) {
      emailSubject = subjMatch[1].trim();
      emailBody = rawEmail.replace(/(?:Subject:\s*|\*\*Subject:\*\*\s*)[^\n]+\n+/i, "").trim();
    } else {
      emailBody = rawEmail;
    }
  }

  // Parse WhatsApp Pitch
  let whatsappPitch = "";
  const waMatch = content.match(/### Template 3:[^\n]*\n([\s\S]*?)(?=\n---|$)/i);
  if (waMatch) {
    whatsappPitch = waMatch[1].replace(/\*Context:[^*]+\*/i, "").replace(/```(?:text)?\s*/gi, "").replace(/```/g, "").trim();
  }

  // Handle LinkedIn direct trigger
  const handleOpenLinkedIn = () => {
    const textToCopy = stripMarkdown(linkedinNote || content);
    navigator.clipboard.writeText(textToCopy);
    setCopiedLinkedIn(true);
    setTimeout(() => setCopiedLinkedIn(false), 4000);
    window.open("https://www.linkedin.com/messaging/", "_blank", "noopener,noreferrer");
  };

  const cleanEmailBody = stripMarkdown(emailBody || content);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(cleanEmailBody)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(cleanEmailBody)}`;

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveScript("linkedin")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeScript === "linkedin"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send size={13} />
            <span>LinkedIn Note</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScript("email")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeScript === "email"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail size={13} />
            <span>Cold Email Sequence</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScript("whatsapp")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeScript === "whatsapp"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareText size={13} />
            <span>WhatsApp / DM Pitch</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ClipboardButton
            text={stripMarkdown(
              activeScript === "linkedin"
                ? (linkedinNote || content)
                : activeScript === "email"
                  ? (emailBody || content)
                  : (whatsappPitch || content)
            )}
            label="Copy Script"
            size="xs"
            variant="secondary"
          />
        </div>
      </div>

      {/* Script Views */}
      {activeScript === "linkedin" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground italic">
              Context: Send with connection invite to CTOs, founders, and engineering managers.
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                linkedinNote.length <= 300
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
              }`}
            >
              {linkedinNote.length} / 300 characters
            </span>
          </div>

          {copiedLinkedIn && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600">
              <Check size={15} className="shrink-0" />
              <span>Pitch copied to clipboard! Paste into your LinkedIn chat.</span>
            </div>
          )}

          <div className="relative rounded-xl border border-border/80 bg-secondary/30 p-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground font-medium">
              {stripMarkdown(linkedinNote || content)}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <ClipboardButton text={stripMarkdown(linkedinNote || content)} label="Copy Note" size="xs" variant="secondary" />
              <button
                type="button"
                onClick={handleOpenLinkedIn}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a66c2] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#004182] transition-colors"
                data-testid="button-open-linkedin-action"
              >
                <Send size={13} />
                <span>{copiedLinkedIn ? "Copied! Opening LinkedIn..." : "Open LinkedIn Messaging"}</span>
                <ExternalLink size={11} className="opacity-80" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeScript === "email" && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground italic">
            Context: High-converting 3-touch cadence opener targeting decision makers.
          </div>

          {emailSubject && (
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    Subject Line
                  </span>
                  <div className="text-xs font-bold text-foreground mt-0.5">{emailSubject}</div>
                </div>
                <ClipboardButton text={emailSubject} label="Copy Subject" size="xs" variant="secondary" />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email Body
              </span>
              <ClipboardButton text={cleanEmailBody} label="Copy Body" size="xs" variant="secondary" />
            </div>
            <div className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {cleanEmailBody}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/60">
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
                title="Open in native default mail app"
              >
                <Mail size={13} />
                <span>Mail App</span>
              </a>
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-colors"
                data-testid="button-send-email-action"
              >
                <Mail size={13} />
                <span>Send via Gmail</span>
                <ExternalLink size={11} className="opacity-80" />
              </a>
            </div>
          </div>
        </div>
      )}

      {activeScript === "whatsapp" && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground italic">
            Context: Direct outreach for fast-turnaround business owners and SMEs.
          </div>
          <div className="rounded-2xl border border-border/80 bg-secondary/20 p-5 flex flex-col items-start">
            {/* Chat Bubble Style */}
            <div className="max-w-md rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 p-4 text-xs leading-relaxed text-foreground shadow-sm">
              <p className="whitespace-pre-line font-medium">{stripMarkdown(whatsappPitch || content)}</p>
              <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-bold text-primary">
                <span>Just now</span>
                <span>✓✓</span>
              </div>
            </div>
            <div className="mt-4 flex w-full flex-wrap items-center justify-end gap-2">
              <ClipboardButton text={stripMarkdown(whatsappPitch || content)} label="Copy WhatsApp Pitch" size="xs" variant="secondary" />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(stripMarkdown(whatsappPitch || content))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                data-testid="button-open-whatsapp-action"
              >
                <MessageSquareText size={13} />
                <span>Open WhatsApp Web</span>
                <ExternalLink size={11} className="opacity-80" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function slugifyRepoName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "portfolio-project";
}

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitId: number;
  opportunityTitle: string;
  onSuccess: (repoUrl: string) => void;
}

function GitHubDeployModal({
  isOpen,
  onClose,
  kitId,
  opportunityTitle,
  onSuccess,
}: GitHubDeployModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [repoName, setRepoName] = useState(() => slugifyRepoName(opportunityTitle));
  const [isPrivate, setIsPrivate] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [useSavedToken, setUseSavedToken] = useState(Boolean(user?.github_token));
  const [saveTokenToProfile, setSaveTokenToProfile] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    repo_url: string;
    clone_url: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRepoName(slugifyRepoName(opportunityTitle));
      setError(null);
      setSuccessData(null);
      const hasSaved = Boolean(user?.github_token);
      setUseSavedToken(hasSaved);
      setGithubToken(user?.github_token || "");
    }
  }, [isOpen, opportunityTitle, user?.github_token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) {
      setError("Repository name is required.");
      return;
    }
    setIsDeploying(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("sie_token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const explicitToken = useSavedToken ? undefined : (githubToken.trim() || undefined);

      const res = await fetch("/api/v1/deploy/github", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          kit_id: kitId,
          repo_name: repoName.trim(),
          is_private: isPrivate,
          github_token: explicitToken,
          save_token: !useSavedToken && saveTokenToProfile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to deploy repository to GitHub.");
      }

      if (!useSavedToken && saveTokenToProfile) {
        qc.invalidateQueries({ queryKey: getMeQueryKey() });
      }

      setSuccessData(data);
      onSuccess(data.repo_url);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during deployment.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10213b]/65 p-4 backdrop-blur-md">
      <div className="surface animate-rise w-full max-w-lg rounded-2xl p-6 shadow-2xl md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#24292F] text-white dark:bg-white dark:text-neutral-900">
              <Github size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">Publish to GitHub</h3>
              <p className="text-xs text-muted-foreground">
                {user?.github_token && useSavedToken
                  ? "Seamless 1-Click repository deployment to your linked profile"
                  : "Automated 1-Click repository initialization & scaffold push"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            data-testid="button-close-deploy-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success State */}
        {successData ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Repository Published Successfully!
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Your portfolio scaffold and deliverable files are live on GitHub.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Live Repository URL
              </div>
              <a
                href={successData.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline break-all"
                data-testid="link-modal-view-live-repo"
              >
                <span>{successData.repo_url}</span>
                <ExternalLink size={13} className="shrink-0" />
              </a>

              <div className="mt-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Git Clone Command
              </div>
              <div className="mt-1 flex items-center justify-between rounded-lg bg-background p-2 text-xs font-mono text-foreground border border-input">
                <span className="truncate">git clone {successData.clone_url}</span>
                <ClipboardButton text={`git clone ${successData.clone_url}`} size="xs" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={successData.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primary/90"
              >
                View Live Repository on GitHub →
              </a>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Linked Account Status Badge */}
            {user?.github_token && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>✓ Linked GitHub account detected {user?.github_username ? `(@${user.github_username})` : ""}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseSavedToken(!useSavedToken)}
                    className="text-[11px] font-bold text-primary hover:underline"
                    data-testid="button-toggle-saved-token"
                  >
                    {useSavedToken ? "Change token" : "Use saved credentials"}
                  </button>
                </div>
                {useSavedToken ? (
                  <p className="mt-1 text-[11px] text-emerald-700/90 dark:text-emerald-300/80">
                    1-Click deployment active using your securely stored profile token.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Enter an alternate personal access token below for this repository.
                  </p>
                )}
              </div>
            )}

            {/* Repository Name */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Repository Name
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\.]/g, "-"))}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 font-mono text-xs text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="e.g. pandas-data-automation-pipeline"
                required
                data-testid="input-repo-name"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Target: <span className="font-mono text-foreground">github.com/{user?.github_username || "[your-user]"}/{repoName || "..."}</span>
              </p>
            </div>

            {/* Visibility Selector */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Repository Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                    !isPrivate
                      ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                      : "border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-foreground">Public (Recommended)</span>
                  </div>
                  <span className="mt-1 text-[11px] leading-tight text-muted-foreground">
                    Showcase as portfolio proof to freelance clients.
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                    isPrivate
                      ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                      : "border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-foreground">Private</span>
                  </div>
                  <span className="mt-1 text-[11px] leading-tight text-muted-foreground">
                    Restricted to your personal GitHub account.
                  </span>
                </label>
              </div>
            </div>

            {/* Personal Access Token (PAT) Section */}
            {user?.github_token && useSavedToken ? (
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-emerald-500" />
                  <span className="font-semibold text-foreground">GitHub Credentials:</span>
                  <span className="font-mono">•••••••••••••••• (Saved in Profile)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSavedToken(false)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Use Custom Token
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Skill-to-Income+Engine"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Generate Token <ExternalLink size={10} />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... (or fine-grained github_pat_...)"
                    className="h-10 w-full rounded-xl border border-input bg-background pl-3 pr-10 font-mono text-xs text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    data-testid="input-github-pat"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Requires a token with <strong className="text-foreground">Contents: Read & Write</strong> permissions.
                </p>

                <label className="mt-2.5 flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={saveTokenToProfile}
                    onChange={(e) => setSaveTokenToProfile(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                    data-testid="checkbox-save-token"
                  />
                  <span>Save this token to my profile for future 1-click deployments</span>
                </label>
              </div>
            )}

            {/* Form Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isDeploying}
                testId="button-cancel-deploy"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isDeploying || !repoName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#24292F] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1b1f23] disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                data-testid="button-submit-github-deploy"
              >
                {isDeploying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Publishing to GitHub…</span>
                  </>
                ) : (
                  <>
                    <Github size={14} />
                    <span>{user?.github_token && useSavedToken ? "Deploy Repository" : "Create & Push Repository"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface LandingPageDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitId: number;
  opportunityTitle: string;
  existingRepoUrl?: string | null;
  onSuccess: (liveUrl: string) => void;
}

function LandingPageDeployModal({
  isOpen,
  onClose,
  kitId,
  opportunityTitle,
  existingRepoUrl,
  onSuccess,
}: LandingPageDeployModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [provider, setProvider] = useState<"github_pages" | "preview">(() => {
    return existingRepoUrl || user?.github_token ? "github_pages" : "preview";
  });
  const [customSlug, setCustomSlug] = useState(() => slugifyRepoName(opportunityTitle));
  const [githubToken, setGithubToken] = useState(user?.github_token || "");
  const [showToken, setShowToken] = useState(false);
  const [useSavedToken, setUseSavedToken] = useState(Boolean(user?.github_token));
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    live_url: string;
    provider: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomSlug(slugifyRepoName(opportunityTitle));
      setError(null);
      setSuccessData(null);
      const hasSaved = Boolean(user?.github_token);
      setUseSavedToken(hasSaved);
      setGithubToken(user?.github_token || "");
      if (existingRepoUrl || hasSaved) {
        setProvider("github_pages");
      }
    }
  }, [isOpen, opportunityTitle, user?.github_token, existingRepoUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("sie_token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const explicitToken =
        provider === "github_pages" && !useSavedToken
          ? githubToken.trim() || undefined
          : undefined;

      const res = await fetch("/api/v1/deploy/landing-page", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          kit_id: kitId,
          provider,
          custom_slug: customSlug.trim() || undefined,
          github_token: explicitToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to deploy landing page to live web.");
      }

      // Invalidate queries so that Asset 3 status updates across dashboard and inventory
      qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
      qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetAnalyticsQueryKey() });
      qc.invalidateQueries({ queryKey: ["deployments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });

      setSuccessData(data);
      onSuccess(data.live_url);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during deployment.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10213b]/65 p-4 backdrop-blur-md">
      <div className="surface animate-rise w-full max-w-lg rounded-2xl p-6 shadow-2xl md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Globe2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">Publish Live Landing Page</h3>
              <p className="text-xs text-muted-foreground">
                Deploy Asset 3 to a shareable, public live URL for client proposals & outreach
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            data-testid="button-close-landing-deploy-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success State */}
        {successData ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Landing Page Published Live!
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {successData.provider === "github_pages"
                  ? "Live on GitHub Pages with tracking telemetry and lead inquiry capture enabled."
                  : "Your persistent public preview link is active and ready to share with clients."}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3 font-mono text-xs text-foreground break-all">
              {successData.live_url}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <ClipboardButton
                text={
                  successData.live_url.startsWith("http")
                    ? successData.live_url
                    : `${window.location.origin}${successData.live_url}`
                }
                label="Copy Link"
                variant="secondary"
              />
              <a
                href={successData.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-neutral-900"
                data-testid="link-modal-view-live-site"
              >
                <span>View Live Website</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* If an existing deployed GitHub repository was detected for this kit */}
            {existingRepoUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-300">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                    <span>Existing GitHub Repository Detected</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-emerald-800 dark:text-emerald-300 break-all">
                    {existingRepoUrl}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Deploy live to your existing repository via GitHub Pages. Your landing page will be compiled and published directly to GitHub Pages with 1-click.
                  </p>
                </div>

                {provider !== "preview" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setProvider("preview")}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Or generate instant public preview link instead →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* If no existing repo, offer two choices */
              <div className="space-y-3">
                <div className="text-xs font-bold text-foreground">Select Deployment Target:</div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setProvider("github_pages")}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                      provider === "github_pages"
                        ? "border-cyan-500/80 bg-cyan-500/10 ring-2 ring-cyan-500/20"
                        : "border-border/80 bg-secondary/30 hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <Github size={15} />
                      <span>Deploy to GitHub Pages</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      Publish live to <code className="text-foreground">github.io</code> with official SSL & Git versioning.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider("preview")}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                      provider === "preview"
                        ? "border-cyan-500/80 bg-cyan-500/10 ring-2 ring-cyan-500/20"
                        : "border-border/80 bg-secondary/30 hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <Globe2 size={15} />
                      <span>Instant Public Preview</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      Generates a live public preview link immediately with zero setup required.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* GitHub Token Config (if GitHub Pages is chosen and not using existing repo) */}
            {provider === "github_pages" && (
              <div className="space-y-3 pt-1">
                {user?.github_token && useSavedToken ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold">Linked GitHub account detected</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseSavedToken(false)}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Use different token
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        GitHub Personal Access Token
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Skill-to-Income+Pages"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        Generate Token <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_... (or fine-grained github_pat_...)"
                        className="h-10 w-full rounded-xl border border-input bg-background pl-3 pr-10 font-mono text-xs text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                        data-testid="input-landing-github-pat"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom URL Slug */}
            <div>
              <label className="text-xs font-bold text-foreground">
                Public URL Slug / Identifier
              </label>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="e.g. data-pipeline-service"
                className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 font-mono text-xs text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                data-testid="input-landing-custom-slug"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {provider === "github_pages"
                  ? "Used as the repository and GitHub Pages URL path."
                  : "Used as the public preview address: /api/v1/preview/{slug}"}
              </p>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isDeploying}
                testId="button-cancel-landing-deploy"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isDeploying}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-neutral-900 dark:hover:bg-cyan-400"
                data-testid="button-submit-landing-deploy"
              >
                {isDeploying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Publishing Live Web Page…</span>
                  </>
                ) : (
                  <>
                    <Globe2 size={14} />
                    <span>
                      {existingRepoUrl && provider === "github_pages"
                        ? "Go Live"
                        : provider === "github_pages"
                          ? "Deploy to GitHub Pages"
                          : "Create Instant Public Preview Link"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface TailorProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitId: number;
  opportunityTitle: string;
}

function TailorProposalModal({
  isOpen,
  onClose,
  kitId,
  opportunityTitle,
}: TailorProposalModalProps) {
  const [platform, setPlatform] = useState<"upwork" | "email" | "linkedin" | "fiverr">("upwork");
  const [jobDescription, setJobDescription] = useState("");
  const [clientBudget, setClientBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    platform: string;
    custom_proposal: string;
    hook_summary: string;
    detected_pain_points: string[];
    referenced_assets: {
      portfolio_url?: string;
      github_repo_url?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError("Please paste a client job description or project brief.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("sie_token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/assets/tailor-proposal", {
        method: "POST",
        headers,
        body: JSON.stringify({
          kit_id: kitId,
          job_description: jobDescription.trim(),
          client_platform: platform,
          client_budget: clientBudget.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to tailor proposal. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.custom_proposal) return;
    navigator.clipboard.writeText(result.custom_proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getMailtoHref = () => {
    if (!result?.custom_proposal) return "#";
    const lines = result.custom_proposal.split("\n");
    let subject = "Quick question regarding your project";
    let body = result.custom_proposal;
    if (lines[0].toLowerCase().startsWith("subject:")) {
      subject = lines[0].replace(/^subject:\s*/i, "").trim();
      body = lines.slice(1).join("\n").trim();
    }
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213b]/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="surface relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border/80">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Wand2 size={20} />
          </div>
          <div>
            <h2 className="display text-xl font-extrabold tracking-[-.03em] text-foreground">
              Tailor Proposal to Client Job
            </h2>
            <p className="text-xs text-muted-foreground">
              Synthesize a tailored, high-converting pitch linking your live assets for {opportunityTitle}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Platform Tabs */}
        <div className="mt-5">
          <label className="text-xs font-bold text-foreground">Target Client Platform</label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "upwork", label: "Upwork Proposal" },
              { id: "email", label: "Cold Email" },
              { id: "linkedin", label: "LinkedIn InMail" },
              { id: "fiverr", label: "Direct Message" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlatform(p.id as any);
                  if (result) {
                    setResult(null);
                  }
                }}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                  platform === p.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
                data-testid={`tab-platform-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Client Job Description or Project Brief</span>
              <span className="text-[10px] font-normal text-muted-foreground">Paste from Upwork / email / brief</span>
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g., Looking for someone to automate our daily CSV sales exports into PostgreSQL and build a dashboard..."
              className="mt-1.5 w-full rounded-xl border border-border/80 bg-background p-3 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              data-testid="input-job-description"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Client Budget or Hourly Rate <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span></span>
            </label>
            <input
              type="text"
              value={clientBudget}
              onChange={(e) => setClientBudget(e.target.value)}
              placeholder="e.g., $250 fixed or $50/hr"
              className="mt-1.5 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              data-testid="input-client-budget"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating || !jobDescription.trim()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-primary text-xs font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            data-testid="button-generate-tailored-proposal"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Synthesizing Tailored Pitch...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Generate Tailored Proposal</span>
              </>
            )}
          </button>
        </form>

        {/* Results Display */}
        {result && (
          <div className="mt-6 space-y-4 rounded-xl border border-border/80 bg-secondary/20 p-4">
            {/* Extracted Pain Points */}
            {result.detected_pain_points && result.detected_pain_points.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Detected Client Pain Points
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.detected_pain_points.map((point, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary"
                    >
                      <Sparkles size={11} /> {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hook Strategy */}
            {result.hook_summary && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span><strong className="font-bold">Opening Hook:</strong> {result.hook_summary}</span>
              </div>
            )}

            {/* Proposal Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground">Tailored Pitch Preview</label>
                <div className="flex items-center gap-2">
                  {platform === "email" && (
                    <a
                      href={getMailtoHref()}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-secondary transition-colors"
                      data-testid="button-open-email"
                    >
                      <Mail size={12} />
                      <span>Open in Email</span>
                    </a>
                  )}
                  {result.referenced_assets?.github_repo_url && (
                    <a
                      href={result.referenced_assets.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-secondary transition-colors"
                      data-testid="link-proposal-repo"
                    >
                      <Github size={12} />
                      <span>Attached Repo</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                    data-testid="button-copy-tailored-pitch"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? "Copied!" : "Copy Tailored Pitch"}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={result.custom_proposal}
                onChange={(e) => setResult({ ...result, custom_proposal: e.target.value })}
                rows={9}
                className="w-full rounded-xl border border-border/80 bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                data-testid="textarea-tailored-proposal"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KitAssetCard({
  asset,
  kitId = 1,
  opportunityTitle = "",
  existingRepoUrl,
  editing,
  onEdit,
  onSave,
  updatePending,
  onDeploySuccess,
  dynamicTiers,
}: {
  asset: KitAsset;
  kitId?: number;
  opportunityTitle?: string;
  existingRepoUrl?: string | null;
  editing: boolean;
  onEdit: () => void;
  onSave: (updatedContent?: string) => void;
  updatePending: boolean;
  onDeploySuccess?: (repoUrl: string) => void;
  dynamicTiers?: ReturnType<typeof calculateDynamicTiers>;
}) {
  const [content, setContent] = useState(asset.content);
  useEffect(() => {
    setContent(asset.content);
  }, [asset.content]);

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isLandingDeployModalOpen, setIsLandingDeployModalOpen] = useState(false);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [liveRepoUrl, setLiveRepoUrl] = useState<string | null>(() => {
    const rawUrl = (asset as any).url;
    if (rawUrl) return rawUrl;
    const match = asset.content.match(/https:\/\/github\.com\/[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+/);
    return match ? match[0] : null;
  });
  const [liveSiteUrl, setLiveSiteUrl] = useState<string | null>(() => {
    const rawUrl = (asset as any).live_url || (asset as any).url;
    if (rawUrl) return rawUrl;
    const match = asset.content.match(/https?:\/\/[a-zA-Z0-9_\-\.]+\.(?:github\.io|local)[^\s"'<>]+/);
    return match ? match[0] : null;
  });
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  const isGig = asset.type === "Gig listing";
  const isPortfolio = asset.type === "Portfolio project";
  const isLanding = asset.type === "Landing page";
  const isOutreach = asset.type === "Outreach scripts";

  const currentStatus =
    statusOverride ||
    (liveRepoUrl || liveSiteUrl ? "Live" : asset.status);

  return (
    <div className="surface overflow-hidden transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-4 border-b border-border/70 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {isOutreach ? (
            <MessageSquareText size={18} />
          ) : isPortfolio ? (
            <BriefcaseBusiness size={18} />
          ) : isLanding ? (
            <Globe2 size={18} />
          ) : (
            <FileText size={18} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-foreground">{asset.type}</h3>
            <StatusPill tone={currentStatus === "Live" ? "green" : "amber"}>
              {currentStatus}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {(asset.description || "").replace(/\*\*/g, "")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {isOutreach && (
            <button
              type="button"
              onClick={() => setIsTailorModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
              data-testid="header-button-tailor-proposal"
              title="Tailor pitch to a specific job post"
            >
              <Wand2 size={13} />
              <span className="hidden sm:inline">Tailor to Specific Job</span>
              <span className="sm:hidden">Tailor</span>
            </button>
          )}
          {isLanding && (
            <>
              <a
                href={`/api/v1/preview/kit-${kitId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/60 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                data-testid="header-button-preview-landing"
                title="View Fullscreen Preview in new tab"
              >
                <ExternalLink size={12} />
                <span className="hidden sm:inline">View Fullscreen Preview</span>
                <span className="sm:hidden">Preview</span>
              </a>
              <button
                type="button"
                onClick={() => setIsLandingDeployModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-neutral-900 dark:hover:bg-cyan-400"
                data-testid="header-button-publish-landing"
              >
                <Globe2 size={13} />
                <span>Publish Live Page</span>
              </button>
            </>
          )}
          <ClipboardButton
            text={content}
            label={isLanding ? "Copy HTML" : isPortfolio ? "Copy Code" : "Copy Deliverable"}
            size="xs"
            variant="secondary"
          />
          <button
            className={`rounded-lg p-2 text-muted-foreground hover:bg-secondary ${
              editing ? "bg-secondary text-primary font-bold" : ""
            }`}
            onClick={onEdit}
            aria-label={`Edit ${asset.type}`}
            data-testid={`button-edit-kit-${asset.id}`}
            title={editing ? "Close Editor" : "Edit Raw Content"}
          >
            <Pencil size={15} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Asset 2 (Portfolio Project): Live Success Banner */}
        {isPortfolio && liveRepoUrl && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Repository is live on GitHub!</span>
            </div>
            <a
              href={liveRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:underline dark:text-emerald-300"
              data-testid="link-view-github-live"
            >
              View Live Repository on GitHub <ArrowRight size={13} />
            </a>
          </div>
        )}

        {/* Asset 2 (Portfolio Project): 1-Click GitHub Pipeline Action Bar */}
        {isPortfolio && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#24292F] text-white dark:bg-white dark:text-neutral-900">
                <Github size={16} />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">GitHub 1-Click Deployment Pipeline</div>
                <div className="text-[11px] text-muted-foreground">
                  Auto-create repo, commit README and scaffold files directly to GitHub
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/v1/assets/${kitId}/download`}
                download
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-foreground"
                data-testid={`button-download-zip-${asset.id}`}
                title="Download in-memory .zip bundle"
              >
                <Download size={13} />
                <span>Download Project (.zip)</span>
              </a>
              <button
                type="button"
                onClick={() => setIsDeployModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#24292F] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1b1f23] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                data-testid={`button-publish-github-${asset.id}`}
              >
                <Github size={13} />
                <span>Publish to GitHub</span>
              </button>
            </div>
          </div>
        )}

        {/* Asset 3 (Landing Page): Live Success Banner */}
        {isLanding && liveSiteUrl && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Landing Page is live on the public web!</span>
            </div>
            <a
              href={liveSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:underline dark:text-emerald-300"
              data-testid="link-view-landing-live"
            >
              View Live Website → <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* Asset 3 (Landing Page): 1-Click Live Web Deployment Pipeline Action Bar */}
        {isLanding && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-600 text-white dark:bg-cyan-500 dark:text-neutral-900">
                <Globe2 size={16} />
              </div>
              <div>
                <div className="text-xs font-extrabold text-foreground">1-Click Live Web Deployment</div>
                <div className="text-[11px] text-muted-foreground">
                  Publish live client landing page to GitHub Pages or generate an instant public web link
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/v1/preview/kit-${kitId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-secondary hover:text-foreground"
                data-testid={`button-fullscreen-preview-${asset.id}`}
                title="Open isolated fullscreen preview in new tab"
              >
                <ExternalLink size={13} />
                <span>View Fullscreen Preview</span>
              </a>
              <button
                type="button"
                onClick={() => setIsLandingDeployModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-cyan-500 dark:bg-cyan-500 dark:text-neutral-900 dark:hover:bg-cyan-400"
                data-testid={`button-publish-live-page-${asset.id}`}
              >
                <Globe2 size={13} />
                <span>Publish Live Page</span>
              </button>
            </div>
          </div>
        )}

        {editing ? (
          <div>
            <div className="mb-2 text-xs font-bold text-muted-foreground">
              Direct Markdown / HTML Editor
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[260px] w-full resize-y rounded-xl border border-input bg-background p-3.5 font-mono text-xs leading-6 outline-none focus:ring-4 focus:ring-primary/10 text-foreground"
              data-testid={`textarea-kit-${asset.id}`}
            />
          </div>
        ) : (
          <div>
            {isGig ? (
              <GigListingViewer content={content} dynamicTiers={dynamicTiers} />
            ) : isPortfolio ? (
              <PortfolioScaffoldViewer content={content} />
            ) : isLanding ? (
              <LandingPageViewer content={content} />
            ) : isOutreach ? (
              <OutreachScriptsViewer content={content} />
            ) : (
              <div className="min-h-[160px] whitespace-pre-line rounded-xl bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
                {content}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
          {editing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={onEdit}
                testId={`button-cancel-kit-${asset.id}`}
              >
                Cancel
              </Button>
              <Button
                onClick={() => onSave(content)}
                testId={`button-save-kit-${asset.id}`}
              >
                {updatePending ? "Saving…" : "Save Content"} <Check size={14} />
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={onEdit}
              className="text-xs"
              testId={`button-edit-action-${asset.id}`}
            >
              <Pencil size={13} /> Edit Content
            </Button>
          )}

          <div className="flex items-center gap-2">
            <ClipboardButton
              text={content}
              label={isLanding ? "Copy HTML" : isPortfolio ? "Copy Code" : "Copy Deliverable"}
              size="xs"
              variant="secondary"
            />
          </div>
        </div>
      </div>

      {/* GitHub Deployment Modal */}
      {isPortfolio && (
        <GitHubDeployModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          kitId={kitId}
          opportunityTitle={opportunityTitle || asset.title}
          onSuccess={(repoUrl) => {
            setLiveRepoUrl(repoUrl);
            setStatusOverride("Live");
            onDeploySuccess?.(repoUrl);
          }}
        />
      )}

      {/* Landing Page Deployment Modal */}
      {isLanding && (
        <LandingPageDeployModal
          isOpen={isLandingDeployModalOpen}
          onClose={() => setIsLandingDeployModalOpen(false)}
          kitId={kitId}
          opportunityTitle={opportunityTitle || asset.title}
          existingRepoUrl={existingRepoUrl}
          onSuccess={(liveUrl) => {
            setLiveSiteUrl(liveUrl);
            setStatusOverride("Live");
            onDeploySuccess?.(liveUrl);
          }}
        />
      )}

      {/* Proposal Tailoring Modal */}
      {isOutreach && (
        <TailorProposalModal
          isOpen={isTailorModalOpen}
          onClose={() => setIsTailorModalOpen(false)}
          kitId={kitId}
          opportunityTitle={opportunityTitle || asset.title}
        />
      )}
    </div>
  );
}

function getAssetTypeBadge(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("gig")) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        <BriefcaseBusiness size={12} /> Gig Listing
      </span>
    );
  }
  if (t.includes("scaffold") || t.includes("project") || t.includes("portfolio")) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
        <Code size={12} /> Portfolio Scaffold
      </span>
    );
  }
  if (t.includes("outreach") || t.includes("email") || t.includes("script")) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
        <Mail size={12} /> Outreach Scripts
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
      <Globe2 size={12} /> Landing Page
    </span>
  );
}

function AssetsPage() {
  const q = useGetAssets();
  const update = useUpdateAsset();
  const remove = useDeleteAsset();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const assets: Asset[] = q.data ?? [];
  const rows = assets.filter((a) => filter === "All" || a.status === filter);

  // Group assets by parent kit / opportunity title
  const groupedKits = useMemo(() => {
    const groups: { [key: string]: { title: string; oppId: string; items: Asset[] } } = {};
    for (const a of rows) {
      const groupKey = a.opportunityId || a.opportunityTitle || "default";
      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: a.opportunityTitle || "Income Kit Deliverables",
          oppId: a.opportunityId || "",
          items: [],
        };
      }
      groups[groupKey].items.push(a);
    }
    return Object.values(groups);
  }, [rows]);

  const publish = (id: string, status: string) =>
    update.mutate(
      { id, data: { status } },
      {
        onSuccess: () =>
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() }),
      },
    );

  const handleDelete = (id: string) => {
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetIncomeKitQueryKey() });
        },
      },
    );
  };

  return (
    <Page
      eyebrow="05 / Ship"
      title="Asset Inventory"
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-3">
          <span className="mono text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "deliverable" : "deliverables"} active
          </span>
          <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              title="Card Grid View"
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              title="Table View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      <QueryState
        loading={q.isLoading}
        error={q.isError && !assets.length}
        onRetry={() => q.refetch()}
      >
        {viewMode === "cards" ? (
          <div className="space-y-8">
            {groupedKits.map((group) => (
              <div key={group.oppId || group.title} className="rounded-2xl border border-border/70 bg-card/60 p-5 md:p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-extrabold text-foreground">
                        {group.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {group.items.length} Production Deliverables Generated
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/income-kit?opportunityId=${encodeURIComponent(group.oppId)}&service=${encodeURIComponent(group.title)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Open Entire Kit in Studio <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {group.items.map((asset) => (
                    <div
                      key={asset.id}
                      className="surface relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                      data-testid={`card-asset-${asset.id}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          {getAssetTypeBadge(asset.type)}
                          <StatusPill tone={asset.status === "Live" ? "green" : "amber"}>
                            {asset.status === "Live" ? "Live" : "Ready to Deploy"}
                          </StatusPill>
                        </div>

                        <h4 className="mt-3 text-xs font-extrabold leading-snug line-clamp-2 text-foreground">
                          {asset.name}
                        </h4>

                        <div className="mt-2 text-[10px] text-muted-foreground">
                          Created {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>

                        {asset.content && (
                          <p className="mt-3 rounded-md bg-secondary/40 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
                            {asset.content.replace(/[#*`_]/g, "").slice(0, 90)}…
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                        <div className="flex items-center gap-1">
                          <ClipboardButton
                            text={asset.content || asset.name}
                            label="Copy"
                            size="xs"
                            variant="secondary"
                          />
                          <Link
                            href={`/income-kit?opportunityId=${encodeURIComponent(asset.opportunityId || "")}&service=${encodeURIComponent(asset.opportunityTitle || asset.name)}`}
                          >
                            <Button variant="ghost" className="text-xs font-bold text-primary px-2">
                              <Eye size={12} /> View in Kit
                            </Button>
                          </Link>
                        </div>

                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors disabled:opacity-50"
                          onClick={() => handleDelete(asset.id)}
                          disabled={remove.isPending}
                          data-testid={`button-delete-asset-${asset.id}`}
                          title="Delete deliverable from kit"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!groupedKits.length && (
              <div className="surface flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FileText size={22} />
                </div>
                <h3 className="mt-4 text-base font-extrabold">No Assets in this View</h3>
                <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                  Generate your first income kit to create deployable client proposals, scaffolds, outreach sequences, and landing pages.
                </p>
                <Link href="/income-kit" className="mt-4">
                  <Button variant="primary" className="gap-2 text-xs font-bold">
                    <Plus size={14} /> Generate Income Kit
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="surface overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-border/70 bg-secondary/35 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Deliverable</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Parent Kit</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-border/60 last:border-0 hover:bg-secondary/25 transition-colors"
                      data-testid={`row-asset-${asset.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                            <FileText size={15} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getAssetTypeBadge(asset.type)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="mono text-xs text-muted-foreground">
                          {asset.opportunityTitle || "Income Kit"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill
                          tone={asset.status === "Live" ? "green" : "amber"}
                        >
                          {asset.status === "Live" ? "Live" : "Ready to Deploy"}
                        </StatusPill>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ClipboardButton
                            text={asset.content || asset.name}
                            label="Copy"
                            size="xs"
                            variant="secondary"
                          />
                          <Link
                            href={`/income-kit?opportunityId=${encodeURIComponent(asset.opportunityId || "")}&service=${encodeURIComponent(asset.opportunityTitle || asset.name)}`}
                          >
                            <Button variant="ghost" className="text-xs font-bold text-primary px-2">
                              <Eye size={12} /> View in Kit
                            </Button>
                          </Link>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors disabled:opacity-50"
                            onClick={() => handleDelete(asset.id)}
                            disabled={remove.isPending}
                            data-testid={`button-delete-asset-${asset.id}`}
                            title="Delete asset from workspace"
                          >
                            <Trash2 size={14} />
                          </button>
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
        )}
      </QueryState>
    </Page>
  );
}

interface LoggedOutcome {
  id: number;
  user_id: number;
  asset_id?: string;
  opportunity_title: string;
  platform: string;
  days_active: number;
  inquiries_received: number;
  orders_converted: number;
  revenue_inr: number;
  status: string;
  notes?: string;
  strategy_recommendation?: string;
  created_at?: string;
}

function AnalyticsPage() {
  const q = useGetAnalytics();
  const qc = useQueryClient();
  const { toast } = useToast();
  const oppsQuery = useGetOpportunities();
  const kitsQuery = useGetIncomeKit();

  const opportunities = oppsQuery.data ?? [];
  const currentKit = kitsQuery.data;

  const outcomesQuery = useQuery<LoggedOutcome[]>({
    queryKey: ["user-outcomes"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token") || localStorage.getItem("sie_token") || "";
      const res = await fetch("/api/v1/feedback/outcomes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const loggedOutcomes = outcomesQuery.data ?? [];

  // Form State
  const [selectedOpp, setSelectedOpp] = useState("");
  const [platform, setPlatform] = useState("Fiverr");
  const [daysActive, setDaysActive] = useState<number>(7);
  const [inquiries, setInquiries] = useState<number>(2);
  const [orders, setOrders] = useState<number>(1);
  const [revenue, setRevenue] = useState<number>(3500);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAdvice, setLatestAdvice] = useState<string | null>(null);

  const activeOppTitle =
    selectedOpp ||
    currentKit?.opportunityTitle ||
    currentKit?.title ||
    opportunities[0]?.title ||
    "Micro-Service Automation";

  const handleLogOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("sie_token") || "";
      const res = await fetch("/api/v1/feedback/outcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          opportunity_title: activeOppTitle,
          platform,
          days_active: Number(daysActive) || 1,
          inquiries_received: Number(inquiries) || 0,
          orders_converted: Number(orders) || 0,
          revenue_inr: Number(revenue) || 0,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to log outcome");
      }

      const data = await res.json();
      setLatestAdvice(data.strategy_recommendation);
      qc.invalidateQueries({ queryKey: ["user-outcomes"] });
      qc.invalidateQueries({ queryKey: getGetAnalyticsQueryKey() });
      q.refetch();
      toast({
        title: "Milestone Outcome Logged",
        description: data.strategy_recommendation || "Adaptive feedback loop updated your strategy.",
      });
    } catch (err: any) {
      toast({
        title: "Logging Failed",
        description: err.message || "Could not record outcome.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const primaryRecalibration =
    latestAdvice ||
    loggedOutcomes[0]?.strategy_recommendation ||
    a.recommendations[0] ||
    "Demand signals healthy. Maintain active outreach cadence across target platforms.";

  return (
    <Page
      eyebrow="06 / Learn"
      title="Feedback & analytics"
      action={
        <Button
          variant="secondary"
          onClick={() => {
            q.refetch();
            outcomesQuery.refetch();
          }}
          testId="button-refresh-analytics"
        >
          <RefreshCw size={15} /> Refresh feedback
        </Button>
      }
    >
      <QueryState
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => {
          q.refetch();
          outcomesQuery.refetch();
        }}
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

        {/* Adaptive Strategy Guidance Card */}
        <div
          className="surface blue-grid mt-5 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[.08] via-emerald-500/[.05] to-card p-5 md:p-6 shadow-sm"
          data-testid="adaptive-strategy-guidance-card"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Adaptive Strategy Guidance
                  </span>
                  <StatusPill tone="green">Signal 1 & 2 Closed-Loop</StatusPill>
                </div>
                <p className="mt-1.5 text-sm md:text-base font-semibold leading-relaxed text-foreground">
                  {primaryRecalibration}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" /> Grounded in {loggedOutcomes.length} milestone check-in{loggedOutcomes.length === 1 ? "" : "s"}
                  </span>
                  <span>•</span>
                  <span>Click-telemetry tracked via <code className="text-[11px] bg-secondary px-1.5 py-0.5 rounded font-mono">/api/v1/track</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Signal Outcome Milestone Check-In & Logged Outcomes Section */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          {/* Form: Log Deployment Outcome */}
          <div className="surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold flex items-center gap-2">
                  <Target size={16} className="text-primary" /> Log Deployment Outcome
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Report real-world platform milestones to trigger autonomous AI pricing and strategy recalibration.
                </p>
              </div>
              <StatusPill tone="blue">Signal 1 Check-In</StatusPill>
            </div>

            <form onSubmit={handleLogOutcome} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground">
                  Target Micro-Service / Opportunity
                </label>
                <select
                  value={selectedOpp || activeOppTitle}
                  onChange={(e) => setSelectedOpp(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  data-testid="select-outcome-opportunity"
                >
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.title}>
                      {opp.title} (#{opp.rank})
                    </option>
                  ))}
                  {currentKit?.opportunityTitle && (
                    <option value={currentKit.opportunityTitle}>
                      {currentKit.opportunityTitle} (Active Kit)
                    </option>
                  )}
                  {!opportunities.length && (
                    <option value="Python Workflow Automation">Python Workflow Automation</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground">
                  Deployment Platform
                </label>
                <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {["Fiverr", "Upwork", "Cold Email", "LinkedIn", "WhatsApp"].map((plat) => (
                    <button
                      type="button"
                      key={plat}
                      onClick={() => setPlatform(plat)}
                      className={`rounded-lg py-2 text-[11px] font-bold transition-colors border ${
                        platform === plat
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary/60 text-muted-foreground border-border/50 hover:text-foreground"
                      }`}
                      data-testid={`button-platform-${plat.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Days Active
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={daysActive}
                    onChange={(e) => setDaysActive(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    data-testid="input-outcome-days"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Inquiries Received
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inquiries}
                    onChange={(e) => setInquiries(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    data-testid="input-outcome-inquiries"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Orders Converted
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={orders}
                    onChange={(e) => setOrders(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    data-testid="input-outcome-orders"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Revenue Earned (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={revenue}
                    onChange={(e) => setRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    data-testid="input-outcome-revenue"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground">
                  Client Notes / Context (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client asked for webhook integration, closed standard tier."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary"
                  data-testid="input-outcome-notes"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-xs font-bold gap-2"
                testId="button-submit-outcome"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Recalibrating Engine…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Submit Milestone Check-In
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* List: Logged Outcomes */}
          <div className="surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" /> Logged Outcomes
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    User-reported milestones closing the career feedback loop.
                  </p>
                </div>
                <span className="mono text-xs font-bold text-primary">
                  {loggedOutcomes.length} Recorded
                </span>
              </div>

              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {loggedOutcomes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
                    <Target size={24} className="mx-auto text-muted-foreground/40" />
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      No outcomes recorded yet.
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      Submit your first milestone check-in on the left to trigger adaptive recalibration.
                    </p>
                  </div>
                ) : (
                  loggedOutcomes.map((outcome) => {
                    const convRate =
                      outcome.inquiries_received > 0
                        ? ((outcome.orders_converted / outcome.inquiries_received) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div
                        key={outcome.id}
                        className="rounded-xl border border-border/70 bg-secondary/30 p-3.5 text-xs transition-colors hover:border-primary/30"
                        data-testid={`card-outcome-${outcome.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                {outcome.platform}
                              </span>
                              <span className="font-bold text-foreground truncate max-w-[200px]">
                                {outcome.opportunity_title}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span>{outcome.days_active}d active</span>
                              <span>•</span>
                              <span>{outcome.inquiries_received} inquiries</span>
                              <span>•</span>
                              <span className="font-semibold text-foreground">
                                {outcome.orders_converted} order{outcome.orders_converted === 1 ? "" : "s"}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-500 font-bold">{convRate}% conv.</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="mono font-bold text-emerald-500 text-sm">
                              ₹{Math.round(outcome.revenue_inr).toLocaleString("en-IN")}
                            </div>
                            <StatusPill
                              tone={
                                outcome.status === "converted"
                                  ? "green"
                                  : outcome.status === "stalled"
                                    ? "amber"
                                    : "blue"
                              }
                            >
                              {outcome.status === "converted" ? "Converted" : outcome.status === "stalled" ? "Stalled" : "Running"}
                            </StatusPill>
                          </div>
                        </div>

                        {outcome.strategy_recommendation && (
                          <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-primary/[.06] p-2 text-[11px] text-foreground border border-primary/15">
                            <Sparkles size={13} className="shrink-0 mt-0.5 text-primary" />
                            <span className="leading-relaxed">{outcome.strategy_recommendation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-border/70 pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Telemetry Auto-Recalibration</span>
              <span className="font-semibold text-primary">Active</span>
            </div>
          </div>
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

const KNOWN_TECH_TOKENS = new Set([
  "html", "css", "sql", "js", "ts", "aws", "gcp", "ml", "ai", "k8s", "php", "npm",
  "xml", "ci/cd", "ssh", "ftp", "sdk", "api", "svg", "ui", "ux", "c++", "c#", "r", "c",
  "vue", "git", "net", "web", "seo", "dev", "ops", "cms", "bot", "vba", "cli", "bash",
  "postgresql", "postgres", "rag & llms", "rag", "llm", "llms", "rest apis", "ci/cd pipelines",
  "alembic", "pandas etl", "next.js", "node.js", "tailwind css", "docker", "linux", "fastapi"
]);

const KEYBOARD_MASH_REGEX = /(asdf|fsdf|dgdf|dgddfg|dhhb|sdfd|sdsf|dfgh|fghj|ghjk|hjkl|qwer|wert|zxcv|xcvb|cvbn|vbnm|adnkdsn|adnk|dsfd|fgdf)/i;

function isValidSkill(input: string): boolean {
  const clean = input.trim();
  // Reject input tokens shorter than 2 letters
  if (clean.length < 2) {
    return false;
  }
  const lower = clean.toLowerCase();
  if (KNOWN_TECH_TOKENS.has(lower)) {
    return true;
  }
  if (KEYBOARD_MASH_REGEX.test(lower)) {
    return false;
  }
  // Discard tokens with no vowels
  if (!/[aeiouy]/i.test(clean)) {
    return false;
  }
  // Reject 3 or more identical characters in a row (e.g. "aaa", "dddd")
  if (/(.)\1{2,}/i.test(clean)) {
    return false;
  }
  // Discard tokens composed of random repeated consonants / 4+ consecutive consonants (e.g. "adnkdsn", "sdsf")
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(clean)) {
    return false;
  }
  // Reject 3-letter tokens that are consonant-heavy keyboard mashing
  if (clean.length <= 3 && !KNOWN_TECH_TOKENS.has(lower)) {
    const allowedThreeLetter = new Set([
      "app", "api", "vue", "git", "sql", "aws", "gcp", "net", "web", "seo",
      "dev", "ops", "cms", "bot", "vba", "cli", "php", "npm", "xml", "ssh", "ftp", "sdk", "svg"
    ]);
    if (!allowedThreeLetter.has(lower)) {
      return false;
    }
  }
  return true;
}

const GH_URL_STRICT_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/([A-Za-z0-9_-]{1,39})\/?$/i;
const GH_HANDLE_STRICT_REGEX = /^[A-Za-z0-9_-]{1,39}$/;

function isValidGithubUsername(handle: string): boolean {
  if (!handle || handle.length < 1 || handle.length > 39) return false;
  // Cannot start or end with a hyphen or underscore
  if (/^[-_]|[-_]$/.test(handle)) return false;
  // Cannot contain consecutive hyphens
  if (/--/.test(handle)) return false;
  // Reject keyboard mashing
  if (KEYBOARD_MASH_REGEX.test(handle.toLowerCase())) return false;
  // Reject arbitrary consonant strings like "dgddfg" with no vowels or digits
  if (!/[aeiouy0-9]/i.test(handle)) return false;
  // Reject 4 or more consecutive consonants (e.g. "dgddfg", "adnkdsn")
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(handle)) return false;
  // Reject 3 or more identical repeated characters
  if (/(.)\1{2,}/i.test(handle)) return false;
  return true;
}

function validateAndFormatGithub(input: string): { valid: boolean; formatted?: string; username?: string } {
  const clean = input.trim();
  if (!clean) return { valid: false };

  let username = "";
  const urlMatch = clean.match(GH_URL_STRICT_REGEX);
  if (urlMatch) {
    username = urlMatch[3];
  } else if (GH_HANDLE_STRICT_REGEX.test(clean)) {
    username = clean;
  } else {
    return { valid: false };
  }

  if (!isValidGithubUsername(username)) {
    return { valid: false };
  }

  return {
    valid: true,
    formatted: `https://github.com/${username}`,
    username,
  };
}

const LI_STRICT_REGEX = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)\/?$/i;

function validateAndFormatLinkedin(input: string): { valid: boolean; formatted?: string; username?: string } {
  const clean = input.trim();
  if (!clean) return { valid: true };
  const match = clean.match(LI_STRICT_REGEX);
  if (match) {
    const handle = match[3];
    return { valid: true, formatted: `https://linkedin.com/in/${handle}`, username: handle };
  }
  return { valid: false };
}

function SettingsPage() {
  const q = useGetProfile();
  const update = useUpdateProfile();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const p = q.data;

  const [form, setForm] = useState({
    name: "",
    email: "",
    experience: "",
    availability: "",
    incomeGoal: "₹30,000 / month",
    workType: "",
    githubUsername: "",
    linkedinUrl: "",
    proofProject: "",
    skills: [] as string[],
  });

  const setExperience = (exp: string) => setForm((prev) => ({ ...prev, experience: exp }));
  const setIncomeGoal = (ig: string | number) => {
    const raw = typeof ig === "number" ? `₹${ig.toLocaleString()} / month` : String(ig);
    const formatted = raw.includes("₹") ? raw : `₹${raw}`;
    setForm((prev) => ({ ...prev, incomeGoal: formatted }));
  };
  const setSkills = (s: string[]) => setForm((prev) => ({ ...prev, skills: s }));
  const setGithubUsername = (gh: string) => setForm((prev) => ({ ...prev, githubUsername: gh }));
  const setLinkedinUrl = (li: string) => setForm((prev) => ({ ...prev, linkedinUrl: li }));
  const setProofProject = (pp: string) => setForm((prev) => ({ ...prev, proofProject: pp }));

  const [savedForm, setSavedForm] = useState(form);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    weeklyDigest: true,
    opportunitySignals: true,
    performanceNotes: false,
  });
  const [savedNotifPrefs, setSavedNotifPrefs] = useState(notifPrefs);

  const [newSkill, setNewSkill] = useState("");
  const [skillError, setSkillError] = useState("");
  const [errors, setErrors] = useState<{
    github?: string;
    linkedin?: string;
    skills?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.experience) setExperience(user.experience);
      if (user.income_goal) setIncomeGoal(user.income_goal);
      if (user.skills && user.skills.length > 0) setSkills(user.skills);
      if (user.github_username) setGithubUsername(user.github_username);
      if (user.linkedin_url) setLinkedinUrl(user.linkedin_url);
      if (user.proof_project) setProofProject(user.proof_project);
    }
  }, [user]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sie_notification_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        const prefs = {
          weeklyDigest: parsed.weeklyDigest ?? true,
          opportunitySignals: parsed.opportunitySignals ?? true,
          performanceNotes: parsed.performanceNotes ?? false,
        };
        setNotifPrefs(prefs);
        setSavedNotifPrefs(prefs);
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    if (!p && !user) return;
    let rawIncome = (user?.income_goal ? (typeof user.income_goal === 'number' ? `₹${user.income_goal.toLocaleString()} / month` : String(user.income_goal)) : p?.incomeGoal) || "";
    if (rawIncome.includes("$")) {
      rawIncome = rawIncome.replace(/\$/g, "₹");
    } else if (!rawIncome.includes("₹") && rawIncome.trim()) {
      rawIncome = `₹${rawIncome}`;
    }
    if (!rawIncome.trim()) {
      rawIncome = "₹30,000 / month";
    }

    const loadedSkills = (user?.skills && user.skills.length > 0) ? user.skills : (p?.skills || []);
    const loadedExp = user?.experience || (user as any)?.experience_level || p?.experience || "";
    const loadedGh = user?.github_username || (p as any)?.githubUsername || (p as any)?.github_username || "";
    const loadedLi = user?.linkedin_url || (p as any)?.linkedinUrl || (p as any)?.linkedin_url || "";
    const loadedProof = user?.proof_project || (p as any)?.proofProject || (p as any)?.proof_project || "";

    const loadedForm = {
      name: user?.name || p?.name || "",
      email: user?.email || p?.email || "",
      experience: loadedExp,
      availability: p?.availability || "",
      incomeGoal: rawIncome,
      workType: (user as any)?.career_mode || p?.workType || "",
      githubUsername: loadedGh,
      linkedinUrl: loadedLi,
      proofProject: loadedProof,
      skills: loadedSkills,
    };
    setForm(loadedForm);
    setSavedForm(loadedForm);
    setInitialLoaded(true);
  }, [p, user]);

  const isDirty = useMemo(() => {
    if (!initialLoaded) return false;
    const formDiff =
      form.name !== savedForm.name ||
      form.experience !== savedForm.experience ||
      form.availability !== savedForm.availability ||
      form.incomeGoal !== savedForm.incomeGoal ||
      form.workType !== savedForm.workType ||
      form.githubUsername !== savedForm.githubUsername ||
      form.linkedinUrl !== savedForm.linkedinUrl ||
      form.proofProject !== savedForm.proofProject ||
      JSON.stringify(form.skills) !== JSON.stringify(savedForm.skills);

    const notifDiff =
      notifPrefs.weeklyDigest !== savedNotifPrefs.weeklyDigest ||
      notifPrefs.opportunitySignals !== savedNotifPrefs.opportunitySignals ||
      notifPrefs.performanceNotes !== savedNotifPrefs.performanceNotes;

    return formDiff || notifDiff;
  }, [form, savedForm, notifPrefs, savedNotifPrefs, initialLoaded]);

  const handleSave = async () => {
    const newErrors: { github?: string; linkedin?: string; skills?: string } = {};

    // Validate GitHub: Must be valid handle or URL, reject keyboard mash like "fsdfsm"
    const ghInput = form.githubUsername.trim();
    let canonicalGithub = ghInput;
    let canonicalGithubUrl = "";
    if (ghInput) {
      const ghRes = validateAndFormatGithub(ghInput);
      if (!ghRes.valid) {
        newErrors.github = "Please enter a valid GitHub username (e.g. octocat) or URL (https://github.com/username). Keyboard mashing rejected.";
      } else {
        canonicalGithub = ghRes.username || ghInput;
        canonicalGithubUrl = ghRes.formatted || `https://github.com/${canonicalGithub}`;
      }
    } else {
      newErrors.github = "GitHub username or profile URL is required.";
    }

    // Validate LinkedIn: If provided, must be valid LinkedIn profile URL (https://linkedin.com/in/username), reject "dxvx"
    const liInput = form.linkedinUrl.trim();
    let canonicalLinkedinUrl = liInput;
    if (liInput) {
      const liRes = validateAndFormatLinkedin(liInput);
      if (!liRes.valid) {
        newErrors.linkedin = "Please enter a valid LinkedIn profile URL (https://linkedin.com/in/username).";
      } else {
        canonicalLinkedinUrl = liRes.formatted || liInput;
      }
    }

    // Validate Skills: At least 1 valid skill
    if (form.skills.length === 0) {
      newErrors.skills = "At least one valid skill is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("sie_token") || "";
      const cleanIncome = form.incomeGoal.replace(/[₹$,]/g, "").split("/")[0].trim();
      const incomeGoalNum = parseFloat(cleanIncome) || 30000;

      // Update backend via PUT /api/v1/user/profile
      const res = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          full_name: form.name.trim(),
          experience: form.experience.trim(),
          career_mode: form.workType.trim(),
          income_goal: incomeGoalNum,
          github_username: canonicalGithub,
          github_url: canonicalGithubUrl,
          linkedin_url: canonicalLinkedinUrl,
          proof_project: form.proofProject.trim(),
          skills: form.skills,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update profile.");
      }

      // Also sync dashboard schema state
      await update.mutateAsync({
        data: {
          name: form.name.trim(),
          experience: form.experience.trim(),
          workType: form.workType.trim(),
          incomeGoal: `₹${incomeGoalNum.toLocaleString()} / month`,
          githubUsername: canonicalGithub,
          linkedinUrl: canonicalLinkedinUrl,
          proofProject: form.proofProject.trim(),
          skills: form.skills,
        } as any,
      });

      // Save notification toggles to localStorage
      localStorage.setItem("sie_notification_preferences", JSON.stringify(notifPrefs));

      // Reset dirty state
      const updatedForm = {
        ...form,
        githubUsername: canonicalGithub,
        linkedinUrl: canonicalLinkedinUrl,
        incomeGoal: `₹${incomeGoalNum.toLocaleString()} / month`,
      };
      setForm(updatedForm);
      setSavedForm(updatedForm);
      setSavedNotifPrefs(notifPrefs);

      qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSkillDecompositionQueryKey() });
      qc.invalidateQueries({ queryKey: getGetOpportunitiesQueryKey() });
      qc.invalidateQueries({ queryKey: getMeQueryKey() });

      toast({
        title: "Profile updated successfully",
        description: "Your settings and notification preferences have been saved.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    const clean = newSkill.trim();
    if (!clean) return;

    if (!isValidSkill(clean)) {
      setSkillError("Please enter a valid skill (must have vowels, >=2 chars). Gibberish rejected.");
      return;
    }

    if (form.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkillError("This skill is already in your profile.");
      return;
    }

    setForm({ ...form, skills: [...form.skills, clean] });
    setNewSkill("");
    setSkillError("");
    setErrors((prev) => ({ ...prev, skills: undefined }));
  };

  const removeSkill = (skillToRemove: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skillToRemove) });
  };

  const cleanGithub = (form.githubUsername || "").trim().replace(/^https?:\/\/(www\.)?github\.com\/?/i, "").replace(/^@/, "").split("/")[0].trim();
  const isGithubConnected = Boolean(cleanGithub && validateAndFormatGithub(cleanGithub).valid);
  const githubDetail = isGithubConnected ? `Connected as @${cleanGithub}` : "Not connected";
  const githubHref = isGithubConnected ? `https://github.com/${cleanGithub}` : undefined;

  const rawLinkedin = (form.linkedinUrl || "").trim();
  const isLinkedinConnected = Boolean(rawLinkedin && validateAndFormatLinkedin(rawLinkedin).valid);
  const linkedinDetail = isLinkedinConnected ? "Profile linked" : "Not connected";
  const linkedinHref = isLinkedinConnected
    ? (rawLinkedin.startsWith("http://") || rawLinkedin.startsWith("https://") ? rawLinkedin : `https://${rawLinkedin}`)
    : undefined;

  if (!p && !user) {
    return (
      <Page eyebrow="Account" title="Settings">
        <QueryState
          loading={q.isLoading && !user}
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
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving || update.isPending}
          testId="button-save-settings"
        >
          {isSaving || update.isPending ? "Saving…" : "Save changes"}{" "}
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
                    What SIE uses to calibrate your recommendations and outreach identity.
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
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Email</label>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </div>
                  <input
                    value={form.email}
                    disabled
                    className="mt-2 h-10 w-full rounded-xl border border-input bg-secondary/50 px-3.5 text-xs text-muted-foreground outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <Field
                    label="GitHub Username"
                    value={form.githubUsername}
                    onChange={(v) => {
                      setForm({ ...form, githubUsername: v });
                      if (errors.github) setErrors({ ...errors, github: undefined });
                    }}
                    placeholder="e.g. octocat"
                    testId="input-profile-github"
                  />
                  {errors.github && (
                    <p className="mt-1 text-[11px] font-medium text-destructive" data-testid="error-profile-github">
                      {errors.github}
                    </p>
                  )}
                </div>
                <div>
                  <Field
                    label="LinkedIn URL"
                    value={form.linkedinUrl}
                    onChange={(v) => {
                      setForm({ ...form, linkedinUrl: v });
                      if (errors.linkedin) setErrors({ ...errors, linkedin: undefined });
                    }}
                    placeholder="https://linkedin.com/in/username"
                    testId="input-profile-linkedin"
                  />
                  {errors.linkedin && (
                    <p className="mt-1 text-[11px] font-medium text-destructive" data-testid="error-profile-linkedin">
                      {errors.linkedin}
                    </p>
                  )}
                </div>
                <Field
                  label="Primary Proof Project"
                  value={form.proofProject}
                  onChange={(v) => setForm({ ...form, proofProject: v })}
                  placeholder="e.g. Distributed Web Crawler in Go"
                  testId="input-profile-proof-project"
                />
                <Field
                  label="Experience"
                  value={form.experience}
                  onChange={(v) => setForm({ ...form, experience: v })}
                  testId="input-profile-experience"
                />
                <Field
                  label="Income goal"
                  value={form.incomeGoal}
                  onChange={(v) => setForm({ ...form, incomeGoal: v })}
                  placeholder="₹30,000 / month"
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
                    Modifying skills triggers automatic re-decomposition and market recalibration.
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {form.skills.length} active
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-destructive cursor-pointer"
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    if (skillError) setSkillError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add skill (e.g. FastAPI, Next.js)..."
                  className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="input-new-skill"
                />
                <Button variant="secondary" onClick={addSkill} className="h-10 text-xs" testId="button-add-skill">
                  <Plus size={14} /> Add
                </Button>
              </div>
              {skillError && (
                <p className="mt-2 text-[11px] font-medium text-destructive" data-testid="error-profile-skill">
                  {skillError}
                </p>
              )}
              {errors.skills && (
                <p className="mt-2 text-[11px] font-medium text-destructive">
                  {errors.skills}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-5">
            <div className="surface p-6">
              <h3 className="font-extrabold">Connected accounts</h3>
              <div className="mt-5 space-y-3">
                <Connected
                  icon={Github}
                  name="GitHub"
                  detail={githubDetail}
                  muted={!isGithubConnected}
                  href={githubHref}
                />
                <Connected
                  icon={Globe2}
                  name="LinkedIn"
                  detail={linkedinDetail}
                  muted={!isLinkedinConnected}
                  href={linkedinHref}
                />
              </div>
            </div>
            <div className="surface p-6">
              <h3 className="font-extrabold">Notifications</h3>
              <div className="mt-5 space-y-4">
                <Toggle
                  label="Weekly market digest"
                  enabled={notifPrefs.weeklyDigest}
                  onChange={(val) => setNotifPrefs((prev) => ({ ...prev, weeklyDigest: val }))}
                />
                <Toggle
                  label="New opportunity signals"
                  enabled={notifPrefs.opportunitySignals}
                  onChange={(val) => setNotifPrefs((prev) => ({ ...prev, opportunitySignals: val }))}
                />
                <Toggle
                  label="Asset performance notes"
                  enabled={notifPrefs.performanceNotes}
                  onChange={(val) => setNotifPrefs((prev) => ({ ...prev, performanceNotes: val }))}
                />
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
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testId: string;
}) {
  return (
    <label className="text-xs font-bold">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
  href,
}: {
  icon: LucideIcon;
  name: string;
  detail: string;
  muted?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{name}</span>
          {!muted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
              <Check size={10} /> Connected
            </span>
          )}
        </div>
        <div className="truncate text-[10px] text-muted-foreground">{detail}</div>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-secondary transition-colors"
          data-testid={`button-connect-${name.toLowerCase()}`}
        >
          Manage <ExternalLink size={11} />
        </a>
      ) : (
        <Button
          variant="ghost"
          className="ml-auto px-2 text-[11px]"
          testId={`button-connect-${name.toLowerCase()}`}
        >
          {muted ? "Connect" : "Manage"}
        </Button>
      )}
    </div>
  );
}
function Toggle({
  label,
  enabled = false,
  onChange,
}: {
  label: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!enabled)}
      className="flex w-full items-center justify-between text-left cursor-pointer"
      data-testid={`button-toggle-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span
        className={`relative h-6 w-10 rounded-full transition ${enabled ? "bg-primary" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-5" : "left-1"}`}
        />
      </span>
    </button>
  );
}

function VerifyEmailScreen() {
  const { user, verifyEmail, resendOtp, logout } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || otp.trim().length !== 6) return;
    setError(null);
    setVerifying(true);
    try {
      await verifyEmail(user.email, otp.trim());
    } catch (err) {
      setError(authErrorMessage(err, "Invalid or expired verification code."));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp(user.email);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(authErrorMessage(err, "Failed to resend verification code."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10213b]/60 p-4 backdrop-blur-md">
      <div className="surface animate-rise w-full max-w-md p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck size={32} />
          </div>
          <h2 className="display text-2xl font-extrabold tracking-tight">Verify Your Email Address</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            We sent a 6-digit confirmation code to{" "}
            <span className="font-semibold text-foreground">{user?.email}</span>.
            Enter it below to activate your account.
          </p>
        </div>

        <div className="my-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-bold text-primary">Verification Notice:</span> Check your email inbox (or spam folder) for your 6-digit confirmation code.
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-center text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="h-14 w-full text-center font-mono text-3xl font-bold tracking-[0.4em] rounded-xl border border-input bg-background outline-none ring-primary/20 transition focus:ring-4 focus:border-primary"
              placeholder="••••••"
              autoFocus
              required
              data-testid="input-otp"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive" data-testid="text-verify-error">
              {error}
            </p>
          )}

          {resendSuccess && (
            <p className="rounded-lg bg-emerald-500/10 p-2.5 text-center text-xs font-semibold text-emerald-600">
              New verification code sent! Please check your email inbox.
            </p>
          )}

          <Button type="submit" className="h-12 w-full text-sm font-bold" testId="button-verify-email">
            {verifying ? <Loader2 size={16} className="animate-spin" /> : <>Verify & Continue <ArrowRight size={16} /></>}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-primary hover:underline disabled:opacity-50"
            data-testid="button-resend-otp"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="font-medium text-muted-foreground hover:text-foreground"
            data-testid="button-verify-logout"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

const ONBOARDING_DRAFT_KEY = "sie_onboarding_draft";

const DOMAIN_SKILL_SUGGESTIONS: Record<string, string[]> = {
  "Backend & Systems": [
    "Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker", "SQL"
  ],
  "Data Science, AI & LLMs": [
    "Python", "RAG & LLMs", "Machine Learning", "Data Scraping", "Pandas ETL", "PostgreSQL"
  ],
  "Frontend & Full-Stack": [
    "React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js", "REST APIs"
  ],
  "Cloud, DevOps & Database Architecture": [
    "Docker", "PostgreSQL", "CI/CD Pipelines", "Database Indexing", "Alembic", "Linux"
  ]
};

function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const { user, completeOnboarding, markOnboarded, logout } = useAuth();

  const draft = useMemo(() => {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const [step, setStep] = useState<number>(() => {
    if (typeof draft?.step === "number" && draft.step >= 0 && draft.step <= 2) {
      return draft.step;
    }
    return 0;
  });

  // Step 1: Career Focus & Goals
  const [role, setRole] = useState(() => {
    const r = draft?.domain || draft?.role || user?.career_mode || user?.target_role;
    if (r === "Data Science & AI") return "Data Science, AI & LLMs";
    if (r === "Automation & Scripting") return "Cloud, DevOps & Database Architecture";
    if (r && DOMAIN_SKILL_SUGGESTIONS[r]) return r;
    return "Backend & Systems";
  });
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Advanced">(
    (draft?.experience || draft?.experienceLevel || (user?.experience as any) || "Intermediate")
  );
  const [targetIncome, setTargetIncome] = useState(
    draft?.incomeGoal || draft?.targetIncome || user?.income_goal || "₹30,000"
  );

  // Step 2: Validated Core Skills & Optional Proof
  const [skills, setSkills] = useState<string[]>(() => {
    if (draft?.skills && Array.isArray(draft.skills) && draft.skills.length > 0) {
      return draft.skills;
    }
    if (user?.skills && user.skills.length > 0) {
      return user.skills;
    }
    return [
      "Python",
      "FastAPI",
      "PostgreSQL",
    ];
  });
  const [newSkill, setNewSkill] = useState("");
  const [skillError, setSkillError] = useState<string | null>(null);
  const [proofProject, setProofProject] = useState(
    draft?.proofProject ?? (user?.proof_project || "")
  );

  // Step 3: Online Profiles & Footprint
  const [github, setGithub] = useState(
    draft?.githubUrl || draft?.github || user?.github_username || user?.github_url || ""
  );
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState(
    draft?.githubToken || user?.github_token || user?.github_pat || ""
  );
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [linkedin, setLinkedin] = useState(
    draft?.linkedinUrl || draft?.linkedin || user?.linkedin_url || ""
  );
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache active onboarding form state in sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const draftData = {
          step,
          domain: role,
          role,
          experience: experienceLevel,
          experienceLevel,
          incomeGoal: targetIncome,
          targetIncome,
          skills,
          proofProject,
          githubUrl: github,
          github,
          githubToken,
          linkedinUrl: linkedin,
          linkedin,
        };
        window.sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draftData));
      }
    } catch {
      // Ignore storage errors
    }
  }, [step, role, experienceLevel, targetIncome, skills, proofProject, github, githubToken, linkedin]);

  const quickSkills = DOMAIN_SKILL_SUGGESTIONS[role] || DOMAIN_SKILL_SUGGESTIONS["Backend & Systems"];

  const addSkill = (s: string) => {
    const clean = s.trim();
    if (!clean) return;
    if (!isValidSkill(clean)) {
      setSkillError("Please enter a recognized skill or technology (e.g., Python, SQL, React)");
      return;
    }
    setSkillError(null);
    if (!skills.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setSkills([...skills, clean]);
    }
    setNewSkill("");
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((item) => item !== s));
  };

  const handleGithubChange = (val: string) => {
    setGithub(val);
    if (!val.trim()) {
      setGithubError(null);
    } else {
      const res = validateAndFormatGithub(val);
      if (!res.valid) {
        setGithubError("Please enter a valid GitHub profile URL or username (e.g., https://github.com/username)");
      } else {
        setGithubError(null);
      }
    }
  };

  const handleGithubBlur = () => {
    if (!github.trim()) {
      setGithubError("Please enter a valid GitHub profile URL or username (e.g., https://github.com/username)");
    } else {
      const res = validateAndFormatGithub(github);
      if (!res.valid) {
        setGithubError("Please enter a valid GitHub profile URL or username (e.g., https://github.com/username)");
      } else {
        setGithubError(null);
      }
    }
  };

  const handleLinkedinChange = (val: string) => {
    setLinkedin(val);
    if (!val.trim()) {
      setLinkedinError(null);
    } else {
      const res = validateAndFormatLinkedin(val);
      if (!res.valid) {
        setLinkedinError("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)");
      } else {
        setLinkedinError(null);
      }
    }
  };

  const handleLinkedinBlur = () => {
    if (linkedin.trim()) {
      const res = validateAndFormatLinkedin(linkedin);
      if (!res.valid) {
        setLinkedinError("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)");
      } else {
        setLinkedinError(null);
      }
    }
  };

  const isStep1Valid = Boolean(role && experienceLevel && targetIncome);
  const isStep2Valid = skills.length >= 2;
  const isGithubValid = validateAndFormatGithub(github).valid;
  const isLinkedinValid = !linkedin.trim() || validateAndFormatLinkedin(linkedin).valid;
  const isReadyToFinish = isStep1Valid && isStep2Valid && isGithubValid && isLinkedinValid;

  const handleSubmit = async () => {
    setError(null);
    setGithubError(null);
    setLinkedinError(null);

    const ghRes = validateAndFormatGithub(github);
    if (!ghRes.valid) {
      setGithubError("Please enter a valid GitHub profile URL or username (e.g., https://github.com/username)");
      return;
    }

    let formattedLinkedin: string | undefined = undefined;
    if (linkedin.trim()) {
      const liRes = validateAndFormatLinkedin(linkedin);
      if (!liRes.valid) {
        setLinkedinError("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)");
        return;
      }
      formattedLinkedin = liRes.formatted;
    }

    if (skills.length < 2) {
      setError("Please add at least 2 valid skills before finishing.");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedGithub = ghRes.formatted || `https://github.com/${ghRes.username}`;
      const payload = {
        target_role: role,
        role,
        career_mode: role,
        experience_level: experienceLevel,
        experience: experienceLevel,
        income_goal: targetIncome,
        skills,
        proof_project: proofProject.trim() || undefined,
        github_url: normalizedGithub,
        github_username: ghRes.username || normalizedGithub.replace("https://github.com/", ""),
        github_pat: githubToken.trim() || undefined,
        github_token: githubToken.trim() || undefined,
        linkedin_url: formattedLinkedin,
      };

      await completeOnboarding(payload as any);

      // Dispatch to PUT /api/v1/user/profile for direct profile persistence
      try {
        await fetch("/api/v1/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(typeof window !== "undefined" && window.localStorage.getItem("access_token")
              ? { Authorization: `Bearer ${window.localStorage.getItem("access_token")}` }
              : {})
          },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // Handled via completeOnboarding
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
      }
      localStorage.setItem("onboarding_completed", "true");
      queryClient.setQueryData(getMeQueryKey(), (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboarded: true,
          onboarding_completed: true,
          ...payload,
        };
      });
      markOnboarded();
      onDone();
    } catch (err) {
      setError(authErrorMessage(err, "Failed to complete onboarding."));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10213b]/60 p-4 backdrop-blur-md">
      <div className="surface animate-rise w-full max-w-xl p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="mono text-[11px] font-bold text-primary">
              STEP {step + 1} / 3
            </span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
                }
                logout();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition ml-1 px-2 py-1 rounded-lg border border-border/60 hover:bg-secondary cursor-pointer"
              title="Sign out and return to landing page"
              data-testid="button-onboarding-logout"
            >
              <LogOut size={13} />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Step 1: Career Focus & Goals */}
        {step === 0 && (
          <div className="mt-6 space-y-5">
            <div>
              <div className="eyebrow text-primary">Step 1: Career Focus & Goals</div>
              <h2 className="display mt-2 text-2xl font-extrabold tracking-tight">
                Define Your Career Direction
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Tell us about your target domain, current seniority, and income objectives so SIE can calibrate opportunities to your strengths.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Target Domain / Track
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  data-testid="select-onboarding-track"
                >
                  <option value="Backend & Systems">Backend & Systems</option>
                  <option value="Data Science, AI & LLMs">Data Science, AI & LLMs</option>
                  <option value="Frontend & Full-Stack">Frontend & Full-Stack</option>
                  <option value="Cloud, DevOps & Database Architecture">Cloud, DevOps & Database Architecture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`h-10 rounded-xl text-xs font-bold transition border ${
                        experienceLevel === lvl
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-input bg-background text-foreground hover:bg-secondary"
                      }`}
                      data-testid={`button-exp-${lvl.toLowerCase()}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Target Monthly Income
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["₹15,000", "₹30,000", "₹50,000", "₹1,00,000+"] as const).map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setTargetIncome(inc)}
                      className={`h-10 rounded-xl text-xs font-bold transition border ${
                        targetIncome === inc
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-input bg-background text-foreground hover:bg-secondary"
                      }`}
                      data-testid={`button-income-${inc}`}
                    >
                      {inc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(1)} testId="button-onboarding-step1-next">
                Next: Monetizable Skills <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Validated Core Skills & Optional Proof */}
        {step === 1 && (
          <div className="mt-6 space-y-5">
            <div>
              <div className="eyebrow text-primary">Step 2: Validated Core Skills</div>
              <h2 className="display mt-2 text-2xl font-extrabold tracking-tight">
                What capabilities are you ready to monetize?
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Select or add your technical competencies. SIE decomposes each skill into sellable micro-services.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-2">
                Active Skills ({skills.length})
              </label>
              <div className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-xl bg-secondary/50 border border-border/70">
                {skills.length === 0 ? (
                  <span className="text-xs text-muted-foreground p-1">No skills added yet. Add at least 2 skills below.</span>
                ) : (
                  skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="hover:text-destructive transition"
                        aria-label={`Remove ${s}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    if (skillError) setSkillError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(newSkill);
                    }
                  }}
                  placeholder="e.g. Python, React, PostgreSQL..."
                  className={`h-11 flex-1 rounded-xl border ${skillError ? "border-destructive ring-destructive/20" : "border-input"} bg-background px-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-foreground`}
                  data-testid="input-onboarding-skill"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addSkill(newSkill)}
                  className="h-11 px-4 text-xs font-bold"
                  testId="button-add-skill"
                >
                  <Plus size={14} /> Add
                </Button>
              </div>

              {skillError && (
                <p className="mt-1.5 text-xs font-semibold text-destructive" data-testid="text-skill-error">
                  {skillError}
                </p>
              )}

              <div className="mt-4">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Popular Suggestions ({role}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSkills.map((qs) => {
                    const isAdded = skills.some((s) => s.toLowerCase() === qs.toLowerCase());
                    return (
                      <button
                        key={qs}
                        type="button"
                        onClick={() => addSkill(qs)}
                        disabled={isAdded}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          isAdded
                            ? "bg-primary/10 text-primary/60 cursor-default"
                            : "bg-secondary text-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {isAdded ? `✓ ${qs}` : `+ ${qs}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {skills.length < 2 && (
                <p className="mt-3 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Please add at least 2 valid skills to continue ({skills.length}/2 added).
                </p>
              )}

              {/* Primary Proof of Work (Optional) */}
              <div className="mt-5 border-t border-border/60 pt-4">
                <label className="flex items-center justify-between text-xs font-bold text-foreground mb-1.5">
                  <span>Primary Proof of Work (Optional)</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Optional</span>
                </label>
                <input
                  type="text"
                  value={proofProject}
                  onChange={(e) => setProofProject(e.target.value)}
                  placeholder="e.g., Automated web scraper using BeautifulSoup & PostgreSQL"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  data-testid="input-onboarding-proof-project"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  SIE references this real project in your generated outreach drafts.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={skills.length < 2}
                testId="button-onboarding-step2-next"
              >
                Next: Online Profiles <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Public Footprint & Identity (Mandatory GitHub) */}
        {step === 2 && (
          <div className="mt-6 space-y-5">
            <div>
              <div className="eyebrow text-primary">Step 3: Public Footprint & Identity</div>
              <h2 className="display mt-2 text-2xl font-extrabold tracking-tight">
                Connect Your Public Footprint
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Link your developer footprint so SIE can showcase your real-world proof of work and code capabilities.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Github size={14} className="text-primary" /> GitHub Profile / Handle *
                  </span>
                  <span className="text-[11px] font-semibold text-primary">Required</span>
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => handleGithubChange(e.target.value)}
                  onBlur={handleGithubBlur}
                  placeholder="e.g. octocat or https://github.com/octocat"
                  className={`mt-1.5 h-11 w-full rounded-xl border ${
                    githubError ? "border-destructive ring-destructive/20" : "border-input"
                  } bg-background px-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-foreground`}
                  data-testid="input-onboarding-github"
                />
                {githubError && (
                  <p className="mt-1 text-xs font-semibold text-destructive" data-testid="text-github-error">{githubError}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Lock size={14} className="text-primary" /> GitHub Personal Access Token (Optional for 1-click Deploy)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Skill-to-Income+Engine"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Generate token on GitHub ↗
                  </a>
                </div>
                <div className="relative mt-1.5">
                  <input
                    type={showGithubToken ? "text" : "password"}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="h-11 w-full rounded-xl border border-input bg-background pl-3.5 pr-10 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    data-testid="input-onboarding-github-token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showGithubToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Enables instant 1-click repo deployment. You can skip this and configure it later in Settings.
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Globe2 size={14} className="text-primary" /> LinkedIn Profile URL (Optional)
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">Optional</span>
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => handleLinkedinChange(e.target.value)}
                  onBlur={handleLinkedinBlur}
                  placeholder="https://linkedin.com/in/username"
                  className={`mt-1.5 h-11 w-full rounded-xl border ${
                    linkedinError ? "border-destructive ring-destructive/20" : "border-input"
                  } bg-background px-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-foreground`}
                  data-testid="input-onboarding-linkedin"
                />
                {linkedinError && (
                  <p className="mt-1 text-xs font-semibold text-destructive" data-testid="text-linkedin-error">{linkedinError}</p>
                )}
              </div>

              <div className="surface-tight p-4">
                <div className="text-[11px] font-bold text-primary uppercase tracking-wide">
                  Workspace Calibration Summary
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Target Domain:</span>
                    <div className="font-semibold">{role}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Experience Level:</span>
                    <div className="font-semibold">{experienceLevel}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly Target:</span>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{targetIncome}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Active Skills:</span>
                    <div className="font-semibold">{skills.length} skills selected</div>
                  </div>
                  {proofProject.trim() && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Proof of Work:</span>
                      <div className="font-semibold truncate">{proofProject.trim()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting || !isReadyToFinish}
                className="h-11 px-6 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                testId="button-launch-engine"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={16} /> Finish & Go to Workspace
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/overview" component={DashboardPage} />
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

  // Smoothly normalize root / overview navigation to /dashboard for authenticated users
  useEffect(() => {
    if (user && user.is_verified && user.onboarding_completed) {
      if (location === "/" || location === "/overview") {
        setLocation("/dashboard");
      }
    }
  }, [user, location, setLocation]);

  // Auth state is still loading (first paint)
  if (isLoading) return <FullScreenLoader />;

  // Signed out: show marketing/public pages
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

  // Guard 1: Signed in but email is unverified
  if (!user.is_verified) {
    return <VerifyEmailScreen />;
  }

  // Guard 2: Verified but hasn't completed data-driven onboarding wizard
  const showOnboarding = Boolean(user && user.onboarding_completed === false);
  if (showOnboarding) {
    return <OnboardingWizard onDone={() => setLocation("/dashboard")} />;
  }

  // Verified & onboarded: access full application
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
