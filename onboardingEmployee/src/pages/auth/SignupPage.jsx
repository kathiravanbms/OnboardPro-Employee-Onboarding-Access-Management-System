import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, User, Mail, Lock, Shield, Sparkles, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const strengthLabels = [
  { label: "Weak", color: "bg-rose-500", text: "text-rose-400" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-400" },
  { label: "Good", color: "bg-cyan-400", text: "text-cyan-400" },
  { label: "Strong", color: "bg-emerald-400", text: "text-emerald-400" },
];

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreed: false,
};

function getStrengthIndex(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;
  return Math.min(score, 3);
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, getDashboardRoute } = useAuth();
  
  const [form, setForm] = useState(initialForm);
  const [role] = useState("Admin");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const strengthIndex = useMemo(() => getStrengthIndex(form.password), [form.password]);
  const strength = strengthLabels[strengthIndex];
  
  const dashboardRoute = getDashboardRoute(role);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    const email = form.email.trim();
    const fullName = form.fullName.trim();

    if (!fullName) {
      nextErrors.fullName = "Full name is required.";
    } else if (fullName.split(" ").length < 2) {
      nextErrors.fullName = "Please enter both first and last name.";
    }

    if (!email) {
      nextErrors.email = "Work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match.";
    }

    if (!form.agreed) {
      nextErrors.agreed = "You must agree to the Terms of Service.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const nameParts = form.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await register({
        firstName,
        lastName,
        name: form.fullName.trim(),
        email: normalizedEmail,
        role: role,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: err.message || "Failed to create account." }));
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <main className="public-theme-page relative min-h-screen overflow-hidden bg-[#0A0F1E] text-[#F8FAFC]">
      {/* Background Tech overlays & Cosmic Glows */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.2] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.35, 0.25]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-36 -top-36 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_75%)] blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -right-36 top-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_75%)] blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.12, 0.2, 0.12]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-150px] left-1/2 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.08)_0%,transparent_80%)] blur-[120px]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          
          {/* Left panel - Branding introduction */}
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="rounded-[24px] border border-slate-800/80 bg-slate-900/40 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:p-12"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white shadow-lg shadow-indigo-500/20 border border-white/10">
                <i className="ti ti-layer-plus text-2xl" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Welcome to</p>
                <p className="text-2xl font-black tracking-tight text-white">
                  Onboard<span className="text-[#6366F1]">Pro</span>
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-300 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
              <span>Smart Employee Onboarding</span>
            </div>

            <h1 className="mt-8 text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
              Welcome your team with{" "}
              <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F472B6] bg-clip-text text-transparent">
                purpose.
              </span>
            </h1>
            <p className="mt-6 text-sm leading-7 text-slate-400 sm:text-base">
              Craft onboarding experiences that feel modern, guided, and instantly measurable for every employee, across every team.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: "ti-list-check", title: "Guided onboarding journeys", desc: "Step-by-step flows tailored to each role.", color: "text-[#6366F1] bg-indigo-500/10" },
                { icon: "ti-eye", title: "Team visibility & tracking", desc: "Monitor progress across your entire org.", color: "text-[#8B5CF6] bg-purple-500/10" },
                { icon: "ti-puzzle", title: "Integrate in minutes", desc: "Connects with HR systems, provisioning paths, and more.", color: "text-[#2DD4BF] bg-teal-500/10" }
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/5 ${item.color}`}>
                    <i className={`ti ${item.icon} text-lg`} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Right panel - Form Card */}
          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
            className="relative overflow-hidden rounded-[24px] border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-8"
          >
            {/* Edge glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-6 text-center text-white"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 text-3xl border border-emerald-500/20 shadow-lg shadow-emerald-950/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-6 text-2xl font-black tracking-tight">Account created</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Your OnboardPro account is ready. Jump in to access your custom dashboard.
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => navigate(dashboardRoute)}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 border border-white/10 hover:shadow-[0_8px_25px_rgba(99,102,241,0.3)] transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Create your account</h2>
                    <p className="mt-2 text-sm text-slate-400">Get started with OnboardPro today</p>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                    
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        <User className="h-3.5 w-3.5 text-indigo-400/80" />
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/15 focus:bg-[#0F1322]/80"
                        placeholder="Sarah Jenkins"
                      />
                      {errors.fullName && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        <Mail className="h-3.5 w-3.5 text-indigo-400/80" />
                        Work Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/15 focus:bg-[#0F1322]/80"
                        placeholder="sarah.jenkins@company.com"
                      />
                      {errors.email && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.email}</p>}
                    </div>

                    {/* Account Role Display */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        <Shield className="h-3.5 w-3.5 text-indigo-400/80" />
                        Account Role
                      </label>
                      <div className="relative mt-2">
                        <div className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-[#F8FAFC]/80 font-bold backdrop-blur-md flex items-center justify-between border-slate-850">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            Admin
                          </span>
                          <span className="text-[9px] uppercase tracking-widest font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            Fixed Role
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        <Lock className="h-3.5 w-3.5 text-indigo-400/80" />
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(event) => updateField("password", event.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/15 focus:bg-[#0F1322]/80"
                          placeholder="Create a secure password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                      
                      {form.password && (
                        <div className="space-y-1.5 mt-2">
                          <div className="flex gap-1.5">
                            {[0, 1, 2, 3].map((idx) => (
                              <span
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${idx <= strengthIndex ? strength.color : "bg-slate-800"}`}
                              />
                            ))}
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${strength.text}`}>{strength.label} Password</p>
                        </div>
                      )}
                      {errors.password && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                        <Lock className="h-3.5 w-3.5 text-indigo-400/80" />
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(event) => updateField("confirmPassword", event.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/15 focus:bg-[#0F1322]/80"
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.confirmPassword}</p>}
                    </div>

                    {/* Terms Checklist checkbox */}
                    <label className="flex items-start gap-3 text-xs text-slate-400 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={form.agreed}
                        onChange={(event) => updateField("agreed", event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-[#6366F1] focus:ring-[#6366F1]"
                      />
                      <span>I agree to the Terms of Service and Privacy Policy</span>
                    </label>
                    {errors.agreed && <p className="text-xs text-rose-400 font-semibold">{errors.agreed}</p>}

                    {/* Submit Registration button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.015 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.985 }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 border border-white/10 hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-bold text-[#6366F1] transition hover:text-indigo-400 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
