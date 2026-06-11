import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changeCurrentUserPassword, getPasswordValidation } from "../utils/passwordChange";

const passwordFields = [
  ["Current Password", "current"],
  ["New Password", "next"],
  ["Confirm New Password", "confirm"],
];

function passwordStrength(password) {
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8 && hasSymbol) {
    return { label: "Strong", width: "w-full", color: "bg-emerald-500", text: "text-emerald-400" };
  }

  if (password.length >= 6) {
    return { label: "Medium", width: "w-2/3", color: "bg-amber-500", text: "text-amber-400" };
  }

  return { label: "Weak", width: "w-1/3", color: "bg-rose-500", text: "text-rose-400" };
}

export default function ChangePasswordSection({ idPrefix, showToast }) {
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false });
  const [passwordError, setPasswordError] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const strength = passwordStrength(passwordForm.next);
  const passwordValidation = getPasswordValidation(passwordForm);
  const inlinePasswordErrors = {
    ...passwordFieldErrors,
    next: passwordForm.next ? passwordValidation.errors.next : passwordFieldErrors.next,
    confirm: passwordForm.confirm ? passwordValidation.errors.confirm : passwordFieldErrors.confirm,
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordError("");
    setPasswordFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  };

  const updatePassword = async () => {
    if (!passwordValidation.isValid) {
      setPasswordFieldErrors(passwordValidation.errors);
      setPasswordError("Fix the password fields before updating.");
      return;
    }

    try {
      setPasswordSubmitting(true);
      await changeCurrentUserPassword(passwordForm.current, passwordForm.next);
      setPasswordError("");
      setPasswordFieldErrors({});
      setPasswordForm({ current: "", next: "", confirm: "" });
      setVisiblePasswords({ current: false, next: false, confirm: false });
      showToast?.("Password updated successfully");
    } catch (error) {
      const message = error.message || "Failed to update password.";
      setPasswordError(message);
      if (message.toLowerCase().includes("current password")) {
        setPasswordFieldErrors((current) => ({ ...current, current: message }));
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <>
      <h3 className="text-lg font-bold text-[#F8FAFC]">Change Password</h3>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {passwordFields.map(([label, field]) => {
          const inputId = `${idPrefix}-password-${field}`;
          return (
            <div key={field}>
              <label htmlFor={inputId} className="text-sm font-semibold text-[#F8FAFC]">{label}</label>
              <div className="relative mt-2">
                <input
                  id={inputId}
                  type={visiblePasswords[field] ? "text" : "password"}
                  value={passwordForm[field]}
                  onChange={(event) => updatePasswordField(field, event.target.value)}
                  className="w-full rounded-md border border-[#222533] bg-[#191C26] py-3 pl-4 pr-11 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field)}
                  aria-label={`${visiblePasswords[field] ? "Hide" : "Show"} ${label.toLowerCase()}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition hover:text-[#F8FAFC]"
                >
                  {visiblePasswords[field] ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {inlinePasswordErrors[field] ? <p className="mt-2 text-xs font-semibold text-rose-400">{inlinePasswordErrors[field]}</p> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 max-w-sm">
        <div className="h-2 overflow-hidden rounded-full bg-[#191C26]">
          <div className={`h-full rounded-full ${strength.width} ${strength.color}`} />
        </div>
        <p className={`mt-2 text-xs font-semibold ${strength.text}`}>{strength.label}</p>
      </div>
      {passwordError ? <p className="mt-3 text-sm text-rose-400">{passwordError}</p> : null}
      <button
        type="button"
        onClick={updatePassword}
        disabled={!passwordValidation.isValid || passwordSubmitting}
        className="mt-5 rounded-md bg-[#6366F1] px-5 py-3 text-sm font-bold text-white transition duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {passwordSubmitting ? "Updating..." : "Update Password"}
      </button>
    </>
  );
}
