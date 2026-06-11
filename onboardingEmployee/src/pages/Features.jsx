import {
  Activity,
  BarChart2,
  Bell,
  CheckSquare,
  ClipboardList,
  FileCheck2,
  FileText,
  GitBranch,
  History,
  KeyRound,
  Lock,
  LockKeyhole,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

const categories = [
  { id: "onboarding", label: "Onboarding" },
  { id: "access-management", label: "Access Management" },
  { id: "compliance", label: "Compliance" },
  { id: "notifications", label: "Notifications" },
  { id: "admin", label: "Admin" },
];

const footerLinks = [
  { label: "Docs", path: "/docs" },
  { label: "Support", path: "/support" }
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white">
        <Users className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="text-xl font-bold text-[#F8FAFC]">OnboardPro</span>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#818CF8]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold leading-tight text-[#F8FAFC] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#94A3B8]">{description}</p>
    </div>
  );
}

function FeaturePoint({ children }) {
  return (
    <li className="flex items-start gap-3 text-sm text-[#94A3B8]">
      <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/15 text-[#818CF8]">
        <CheckSquare className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function Features() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("onboarding");
  const [isExiting, setIsExiting] = useState(false);

  const handleFooterNav = (e, path) => {
    e.preventDefault();
    setIsExiting(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  const tabClasses = (id) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      activeCategory === id
        ? "bg-[#6366F1] text-white shadow-[0_8px_30px_-18px_rgba(99,102,241,0.9)]"
        : "text-[#94A3B8] hover:text-white"
    }`;

  const sections = useMemo(
    () =>
      categories.reduce((acc, item) => {
        acc[item.id] = item.label;
        return acc;
      }, {}),
    [],
  );

  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    setActiveCategory(id);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`public-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC] transition-opacity duration-500 ease-in-out ${isExiting ? "opacity-0" : "opacity-100"}`}>
      <nav className="sticky top-0 z-50 border-b border-[#222533] bg-[#13151D]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/features"
              className="text-sm font-semibold text-[#6366F1] border-b-2 border-[#6366F1] pb-0.5"
            >
              Features
            </Link>
            <Link
              to="/docs"
              className="text-sm font-semibold text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              Docs
            </Link>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#94A3B8] transition hover:border-[#6366F1] hover:text-[#6366F1]"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      <main className="scroll-smooth">
        <section className="bg-[#08090C] pt-[72px] pb-24">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex rounded-full border border-[#6366F1]/20 bg-[#6366F1]/10 px-4 py-2 text-sm font-semibold text-[#818CF8]">
              Everything you need
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-tight text-[#F8FAFC] sm:text-6xl">
              Powerful features for
              <br /> modern HR teams
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#94A3B8]">
              OnboardPro brings together every tool your team needs to onboard employees faster,
              manage access securely, and stay audit-ready.
            </p>
          </div>
        </section>

        <section className="sticky top-[72px] z-40 border-b border-[#222533] bg-[#08090C] px-4 py-4 shadow-sm shadow-black/10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 overflow-x-auto px-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToSection(category.id)}
                className={tabClasses(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section id="onboarding" style={{ scrollMarginTop: "96px" }} className="border-b border-[#222533] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.2fr_0.8fr] xl:gap-24">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="ONBOARDING"
                title="From day one to fully onboarded"
                description="Automate every step of your onboarding workflow so nothing falls through the cracks."
              />

              <div className="space-y-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div className="space-y-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366F1]/10 text-[#6366F1]">
                      <CheckSquare className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#F8FAFC]">Dynamic Onboarding Checklists</h3>
                    <p className="text-base leading-7 text-[#94A3B8]">
                      Build role-specific onboarding checklists that automatically assign tasks to the right people.
                      Each new hire gets a personalized checklist covering personal details, document uploads, policy
                      acknowledgment, and training modules.
                    </p>
                    <ul className="space-y-3">
                      <FeaturePoint>Auto-generated per role and department</FeaturePoint>
                      <FeaturePoint>Real-time progress tracking</FeaturePoint>
                      <FeaturePoint>Manager visibility into completion status</FeaturePoint>
                      <FeaturePoint>Sequential task locking</FeaturePoint>
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-[#222533] bg-[#13151D] p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center justify-between border-b border-[#222533] pb-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#EC4899]">Checklist</p>
                        <p className="mt-2 text-sm text-[#94A3B8]">50% complete</p>
                      </div>
                      <span className="inline-flex rounded-full bg-[#6366F1]/10 px-3 py-1 text-xs font-semibold text-[#818CF8]">
                        In progress
                      </span>
                    </div>
                    <div className="mt-6 space-y-4">
                      {[
                        { label: "Personal details submitted", done: true },
                        { label: "Policy acknowledgment signed", done: true },
                        { label: "Upload ID document", done: false },
                        { label: "Training module completion", done: false },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#191C26] px-4 py-3">
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${item.done ? "bg-[#10B981]/15 text-[#10B981]" : "border border-[#222533] text-[#94A3B8]"}`}>
                            {item.done ? "✓" : "☐"}
                          </span>
                          <p className={`text-sm ${item.done ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-2xl border border-[#222533] bg-[#191C26] p-4">
                      <div className="mb-3 flex items-center justify-between text-sm font-medium text-[#F8FAFC]">
                        <span>Progress</span>
                        <span>50%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#222533]">
                        <div className="h-full w-1/2 rounded-full bg-[#6366F1]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-center">
                  <div className="rounded-3xl border border-[#222533] bg-[#13151D] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#818CF8]">Verification</p>
                        <h3 className="mt-4 text-2xl font-bold text-[#F8FAFC]">Document Verification Workflow</h3>
                      </div>
                    </div>
                    <div className="mt-8 space-y-5">
                      {[
                        { name: "Aisha Patel", document: "National ID" },
                        { name: "Tom Richards", document: "Degree Cert" },
                      ].map((item) => (
                        <div key={item.name} className="rounded-3xl border border-[#222533] bg-[#191C26] p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#818CF8]">
                              {item.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#F8FAFC]">{item.name}</p>
                              <p className="text-sm text-[#94A3B8]">{item.document}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button className="inline-flex items-center gap-2 rounded-full bg-[#6366F1]/15 px-3 py-2 text-xs font-semibold text-[#818CF8]">
                              <span>Verify</span>
                              <span>✓</span>
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-400">
                              <span>Reject</span>
                              <span>✗</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366F1]/10 text-[#6366F1]">
                      <FileCheck2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#F8FAFC]">Document Verification Workflow</h3>
                    <p className="text-base leading-7 text-[#94A3B8]">
                      Employees upload required documents directly through their dashboard. HR managers receive instant notifications and can verify or reject documents with a single click, keeping records organized and audit-ready.
                    </p>
                    <ul className="space-y-3">
                      <FeaturePoint>Supports PDF, JPG, PNG uploads</FeaturePoint>
                      <FeaturePoint>HR verification with one click</FeaturePoint>
                      <FeaturePoint>Rejection with reason tracking</FeaturePoint>
                      <FeaturePoint>Auto-notification on status change</FeaturePoint>
                    </ul>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div className="space-y-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10B981]/10 text-[#10B981]">
                      <Users className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#F8FAFC]">Multi-Role Workflow Automation</h3>
                    <p className="text-base leading-7 text-[#94A3B8]">
                      OnboardPro routes onboarding tasks automatically based on role. HR initiates, employees complete tasks, managers approve access, and IT provisions systems — all in the right sequence.
                    </p>
                    <ul className="space-y-3">
                      <FeaturePoint>HR → Manager → IT automatic routing</FeaturePoint>
                      <FeaturePoint>Configurable workflow order by admin</FeaturePoint>
                      <FeaturePoint>Department-specific workflows</FeaturePoint>
                      <FeaturePoint>Status tracking at every stage</FeaturePoint>
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-[#222533] bg-[#13151D] p-8">
                    <div className="flex items-center justify-between text-sm font-semibold text-[#94A3B8]">
                      <span>Workflow path</span>
                      <span>Sequence view</span>
                    </div>
                    <div className="mt-8 space-y-6">
                      {[
                        { label: "HR", color: "bg-[#6366F1]" },
                        { label: "Employee", color: "bg-[#10B981]" },
                        { label: "Manager", color: "bg-[#3B82F6] text-white" },
                        { label: "IT", color: "bg-[#EC4899]" },
                      ].map((item, index) => (
                        <div key={item.label} className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color} text-white`}>
                            {item.label.charAt(0)}
                          </div>
                          <div className="flex-1 rounded-3xl border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC]">
                            {item.label}
                          </div>
                          {index < 3 ? <span className="text-[#EC4899]">→</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="access-management" style={{ scrollMarginTop: "96px" }} className="border-b border-[#222533] bg-[#0D0E12] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="ACCESS MANAGEMENT"
              title="Secure, controlled access provisioning"
              description="Every access request goes through a defined approval chain before IT provisions any system credentials."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Role-Based Access Control",
                  description:
                    "Fine-grained RBAC ensures every user only accesses what their role permits. Define permissions at the role level, not the individual level.",
                  points: [
                    "5 built-in organizational roles",
                    "Permission boundaries per role",
                    "Cannot bypass approval chain",
                  ],
                  color: "#6366F1",
                },
                {
                  icon: KeyRound,
                  title: "Access Request Workflow",
                  description:
                    "Employees submit access requests with justification and priority. Requests route to department managers for approval before reaching IT for provisioning.",
                  points: [
                    "Email + Internal Tools + Dept Systems",
                    "Priority levels: Low / Medium / High / Urgent",
                    "Remarks and rejection reasons tracked",
                  ],
                  color: "#3B82F6",
                },
                {
                  icon: Lock,
                  title: "Credential Management",
                  description:
                    "Once IT provisions access, employees receive their credentials in a secured view within their dashboard. Passwords are masked by default.",
                  points: [
                    "Masked credential display",
                    "Show/hide password toggle",
                    "Access level recorded",
                  ],
                  color: "#F59E0B",
                },
                {
                  icon: UserX,
                  title: "Access Revocation",
                  description:
                    "When an employee exits, IT administrators can deactivate all system access in one workflow. Full deactivation record kept for compliance.",
                  points: [
                    "Bulk deactivation on exit",
                    "Reason and date recorded",
                    "Audit trail preserved",
                  ],
                  color: "#FB7185",
                },
                {
                  icon: History,
                  title: "Access History Tracking",
                  description:
                    "Every access grant, modification, and revocation is timestamped and stored. Full history available for any user at any time.",
                  points: [
                    "Full access timeline per employee",
                    "Approved by and provisioned by recorded",
                    "Exportable for audits",
                  ],
                  color: "#10B981",
                },
                {
                  icon: GitBranch,
                  title: "Approval Chain",
                  description:
                    "Access requests follow a defined chain: Employee requests → Manager approves → IT provisions. No step can be skipped.",
                  points: [
                    "Configurable by System Admin",
                    "Rejection at any stage stops the chain",
                    "All decisions logged with remarks",
                  ],
                  color: "#A855F7",
                },
              ].map((card) => (
                <article key={card.title} className="rounded-3xl border border-[#222533] bg-[#13151D] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#F8FAFC]">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#CBD5E1]">{card.description}</p>
                  <ul className="mt-6 space-y-3">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-[#CBD5E1]">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/15 text-[#818CF8]">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="compliance" style={{ scrollMarginTop: "96px" }} className="border-b border-[#222533] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.2fr_0.8fr] xl:gap-24">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="COMPLIANCE"
                title="Stay audit-ready at all times"
                description="OnboardPro maintains a complete record of every action taken on the platform so your organization is always prepared for compliance audits."
              />
              <div className="space-y-6 rounded-3xl border border-[#222533] bg-[#13151D] p-8">
                {[
                  {
                    icon: ClipboardList,
                    accent: "#6366F1",
                    title: "Complete Audit Logs",
                    description:
                      "Every action on OnboardPro is logged with timestamp, user, action type, and IP address. Nothing is ever deleted from the audit trail.",
                  },
                  {
                    icon: BarChart2,
                    accent: "#3B82F6",
                    title: "One-Click Compliance Reports",
                    description:
                      "Generate onboarding completion reports, access audit reports, and role distribution reports instantly. Export to CSV for external audits.",
                  },
                  {
                    icon: FileText,
                    accent: "#F59E0B",
                    title: "Policy Sign-off Tracking",
                    description:
                      "Track which employees have read and acknowledged each company policy. Timestamped acknowledgments serve as digital signatures.",
                  },
                  {
                    icon: FileCheck2,
                    accent: "#10B981",
                    title: "Document Verification History",
                    description:
                      "Every document submission, verification, and rejection is recorded with HR reviewer name and timestamp.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-5 rounded-3xl border border-[#222533] bg-[#191C26] p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${item.accent}15`, color: item.accent }}>
                      <item.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#F8FAFC]">{item.title}</h4>
                      <p className="mt-2 text-sm leading-7 text-[#94A3B8]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-[#222533] bg-[#13151D] p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#EC4899]">Compliance at a Glance</p>
              <div className="mt-8 space-y-6">
                {[
                  { value: "100%", label: "Audit trail coverage", hint: "Every action is logged" },
                  { value: "3", label: "Built-in report types", hint: "Ready to generate" },
                  { value: "5", label: "Roles with defined", hint: "access boundaries" },
                  { value: "0", label: "Manual steps to", hint: "maintain logs" },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-[#222533] bg-[#191C26] p-5">
                    <p className="text-3xl font-bold text-[#F8FAFC]">{item.value}</p>
                    <p className="mt-2 text-sm font-semibold text-[#94A3B8]">{item.label}</p>
                    <p className="mt-1 text-sm text-[#94A3B8]">{item.hint}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#10B981]/10 px-4 py-3 text-sm font-semibold text-[#10B981]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Audit Ready
              </div>
            </div>
          </div>
        </section>

        <section id="notifications" style={{ scrollMarginTop: "96px" }} className="bg-[#0D0E12] border-b border-[#222533] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="NOTIFICATIONS"
              title="Everyone stays informed, always"
              description="Real-time notifications keep every stakeholder updated without manual follow-ups."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-4">
              {[
                {
                  icon: Bell,
                  title: "Task Reminders",
                  description:
                    "Automatic reminders sent to employees when onboarding tasks are pending or overdue. Configurable reminder frequency.",
                  color: "#6366F1",
                },
                {
                  icon: KeyRound,
                  title: "Access Request Updates",
                  description:
                    "Employees are notified the moment their access request is approved, rejected, or provisioned by IT.",
                  color: "#3B82F6",
                },
                {
                  icon: FileText,
                  title: "Document Status Alerts",
                  description:
                    "Instant notification when HR verifies or rejects a submitted document, with rejection reason included.",
                  color: "#F59E0B",
                },
                {
                  icon: Activity,
                  title: "System Activity Alerts",
                  description:
                    "Administrators receive alerts for critical platform events including user creation, role changes, and system deactivations.",
                  color: "#FB7185",
                },
              ].map((card) => (
                <article key={card.title} className="rounded-3xl border border-[#222533] bg-[#13151D] p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl`} style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#F8FAFC]">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#94A3B8]">{card.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 rounded-3xl border border-[#222533] bg-[#13151D] p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#EC4899]">Notification Center Preview</p>
                  <h3 className="mt-4 text-2xl font-bold text-[#F8FAFC]">Live updates for every role</h3>
                </div>
                <span className="inline-flex rounded-full bg-[#6366F1]/10 px-3 py-1 text-sm font-semibold text-[#818CF8]">
                  Example feed
                </span>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  { dot: "bg-[#10B981]", title: "Your document has been verified", subtitle: "now" },
                  { dot: "bg-[#F59E0B]", title: "Access request pending approval", subtitle: "2m ago" },
                  { dot: "bg-[#6366F1]", title: "Onboarding task reminder", subtitle: "1h ago" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-3xl border border-[#222533] bg-[#191C26] px-5 py-4">
                    <span className={`mt-1 inline-flex h-3 w-3 rounded-full ${item.dot}`} />
                    <div>
                      <p className="font-semibold text-[#F8FAFC]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#94A3B8]">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="admin" style={{ scrollMarginTop: "96px" }} className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="ADMIN"
              title="Full platform control for admins"
              description="System Administrators have complete visibility and control over every aspect of OnboardPro."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "User & Role Management",
                  description:
                    "Create, edit, activate, and deactivate user accounts. Assign roles and departments. Full user lifecycle management from a single interface.",
                  color: "#6366F1",
                },
                {
                  icon: GitBranch,
                  title: "Workflow Configuration",
                  description:
                    "Configure the exact sequence of your onboarding workflow. Add, remove, reorder, and assign steps to specific roles. Fully customizable per organization.",
                  color: "#3B82F6",
                },
                {
                  icon: LockKeyhole,
                  title: "Access Category Management",
                  description:
                    "Define system access categories with access levels (Public / Internal / Confidential / Restricted) and assign which roles can request each category.",
                  color: "#F59E0B",
                },
                {
                  icon: TrendingUp,
                  title: "Platform Statistics",
                  description:
                    "Real-time dashboard showing active employees, pending onboarding tasks, access approval turnaround time, and overall compliance score.",
                  color: "#FB7185",
                },
                {
                  icon: BarChart2,
                  title: "Compliance Report Generation",
                  description:
                    "Generate three types of compliance reports: Onboarding Completion, Access Audit, and Role Distribution. Export all reports to CSV.",
                  color: "#10B981",
                },
                {
                  icon: Shield,
                  title: "Danger Zone Controls",
                  description:
                    "System Admins can reset platform data, configure system-wide settings, and manage audit log retention policies from the Settings panel.",
                  color: "#A855F7",
                },
              ].map((card) => (
                <article key={card.title} className="rounded-3xl border border-[#222533] bg-[#13151D] p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl`} style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#F8FAFC]">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#CBD5E1]">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0D0E12] border-y border-[#222533] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#EC4899]">Built for every role in your org</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#F8FAFC] sm:text-4xl">
                Built for every role in your org
              </h2>
              <p className="mt-4 text-base leading-7 text-[#94A3B8]">
                Each user gets a tailored dashboard — only what they need.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  title: "Employee",
                  color: "#6366F1",
                  description:
                    "Complete onboarding checklist, upload documents, request system access, and track request status.",
                },
                {
                  title: "HR Manager",
                  color: "#10B981",
                  description:
                    "Initiate onboarding, verify documents, track all active onboardings, and generate completion reports.",
                },
                {
                  title: "Dept. Manager",
                  color: "#F59E0B",
                  description:
                    "Review and approve access requests from team members. Add remarks. Monitor department onboarding status.",
                },
                {
                  title: "IT Administrator",
                  color: "#3B82F6",
                  description:
                    "Provision approved access requests, manage system catalog, handle employee exit deactivations.",
                },
                {
                  title: "System Admin",
                  color: "#FB7185",
                  description:
                    "Full platform control: users, roles, workflow, access categories, reports, and audit logs.",
                },
              ].map((role) => (
                <article key={role.title} className="rounded-3xl border border-[#222533] bg-[#13151D] p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${role.color}20`, color: role.color }}>
                      ●
                    </span>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-[#F8FAFC]">{role.title}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[#CBD5E1]">{role.description}</p>
                  <Link
                    to="/login"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: role.color }}
                  >
                    View Dashboard →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl border border-[#222533] bg-[#13151D] p-14 text-center mt-20">
            <h2 className="text-4xl font-bold text-[#F8FAFC]">Ready to modernize your onboarding?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#94A3B8]">
              Join organizations using OnboardPro to onboard faster and manage access securely.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="rounded-full bg-[#6366F1] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
              >
                Get started free
              </button>
              <Link
                to="/docs"
                className="rounded-full border border-[#222533] px-8 py-3 text-sm font-semibold text-[#F8FAFC] transition hover:border-[#6366F1] hover:text-[#6366F1]"
              >
                View docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#222533] bg-[#08090C] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/">
              <Logo />
            </Link>
            <p className="mt-3 text-sm text-[#94A3B8]">Modern onboarding workflows for fast-moving teams.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => handleFooterNav(e, link.path)}
                className="group relative text-sm font-semibold text-[#94A3B8] transition-all duration-300 ease-in-out hover:text-[#6366F1] active:text-[#4F46E5] active:scale-95 focus:outline-none focus:text-[#6366F1] pb-1"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#6366F1] transition-all duration-300 ease-in-out group-hover:w-full group-active:bg-[#4F46E5]" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
