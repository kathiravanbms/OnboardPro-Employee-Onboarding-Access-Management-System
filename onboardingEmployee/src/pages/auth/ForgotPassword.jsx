import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:8081";
const RESET_MESSAGE = "If that email exists in our records, a password reset link has been dispatched.";

function validatePassword(password, confirmPassword) {
  const errors = {};

  if (!password) {
    errors.newPassword = "New password is required.";
  } else if (password.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(password)) {
    errors.newPassword = "Password must include an uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    errors.newPassword = "Password must include a lowercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.newPassword = "Password must include a number.";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.newPassword = "Password must include a special character.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }

  return errors;
}

function passwordStrength(password) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (checks >= 5) {
    return { label: "Strong", width: "w-full", color: "bg-emerald-500", text: "text-emerald-400" };
  }

  if (checks >= 3) {
    return { label: "Medium", width: "w-2/3", color: "bg-amber-500", text: "text-amber-400" };
  }

  return { label: "Weak", width: "w-1/3", color: "bg-rose-500", text: "text-rose-400" };
}

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const isResetMode = Boolean(token);
  const [email, setEmail] = useState("");
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const strength = passwordStrength(passwordForm.newPassword);

  const resetValidation = useMemo(
    () => validatePassword(passwordForm.newPassword, passwordForm.confirmPassword),
    [passwordForm.newPassword, passwordForm.confirmPassword],
  );
  const resetFormValid = Object.keys(resetValidation).length === 0;
  const inlineErrors = {
    ...fieldErrors,
    newPassword: passwordForm.newPassword ? resetValidation.newPassword : fieldErrors.newPassword,
    confirmPassword: passwordForm.confirmPassword ? resetValidation.confirmPassword : fieldErrors.confirmPassword,
  };

  const handleRecoverSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.data?.[0] || "Unable to send reset link right now.");
      }

      setSuccessMessage(data?.message || RESET_MESSAGE);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!resetFormValid) {
      setFieldErrors(resetValidation);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: passwordForm.newPassword }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.data?.[0] || "Reset link is invalid or expired.");
      }

      setSuccessMessage(data?.message || "Password reset successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setFieldErrors({});
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setError("");
  };

  return (
    <main className="public-theme-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0F1E] px-4 py-10 text-[#F8FAFC]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.22] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_45%,#000_65%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.18),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(236,72,153,0.14),transparent_32%),radial-gradient(circle_at_50%_110%,rgba(45,212,191,0.10),transparent_38%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent" />
      </div>

      <section className="relative w-full max-w-[440px] overflow-hidden rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
        <div className="flex justify-center">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white shadow-lg shadow-indigo-500/20">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Onboard
              <span className="text-[#6366F1] transition group-hover:text-indigo-400">Pro</span>
            </span>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-[#F8FAFC]">{isResetMode ? "Create new password" : "Reset password"}</h1>
          <p className="mt-2 text-sm font-medium text-[#94A3B8]">
            {isResetMode ? "Enter a secure new password for your account" : "We'll help you recover your access credentials"}
          </p>
        </div>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-300 backdrop-blur-md">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-300 backdrop-blur-md">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-semibold">{isResetMode ? successMessage : RESET_MESSAGE}</p>
            </div>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-5 py-3.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : isResetMode ? (
          <form className="mt-6 space-y-5" onSubmit={handleResetSubmit}>
            <div>
              <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3.5 text-sm text-[#F8FAFC] outline-none transition-all placeholder:text-[#64748B] focus:border-[#6366F1] focus:bg-[#0F1322]/80 focus:ring-4 focus:ring-[#6366F1]/15"
              />
              {inlineErrors.newPassword ? <p className="mt-2 text-xs font-semibold text-rose-400">{inlineErrors.newPassword}</p> : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3.5 text-sm text-[#F8FAFC] outline-none transition-all placeholder:text-[#64748B] focus:border-[#6366F1] focus:bg-[#0F1322]/80 focus:ring-4 focus:ring-[#6366F1]/15"
              />
              {inlineErrors.confirmPassword ? <p className="mt-2 text-xs font-semibold text-rose-400">{inlineErrors.confirmPassword}</p> : null}
            </div>

            <div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-950/70">
                <div className={`h-full rounded-full ${strength.width} ${strength.color}`} />
              </div>
              <p className={`mt-2 text-xs font-semibold ${strength.text}`}>{strength.label}</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !resetFormValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating password
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleRecoverSubmit}>
            <div>
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3.5 text-sm text-[#F8FAFC] outline-none transition-all placeholder:text-[#64748B] focus:border-[#6366F1] focus:bg-[#0F1322]/80 focus:ring-4 focus:ring-[#6366F1]/15"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending reset link
                </>
              ) : (
                "Recover Password"
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#818CF8] transition hover:text-indigo-300"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
