import {
  BarChart2,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  FolderKey,
  FolderPlus,
  GitBranch,
  Grid,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  PieChart,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  UserPlus,
  Users,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadRoleSettings, normalizeUserRole, saveRoleSettings, logoutPreservingSettings } from "../../utils/roleSettings";
import { getApiErrorMessage } from "../../services/apiClient";
import { db } from "../../services/apiDataService";
import { systemCatalogService } from "../../services/systemCatalogService";
import { mapEmployee } from "../../services/employeeService";
import { notificationService } from "../../services/notificationService";
import { auditLogService } from "../../services/auditLogService";
import { dashboardService } from "../../services/dashboardService";
import { notifyUserProfileUpdated, userProfileService } from "../../services/userProfileService";
import { platformSettingsService } from "../../services/platformSettingsService";
import { fetchWithAuth } from "../../services/authSession";
import { useAuth } from "../../context/AuthContext";
import UserProfileMenu from "../../components/UserProfileMenu";
import ChangePasswordSection from "../../components/ChangePasswordSection";
import ThemeToggle, { ThemeSettingsPanel } from "../../components/ThemeToggle";

const C = {
  bg: "#08090C",
  bg2: "#13151D",
  bg3: "#191C26",
  bg4: "#0D0E12",
  border: "#222533",
  border2: "#222533",
  border3: "#222533",
  indigo: "#6366F1",
  indigo2: "#EC4899",
  teal: "#6366F1",
  amber: "#3B82F6",
  coral: "#EF4444",
  green: "#10B981",
  violet: "#8B5CF6",
  txt: "#F8FAFC",
  txt2: "#94A3B8",
  txt3: "#94A3B8",
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Users & Roles", icon: Users },
  { label: "Workflow Config", icon: GitBranch },
  { label: "Access Categories", icon: FolderKey },
  { label: "System Catalog Approvals", icon: FolderPlus },
  { label: "Reports", icon: BarChart2 },
  { label: "Audit Logs", icon: ClipboardList },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];

const roles = ["Employee", "HR Manager", "Department Manager", "IT Manager", "Admin"];
const REPORT_ROLE_ORDER = ["Employee", "HR Manager", "Department Manager", "IT Manager", "System Admin"];
const departments = ["IT", "HR", "Manager", "Employee"];
const categoryAccessLevels = ["Public", "Internal", "Confidential", "Restricted"];
const AUTH_API_BASE = "http://localhost:8081/api";
const EMPLOYEE_API_BASE = "http://localhost:8082/api";
const adminPageLoadState = { loaded: new Set(), inFlight: new Map() };

const emptyUserForm = {
  name: "",
  email: "",
  role: "Employee",
  department: "IT",
  phone: "",
  startDate: "",
  password: "",
};

const CONSTANT_WORKFLOW = [
  { id: 1, name: "HR", role: "HR Manager", description: "HR initiates onboarding.", required: true, order: 1 },
  { id: 2, name: "Employee", role: "Employee", description: "Employee completes required tasks and documents.", required: true, order: 2 },
  { id: 3, name: "Manager Approval", role: "Department Manager", description: "Manager performs approval.", required: true, order: 3 },
  { id: 4, name: "IT Provisioning", role: "IT Administrator", description: "IT handles provisioning and setup.", required: true, order: 4 },
];

const WORKFLOW_STEP_ACTIONS = {
  HR: [
    "Create employee onboarding records",
    "Verify submitted employee documents",
    "Track onboarding progress and pending tasks",
  ],
  Employee: [
    "Complete personal details and policy acknowledgments",
    "Upload required documents",
    "Complete assigned training modules",
  ],
  "Manager Approval": [
    "Review employee access requests",
    "Approve or reject manager-level requests",
    "Monitor team onboarding status",
  ],
  "IT Provisioning": [
    "Provision approved system access",
    "Generate and share system credentials",
    "Handle access deactivation when needed",
  ],
};

const CONSTANT_CATEGORIES = [
  { id: "cat-1", name: "IT Systems", accessLevel: "Restricted", roles: ["IT Manager", "Admin"], description: "Core IT infrastructure and administrative tools.", approvalRequired: true, systemCount: 8, status: "Active" },
  { id: "cat-2", name: "HR Records", accessLevel: "Confidential", roles: ["HR Manager", "Admin"], description: "Employee records and HR documents.", approvalRequired: true, systemCount: 3, status: "Active" },
  { id: "cat-3", name: "Finance Systems", accessLevel: "Confidential", roles: ["Admin"], description: "Financial tools and accounting systems.", approvalRequired: true, systemCount: 2, status: "Active" },
  { id: "cat-4", name: "Employee Portal", accessLevel: "Internal", roles: ["Employee", "HR Manager", "Admin"], description: "General company resources and intranet.", approvalRequired: false, systemCount: 5, status: "Active" },
];

const td = "px-5 py-4 text-sm text-[#94A3B8] border-b border-[#222533]";
const btnStyle = "inline-flex items-center justify-center rounded-md border border-[#222533] bg-[#13151D] px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26] hover:text-[#F8FAFC]";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function today() {
  return new Date().toISOString().slice(0, 10);
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

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatRelativeTime(value) {
  const time = typeof value === "number" ? value : new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return "";
  }

  const seconds = Math.max(1, Math.floor((Date.now() - time) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function formatLastLogin(value) {
  if (!value) {
    return "Never";
  }

  const time = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(time) ? timeAgo(time) : "Never";
}

function unwrapApiResponse(payload) {
  return payload?.data ?? payload;
}

function formatUserRole(role) {
  const normalized = String(role || "EMPLOYEE").toUpperCase();
  const labels = {
    ADMIN: "Admin",
    HR_MANAGER: "HR Manager",
    DEPARTMENT_MANAGER: "Department Manager",
    IT_ADMIN: "IT Manager",
    IT_MANAGER: "IT Manager",
    EMPLOYEE: "Employee",
  };
  return labels[normalized] || role || "Employee";
}

function formatReportUserRole(role) {
  const normalized = String(role || "EMPLOYEE").replace(/^ROLE_/i, "").toUpperCase();
  const labels = {
    ADMIN: "System Admin",
    SYSTEM_ADMIN: "System Admin",
    HR_MANAGER: "HR Manager",
    DEPARTMENT_MANAGER: "Department Manager",
    IT_ADMIN: "IT Manager",
    IT_MANAGER: "IT Manager",
    EMPLOYEE: "Employee",
  };
  return labels[normalized] || "Employee";
}

function buildRoleDistribution(users) {
  const counts = REPORT_ROLE_ORDER.reduce((acc, role) => ({ ...acc, [role]: 0 }), {});

  users.forEach((user) => {
    const role = formatReportUserRole(user.roles?.[0]);
    counts[role] = (counts[role] || 0) + 1;
  });

  const total = users.length;
  return REPORT_ROLE_ORDER.map((role) => ({
    role,
    count: counts[role] || 0,
    percentage: total ? Math.round(((counts[role] || 0) / total) * 100) : 0,
  }));
}

function isDemoRecentUser(record) {
  const text = `${record.name || ""} ${record.email || ""}`.toLowerCase();
  return text.includes("demo") || text.includes("@demo.");
}

function recentUserSortValue(record) {
  const timestamp = new Date(record.createdAt || record.updatedAt || record.startDate || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatUserStatus(user, employee) {
  const employeeStatus = String(employee?.status || "").toUpperCase();

  if (employeeStatus === "DEACTIVATED" || employeeStatus === "INACTIVE") {
    return employeeStatus;
  }

  return user?.isActive === false ? "INACTIVE" : "ACTIVE";
}

function formatOnboardingStatus(status) {
  const normalized = String(status || "").toUpperCase();
  const labels = {
    COMPLETED: "Completed",
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    PENDING_APPROVAL: "Pending Approval",
  };
  return labels[normalized] || (status ? String(status).replaceAll("_", " ") : "Not Linked");
}

function catalogToAccessCategory(catalog) {
  return {
    id: `catalog-${catalog.id}`,
    catalogId: catalog.id,
    name: catalog.name,
    accessLevel: catalog.accessLevels || "Internal",
    roles: ["Employee"],
    description: catalog.description,
    approvalRequired: true,
    systemCount: 1,
    status: "Active",
    category: catalog.category,
    owner: catalog.owner,
    activeUsers: 0,
    activeUserRecords: [],
  };
}

function isActiveAccessUser(record) {
  return String(record.employeeStatus || "ACTIVE").toUpperCase() === "ACTIVE"
    && String(record.accessStatus || "").toLowerCase() === "provisioned";
}

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function mapEmployeeReportRow(employee) {
  return {
    id: employee.databaseId || employee.id,
    employeeCode: employee.employeeId || employee.id || "",
    name: employee.name || "",
    role: employee.jobTitle || employee.position || employee.role || "",
    department: employee.departmentName || employee.department || "",
    startDate: employee.startDate || "",
    onboardingStatus: employee.status || "Initiated",
    accountStatus: employee.accountStatus || "ACTIVE",
  };
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createIp() {
  return `192.168.1.${Math.floor(100 + Math.random() * 156)}`;
}

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-[#222533] bg-[#13151D] ${className}`}>{children}</section>;
}

function Field({ id, label, children }) {
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
  const tones = {
    pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    inactive: "border-rose-500/25 bg-rose-500/10 text-rose-400",
    indigo: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    coral: "border-rose-500/25 bg-rose-500/10 text-rose-400",
    teal: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
  };

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.indigo}`}>{children}</span>;
}

function ProgressBar({ value }) {
  const color = value > 75 ? "bg-[#10B981]" : value > 50 ? "bg-[#3B82F6]" : "bg-[#EC4899]";

  return (
    <div className="min-w-[140px]">
      <div className="h-2 overflow-hidden rounded-full bg-[#191C26]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-[#94A3B8]">{value}%</p>
    </div>
  );
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

function Toast({ message, visible }) {
  return (
    <div
      className={`fixed right-5 top-5 z-[70] rounded-md border border-[#EC4899]/20 bg-[#13151D] px-4 py-3 text-sm font-semibold text-[#F8FAFC] shadow-2xl shadow-black/55 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      {message}
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    Employee: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    "HR Manager": "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    "Department Manager": "border-amber-500/25 bg-amber-500/10 text-amber-400",
    "IT_MANAGER": "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
    "IT Manager": "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
    "it_manager": "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
    "System Admin": "border-rose-500/25 bg-rose-500/10 text-rose-400",
  };
  const displayLabels = { 
    "IT_MANAGER": "IT Manager",
    "it_manager": "IT Manager"
  };
  const label = displayLabels[role] || role;

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colors[role] || colors.Employee}`}>{label}</span>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, addUser, updateUser, deleteUser, toggleUserStatus: toggleContextUserStatus, refreshUsers, logout: logoutFromContext } = useAuth();
  const hasLoadedInitialDashboardRef = useRef(false);
  const previousActivePageRef = useRef(null);
  const pageLoadStateRef = useRef(adminPageLoadState);
  const accessCategoryUserDetailsRef = useRef(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("System Admin");
  const [userEmail, setUserEmail] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentUsersError, setRecentUsersError] = useState("");
  const [isRecentUsersLoading, setIsRecentUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersPageUsers, setUsersPageUsers] = useState([]);
  const [usersPageError, setUsersPageError] = useState("");
  const [isUsersPageLoading, setIsUsersPageLoading] = useState(false);
  const [accessCategories, setAccessCategories] = useState([]);
  const [accessCategoriesError, setAccessCategoriesError] = useState("");
  const [isAccessCategoriesLoading, setIsAccessCategoriesLoading] = useState(false);
  const [selectedAccessCategory, setSelectedAccessCategory] = useState(null);
  const [isAccessCategoryDetailsLoading, setIsAccessCategoryDetailsLoading] = useState(false);
  const [accessCategoryDetailsError, setAccessCategoryDetailsError] = useState("");
  const [catalogApprovals, setCatalogApprovals] = useState([]);
  const [catalogApprovalError, setCatalogApprovalError] = useState("");
  const [selectedCatalogApproval, setSelectedCatalogApproval] = useState(null);
  const [rejectCatalogTarget, setRejectCatalogTarget] = useState(null);
  const [catalogRejectionReason, setCatalogRejectionReason] = useState("");
  const [auditLog, setAuditLog] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportEmployees, setReportEmployees] = useState([]);
  const [reportRoleDistribution, setReportRoleDistribution] = useState([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState("");
  const [deleteConfirmType, setDeleteConfirmType] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAudit, setFilterAudit] = useState("All");
  const [auditSearch, setAuditSearch] = useState("");
  const [reportVisible, setReportVisible] = useState("");
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoAssignIds: true,
    auditRetention: false,
  });
  const [profileName, setProfileName] = useState("System Admin");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userFormErrors, setUserFormErrors] = useState({});
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const notificationQueryScopes = () => {
    const scopes = [{ recipientRole: "Admin" }, { recipientRole: "System Admin" }];
    const email = userEmail || localStorage.getItem("userEmail");

    if (email) {
      scopes.push({ recipientEmail: email });
    }

    return scopes;
  };

  const mergeNotifications = (groups) => {
    const byId = new Map();
    groups.flat().forEach((notification) => {
      if (notification?.id != null) {
        byId.set(notification.id, notification);
      }
    });
    return Array.from(byId.values()).sort((a, b) => (b.time || 0) - (a.time || 0));
  };

  const hasPageData = (pageKey) => {
    if (pageKey === "Dashboard") {
      return users.length > 0 || recentUsers.length > 0 || notifications.length > 0 || auditLog.length > 0;
    }
    if (pageKey === "Users & Roles") {
      return usersPageUsers.length > 0;
    }
    if (pageKey === "Access Categories") {
      return accessCategories.length > 0;
    }
    if (pageKey === "System Catalog Approvals") {
      return catalogApprovals.length > 0 || Boolean(catalogApprovalError);
    }
    if (pageKey === "Reports") {
      return reportEmployees.length > 0 || reportRoleDistribution.length > 0 || auditLog.length > 0;
    }
    if (pageKey === "Audit Logs") {
      return auditLog.length > 0;
    }
    if (pageKey === "Notifications") {
      return notifications.length > 0;
    }
    return true;
  };

  const runPageLoader = (pageKey, loader, { force = false } = {}) => {
    const { loaded, inFlight } = pageLoadStateRef.current;

    if (!force && loaded.has(pageKey) && hasPageData(pageKey)) {
      return Promise.resolve();
    }

    if (inFlight.has(pageKey)) {
      return inFlight.get(pageKey);
    }

    const request = Promise.resolve()
      .then(loader)
      .then((result) => {
        loaded.add(pageKey);
        return result;
      })
      .finally(() => {
        inFlight.delete(pageKey);
      });

    inFlight.set(pageKey, request);
    return request;
  };

  const loadNotificationsData = async () => {
    try {
      const nextNotifications = mergeNotifications([await notificationService.listNotifications()]);
      setNotifications(nextNotifications);
      return nextNotifications;
    } catch (err) {
      console.error("[Admin Notifications] Unable to load notifications", err);
      return notifications;
    }
  };

  const refreshAdminNotifications = () => loadNotificationsData();

  const buildUnifiedUsers = (employees = []) => {
    let registeredUsers = {};
    try {
      registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
    } catch (err) {
      console.error("Failed to parse registeredUsers", err);
    }
    
    return Object.entries(registeredUsers).map(([email, userObj]) => {
      const emp = employees.find(e => e.email.toLowerCase().trim() === email.toLowerCase().trim());
      const normalizedRole = normalizeUserRole(userObj.role);
      
      return {
        id: emp ? emp.id : (userObj.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`),
        backendUserId: userObj.id || "",
        name: userObj.name || (emp ? emp.name : ""),
        email: email,
        role: normalizedRole,
        department: emp ? emp.department : (userObj.department || "Admin"),
        phone: emp ? emp.phone : (userObj.phone || ""),
        startDate: emp ? emp.startDate : (userObj.startDate || "2025-01-01"),
        status: userObj.status || "Active",
        onboardingComplete: emp ? emp.onboardingComplete : true,
        lastLogin: userObj.lastLogin || null,
        createdOn: userObj.createdOn || "2025-01-01",
      };
    });
  };

  const buildDashboardUsers = (authUsers = [], employees = []) => {
    const employeeByCode = new Map();
    const employeeByEmail = new Map();

    employees.forEach((employee) => {
      const code = employee.employeeId || employee.employeeCode || employee.id || employee.raw?.employeeCode;
      const email = employee.email || employee.raw?.email;
      if (code) {
        employeeByCode.set(String(code).toLowerCase(), employee);
      }
      if (email) {
        employeeByEmail.set(String(email).toLowerCase(), employee);
      }
    });

    return authUsers.map((user) => {
      const employee = employeeByCode.get(String(user.employeeId || "").toLowerCase())
        || employeeByEmail.get(String(user.email || "").toLowerCase());
      const status = formatUserStatus(user, employee);
      const onboardingStatus = formatOnboardingStatus(employee?.onboardingStatus || employee?.status);

      return {
        id: user.id || employee?.id || createId(),
        backendUserId: user.id || "",
        name: user.username || employee?.name || "",
        email: user.email || employee?.email || "",
        role: formatUserRole(user.roles?.[0]),
        department: employee?.departmentName || employee?.department || "Admin",
        phone: employee?.phone || "",
        startDate: employee?.startDate || "",
        status: status === "ACTIVE" ? "Active" : "Inactive",
        onboardingComplete: onboardingStatus === "Completed",
        lastLogin: user.lastLogin || null,
        createdOn: user.createdAt || employee?.createdAt || "",
      };
    });
  };

  const loadDashboardData = async () => {
    setIsDashboardLoading(true);
    setDashboardError("");

    try {
      const [summary, authUsers, rawEmployees, dashboardNotifications, dashboardAuditLogs] = await Promise.all([
        dashboardService.getAdminDashboardSummary().catch((err) => {
          console.error("[Admin Dashboard] Summary API failed; using calculated metrics", err);
          return null;
        }),
        fetchAdminJson(`${AUTH_API_BASE}/users`, "Dashboard - users"),
        fetchAdminJson(`${EMPLOYEE_API_BASE}/employees`, "Dashboard - employees"),
        notificationService.listNotifications(),
        auditLogService.listAuditLogs().catch((err) => {
          console.error("[Admin Dashboard] Unable to load recent activity from audit logs", err);
          return [];
        }),
      ]);
      const employees = rawEmployees.map(mapEmployee);
      const dashboardUsers = buildDashboardUsers(authUsers, employees);

      setDashboardSummary(summary);
      setUsers(dashboardUsers.length ? dashboardUsers : buildUnifiedUsers(employees));
      await refreshRecentUsers(employees, authUsers);
      setNotifications(mergeNotifications([dashboardNotifications]));
      setAuditLog(dashboardAuditLogs);
    } catch (err) {
      console.error("[Admin Dashboard] Initial load failed", err);
      setDashboardError(getApiErrorMessage(err, "Unable to load dashboard data."));
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const loadUsersPageData = async () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      setUsersPageUsers([]);
      setUsersPageError("Sign in again to load users.");
      return;
    }

    setIsUsersPageLoading(true);
    setUsersPageError("");

    try {
      const [usersResponse, employeesResponse] = await Promise.all([
        fetchWithAuth(`${AUTH_API_BASE}/users`),
        fetchWithAuth(`${EMPLOYEE_API_BASE}/employees`),
      ]);

      const usersPayload = await usersResponse.json().catch(() => ({}));
      const employeesPayload = await employeesResponse.json().catch(() => ({}));

      if (!usersResponse.ok || usersPayload.success === false) {
        throw new Error(usersPayload.message || "Unable to load users.");
      }

      if (!employeesResponse.ok || employeesPayload.success === false) {
        throw new Error(employeesPayload.message || "Unable to load employee details.");
      }

      const employeeList = unwrapApiResponse(employeesPayload) || [];
      const employeeByCode = new Map();
      const employeeByEmail = new Map();

      employeeList.forEach((employee) => {
        if (employee.employeeCode) {
          employeeByCode.set(String(employee.employeeCode).toLowerCase(), employee);
        }
        if (employee.email) {
          employeeByEmail.set(String(employee.email).toLowerCase(), employee);
        }
      });

      const mappedUsers = (unwrapApiResponse(usersPayload) || []).map((user) => {
        const employee = employeeByCode.get(String(user.employeeId || "").toLowerCase())
          || employeeByEmail.get(String(user.email || "").toLowerCase());
        const role = formatUserRole(user.roles?.[0]);
        const status = formatUserStatus(user, employee);

        return {
          id: user.id,
          name: user.username || employee?.fullName || "",
          employeeCode: user.employeeId || employee?.employeeCode || "",
          email: user.email || "",
          role,
          department: employee?.departmentName || employee?.departmentCode || "",
          status,
          lastLogin: user.lastLogin || null,
          onboardingStatus: formatOnboardingStatus(employee?.onboardingStatus),
        };
      });

      setUsersPageUsers(mappedUsers);
    } catch (err) {
      setUsersPageUsers([]);
      setUsersPageError(err.message || "Unable to load users.");
    } finally {
      setIsUsersPageLoading(false);
    }
  };

  const activeUserSummaryToMap = (summary) => {
    if (!summary) {
      return new Map();
    }

    if (Array.isArray(summary)) {
      return new Map(summary.map((item) => [
        Number(item.systemCatalogId ?? item.system_catalog_id),
        Number(item.activeUsers ?? item.active_users ?? 0),
      ]));
    }

    return new Map(Object.entries(summary).map(([systemCatalogId, activeUsers]) => [
      Number(systemCatalogId),
      Number(activeUsers || 0),
    ]));
  };

  const loadAccessCategoriesData = async () => {
    setIsAccessCategoriesLoading(true);
    setAccessCategoriesError("");

    try {
      const [systems, activeUsersSummary] = await Promise.all([
        systemCatalogService.listSystems(),
        systemCatalogService.listActiveUsersSummary(),
      ]);
      const activeUserCounts = activeUserSummaryToMap(activeUsersSummary);
      const activeSystems = systems.filter((system) => String(system.status || "").toUpperCase() === "ACTIVE");
      const categories = activeSystems.map((system) => {
        const cachedRecords = accessCategoryUserDetailsRef.current.get(Number(system.id)) || [];
        return {
          ...catalogToAccessCategory(system),
          activeUsers: activeUserCounts.get(Number(system.id)) ?? Number(system.activeUsers || 0),
          activeUserRecords: cachedRecords,
        };
      });

      setAccessCategories(categories);
      setSelectedAccessCategory((current) => {
        if (!current) {
          return null;
        }
        return categories.find((category) => category.id === current.id) || null;
      });
      return categories;
    } catch (err) {
      console.error("[Access Categories] Unable to load active user data", err);
      setAccessCategories([]);
      setAccessCategoriesError(getApiErrorMessage(err, "Unable to load access category active users."));
      return [];
    } finally {
      setIsAccessCategoriesLoading(false);
    }
  };

  const refreshAccessCategories = () => loadAccessCategoriesData();

  const openAccessCategoryUsers = async (category) => {
    const catalogId = Number(category.catalogId);
    const cachedRecords = accessCategoryUserDetailsRef.current.get(catalogId);
    setAccessCategoryDetailsError("");
    setSelectedAccessCategory({
      ...category,
      activeUserRecords: cachedRecords || category.activeUserRecords || [],
    });

    if (!catalogId || cachedRecords) {
      return;
    }

    setIsAccessCategoryDetailsLoading(true);

    try {
      const records = await systemCatalogService.listActiveUsers(catalogId);
      const activeRecords = records.filter(isActiveAccessUser);
      accessCategoryUserDetailsRef.current.set(catalogId, activeRecords);

      setAccessCategories((current) => current.map((item) => (
        Number(item.catalogId) === catalogId
          ? { ...item, activeUsers: activeRecords.length, activeUserRecords: activeRecords }
          : item
      )));
      setSelectedAccessCategory((current) => (
        current && Number(current.catalogId) === catalogId
          ? { ...current, activeUsers: activeRecords.length, activeUserRecords: activeRecords }
          : current
      ));
    } catch (err) {
      console.error("[Access Categories] Unable to load active user details", err);
      setAccessCategoryDetailsError(getApiErrorMessage(err, "Unable to load active user details."));
    } finally {
      setIsAccessCategoryDetailsLoading(false);
    }
  };

  const getAdminApiToken = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || currentUser?.token || "";

    if (token) {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("token", token);
    }

    return token;
  };

  const fetchAdminJson = async (url, label) => {
    const token = getAdminApiToken();

    if (!token) {
      const error = new Error("Authentication required. Sign in again to load data.");
      console.error(`[Admin API] ${label} failed`, error);
      throw error;
    }

    const response = await fetchWithAuth(url);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
      const message = payload.message || `${label} failed with HTTP ${response.status}`;
      const error = new Error(message);
      console.error(`[Admin API] ${label} failed`, {
        status: response.status,
        statusText: response.statusText,
        payload,
      });
      throw error;
    }

    return unwrapApiResponse(payload) || [];
  };

  const employeeCodeOf = (employee) => employee?.employeeCode || employee?.employeeId || employee?.raw?.employeeCode || "";
  const employeeEmailOf = (employee) => employee?.email || employee?.raw?.email || "";
  const employeeNameOf = (employee) => employee?.fullName || employee?.name || employee?.raw?.fullName || "";
  const employeeCreatedAtOf = (employee) => employee?.createdAt || employee?.raw?.createdAt;
  const employeeUpdatedAtOf = (employee) => employee?.updatedAt || employee?.raw?.updatedAt;
  const employeeStartDateOf = (employee) => employee?.startDate || employee?.raw?.startDate;

  const refreshRecentUsers = async (preloadedEmployees = null, preloadedUsers = null) => {
    setIsRecentUsersLoading(true);
    setRecentUsersError("");

    try {
      const [usersPayload, employeesPayload] = await Promise.all([
        preloadedUsers
          ? Promise.resolve(preloadedUsers)
          : fetchAdminJson(`${AUTH_API_BASE}/users`, "Recent Users - users"),
        preloadedEmployees
          ? Promise.resolve(preloadedEmployees)
          : fetchAdminJson(`${EMPLOYEE_API_BASE}/employees`, "Recent Users - employees"),
      ]);
      const employeeByCode = new Map();
      const employeeByEmail = new Map();

      employeesPayload.forEach((employee) => {
        const employeeCode = employeeCodeOf(employee);
        const employeeEmail = employeeEmailOf(employee);
        if (employeeCode) {
          employeeByCode.set(String(employeeCode).toLowerCase(), employee);
        }
        if (employeeEmail) {
          employeeByEmail.set(String(employeeEmail).toLowerCase(), employee);
        }
      });

      const byKey = new Map();
      usersPayload.forEach((user) => {
        const employee = employeeByCode.get(String(user.employeeId || "").toLowerCase())
          || employeeByEmail.get(String(user.email || "").toLowerCase());
        const record = {
          id: `user-${user.id}`,
          name: user.username || employeeNameOf(employee) || "",
          email: user.email || employeeEmailOf(employee) || "",
          employeeCode: user.employeeId || employeeCodeOf(employee),
          role: formatReportUserRole(user.roles?.[0]),
          status: formatUserStatus(user, employee),
          createdAt: user.createdAt || employeeCreatedAtOf(employee),
          updatedAt: employeeUpdatedAtOf(employee),
          startDate: employeeStartDateOf(employee),
        };
        const key = String(record.email || record.employeeCode || record.id).toLowerCase();
        if (!isDemoRecentUser(record)) {
          byKey.set(key, record);
        }
      });

      employeesPayload.forEach((employee) => {
        const key = String(employeeEmailOf(employee) || employeeCodeOf(employee) || employee.id).toLowerCase();
        if (byKey.has(key)) {
          return;
        }
        const record = {
          id: `employee-${employee.id}`,
          name: employeeNameOf(employee),
          email: employeeEmailOf(employee),
          employeeCode: employeeCodeOf(employee),
          role: "Employee",
          status: employee.status || "ACTIVE",
          createdAt: employeeCreatedAtOf(employee),
          updatedAt: employeeUpdatedAtOf(employee),
          startDate: employeeStartDateOf(employee),
        };
        if (!isDemoRecentUser(record)) {
          byKey.set(key, record);
        }
      });

      const nextRecentUsers = Array.from(byKey.values())
        .sort((a, b) => recentUserSortValue(b) - recentUserSortValue(a))
        .slice(0, 4);
      setRecentUsers(nextRecentUsers);
      return nextRecentUsers;
    } catch (err) {
      console.error("[Recent Users] Unable to load recent users", err);
      setRecentUsersError(err.message || "Unable to load recent users.");
      setRecentUsers([]);
      return [];
    } finally {
      setIsRecentUsersLoading(false);
    }
  };

  const refreshReportEmployees = async () => {
    setIsReportsLoading(true);
    setReportsError("");

    try {
      const employees = await fetchAdminJson(`${EMPLOYEE_API_BASE}/employees`, "Onboarding Completion Report");
      const mappedEmployees = employees.map(mapEmployee).map(mapEmployeeReportRow);
      setReportEmployees(mappedEmployees);
      return mappedEmployees;
    } catch (err) {
      console.error("[Reports] Unable to load onboarding completion data", err);
      setReportsError(getApiErrorMessage(err, "Unable to load employee report data."));
      throw err;
    } finally {
      setIsReportsLoading(false);
    }
  };

  const refreshRoleDistributionReport = async () => {
    setIsReportsLoading(true);
    setReportsError("");

    try {
      const users = await fetchAdminJson(`${AUTH_API_BASE}/users`, "Role Distribution Report");
      const distribution = buildRoleDistribution(users);
      setReportRoleDistribution(distribution);
      return distribution;
    } catch (err) {
      console.error("[Reports] Unable to load role distribution data", err);
      setReportsError(err.message || "Unable to load user role data.");
      throw err;
    } finally {
      setIsReportsLoading(false);
    }
  };

  const loadAuditLogsData = async () => {
    try {
      const logs = await auditLogService.listAuditLogs();
      setAuditLog(logs);
      return logs;
    } catch (err) {
      console.error("[Audit Logs] Unable to load audit logs", err);
      setAuditLog([]);
      return [];
    }
  };

  const loadReportsData = async () => {
    setIsReportsLoading(true);
    setReportsError("");

    try {
      const [employees, usersPayload, logs] = await Promise.all([
        fetchAdminJson(`${EMPLOYEE_API_BASE}/employees`, "Reports - employees"),
        fetchAdminJson(`${AUTH_API_BASE}/users`, "Reports - users"),
        auditLogService.listAuditLogs(),
      ]);
      const mappedEmployees = employees.map(mapEmployee).map(mapEmployeeReportRow);
      const distribution = buildRoleDistribution(usersPayload);

      setReportEmployees(mappedEmployees);
      setReportRoleDistribution(distribution);
      setAuditLog(logs);

      return { employees: mappedEmployees, roleDistribution: distribution, auditLogs: logs };
    } catch (err) {
      console.error("[Reports] Unable to load reports data", err);
      setReportsError(getApiErrorMessage(err, "Unable to load reports data."));
      throw err;
    } finally {
      setIsReportsLoading(false);
    }
  };

  const refreshCatalogApprovals = async () => {
    setCatalogApprovalError("");

    try {
      const systems = await systemCatalogService.listSystems();
      setCatalogApprovals(systems.filter((system) => {
        const status = String(system.status || "").toUpperCase();
        return ["PENDING_APPROVAL", "APPROVED", "ACTIVE", "REJECTED"].includes(status);
      }));
    } catch (err) {
      setCatalogApprovals([]);
      setCatalogApprovalError(getApiErrorMessage(err, "Unable to load catalog approvals."));
    }
  };

  const loadCurrentPageData = ({ force = true } = {}) => {
    if (activePage === "Dashboard") {
      return runPageLoader("Dashboard", loadDashboardData, { force });
    }
    if (activePage === "Users & Roles") {
      return runPageLoader("Users & Roles", loadUsersPageData, { force });
    }
    if (activePage === "Access Categories") {
      return runPageLoader("Access Categories", loadAccessCategoriesData, { force });
    }
    if (activePage === "System Catalog Approvals") {
      return runPageLoader("System Catalog Approvals", refreshCatalogApprovals, { force });
    }
    if (activePage === "Reports") {
      return runPageLoader("Reports", loadReportsData, { force });
    }
    if (activePage === "Audit Logs") {
      return runPageLoader("Audit Logs", loadAuditLogsData, { force });
    }
    if (activePage === "Notifications") {
      return runPageLoader("Notifications", loadNotificationsData, { force });
    }
    return Promise.resolve();
  };

  const refreshData = (options = {}) => loadCurrentPageData({ force: options.force ?? true });

  useEffect(() => {
    if (hasLoadedInitialDashboardRef.current) {
      return;
    }

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const normalizedRole = normalizeUserRole(role);
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const savedSettings = loadRoleSettings(normalizedRole);

    if (!token || (role !== "System Admin" && role !== "Admin")) {
      navigate("/login");
      return;
    }

    hasLoadedInitialDashboardRef.current = true;

    const nextName = savedSettings.userName || storedName || "System Admin";
    const nextEmail = savedSettings.userEmail || storedEmail || "";

    setUserName(nextName);
    setProfileName(nextName);
    setUserEmail(nextEmail);
    setSettings(savedSettings.settings || {
      emailNotifications: true,
      autoAssignIds: true,
      auditRetention: true,
    });

    platformSettingsService.getSettings()
      .then((platformSettings) => {
        setSettings((current) => ({
          ...current,
          emailNotifications: platformSettings.emailNotifications,
          autoAssignIds: platformSettings.autoAssignIds,
        }));
      })
      .catch((err) => {
        showToast(getApiErrorMessage(err, "Unable to load platform settings."));
      });
    
    runPageLoader("Dashboard", loadDashboardData);
  }, [navigate]);

  useEffect(() => {
    if (previousActivePageRef.current === activePage) {
      return;
    }

    if (previousActivePageRef.current === null) {
      previousActivePageRef.current = activePage;
      return;
    }

    previousActivePageRef.current = activePage;

    loadCurrentPageData({ force: false }).catch(() => {});
  }, [activePage]);

  const showToast = (message) => {
    setToast(message);
    setToastVisible(true);
    window.setTimeout(() => {
      setToastVisible(false);
      window.setTimeout(() => setToast(""), 300);
    }, 2400);
  };

  const appendLog = async (action, module, color = C.indigo) => {
    await auditLogService.createAuditLog({
      userName,
      role: localStorage.getItem("userRole") || "Admin",
      module,
      action,
      description: action,
    });
    db.addActivity(action, color);
    await notificationService.createNotification({
      recipientEmail: localStorage.getItem("userEmail") || "notifications@onboardpro.local",
      recipientRole: "IT Administrator",
      title: "Notification",
      message: action,
    });
    await refreshData();
  };

  const calculatedTotalUsers = users.length;
  const calculatedActiveEmployees = users.filter((user) => user.role === "Employee" && user.status === "Active").length;
  const calculatedPendingTasks = users.filter((user) => user.status === "Active" && !user.onboardingComplete).length;
  const totalUsers = dashboardSummary?.totalUsers ?? calculatedTotalUsers;
  const activeEmployees = dashboardSummary?.activeEmployees ?? calculatedActiveEmployees;
  const pendingTasks = dashboardSummary?.pendingTasks ?? calculatedPendingTasks;
  const recentActivities = useMemo(() => {
    const byKey = new Map();

    auditLog.forEach((entry, index) => {
      const key = entry.id || entry.auditId || `${entry.timestamp || ""}-${entry.userName || entry.user || ""}-${entry.action || ""}-${index}`;
      if (!byKey.has(key)) {
        byKey.set(key, entry);
      }
    });

    return Array.from(byKey.values())
      .sort((a, b) => {
        const bTime = new Date(b.timestamp || 0).getTime();
        const aTime = new Date(a.timestamp || 0).getTime();
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
      })
      .slice(0, 5);
  }, [auditLog]);

  const workflowList = CONSTANT_WORKFLOW;

  const viewAllUsers = () => {
    setSearchQ("");
    setFilterRole("All");
    setFilterStatus("All");
    setActivePage("Users & Roles");
  };

  const viewRecentUser = (user) => {
    setSearchQ(user.email || user.employeeCode || user.name || "");
    setFilterRole("All");
    setFilterStatus("All");
    setActivePage("Users & Roles");
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQ.trim() ||
        user.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQ.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQ.toLowerCase());

      const matchesRole = filterRole === "All" || user.role === filterRole;
      const matchesStatus = filterStatus === "All" || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQ, filterRole, filterStatus]);

  const filteredUsersPageUsers = useMemo(() => {
    return usersPageUsers.filter((user) => {
      const query = searchQ.trim().toLowerCase();
      const matchesText =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.employeeCode.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.onboardingStatus.toLowerCase().includes(query);
      const matchesRole = filterRole === "All" || user.role === filterRole;
      const matchesStatus = filterStatus === "All" || user.status === filterStatus.toUpperCase();
      return matchesText && matchesRole && matchesStatus;
    });
  }, [usersPageUsers, searchQ, filterRole, filterStatus]);

  const filteredAudit = useMemo(() => {
    return auditLog.filter((entry) => {
      const searchText = `${entry.user} ${entry.role} ${entry.action} ${entry.module} ${entry.description} ${entry.targetEmployeeName}`.toLowerCase();
      const matchesSearch = !auditSearch.trim() || searchText.includes(auditSearch.toLowerCase());
      const matchesFilter =
        filterAudit === "All" ||
        entry.module === filterAudit ||
        (filterAudit === "Employees" && entry.module === "Employee") ||
        (filterAudit === "IT Actions" && ["Access Queue", "Credentials", "Deactivations"].includes(entry.module)) ||
        (filterAudit === "User Management" && entry.module === "Users") ||
        (filterAudit === "Security" && entry.module === "Settings");
      return matchesSearch && matchesFilter;
    });
  }, [auditLog, auditSearch, filterAudit]);

  const usersPageRoleCounts = useMemo(() => {
    return roles.reduce((acc, role) => {
      acc[role] = usersPageUsers.filter((user) => user.role === role).length;
      return acc;
    }, {});
  }, [usersPageUsers]);

  const reportStates = useMemo(() => {
    return [
      {
        id: "completion",
        title: "Onboarding Completion Report",
        description: "Summary of all user onboarding status across the organization.",
        icon: FileText,
        module: "Reports",
        data: reportEmployees,
      },
      {
        id: "access-audit",
        title: "Access Audit Report",
        description: "Complete log of all access requests, approvals, and provisioning actions.",
        icon: Shield,
        module: "Reports",
        data: auditLog.map((entry) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          user: entry.user,
          action: entry.action,
          module: entry.module,
        })),
      },
      {
        id: "role-distribution",
        title: "Role Distribution Report",
        description: "Breakdown of users by role across the organization.",
        icon: PieChart,
        module: "Reports",
        data: reportRoleDistribution,
      },
    ];
  }, [reportEmployees, auditLog, reportRoleDistribution]);

  const openUserModal = (mode, user = null) => {
    setModalType(mode);
    setEditTarget(user);
    setUserForm(user ? { ...user, password: "" } : emptyUserForm);
    setUserFormErrors({});
  };

  const closeModal = () => {
    setModalType("");
    setEditTarget(null);
    setUserForm(emptyUserForm);
    setUserFormErrors({});
    setIsSubmittingUser(false);
    setShowPassword(false);
  };

  const updateUserForm = (field, value) => {
    setUserForm((current) => ({ ...current, [field]: value }));
    setUserFormErrors((current) => ({ ...current, [field]: "", submit: "" }));
  };

  const validateUserForm = () => {
    const errors = {};
    if (!userForm.name.trim()) errors.name = "Full name is required.";
    if (!userForm.email.trim()) errors.email = "Work email is required.";
    if (!userForm.phone.trim()) errors.phone = "Phone number is required.";
    if (!userForm.startDate.trim()) errors.startDate = "Start date is required.";
    if (!userForm.password.trim() && !editTarget) errors.password = "Password is required.";
    
    // Check for duplicate emails
    if (!editTarget || editTarget.email !== userForm.email) {
      const lowerEmail = userForm.email.toLowerCase().trim();
      const emailExists = users.some(u => u.email.toLowerCase().trim() === lowerEmail);
      if (emailExists) errors.email = "Email already exists.";
    }
    return errors;
  };

  const submitUserForm = async (event) => {
    event.preventDefault();
    if (isSubmittingUser) return;
    const errors = validateUserForm();
    if (Object.keys(errors).length) {
      setUserFormErrors(errors);
      return;
    }

    setIsSubmittingUser(true);
    setUserFormErrors({});

    if (editTarget) {
      // UPDATE user
      const lowerEmail = editTarget.email.toLowerCase().trim();
      const newEmail = userForm.email.toLowerCase().trim();
      try {
        await updateUser(lowerEmail, {
          name: userForm.name,
          email: newEmail,
          role: userForm.role,
          department: userForm.department,
          phone: userForm.phone,
          startDate: userForm.startDate,
        });
      } catch (err) {
        const message = err.message || "Failed to update user.";
        setUserFormErrors((current) => ({ ...current, submit: message }));
        showToast(message);
        setIsSubmittingUser(false);
        return;
      }

      // If it's an employee, also update in employees list!
      const employees = db.getEmployees();
      const emp = employees.find(e => e.email.toLowerCase().trim() === lowerEmail);
      if (emp) {
        const updatedEmp = {
          ...emp,
          name: userForm.name,
          email: userForm.email.toLowerCase().trim(),
          department: userForm.department,
          phone: userForm.phone,
          startDate: userForm.startDate,
        };
        db.updateEmployee(updatedEmp);
      }

      showToast("User updated successfully");
      await appendLog(`User ${userForm.name} updated`, "Users", C.indigo);
      closeModal();
      setIsSubmittingUser(false);
      return;
    }

    // ADD user
    const lowerEmail = userForm.email.toLowerCase().trim();
    const temporaryPassword = userForm.password.trim();
    const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;

    let createdUser;
    try {
      createdUser = await addUser({
        id: newId,
        name: userForm.name,
        email: lowerEmail,
        password: temporaryPassword,
        role: userForm.role,
        department: userForm.department,
        phone: userForm.phone,
        startDate: userForm.startDate,
        createdOn: today(),
        status: "Active",
      });
    } catch (err) {
      const message = err.message || "Failed to add user.";
      setUserFormErrors((current) => ({ ...current, submit: message }));
      showToast(message);
      setIsSubmittingUser(false);
      return;
    }

    // If role is Employee, also add as employee record
    if (userForm.role === "Employee") {
      const empId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const emp = {
        id: empId,
        name: userForm.name,
        email: lowerEmail,
        department: userForm.department,
        jobTitle: "Software Engineer",
        position: "Software Engineer",
        startDate: userForm.startDate,
        manager: "Manager Demo",
        status: "In Progress",
        docsStatus: "Pending",
        progress: 25,
        phone: userForm.phone,
        password: temporaryPassword,
        onboardingComplete: false,
        documents: {},
        policyChecks: { conduct: false, privacy: false, it: false },
        completedTrainings: [],
        events: [
          { id: `EVT-${Date.now()}`, message: "Onboarding account created by Admin", time: Date.now() },
        ],
      };
      db.addEmployee(emp);
    }
    await appendLog(`User ${userForm.name} created with role ${userForm.role}`, "Users", C.indigo);

    showToast(createdUser?.welcomeEmailSent === true ? "Email sent successfully" : `User ${userForm.name} added successfully`);
    closeModal();
    setIsSubmittingUser(false);
  };

  const toggleUserStatus = async (user) => {
    toggleContextUserStatus(user.email);
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    showToast(`User ${user.name} ${nextStatus === "Active" ? "activated" : "deactivated"}`);
    await appendLog(`User ${user.name} ${nextStatus === "Active" ? "activated" : "deactivated"}`, "Users", nextStatus === "Active" ? C.green : C.coral);
  };

  const requestDelete = (type, id) => {
    setDeleteConfirmType(type);
    setDeleteConfirmId(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmId("");
    setDeleteConfirmType("");
  };

  const confirmDelete = async (type, id) => {
    if (type === "user") {
      const deletedUser = users.find((user) => user.id === id);
      if (deletedUser) {
        try {
          await deleteUser({ id: deletedUser.backendUserId || deletedUser.id, email: deletedUser.email });
          if (deletedUser.id.startsWith("EMP") || deletedUser.role === "Employee") {
            db.deleteEmployee(deletedUser.id);
          }
          db.addActivity(`Deleted user ${deletedUser.name}`, "#EF4444");
          setUsers((current) => current.filter((user) => user.id !== id));
          showToast("User deleted successfully");
          await appendLog(`Deleted user ${deletedUser.name} (${deletedUser.role})`, "Users", C.coral);
        } catch (err) {
          showToast("Failed to delete user");
        }
      }
    }
    if (type === "category") {
      const deletedCategory = accessCategories.find((category) => category.id === id);
      if (deletedCategory) {
        const nextCats = accessCategories.filter((category) => category.id !== id);
        db.saveAccessCategories(nextCats);
        showToast(`Category ${deletedCategory.name} deleted`);
        appendLog(`Access category ${deletedCategory.name} deleted`, "Categories", C.coral);
      }
    }
    cancelDelete();
  };

  const openEditUser = (user) => {
    setModalType("edit-user");
    setEditTarget(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      startDate: user.startDate,
      password: "",
    });
    setUserFormErrors({});
  };

  const toggleCategoryStatus = (category) => {
    const nextStatus = category.status === "Active" ? "Inactive" : "Active";
    const nextCats = accessCategories.map((item) => (item.id === category.id ? { ...item, status: nextStatus } : item));
    db.saveAccessCategories(nextCats);
    showToast(`Category ${category.name} ${nextStatus === "Active" ? "activated" : "deactivated"}`);
    appendLog(`Access category ${category.name} ${nextStatus === "Active" ? "activated" : "deactivated"}`, "Categories", nextStatus === "Active" ? C.green : C.coral);
  };

  const approveCatalogRequest = async (catalog) => {
    try {
      await systemCatalogService.approveSystem(catalog.id);
      showToast(`${catalog.name} approved and activated`);
      await refreshCatalogApprovals();
    } catch (err) {
      setCatalogApprovalError(getApiErrorMessage(err, "Unable to approve catalog request."));
    }
  };

  const rejectCatalogRequest = async (event) => {
    event.preventDefault();
    if (!rejectCatalogTarget) {
      return;
    }

    try {
      await systemCatalogService.rejectSystem(rejectCatalogTarget.id, catalogRejectionReason.trim() || "Rejected by Admin");
      showToast(`${rejectCatalogTarget.name} rejected`);
      setRejectCatalogTarget(null);
      setCatalogRejectionReason("");
      await refreshCatalogApprovals();
    } catch (err) {
      setCatalogApprovalError(getApiErrorMessage(err, "Unable to reject catalog request."));
    }
  };

  const generateReport = async (reportId) => {
    try {
      if (reportId === "completion") {
        await refreshReportEmployees();
      } else if (reportId === "role-distribution") {
        await refreshRoleDistributionReport();
      }

      const report = reportStates.find((item) => item.id === reportId);
      if (!report) return;

      setReports((current) => {
        const existing = current.find((item) => item.id === reportId);
        const next = { id: reportId, lastGenerated: today() };
        if (existing) {
          return current.map((item) => (item.id === reportId ? next : item));
        }
        return [next, ...current];
      });

      showToast("Report generated successfully");
      appendLog(`${report.title} generated by ${userName}`, "Reports", C.indigo);
      setReportVisible(reportId);
    } catch (err) {
      console.error(`[Reports] Generate ${reportId} failed`, err);
      showToast("Unable to generate report");
    }
  };

  const exportReport = async (reportId) => {
    try {
      let exportData = reportStates.find((item) => item.id === reportId)?.data || [];

      if (reportId === "completion") {
        exportData = await refreshReportEmployees();
        downloadCsv("onboarding-completion-report.csv", [
          ["Employee ID", "Employee Name", "Role", "Department", "Start Date", "Onboarding Status"],
          ...exportData.map((employee) => [
            employee.employeeCode,
            employee.name,
            employee.role,
            employee.department,
            employee.startDate,
            employee.onboardingStatus,
          ]),
        ]);
      } else if (reportId === "role-distribution") {
        exportData = await refreshRoleDistributionReport();
        downloadCsv("role-distribution-report.csv", [
          ["Role", "Count", "Percentage"],
          ...exportData.map((row) => [row.role, row.count, `${row.percentage}%`]),
        ]);
      } else {
        downloadCsv("access-audit-report.csv", [
          ["Timestamp", "User", "Action", "Module"],
          ...exportData.map((entry) => [formatTimestamp(entry.timestamp), entry.user, entry.action, entry.module]),
        ]);
      }

      showToast("Report exported successfully");
      appendLog(`Report ${reportId} exported`, "Reports", C.indigo);
    } catch (err) {
      console.error(`[Reports] Export ${reportId} failed`, err);
      showToast("Unable to export report");
    }
  };

  const updateSetting = async (field) => {
    const normalizedRole = normalizeUserRole(localStorage.getItem("userRole"));
    const updated = { ...settings, [field]: !settings[field] };
    setSettings(updated);

    try {
      const existingSettings = loadRoleSettings(normalizedRole);
      let saved = updated;

      if (field === "emailNotifications" || field === "autoAssignIds") {
        const platformSettings = await platformSettingsService.updateSettings(updated);
        saved = {
          ...updated,
          emailNotifications: platformSettings.emailNotifications,
          autoAssignIds: platformSettings.autoAssignIds,
        };
        setSettings(saved);
      }

      saveRoleSettings(normalizedRole, { ...existingSettings, settings: saved, userName: profileName, userEmail });
      showToast("Setting updated");
    } catch (err) {
      setSettings(settings);
      showToast(getApiErrorMessage(err, "Unable to update setting."));
    }
  };

  const saveProfile = async (event, profile = {}) => {
    event.preventDefault();
    const fullName = (profile.fullName ?? profileName).trim();
    const phoneNumber = (profile.phoneNumber ?? "").trim();

    if (!fullName) {
      showToast("Full name is required");
      return;
    }

    if (phoneNumber && !/^[+()\-\s0-9]{7,20}$/.test(phoneNumber)) {
      showToast("Enter a valid phone number");
      return;
    }

    try {
      const updatedProfile = await userProfileService.updateCurrentUserProfile({ fullName, phoneNumber });
      const nextName = updatedProfile.fullName || fullName;
      const nextEmail = updatedProfile.email || userEmail;
      const normalizedRole = normalizeUserRole(localStorage.getItem("userRole"));
      const existingSettings = loadRoleSettings(normalizedRole);

      saveRoleSettings(normalizedRole, {
        ...existingSettings,
        userName: nextName,
        userEmail: nextEmail,
        profileForm: {
          fullName: nextName,
          email: nextEmail,
          phone: updatedProfile.phoneNumber || "",
        },
        settings,
      });

      setProfileName(nextName);
      setUserName(nextName);
      setUserEmail(nextEmail);
      localStorage.setItem("userName", nextName);
      if (nextEmail) {
        localStorage.setItem("userEmail", nextEmail);
      }
      notifyUserProfileUpdated(updatedProfile);
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to update profile."));
    }
  };

  const calculatedUnreadCount = notifications.filter((item) => !item.read).length;
  const unreadCount = dashboardSummary?.notificationCount ?? calculatedUnreadCount;

  const markAllNotificationsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.read);

    if (!unreadNotifications.length) {
      showToast("No unread notifications");
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, read: true, readAt })));
    setDashboardSummary((current) => current ? { ...current, notificationCount: 0 } : current);

    try {
      await Promise.all(notificationQueryScopes().map((params) => notificationService.markAllNotificationsRead(params)));
      await refreshAdminNotifications();
      showToast("All notifications marked as read");
    } catch (err) {
      console.error("[Admin Notifications] Unable to mark all notifications as read", err);
      showToast("Unable to mark all notifications as read");
      await refreshAdminNotifications();
    }
  };

  const markNotificationRead = async (id) => {
    const target = notifications.find((item) => item.id === id);
    if (!target || target.read) {
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true, readAt } : item)));
    setDashboardSummary((current) => current ? { ...current, notificationCount: Math.max(0, current.notificationCount - 1) } : current);

    try {
      const updated = await notificationService.markNotificationRead(id);
      setNotifications((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      console.error("[Admin Notifications] Unable to mark notification as read", err);
      showToast("Unable to mark notification as read");
      await refreshAdminNotifications();
    }
  };

  const reportStateFor = (id) => reports.find((item) => item.id === id) || { lastGenerated: "Never" };

  return (
    <div className="dashboard-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC]">
      {toast ? <Toast message={toast} visible={toastVisible} /> : null}

      <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#222533] bg-[#0D0E12] ${sidebarOpen ? "w-[240px]" : "w-20"}`}>
        <Link
          to="/"
          className="flex h-20 items-center gap-3 px-5 text-inherit no-underline"
          aria-label="OnboardPro landing page"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white shadow-lg shadow-indigo-950/50">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          </div>
          {sidebarOpen ? (
            <span className="text-xl font-bold">
<span className="text-[#F8FAFC]">Onboard</span><span className="text-[#6366F1]">Pro</span>
            </span>
          ) : null}
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.label;
            const badge = item.label === "Notifications" ? unreadCount : 0;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActivePage(item.label)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${
                  isActive ? "bg-[#6366F1]/10 text-[#6366F1]" : "text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC]"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {sidebarOpen ? item.label : null}
                {sidebarOpen && badge ? (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#222533] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6366F1] text-sm font-bold text-white shadow-md shadow-indigo-950/40">
              {initials(userName)}
            </div>
            {sidebarOpen ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{userName}</p>
                <p className="text-xs text-[#94A3B8]">System Admin</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              logoutFromContext();
              logoutPreservingSettings();
              navigate("/login");
            }}
            className="logout-button mt-4 flex w-full items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:border-rose-500/30"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {sidebarOpen ? "Logout" : null}
          </button>
        </div>
      </aside>

      <div className={`min-h-screen ${sidebarOpen ? "ml-[240px]" : "ml-20"}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#222533] bg-[#08090C]/90 px-8 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC] duration-200"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Admin Portal</p>
              <h1 className="mt-1 text-2xl font-bold">{activePage}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActivePage("Notifications")}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC] duration-200"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
              ) : null}
            </button>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </header>

        <main className="space-y-6 p-8">
          {activePage === "Dashboard" ? (
            <DashboardPage
              userName={userName}
              totalUsers={totalUsers}
              activeEmployees={activeEmployees}
              pendingTasks={pendingTasks}
              recentUsers={recentUsers}
              recentUsersError={recentUsersError}
              isRecentUsersLoading={isRecentUsersLoading}
              isDashboardLoading={isDashboardLoading}
              dashboardError={dashboardError}
              workflowList={workflowList}
              recentActivities={recentActivities}
              onViewAllUsers={viewAllUsers}
              onViewUser={viewRecentUser}
            />
          ) : null}

          {activePage === "Users & Roles" ? (
            <UsersPage
              users={filteredUsersPageUsers}
              usersPageError={usersPageError}
              isUsersPageLoading={isUsersPageLoading}
              searchQ={searchQ}
              filterRole={filterRole}
              filterStatus={filterStatus}
              setSearchQ={setSearchQ}
              setFilterRole={setFilterRole}
              setFilterStatus={setFilterStatus}
              openUserModal={openUserModal}
              roleCounts={usersPageRoleCounts}
              userForm={userForm}
              userFormErrors={userFormErrors}
              submitUserForm={submitUserForm}
              updateUserForm={updateUserForm}
              modalType={modalType}
              closeModal={closeModal}
              editTarget={editTarget}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isSubmittingUser={isSubmittingUser}
            />
          ) : null}

          {activePage === "Workflow Config" ? (
            <WorkflowPage workflowList={workflowList} />
          ) : null}

          {activePage === "Access Categories" ? (
            <CategoryPage
              accessCategories={accessCategories}
              accessCategoriesError={accessCategoriesError}
              isAccessCategoriesLoading={isAccessCategoriesLoading}
              selectedAccessCategory={selectedAccessCategory}
              setSelectedAccessCategory={setSelectedAccessCategory}
              isAccessCategoryDetailsLoading={isAccessCategoryDetailsLoading}
              accessCategoryDetailsError={accessCategoryDetailsError}
              openAccessCategoryUsers={openAccessCategoryUsers}
              refreshAccessCategories={refreshAccessCategories}
            />
          ) : null}

          {activePage === "System Catalog Approvals" ? (
            <SystemCatalogApprovalsPage
              catalogApprovals={catalogApprovals}
              catalogApprovalError={catalogApprovalError}
              selectedCatalogApproval={selectedCatalogApproval}
              setSelectedCatalogApproval={setSelectedCatalogApproval}
              rejectCatalogTarget={rejectCatalogTarget}
              setRejectCatalogTarget={setRejectCatalogTarget}
              catalogRejectionReason={catalogRejectionReason}
              setCatalogRejectionReason={setCatalogRejectionReason}
              approveCatalogRequest={approveCatalogRequest}
              rejectCatalogRequest={rejectCatalogRequest}
            />
          ) : null}

          {activePage === "Reports" ? (
            <ReportsPage
              reportStates={reportStates}
              reportVisible={reportVisible}
              generateReport={generateReport}
              exportReport={exportReport}
              reportStateFor={reportStateFor}
              isReportsLoading={isReportsLoading}
              reportsError={reportsError}
            />
          ) : null}

          {activePage === "Audit Logs" ? (
            <AuditLogsPage
              filteredAudit={filteredAudit}
              filterAudit={filterAudit}
              setFilterAudit={setFilterAudit}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
            />
          ) : null}

          {activePage === "Notifications" ? (
            <NotificationsPage
              notifications={notifications}
              markAllNotificationsRead={markAllNotificationsRead}
              markNotificationRead={markNotificationRead}
            />
          ) : null}

          {activePage === "Settings" ? (
            <SettingsPage
              profileName={profileName}
              setProfileName={setProfileName}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              settings={settings}
              updateSetting={updateSetting}
              saveProfile={saveProfile}
              showToast={showToast}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DashboardPage({ userName, totalUsers, activeEmployees, pendingTasks, recentUsers, recentUsersError, isRecentUsersLoading, isDashboardLoading, dashboardError, workflowList, recentActivities, onViewAllUsers, onViewUser }) {
  const [selectedWorkflowStepId, setSelectedWorkflowStepId] = useState(workflowList[0]?.id ?? null);
  const selectedWorkflowStep = workflowList.find((step) => step.id === selectedWorkflowStepId) || workflowList[0];
  const selectedWorkflowActions = selectedWorkflowStep ? WORKFLOW_STEP_ACTIONS[selectedWorkflowStep.name] || [] : [];
  const cards = [
    { label: "Total Users", value: totalUsers, icon: Users, color: C.indigo },
    { label: "Active Employees", value: activeEmployees, icon: UserCheck, color: C.green },
    { label: "Pending Onboarding Tasks", value: pendingTasks, icon: Clock, color: C.amber },
  ];

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Welcome back, {userName} 👋</h2>
            <p className="mt-3 text-sm text-[#94A3B8]">
              {isDashboardLoading
                ? "Loading dashboard metrics..."
                : `Managing ${totalUsers} users across ${activeEmployees} roles. ${pendingTasks} onboarding tasks pending.`}
            </p>
            {dashboardError ? <p className="mt-3 text-sm font-semibold text-rose-400">{dashboardError}</p> : null}
          </div>
          <div className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm font-semibold text-[#94A3B8]">
            {formatTimestamp(new Date().toISOString())}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#94A3B8]">{card.label}</p>
                  <p className="mt-3 text-4xl font-bold">{isDashboardLoading ? "..." : card.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#191C26]" style={{ color: card.color }}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Recent Users</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">The last users added to the platform.</p>
            </div>
            <button type="button" className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26]" onClick={onViewAllUsers}>
              View all
            </button>
          </div>
          {recentUsers.length === 0 ? (
            <div className="mt-6">
              {isRecentUsersLoading ? (
                <div className="rounded-md border border-[#222533] bg-[#191C26] px-5 py-8 text-center text-sm font-semibold text-[#94A3B8]">
                  Loading recent users from API...
                </div>
              ) : (
                <EmptyState icon={Users} title="No users available." text={recentUsersError || "No users available."} color="text-[#FF8A66]" />
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-[#222533] bg-[#191C26] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#F8FAFC]">{user.name || "Unnamed user"}</p>
                      <p className="mt-1 truncate text-sm text-[#94A3B8]">{user.email || "-"}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                        {user.employeeCode ? `Employee ID: ${user.employeeCode}` : "Employee ID: -"}
                      </p>
                    </div>
                    <Badge tone={String(user.status || "").toUpperCase() === "ACTIVE" || user.status === "Active" ? "green" : "coral"}>{user.status || "ACTIVE"}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#F8FAFC]">{user.role || "Employee"}</p>
                    <button
                      type="button"
                      onClick={() => onViewUser(user)}
                      className="rounded-md border border-[#222533] bg-[#13151D] px-3 py-2 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#0D0E12] hover:text-[#F8FAFC]"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Workflow Steps</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">Configured onboarding workflow steps.</p>
            </div>
            <button type="button" className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26]" onClick={() => {}}>
              View all
            </button>
          </div>
          {workflowList.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={GitBranch} title="No workflow steps configured" text="Add your first workflow step to define the onboarding process." color="text-[#FF8A66]" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {workflowList.slice(0, 4).map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSelectedWorkflowStepId(step.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedWorkflowStep?.id === step.id
                      ? "border-[#6366F1] bg-[#6366F1]/10"
                      : "border-[#222533] bg-[#191C26] hover:border-[#6366F1]/60 hover:bg-[#0D0E12]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#F8FAFC]">{step.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#94A3B8]">{step.role}</p>
                    </div>
                    <span className="rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-1 text-xs font-semibold text-[#A5B4FC]">
                      Step {step.order}
                    </span>
                  </div>
                </button>
              ))}
              {selectedWorkflowStep ? (
                <div className="rounded-xl border border-[#222533] bg-[#0D0E12] p-4">
                  <p className="text-sm font-bold text-[#F8FAFC]">{selectedWorkflowStep.name} can do</p>
                  <ul className="mt-3 space-y-2">
                    {selectedWorkflowActions.map((action) => (
                      <li key={action} className="flex gap-2 text-sm text-[#94A3B8]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#38C7BE]" aria-hidden="true" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-[#F8FAFC]">Recent Activity</h2>
        {recentActivities.length === 0 ? (
          <div className="mt-6 rounded-md border border-[#222533] bg-[#191C26] px-4 py-5 text-sm text-[#94A3B8]">
            No recent activity available
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id || activity.auditId || `${activity.timestamp}-${activity.action}`} className="flex items-start gap-3 rounded-md border border-[#222533] bg-[#191C26] p-4">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
                <div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    {(activity.userName || activity.user || "System")} {activity.action || "recorded an activity"}
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]">{activity.module || "General"} - {formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function UsersPage({ users, usersPageError, isUsersPageLoading, searchQ, filterRole, filterStatus, setSearchQ, setFilterRole, setFilterStatus, openUserModal, roleCounts, userForm, userFormErrors, submitUserForm, updateUserForm, modalType, closeModal, editTarget, showPassword, setShowPassword, isSubmittingUser }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">User Management</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Manage all platform users and their assigned roles.</p>
          </div>
          <button type="button" onClick={() => openUserModal("add-user")} className="inline-flex items-center gap-2 rounded-md bg-[#6366F1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-md">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add User
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <Field label="Search users" id="admin-search-users">
            <input
              id="admin-search-users"
              type="text"
              value={searchQ}
              onChange={(event) => setSearchQ(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            />
          </Field>
          <Field label="Filter by role" id="admin-filter-role">
            <select
              id="admin-filter-role"
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            >
              <option>All</option>
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </Field>
          <Field label="Filter by status" id="admin-filter-status">
            <select
              id="admin-filter-status"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            >
              <option>All</option>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>DEACTIVATED</option>
            </select>
          </Field>
        </div>
      </Card>

      {usersPageError ? (
        <Card className="p-6">
          <p className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{usersPageError}</p>
        </Card>
      ) : null}

      {isUsersPageLoading ? (
        <Card className="p-10 text-center">
          <p className="text-sm font-semibold text-[#94A3B8]">Loading users...</p>
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={Users} title="No users found" text="No database users match the current filters." color="text-[#FF8A66]" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4">Onboarding Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {users.map((user) => (
                  <Fragment key={user.id}>
                    <tr>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6366F1] text-sm font-bold text-white shadow-md shadow-indigo-950/40">
                            {initials(user.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#F8FAFC]">{user.name}</p>
                            <p className="mt-1 text-xs text-[#94A3B8]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={td}>{user.employeeCode || "-"}</td>
                      <td className={td}>{user.email}</td>
                      <td className={td}>
                        <RoleBadge role={user.role} />
                      </td>
                      <td className={td}>
                        <Badge tone={user.status === "ACTIVE" ? "green" : "coral"}>{user.status}</Badge>
                      </td>
                      <td className={td}>{formatLastLogin(user.lastLogin)}</td>
                      <td className={td}>
                        <Badge tone={user.onboardingStatus === "Completed" ? "green" : "amber"}>{user.onboardingStatus}</Badge>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {roles.map((role) => (
            <div key={role} className="rounded-xl border border-[#222533] bg-[#191C26] p-4">
              <p className="text-sm text-[#94A3B8]">{role}</p>
              <p className="mt-3 text-3xl font-bold text-[#F8FAFC]">{roleCounts[role] || 0}</p>
            </div>
          ))}
        </div>
      </Card>

      {(modalType === "add-user" || modalType === "edit-user") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl border border-[#222533] bg-[#13151D] p-7 shadow-2xl shadow-black/85">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">{modalType === "edit-user" ? "Edit User" : "Add User"}</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">Enter user details to manage platform access.</p>
              </div>
              <button type="button" onClick={closeModal} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={submitUserForm}>
              <Field id="admin-user-name" label="Full Name">
                <input
                  id="admin-user-name"
                  type="text"
                  value={userForm.name}
                  onChange={(event) => updateUserForm("name", event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                />
              </Field>
              {userFormErrors.name ? <p className="text-sm text-rose-400">{userFormErrors.name}</p> : null}
              <Field id="admin-user-email" label="Work Email">
                <input
                  id="admin-user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(event) => updateUserForm("email", event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                />
              </Field>
              {userFormErrors.email ? <p className="text-sm text-rose-400">{userFormErrors.email}</p> : null}
              <Field id="admin-user-role" label="Role">
                <select
                  id="admin-user-role"
                  value={userForm.role}
                  onChange={(event) => updateUserForm("role", event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="admin-user-department" label="Department">
                <select
                  id="admin-user-department"
                  value={userForm.department}
                  onChange={(event) => updateUserForm("department", event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="admin-user-phone" label="Phone Number">
                <input
                  id="admin-user-phone"
                  type="text"
                  value={userForm.phone}
                  onChange={(event) => updateUserForm("phone", event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                />
              </Field>
              {userFormErrors.phone ? <p className="text-sm text-rose-400">{userFormErrors.phone}</p> : null}
              <Field id="admin-user-start" label="Start Date">
                <input
                  id="admin-user-start"
                  type="date"
                  value={userForm.startDate}
                  onChange={(event) => updateUserForm("startDate", event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                />
              </Field>
              {userFormErrors.startDate ? <p className="text-sm text-rose-400">{userFormErrors.startDate}</p> : null}
              <Field id="admin-user-password" label="Temporary Password">
                <div className="mt-2 flex items-center rounded-md border border-[#222533] bg-[#191C26] px-4 py-3">
                  <input
                    id="admin-user-password"
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(event) => updateUserForm("password", event.target.value)}
                    className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              {userFormErrors.password ? <p className="text-sm text-rose-400">{userFormErrors.password}</p> : null}
              {userFormErrors.submit ? (
                <div className="md:col-span-2 rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                  {userFormErrors.submit}
                </div>
              ) : null}
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="rounded-md bg-[#6366F1] hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 text-white transition duration-200 px-5 py-3 text-sm font-semibold shadow-md"
                >
                  {isSubmittingUser ? (modalType === "edit-user" ? "Updating..." : "Adding...") : (modalType === "edit-user" ? "Update User" : "Add User")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowPage({ workflowList }) {
  const stepRoleColors = {
    Employee: C.indigo,
    "HR Manager": C.green,
    "Department Manager": C.amber,
    "IT Administrator": C.teal,
    "System Admin": C.coral,
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Workflow Configuration</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">
            This is the predefined employee onboarding workflow. The sequence is locked to ensure compliance and proper setup across all departments.
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">Fixed Workflow Sequence</h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 px-2 py-3">
          {workflowList.map((step, index) => {
            const role = step.assignedRole || step.role || "Employee";
            const color = stepRoleColors[role] || C.indigo;
            return (
              <Fragment key={step.id}>
                <div className="flex w-32 flex-col items-center gap-3 rounded-xl border border-[#222533] bg-[#191C26] px-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: `${color}22`, color }}>
                    {index + 1}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#F8FAFC]">{step.name}</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">{role}</p>
                  </div>
                </div>
                {index !== workflowList.length - 1 ? <ChevronRight className="h-6 w-6 text-[#94A3B8]" aria-hidden="true" /> : null}
              </Fragment>
            );
          })}
        </div>
      </Card>
      
      <Card className="overflow-hidden">
        <div className="border-b border-[#222533] bg-[#191C26]/20 px-6 py-5">
          <h3 className="text-lg font-bold text-[#F8FAFC]">Workflow Step Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
              <tr>
                <th className="px-6 py-4">Step No</th>
                <th className="px-6 py-4">Step Name</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
              {workflowList.map((step) => {
                const role = step.assignedRole || step.role || "Employee";
                const roleColor = stepRoleColors[role] || C.indigo;
                return (
                  <tr key={step.id}>
                    <td className="px-6 py-5 align-top">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/20 bg-[#6366F1]/10 text-sm font-bold text-indigo-400">
                        {step.order}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="font-semibold text-[#F8FAFC]">{step.name}</p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${roleColor}30`, backgroundColor: `${roleColor}15`, color: roleColor }}>
                        {role}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="text-sm text-[#94A3B8]">{step.description}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
function SystemCatalogApprovalsPage({ catalogApprovals, catalogApprovalError, selectedCatalogApproval, setSelectedCatalogApproval, rejectCatalogTarget, setRejectCatalogTarget, catalogRejectionReason, setCatalogRejectionReason, approveCatalogRequest, rejectCatalogRequest }) {
  const statusTone = (status) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "ACTIVE" || normalized === "APPROVED") return "green";
    if (normalized === "PENDING_APPROVAL") return "amber";
    return "coral";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">System Catalog Approvals</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">Review catalog requests submitted by IT Managers.</p>
        </div>
      </Card>

      {catalogApprovalError ? (
        <Card className="p-6">
          <p className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{catalogApprovalError}</p>
        </Card>
      ) : null}

      {catalogApprovals.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={FolderPlus} title="No catalog approvals" text="Catalog approval requests will appear here." color="text-[#6366F1]" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-[#222533] bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8]">
                <tr>
                  <th className="px-6 py-4">Catalog Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Requested Date</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {catalogApprovals.map((catalog) => {
                  const pending = String(catalog.status || "").toUpperCase() === "PENDING_APPROVAL";
                  return (
                    <tr key={catalog.id}>
                      <td className={td}>{catalog.name}</td>
                      <td className={td}>{catalog.category}</td>
                      <td className={td}>
                        <p className="max-w-xs truncate">{catalog.description}</p>
                      </td>
                      <td className={td}>{catalog.createdBy || "IT Manager"}</td>
                      <td className={td}>{formatTimestamp(catalog.createdAt)}</td>
                      <td className={td}>
                        <Badge tone={statusTone(catalog.status)}>{catalog.status}</Badge>
                      </td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setSelectedCatalogApproval(catalog)} className="rounded-md border border-[#222533] bg-[#13151D] px-3 py-2 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">
                            View Details
                          </button>
                          {pending ? (
                            <>
                              <button type="button" onClick={() => approveCatalogRequest(catalog)} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
                                Approve
                              </button>
                              <button type="button" onClick={() => setRejectCatalogTarget(catalog)} className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500">
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              {(String(catalog.status || "").toUpperCase() === "ACTIVE" || String(catalog.status || "").toUpperCase() === "APPROVED") && (
                                <Badge tone="green">Approved</Badge>
                              )}
                              {String(catalog.status || "").toUpperCase() === "REJECTED" && (
                                <Badge tone="coral">Rejected</Badge>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedCatalogApproval ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-[#222533] bg-[#13151D] p-7 shadow-2xl shadow-black/85">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">{selectedCatalogApproval.name}</h3>
                <p className="mt-2 text-sm text-[#94A3B8]">{selectedCatalogApproval.description}</p>
              </div>
              <button type="button" onClick={() => setSelectedCatalogApproval(null)} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <p className="text-sm text-[#94A3B8]">Category: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.category}</span></p>
              <p className="text-sm text-[#94A3B8]">Access Levels: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.accessLevels}</span></p>
              <p className="text-sm text-[#94A3B8]">Owner: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.owner}</span></p>
              <p className="text-sm text-[#94A3B8]">Requested By: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.createdBy || "IT Manager"}</span></p>
              <p className="text-sm text-[#94A3B8]">Approved By: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.approvedBy || "-"}</span></p>
              <p className="text-sm text-[#94A3B8]">Approved At: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.approvedAt ? formatTimestamp(selectedCatalogApproval.approvedAt) : "-"}</span></p>
              {selectedCatalogApproval.rejectionReason ? (
                <p className="text-sm text-[#94A3B8] md:col-span-2">Rejection Reason: <span className="font-semibold text-[#F8FAFC]">{selectedCatalogApproval.rejectionReason}</span></p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {rejectCatalogTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-[#222533] bg-[#13151D] p-7 shadow-2xl shadow-black/85">
            <h3 className="text-xl font-bold text-[#F8FAFC]">Reject {rejectCatalogTarget.name}</h3>
            <form className="mt-5 space-y-4" onSubmit={rejectCatalogRequest}>
              <Field id="catalog-rejection-reason" label="Rejection Reason">
                <textarea id="catalog-rejection-reason" value={catalogRejectionReason} onChange={(event) => setCatalogRejectionReason(event.target.value)} className="mt-2 h-28 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]" />
              </Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setRejectCatalogTarget(null); setCatalogRejectionReason(""); }} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">
                  Cancel
                </button>
                <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500">
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryPage({ accessCategories, accessCategoriesError, isAccessCategoriesLoading, selectedAccessCategory, setSelectedAccessCategory, isAccessCategoryDetailsLoading, accessCategoryDetailsError, openAccessCategoryUsers, refreshAccessCategories }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">System Access Categories</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">View active system catalogs approved for employee access requests.</p>
          </div>
          <button type="button" onClick={refreshAccessCategories} disabled={isAccessCategoriesLoading} className="inline-flex items-center gap-2 rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26] disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isAccessCategoriesLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </Card>

      {accessCategoriesError ? (
        <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
          {accessCategoriesError}
        </div>
      ) : null}

      {isAccessCategoriesLoading ? (
        <div className="rounded-md border border-[#222533] bg-[#13151D] px-5 py-4 text-sm font-semibold text-[#94A3B8]">
          Loading active user counts from API...
        </div>
      ) : null}

      {accessCategories.length === 0 && !isAccessCategoriesLoading ? (
        <Card className="p-10 text-center">
          <EmptyState icon={FolderKey} title="No active access categories" text="Approved active system catalogs will appear here." color="text-[#6366F1]" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {accessCategories.map((category) => (
          <Card key={category.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-[#F8FAFC]">{category.name}</p>
                <Badge tone={category.accessLevel === "Public" ? "green" : category.accessLevel === "Internal" ? "teal" : category.accessLevel === "Confidential" ? "amber" : "coral"}>
                  {category.accessLevel}
                </Badge>
              </div>
              <Badge tone={category.status === "Active" ? "green" : "coral"}>{category.status}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#94A3B8]">{category.description}</p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">Assigned Roles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(category.roles || []).map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#94A3B8]">{category.approvalRequired ? "Approval Required" : "No Approval Needed"}</p>
                <p className="text-sm text-[#94A3B8]">{category.systemCount} systems</p>
              </div>
              <div className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#94A3B8]">Active Users</p>
                <p className="mt-2 text-2xl font-bold text-[#F8FAFC]">{category.activeUsers || 0}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#222533] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Approved Catalog</p>
              <button
                type="button"
                onClick={() => openAccessCategoryUsers(category)}
                className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26]"
              >
                View Active Users
              </button>
            </div>
          </Card>
        ))}
        </div>
      )}

      {selectedAccessCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#222533] bg-[#0D0E12] shadow-2xl shadow-black/85">
            <div className="flex items-start justify-between gap-4 border-b border-[#222533] bg-[#13151D] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Active Users</p>
                <h3 className="mt-2 text-2xl font-bold text-[#F8FAFC]">{selectedAccessCategory.name}</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {selectedAccessCategory.activeUsers || 0} active employees with provisioned access
                </p>
              </div>
              <button type="button" onClick={() => setSelectedAccessCategory(null)} className="rounded-md border border-[#222533] bg-[#191C26] p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {isAccessCategoryDetailsLoading ? (
                <EmptyState icon={RefreshCw} title="Loading active users" text="Fetching provisioned employee access for this catalog." color="text-[#6366F1]" />
              ) : accessCategoryDetailsError ? (
                <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                  {accessCategoryDetailsError}
                </div>
              ) : (selectedAccessCategory.activeUserRecords || []).length === 0 ? (
                <EmptyState icon={Users} title="No provisioned users" text="Employees with active provisioned access will appear here." color="text-[#6366F1]" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-left">
                    <thead className="border-b border-[#222533] bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8]">
                      <tr>
                        <th className="px-5 py-4">Employee ID</th>
                        <th className="px-5 py-4">Employee Name</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Department</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Access Status</th>
                        <th className="px-5 py-4">Provisioned Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                      {(selectedAccessCategory.activeUserRecords || []).map((record) => {
                        const deactivated = !isActiveAccessUser(record);
                        return (
                          <tr key={record.assignmentId}>
                            <td className={td}>{record.employeeCode || "-"}</td>
                            <td className={td}>
                              <p>{record.employeeName || "Unknown employee"}</p>
                              {deactivated ? <p className="mt-1 text-xs font-semibold text-rose-400">{record.employeeStatus || "DEACTIVATED"}</p> : null}
                            </td>
                            <td className={td}>{record.email || "-"}</td>
                            <td className={td}>{record.department || "-"}</td>
                            <td className={td}>{record.role || "-"}</td>
                            <td className={td}>
                              <Badge tone={deactivated ? "coral" : "green"}>{deactivated ? record.employeeStatus || "DEACTIVATED" : record.accessStatus}</Badge>
                            </td>
                            <td className={td}>{record.provisionedDate || formatTimestamp(record.assignedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReportsPage({ reportStates, reportVisible, generateReport, exportReport, reportStateFor, isReportsLoading, reportsError }) {
  return (
    <div className="space-y-6">
      {reportsError ? (
        <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
          {reportsError}
        </div>
      ) : null}

      {reportStates.map((report) => {
        const state = reportStateFor(report.id);
        return (
          <Card key={report.id} className="p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#222533]">
                    <report.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F8FAFC]">{report.title}</h2>
                    <p className="mt-1 text-sm text-[#94A3B8]">{report.description}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#94A3B8]">Last Generated: {state.lastGenerated || "Never"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={isReportsLoading} onClick={() => generateReport(report.id)} className="rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-4 py-3 text-sm font-semibold shadow-md disabled:cursor-not-allowed disabled:opacity-60">
                  {isReportsLoading ? "Loading..." : "Generate Report"}
                </button>
                <button type="button" disabled={isReportsLoading} onClick={() => exportReport(report.id)} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26] disabled:cursor-not-allowed disabled:opacity-60">
                  Export CSV
                </button>
              </div>
            </div>
            {reportVisible === report.id ? (
              <div className="mt-6 overflow-x-auto">
                {report.data.length === 0 ? (
                  <EmptyState icon={report.id === "access-audit" ? ClipboardList : report.id === "role-distribution" ? PieChart : FileText} title="No data available" text="This report will show results once data is added." color="text-[#38C7BE]" />
                ) : report.id === "role-distribution" ? (
                  <div className="space-y-4">
                    {report.data.map((item) => (
                      <div key={item.role} className="rounded-xl border border-[#222533] bg-[#191C26] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-[#F8FAFC]">{item.role}</p>
                          <p className="text-sm text-[#94A3B8]">{item.count} ({item.percentage}%)</p>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#13151D]">
                          <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                      <tr>
                        {report.id === "access-audit" ? (
                          <>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Module</th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-4">Employee ID</th>
                            <th className="px-6 py-4">Employee Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Start Date</th>
                            <th className="px-6 py-4">Onboarding Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                      {report.data.map((item) => (
                        <tr key={item.id} className="even:bg-[#13151D]/30 odd:bg-[#191C26]/30 border-b border-[#222533]">
                          {report.id === "access-audit" ? (
                            <>
                              <td className={td}>{formatTimestamp(item.timestamp)}</td>
                              <td className={td}>{item.user}</td>
                              <td className={td}>{item.action}</td>
                              <td className={td}>{item.module}</td>
                            </>
                          ) : (
                            <>
                              <td className={td}>{item.employeeCode}</td>
                              <td className={td}>{item.name}</td>
                              <td className={td}>{item.role}</td>
                              <td className={td}>{item.department}</td>
                              <td className={td}>{formatDate(item.startDate)}</td>
                              <td className={td}>{item.onboardingStatus}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function AuditLogsPage({ filteredAudit, filterAudit, setFilterAudit, auditSearch, setAuditSearch }) {
  const filters = ["All", "Employees", "Documents", "Training", "Approvals", "Access Requests", "IT Actions", "System Catalog", "Notifications", "Security", "User Management"];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">System Audit Logs</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Complete record of all administrator actions on the platform.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Search logs" id="admin-audit-search">
              <input
                id="admin-audit-search"
                type="text"
                value={auditSearch}
                onChange={(event) => setAuditSearch(event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Filter by module" id="admin-audit-filter">
              <select
                id="admin-audit-filter"
                value={filterAudit}
                onChange={(event) => setFilterAudit(event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              >
                {filters.map((filter) => (
                  <option key={filter}>{filter}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Card>

      {filteredAudit.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={ClipboardList} title="No audit logs yet" text="All admin actions will be recorded here automatically." color="text-[#A78BFA]" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {filteredAudit.map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? "bg-[#13151D]/30" : "bg-[#191C26]/30"}>
                    <td className={td}>{formatTimestamp(entry.timestamp)}</td>
                    <td className={td}>{entry.user}</td>
                    <td className={td}>{entry.role}</td>
                    <td className={td}>
                      <Badge tone={entry.module === "Employees" || entry.module === "User Management" ? "indigo" : entry.module === "Approvals" || entry.module === "Training" ? "teal" : entry.module === "Access Requests" || entry.module === "Access Queue" ? "amber" : "green"}>{entry.module}</Badge>
                    </td>
                    <td className={td}>{entry.action}</td>
                    <td className={td}>{entry.targetEmployeeName || "-"}</td>
                    <td className={td}>{entry.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function NotificationsPage({ notifications, markAllNotificationsRead, markNotificationRead }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Notifications</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Every admin action creates a notification.</p>
          </div>
          <button type="button" onClick={markAllNotificationsRead} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26]">
            Mark all as read
          </button>
        </div>
      </Card>
      {notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={Bell} title="No notifications yet" text="Your activity updates will appear here." color="text-[#38C7BE]" />
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markNotificationRead(notification.id)}
              className={`notification-item w-full rounded-md border border-[#222533] px-5 py-4 text-left transition ${notification.read ? "bg-[#13151D] text-[#94A3B8]" : "bg-[#191C26] text-[#F8FAFC] border-indigo-950/40"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="notification-title text-sm font-semibold text-inherit">{notification.msg}</p>
                <span className="text-xs text-[#94A3B8]">{timeAgo(notification.time)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPage({ profileName, setProfileName, userEmail, setUserEmail, settings, updateSetting, saveProfile, showToast }) {
  const [phone, setPhone] = useState(loadRoleSettings(normalizeUserRole(localStorage.getItem("userRole"))).profileForm?.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const profile = await userProfileService.getCurrentUserProfile();
        if (cancelled) return;
        setProfileName(profile.fullName || profileName);
        setUserEmail(profile.email || userEmail);
        setPhone(profile.phoneNumber || "");
      } catch (err) {
        if (!cancelled) {
          showToast(getApiErrorMessage(err, "Unable to load profile."));
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [setProfileName, setUserEmail, showToast]);

  const submitProfile = async (event) => {
    event.preventDefault();

    if (!profileName.trim()) {
      showToast("Full name is required");
      return;
    }

    if (phone.trim() && !/^[+()\-\s0-9]{7,20}$/.test(phone.trim())) {
      showToast("Enter a valid phone number");
      return;
    }

    setProfileLoading(true);
    try {
      await saveProfile(event, {
        fullName: profileName.trim(),
        phoneNumber: phone.trim(),
      });
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
        <form className="mt-5" onSubmit={submitProfile}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="admin-settings-name" label="Full Name">
              <input id="admin-settings-name" type="text" value={profileName} onChange={(event) => setProfileName(event.target.value)} disabled={profileLoading} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition px-4 py-3 text-sm disabled:opacity-60" />
            </Field>
            <Field id="admin-settings-email" label="Email">
              <input id="admin-settings-email" type="email" value={userEmail} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none px-4 py-3 text-sm" />
            </Field>
            <Field id="admin-settings-phone" label="Phone Number">
              <input id="admin-settings-phone" type="text" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={profileLoading} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition px-4 py-3 text-sm disabled:opacity-60" />
            </Field>
            <Field id="admin-settings-role" label="Role">
              <input id="admin-settings-role" type="text" value="System Admin" readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none px-4 py-3 text-sm" />
            </Field>
          </div>
          <button type="submit" disabled={profileLoading} className="mt-5 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-bold shadow-md disabled:opacity-60">
            {profileLoading ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <ThemeSettingsPanel />
      </Card>

      <Card className="p-6">
        <ChangePasswordSection idPrefix="admin" showToast={showToast} />
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-[#F8FAFC]">Platform Configuration</h3>
        <div className="mt-6 space-y-4">
          {[
            { label: "Email Notifications", key: "emailNotifications", description: "Send email alerts for key events" },
            { label: "Auto-assign Employee IDs", key: "autoAssignIds", description: "Auto-generate IDs on user creation" },
            { label: "Audit Log Retention (90 days)", key: "auditRetention", description: "Auto-purge logs after 90 days" },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between rounded-xl border border-[#222533] bg-[#191C26] p-4">
              <div>
                <p className="font-semibold text-[#F8FAFC]">{setting.label}</p>
                <p className="mt-1 text-sm text-[#94A3B8]">{setting.description}</p>
              </div>
              <button
                type="button"
                onClick={() => updateSetting(setting.key)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${settings[setting.key] ? "bg-[#6366F1] text-white" : "border border-[#222533] bg-[#13151D] text-[#94A3B8] hover:bg-[#191C26]"}`}
              >
                {settings[setting.key] ? "●" : "○"}
              </button>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
