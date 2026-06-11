import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Users,
  Shield,
  UserCog,
  UserRound,
  UserRoundCog,
  Sparkles,
  ArrowRight,
  Lock,
  Mail
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { auditLogService } from "../../services/auditLogService";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, getDashboardRoute } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectedRole, setDetectedRole] = useState("");


  const handleEmailChange = (val) => {
    setEmail(val);
    const cleaned = val.trim().toLowerCase();
    
    // Proactively check predefined accounts first
    const matchedDemo = demoAccounts.find(acc => acc.email.toLowerCase() === cleaned);
    if (matchedDemo) {
      setDetectedRole(matchedDemo.roleName);
      return;
    }

    // Check stored users for custom accounts
    try {
      const stored = localStorage.getItem("users");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const matchedCustom = parsed.find(u => u.email.toLowerCase().trim() === cleaned);
          if (matchedCustom) {
            setDetectedRole(matchedCustom.role);
            return;
          }
        }
      }
    } catch {
      // Ignore fallback
    }

    setDetectedRole("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    triggerLogin(email, password);
  };

  const triggerLogin = async (loginEmail, loginPassword) => {
    setError("");
    setIsLoading(true);

    try {
      const user = await login(loginEmail, loginPassword);
      auditLogService.createAuditLog({
        userName: user.name || loginEmail,
        role: user.role || "User",
        module: "Security",
        action: "Login",
        description: `${user.name || loginEmail} logged in.`,
      }).catch(() => {});
      const destination = getDashboardRoute(user.role);
      navigate(destination);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
      setIsLoading(false);
    }
  };



  const demoAccounts = [
    {
      roleName: "Admin",
      email: "admin@demo.com",
      icon: Shield,
      colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30"
    },
    {
      roleName: "HR Manager",
      email: "hr@demo.com",
      icon: Users,
      colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
    },
    {
      roleName: "IT Manager",
      email: "it@demo.com",
      icon: UserCog,
      colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    },
    {
      roleName: "Manager",
      email: "manager@demo.com",
      icon: UserRoundCog,
      colorClass: "text-pink-400 bg-pink-500/10 border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/20",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30"
    },
    {
      roleName: "Employee",
      email: "employee@demo.com",
      icon: UserRound,
      colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/20",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
    }
  ];

  return (
    <main className="public-theme-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0F1E] px-4 py-12 text-[#F8FAFC]">
      {/* Background Interactive Lighting Layers */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {/* Deep tech pattern lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.25] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Slow Pulsing Color Glow Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.35, 0.45, 0.35],
            x: [0, 15, 0],
            y: [0, -15, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_75%)] blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.35, 0.25],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -right-32 -bottom-32 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12)_0%,transparent_75%)] blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_80%)] blur-[120px]"
        />
      </div>

      {/* Main Glassmorphism Form Container */}
      <motion.section
        initial={{ opacity: 0, y: 35, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] overflow-hidden rounded-[24px] border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-8"
      >
        {/* Subtle top edge border gradient glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {/* Logo and Branding Header */}
        <div className="flex flex-col items-center">
          <Link to="/" className="flex items-center gap-3 group" aria-label="OnboardPro home">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.08 }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white shadow-lg shadow-indigo-500/20 border border-white/10"
            >
              <Users className="h-6 w-6" aria-hidden="true" />
            </motion.div>
            <span className="text-2xl font-black tracking-tight text-white">
              Onboard<span className="text-[#6366F1] transition group-hover:text-indigo-400">Pro</span>
            </span>
          </Link>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC] sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Enter your credentials to access your workspace
            </p>
          </div>
        </div>

        {/* Error Alert Display */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-6 overflow-hidden"
            >
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-400 backdrop-blur-md">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Authentication failed</p>
                  <p className="mt-0.5 text-xs text-red-400/90 leading-relaxed">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Authentication Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                <Mail className="h-3.5 w-3.5 text-indigo-400/80" />
                Email Address
              </label>
              <AnimatePresence>
                {detectedRole && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.85, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -4 }}
                    className="inline-flex items-center gap-1 rounded-md bg-[#6366F1]/10 px-2 py-0.5 text-[10px] font-bold text-[#818CF8] border border-[#6366F1]/20"
                  >
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    {detectedRole} Detected
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="relative mt-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                disabled={isLoading}
                className="w-full rounded-xl border bg-slate-950/40 px-4 py-3.5 text-sm text-[#F8FAFC] outline-none transition-all placeholder:text-[#64748B] focus:bg-[#0F1322]/80 disabled:opacity-60 disabled:cursor-not-allowed border-slate-800 focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/15"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                <Lock className="h-3.5 w-3.5 text-indigo-400/80" />
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#6366F1] transition hover:text-indigo-400 focus:outline-none">
                Forgot?
              </Link>
            </div>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="w-full rounded-xl border bg-slate-950/40 px-4 py-3.5 pr-12 text-sm text-[#F8FAFC] outline-none transition-all placeholder:text-[#64748B] focus:bg-[#0F1322]/80 disabled:opacity-60 disabled:cursor-not-allowed border-slate-800 focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#94A3B8] transition-all hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Sign-In Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.015 }}
            whileTap={{ scale: isLoading ? 1 : 0.985 }}
            className="relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-80 border border-white/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign in to account</span>
                <ArrowRight className="h-4 w-4 transition duration-300" aria-hidden="true" />
              </>
            )}
          </motion.button>
        </form>



        <p className="mt-6 text-center text-sm text-[#94A3B8]">
          Need an account? Ask your system admin to create one.
        </p>
      </motion.section>
    </main>
  );
}
