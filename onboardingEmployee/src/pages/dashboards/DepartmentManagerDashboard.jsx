import {
  BarChart2,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Settings,
  UserPlus,
  Users,
  X,
  XCircle,
  FileText,
  AlertTriangle,
  Search
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredEmployeeId, loadRoleSettings, normalizeUserRole, saveRoleSettings, logoutPreservingSettings } from "../../utils/roleSettings";
import { formatDistanceToNow } from "date-fns";
import UserProfileMenu from "../../components/UserProfileMenu";
import ChangePasswordSection from "../../components/ChangePasswordSection";
import ThemeToggle, { ThemeSettingsPanel } from "../../components/ThemeToggle";
import { approvalService } from "../../services/approvalService";
import { apiClient, getApiErrorMessage, unwrapApiResponse } from "../../services/apiClient";
import { dashboardService } from "../../services/dashboardService";
import { notificationService } from "../../services/notificationService";
import { reportService } from "../../services/reportService";
import { notifyUserProfileUpdated, userProfileService } from "../../services/userProfileService";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Team Onboarding", icon: Users },
  { label: "Approvals", icon: ClipboardCheck },
  { label: "Notifications", icon: Bell },
  { label: "Reports", icon: BarChart2 },
  { label: "Settings", icon: Settings },
];

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const rawValue = value instanceof Date ? value : String(value).trim();
  if (!rawValue) {
    return "N/A";
  }

  const parsedDate = rawValue instanceof Date
    ? rawValue
    : /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
      ? new Date(`${rawValue}T00:00:00`)
      : new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function formatToday() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function normalizeApprovalStatus(status) {
  return String(status || "PENDING").trim().toUpperCase();
}

function formatEnumLabel(value) {
  return String(value || "N/A")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isActionableApproval(status) {
  return ["REQUESTED", "PENDING"].includes(normalizeApprovalStatus(status));
}

function getActivityColor(type) {
  const normalized = String(type || "").toUpperCase();
  if (normalized === "APPROVAL") return "#10B981";
  if (normalized === "ONBOARDING") return "#3B82F6";
  if (normalized === "EMPLOYEE") return "#6366F1";
  return "#FF8A66";
}

function timeAgo(timestamp) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  return `${Math.floor(minutes / 60)}h ago`;
}

function Card({ children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[#222533] bg-[#13151D] ${className}`}>
      {children}
    </section>
  );
}

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#F8FAFC]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Badge({ children, tone }) {
  const styles = {
    pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    requested: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    approved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    rejected: "border-rose-500/25 bg-rose-500/10 text-rose-400",
    provisioned: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    active: "border-rose-500/25 bg-rose-500/10 text-rose-400",
  };

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function EmptyState({ icon: Icon, title, text, color }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <Icon className={`h-16 w-16 opacity-30 ${color}`} aria-hidden="true" />
      <h3 className="mt-5 text-lg font-bold text-[#F8FAFC]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#94A3B8]">{text}</p>
    </div>
  );
}

export default function DepartmentManagerDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Department Manager");
  const [activePage, setActivePage] = useState("Dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const normalizedRole = normalizeUserRole(role);
    const storedName = localStorage.getItem("userName");
    const savedSettings = loadRoleSettings(normalizedRole);
    const allowedRoles = ["Department Manager", "Dept Manager"];

    if (!token || !allowedRoles.includes(role)) {
      navigate("/login");
      return;
    }

    const resolvedName = savedSettings.userName || storedName || "Manager Demo";
    setUserName(resolvedName);
  }, [navigate]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const logout = () => {
    logoutPreservingSettings();
    navigate("/login");
  };

  return (
    <div className="dashboard-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC]">
      {toast ? (
        <div className="fixed right-5 top-5 z-50 rounded-md border border-emerald-500/30 bg-[#13151D] px-4 py-3 text-sm font-semibold text-emerald-400 shadow-2xl shadow-black/55">
          {toast}
        </div>
          ) : null}

          <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#222533] bg-[#0D0E12]">
        <Link to="/" className="flex h-20 items-center gap-3 px-5 text-inherit no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white shadow-lg shadow-indigo-950/50">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold">
<span className="text-[#F8FAFC]">Onboard</span><span className="text-[#6366F1]">Pro</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActivePage(item.label)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition ${
                  isActive ? "bg-[#6366F1]/10 text-[#6366F1]" : "text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </div>
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#222533] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6366F1] text-sm font-bold text-white shadow-md shadow-indigo-950/40">
              {getInitials(userName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#F8FAFC]">{userName}</p>
              <p className="text-xs text-[#94A3B8]">Department Manager</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="logout-button mt-4 flex w-full items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:border-rose-500/30"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <div className="ml-[240px] min-h-screen">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#222533] bg-[#08090C]/90 px-8 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Manager Portal</p>
            <h1 className="mt-1 text-2xl font-bold text-[#F8FAFC]">{activePage}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActivePage("Notifications")}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
              ) : null}
            </button>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </header>

        <main className="space-y-6 p-8">
          {activePage === "Dashboard" ? (
            <Dashboard userName={userName} showToast={showToast} />
          ) : null}
          {activePage === "Team Onboarding" ? <TeamOnboarding userName={userName} showToast={showToast} /> : null}
          {activePage === "Approvals" ? (
            <Approvals showToast={showToast} />
          ) : null}
          {activePage === "Notifications" ? (
            <NotificationsView
              showToast={showToast}
              onUnreadCountChange={setUnreadCount}
            />
          ) : null}
          {activePage === "Reports" ? (
            <Reports showToast={showToast} />
          ) : null}
          {activePage === "Settings" ? (
            <SettingsPage userName={userName} setUserName={setUserName} showToast={showToast} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

const emptyDashboardStats = {
  members: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

function Dashboard({ userName, showToast }) {
  const [stats, setStats] = useState(emptyDashboardStats);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestStartedRef = useRef(false);

  useEffect(() => {
    if (requestStartedRef.current) return;
    requestStartedRef.current = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getManagerDashboard();
        setStats({
          members: data.teamMembers ?? 0,
          pending: data.pendingApprovals ?? 0,
          approved: data.approvedRequests ?? 0,
          rejected: data.rejectedRequests ?? 0,
        });
        setActivities((data.recentActivities || []).map((activity) => ({
          ...activity,
          createdAt: activity.timestamp ? new Date(activity.timestamp).getTime() : Date.now(),
          color: getActivityColor(activity.type),
        })));
      } catch (err) {
        showToast(getApiErrorMessage(err, "Unable to load manager dashboard."));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [showToast]);

  const cards = [
    { label: "Team Members", value: stats.members, icon: Users, color: "#6366F1" },
    { label: "Pending Approvals", value: stats.pending, icon: ClipboardCheck, color: "#3B82F6" },
    { label: "Approved Requests", value: stats.approved, icon: CheckCircle2, color: "#10B981" },
    { label: "Rejected Requests", value: stats.rejected, icon: XCircle, color: "#EC4899" },
  ];

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#F8FAFC]">Welcome, {userName}</h2>
            <p className="mt-3 text-sm text-[#94A3B8]">Review team onboarding activity and approve department requests.</p>
          </div>
          <div className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm font-semibold text-[#94A3B8]">
            {formatToday()}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#94A3B8]">{card.label}</p>
                  <p className="mt-3 text-4xl font-bold text-[#F8FAFC]">{card.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#191C26]" style={{ color: card.color }}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-[#F8FAFC]">Recent Activity</h2>
        {loading ? (
          <p className="mt-6 rounded-md border border-[#222533] bg-[#191C26] px-4 py-5 text-sm text-[#94A3B8]">
            Loading activity...
          </p>
        ) : activities.length === 0 ? (
          <p className="mt-6 rounded-md border border-[#222533] bg-[#191C26] px-4 py-5 text-sm text-[#94A3B8]">
            No activity yet
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activity.color }} />
                <div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{activity.message}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">{timeAgo(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function TeamOnboarding({ userName, showToast }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const requestStartedRef = useRef(false);

  useEffect(() => {
    if (requestStartedRef.current) return;
    requestStartedRef.current = true;

    const loadTeamMembers = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/manager/team-onboarding");
        setTeamMembers(unwrapApiResponse(response).map((employee) => ({
          id: employee.employeeId || employee.id,
          databaseId: employee.databaseId || employee.id,
          employeeId: employee.employeeId || employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.departmentName || employee.department,
          jobTitle: employee.jobTitle,
          startDate: employee.startDate,
          addedOn: employee.startDate,
          status: employee.status || "N/A",
          docsStatus: employee.docsStatus || "Pending",
          accessStatus: employee.accessStatus || "No Requests",
          progress: employee.progress ?? 0,
        })));
        setLoaded(true);
      } catch (err) {
        showToast(getApiErrorMessage(err, "Unable to load team onboarding."));
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, [showToast, userName]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-[#F8FAFC]">Team Members</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">Review existing team member records and approval status.</p>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[#222533] p-6 bg-[#0D0E12]/20">
          <h2 className="text-xl font-bold text-[#F8FAFC]">Team Members</h2>
        </div>
        {loading && !loaded ? (
          <p className="p-6 text-sm text-[#94A3B8]">Loading team members...</p>
        ) : teamMembers.length === 0 ? (
          <EmptyState icon={UserPlus} title="No team members yet" text="No team members are currently available for review." color="text-[#FF8A66]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Onboarding Status</th>
                  <th className="px-6 py-4">Document Status</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-5 text-sm font-semibold text-[#F8FAFC]">{member.employeeId || member.id}</td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-[#F8FAFC]">{member.name}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">{member.email}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{member.department}</td>
                    <td className="px-6 py-5">
                      <Badge tone="active">{member.status}</Badge>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{member.docsStatus}</td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{member.accessStatus}</td>
                    <td className="px-6 py-5">
                      <div className="min-w-[140px]">
                        <div className="h-2 rounded-full bg-[#222533]">
                          <div
                            className="h-2 rounded-full bg-[#6366F1]"
                            style={{ width: `${Math.max(0, Math.min(100, member.progress))}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-[#94A3B8]">{member.progress}%</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Approvals({ showToast }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [decision, setDecision] = useState(null);
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState("");
  const requestStartedRef = useRef(false);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [persistedApprovals, accessRequestsResponse] = await Promise.all([
        approvalService.listApprovals(),
        apiClient.get("/access-requests"),
      ]);
      const onboardingApprovals = persistedApprovals
        .filter((approval) => approval.approvalType === "MANAGER_APPROVAL")
        .map((approval) => ({
          ...approval,
          kind: "ONBOARDING",
          request: "Employee onboarding approval",
        }));
      const accessRequestApprovals = unwrapApiResponse(accessRequestsResponse).map((request) => ({
        id: request.id,
        kind: "ACCESS_REQUEST",
        employeeName: request.employeeCode ? `Employee ${request.employeeCode}` : `Employee ${request.employeeId}`,
        employeeId: request.employeeCode || request.employeeId,
        request: `Access request - ${request.systemName}`,
        submittedOn: request.createdAt,
        status: request.status,
        remark: request.remarks,
      }));

      setApprovals([...onboardingApprovals, ...accessRequestApprovals]);
      setLoaded(true);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to load approvals."));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (requestStartedRef.current) return;
    requestStartedRef.current = true;
    loadApprovals();
  }, [loadApprovals]);

  const updateApproval = async (approval, status, remarkText) => {
    try {
      if (approval.kind === "ACCESS_REQUEST") {
        await apiClient.patch(`/access-requests/${approval.id}/status`, {
          status: normalizeApprovalStatus(status),
          remarks: remarkText,
        });
        await loadApprovals();
        showToast(`Access request ${normalizeApprovalStatus(status) === "APPROVED" ? "accepted" : "rejected"} successfully`);
        return true;
      }

      const employeeId = approval.employeeDatabaseId || approval.id;
      const action = normalizeApprovalStatus(status) === "APPROVED"
        ? approvalService.approveManagerOnboarding
        : approvalService.rejectManagerOnboarding;
      await action(employeeId, remarkText);
      await loadApprovals();
      showToast(`Onboarding request ${normalizeApprovalStatus(status) === "APPROVED" ? "approved" : "rejected"} successfully`);
      return true;
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to record manager approval decision."));
      return false;
    }
  };

  const openDecisionModal = (approval, status) => {
    setDecision({ approval, status });
    setRemark(status === "Approved"
      ? approval.kind === "ACCESS_REQUEST" ? "Accepted for IT provisioning" : "Approved for HR verification"
      : "");
    setRemarkError("");
  };

  const closeDecisionModal = () => {
    setDecision(null);
    setRemark("");
    setRemarkError("");
  };

  const submitDecision = async (event) => {
    event.preventDefault();

    if (!remark.trim()) {
      setRemarkError("Manager remarks are required.");
      return;
    }

    const saved = await updateApproval(decision.approval, decision.status, remark.trim());
    if (saved) closeDecisionModal();
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b border-[#222533] p-6 bg-[#0D0E12]/20">
          <h2 className="text-xl font-bold text-[#F8FAFC]">Approval Queue</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">Approve or reject department onboarding review items.</p>
        </div>
        {loading && !loaded ? (
          <p className="p-6 text-sm text-[#94A3B8]">Loading approvals...</p>
        ) : approvals.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No approvals pending" text="Approval requests will appear after you add team onboardings." color="text-[#FFD76A]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Request</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Remark</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {approvals.map((approval) => {
                  const status = normalizeApprovalStatus(approval.status);
                  const statusTone = status.toLowerCase();

                  return (
                  <tr key={`${approval.kind}-${approval.id}`} className="transition hover:bg-[#191C26]/20">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-[#F8FAFC]">{approval.employeeName || "Unknown employee"}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">{approval.employeeId || "N/A"}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{approval.request || "Access request"}</td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{formatDate(approval.submittedOn)}</td>
                    <td className="px-6 py-5">
                      <Badge tone={statusTone}>{status}</Badge>
                    </td>
                    <td className="max-w-[260px] px-6 py-5 text-sm leading-6 text-[#94A3B8]">{approval.remark || "-"}</td>
                    <td className="px-6 py-5">
                      {isActionableApproval(status) ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openDecisionModal(approval, "Approved")}
                            className="rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition duration-200 px-3 py-2 text-sm font-bold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecisionModal(approval, "Rejected")}
                            className="rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition duration-200 px-3 py-2 text-sm font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-full border border-[#222533] bg-[#191C26] px-3 py-1 text-xs font-semibold text-[#94A3B8]">
                          No action needed
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {decision ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg scale-100 rounded-xl border border-[#222533] bg-[#13151D] p-6 shadow-2xl shadow-black/80 transition duration-200 ease-out animate-[modalIn_180ms_ease-out]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-rose-400">{decision.approval.employeeName}</p>
                <h3 className="mt-2 text-2xl font-bold text-[#F8FAFC]">{decision.status} Request</h3>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{decision.approval.request}</p>
              </div>
              <button
                type="button"
                onClick={closeDecisionModal}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[#222533] text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]"
                aria-label="Close approval modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6" onSubmit={submitDecision}>
              <label htmlFor="manager-approval-remark" className="text-sm font-semibold text-[#F8FAFC]">
                Manager remarks
              </label>
              <textarea
                id="manager-approval-remark"
                value={remark}
                onChange={(event) => {
                  setRemark(event.target.value);
                  setRemarkError("");
                }}
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                placeholder="Add your approval or rejection notes"
              />
              {remarkError ? <p className="mt-2 text-sm text-rose-400">{remarkError}</p> : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDecisionModal}
                  className="rounded-md border border-[#222533] px-5 py-3 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-md px-5 py-3 text-sm font-bold text-white transition duration-200 ${
                    decision.status === "Approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  Submit {decision.status}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Reports({ showToast }) {
  const [report, setReport] = useState({
    pendingTasks: 0,
    approved: 0,
    rejected: 0,
  });
  const [activeReport, setActiveReport] = useState("");
  const [reportRows, setReportRows] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const requestStartedRef = useRef(false);

  const reportCards = [
    {
      id: "pending-tasks",
      title: "Pending Tasks Report",
      description: "Generate open onboarding task rows.",
      empty: "No pending task rows found.",
      load: reportService.getManagerPendingTasksReport,
      columns: [
        { label: "Employee ID", render: (row) => row.employeeCode || "N/A" },
        { label: "Task", render: (row) => row.title || "N/A" },
        { label: "Assigned Role", render: (row) => formatEnumLabel(row.assignedRole) },
        { label: "Due Date", render: (row) => formatDate(row.dueDate) },
      ],
    },
    {
      id: "approvals",
      title: "Approval Report",
      description: "Generate approved and rejected review rows.",
      empty: "No approval report rows found.",
      load: reportService.getManagerApprovalsReport,
      columns: [
        { label: "Employee ID", render: (row) => row.employeeCode || "N/A" },
        { label: "Type", render: (row) => formatEnumLabel(row.type) },
        {
          label: "Status",
          render: (row) => {
            const status = normalizeApprovalStatus(row.status);
            return <Badge tone={status.toLowerCase()}>{formatEnumLabel(status)}</Badge>;
          },
        },
        { label: "Approver", render: (row) => row.approver || "N/A" },
      ],
    },
  ];

  const selectedReport = reportCards.find((item) => item.id === activeReport);

  useEffect(() => {
    if (requestStartedRef.current) return;
    requestStartedRef.current = true;

    const loadReports = async () => {
      setLoading(true);
      try {
        setReport(await reportService.getManagerReport());
        setLoaded(true);
      } catch (err) {
        showToast(getApiErrorMessage(err, "Unable to load reports."));
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [showToast]);

  const generateReport = async (reportConfig) => {
    setActiveReport(reportConfig.id);
    setIsGeneratingReport(true);
    setReportError("");
    setReportRows([]);

    try {
      setReportRows(await reportConfig.load());
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to generate report.");
      setReportError(message);
      showToast(message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#F8FAFC]">Pending Tasks</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">Open onboarding tasks from the reports API.</p>
          <p className="mt-6 text-4xl font-bold text-indigo-400">{report.pendingTasks}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#F8FAFC]">Approval Summary</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">Approved and rejected review items.</p>
          <p className="mt-6 text-sm text-emerald-400">Approved: {report.approved}</p>
          <p className="mt-2 text-sm text-rose-400">Rejected: {report.rejected}</p>
        </Card>
        {loading && !loaded ? (
          <Card className="p-6 lg:col-span-2">
            <p className="text-sm text-[#94A3B8]">Loading reports...</p>
          </Card>
        ) : report.pendingTasks === 0 && report.approved === 0 && report.rejected === 0 ? (
          <Card className="p-6 lg:col-span-2">
            <p className="text-sm text-[#94A3B8]">No report data available yet.</p>
          </Card>
        ) : null}
      </div>

      {reportError ? (
        <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
          {reportError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {reportCards.map((reportConfig) => (
          <Card key={reportConfig.id} className="p-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">{reportConfig.title}</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">{reportConfig.description}</p>
            <button
              type="button"
              onClick={() => generateReport(reportConfig)}
              disabled={isGeneratingReport}
              className="mt-5 rounded-md bg-[#6366F1] px-4 py-3 text-sm font-bold text-white transition duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingReport && activeReport === reportConfig.id ? "Generating..." : "Generate Report"}
            </button>
          </Card>
        ))}
      </div>

      {selectedReport ? (
        <Card className="overflow-hidden">
          <div className="border-b border-[#222533] bg-[#0D0E12]/20 p-6">
            <h2 className="text-xl font-bold text-[#F8FAFC]">{selectedReport.title}</h2>
          </div>
          {reportRows.length === 0 ? (
            <div className="p-8 text-sm text-[#94A3B8]">{selectedReport.empty}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-[#222533] bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8]">
                  <tr>
                    {selectedReport.columns.map((column) => (
                      <th key={column.label} className="px-6 py-4">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                  {reportRows.map((row, rowIndex) => (
                    <tr key={row.approvalId || row.taskId || row.employeeCode || rowIndex}>
                      {selectedReport.columns.map((column) => (
                        <td key={column.label} className="px-6 py-5 text-sm text-[#94A3B8]">
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function SettingsPage({ userName, setUserName, showToast }) {
  const [employeeId, setEmployeeId] = useState(getStoredEmployeeId());
  const [profileForm, setProfileForm] = useState({
    fullName: userName,
    email: localStorage.getItem("userEmail") || "",
    phone: loadRoleSettings(normalizeUserRole(localStorage.getItem("userRole"))).profileForm?.phone || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const requestStartedRef = useRef(false);

  useEffect(() => {
    if (requestStartedRef.current) return;
    requestStartedRef.current = true;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const profile = await userProfileService.getCurrentUserProfile();
        setEmployeeId(profile.employeeId || "Not assigned");
        setProfileForm((current) => ({
          ...current,
          fullName: profile.fullName || current.fullName,
          email: profile.email || current.email,
          phone: profile.phoneNumber || current.phone,
        }));
      } catch (err) {
        showToast(getApiErrorMessage(err, "Unable to load profile."));
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [showToast]);

  const saveProfile = async () => {
    const fullName = profileForm.fullName.trim();
    const phoneNumber = profileForm.phone.trim();

    if (!fullName) {
      showToast("Full name is required");
      return;
    }

    if (phoneNumber && !/^[+()\-\s0-9]{7,20}$/.test(phoneNumber)) {
      showToast("Enter a valid phone number");
      return;
    }

    setProfileLoading(true);
    try {
      const updatedProfile = await userProfileService.updateCurrentUserProfile({ fullName, phoneNumber });
      const normalizedRole = normalizeUserRole(localStorage.getItem("userRole"));
      const existingSettings = loadRoleSettings(normalizedRole);
      const nextForm = {
        fullName: updatedProfile.fullName || fullName,
        email: updatedProfile.email || profileForm.email,
        phone: updatedProfile.phoneNumber || "",
      };

      saveRoleSettings(normalizedRole, {
        ...existingSettings,
        userName: nextForm.fullName,
        userEmail: nextForm.email,
        profileForm: nextForm,
      });
      localStorage.setItem("userName", nextForm.fullName);
      if (nextForm.email) {
        localStorage.setItem("userEmail", nextForm.email);
      }
      setEmployeeId(updatedProfile.employeeId || "Not assigned");
      setProfileForm(nextForm);
      setUserName(nextForm.fullName);
      notifyUserProfileUpdated(updatedProfile);
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to update profile."));
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F8FAFC]">Account Settings</h2>
      <Card className="p-6">
        <h3 className="text-lg font-bold text-[#F8FAFC]">Profile Information</h3>
        {profileLoading ? <p className="mt-3 text-sm text-[#94A3B8]">Loading profile...</p> : null}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Full Name" id="manager-settings-name">
            <input id="manager-settings-name" type="text" value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] px-4 py-3 text-sm transition" />
          </Field>
          <Field label="Email" id="manager-settings-email">
            <input id="manager-settings-email" type="email" value={profileForm.email} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm text-[#94A3B8] outline-none" />
          </Field>
          <Field label="Employee ID" id="manager-settings-employee-id">
            <input id="manager-settings-employee-id" type="text" value={employeeId} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm text-[#94A3B8] outline-none" />
          </Field>
          <Field label="Phone Number" id="manager-settings-phone">
            <input id="manager-settings-phone" type="text" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] px-4 py-3 text-sm transition" />
          </Field>
        </div>
        <button type="button" onClick={saveProfile} disabled={profileLoading} className="mt-5 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-bold disabled:opacity-60">
          {profileLoading ? "Saving..." : "Update Profile"}
        </button>
      </Card>

      <Card className="p-6">
        <ThemeSettingsPanel />
      </Card>

      <Card className="p-6">
        <ChangePasswordSection idPrefix="manager" showToast={showToast} />
      </Card>
    </div>
  );
}

function NotificationsView({ showToast, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const requestStartedRef = useRef(false);

  const categories = ["All", "Access Requests", "IT Credentials", "Documents", "Approvals", "Team Updates"];

  const syncUnreadCount = useCallback((items) => {
    onUnreadCountChange(items.filter((item) => !item.read).length);
  }, [onUnreadCountChange]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const managerNotifications = await notificationService.listNotifications({ recipientRole: "Department Manager" });
      setNotifications(managerNotifications);
      syncUnreadCount(managerNotifications);
      setLoaded(true);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [showToast, syncUnreadCount]);

  useEffect(() => {
    if (requestStartedRef.current) return;
    requestStartedRef.current = true;
    loadNotifications();
  }, [loadNotifications]);

  const markNotificationRead = async (id, updates) => {
    if (!updates?.read) return;

    try {
      const updated = await notificationService.markNotificationRead(id);
      setNotifications((current) => {
        const next = current.map((item) => item.id === id ? updated : item);
        syncUnreadCount(next);
        return next;
      });
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to mark notification as read."));
    }
  };

  const deleteNotificationLocal = (id) => {
    setNotifications((current) => {
      const next = current.filter((item) => item.id !== id);
      syncUnreadCount(next);
      return next;
    });
  };

  const markAllNotificationsRead = async () => {
    try {
      const updated = await notificationService.markAllNotificationsRead({ recipientRole: "Department Manager" });
      setNotifications(updated);
      syncUnreadCount(updated);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to mark notifications as read."));
    }
  };

  const getCategoryFromMsg = (msg) => {
    const text = msg.toLowerCase();
    if (text.includes("document") || text.includes("upload") || text.includes("aadhaar")) return "Documents";
    if (text.includes("approv") || text.includes("reject")) return "Approvals";
    if (text.includes("access") || text.includes("slack") || text.includes("github") || text.includes("request")) return "Access Requests";
    if (text.includes("credential") || text.includes("login") || text.includes("password") || text.includes("it manager")) return "IT Credentials";
    return "Team Updates";
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch = n.msg.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = filterCategory === "All" || getCategoryFromMsg(n.msg) === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [notifications, search, filterCategory]);

  const getIconForCategory = (category) => {
    switch (category) {
      case "Access Requests": return <ClipboardCheck className="h-5 w-5 text-[#8B5CF6]" />;
      case "IT Credentials": return <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />;
      case "Documents": return <FileText className="h-5 w-5 text-[#3B82F6]" />;
      case "Approvals": return <CheckCircle2 className="h-5 w-5 text-[#10B981]" />;
      case "Team Updates": return <Users className="h-5 w-5 text-[#6366F1]" />;
      default: return <Bell className="h-5 w-5 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Notifications</h2>
          <p className="text-sm text-[#94A3B8]">Manage your department alerts and updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#222533]"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filterCategory === cat
                  ? "bg-[#6366F1] text-white"
                  : "bg-[#191C26] text-[#94A3B8] hover:bg-[#222533] hover:text-[#F8FAFC]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[#222533] bg-[#191C26] py-2 pl-9 pr-4 text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {loading && !loaded ? (
          <p className="rounded-xl border border-[#222533] bg-[#13151D] p-6 text-sm text-[#94A3B8]">Loading notifications...</p>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#222533] bg-[#13151D] py-16 text-center">
            <Bell className="h-12 w-12 text-[#94A3B8] mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-[#F8FAFC]">No notifications</h3>
            <p className="mt-1 text-sm text-[#94A3B8]">You're all caught up! There are no matching notifications.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const category = getCategoryFromMsg(notif.msg);
            
            return (
              <div
                key={notif.id}
                className={`notification-item group relative flex items-start gap-4 rounded-xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                  notif.read ? "border-[#222533] bg-[#13151D]" : "border-indigo-500/30 bg-[#13151D]/80 backdrop-blur"
                }`}
              >
                {!notif.read && (
                  <span className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rounded-full bg-[#6366F1] shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#191C26]">
                  {getIconForCategory(category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <p className={`notification-title font-semibold truncate ${notif.read ? "text-[#94A3B8]" : "text-[#F8FAFC]"}`}>
                      {category} Alert
                    </p>
                    <span className="text-xs font-medium text-[#94A3B8] shrink-0">
                      {notif.createdAt || notif.time
                        ? formatDistanceToNow(new Date(notif.createdAt || notif.time), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </span>
                  </div>
                  <p className={`notification-description text-sm ${notif.read ? "text-[#64748B]" : "text-[#CBD5E1]"}`}>
                    {notif.msg}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-center sm:self-start opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                  {!notif.read && (
                    <button
                      onClick={() => markNotificationRead(notif.id, { read: true })}
                      className="rounded p-1.5 text-[#94A3B8] hover:bg-emerald-500/10 hover:text-emerald-400 transition"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotificationLocal(notif.id)}
                    className="rounded p-1.5 text-[#94A3B8] hover:bg-rose-500/10 hover:text-rose-400 transition"
                    title="Delete notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
