import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import FeatureDetail from "./pages/FeatureDetail.jsx";
import Features from "./pages/Features.jsx";
import Docs from "./pages/Docs.jsx";
import Support from "./pages/Support.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import DepartmentManagerDashboard from "./pages/dashboards/DepartmentManagerDashboard.jsx";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard.jsx";
import HRDashboard from "./pages/dashboards/HRDashboard.jsx";
import ITDashboard from "./pages/ITDashboard.jsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./pages/auth/ProtectedRoute.jsx";
import ThemePreferenceSync from "./components/ThemePreferenceSync.jsx";

function DashboardFallback() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "Demo User";
  const userName = localStorage.getItem("userName") || "OnboardPro";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF7E3] px-4 text-[#17202A]">
      <section className="w-full max-w-md rounded-md border border-[rgba(122,111,88,0.18)] bg-[#FFFFFF] p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#38C7BE] text-lg font-bold">
          OP
        </div>
        <p className="mt-6 text-sm font-semibold text-[#FF8A66]">Dashboard coming soon</p>
        <h1 className="mt-2 text-3xl font-bold">{userRole}</h1>
        <p className="mt-3 text-sm leading-6 text-[#5F6B6A]">
          Signed in as {userName}. This role is authenticated, but its full workspace has not been built yet.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 rounded-md bg-[#38C7BE] px-5 py-3 text-sm font-semibold text-[#17202A] transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-[#38C7BE] focus:ring-offset-2 focus:ring-offset-[#FFFFFF]"
        >
          Back to home
        </button>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemePreferenceSync />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route path="/features" element={<Features />} />
        <Route path="/features/:featureId" element={<FeatureDetail />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/support" element={<Support />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin", "System Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr-dashboard"
          element={
            <ProtectedRoute allowedRoles={["HR Manager", "HR Personnel", "HR"]}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it-dashboard"
          element={
            <ProtectedRoute allowedRoles={["it_manager"]}>
              <ITDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Department Manager", "Manager"]}>
              <DepartmentManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect old dashboard paths to new protected paths */}
        <Route path="/dashboard/admin" element={<Navigate to="/admin-dashboard" replace />} />
        <Route path="/dashboard/hr" element={<Navigate to="/hr-dashboard" replace />} />
        <Route path="/dashboard/employee" element={<Navigate to="/employee-dashboard" replace />} />
        <Route path="/dashboard/it" element={<Navigate to="/it-dashboard" replace />} />
        <Route path="/dashboard/manager" element={<Navigate to="/manager-dashboard" replace />} />
        <Route path="/dashboard/:role" element={<DashboardFallback />} />
      </Routes>
    </AuthProvider>
  );
}
