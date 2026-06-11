import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  FileCheck2,
  FileText,
  KeyRound,
  LockKeyhole,
  Mail,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UserCog,
  UserRound,
  UserRoundCog,
  Users,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const navItems = [
  { label: "Docs", to: "/docs" },
  { label: "Features", to: "/features" },
  { label: "Support", to: "/support" },
];

const features = [
  {
    title: "Onboarding Checklists",
    slug: "onboarding-checklists",
    description: "Launch role-specific task lists with dependencies, progress, and owner visibility.",
    icon: CheckSquare,
    gradient: "from-[#6366F1] to-[#818CF8]",
  },
  {
    title: "Document Verification",
    slug: "document-verification",
    description: "Collect, validate, and approve employee documents with secure audit trails.",
    icon: FileCheck2,
    gradient: "from-[#6366F1] to-[#3B82F6]",
  },
  {
    title: "Access Provisioning",
    slug: "access-provisioning",
    description: "Route app, device, and system requests from manager approval to IT fulfillment.",
    icon: KeyRound,
    gradient: "from-[#8B5CF6] to-[#6366F1]",
  },
  {
    title: "Smart Notifications",
    slug: "smart-notifications",
    description: "Keep HR, employees, managers, and IT aligned with contextual nudges.",
    icon: Bell,
    gradient: "from-[#EC4899] to-[#F43F5E]",
  },
  {
    title: "RBAC Security",
    slug: "rbac-security",
    description: "Protect sensitive workflows with role-based permissions and least-privilege access.",
    icon: LockKeyhole,
    gradient: "from-[#6366F1] to-[#EC4899]",
  },
  {
    title: "Compliance Reports",
    slug: "compliance-reports",
    description: "Turn onboarding activity, approvals, and access events into export-ready reports.",
    icon: FileText,
    gradient: "from-[#3B82F6] to-[#6366F1]",
  },
];

const stats = [
  ["10K+", "Employees Onboarded"],
  ["50K+", "Requests Processed"],
  ["120+", "Teams Supported"],
  ["99.9%", "Secure Platform"],
];

const workflowSteps = [
  { title: "HR", text: "Initiates onboarding", icon: ClipboardCheck, color: "text-[#818CF8]", bg: "bg-indigo-500/10", ring: "ring-indigo-500/20" },
  { title: "Employee", text: "Completes tasks", icon: UserCheck, color: "text-[#60A5FA]", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
  { title: "Manager", text: "Reviews approvals", icon: ShieldCheck, color: "text-[#F472B6]", bg: "bg-pink-500/10", ring: "ring-pink-500/20" },
  { title: "IT Admin", text: "Provisions access", icon: KeyRound, color: "text-[#A78BFA]", bg: "bg-purple-500/10", ring: "ring-purple-500/20" },
];

const roles = [
  {
    title: "Employee",
    description: "Guided onboarding tasks, documents, training, and request tracking.",
    icon: UserRound,
    accent: "from-[#6366F1] to-[#818CF8]",
  },
  {
    title: "HR Manager",
    description: "Create new hire journeys, verify documents, and monitor completion.",
    icon: Users,
    accent: "from-[#6366F1] to-[#3B82F6]",
  },
  {
    title: "Department Manager",
    description: "Approve role-specific needs and keep team readiness visible.",
    icon: UserRoundCog,
    accent: "from-[#EC4899] to-[#F43F5E]",
  },
  {
    title: "IT Admin",
    description: "Provision systems, manage catalogs, and close access loops faster.",
    icon: UserCog,
    accent: "from-[#8B5CF6] to-[#6366F1]",
  },
  {
    title: "System Admin",
    description: "Control users, roles, workflows, categories, reports, and audit trails.",
    icon: ShieldCheck,
    accent: "from-[#EC4899] to-[#6366F1]",
  },
];

const testimonials = [
  {
    name: "Maya Chen",
    role: "VP People Ops",
    company: "Northstar Cloud",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    quote: "OnboardPro gave HR, IT, and managers one operating rhythm. New hire readiness is finally visible before day one.",
  },
  {
    name: "Jordan Fox",
    role: "Director of IT",
    company: "Vertex Labs",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    quote: "Access requests stopped getting buried in chat. The approval trail and provisioning queue are clean, fast, and audit-ready.",
  },
  {
    name: "Priya Nair",
    role: "Operations Lead",
    company: "Brightline Finance",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    quote: "The role dashboards feel purpose-built. Everyone knows what is pending, what is blocked, and who owns the next step.",
  },
];

const footerColumns = [
  { title: "Product", links: [{ name: "Features", path: "/features" }, { name: "Workflow", path: "#workflow" }, { name: "Roles", path: "#roles" }, { name: "Security", path: "#" }] },
  { title: "Resources", links: [{ name: "Docs", path: "/docs" }, { name: "Support", path: "/support" }, { name: "API", path: "#" }, { name: "Guides", path: "#" }] },
  { title: "Company", links: [{ name: "About", path: "#" }, { name: "Customers", path: "#" }, { name: "Careers", path: "#" }, { name: "Contact", path: "#" }] },
  { title: "Social Links", links: [{ name: "LinkedIn", path: "#" }, { name: "X", path: "#" }, { name: "GitHub", path: "#" }, { name: "YouTube", path: "#" }] },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="OnboardPro home">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366F1] text-white shadow-xl shadow-[#6366F1]/20">
        <Users className="h-6 w-6" aria-hidden="true" />
      </div>
      <span className="text-xl font-black tracking-tight text-white">
        Onboard<span className="text-[#6366F1]">Pro</span>
      </span>
    </Link>
  );
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto max-w-3xl text-center"
    >
      <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#818CF8]">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
        {text}
      </p>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="public-theme-page relative min-h-screen overflow-hidden bg-[#0A0F1E] text-slate-200">
      {/* Premium Dark Background Layer */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        {/* Soft Radial Ambient Glows - Subtle Purple-Blue */}
        <div className="absolute -left-1/4 -top-1/4 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute -right-1/4 -top-1/4 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.05)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute left-1/2 top-[10%] h-[60vw] w-[60vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.07)_0%,transparent_70%)] blur-[120px]" />
        
        {/* Abstract Dark Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.2] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#0A0F1E]/80 shadow-sm shadow-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo />
          </div>
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`group relative text-sm font-bold transition-colors duration-300 ${
                    isActive ? "text-[#818CF8]" : "text-slate-400 hover:text-[#818CF8]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-0 h-0.5 rounded-full bg-[#818CF8] transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-bold text-slate-300 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[#6366F1] hover:text-white sm:inline-flex"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/20 transition hover:-translate-y-0.5 hover:bg-[#4F46E5] hover:shadow-[#6366F1]/40"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="relative px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            {/* Concentric rings for dark mode hero */}
            <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-500/10 bg-[radial-gradient(circle,rgba(99,102,241,0.03)_0%,transparent_70%)]" />
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/10 bg-[radial-gradient(circle,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_0.95fr]">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-300 shadow-sm backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
                Smart Employee Onboarding Platform
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="mt-7 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                Onboarding that feels{" "}
                <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F472B6] bg-clip-text text-transparent">
                  magically coordinated.
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
                OnboardPro unifies HR checklists, document verification, manager approvals, IT provisioning,
                RBAC, and compliance reporting in one polished operating system for employee readiness.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-8 py-4 text-sm font-black text-white shadow-lg shadow-[#6366F1]/20 transition hover:-translate-y-1 hover:bg-[#4F46E5] hover:shadow-[#6366F1]/40"
                >
                  Start onboarding smarter
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("workflow")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-sm font-black text-slate-200 shadow-md backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#6366F1] hover:text-white hover:bg-slate-800"
                >
                  <Play className="h-4 w-4 fill-slate-400 text-slate-400 transition group-hover:fill-[#818CF8] group-hover:text-[#818CF8]" aria-hidden="true" />
                  Watch workflow
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                className="absolute -left-8 top-16 z-10 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Approvals</p>
                    <p className="text-sm font-black text-white">87% cleared</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-4 bottom-16 z-10 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl"
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <TrendingUp className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Readiness</p>
                    <p className="text-sm font-black text-white">+32% faster</p>
                  </div>
                </div>
              </motion.div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/50 p-3 shadow-2xl backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-700 bg-[#0F172A] text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#818CF8]">Live dashboard</p>
                      <p className="mt-1 text-lg font-black text-white">Onboarding Command Center</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-slate-700" />
                      <span className="h-3 w-3 rounded-full bg-slate-700" />
                      <span className="h-3 w-3 rounded-full bg-slate-700" />
                    </div>
                  </div>
                  <div className="grid gap-4 p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        ["Docs", "94%", "from-[#6366F1] to-[#3B82F6]"],
                        ["Access", "18", "from-[#8B5CF6] to-[#6366F1]"],
                        ["Pending", "07", "from-[#EC4899] to-[#F43F5E]"],
                      ].map(([label, value, gradient]) => (
                        <div key={label} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
                          <p className="mt-3 text-3xl font-black text-white">{value}</p>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                            <div className={`h-full w-3/4 rounded-full bg-gradient-to-r ${gradient}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-800/40 p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-white">Approval Queue</p>
                        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/20">
                          3 pending
                        </span>
                      </div>
                      <div className="mt-5 space-y-3">
                        {[
                          ["Maya Chen", "GitHub Admin", "Manager review"],
                          ["Noah Patel", "Finance Portal", "RBAC check"],
                          ["Sara Lopez", "Laptop setup", "IT provisioning"],
                        ].map(([name, request, status]) => (
                          <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 text-sm font-black border border-indigo-500/20">
                                {name.split(" ").map((part) => part[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-200">{name}</p>
                                <p className="text-xs text-slate-500">{request}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#818CF8]">{status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4"
          >
            {stats.map(([value, label]) => (
              <motion.div
                key={label}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center shadow-lg backdrop-blur-sm"
              >
                <p className="bg-gradient-to-r from-[#818CF8] to-[#F472B6] bg-clip-text text-4xl font-black text-transparent">
                  {value}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-400">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-7xl relative z-10">
            <SectionHeader
              eyebrow="Platform Features"
              title="Every handoff, approval, and access request in one place"
              text="A complete employee onboarding layer for teams that need speed, security, and accountability without stitching together spreadsheets and chat threads."
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    variants={fadeUp}
                    whileHover={{ y: -10, scale: 1.015 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-7 shadow-lg backdrop-blur-sm transition hover:bg-slate-800/80 hover:border-slate-700"
                  >
                    <div className={`absolute inset-x-8 -top-px h-px bg-gradient-to-r ${feature.gradient} opacity-0 transition group-hover:opacity-100`} />
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg shadow-indigo-900/50 border border-white/10`} >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-xl font-black text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                    <Link to={`/features/${feature.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#818CF8] transition group-hover:gap-3">
                      Learn more <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section id="workflow" className="relative overflow-hidden border-y border-slate-800 bg-slate-900/30 px-4 py-24 sm:px-6 lg:px-8">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-indigo-900/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-900/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.05),transparent_40%),linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:auto,52px_52px,52px_52px]" />
          
          <div className="relative mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Workflow"
              title="HR to employee to manager to IT, all moving as one"
              text="A glowing workflow engine keeps every role in sequence, every approval visible, and every system access request tracked."
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative mt-16 grid gap-6 lg:grid-cols-4"
            >
              <div className="absolute left-[10%] right-[10%] top-16 hidden h-px bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-pink-500/20 shadow-sm lg:block" />
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.article
                    key={step.title}
                    variants={fadeUp}
                    whileHover={{ y: -12, scale: 1.025 }}
                    className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center shadow-lg backdrop-blur-sm"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3.5 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
                      className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl ${step.bg} ${step.color} ring-8 ${step.ring} shadow-lg`}
                    >
                      <Icon className="h-9 w-9" aria-hidden="true" />
                    </motion.div>
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Step 0{index + 1}</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section id="roles" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Role-Based Workspaces"
              title="Dashboards designed around real responsibilities"
              text="Each stakeholder gets a focused workspace with the approvals, tasks, reports, and controls they need."
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5"
            >
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <motion.article
                    key={role.title}
                    variants={fadeUp}
                    whileHover={{ y: -10, rotate: -1 }}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm transition hover:bg-slate-800/80 hover:border-slate-700"
                  >
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.08 }}
                      className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${role.accent} text-white shadow-lg border border-white/10`}
                    >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </motion.div>
                    <h3 className="mt-6 text-lg font-black text-white">{role.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{role.description}</p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-7xl relative z-10">
            <SectionHeader
              eyebrow="Customer Stories"
              title="Trusted by people, IT, and operations teams"
              text="Teams use OnboardPro to bring new hires online faster while keeping access, documentation, and compliance under control."
            />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-12 grid gap-5 lg:grid-cols-3"
            >
              {testimonials.map((item) => (
                <motion.article
                  key={item.name}
                  variants={fadeUp}
                  whileHover={{ y: -8 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex gap-1 text-orange-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-orange-400" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mt-5 text-base leading-8 text-slate-300">"{item.quote}"</p>
                  <div className="mt-7 flex items-center gap-4">
                    <img src={item.image} alt="" className="h-12 w-12 rounded-2xl object-cover shadow-sm border border-slate-700" />
                    <div>
                      <p className="font-black text-white">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.role}, {item.company}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="theme-on-brand relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#EC4899] px-6 py-16 text-center text-white shadow-[0_30px_100px_rgba(139,92,246,0.3)] sm:px-10"
          >
            <div className="absolute left-10 top-8 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 right-16 h-48 w-48 rounded-full bg-orange-400/30 blur-[100px]" />
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur shadow-xl border border-white/20"
            >
              <Rocket className="h-10 w-10" aria-hidden="true" />
            </motion.div>
            <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl text-white drop-shadow-sm">
              Ready to transform your onboarding?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
              Give every new hire a coordinated launch, every manager a clear approval path, and every IT team a clean provisioning queue.
            </p>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-[#6366F1] shadow-xl transition hover:-translate-y-1 hover:shadow-2xl hover:scale-105"
            >
              Launch OnboardPro
              <Zap className="h-4 w-4 fill-[#6366F1]" aria-hidden="true" />
            </button>
          </motion.div>
        </section>
      </main>

      <footer className="relative border-t border-slate-800 bg-[#0A0F1E] px-4 py-14 text-slate-200 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.03)_0%,transparent_80%)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_1.6fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Modern employee onboarding and access management for teams that care about speed, security, and polish.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-black text-white">{column.title}</h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => {
                    const isLink = link.path.startsWith("/");
                    return isLink ? (
                      <Link key={link.name} to={link.path} className="block text-sm text-slate-400 transition hover:text-[#818CF8]">
                        {link.name}
                      </Link>
                    ) : (
                      <a key={link.name} href={link.path} className="block text-sm text-slate-400 transition hover:text-[#818CF8]">
                        {link.name}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Newsletter</h3>
            <p className="mt-4 text-sm leading-6 text-slate-400">Product notes, workflow ideas, and onboarding ops tips.</p>
            <div className="mt-5 flex overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50 p-1 backdrop-blur-sm">
              <input
                aria-label="Email address"
                placeholder="you@company.com"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6366F1] text-white shadow-sm hover:bg-[#4F46E5] transition">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 OnboardPro. All rights reserved.</p>
          <p>Security-first onboarding for modern teams.</p>
        </div>
      </footer>
    </div>
  );
}
