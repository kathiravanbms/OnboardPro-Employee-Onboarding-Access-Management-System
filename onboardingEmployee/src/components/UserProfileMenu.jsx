import { useCallback, useEffect, useRef, useState } from "react";
import { User, X } from "lucide-react";
import { PROFILE_UPDATED_EVENT, userProfileService } from "../services/userProfileService";

const profileFields = [
  ["Full Name", "fullName"],
  ["Employee ID", "employeeId"],
  ["Email", "email"],
  ["Role", "role"],
  ["Account Status", "accountStatus"],
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function UserProfileMenu() {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setProfile(await userProfileService.getCurrentUserProfile());
    } catch (loadError) {
      setError(loadError?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      if (event.detail) {
        setProfile((current) => ({ ...(current || {}), ...event.detail }));
      } else {
        setProfile(null);
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggleProfile = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && !loading) loadProfile();
  };

  const initials = getInitials(profile?.fullName);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleProfile}
        aria-label="Open profile"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366F1] text-sm font-bold text-white shadow-md shadow-indigo-950/40 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/60 focus:ring-offset-2 focus:ring-offset-[#08090C]"
      >
        {initials ? initials : <User className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-lg border border-[#222533] bg-[#13151D] shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-[#222533] px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">User Profile</p>
              <h2 className="mt-1 text-base font-bold text-[#F8FAFC]">{profile?.fullName || "Profile"}</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close profile"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3 p-5">
            {loading && !profile ? <p className="text-sm text-[#94A3B8]">Loading profile...</p> : null}
            {error && !profile ? <p className="text-sm font-semibold text-rose-400">{error}</p> : null}
            {profile
              ? profileFields.map(([label, key]) => (
                  <div key={key} className="grid grid-cols-[130px_1fr] gap-3">
                    <span className="text-xs font-semibold text-[#94A3B8]">{label}</span>
                    <span className={`break-words text-right text-sm font-semibold ${key === "accountStatus" && profile[key] === "Active" ? "text-emerald-400" : "text-[#F8FAFC]"}`}>
                      {profile[key]}
                    </span>
                  </div>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
