import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CheckCircle2,
  CheckSquare,
  Database,
  FileCheck2,
  FileText,
  Globe,
  Lock,
  Menu,
  Search,
  Server,
  Shield,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const featureData = {
  "document-verification": {
    title: "Document Verification",
    subtitle: "Collect, validate, and approve employee documents with secure audit trails and automated workflows.",
    heroGradient: "from-[#38C7BE] to-[#6366F1]",
    glowColor: "bg-[#38C7BE]",
    workflow: [
      { step: "1", title: "Employee Uploads Documents", desc: "New hires securely upload IDs and certificates via the portal.", icon: UploadCloud },
      { step: "2", title: "HR Receives Request", desc: "Automated alerts immediately notify the HR team.", icon: Bell },
      { step: "3", title: "Documents Reviewed", desc: "HR verifies authenticity, details, and compliance.", icon: Search },
      { step: "4", title: "Status Updated", desc: "Documents are marked as verified or rejected with notes.", icon: FileCheck2 },
      { step: "5", title: "Employee Notified", desc: "Real-time status updates sync across dashboards.", icon: Zap },
    ],
    benefits: [
      { title: "Secure Uploads", desc: "End-to-end encryption ensures sensitive personal data is protected.", icon: Lock },
      { title: "Faster Onboarding", desc: "Automated routing cuts manual approval times by over 50%.", icon: TrendingUp },
      { title: "Audit Tracking", desc: "Maintain a complete history of who reviewed documents and when.", icon: Database },
      { title: "Real-time Updates", desc: "Instant status synchronization across employee and HR portals.", icon: Globe },
    ],
    stats: [
      { value: "95%", label: "Faster Verification Process" },
      { value: "10,000+", label: "Documents Securely Processed" },
      { value: "24/7", label: "Real-Time Monitoring & Alerts" },
    ],
    security: [
      { title: "Encrypted Uploads", desc: "AES-256 encryption at rest and in transit." },
      { title: "Role-Based Access", desc: "Only authorized HR personnel can view sensitive IDs." },
      { title: "Compliance Tracking", desc: "Automated retention policies and GDPR compliance." },
      { title: "Audit Logs", desc: "Immutable record of all document interactions." },
    ],
  },
  "onboarding-checklists": {
    title: "Onboarding Checklists",
    subtitle: "Launch role-specific task lists with dependencies, progress tracking, and owner visibility.",
    heroGradient: "from-[#6366F1] to-[#818CF8]",
    glowColor: "bg-[#6366F1]",
    workflow: [
      { step: "1", title: "Role Assigned", desc: "HR assigns a specific role to the new hire.", icon: Users },
      { step: "2", title: "Template Cloned", desc: "System auto-generates the correct checklist template.", icon: FileText },
      { step: "3", title: "Tasks Distributed", desc: "IT, HR, and Managers get their specific action items.", icon: CheckSquare },
      { step: "4", title: "Progress Tracked", desc: "Real-time dashboard updates as tasks are checked off.", icon: TrendingUp },
      { step: "5", title: "Completion", desc: "Final sign-off triggers the official onboarding completion.", icon: CheckCircle2 },
    ],
    benefits: [
      { title: "Standardized Processes", desc: "Ensure every employee gets a consistent onboarding experience.", icon: CheckSquare },
      { title: "Visibility & Accountability", desc: "Managers see exactly who is blocking the onboarding flow.", icon: Search },
      { title: "Automated Handoffs", desc: "When IT finishes setup, HR is instantly notified.", icon: Zap },
      { title: "Custom Templates", desc: "Create unique checklists for engineering, sales, or marketing.", icon: FileText },
    ],
    stats: [
      { value: "3x", label: "Faster Time-to-Productivity" },
      { value: "100%", label: "Task Visibility" },
      { value: "0", label: "Missed Onboarding Steps" },
    ],
    security: [
      { title: "Template Access Control", desc: "Only admins can edit standard company templates." },
      { title: "Task Level Privacy", desc: "Sensitive tasks are only visible to assigned owners." },
      { title: "Progress Archiving", desc: "Completed checklists are permanently archived for HR records." },
      { title: "Audit Trails", desc: "Track exactly when a task was marked complete and by whom." },
    ],
  },
  "access-provisioning": {
    title: "Access Provisioning",
    subtitle: "Route app, device, and system requests from manager approval to IT fulfillment.",
    heroGradient: "from-[#8B5CF6] to-[#6366F1]",
    glowColor: "bg-[#8B5CF6]",
    workflow: [
      { step: "1", title: "Request Initiated", desc: "Manager selects systems needed for the role.", icon: Users },
      { step: "2", title: "Automated Routing", desc: "Request is routed based on department and role.", icon: Server },
      { step: "3", title: "IT Fulfillment", desc: "IT receives details and creates the accounts.", icon: CheckSquare },
      { step: "4", title: "Credentials Securely Shared", desc: "Employee accesses credentials via a secure portal.", icon: Lock },
      { step: "5", title: "Audit Logged", desc: "All provisioning steps are tracked for compliance.", icon: Database },
    ],
    benefits: [
      { title: "Zero Day-One Delays", desc: "Employees have all apps ready on their first day.", icon: Zap },
      { title: "Role-Based Defaults", desc: "Auto-suggest the right tools for engineering, sales, etc.", icon: Users },
      { title: "Hardware Requests", desc: "Easily track laptop and device provisioning.", icon: Server },
      { title: "Automated Revocation", desc: "Offboarding revokes access across all systems instantly.", icon: Lock },
    ],
    stats: [
      { value: "0", label: "Day-One Blockers" },
      { value: "40+", label: "Integrated Systems" },
      { value: "100%", label: "Access Accountability" },
    ],
    security: [
      { title: "Encrypted Credentials", desc: "Temporary passwords are encrypted and auto-expire." },
      { title: "Manager Approvals", desc: "Prevent unauthorized access requests." },
      { title: "Access Reviews", desc: "Easily conduct quarterly access audits." },
      { title: "Least Privilege", desc: "Enforce strict RBAC across all requested tools." },
    ],
  },
  "smart-notifications": {
    title: "Smart Notifications",
    subtitle: "Keep HR, employees, managers, and IT aligned with contextual nudges.",
    heroGradient: "from-[#EC4899] to-[#F43F5E]",
    glowColor: "bg-[#EC4899]",
    workflow: [
      { step: "1", title: "Event Triggered", desc: "A task is completed, delayed, or requires action.", icon: Zap },
      { step: "2", title: "Contextual Nudge", desc: "The system formats a personalized, actionable message.", icon: FileText },
      { step: "3", title: "Multi-Channel Delivery", desc: "Sent via email, Slack, and in-app dashboard.", icon: Globe },
      { step: "4", title: "One-Click Action", desc: "User can approve or review directly from the alert.", icon: CheckCircle2 },
      { step: "5", title: "Status Synced", desc: "Notification clears automatically once resolved.", icon: Bell },
    ],
    benefits: [
      { title: "No More Chasing", desc: "Stop manually emailing managers to finish their tasks.", icon: TrendingUp },
      { title: "Actionable Alerts", desc: "Every notification includes exactly what to do next.", icon: CheckSquare },
      { title: "Custom Routing", desc: "Send IT alerts to Slack and HR alerts to Email.", icon: Server },
      { title: "Quiet Hours", desc: "Respect time zones and schedule non-urgent pings.", icon: Globe },
    ],
    stats: [
      { value: "70%", label: "Fewer Follow-up Emails" },
      { value: "Instant", label: "Real-time Syncing" },
      { value: "10k+", label: "Reminders Automated" },
    ],
    security: [
      { title: "No Sensitive Data in Email", desc: "Links require authentication to view PII." },
      { title: "Delivery Receipts", desc: "Track exactly when a notification was opened." },
      { title: "Role-Based Alerts", desc: "Users only receive alerts relevant to their permissions." },
      { title: "Configurable Webhooks", desc: "Securely send event data to your internal systems." },
    ],
  },
  "rbac-security": {
    title: "RBAC Security",
    subtitle: "Protect sensitive workflows with role-based permissions and least-privilege access.",
    heroGradient: "from-[#6366F1] to-[#EC4899]",
    glowColor: "bg-[#6366F1]",
    workflow: [
      { step: "1", title: "Define Roles", desc: "Create granular roles for HR, IT, Managers, and Employees.", icon: Users },
      { step: "2", title: "Map Permissions", desc: "Assign specific read/write access to data fields.", icon: FileCheck2 },
      { step: "3", title: "User Assigned", desc: "Employee inherits the permissions of their role group.", icon: Shield },
      { step: "4", title: "Dynamic UI", desc: "Dashboards adapt to hide unauthorized tabs and actions.", icon: Search },
      { step: "5", title: "Continuous Audits", desc: "Monitor who accessed what data and when.", icon: Database },
    ],
    benefits: [
      { title: "Least Privilege", desc: "Users only see what they need to do their jobs.", icon: Shield },
      { title: "Scalable Access", desc: "Update a role once and it applies to thousands of users.", icon: TrendingUp },
      { title: "Protect PII", desc: "Hide salary and ID documents from IT and direct managers.", icon: Lock },
      { title: "Custom Roles", desc: "Create unique profiles like 'Finance Auditor'.", icon: Server },
    ],
    stats: [
      { value: "100%", label: "Data Segregation" },
      { value: "0", label: "Unauthorized Breaches" },
      { value: "SOC2", label: "Compliance Ready" },
    ],
    security: [
      { title: "Strict Boundaries", desc: "Prevent cross-department data exposure." },
      { title: "Session Management", desc: "Auto-logout and secure token handling." },
      { title: "API Protection", desc: "Backend endpoints verify roles on every single request." },
      { title: "Immutable Logs", desc: "Role changes are permanently logged for HR audits." },
    ],
  },
  "compliance-reports": {
    title: "Compliance Reports",
    subtitle: "Turn onboarding activity, approvals, and access events into export-ready reports.",
    heroGradient: "from-[#3B82F6] to-[#6366F1]",
    glowColor: "bg-[#3B82F6]",
    workflow: [
      { step: "1", title: "Data Aggregation", desc: "System continuously logs all workflow events.", icon: Database },
      { step: "2", title: "Filter & Search", desc: "Query data by date, department, or specific employee.", icon: Search },
      { step: "3", title: "Generate Report", desc: "Create a PDF or CSV of the audit trail in one click.", icon: FileText },
      { step: "4", title: "Compliance Review", desc: "Share reports with internal auditors or regulators.", icon: ShieldCheck },
      { step: "5", title: "Automated Archiving", desc: "Records are securely stored for required retention periods.", icon: Server },
    ],
    benefits: [
      { title: "Audit Ready", desc: "Survive SOC2 and ISO audits with instant proof of process.", icon: Shield },
      { title: "Custom Exports", desc: "Download the exact data you need in CSV or PDF.", icon: FileCheck2 },
      { title: "Visual Analytics", desc: "Spot bottlenecks in your onboarding pipeline.", icon: TrendingUp },
      { title: "Scheduled Reports", desc: "Get weekly summaries sent straight to your inbox.", icon: Bell },
    ],
    stats: [
      { value: "1-Click", label: "Report Generation" },
      { value: "7 Yrs", label: "Data Retention" },
      { value: "100%", label: "Audit Accuracy" },
    ],
    security: [
      { title: "Tamper-Proof Logs", desc: "Event histories cannot be altered or deleted." },
      { title: "Secure Exports", desc: "Downloaded reports are tracked and watermarked." },
      { title: "Data Redaction", desc: "Automatically hide SSNs and IDs in high-level reports." },
      { title: "Access Controls", desc: "Only Admins and Auditors can generate compliance reports." },
    ],
  },
};

const genericData = {
  title: "Platform Feature",
  subtitle: "Explore how OnboardPro streamlines your employee lifecycle.",
  heroGradient: "from-[#8B5CF6] to-[#6366F1]",
  glowColor: "bg-[#8B5CF6]",
  workflow: [
    { step: "1", title: "Action Initiated", desc: "A request or task is triggered in the system.", icon: Zap },
    { step: "2", title: "Automated Routing", desc: "The system identifies the correct stakeholders.", icon: Server },
    { step: "3", title: "Review & Action", desc: "Managers or HR process the workflow item.", icon: Search },
    { step: "4", title: "Completion", desc: "The cycle is closed and logged.", icon: CheckCircle2 },
  ],
  benefits: [
    { title: "Efficiency", desc: "Automate manual tasks and save hours every week.", icon: TrendingUp },
    { title: "Security", desc: "Enterprise-grade protection for all your workflows.", icon: Shield },
    { title: "Visibility", desc: "Clear dashboards keep everyone on the same page.", icon: Search },
    { title: "Reliability", desc: "Built on modern infrastructure for 99.9% uptime.", icon: Server },
  ],
  stats: [
    { value: "10x", label: "ROI for HR Teams" },
    { value: "24/7", label: "System Availability" },
    { value: "100%", label: "Audit Compliance" },
  ],
  security: [
    { title: "Enterprise Security", desc: "Best-in-class security protocols across the platform." },
    { title: "Data Privacy", desc: "Strict adherence to global data privacy regulations." },
    { title: "Continuous Monitoring", desc: "Real-time threat detection and mitigation." },
    { title: "Access Controls", desc: "Granular RBAC ensures least-privilege access." },
  ],
};

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A0F1E]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-lg" : "bg-transparent py-5"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 text-white no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-900/50">
              <span className="font-bold">OP</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Onboard<span className="text-[#818CF8]">Pro</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-sm font-semibold text-slate-300 hover:text-white transition">Features</Link>
            <Link to="/docs" className="text-sm font-semibold text-slate-300 hover:text-white transition">Docs</Link>
            <Link to="/support" className="text-sm font-semibold text-slate-300 hover:text-white transition">Support</Link>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition">Sign in</Link>
          <Link to="/signup" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A0F1E] transition hover:bg-slate-200 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Get started
          </Link>
        </div>
        <button type="button" className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0A0F1E]/95 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col gap-4 shadow-2xl">
          <Link to="/features" className="text-lg font-semibold text-slate-300 p-2">Features</Link>
          <Link to="/docs" className="text-lg font-semibold text-slate-300 p-2">Docs</Link>
          <Link to="/support" className="text-lg font-semibold text-slate-300 p-2">Support</Link>
          <div className="h-px bg-white/10 my-2" />
          <Link to="/login" className="text-lg font-semibold text-slate-300 p-2">Sign in</Link>
          <Link to="/signup" className="mt-2 rounded-xl bg-white px-5 py-3 text-center text-lg font-bold text-[#0A0F1E]">
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}

export default function FeatureDetail() {
  const { featureId } = useParams();
  const data = featureData[featureId] || genericData;

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [featureId]);

  return (
    <div className="public-theme-page min-h-screen bg-[#0A0F1E] text-slate-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      <NavBar />

      <main className="relative pt-32 pb-20">
        {/* Animated Background Gradients */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y }}
            className={`absolute -top-[20%] left-[20%] h-[600px] w-[600px] rounded-full ${data.glowColor} opacity-20 mix-blend-screen blur-[120px]`}
          />
          <motion.div
            style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]) }}
            className="absolute top-[40%] right-[10%] h-[500px] w-[500px] rounded-full bg-[#8B5CF6] opacity-10 mix-blend-screen blur-[120px]"
          />
        </div>

        {/* 1. Premium Hero Section */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mt-10 lg:mt-20">
          <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-3xl">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              Enterprise Features
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className={`bg-gradient-to-r ${data.heroGradient} bg-clip-text text-transparent`}>
                {data.title}
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-8 text-lg leading-8 text-slate-400 sm:text-xl">
              {data.subtitle}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className={`rounded-full bg-gradient-to-r ${data.heroGradient} px-8 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]`}>
                Start for free
              </Link>
              <button className="rounded-full border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-slate-800 hover:border-slate-600">
                Book a Demo
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. Large Dashboard Preview Images (Mock UI) */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative rounded-3xl border border-slate-800 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            {/* Mock Window Controls */}
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            {/* Mock Dashboard Layout */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-bold text-white">Pending Approvals</h3>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse" />
                    <div className="h-8 w-24 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">Filter</div>
                  </div>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-800/30 p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-700 animate-pulse" />
                      <div>
                        <div className="h-4 w-32 rounded bg-slate-700 mb-2" />
                        <div className="h-3 w-20 rounded bg-slate-800" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">Approve</div>
                      <div className="h-8 w-20 rounded-md bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">Review</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/20 p-5 hidden lg:block">
                <h4 className="text-sm font-bold text-slate-300 mb-4">Activity Log</h4>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      <div>
                        <div className="h-3 w-40 rounded bg-slate-700 mb-1" />
                        <div className="h-2 w-16 rounded bg-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. Detailed Workflow Process Section */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white sm:text-4xl">How it works</h2>
            <p className="mt-4 text-slate-400">A seamless, automated flow from start to finish.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent -translate-y-1/2" />
            <div className="grid gap-8 lg:grid-cols-5 relative z-10">
              {data.workflow.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative flex flex-col items-center text-center group"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 shadow-xl transition-transform group-hover:scale-110 group-hover:border-indigo-500">
                      <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shadow-lg">
                        {step.step}
                      </div>
                      <Icon className="h-7 w-7 text-indigo-400 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="mt-6 text-lg font-bold text-white">{step.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.desc}</p>
                    
                    {/* Mobile Arrow */}
                    {idx !== data.workflow.length - 1 && (
                      <ArrowDown className="h-6 w-6 text-slate-600 mt-6 lg:hidden" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Animated Statistics Section */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-32">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 lg:p-16 backdrop-blur-md">
            <div className="grid gap-8 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {data.stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center justify-center text-center pt-8 md:pt-0 first:pt-0"
                >
                  <p className={`bg-gradient-to-r ${data.heroGradient} bg-clip-text text-5xl sm:text-6xl font-black text-transparent drop-shadow-xl`}>
                    {stat.value}
                  </p>
                  <p className="mt-4 text-lg font-bold text-slate-300">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Feature Benefits Section */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white sm:text-4xl">Key Benefits</h2>
            <p className="mt-4 text-slate-400">Why thousands of teams trust OnboardPro for {data.title.toLowerCase()}.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-colors hover:bg-slate-800/80 hover:border-slate-700"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{benefit.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 6. Security & Compliance Section */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-32">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-8 sm:p-12 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <ShieldCheck className="h-64 w-64 text-emerald-400" />
            </div>
            <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_2fr] items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-300 mb-6">
                  <Shield className="h-4 w-4" />
                  Enterprise Grade
                </div>
                <h2 className="text-3xl font-black text-white">Security & Compliance Built-In</h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  We treat your data with the highest security standards. {data.title} operations are continuously monitored and logged.
                </p>
                <Link to="/features/rbac-security" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition">
                  Learn about RBAC Security <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {data.security.map((sec, idx) => (
                  <div key={sec.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-3" />
                    <h4 className="font-bold text-white">{sec.title}</h4>
                    <p className="mt-1 text-sm text-slate-400">{sec.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-32 text-center">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to automate your onboarding?</h2>
          <p className="mt-4 text-lg text-slate-400">Join forward-thinking teams using OnboardPro today.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className={`rounded-full bg-gradient-to-r ${data.heroGradient} px-8 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition hover:scale-105`}>
              Start for free
            </Link>
            <Link to="/support" className="rounded-full border border-slate-700 bg-transparent px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:border-slate-600">
              Contact Sales
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-[#060A14] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white">
              <span className="text-xs font-bold">OP</span>
            </div>
            <span className="font-bold">OnboardPro</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} OnboardPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
