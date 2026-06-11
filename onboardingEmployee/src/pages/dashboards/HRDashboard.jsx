import {
  BarChart2,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  UserPlus,
  Users,
  X,
  XCircle,
  Eye,
  Download,
  AlertTriangle,
  GraduationCap,
  Upload,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredEmployeeId, loadRoleSettings, normalizeUserRole, saveRoleSettings, logoutPreservingSettings } from "../../utils/roleSettings";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { employeeService } from "../../services/employeeService";
import { getApiErrorMessage } from "../../services/apiClient";
import { notificationService } from "../../services/notificationService";
import { trainingService } from "../../services/trainingService";
import { dashboardService } from "../../services/dashboardService";
import { reportService } from "../../services/reportService";
import { notifyUserProfileUpdated, userProfileService } from "../../services/userProfileService";
import {
  REQUIRED_DOCUMENT_TYPES,
  getDocumentWorkflowStatus,
  mapDocumentsByType,
  onboardingWorkflowService,
} from "../../services/onboardingWorkflowService";
import UserProfileMenu from "../../components/UserProfileMenu";
import ChangePasswordSection from "../../components/ChangePasswordSection";
import ThemeToggle, { ThemeSettingsPanel } from "../../components/ThemeToggle";

const departments = ["IT", "HR", "Manager", "Employee"];
const onboardingRoles = ["Employee"];
const documentTypes = REQUIRED_DOCUMENT_TYPES;

const emptyForm = {
  name: "",
  email: "",
  department: "IT",
  jobTitle: "",
  startDate: "",
  manager: "",
  password: "",
  role: "Employee",
};

const emptyTrainingForm = {
  title: "",
  description: "",
  videoFileName: "",
  videoUrl: "",
  pdfFileName: "",
  pdfUrl: "",
};

const emptyHrDashboardSummary = {
  totalEmployees: 0,
  activeOnboardings: 0,
  docsPendingVerification: 0,
  completedThisMonth: 0,
  lifecycle: {
    initiated: 0,
    inProgress: 0,
    pendingApproval: 0,
    completed: 0,
  },
  recentActivities: [],
};

const employeeDataPages = new Set(["Onboard Employee", "Employees", "Documents"]);
let cachedHrDashboardSummary = null;
let pendingHrDashboardSummaryRequest = null;
let cachedHrNotifications = null;
let pendingHrNotificationsRequest = null;

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Onboard Employee", icon: UserPlus },
  { label: "Employees", icon: Users },
  { label: "Documents", icon: FileText },
  { label: "Training Management", icon: GraduationCap },
  { label: "Notifications", icon: Bell },
  { label: "Reports", icon: BarChart2 },
  { label: "Settings", icon: Settings },
];

const statusStyles = {
  Initiated: "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
  "In Progress": "bg-blue-950/40 text-blue-400 border-blue-900/50",
  "Pending Approval": "bg-amber-950/40 text-amber-400 border-amber-900/50",
  "HR Verification": "bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/50",
  Completed: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
};

const lifecycleStages = [
  { key: "initiated", label: "Initiated", icon: UserPlus, color: "#6366F1" },
  { key: "inProgress", label: "In Progress", icon: ClipboardCheck, color: "#3B82F6" },
  { key: "pendingApproval", label: "Pending Approval", icon: FileText, color: "#EC4899" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "#10B981" },
];

const checklist = [
  { label: "Profile created", progress: 0 },
  { label: "Documents submitted", progress: 25 },
  { label: "Documents verified", progress: 50 },
  { label: "Manager approval", progress: 75 },
  { label: "IT access provisioned", progress: 100 },
];

const filters = ["All", "Initiated", "In Progress", "Pending Approval", "HR Verification", "Completed"];

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  const parsedDate = dateValue instanceof Date
    ? dateValue
    : typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())
      ? new Date(`${dateValue.trim()}T00:00:00`)
      : new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function dateToMillis(dateValue) {
  if (!dateValue) {
    return 0;
  }

  const parsedDate = dateValue instanceof Date
    ? dateValue
    : typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())
      ? new Date(`${dateValue.trim()}T00:00:00`)
      : new Date(dateValue);

  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function formatToday() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
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

function toCount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getActivityColor(module = "") {
  const normalizedModule = module.toLowerCase();

  if (normalizedModule.includes("document")) return "#EC4899";
  if (normalizedModule.includes("training")) return "#10B981";
  if (normalizedModule.includes("approval")) return "#F59E0B";
  if (normalizedModule.includes("notification")) return "#3B82F6";
  if (normalizedModule.includes("report")) return "#8B5CF6";
  return "#6366F1";
}

function normalizeHrDashboardSummary(summary = {}) {
  return {
    totalEmployees: toCount(summary.totalEmployees),
    activeOnboardings: toCount(summary.activeOnboardings),
    docsPendingVerification: toCount(summary.docsPendingVerification),
    completedThisMonth: toCount(summary.completedThisMonth),
    lifecycle: {
      initiated: toCount(summary.lifecycle?.initiated),
      inProgress: toCount(summary.lifecycle?.inProgress),
      pendingApproval: toCount(summary.lifecycle?.pendingApproval),
      completed: toCount(summary.lifecycle?.completed),
    },
    recentActivities: (Array.isArray(summary.recentActivities) ? summary.recentActivities : [])
      .slice(0, 5)
      .map((activity, index) => {
        const module = activity.module || "Dashboard";
        return {
          id: activity.id ?? `${module}-${activity.timestamp || index}`,
          message: activity.message || activity.action || "Action recorded",
          color: getActivityColor(module),
          createdAt: dateToMillis(activity.timestamp),
        };
      }),
  };
}

function getStatusFromProgress(progress) {
  if (progress >= 100) {
    return "Completed";
  }

  if (progress >= 75) {
    return "Pending Approval";
  }

  if (progress >= 25) {
    return "In Progress";
  }

  return "Initiated";
}

function ShellCard({ children, className = "" }) {
  return (
    <section className={`rounded-xl border border-[#222533] bg-[#13151D] ${className}`}>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function ProgressBar({ value }) {
  const status = getStatusFromProgress(value);
  const barColor =
    status === "Completed"
      ? "bg-[#10B981]"
      : status === "Pending Approval"
        ? "bg-[#3B82F6]"
        : status === "In Progress"
          ? "bg-[#6366F1]"
          : "bg-[#8B5CF6]";

  return (
    <div className="min-w-[140px]">
      <div className="h-2 overflow-hidden rounded-full bg-[#191C26]">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-[#94A3B8]">{value}%</p>
    </div>
  );
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const { addUser, logout: logoutFromContext } = useAuth();
  const [userName, setUserName] = useState("HR Manager");
  const [employees, setEmployees] = useState([]);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toast, setToast] = useState("");
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [rejectionDrafts, setRejectionDrafts] = useState({});
  const [expandedRejectId, setExpandedRejectId] = useState("");
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);
  const [selectedDocName, setSelectedDocName] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [activeReport, setActiveReport] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [trainingModules, setTrainingModules] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(emptyHrDashboardSummary);
  const [trainingForm, setTrainingForm] = useState(emptyTrainingForm);
  const [trainingError, setTrainingError] = useState("");
  const [isCreatingTraining, setIsCreatingTraining] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState("");
  const employeeDataLoadedRef = useRef(false);
  const employeeDocumentDataRequestRef = useRef(null);
  const trainingDataLoadedRef = useRef(false);

  const loadDashboardSummary = async ({ force = false } = {}) => {
    if (cachedHrDashboardSummary && !force) {
      setDashboardSummary(cachedHrDashboardSummary);
      return;
    }

    if (!pendingHrDashboardSummaryRequest || force) {
      pendingHrDashboardSummaryRequest = dashboardService
        .getHrDashboardSummary()
        .then(normalizeHrDashboardSummary)
        .then((summary) => {
          cachedHrDashboardSummary = summary;
          return summary;
        })
        .finally(() => {
          pendingHrDashboardSummaryRequest = null;
        });
    }

    setDashboardSummary(await pendingHrDashboardSummaryRequest);
  };

  const loadNotifications = async ({ force = false } = {}) => {
    if (cachedHrNotifications && !force) {
      setNotifications(cachedHrNotifications);
      return;
    }

    if (!pendingHrNotificationsRequest || force) {
      pendingHrNotificationsRequest = notificationService
        .listNotifications({ recipientRole: "HR Manager" })
        .then((notificationList) => {
          cachedHrNotifications = notificationList;
          return notificationList;
        })
        .finally(() => {
          pendingHrNotificationsRequest = null;
        });
    }

    setNotifications(await pendingHrNotificationsRequest);
  };

  const loadEmployeeDocumentData = async ({ force = false } = {}) => {
    if (employeeDataLoadedRef.current && !force) {
      return;
    }

    if (!employeeDocumentDataRequestRef.current) {
      employeeDocumentDataRequestRef.current = Promise.all([
        employeeService.listEmployees(),
        onboardingWorkflowService.listDocuments(null),
      ])
        .then(([employeeList, documentList]) => {
          const documentsByEmployeeId = documentList.reduce((acc, document) => {
            const key = String(document.employeeId);
            acc[key] = acc[key] || [];
            acc[key].push(document);
            return acc;
          }, {});

          setEmployees(employeeList.map((employee) => {
            const documentRecords = documentsByEmployeeId[String(employee.databaseId || employee.raw?.id)] || [];
            const documents = mapDocumentsByType(documentRecords);
            return {
              ...employee,
              documents,
              documentRecords,
              docsStatus: getDocumentWorkflowStatus(documents),
            };
          }));
          employeeDataLoadedRef.current = true;
        })
        .finally(() => {
          employeeDocumentDataRequestRef.current = null;
        });
    }

    await employeeDocumentDataRequestRef.current;
  };

  const loadTrainingData = async ({ force = false } = {}) => {
    if (trainingDataLoadedRef.current && !force) {
      return;
    }

    const moduleList = await trainingService.listTrainingModules();
    setTrainingModules(moduleList);
    trainingDataLoadedRef.current = true;
  };

  const refreshData = async ({
    forceDashboardSummary = false,
    forceEmployeeData = false,
    forceTrainingData = false,
    forceNotifications = false,
  } = {}) => {
    setIsLoadingData(true);
    setApiError("");

    try {
      const requests = [
        loadDashboardSummary({ force: forceDashboardSummary }),
        loadNotifications({ force: forceNotifications }),
      ];

      if (employeeDataPages.has(activePage) || forceEmployeeData) {
        requests.push(loadEmployeeDocumentData({ force: forceEmployeeData }));
      }

      if (activePage === "Training Management" || forceTrainingData) {
        requests.push(loadTrainingData({ force: forceTrainingData }));
      }

      await Promise.all(requests);
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to load HR dashboard data."));
    } finally {
      setIsLoadingData(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const normalizedRole = normalizeUserRole(role);
    const storedName = localStorage.getItem("userName");
    const savedSettings = loadRoleSettings(normalizedRole);

    if (!token || role !== "HR Manager") {
      navigate("/login");
      return;
    }

    setUserName(savedSettings.userName || storedName || "HR Manager");
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "HR Manager") {
      return;
    }

    refreshData({ forceEmployeeData: activePage === "Employees" || activePage === "Documents" });
  }, [activePage]);

  const stats = useMemo(() => {
    return {
      total: dashboardSummary.totalEmployees,
      active: dashboardSummary.activeOnboardings,
      pendingDocs: dashboardSummary.docsPendingVerification,
      completed: dashboardSummary.completedThisMonth,
    };
  }, [dashboardSummary]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        !search.trim() ||
        employee.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        employee.email.toLowerCase().includes(search.trim().toLowerCase()) ||
        employee.id.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const documentQueue = employees.filter(
    (employee) => ["Submitted", "Under Review", "Rejected", "Approved"].includes(employee.docsStatus),
  );

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const handleLogout = () => {
    logoutFromContext();
    logoutPreservingSettings();
    navigate("/login");
  };

  const handleSidebarPageClick = (label) => {
    const refreshEmployeeData = label === "Employees" || label === "Documents";
    const isCurrentPage = activePage === label;

    setActivePage(label);

    if (label === "Onboard Employee") {
      setIsOnboardOpen(true);
    }

    if (refreshEmployeeData && isCurrentPage) {
      refreshData({ forceEmployeeData: true });
    }
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    if (isCreatingEmployee) {
      return;
    }

    const hasEmptyField = Object.values(form).some((value) => !String(value).trim());

    if (hasEmptyField) {
      setFormError("Fill in all fields before initiating onboarding.");
      return;
    }

    let createdUser;
    setIsCreatingEmployee(true);
    try {
      createdUser = await addUser({
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password.trim(),
        role: form.role,
        department: form.department,
        startDate: form.startDate,
        status: "Active",
      });
    } catch (err) {
      setFormError(err.message || "Failed to create user account.");
      return;
    } finally {
      setIsCreatingEmployee(false);
    }

    if (form.role !== "Employee") {
      refreshData();
      showToast(`${form.role} account created for ${form.name.trim()}. No Employee ID generated.`);
      setForm(emptyForm);
      setFormError("");
      setIsOnboardOpen(false);
      return;
    }

    try {
      const employee = await employeeService.createEmployee(form);
      await refreshData({ forceDashboardSummary: true, forceEmployeeData: true });
      showToast(`Onboarding initiated for ${employee.name}! Employee ID ${employee.id} created.`);
      setForm(emptyForm);
      setFormError("");
      setIsOnboardOpen(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Employee account was created, but employee onboarding could not be saved."));
    }
  };

  const handleVerifyDocument = async (document, { reReview = false } = {}) => {
    if (!document?.id) {
      setApiError("Document record was not found. Refresh the dashboard and try again.");
      return false;
    }

    try {
      const reviewAction = reReview ? onboardingWorkflowService.reReviewDocument : onboardingWorkflowService.reviewDocument;
      await reviewAction(document.id, "VERIFIED");
      await refreshData({ forceDashboardSummary: true, forceEmployeeData: true });
      showToast(`${document.documentType} ${reReview ? "re-reviewed and " : ""}verified successfully.`);
      return true;
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to verify document."));
      return false;
    }
  };

  const handleConfirmReject = async (document, { reReview = false } = {}) => {
    const reasonKey = String(document.id);
    const reason = (rejectionDrafts[reasonKey] || "").trim();

    if (!reason) {
      setRejectionDrafts((current) => ({ ...current, [reasonKey]: "" }));
      return false;
    }

    if (!document?.id) {
      setApiError("Document record was not found. Refresh the dashboard and try again.");
      return false;
    }

    try {
      const reviewAction = reReview ? onboardingWorkflowService.reReviewDocument : onboardingWorkflowService.reviewDocument;
      await reviewAction(document.id, "REJECTED", reason);
      await refreshData({ forceDashboardSummary: true, forceEmployeeData: true });
      setExpandedRejectId("");
      showToast(`${document.documentType} ${reReview ? "re-reviewed and " : ""}rejected.`);
      return true;
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to reject document."));
      return false;
    }
  };

  const selectTrainingFile = (field, file) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTrainingForm((current) => ({
        ...current,
        [`${field}FileName`]: file.name,
        [`${field}Url`]: reader.result,
      }));
      setTrainingError("");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTrainingModule = async (event) => {
    event.preventDefault();
    if (isCreatingTraining) {
      return;
    }

    if (!trainingForm.title.trim() || !trainingForm.description.trim() || !trainingForm.videoUrl || !trainingForm.pdfUrl) {
      setTrainingError("Add a title, description, video file, and PDF document.");
      return;
    }

    try {
      setIsCreatingTraining(true);
      await trainingService.createTrainingModule({
        title: trainingForm.title.trim(),
        description: trainingForm.description.trim(),
        videoUrl: trainingForm.videoUrl,
        pdfUrl: trainingForm.pdfUrl,
      });
      setTrainingForm(emptyTrainingForm);
      await refreshData({ forceTrainingData: true });
      showToast("Training module uploaded successfully.");
    } catch (err) {
      setTrainingError(getApiErrorMessage(err, "Unable to create training module."));
    } finally {
      setIsCreatingTraining(false);
    }
  };

  const pageTitle = activePage === "Dashboard" ? "HR Manager Dashboard" : activePage;

  return (
    <div className="dashboard-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC]">
      {toast ? (
        <div className="fixed right-5 top-5 z-[70] rounded-md border border-emerald-500/30 bg-[#13151D] px-4 py-3 text-sm font-semibold text-emerald-400 shadow-2xl shadow-black/55">
          {toast}
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#222533] bg-[#0D0E12]">
        <Link
          to="/"
          className="flex h-20 items-center gap-3 px-5 text-inherit no-underline"
          aria-label="OnboardPro landing page"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white shadow-lg shadow-indigo-950/50">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold">
            <span>Onboard</span>
            <span className="text-[#38C7BE]">Pro</span>
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
                onClick={() => handleSidebarPageClick(item.label)}
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
              <p className="text-xs text-[#94A3B8]">HR Manager</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">OnboardPro</p>
            <h1 className="mt-1 text-2xl font-bold text-[#F8FAFC]">{pageTitle}</h1>
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
          {isLoadingData ? (
            <div className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm font-semibold text-[#94A3B8]">
              Loading real employee-service data...
            </div>
          ) : null}

          {apiError ? (
            <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
              {apiError}
            </div>
          ) : null}

          {activePage === "Dashboard" ? (
            <>
              <WelcomeBanner userName={userName} stats={stats} />
              <StatsRow stats={stats} />
              <LifecycleOverview lifecycle={dashboardSummary.lifecycle} />
              <ActivityFeed activities={dashboardSummary.recentActivities} />
            </>
          ) : null}

          {activePage === "Onboard Employee" ? (
            <>
          <OnboardingForm
            isOpen={isOnboardOpen}
            setIsOpen={setIsOnboardOpen}
            form={form}
            updateForm={updateForm}
            formError={formError}
            handleCreateEmployee={handleCreateEmployee}
            isSubmitting={isCreatingEmployee}
          />
              <ActiveOnboardings
                employees={filteredEmployees}
                allEmployeesCount={employees.length}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onView={setSelectedEmployee}
              />
            </>
          ) : null}

          {activePage === "Employees" ? (
            <ActiveOnboardings
              employees={filteredEmployees}
              allEmployeesCount={employees.length}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onView={setSelectedEmployee}
            />
          ) : null}

          {activePage === "Documents" ? (
            <DocumentQueue
              employees={employees}
              rejectionDrafts={rejectionDrafts}
              setRejectionDrafts={setRejectionDrafts}
              expandedRejectId={expandedRejectId}
              setExpandedRejectId={setExpandedRejectId}
              onVerify={handleVerifyDocument}
              onConfirmReject={handleConfirmReject}
              onOpenDoc={(url, name) => {
                setSelectedDocUrl(url);
                setSelectedDocName(name);
              }}
            />
          ) : null}

          {activePage === "Training Management" ? (
            <TrainingManagementView
              modules={trainingModules}
              form={trainingForm}
              setForm={setTrainingForm}
              error={trainingError}
              isSubmitting={isCreatingTraining}
              onSelectFile={selectTrainingFile}
              onSubmit={handleCreateTrainingModule}
            />
          ) : null}

          {activePage === "Reports" ? (
            <ReportsView
              activeReport={activeReport}
              setActiveReport={setActiveReport}
            />
          ) : null}

          {activePage === "Notifications" ? (
            <NotificationsView
              notifications={notifications}
              onUpdate={async (id, updates) => {
                if (updates.read) {
                  try {
                    await notificationService.markNotificationRead(id);
                    await refreshData({ forceNotifications: true });
                  } catch (err) {
                    setApiError(getApiErrorMessage(err, "Unable to update notification."));
                  }
                }
              }}
              onDelete={(id) => {
                setApiError("Deleting notifications is not available from the employee-service API.");
              }}
              onMarkAllRead={async () => {
                try {
                  await Promise.all(notifications.filter((item) => !item.read).map((item) => notificationService.markNotificationRead(item.id)));
                  await refreshData({ forceNotifications: true });
                } catch (err) {
                  setApiError(getApiErrorMessage(err, "Unable to mark notifications as read."));
                }
              }}
            />
          ) : null}

          {activePage === "Settings" ? (
            <HRSettings userName={userName} setUserName={setUserName} showToast={showToast} />
          ) : null}
        </main>
      </div>

      {selectedEmployee ? (
        <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      ) : null}

      {selectedDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative flex flex-col w-full max-w-4xl h-[85vh] rounded-xl border border-[#222533] bg-[#13151D] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222533] bg-[#191C26] px-6 py-4">
              <h3 className="text-lg font-bold text-[#F8FAFC] truncate">{selectedDocName}</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedDocUrl;
                    link.download = selectedDocName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-[#F8FAFC] hover:bg-indigo-500 transition duration-200 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocUrl(null);
                    setSelectedDocName("");
                  }}
                  className="rounded-md border border-[#222533] bg-[#191C26] p-2 text-[#94A3B8] hover:text-[#F8FAFC] transition duration-200"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#090A0F] flex items-center justify-center p-6">
              {(() => {
                const isImage = selectedDocUrl && (selectedDocUrl.startsWith("data:image/") || selectedDocUrl.toLowerCase().endsWith(".png") || selectedDocUrl.toLowerCase().endsWith(".jpg") || selectedDocUrl.toLowerCase().endsWith(".jpeg") || selectedDocUrl.toLowerCase().endsWith(".gif") || selectedDocUrl.toLowerCase().endsWith(".svg"));
                const isPdf = selectedDocUrl && (selectedDocUrl.startsWith("data:application/pdf") || selectedDocUrl.toLowerCase().endsWith(".pdf"));

                if (isImage) {
                  return (
                    <img
                      src={selectedDocUrl}
                      alt={selectedDocName}
                      className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                    />
                  );
                } else if (isPdf) {
                  return (
                    <iframe
                      src={selectedDocUrl}
                      title={selectedDocName}
                      className="w-full h-full border-0 rounded-md bg-white"
                    />
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md rounded-xl border border-[#222533] bg-[#191C26]/60 backdrop-blur-md shadow-xl">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                      </div>
                      <h4 className="text-xl font-bold text-[#F8FAFC] mb-2">Preview Unsupported</h4>
                      <p className="text-sm text-[#94A3B8] mb-6">
                        We can't preview this file type in the browser. Please download the document to view its contents.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = selectedDocUrl;
                          link.download = selectedDocName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="rounded-md bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-[#F8FAFC] hover:bg-indigo-500 transition duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                      >
                        <Download className="h-4 w-4" />
                        Download Document
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeBanner({ userName, stats }) {
  return (
    <ShellCard className="p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#F8FAFC]">Welcome back, {userName} 👋</h2>
          <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
            You have {stats.pendingDocs} pending documents to verify and {stats.active} active onboardings.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-[#94A3B8]">
          <CalendarDays className="h-5 w-5 text-[#EC4899]" aria-hidden="true" />
          <span className="text-sm font-semibold">{formatToday()}</span>
        </div>
      </div>
    </ShellCard>
  );
}

function StatsRow({ stats }) {
  const cards = [
    { label: "Total Employees", value: stats.total, icon: Users, color: "text-[#6366F1]" },
    { label: "Active Onboardings", value: stats.active, icon: UserPlus, color: "text-indigo-400" },
    { label: "Docs Pending Verification", value: stats.pendingDocs, icon: FileCheck, color: "text-[#3B82F6]" },
    { label: "Completed This Month", value: stats.completed, icon: CheckCircle2, color: "text-[#10B981]" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <ShellCard key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#94A3B8]">{card.label}</p>
                <p className="mt-3 text-4xl font-bold text-[#F8FAFC]">{card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-md bg-[#191C26] ${card.color}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </ShellCard>
        );
      })}
    </div>
  );
}

function OnboardingForm({ isOpen, setIsOpen, form, updateForm, formError, handleCreateEmployee, isSubmitting }) {
  return (
    <ShellCard>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between p-6 text-left"
      >
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Onboard New Employee</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Initiate a new onboarding workflow.</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-[#6366F1] transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <form className="border-t border-[#222533] p-6" onSubmit={handleCreateEmployee}>
          {formError ? <p className="mb-5 rounded-md bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">{formError}</p> : null}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Full Name" id="hr-name">
              <input
                id="hr-name"
                type="text"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Work Email" id="hr-email">
              <input
                id="hr-email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Department" id="hr-department">
              <select
                id="hr-department"
                value={form.department}
                onChange={(event) => updateForm("department", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job Title" id="hr-job-title">
              <input
                id="hr-job-title"
                type="text"
                value={form.jobTitle}
                onChange={(event) => updateForm("jobTitle", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Start Date" id="hr-start-date">
              <input
                id="hr-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => updateForm("startDate", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Reporting Manager" id="hr-manager">
              <input
                id="hr-manager"
                type="text"
                value={form.manager}
                onChange={(event) => updateForm("manager", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Password" id="hr-password">
              <input
                id="hr-password"
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
            <Field label="Role" id="hr-role">
              <select
                id="hr-role"
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              >
                {onboardingRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending Email..." : "Initiate Onboarding"}
          </button>
        </form>
      ) : null}
    </ShellCard>
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

function ActiveOnboardings({
  employees,
  allEmployeesCount,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onView,
}) {
  return (
    <ShellCard className="overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-[#222533] p-6 xl:flex-row xl:items-end xl:justify-between bg-[#0D0E12]/20">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Active Onboardings</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Track employees added through onboarding.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Search" id="onboarding-search">
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="onboarding-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-md border border-[#222533] bg-[#191C26] py-3 pl-10 pr-4 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </div>
          </Field>
          <Field label="Filter" id="status-filter">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            >
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {allEmployeesCount === 0 ? (
        <EmptyState
          icon={UserPlus}
          iconColor="text-[#6366F1]"
          title="No onboardings yet"
          text="Use the form above to initiate your first employee onboarding."
        />
      ) : employees.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#94A3B8]">No onboardings match the current search or filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Dept</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-[#F8FAFC]">{employee.name}</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">{employee.email}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-[#94A3B8]">{employee.department}</td>
                  <td className="px-6 py-5 text-sm text-[#94A3B8]">{formatDate(employee.startDate)}</td>
                  <td className="px-6 py-5">
                    <ProgressBar value={employee.progress} />
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={employee.status} />
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => onView(employee)}
                      className="rounded-md border border-[#222533] px-3 py-2 text-sm font-semibold text-indigo-400 transition hover:bg-[#6366F1]/10 hover:border-indigo-500/30"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ShellCard>
  );
}

function EmptyState({ icon: Icon, iconColor, title, text }) {
  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center p-8 text-center">
      <Icon className={`h-16 w-16 opacity-30 ${iconColor}`} aria-hidden="true" />
      <h3 className="mt-5 text-lg font-bold text-[#F8FAFC]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#94A3B8]">{text}</p>
    </div>
  );
}

function LegacyDocumentQueue({
  employees,
  rejectionDrafts,
  setRejectionDrafts,
  onVerify,
  onConfirmReject,
  onOpenDoc,
}) {
  const [docSearch, setDocSearch] = useState("");
  const [statusTab, setStatusTab] = useState("All"); // All, Pending, Verified, Rejected
  const [rejectingDocId, setRejectingDocId] = useState(null); // format: `${employeeId}-${docType}`

  // Gather all uploaded documents
  const allDocs = useMemo(() => {
    const docs = [];
    employees.forEach((emp) => {
      if (emp.documents) {
        Object.entries(emp.documents).forEach(([key, val]) => {
          const isStandard = REQUIRED_DOCUMENT_TYPES.includes(key);
          if (isStandard && val && val.uploaded) {
            docs.push({
              employeeId: emp.id,
              employeeName: emp.name,
              documentType: key,
              fileName: val.fileName,
              uploadDate: val.uploadedAt || val.uploadDate || val.createdAt || emp.submittedDate || null,
              reviewedAt: val.reviewedAt || null,
              verificationStatus: val.verificationStatus || "Pending",
              fileUrl: val.fileUrl,
              size: val.size || 0,
            });
          }
        });
      }
    });
    // Sort so Pending is first
    return docs.sort((a, b) => {
      if (a.verificationStatus === "Pending" && b.verificationStatus !== "Pending") return -1;
      if (a.verificationStatus !== "Pending" && b.verificationStatus === "Pending") return 1;
      return dateToMillis(b.uploadDate) - dateToMillis(a.uploadDate);
    });
  }, [employees]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      const matchesStatus = statusTab === "All" || doc.verificationStatus === statusTab;
      const matchesSearch =
        doc.employeeName.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.employeeId.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(docSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allDocs, statusTab, docSearch]);

  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ShellCard className="overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-[#222533] p-6 xl:flex-row xl:items-end xl:justify-between bg-[#0D0E12]/20">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Document Verification</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Review, verify, or reject documents uploaded by onboarding employees.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[480px]">
          <Field label="Search Documents" id="doc-search">
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="doc-search"
                type="search"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search name, ID, file..."
                className="w-full rounded-md border border-[#222533] bg-[#191C26] py-3 pl-10 pr-4 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </div>
          </Field>
          <Field label="Status Filter" id="doc-status-filter">
            <div className="mt-2 flex gap-1 rounded-md border border-[#222533] bg-[#13151D] p-1">
              {["All", "Pending", "Verified", "Rejected"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusTab(tab)}
                  className={`flex-1 rounded py-2 text-xs font-semibold transition ${
                    statusTab === tab
                      ? "bg-[#6366F1] text-white shadow"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          iconColor="text-[#6366F1]"
          title={allDocs.length === 0 ? "No documents uploaded yet" : "No documents match search criteria"}
          text={allDocs.length === 0 ? "When employees submit documents, they will appear here." : "Try adjusting your filters or search query."}
        />
      ) : (
        <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 bg-[#13151D]/10">
          {filteredDocs.map((doc) => {
            const docId = `${doc.employeeId}-${doc.documentType}`;
            const isRejecting = rejectingDocId === docId;
            const statusColor =
              doc.verificationStatus === "Verified"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : doc.verificationStatus === "Rejected"
                  ? "border-rose-500/25 bg-rose-500/10 text-rose-400"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-400";

            return (
              <div key={docId} className="flex flex-col rounded-xl border border-[#222533] bg-[#191C26] p-5 shadow-lg transition hover:border-[#6366F1]/30">
                {/* Employee Header */}
                <div className="flex items-center gap-3 border-b border-[#222533]/60 pb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13151D] text-xs font-bold text-[#6366F1] border border-[#222533]">
                    {getInitials(doc.employeeName)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-[#F8FAFC] truncate text-sm">{doc.employeeName}</p>
                    <p className="text-xs text-[#94A3B8] truncate">{doc.employeeId}</p>
                  </div>
                </div>

                {/* Document details */}
                <div className="mt-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                      {doc.documentType}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusColor}`}>
                      {doc.verificationStatus}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-[#F8FAFC] truncate" title={doc.fileName}>
                    {doc.fileName}
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#94A3B8]">
                    <div>
                      <p className="text-[10px] uppercase text-[#64748B]">Uploaded</p>
                      <p className="mt-0.5 font-medium text-[#E2E8F0]">{formatDate(doc.uploadDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#64748B]">Size</p>
                      <p className="mt-0.5 font-medium text-[#E2E8F0]">{Math.ceil(doc.size / 1024)} KB</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-2 border-t border-[#222533]/60 pt-4">
                  <button
                    type="button"
                    onClick={() => onOpenDoc(doc.fileUrl, doc.fileName)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-[#222533] bg-[#13151D] px-2 py-2 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#191C26] transition"
                    title="Open Document Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open Doc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-[#222533] bg-[#13151D] px-2 py-2 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#191C26] transition"
                    title="Download File"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>

                {/* Verification Decisions */}
                {doc.verificationStatus === "Pending" && !isRejecting && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onVerify(doc.employeeId, doc.documentType)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-md bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition py-2 text-xs font-bold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingDocId(docId)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-md bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 transition py-2 text-xs font-bold"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}

                {/* Rejection input */}
                {isRejecting && (
                  <div className="mt-4 rounded-md border border-rose-500/20 bg-rose-500/5 p-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`reject-${docId}`} className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Rejection Reason
                      </label>
                      <button
                        type="button"
                        onClick={() => setRejectingDocId(null)}
                        className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      id={`reject-${docId}`}
                      value={rejectionDrafts[docId] || ""}
                      onChange={(event) =>
                        setRejectionDrafts((current) => ({ ...current, [docId]: event.target.value }))
                      }
                      rows={2}
                      placeholder="Specify why the document is invalid..."
                      className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#F8FAFC] outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 px-3 py-2 text-xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmReject(doc.employeeId, doc.documentType);
                        setRejectingDocId(null);
                      }}
                      className="mt-2 w-full rounded-md bg-rose-600 hover:bg-rose-500 text-white transition duration-200 py-1.5 text-xs font-bold"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ShellCard>
  );
}

function DocumentQueue({ employees, rejectionDrafts, setRejectionDrafts, onVerify, onConfirmReject, onOpenDoc }) {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [reReviewingDocId, setReReviewingDocId] = useState(null);

  const documentEmployees = useMemo(() => employees
    .filter((employee) => employee.documentRecords?.length)
    .map((employee) => {
      const documentRecords = [...employee.documentRecords].sort((a, b) => {
        const aIndex = REQUIRED_DOCUMENT_TYPES.indexOf(a.documentType);
        const bIndex = REQUIRED_DOCUMENT_TYPES.indexOf(b.documentType);
        if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
        if (aIndex >= 0) return -1;
        if (bIndex >= 0) return 1;
        return dateToMillis(b.createdAt) - dateToMillis(a.createdAt);
      });
      const statuses = documentRecords.map((document) => String(document.status || "UPLOADED").toUpperCase());
      const verificationStatus = statuses.some((status) => status === "REJECTED")
        ? "Rejected"
        : statuses.every((status) => status === "VERIFIED")
          ? "Verified"
          : "Pending";

      return { ...employee, documentRecords, verificationStatus };
    }), [employees]);

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return documentEmployees;
    return documentEmployees.filter((employee) =>
      employee.name.toLowerCase().includes(query)
      || String(employee.employeeId || employee.id).toLowerCase().includes(query)
    );
  }, [documentEmployees, employeeSearch]);

  const selectedEmployee = documentEmployees.find((employee) => String(employee.databaseId) === String(selectedEmployeeId)) || null;

  const statusLabel = (status) => {
    const normalized = String(status || "UPLOADED").toUpperCase();
    if (normalized === "VERIFIED") return "Verified";
    if (normalized === "REJECTED") return "Rejected";
    return "Pending";
  };

  const statusClass = (status) => {
    if (status === "Verified") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-400";
    if (status === "Rejected") return "border-rose-500/25 bg-rose-500/10 text-rose-400";
    return "border-amber-500/25 bg-amber-500/10 text-amber-400";
  };

  const downloadDocument = (document) => {
    const link = window.document.createElement("a");
    link.href = document.storageUrl;
    link.download = document.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <ShellCard className="overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-[#222533] bg-[#0D0E12]/20 p-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Document Verification</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Review all uploaded documents grouped by employee.</p>
        </div>
        <div className="w-full xl:max-w-md">
          <Field label="Search Employees" id="document-employee-search">
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="document-employee-search"
                type="search"
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Search by employee name or ID..."
                className="w-full rounded-md border border-[#222533] bg-[#191C26] py-3 pl-10 pr-4 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1]"
              />
            </div>
          </Field>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          iconColor="text-[#6366F1]"
          title={documentEmployees.length === 0 ? "No documents uploaded yet" : "No employees match your search"}
          text={documentEmployees.length === 0 ? "When employees submit documents, they will appear here." : "Search by employee name or employee ID."}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-[#222533] bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8]">
              <tr>
                <th className="px-6 py-4">Employee Name</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Uploaded Documents</th>
                <th className="px-6 py-4">Verification Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
              {filteredEmployees.map((employee) => (
                <tr key={employee.databaseId}>
                  <td className="px-6 py-5 font-semibold text-[#F8FAFC]">{employee.name}</td>
                  <td className="px-6 py-5 text-sm text-[#94A3B8]">{employee.employeeId || employee.id}</td>
                  <td className="px-6 py-5 text-sm text-[#94A3B8]">{employee.departmentName || employee.department}</td>
                  <td className="px-6 py-5 text-sm text-[#94A3B8]">{employee.documentRecords.length}</td>
                  <td className="px-6 py-5">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(employee.verificationStatus)}`}>
                      {employee.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeId(employee.databaseId)}
                      className="rounded-md border border-[#6366F1]/30 bg-[#6366F1]/10 px-4 py-2 text-sm font-semibold text-indigo-400 transition hover:bg-[#6366F1]/20"
                    >
                      View Documents
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEmployee ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-5xl overflow-hidden rounded-xl border border-[#222533] bg-[#0D0E12] shadow-2xl shadow-black/70">
            <div className="flex items-start justify-between border-b border-[#222533] p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Employee Documents</p>
                <h3 className="mt-2 text-2xl font-bold text-[#F8FAFC]">{selectedEmployee.name}</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">{selectedEmployee.employeeId || selectedEmployee.id} | {selectedEmployee.departmentName || selectedEmployee.department}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setRejectingDocId(null);
                  setReReviewingDocId(null);
                }}
                className="rounded-md border border-[#222533] p-2 text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]"
                aria-label="Close documents"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-6">
              {selectedEmployee.documentRecords.map((document) => {
                const documentId = String(document.id);
                const documentStatus = statusLabel(document.status);
                const isPending = documentStatus === "Pending";
                const isRejecting = rejectingDocId === documentId;
                const isReReviewing = reReviewingDocId === documentId;
                return (
                  <div key={document.id} className="rounded-lg border border-[#222533] bg-[#13151D] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="font-bold text-[#F8FAFC]">{document.documentType}</h4>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(documentStatus)}`}>{documentStatus}</span>
                        </div>
                        <p className="mt-2 truncate text-sm text-[#94A3B8]">{document.fileName}</p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Uploaded {formatDate(document.createdAt)}
                          {document.fileSize ? ` | ${Math.ceil(document.fileSize / 1024)} KB` : ""}
                        </p>
                        {documentStatus === "Rejected" && document.reviewComment ? <p className="mt-2 text-xs text-rose-400">Review comment: {document.reviewComment}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onOpenDoc(document.storageUrl, document.fileName)} className="inline-flex items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-xs font-semibold text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]">
                          <Eye className="h-4 w-4" /> Open Document
                        </button>
                        <button type="button" onClick={() => downloadDocument(document)} className="inline-flex items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-xs font-semibold text-[#94A3B8] transition hover:bg-[#191C26] hover:text-[#F8FAFC]">
                          <Download className="h-4 w-4" /> Download
                        </button>
                        {isPending ? (
                          <>
                            <button type="button" onClick={() => onVerify(document)} className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20">
                              <CheckCircle2 className="h-4 w-4" /> Verify
                            </button>
                            <button type="button" onClick={() => setRejectingDocId(documentId)} className="inline-flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20">
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReReviewingDocId(isReReviewing ? null : documentId);
                              setRejectingDocId(null);
                            }}
                            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
                          >
                            Re-review
                          </button>
                        )}
                      </div>
                    </div>
                    {isReReviewing ? (
                      <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-xs font-bold text-amber-400">Authorized HR Re-review</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">Choose a new final decision for this document.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const verified = await onVerify(document, { reReview: true });
                              if (verified) setReReviewingDocId(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Mark Verified
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingDocId(documentId)}
                            className="inline-flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                          >
                            <XCircle className="h-4 w-4" /> Mark Rejected
                          </button>
                          <button type="button" onClick={() => setReReviewingDocId(null)} className="rounded-md border border-[#222533] px-4 py-2 text-xs font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">Cancel</button>
                        </div>
                      </div>
                    ) : null}
                    {isRejecting ? (
                      <div className="mt-4 rounded-md border border-rose-500/20 bg-rose-500/5 p-4">
                        <label htmlFor={`reject-${documentId}`} className="text-xs font-bold text-rose-400">Rejection Reason</label>
                        <textarea
                          id={`reject-${documentId}`}
                          rows={2}
                          value={rejectionDrafts[documentId] || ""}
                          onChange={(event) => setRejectionDrafts((current) => ({ ...current, [documentId]: event.target.value }))}
                          className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-rose-500"
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const rejected = await onConfirmReject(document, { reReview: isReReviewing });
                              if (rejected) {
                                setRejectingDocId(null);
                                setReReviewingDocId(null);
                              }
                            }}
                            className="rounded-md bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-500"
                          >
                            Confirm Rejection
                          </button>
                          <button type="button" onClick={() => setRejectingDocId(null)} className="rounded-md border border-[#222533] px-4 py-2 text-xs font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">Cancel</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </ShellCard>
  );
}

function LifecycleOverview({ lifecycle }) {
  return (
    <ShellCard className="p-6">
      <h2 className="text-xl font-bold text-[#F8FAFC]">Onboarding Lifecycle</h2>
      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {lifecycleStages.map((stage, index) => {
          const Icon = stage.icon;
          const count = lifecycle?.[stage.key] ?? 0;

          return (
            <div key={stage.label} className="relative">
              {index < lifecycleStages.length - 1 ? (
                <ChevronRight className="absolute -right-5 top-9 hidden h-6 w-6 text-[#94A3B8] lg:block" />
              ) : null}
              <div className="rounded-md border border-[#222533] bg-[#191C26] p-5 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${stage.color}22`, color: stage.color }}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-4 text-3xl font-bold text-[#F8FAFC]">{count}</p>
                <p className="mt-2 text-sm font-semibold text-[#94A3B8]">{stage.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ShellCard>
  );
}

function ActivityFeed({ activities }) {
  return (
    <ShellCard className="p-6">
      <h2 className="text-xl font-bold text-[#F8FAFC]">Recent Activity</h2>
      {activities.length === 0 ? (
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
    </ShellCard>
  );
}

function HRSettings({ userName, setUserName, showToast }) {
  const [employeeId, setEmployeeId] = useState(getStoredEmployeeId());
  const [profileForm, setProfileForm] = useState({
    fullName: userName,
    email: localStorage.getItem("userEmail") || "",
    phone: loadRoleSettings(normalizeUserRole(localStorage.getItem("userRole"))).profileForm?.phone || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const profile = await userProfileService.getCurrentUserProfile();
        if (cancelled) return;
        setEmployeeId(profile.employeeId || "Not assigned");
        setProfileForm((current) => ({
          ...current,
          fullName: profile.fullName || current.fullName,
          email: profile.email || current.email,
          phone: profile.phoneNumber || current.phone,
        }));
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
      <ShellCard className="p-6">
        <h3 className="text-lg font-bold text-[#F8FAFC]">Profile Information</h3>
        {profileLoading ? <p className="mt-3 text-sm text-[#94A3B8]">Loading profile...</p> : null}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Full Name" id="hr-settings-name">
            <input id="hr-settings-name" type="text" value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition" />
          </Field>
          <Field label="Email" id="hr-settings-email">
            <input id="hr-settings-email" type="email" value={profileForm.email} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm text-[#94A3B8] outline-none" />
          </Field>
          <Field label="Employee ID" id="hr-settings-employee-id">
            <input id="hr-settings-employee-id" type="text" value={employeeId} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] px-4 py-3 text-sm text-[#94A3B8] outline-none" />
          </Field>
          <Field label="Phone Number" id="hr-settings-phone">
            <input id="hr-settings-phone" type="text" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition" />
          </Field>
        </div>
        <button type="button" onClick={saveProfile} disabled={profileLoading} className="mt-5 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-bold disabled:opacity-60">
          {profileLoading ? "Saving..." : "Update Profile"}
        </button>
      </ShellCard>

      <ShellCard className="p-6">
        <ThemeSettingsPanel />
      </ShellCard>

      <ShellCard className="p-6">
        <ChangePasswordSection idPrefix="hr" showToast={showToast} />
      </ShellCard>
    </div>
  );
}

function EmployeeDrawer({ employee, onClose }) {
  const isChecklistDone = (item) => {
    if (item.label === "Profile created") return employee.progress >= 25;
    if (item.label === "Documents submitted") {
      return ["Submitted", "Under Review", "Approved", "Rejected"].includes(employee.docsStatus);
    }
    if (item.label === "Documents verified") return employee.docsStatus === "Approved";
    if (item.label === "Manager approval") return employee.progress >= 75;
    if (item.label === "IT access provisioned") return employee.progress >= 100;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
      <aside className="ml-auto h-full w-[380px] overflow-y-auto border-l border-[#222533] bg-[#0D0E12] p-6 text-[#F8FAFC] shadow-2xl shadow-black/80">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-400">{employee.id}</p>
            <h2 className="mt-2 text-2xl font-bold">{employee.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#222533] text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC] transition duration-200"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 space-y-4 rounded-md border border-[#222533] bg-[#13151D] p-4">
          {[
            ["Department", employee.department],
            ["Start Date", formatDate(employee.startDate)],
            ["Job Title", employee.jobTitle],
            ["Reporting Manager", employee.manager],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-[#94A3B8]">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold">Onboarding checklist</h3>
          <div className="mt-4 space-y-3">
            {checklist.map((item) => {
              const isDone = isChecklistDone(item);
              return (
                <div key={item.label} className="flex items-center justify-between rounded-md bg-[#191C26] px-4 py-3 border border-[#222533]">
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[#94A3B8]" aria-hidden="true" />
                    )}
                    <span className="text-sm font-semibold text-[#F8FAFC]">{item.label}</span>
                  </div>
                  <span className={`text-xs font-semibold ${isDone ? "text-emerald-400" : "text-[#94A3B8]"}`}>
                    {isDone ? "Done" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold">Timeline</h3>
          <div className="mt-4 space-y-4">
            {employee.events.map((event) => (
              <div key={event.id} className="border-l border-[#6366F1] pl-4">
                <p className="text-sm font-semibold text-[#F8FAFC]">{event.message}</p>
                <p className="mt-1 text-xs text-[#94A3B8]">{timeAgo(event.time)}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TrainingManagementView({ modules, form, setForm, error, isSubmitting, onSelectFile, onSubmit }) {
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#F8FAFC]">Training Management</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">Create training modules with a video and supporting PDF document.</p>
      </div>

      <ShellCard className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Module Title" id="training-title">
              <input
                id="training-title"
                type="text"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1]"
              />
            </Field>
            <Field label="Description" id="training-description">
              <textarea
                id="training-description"
                rows={3}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1]"
              />
            </Field>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <UploadBox
              id="training-video"
              label="Video File"
              accept="video/*"
              fileName={form.videoFileName}
              icon={Video}
              onChange={(file) => onSelectFile("video", file)}
            />
            <UploadBox
              id="training-pdf"
              label="PDF Document"
              accept="application/pdf,.pdf"
              fileName={form.pdfFileName}
              icon={FileText}
              onChange={(file) => onSelectFile("pdf", file)}
            />
          </div>

          {error ? <p className="text-sm font-semibold text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#6366F1] px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Uploading..." : "Create Training Module"}
          </button>
        </form>
      </ShellCard>

      <ShellCard className="overflow-hidden">
        <div className="border-b border-[#222533] p-6">
          <h3 className="text-lg font-bold text-[#F8FAFC]">Uploaded Training Modules</h3>
        </div>
        {modules.length === 0 ? (
          <div className="p-8 text-sm text-[#94A3B8]">No training modules uploaded yet.</div>
        ) : (
          <div className="divide-y divide-[#222533]">
            {modules.map((module) => (
              <div key={module.id} className="grid gap-5 p-6 lg:grid-cols-[1fr_260px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-lg font-bold text-[#F8FAFC]">{module.title}</h4>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      Uploaded {formatDate(module.uploadDate)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{module.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a href={module.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-sm font-semibold text-[#38C7BE] transition hover:bg-[#191C26]">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      View PDF
                    </a>
                    <a href={module.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-sm font-semibold text-[#38C7BE] transition hover:bg-[#191C26]">
                      <Video className="h-4 w-4" aria-hidden="true" />
                      Open Video
                    </a>
                  </div>
                </div>
                <video controls className="h-36 w-full rounded-md border border-[#222533] bg-black object-contain">
                  <source src={module.videoUrl} />
                </video>
              </div>
            ))}
          </div>
        )}
      </ShellCard>
    </div>
  );
}

function UploadBox({ id, label, accept, fileName, icon: Icon, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#F8FAFC]">{label}</p>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0])}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className="mt-2 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#222533] bg-[#191C26] px-4 py-5 text-center text-sm font-semibold text-[#94A3B8] transition hover:border-[#6366F1] hover:text-[#F8FAFC]"
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
        <span className="mt-3">{fileName || `Choose ${label.toLowerCase()}`}</span>
        <span className="mt-1 text-xs font-medium text-[#64748B]">Stored as the module URL</span>
      </label>
    </div>
  );
}

function formatEnumLabel(value) {
  return String(value || "N/A")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ReportStatusBadge({ status }) {
  const label = formatEnumLabel(status);
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[label] || "border-[#222533] bg-[#191C26] text-[#94A3B8]"}`}>
      {label}
    </span>
  );
}

function ReportsView({ activeReport, setActiveReport }) {
  const [reportRows, setReportRows] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const reportCards = [
    {
      id: "completion",
      title: "Onboarding Completion Report",
      description: "Summary of completed onboardings",
      empty: "No completed onboardings yet",
      load: reportService.getHrOnboardingCompletionReport,
      columns: [
        {
          label: "Employee",
          render: (row) => (
            <>
              <p className="font-semibold text-[#F8FAFC]">{row.employeeName}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{row.employeeCode}</p>
            </>
          ),
        },
        { label: "Department", render: (row) => row.department },
        { label: "Status", render: (row) => <ReportStatusBadge status={row.onboardingStatus} /> },
        { label: "Progress", render: (row) => `${row.progress ?? 0}%` },
        { label: "Start Date", render: (row) => formatDate(row.startDate) },
        { label: "Last Updated", render: (row) => formatDate(row.lastUpdatedAt) },
      ],
    },
    {
      id: "documents",
      title: "Document Verification Report",
      description: "Review document verification status",
      empty: "No data available",
      load: reportService.getHrDocumentVerificationReport,
      columns: [
        {
          label: "Employee",
          render: (row) => (
            <>
              <p className="font-semibold text-[#F8FAFC]">{row.employeeName}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{row.employeeCode}</p>
            </>
          ),
        },
        { label: "Department", render: (row) => row.department },
        { label: "Document", render: (row) => row.documentType },
        { label: "Status", render: (row) => <ReportStatusBadge status={row.status} /> },
        { label: "Reviewed By", render: (row) => row.reviewedBy || "N/A" },
        { label: "Uploaded", render: (row) => formatDate(row.uploadedAt) },
      ],
    },
    {
      id: "pending",
      title: "Pending Tasks Report",
      description: "Open onboardings that still need action",
      empty: "All onboardings completed",
      load: reportService.getHrPendingTasksReport,
      columns: [
        {
          label: "Employee",
          render: (row) => (
            <>
              <p className="font-semibold text-[#F8FAFC]">{row.employeeName}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{row.employeeCode}</p>
            </>
          ),
        },
        { label: "Department", render: (row) => row.department },
        { label: "Task", render: (row) => row.title },
        { label: "Assigned Role", render: (row) => formatEnumLabel(row.assignedRole) },
        { label: "Status", render: (row) => <ReportStatusBadge status={row.status} /> },
        { label: "Due Date", render: (row) => formatDate(row.dueDate) },
      ],
    },
  ];

  const selectedReport = reportCards.find((report) => report.id === activeReport);
  const generateReport = async (report) => {
    setActiveReport(report.id);
    setIsGeneratingReport(true);
    setReportError("");
    setReportRows([]);

    try {
      setReportRows(await report.load());
    } catch (err) {
      setReportError(getApiErrorMessage(err, "Unable to generate report."));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {reportError ? (
        <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
          {reportError}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {reportCards.map((report) => (
          <ShellCard key={report.id} className="p-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">{report.title}</h2>
            <p className="mt-2 min-h-[44px] text-sm leading-6 text-[#94A3B8]">{report.description}</p>
            <button
              type="button"
              onClick={() => generateReport(report)}
              disabled={isGeneratingReport}
              className="mt-5 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-4 py-3 text-sm font-bold"
            >
              {isGeneratingReport && activeReport === report.id ? "Generating..." : "Generate Report"}
            </button>
          </ShellCard>
        ))}
      </div>

      {selectedReport ? (
        <ShellCard className="overflow-hidden">
          <div className="border-b border-[#222533] p-6 bg-[#0D0E12]/20">
            <h2 className="text-xl font-bold text-[#F8FAFC]">{selectedReport.title}</h2>
          </div>
          {reportRows.length === 0 ? (
            <div className="p-8 text-sm text-[#94A3B8]">{selectedReport.empty}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                  <tr>
                    {selectedReport.columns.map((column) => (
                      <th key={column.label} className="px-6 py-4">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                  {reportRows.map((row, rowIndex) => (
                    <tr key={row.documentId || row.taskId || row.employeeCode || rowIndex}>
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
        </ShellCard>
      ) : null}
    </div>
  );
}

function NotificationsView({ notifications, onUpdate, onDelete, onMarkAllRead }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", "Documents", "Approvals", "Access Requests", "Onboarding", "System Alerts"];

  const getCategoryFromMsg = (msg) => {
    const text = msg.toLowerCase();
    if (text.includes("document") || text.includes("upload")) return "Documents";
    if (text.includes("approv") || text.includes("reject") || text.includes("verif")) return "Approvals";
    if (text.includes("access") || text.includes("provision") || text.includes("slack") || text.includes("github")) return "Access Requests";
    if (text.includes("onboarding") || text.includes("initiated") || text.includes("completed") || text.includes("credentials")) return "Onboarding";
    return "System Alerts";
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
      case "Documents": return <FileText className="h-5 w-5 text-[#3B82F6]" />;
      case "Approvals": return <CheckCircle2 className="h-5 w-5 text-[#10B981]" />;
      case "Access Requests": return <ClipboardCheck className="h-5 w-5 text-[#8B5CF6]" />;
      case "Onboarding": return <UserPlus className="h-5 w-5 text-[#6366F1]" />;
      case "System Alerts": return <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />;
      default: return <Bell className="h-5 w-5 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Notifications</h2>
          <p className="text-sm text-[#94A3B8]">Manage your HR alerts and updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMarkAllRead}
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
        {filteredNotifications.length === 0 ? (
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
                      {notif.time ? formatDistanceToNow(new Date(notif.time), { addSuffix: true }) : "just now"}
                    </span>
                  </div>
                  <p className={`notification-description text-sm ${notif.read ? "text-[#64748B]" : "text-[#CBD5E1]"}`}>
                    {notif.msg}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-center sm:self-start opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                  {!notif.read && (
                    <button
                      onClick={() => onUpdate(notif.id, { read: true })}
                      className="rounded p-1.5 text-[#94A3B8] hover:bg-emerald-500/10 hover:text-emerald-400 transition"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(notif.id)}
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
