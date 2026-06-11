import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Headphones,
  Mail,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

const footerLinks = [
  { label: "Features", path: "/features" },
  { label: "Docs", path: "/docs" }
];

const faqCategories = [
  { id: "all", label: "All" },
  { id: "getting-started", label: "Getting Started" },
  { id: "employees", label: "Employees" },
  { id: "hr-managers", label: "HR Managers" },
  { id: "it-admin", label: "IT Admin" },
  { id: "access-security", label: "Access & Security" },
];

const faqs = [
  {
    id: "create-account",
    category: "getting-started",
    question: "How do I create an OnboardPro account?",
    answer:
      "Click \"Get started free\" on the homepage, complete the signup form with your name, email, company information, and role, then choose a secure password. After submitting, verify your account if required and log in to access your role-specific dashboard.",
  },
  {
    id: "available-roles",
    category: "getting-started",
    question: "What roles are available in OnboardPro?",
    answer:
      "OnboardPro supports 5 roles: Employee, HR Manager, Department Manager, IT Administrator, and System Admin. Each role receives a tailored dashboard and permissions set so users see only the tools they need.",
  },
  {
    id: "change-role",
    category: "getting-started",
    question: "Can I change my role after signing up?",
    answer:
      "Role changes must be done by your System Admin from the Admin dashboard. If your responsibilities change or you selected the wrong role during signup, ask your admin to update your role so the system can assign the correct dashboard and workflows.",
  },
  {
    id: "login-after-signup",
    category: "getting-started",
    question: "How do I log in after creating my account?",
    answer:
      "Visit /login, enter your registered email and password, and submit the form. Once authenticated, you will be directed to your role-specific dashboard, where your onboarding status and tasks are displayed.",
  },
  {
    id: "onboarding-checklist",
    category: "employees",
    question: "What is the onboarding checklist?",
    answer:
      "The checklist has 4 steps: Personal Details Submission, Document Upload, Policy Acknowledgment, and Training Completion. Steps must be completed in order so the system can unlock the next task only after the current one is finished.",
  },
  {
    id: "documents-needed",
    category: "employees",
    question: "What documents do I need to upload?",
    answer:
      "You need to upload National ID or Passport, Educational Certificate, and Address Proof. Accepted formats include PDF, JPG, and PNG. Make sure files are clear and legible so HR can verify them quickly.",
  },
  {
    id: "request-system-access",
    category: "employees",
    question: "How do I request system access?",
    answer:
      "Go to Access Requests in your dashboard, click New Access Request, select the system type, provide a justification, and submit. The request then routes to your manager for approval followed by IT provisioning.",
  },
  {
    id: "find-credentials",
    category: "employees",
    question: "Where do I find my system credentials?",
    answer:
      "Once IT provisions your access, credentials appear in the My Credentials section of your dashboard. Passwords are masked by default, and you can reveal them only when you need to sign in to the assigned system.",
  },
  {
    id: "initiate-onboarding",
    category: "hr-managers",
    question: "How do I initiate onboarding for a new hire?",
    answer:
      "In your HR dashboard, expand the Onboard New Employee form, fill in the employee details, and click Initiate Onboarding. The system will generate the appropriate checklist and routing for that employee’s role and department.",
  },
  {
    id: "verify-documents",
    category: "hr-managers",
    question: "How do I verify employee documents?",
    answer:
      "In the Document Verification Queue, find the employee, review each uploaded file, then click Verify to approve or Reject to decline with a reason. Rejections are sent back to the employee with clear instructions for correction.",
  },
  {
    id: "track-onboardings",
    category: "hr-managers",
    question: "Can I track all onboardings at once?",
    answer:
      "Yes, the Active Onboardings table shows all employees with their progress, status, and department. You can filter and sort cases so you quickly identify which hires need follow-up.",
  },
  {
    id: "provision-access",
    category: "it-admin",
    question: "How do I provision access for an employee?",
    answer:
      "In your Access Queue, find the approved request, click Provision Access, generate credentials, and confirm completion. The platform updates the employee’s request status and notifies them once provisioning is finished.",
  },
  {
    id: "deactivate-access",
    category: "it-admin",
    question: "How do I deactivate access when an employee leaves?",
    answer:
      "Go to Deactivations, click New Deactivation, fill in the employee and exit details, select systems to deactivate, and confirm. This ensures all active access is removed promptly and the event is logged for audit purposes.",
  },
  {
    id: "what-is-rbac",
    category: "access-security",
    question: "What is RBAC in OnboardPro?",
    answer:
      "Role-Based Access Control means each user only sees and accesses features relevant to their role. An employee cannot see HR or admin features, and administrators manage permissions centrally to keep data access secure.",
  },
  {
    id: "is-data-secure",
    category: "access-security",
    question: "Is my data secure?",
    answer:
      "OnboardPro uses JWT-based authentication and role-based access control to protect user data and system credentials. Sensitive actions are logged in the audit trail, and access is granted only after proper approval.",
  },
  {
    id: "who-can-see-audit-logs",
    category: "access-security",
    question: "Who can see the audit logs?",
    answer:
      "Only System Administrators have access to the full audit log. IT Administrators can see their own action logs, while HR managers and department managers see only audit events relevant to their workflows.",
  },
  {
    id: "email-support-response",
    category: "access-security",
    question: "How quickly will support respond to my message?",
    answer:
      "Our support team typically responds within 24 hours on business days. Messages submitted through the contact form include a reference ID so you can follow up if necessary.",
  },
];

const supportCards = [
  {
    title: "Read the Docs",
    text: "Browse our complete documentation covering every feature and role.",
    icon: BookOpen,
    color: "text-[#6366F1] bg-[#6366F1]/10",
    button: {
      text: "Go to Docs",
      action: "docs",
      style: "bg-[#6366F1] text-white hover:bg-[#4F46E5]",
    },
  },
  {
    title: "Email Support",
    text: "Send us a detailed message and we'll respond within 24 hours.",
    icon: Mail,
    color: "text-[#3B82F6] bg-[#3B82F6]/10",
    button: {
      text: "Contact Us",
      action: "contact",
      style: "bg-[#191C26] text-white hover:bg-[#222533] border border-[#222533]",
    },
  },
  {
    title: "Community Forum",
    text: "Connect with other OnboardPro users, share tips, and get answers.",
    icon: MessageCircle,
    color: "text-[#F59E0B] bg-[#F59E0B]/10",
    button: {
      text: "Join Community",
      action: "community",
      style: "bg-[#191C26] text-white hover:bg-[#222533] border border-[#222533]",
    },
  },
];

const initialFormState = {
  name: "",
  email: "",
  role: "Employee",
  subject: "Account Issue",
  message: "",
  priority: "Low",
};

export default function Support() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFooterNav = (e, path) => {
    e.preventDefault();
    setIsExiting(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState("create-account");
  const [toastMessage, setToastMessage] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [sentMessage, setSentMessage] = useState(null);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleCardAction = (action) => {
    if (action === "docs") {
      navigate("/docs");
      return;
    }

    if (action === "contact") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "community") {
      setToastMessage("Community coming soon!");
      window.setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        errors[key] = true;
      }
    });

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const referenceId = `SUP-${Math.floor(10000 + Math.random() * 90000)}`;
      setSentMessage({ email: formData.email, referenceId });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setSentMessage(null);
  };

  return (
    <div className={`support-theme-page public-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC] transition-opacity duration-500 ease-in-out ${isExiting ? "opacity-0" : "opacity-100"}`}>
      <nav className="sticky top-0 z-50 border-b border-[#222533] bg-[#13151D]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-[#F8FAFC]">OnboardPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/features"
              className="text-sm font-semibold text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              Features
            </Link>
            <Link
              to="/docs"
              className="text-sm font-semibold text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              Docs
            </Link>
            <Link
              to="/support"
              className="text-sm font-semibold text-[#6366F1] border-b-2 border-[#6366F1] pb-0.5"
            >
              Support
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

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#6366F1]/10 text-[#818CF8]">
            <Headphones className="h-12 w-12" aria-hidden="true" />
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-[#F8FAFC] sm:text-5xl">
            How can we help you?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[#CBD5E1]">
            Search our knowledge base or reach out to our support team.
          </p>
          <div className="mt-10">
            <label htmlFor="support-search" className="block text-sm font-semibold text-[#CBD5E1]">
              Search
            </label>
            <input
              id="support-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search support topics..."
              className="mt-3 w-full max-w-lg rounded-3xl border border-[#222533] bg-[#191C26] px-5 py-4 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30"
            />
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {supportCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-3xl border border-[#222533] bg-[#13151D] p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.7)]">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-[#F8FAFC]">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#94A3B8]">{card.text}</p>
                <button
                  type="button"
                  onClick={() => handleCardAction(card.button.action)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${card.button.style}`}
                >
                  {card.button.text}
                  {card.button.action === "docs" ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </article>
            );
          })}
        </section>

        {toastMessage ? (
          <div className="mt-6 rounded-3xl border border-[#6366F1]/30 bg-[#13151D] p-4 text-sm text-[#F8FAFC]">
            {toastMessage}
          </div>
        ) : null}

        <section className="mt-20 rounded-3xl border border-[#222533] bg-[#13151D] p-8 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#F8FAFC]">Frequently Asked Questions</h2>
              <p className="mt-2 text-sm text-[#94A3B8]">Quick answers to common questions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {faqCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === category.id
                      ? "bg-[#6366F1] text-white"
                      : "bg-[#191C26] text-[#94A3B8] hover:bg-[#222533] hover:text-[#F8FAFC]"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-3xl border border-[#222533] bg-[#191C26] p-6 text-sm text-[#CBD5E1]">
                No FAQs match your search. Try a broader query or select a different category.
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-3xl border border-[#222533] bg-[#191C26]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? "" : faq.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#222533] hover:text-white"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition ${expandedFaq === faq.id ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>
                  {expandedFaq === faq.id ? (
                    <div className="border-t border-[#222533] bg-[#13151D] px-6 py-5 text-sm leading-7 text-[#CBD5E1]">
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section id="contact" className="mt-20 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-[#222533] bg-[#13151D] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#EC4899]">Get in touch</p>
            <h2 className="mt-5 text-3xl font-semibold text-[#F8FAFC]">Our support team typically responds within 24 hours on business days.</h2>
            <p className="mt-5 text-sm leading-7 text-[#94A3B8]">
              If you need help with onboarding, access, or documentation, send us a message and we’ll get back to you as soon as possible.
            </p>
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-[#222533] bg-[#191C26] p-5">
                <p className="text-sm text-[#94A3B8]">📧 Email</p>
                <p className="mt-2 text-sm text-[#F8FAFC]">support@onboardpro.io</p>
              </div>
              <div className="rounded-3xl border border-[#222533] bg-[#191C26] p-5">
                <p className="text-sm text-[#94A3B8]">🕐 Hours</p>
                <p className="mt-2 text-sm text-[#F8FAFC]">Mon–Fri, 9AM–6PM IST</p>
              </div>
              <div className="rounded-3xl border border-[#222533] bg-[#191C26] p-5">
                <p className="text-sm text-[#94A3B8]">📍 Based in</p>
                <p className="mt-2 text-sm text-[#F8FAFC]">India</p>
              </div>
            </div>
            <div className="mt-8 rounded-3xl border border-[#222533] bg-[#191C26] p-6">
              <div className="flex items-center gap-3 text-[#10B981]">
                <Clock className="h-6 w-6" />
                <span className="font-semibold">Average response time</span>
              </div>
              <p className="mt-4 text-4xl font-semibold text-[#F8FAFC]">&lt; 24 hours</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#222533] bg-[#13151D] p-8">
            {sentMessage ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981]">
                  <CheckCircle className="h-12 w-12" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-semibold text-[#F8FAFC]">Message sent successfully!</h3>
                <p className="text-sm leading-7 text-[#94A3B8]">
                  We've received your message and will respond to {sentMessage.email} within 24 hours.
                </p>
                <p className="text-sm text-[#94A3B8]">Reference ID: {sentMessage.referenceId}</p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="text-sm font-semibold text-[#94A3B8]">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className={`mt-3 w-full rounded-3xl border px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 ${
                      formErrors.name ? "border-[#FF7A5A] bg-[#2C1A1A]/30" : "border-[#222533] bg-[#191C26]"
                    }`}
                  />
                  {formErrors.name ? <p className="mt-2 text-xs text-[#FCA5A5]">Full Name is required.</p> : null}
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-semibold text-[#94A3B8]">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className={`mt-3 w-full rounded-3xl border px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 ${
                      formErrors.email ? "border-[#FF7A5A] bg-[#2C1A1A]/30" : "border-[#222533] bg-[#191C26]"
                    }`}
                  />
                  {formErrors.email ? <p className="mt-2 text-xs text-[#FCA5A5]">Work Email is required.</p> : null}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="role" className="text-sm font-semibold text-[#94A3B8]">
                      Role
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                      className={`mt-3 w-full rounded-3xl border px-4 py-3 text-sm text-[#F8FAFC] bg-[#191C26] border-[#222533] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 ${
                        formErrors.role ? "border-[#FF7A5A]" : ""
                      }`}
                    >
                      <option className="bg-[#191C26]">Employee</option>
                      <option className="bg-[#191C26]">HR Manager</option>
                      <option className="bg-[#191C26]">Department Manager</option>
                      <option className="bg-[#191C26]">IT Administrator</option>
                      <option className="bg-[#191C26]">System Admin</option>
                      <option className="bg-[#191C26]">Other</option>
                    </select>
                    {formErrors.role ? <p className="mt-2 text-xs text-[#FCA5A5]">Role is required.</p> : null}
                  </div>
                  <div>
                    <label htmlFor="subject" className="text-sm font-semibold text-[#94A3B8]">
                      Subject
                    </label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                      className={`mt-3 w-full rounded-3xl border px-4 py-3 text-sm text-[#F8FAFC] bg-[#191C26] border-[#222533] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 ${
                        formErrors.subject ? "border-[#FF7A5A]" : ""
                      }`}
                    >
                      <option className="bg-[#191C26]">Account Issue</option>
                      <option className="bg-[#191C26]">Onboarding Help</option>
                      <option className="bg-[#191C26]">Access Request Problem</option>
                      <option className="bg-[#191C26]">Document Verification</option>
                      <option className="bg-[#191C26]">Technical Issue</option>
                      <option className="bg-[#191C26]">Feature Request</option>
                      <option className="bg-[#191C26]">Other</option>
                    </select>
                    {formErrors.subject ? <p className="mt-2 text-xs text-[#FCA5A5]">Subject is required.</p> : null}
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="text-sm font-semibold text-[#94A3B8]">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    className={`mt-3 w-full rounded-3xl border px-4 py-3 text-sm text-[#F8FAFC] bg-[#191C26] border-[#222533] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 ${
                      formErrors.message ? "border-[#FF7A5A]" : ""
                    }`}
                  />
                  {formErrors.message ? <p className="mt-2 text-xs text-[#FCA5A5]">Message is required.</p> : null}
                </div>
                <div>
                  <label htmlFor="priority" className="text-sm font-semibold text-[#94A3B8]">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(event) => setFormData({ ...formData, priority: event.target.value })}
                    className={`mt-3 w-full rounded-3xl border px-4 py-3 text-sm text-[#F8FAFC] bg-[#191C26] border-[#222533] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 ${
                      formErrors.priority ? "border-[#FF7A5A]" : ""
                    }`}
                  >
                    <option className="bg-[#191C26]">Low</option>
                    <option className="bg-[#191C26]">Medium</option>
                    <option className="bg-[#191C26]">High</option>
                    <option className="bg-[#191C26]">Urgent</option>
                  </select>
                  {formErrors.priority ? <p className="mt-2 text-xs text-[#FCA5A5]">Priority is required.</p> : null}
                </div>
                <button
                  type="submit"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#222533] bg-[#08090C] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-[#F8FAFC]">OnboardPro</span>
            </Link>
            <p className="mt-3 text-sm text-[#94A3B8]">Modern onboarding workflows for fast-moving teams.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => handleFooterNav(e, link.path)}
                className="text-sm font-semibold text-[#94A3B8] transition hover:text-[#6366F1]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
