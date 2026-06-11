import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Settings,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow as rawFormatDistanceToNow } from "date-fns";
import { getStoredEmployeeId, loadRoleSettings, normalizeUserRole, saveRoleSettings, logoutPreservingSettings } from "../../utils/roleSettings";
import { db } from "../../services/apiDataService";
import { apiClient, getApiErrorMessage, unwrapApiResponse } from "../../services/apiClient";
import { employeeDashboardService } from "../../services/employeeDashboardService";
import { notifyUserProfileUpdated, userProfileService } from "../../services/userProfileService";
import { credentialService } from "../../services/credentialService";
import { mapEmployee } from "../../services/employeeService";
import { notificationService } from "../../services/notificationService";
import { trainingService } from "../../services/trainingService";
import {
  REQUIRED_DOCUMENT_TYPES,
  getDocumentWorkflowStatus,
  mapDocumentsByType,
  mapTasksByChecklistKey,
  onboardingWorkflowService,
} from "../../services/onboardingWorkflowService";
import UserProfileMenu from "../../components/UserProfileMenu";
import ChangePasswordSection from "../../components/ChangePasswordSection";
import ThemeToggle, { ThemeSettingsPanel } from "../../components/ThemeToggle";

const formatDistanceToNow = (date, options) => {
  if (!date) return "Just now";
  
  let d;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "number") {
    d = new Date(date);
  } else if (typeof date === "string") {
    const trimmed = date.trim();
    if (/^\d+$/.test(trimmed)) {
      d = new Date(parseInt(trimmed, 10));
    } else {
      d = new Date(trimmed);
    }
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "Just now";
  try {
    const res = rawFormatDistanceToNow(d, options);
    if (res.includes("less than a minute")) {
      return "Just now";
    }
    return res;
  } catch (error) {
    return "Just now";
  }
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Checklist", icon: CheckSquare },
  { label: "Documents", icon: FileText },
  { label: "Training Completion", icon: GraduationCap },
  { label: "Access Requests", icon: KeyRound },
  { label: "My Credentials", icon: ShieldCheck },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];

const emptyDetails = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "Male",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
};

const documentTypes = REQUIRED_DOCUMENT_TYPES;
const emptyDocuments = () =>
  Object.fromEntries(documentTypes.map((type) => [type, { uploaded: false, fileName: "" }]));
const emptyPolicyChecks = {
  conduct: false,
  "working-hours": false,
  "anti-harassment": false,
  "data-security": false,
  "health-safety": false,
};

const emptyDashboardStats = {
  totalChecklistItems: 0,
  completedChecklistItems: 0,
  pendingTasksCount: 0,
  activeAccessRequestsCount: 0,
  notificationCount: 0,
};

const checklistOrder = ["personal", "documents", "policies", "training"];

function completedItemsFromSummary(summary, employee) {
  const completed = new Set();
  const policyChecks = employee?.policyChecks || emptyPolicyChecks;
  const progress = summary.onboardingProgress || 0;

  if ((employee?.phone && employee?.dob && employee?.address) || progress >= 25) {
    completed.add("personal");
  }
  if (progress >= 50) {
    completed.add("documents");
  }
  if (Object.values(policyChecks).every(Boolean) || progress >= 75) {
    completed.add("policies");
  }
  if (summary.trainingCompleted || summary.training?.status === "Completed" || progress >= 100) {
    completed.add("training");
  }

  return checklistOrder.filter((item) => completed.has(item));
}

function normalizeAccessRequestStatus(status) {
  const value = String(status || "").toUpperCase();
  return value || "REQUESTED";
}

function parseAccessCredentials(credentials) {
  if (!credentials) return null;
  if (typeof credentials === "object") return credentials;
  try {
    return JSON.parse(credentials);
  } catch {
    return { temporaryPassword: credentials, password: credentials };
  }
}

function mapEmployeeAccessRequest(request, employee) {
  return {
    raw: request,
    id: request.id,
    employeeId: request.employeeCode || request.employeeId || employee?.id,
    employeeName: employee?.name || request.employeeCode || `Employee ${request.employeeId}`,
    email: employee?.email || "",
    systemCatalogId: request.systemCatalogId,
    specificSystem: request.systemName,
    system: request.systemName,
    systemType: request.systemCategory || "",
    justification: request.justification || "",
    status: normalizeAccessRequestStatus(request.status),
    remarks: request.remarks || "",
    approvedBy: request.approvedBy || "",
    provisionedBy: request.provisionedBy || "",
    decidedAt: request.decidedAt,
    provisionedAt: request.provisionedAt,
    provisionedOn: request.provisionedOn,
    approvedDate: request.decidedAt,
    provisionedDate: request.provisionedAt || request.provisionedOn,
    submittedDate: request.createdAt,
    submittedOn: request.createdAt,
    priority: request.priority || "Medium",
    credentials: parseAccessCredentials(request.credentials),
  };
}

function getSessionEmployeeId(employee) {
  if (employee?.databaseId || employee?.raw?.id) {
    return String(employee.databaseId || employee.raw.id);
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const id = currentUser.databaseId || currentUser.employeeDatabaseId || currentUser.employeeId;
    if (id) {
      return String(id);
    }
  } catch {
    // Ignore malformed local storage and fall back to the flat key.
  }

  return localStorage.getItem("userEmployeeId") || "";
}

function normalizeCredentialStatus(status) {
  return String(status || "INACTIVE").toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE";
}

function mapEmployeeCredential(credential) {
  const systemName = credential.systemName || "Assigned System";
  const username = credential.username || "";
  return {
    id: `CRED-${credential.systemCatalogId ?? systemName}-${username}`,
    systemCatalogId: credential.systemCatalogId,
    systemName,
    username,
    password: credential.password || "",
    provisionedOn: credential.provisionedOn,
    status: normalizeCredentialStatus(credential.status),
  };
}

function mapEmployeeNotification(notification) {
  let title = notification.title || "System Update";
  let message = notification.message || notification.msg || "";
  if (!notification.title && notification.msg && notification.msg.includes(":")) {
    const parts = notification.msg.split(":");
    title = parts[0].trim();
    message = parts.slice(1).join(":").trim();
  }

  return {
    ...notification,
    title,
    message,
    role: notification.role || notification.recipientRole,
    email: notification.email || notification.recipientEmail,
    read: Boolean(notification.read ?? notification.readFlag),
    createdAt: notification.createdAt || notification.time || null,
  };
}

const createMockDocUrl = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif"].includes(ext)) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%2313151D"/><rect x="20" y="20" width="560" height="360" rx="10" fill="%23191C26" stroke="%23222533" stroke-width="2"/><circle cx="300" cy="150" r="50" fill="%236366F1" opacity="0.8"/><text x="300" y="240" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Image Preview</text><text x="300" y="270" fill="%2394A3B8" font-family="sans-serif" font-size="14" text-anchor="middle">${fileName}</text><text x="300" y="300" fill="%236366F1" font-family="sans-serif" font-size="12" text-anchor="middle">Click Download to save the file</text></svg>`;
  } else {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="100%" height="100%" fill="%2313151D"/><rect x="40" y="40" width="520" height="720" rx="8" fill="%23191C26" stroke="%23222533" stroke-width="2"/><path d="M450 40 L560 150 L450 150 Z" fill="%236366F1"/><rect x="80" y="120" width="200" height="30" rx="4" fill="%236366F1"/><rect x="80" y="200" width="440" height="15" rx="2" fill="%23222533"/><rect x="80" y="240" width="440" height="15" rx="2" fill="%23222533"/><rect x="80" y="280" width="300" height="15" rx="2" fill="%23222533"/><circle cx="300" cy="480" r="60" fill="%2310B981" opacity="0.1"/><path d="M280 480 L295 495 L325 465" stroke="%2310B981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="300" y="580" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Official PDF Document</text><text x="300" y="610" fill="%2394A3B8" font-family="sans-serif" font-size="14" text-anchor="middle">${fileName}</text></svg>`;
  }
};

const policies = [
  {
    key: "conduct",
    title: "Code of Conduct",
    text:
      "This policy sets the baseline for acceptable workplace behavior, professional ethics, and core company values. Employees are expected to act with integrity, communicate respectfully, protect company resources, and make decisions that support a trustworthy workplace.",
  },
  {
    key: "working-hours",
    title: "Working Hours & PTO",
    text:
      "This policy defines standard work schedules, remote or hybrid arrangements, lunch breaks, vacation, holidays, and time-off expectations. It helps employees plan responsibly while supporting team availability and business continuity.",
  },
  {
    key: "anti-harassment",
    title: "Anti-Harassment & Discrimination",
    text:
      "This policy guarantees a safe, inclusive environment by explicitly prohibiting harassment, bullying, discrimination, and bias. Every employee is responsible for treating colleagues fairly and reporting behavior that violates workplace standards.",
  },
  {
    key: "data-security",
    title: "Data Security & Privacy",
    text:
      "This policy governs how employees handle sensitive company and customer data. Employees must follow access controls, protect confidential information, avoid unsafe sharing, and help prevent cyber threats through secure daily work habits.",
  },
  {
    key: "health-safety",
    title: "Health and Safety",
    text:
      "This policy ensures compliance with workplace safety standards and outlines emergency procedures. Employees should understand evacuation routes, report hazards promptly, and follow safety guidance for office, remote, and hybrid work environments.",
  },
];

const requestStatuses = ["All", "REQUESTED", "APPROVED", "PROVISIONED", "REJECTED"];
const TRAINING_LOCK_MESSAGE = "Complete Policy Acknowledgement first to access training modules.";

const priorityStyles = {
  Low: "text-slate-400 border-slate-800 bg-slate-900/50",
  Medium: "text-indigo-400 border-indigo-950/50 bg-indigo-950/30",
  High: "text-amber-400 border-amber-950/50 bg-amber-950/30",
  Urgent: "text-rose-400 border-rose-950/50 bg-rose-950/30",
};

const requestStatusStyles = {
  REQUESTED: "text-amber-400 border-amber-950/50 bg-amber-950/30",
  PENDING: "text-amber-400 border-amber-950/50 bg-amber-950/30",
  APPROVED: "text-emerald-400 border-emerald-950/50 bg-emerald-950/30",
  PROVISIONED: "text-indigo-400 border-indigo-950/50 bg-indigo-950/30",
  REJECTED: "text-rose-400 border-rose-950/50 bg-rose-950/30",
};

const credentialStatusStyles = {
  ACTIVE: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  INACTIVE: "border-rose-500/25 bg-rose-500/10 text-rose-400",
};

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

  const parsedDate = value instanceof Date
    ? value
    : typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
      ? new Date(`${value.trim()}T00:00:00`)
      : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
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

// Deleted timeAgo in favor of formatDistanceToNow from date-fns

function progressTone(progress) {
  if (progress <= 25) {
    return { color: "#EC4899", label: progress === 0 ? "Not Started" : "Personal Details Done" };
  }

  if (progress <= 50) {
    return { color: "#3B82F6", label: "Documents Uploaded" };
  }

  if (progress <= 75) {
    return { color: "#6366F1", label: "Policy & Training Done" };
  }

  return { color: "#10B981", label: "Onboarding Complete 🎉" };
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

function Badge({ children, className }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Employee");
  const [userEmail, setUserEmail] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [details, setDetails] = useState(emptyDetails);
  const [detailsErrors, setDetailsErrors] = useState({});
  const [completedItems, setCompletedItems] = useState([]);
  const [expandedItem, setExpandedItem] = useState("personal");
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState(emptyDocuments);
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [policyChecks, setPolicyChecks] = useState(emptyPolicyChecks);
  const [policyError, setPolicyError] = useState("");
  const [trainingSummary, setTrainingSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState("All");
  const [availableSystems, setAvailableSystems] = useState([]);
  const [requestForm, setRequestForm] = useState({
    systemCatalogId: "",
    systemType: "",
    specificSystem: "",
    justification: "",
    priority: "Low",
    requiredBy: "",
  });
  const [requestErrors, setRequestErrors] = useState({});
  const [credentials, setCredentials] = useState([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState("");
  const [revealedCredential, setRevealedCredential] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(emptyDashboardStats);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [loadedPages, setLoadedPages] = useState({});
  const loadingPagesRef = useRef({});
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "", phone: "" });
  const [preferences, setPreferences] = useState({
    email: true,
    reminders: true,
    access: true,
    announcements: false,
  });
  const [toast, setToast] = useState("");

  const loadDashboardSummary = async () => {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const summary = await employeeDashboardService.getEmployeeDashboardSummary();
      const mappedEmployee = summary.employee ? mapEmployee(summary.employee) : null;
      const resolvedEmail = mappedEmployee?.email || localStorage.getItem("userEmail") || userEmail;
      const resolvedName = mappedEmployee?.name || summary.employeeName || userName;
      const summaryEmployee = mappedEmployee || {
        name: resolvedName,
        email: resolvedEmail,
        progress: summary.onboardingProgress || 0,
        policyChecks: emptyPolicyChecks,
      };
      const policyChecksFromSummary = summaryEmployee.policyChecks || emptyPolicyChecks;
      const doneItems = completedItemsFromSummary(summary, summaryEmployee);

      setEmployee(summaryEmployee);
      setUserName(resolvedName || "Employee");
      setUserEmail(resolvedEmail || "");
      setDetails({
        fullName: summaryEmployee.name || "",
        email: summaryEmployee.email || "",
        phone: summaryEmployee.phone || "",
        dob: summaryEmployee.dob || "",
        gender: summaryEmployee.gender || "Male",
        address: summaryEmployee.address || "",
        emergencyName: summaryEmployee.emergencyName || "",
        emergencyPhone: summaryEmployee.emergencyPhone || "",
      });
      setPolicyChecks(policyChecksFromSummary);
      setCompletedItems(doneItems);
      setTrainingSummary((current) => current || summary.training || null);
      setDashboardStats({
        totalChecklistItems: summary.totalTasks ?? summary.totalChecklistItems ?? emptyDashboardStats.totalChecklistItems,
        completedChecklistItems: summary.completedTasks ?? summary.completedChecklistItems ?? 0,
        pendingTasksCount: summary.pendingTasks ?? summary.pendingTasksCount ?? 0,
        activeAccessRequestsCount: summary.accessRequests ?? summary.accessRequestCount ?? summary.activeAccessRequestsCount ?? 0,
        notificationCount: summary.notificationCount || 0,
      });
    } catch (err) {
      setDashboardError(getApiErrorMessage(err, "Unable to load employee dashboard summary."));
    } finally {
      setDashboardLoading(false);
    }
  };

  const syncProfileState = (profile) => {
    const fullName = profile?.fullName || userName || "Employee";
    const email = profile?.email || userEmail || "";
    const phone = profile?.phoneNumber ?? profile?.phone ?? "";
    const employeeId = getStoredEmployeeId() || profile?.employeeCode || "";
    const role = profile?.role || "Employee";
    const accountStatus = profile?.accountStatus || "Active";

    setUserName(fullName);
    setUserEmail(email);
    setProfileForm((current) => ({ ...current, fullName, email, phone }));
    setDetails((current) => ({ ...current, fullName, email, phone }));
    setEmployee((current) => current
      ? {
          ...current,
          name: fullName,
          email,
          phone,
          raw: current.raw
            ? { ...current.raw, fullName, email, phoneNumber: phone }
            : current.raw,
        }
      : current);

    localStorage.setItem("userName", fullName);
    if (email) {
      localStorage.setItem("userEmail", email);
    }

    return {
      fullName,
      employeeId,
      email,
      role,
      accountStatus,
    };
  };

  const loadProfileSettings = async () => {
    try {
      const profile = await userProfileService.getEmployeeProfile();
      const menuProfile = syncProfileState(profile);
      notifyUserProfileUpdated(menuProfile);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to load employee profile."));
    }
  };

  const ensureEmployeeRecord = async () => {
    if (employee?.databaseId || employee?.raw?.id) {
      return employee;
    }

    const email = employee?.email || localStorage.getItem("userEmail") || userEmail;
    if (!email) {
      return null;
    }

    const loadedEmployee = await onboardingWorkflowService.getEmployeeByEmail(email);
    if (!loadedEmployee) {
      return null;
    }

    setEmployee(loadedEmployee);
    setUserName(loadedEmployee.name || userName);
    setUserEmail(loadedEmployee.email || email);
    setDetails({
      fullName: loadedEmployee.name || "",
      email: loadedEmployee.email || "",
      phone: loadedEmployee.phone || "",
      dob: loadedEmployee.dob || "",
      gender: loadedEmployee.gender || "Male",
      address: loadedEmployee.address || "",
      emergencyName: loadedEmployee.emergencyName || "",
      emergencyPhone: loadedEmployee.emergencyPhone || "",
    });
    setPolicyChecks(loadedEmployee.policyChecks || emptyPolicyChecks);

    return loadedEmployee;
  };

  const loadChecklistData = async () => {
    const currentEmployee = await ensureEmployeeRecord();
    const employeeId = currentEmployee?.databaseId || currentEmployee?.raw?.id;
    if (!employeeId) return;

    const [tasks, storedDocuments] = await Promise.all([
      onboardingWorkflowService.listTasks(employeeId).catch(() => []),
      onboardingWorkflowService.listDocuments(employeeId).catch(() => []),
    ]);

    const tasksByKey = mapTasksByChecklistKey(tasks);
    const persistedDocs = mapDocumentsByType(storedDocuments);
    const documentWorkflowStatus = getDocumentWorkflowStatus(persistedDocs);
    const persistedPolicyChecks = { ...emptyPolicyChecks, ...(currentEmployee.policyChecks || {}) };
    const policyAcknowledgmentComplete =
      tasksByKey.policies?.status === "COMPLETED"
      || Object.values(persistedPolicyChecks).every(Boolean);
    const loadedTrainingSummary = employeeId && policyAcknowledgmentComplete
      ? await trainingService.getEmployeeTraining(employeeId).catch(() => null)
      : null;
    const doneItems = [];

    if (tasksByKey.personal?.status === "COMPLETED" || (currentEmployee.address && currentEmployee.dob && currentEmployee.phone)) {
      doneItems.push("personal");
    }
    if (tasksByKey.documents?.status === "COMPLETED" || documentWorkflowStatus === "Approved") {
      doneItems.push("documents");
    }
    if (policyAcknowledgmentComplete) {
      doneItems.push("policies");
    }
    if (loadedTrainingSummary?.trainingStatus === "Completed" || tasksByKey.training?.status === "COMPLETED") {
      doneItems.push("training");
    }

    setDocuments({
      ...emptyDocuments(),
      ...persistedDocs,
    });
    setEmployee((current) => ({
      ...current,
      documents: persistedDocs,
      docsStatus: documentWorkflowStatus,
    }));
    setPolicyChecks(persistedPolicyChecks);
    setTrainingSummary(loadedTrainingSummary);
    setCompletedItems(doneItems);
    setDashboardStats((current) => ({
      ...current,
      totalChecklistItems: tasks.length,
      completedChecklistItems: doneItems.length,
      pendingTasksCount: tasks.filter((task) => task.status !== "COMPLETED").length,
    }));
  };

  const loadDocumentsData = async () => {
    const currentEmployee = await ensureEmployeeRecord();
    const employeeId = currentEmployee?.databaseId || currentEmployee?.raw?.id;
    if (!employeeId) return;

    const storedDocuments = await onboardingWorkflowService.listDocuments(employeeId).catch(() => []);
    const persistedDocs = mapDocumentsByType(storedDocuments);
    const documentWorkflowStatus = getDocumentWorkflowStatus(persistedDocs);
    setDocuments({
      ...emptyDocuments(),
      ...persistedDocs,
    });
    setEmployee((current) => ({
      ...current,
      documents: persistedDocs,
      docsStatus: documentWorkflowStatus,
    }));
  };

  const loadTrainingData = async () => {
    const currentEmployee = await ensureEmployeeRecord();
    const employeeId = currentEmployee?.databaseId || currentEmployee?.raw?.id;
    if (!employeeId) return;

    const loadedTrainingSummary = await trainingService.getEmployeeTraining(employeeId).catch(() => null);
    setTrainingSummary(loadedTrainingSummary);
  };

  const loadAccessRequestsData = async () => {
    const employeeId = getSessionEmployeeId(employee);
    if (!employeeId) return;

    const [requestResponse, systemsResponse] = await Promise.all([
      apiClient.get("/access-requests", { params: { employeeId } }),
      apiClient.get("/access-requests/active"),
    ]);
    const myRequests = unwrapApiResponse(requestResponse).map((request) => mapEmployeeAccessRequest(request, employee));
    const activeSystems = unwrapApiResponse(systemsResponse);

    setRequests(myRequests);
    setAvailableSystems(activeSystems);
    setDashboardStats((current) => ({
      ...current,
      activeAccessRequestsCount: myRequests.filter((request) => ["REQUESTED", "APPROVED"].includes(request.status)).length,
    }));
  };

  const loadCredentialsData = async ({ force = false } = {}) => {
    setCredentialsLoading(true);
    setCredentialsError("");

    try {
      const credentialRows = await credentialService.listCredentials({ force });
      setCredentials(credentialRows.map(mapEmployeeCredential));
    } catch (err) {
      setCredentials([]);
      setCredentialsError(getApiErrorMessage(err, "Unable to load credentials."));
    } finally {
      setCredentialsLoading(false);
    }
  };

  const loadNotificationsData = async () => {
    const email = employee?.email || localStorage.getItem("userEmail") || userEmail;
    if (!email) return;

    const myNotifications = await notificationService
      .listNotifications({ recipientEmail: email })
      .then((data) => data.map(mapEmployeeNotification))
      .catch(() => []);
    setNotifications(myNotifications);
    setDashboardStats((current) => ({
      ...current,
      notificationCount: myNotifications.filter((notification) => !notification.read).length,
    }));
  };

  const handleSidebarPageClick = (label, { trainingLocked = false } = {}) => {
    if (trainingLocked) {
      showToast(TRAINING_LOCK_MESSAGE);
      return;
    }

    setActivePage(label);

    if (label === "My Credentials") {
      loadCredentialsData({ force: true });
    }
  };

  const refreshData = async () => {
    employeeDashboardService.clearEmployeeDashboardSummaryCache();
    await db.loadAll();
    const activeSystems = db.getSystemCatalog().filter((system) => String(system.status || "").toLowerCase() === "active");
    setAvailableSystems(activeSystems);

    const email = localStorage.getItem("userEmail") || userEmail;
    if (!email) return;

    const list = db.getEmployees();
    let emp = list.find((e) => e.email.toLowerCase() === email.toLowerCase());
    if (!emp) {
      try {
        emp = await onboardingWorkflowService.getEmployeeByEmail(email);
      } catch {
        return;
      }
    }
    if (!emp) return;

    const employeeId = emp.databaseId || emp.raw?.id;
    const [tasks, storedDocuments] = employeeId
      ? await Promise.all([
          onboardingWorkflowService.listTasks(employeeId).catch(() => []),
          onboardingWorkflowService.listDocuments(employeeId).catch(() => []),
        ])
      : [[], []];

    const tasksByKey = mapTasksByChecklistKey(tasks);
    const persistedDocs = mapDocumentsByType(storedDocuments);
    const doneItems = [];
    const persistedPolicyChecks = { ...emptyPolicyChecks, ...(emp.policyChecks || {}) };
    const policyAcknowledgmentComplete =
      tasksByKey.policies?.status === "COMPLETED"
      || Object.values(persistedPolicyChecks).every(Boolean);
    const loadedTrainingSummary = employeeId && policyAcknowledgmentComplete
      ? await trainingService.getEmployeeTraining(employeeId).catch(() => null)
      : null;

    if (tasksByKey.personal?.status === "COMPLETED" || (emp.address && emp.dob && emp.phone)) {
      doneItems.push("personal");
    }
    const documentWorkflowStatus = getDocumentWorkflowStatus(persistedDocs);
    if (tasksByKey.documents?.status === "COMPLETED" || documentWorkflowStatus === "Approved") {
      doneItems.push("documents");
    }
    if (policyAcknowledgmentComplete) {
      doneItems.push("policies");
    }
    if (loadedTrainingSummary?.trainingStatus === "Completed" || tasksByKey.training?.status === "COMPLETED") {
      doneItems.push("training");
    }

    setDetails({
      fullName: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      dob: emp.dob || "",
      gender: emp.gender || "Male",
      address: emp.address || "",
      emergencyName: emp.emergencyName || "",
      emergencyPhone: emp.emergencyPhone || "",
    });

    setDocuments({
      ...emptyDocuments(),
      ...persistedDocs,
    });
    setEmployee({
      ...emp,
      documents: persistedDocs,
      docsStatus: documentWorkflowStatus,
    });

    setPolicyChecks(persistedPolicyChecks);
    setTrainingSummary(loadedTrainingSummary);
    setCompletedItems(doneItems);

    // Sync requests
    const allRequests = db.getAccessRequests();
    const myRequests = allRequests.filter(
      (r) => r.email?.toLowerCase() === email.toLowerCase() || r.employeeId === emp.id
    );
    setRequests(myRequests);

    // Sync notifications
    const myNotifs = db.getNotifications("Employee", email).map((n) => {
      let title = "System Update";
      let message = n.msg || "";
      if (n.msg && n.msg.includes(":")) {
        const parts = n.msg.split(":");
        title = parts[0].trim();
        message = parts.slice(1).join(":").trim();
      }
      
      let rawTime = n.createdAt || n.time || null;
      let parsedTime = null;
      if (rawTime !== null && rawTime !== undefined) {
        if (typeof rawTime === "number") {
          parsedTime = rawTime;
        } else if (typeof rawTime === "string") {
          const trimmed = rawTime.trim();
          if (/^\d+$/.test(trimmed)) {
            parsedTime = parseInt(trimmed, 10);
          } else {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
              parsedTime = trimmed;
            }
          }
        }
      }

      return {
        ...n,
        title: n.title || title,
        message: n.message || message,
        createdAt: parsedTime,
      };
    });
    setNotifications(myNotifs);
    setDashboardStats({
      totalChecklistItems: tasks.length,
      completedChecklistItems: doneItems.length,
      pendingTasksCount: tasks.filter((task) => task.status !== "COMPLETED").length,
      activeAccessRequestsCount: myRequests.filter((request) => ["REQUESTED", "APPROVED"].includes(request.status)).length,
      notificationCount: myNotifs.filter((notification) => !notification.read).length,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const normalizedRole = normalizeUserRole(role);
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const savedSettings = loadRoleSettings(normalizedRole);

    if (!token || role !== "Employee") {
      navigate("/login");
      return;
    }

    const resolvedName = savedSettings.userName || storedName || "Employee";
    const resolvedEmail = savedSettings.userEmail || storedEmail || "";
    const resolvedPhone = savedSettings.profileForm?.phone || "";
    const resolvedPreferences = savedSettings.preferences || {
      email: true,
      reminders: true,
      access: true,
      announcements: false,
    };

    setUserName(resolvedName);
    setUserEmail(resolvedEmail);

    setProfileForm({ fullName: resolvedName, email: resolvedEmail, phone: resolvedPhone });
    setDetails((current) => ({
      ...current,
      fullName: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
    }));
    setPreferences(resolvedPreferences);

    loadDashboardSummary();
  }, [navigate]);

  useEffect(() => {
    if (activePage === "Dashboard" || loadedPages[activePage] || loadingPagesRef.current[activePage]) {
      return;
    }

    let cancelled = false;
    const loadPageData = async () => {
      loadingPagesRef.current[activePage] = true;
      let loadedSuccessfully = false;
      try {
        if (activePage === "My Checklist") {
          await loadChecklistData();
        } else if (activePage === "Documents") {
          await loadDocumentsData();
        } else if (activePage === "Training Completion") {
          await loadTrainingData();
        } else if (activePage === "Access Requests") {
          await loadAccessRequestsData();
        } else if (activePage === "My Credentials") {
          await loadCredentialsData();
        } else if (activePage === "Notifications") {
          await loadNotificationsData();
        } else if (activePage === "Settings") {
          await loadProfileSettings();
        }

        if (!cancelled) {
          loadedSuccessfully = true;
          loadingPagesRef.current[activePage] = true;
          setLoadedPages((current) => ({ ...current, [activePage]: true }));
        }
      } catch (err) {
        if (!cancelled) {
          showToast(getApiErrorMessage(err, `Unable to load ${activePage}.`));
        }
      } finally {
        if (!loadedSuccessfully) {
          loadingPagesRef.current[activePage] = false;
        }
      }
    };

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [activePage, employee?.databaseId]);

  const completedCount = dashboardStats.completedChecklistItems || completedItems.length;
  const progress = employee?.progress ?? 0;
  const tone = progressTone(progress);
  const unreadCount = notifications.length
    ? notifications.filter((notification) => !notification.read).length
    : dashboardStats.notificationCount;

  const filteredRequests = useMemo(() => {
    if (requestFilter === "All") {
      return requests;
    }

    return requests.filter((request) => request.status === requestFilter);
  }, [requestFilter, requests]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const addNotification = (title, message, color = "#FF8A66") => {
    const email = localStorage.getItem("userEmail");
    db.addNotification("Employee", `${title}: ${message}`, color, email);
    refreshData();
  };

  const markChecklistItem = (item) => {
    setCompletedItems((current) => (current.includes(item) ? current : [...current, item]));
  };

  const isDone = (item) => completedItems.includes(item);
  const isUnlocked = (item) => {
    if (item === "personal") return true;
    if (item === "documents") return isDone("personal");
    if (item === "policies") return isDone("documents");
    return isDone("policies");
  };

  const handleLogout = () => {
    logoutPreservingSettings();
    navigate("/login");
  };

  const updateDetails = (field, value) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setDetailsErrors((current) => ({ ...current, [field]: "" }));
  };

  const saveDetails = async () => {
    const errors = {};
    Object.entries(details).forEach(([key, value]) => {
      if (!String(value).trim()) {
        errors[key] = "This field is required.";
      }
    });

    setDetailsErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const employeeId = employee?.databaseId || employee?.raw?.id;
    if (!employeeId) {
      showToast("Employee record is still loading. Try again in a moment.");
      return;
    }

    try {
      await onboardingWorkflowService.submitPersonalDetails(employeeId, details);
      db.addActivity(`${employee.name} updated personal details`, "#38C7BE");
      db.addAuditLog(employee.name, "Submitted personal details profile", "Employee Portal");
      await refreshData();
      showToast("Personal details saved successfully");
      setExpandedItem("documents");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to save personal details."));
    }
  };

  const selectDocument = (type, file) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments((current) => ({
        ...current,
        [type]: {
          fileName: file.name,
          size: file.size,
          contentType: file.type,
          uploaded: false,
          progress: 0,
          fileUrl: reader.result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };


  const uploadDocument = (type) => {
    const fileMeta = documents[type];
    if (!isUnlocked("documents")) {
      showToast("Complete Personal Details before uploading documents.");
      return;
    }
    if (!fileMeta?.fileName || uploadingDocs[type]) {
      return;
    }

    setUploadingDocs((current) => ({ ...current, [type]: true }));
    setDocuments((current) => ({ ...current, [type]: { ...current[type], progress: 35 } }));

    window.setTimeout(() => {
      setDocuments((current) => ({ ...current, [type]: { ...current[type], progress: 70 } }));
    }, 650);

    window.setTimeout(async () => {
      const employeeId = employee?.databaseId || employee?.raw?.id;
      if (!employeeId) {
        setUploadingDocs((current) => ({ ...current, [type]: false }));
        showToast("Employee record is still loading. Try again in a moment.");
        return;
      }

      try {
        await onboardingWorkflowService.uploadDocument(employeeId, type, {
          ...fileMeta,
          fileUrl: fileMeta.fileUrl || createMockDocUrl(fileMeta.fileName),
        });
        db.addActivity(`${employee.name} uploaded ${type}`, "#38C7BE");
        db.addAuditLog(employee.name, `Uploaded ${type}`, "Employee Portal");
        await refreshData();
        showToast(`${type} uploaded successfully`);
      } catch (err) {
        showToast(getApiErrorMessage(err, `Failed to upload ${type}.`));
      } finally {
        setUploadingDocs((current) => ({ ...current, [type]: false }));
      }
    }, 1500);
  };

  const acknowledgePolicies = async () => {
    const requiredKeys = ["conduct", "working-hours", "anti-harassment", "data-security", "health-safety"];
    const allChecked = requiredKeys.every((k) => policyChecks[k]);

    if (!allChecked) {
      setPolicyError("Please read and acknowledge all policies");
      return;
    }

    setPolicyError("");

    if (!isUnlocked("policies")) {
      setPolicyError("Complete Document Upload before acknowledging policies");
      return;
    }

    const employeeId = employee?.databaseId || employee?.raw?.id;
    if (!employeeId) {
      showToast("Employee record is still loading. Try again in a moment.");
      return;
    }

    try {
      await onboardingWorkflowService.acknowledgePolicies(employeeId, policyChecks);
      db.addActivity(`${employee.name} acknowledged all company policies`, "#FFD76A");
      db.addAuditLog(employee.name, "Acknowledged all policies", "Employee Portal");
      await refreshData();
      showToast("Policies acknowledged successfully");
      setExpandedItem("training");
    } catch (err) {
      setPolicyError(getApiErrorMessage(err, "Failed to acknowledge policies."));
    }
  };

  const completeTrainingModule = async (moduleId) => {
    if (!isDone("policies")) {
      showToast(TRAINING_LOCK_MESSAGE);
      return;
    }

    const employeeId = employee?.databaseId || employee?.raw?.id;
    if (!employeeId) {
      showToast("Employee record is still loading. Try again in a moment.");
      return;
    }

    try {
      const nextSummary = await trainingService.completeTrainingModule(employeeId, moduleId);
      setTrainingSummary(nextSummary);
      await refreshData();
      showToast(nextSummary.trainingStatus === "Completed" ? "Training completed successfully." : "Training module marked completed.");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Unable to complete training module."));
    }
  };
  const updateRequestSystem = (systemCatalogId) => {
    const selectedSystem = availableSystems.find((system) => String(system.id) === String(systemCatalogId));
    setRequestForm((current) => ({
      ...current,
      systemCatalogId,
      systemType: selectedSystem?.category || "",
      specificSystem: selectedSystem?.name || "",
    }));
    setRequestErrors((current) => ({ ...current, systemCatalogId: "", specificSystem: "" }));
  };

  const submitRequest = async (event) => {
    event.preventDefault();

    const errors = {};
    ["systemCatalogId", "justification", "requiredBy"].forEach((field) => {
      if (!String(requestForm[field]).trim()) {
        errors[field] = "This field is required.";
      }
    });

    setRequestErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const email = localStorage.getItem("userEmail") || employee?.email || userEmail;
    const employeeId = getSessionEmployeeId(employee);
    const selectedSystem = availableSystems.find((system) => String(system.id) === String(requestForm.systemCatalogId));

    if (!employeeId) {
      setRequestErrors({ employee: "Employee session is missing an employee ID. Sign in again and retry." });
      return;
    }

    if (!selectedSystem || String(selectedSystem.status || "").toLowerCase() !== "active") {
      setRequestErrors({ systemCatalogId: "Select an active system." });
      return;
    }

    const newRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId,
      employeeName: employee?.name || userName,
      email: email,
      department: employee?.department || "IT",
      systemCatalogId: selectedSystem.id,
      systemType: selectedSystem.category,
      specificSystem: selectedSystem.name,
      priority: requestForm.priority,
      submittedDate: todayIso(),
      status: "REQUESTED",
      justification: requestForm.justification,
      requiredBy: requestForm.requiredBy,
      remarks: "",
    };

    await apiClient.post("/access-requests", {
      employeeId: newRequest.employeeId,
      systemCatalogId: newRequest.systemCatalogId,
      systemName: newRequest.specificSystem,
      justification: newRequest.justification,
    });

    setRequestForm({
      systemCatalogId: "",
      systemType: "",
      specificSystem: "",
      justification: "",
      priority: "Low",
      requiredBy: "",
    });
    setIsRequestOpen(false);
    showToast("Access request submitted successfully");
    setLoadedPages((current) => ({ ...current, "Access Requests": false }));
    loadingPagesRef.current["Access Requests"] = false;
    await loadAccessRequestsData();
  };

  const updateProfile = async () => {
    const fullName = profileForm.fullName.trim();
    const phone = profileForm.phone.trim();

    if (!fullName) {
      showToast("Full name is required");
      return;
    }

    if (phone && !/^[+()\-\s0-9]{7,20}$/.test(phone)) {
      showToast("Enter a valid phone number");
      return;
    }

    try {
      const updatedProfile = await userProfileService.updateEmployeeProfile({
        fullName,
        phoneNumber: phone,
      });
      const menuProfile = syncProfileState(updatedProfile);

      const normalizedRole = normalizeUserRole(localStorage.getItem("userRole"));
      const existingSettings = loadRoleSettings(normalizedRole);
      const updatedSettings = {
        ...existingSettings,
        userName: menuProfile.fullName,
        userEmail: menuProfile.email,
        profileForm: {
          fullName: menuProfile.fullName,
          email: menuProfile.email,
          phone: updatedProfile.phoneNumber || "",
        },
        preferences,
      };

      saveRoleSettings(normalizedRole, updatedSettings);
      employeeDashboardService.clearEmployeeDashboardSummaryCache();
      notifyUserProfileUpdated(menuProfile);
      showToast("Profile updated successfully");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to update profile."));
    }
  };

  const updatePreferences = (updater) => {
    setPreferences((current) => {
      const nextPreferences = typeof updater === "function" ? updater(current) : updater;
      const normalizedRole = normalizeUserRole(localStorage.getItem("userRole"));
      const existingSettings = loadRoleSettings(normalizedRole);

      saveRoleSettings(normalizedRole, {
        ...existingSettings,
        userName: profileForm.fullName.trim(),
        userEmail: profileForm.email,
        profileForm: { ...profileForm },
        preferences: nextPreferences,
      });

      return nextPreferences;
    });
  };

  const pageTitle = activePage;

  return (
    <div className="dashboard-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC]">
      {toast ? (
        <div className="fixed right-5 top-5 z-[80] rounded-md border border-emerald-500/30 bg-[#13151D] px-4 py-3 text-sm font-semibold text-emerald-400 shadow-2xl shadow-black/55">
          {toast}
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#222533] bg-[#0D0E12]">
        <Link to="/" className="flex h-20 items-center gap-3 px-5 text-inherit no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6366F1] text-white shadow-lg shadow-indigo-950/50">
            <User className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-[#F8FAFC]">Onboard</span><span className="text-[#6366F1]">Pro</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.label;
            const trainingLocked = item.label === "Training Completion" && !isDone("policies");
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSidebarPageClick(item.label, { trainingLocked })}
                aria-disabled={trainingLocked}
                className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-semibold transition ${
                  trainingLocked
                    ? "cursor-not-allowed text-[#64748B] opacity-60"
                    : active
                      ? "bg-[#6366F1]/10 text-[#6366F1]"
                      : "text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </span>
                {trainingLocked ? (
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                ) : item.label === "Notifications" && unreadCount > 0 ? (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-[#F8FAFC]">{unreadCount}</span>
                ) : null}
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
              <p className="truncate text-sm font-bold">{userName}</p>
              <p className="text-xs text-[#94A3B8]">Employee</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Employee Portal</p>
            <h1 className="mt-1 text-2xl font-bold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActivePage("Notifications")}
              className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC] transition duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </header>

        <main className="space-y-6 p-8">
          {activePage === "Dashboard" ? (
            <DashboardView
              userName={userName}
              progress={progress}
              tone={tone}
              completedCount={completedCount}
              totalChecklistItems={dashboardStats.totalChecklistItems}
              pendingTasksCount={dashboardStats.pendingTasksCount}
              activeAccessRequestsCount={dashboardStats.activeAccessRequestsCount}
              loading={dashboardLoading}
              error={dashboardError}
              requests={requests}
            />
          ) : null}
          {activePage === "My Checklist" ? (
            <ChecklistView
              employee={employee}
              details={details}
              updateDetails={updateDetails}
              detailsErrors={detailsErrors}
              saveDetails={saveDetails}
              expandedItem={expandedItem}
              setExpandedItem={setExpandedItem}
              isDone={isDone}
              isUnlocked={isUnlocked}
              documents={documents}
              selectDocument={selectDocument}
              uploadDocument={uploadDocument}
              uploadingDocs={uploadingDocs}
              policyChecks={policyChecks}
              setPolicyChecks={setPolicyChecks}
              policyError={policyError}
              acknowledgePolicies={acknowledgePolicies}
              trainingSummary={trainingSummary}
              completeTrainingModule={completeTrainingModule}
              showToast={showToast}
            />
          ) : null}
          {activePage === "Documents" ? <DocumentsView documents={documents} /> : null}
          {activePage === "Training Completion" && isDone("policies") ? (
            <TrainingCompletionView
              trainingSummary={trainingSummary}
              employee={employee}
              completeTrainingModule={completeTrainingModule}
            />
          ) : null}
          {activePage === "Access Requests" ? (
            <AccessRequestsView
              isRequestOpen={isRequestOpen}
              setIsRequestOpen={setIsRequestOpen}
              requestForm={requestForm}
              setRequestForm={setRequestForm}
              updateRequestSystem={updateRequestSystem}
              requestErrors={requestErrors}
              submitRequest={submitRequest}
              requestFilter={requestFilter}
              setRequestFilter={setRequestFilter}
              filteredRequests={filteredRequests}
              requests={requests}
              availableSystems={availableSystems}
            />
          ) : null}
          {activePage === "My Credentials" ? (
            <CredentialsView
              credentials={credentials}
              userEmail={userEmail}
              loading={credentialsLoading}
              error={credentialsError}
              revealedCredential={revealedCredential}
              setRevealedCredential={setRevealedCredential}
            />
          ) : null}
          {activePage === "Notifications" ? (
            <NotificationsView
              notifications={notifications}
              setNotifications={setNotifications}
            />
          ) : null}
          {activePage === "Settings" ? (
            <SettingsView
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              updateProfile={updateProfile}
              showToast={showToast}
              preferences={preferences}
              setPreferences={updatePreferences}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DashboardView({
  userName,
  progress,
  tone,
  completedCount,
  totalChecklistItems,
  pendingTasksCount,
  activeAccessRequestsCount,
  loading,
  error,
}) {
  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Welcome, {userName} 👋</h2>
            <p className="mt-3 text-sm text-[#94A3B8]">Complete your onboarding checklist to get fully set up.</p>
            {loading ? <p className="mt-2 text-sm text-[#94A3B8]">Loading dashboard...</p> : null}
            {error ? <p className="mt-2 text-sm text-[#FF7A5A]">{error}</p> : null}
          </div>
          <div className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm font-semibold text-[#94A3B8]">
            {formatToday()}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LayoutDashboard} label="Onboarding Progress" color="#38C7BE">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold"
            style={{ background: `conic-gradient(${tone.color} ${progress}%, #191C26 0)` }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#13151D] text-[#F8FAFC]">{progress}%</div>
          </div>
        </StatCard>
        <StatCard icon={CheckSquare} label="Checklist Completed" color="#38C7BE">
          <p className="text-4xl font-bold">{completedCount} / {totalChecklistItems}</p>
          <p className="mt-1 text-sm text-[#94A3B8]">tasks</p>
        </StatCard>
        <StatCard icon={KeyRound} label="Access Requests" color="#FFD76A">
          <p className="text-4xl font-bold">{activeAccessRequestsCount}</p>
        </StatCard>
        <StatCard icon={Bell} label="Pending Tasks" color="#FF7A5A">
          <p className="text-4xl font-bold">{pendingTasksCount}</p>
        </StatCard>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold">Your Onboarding Progress</h2>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#191C26]">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: tone.color }} />
        </div>
        <p className="mt-4 text-sm font-semibold" style={{ color: tone.color }}>
          {tone.label}
        </p>
      </Card>
    </>
  );
}

function StatCard({ icon: Icon, label, color, children }) {
  return (
    <Card className="p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#191C26]" style={{ color }}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="mt-5">{children}</div>
      <p className="mt-3 text-sm font-medium text-[#94A3B8]">{label}</p>
    </Card>
  );
}

function ChecklistView(props) {
  const {
    employee,
    details,
    updateDetails,
    detailsErrors,
    saveDetails,
    expandedItem,
    setExpandedItem,
    isDone,
    isUnlocked,
    documents,
    selectDocument,
    uploadDocument,
    uploadingDocs,
    policyChecks,
    setPolicyChecks,
    policyError,
    acknowledgePolicies,
    trainingSummary,
    completeTrainingModule,
    showToast,
  } = props;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Onboarding Checklist</h2>
        <p className="mt-2 text-sm text-[#5F6B6A]">Complete all steps to finish your onboarding.</p>
      </div>

      <ChecklistCard
        id="personal"
        title="Personal Details Submission"
        description="Submit your contact, profile, and emergency details."
        color="#38C7BE"
        done={isDone("personal")}
        locked={false}
        expanded={expandedItem === "personal"}
        setExpandedItem={setExpandedItem}
      >
        <div className="grid gap-5 md:grid-cols-2">
          {[
            ["Full Name", "fullName", "text"],
            ["Work Email", "email", "email"],
            ["Phone Number", "phone", "text"],
            ["Date of Birth", "dob", "date"],
          ].map(([label, field, type]) => (
            <Field key={field} label={label} id={`details-${field}`}>
              <input
                id={`details-${field}`}
                type={type}
                value={details[field]}
                onChange={(event) => updateDetails(field, event.target.value)}
                readOnly={field === "fullName" || field === "email"}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
              {detailsErrors[field] ? <p className="mt-2 text-xs text-[#FF7A5A]">{detailsErrors[field]}</p> : null}
            </Field>
          ))}
          <Field label="Gender" id="details-gender">
            <select
              id="details-gender"
              value={details.gender}
              onChange={(event) => updateDetails("gender", event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            >
              {["Male", "Female", "Other"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address" id="details-address">
            <textarea
              id="details-address"
              rows={4}
              value={details.address}
              onChange={(event) => updateDetails("address", event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            />
            {detailsErrors.address ? <p className="mt-2 text-xs text-[#FF7A5A]">{detailsErrors.address}</p> : null}
          </Field>
          <Field label="Emergency Contact Name" id="details-emergency-name">
            <input
              id="details-emergency-name"
              type="text"
              value={details.emergencyName}
              onChange={(event) => updateDetails("emergencyName", event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            />
            {detailsErrors.emergencyName ? (
              <p className="mt-2 text-xs text-[#FF7A5A]">{detailsErrors.emergencyName}</p>
            ) : null}
          </Field>
          <Field label="Emergency Contact Phone" id="details-emergency-phone">
            <input
              id="details-emergency-phone"
              type="text"
              value={details.emergencyPhone}
              onChange={(event) => updateDetails("emergencyPhone", event.target.value)}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            />
            {detailsErrors.emergencyPhone ? (
              <p className="mt-2 text-xs text-[#FF7A5A]">{detailsErrors.emergencyPhone}</p>
            ) : null}
          </Field>
        </div>
        <button type="button" onClick={saveDetails} className="mt-6 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-bold">
          Save Details
        </button>
      </ChecklistCard>

      <ChecklistCard
        id="documents"
        title="Document Upload"
        description={isUnlocked("documents") ? "Upload required identity, education, and address documents." : "Complete Personal Details first"}
        color="#38C7BE"
        done={isDone("documents")}
        locked={!isUnlocked("documents")}
        expanded={expandedItem === "documents"}
        setExpandedItem={setExpandedItem}
      >
        {employee?.docsStatus === "Rejected" && employee?.rejectionReason ? (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">Documents Rejected by HR</p>
              <p className="mt-1 text-xs text-rose-300">Reason: {employee.rejectionReason}</p>
              <p className="mt-2 text-xs">Please review the details above and re-upload the documents.</p>
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-3">
          {documentTypes.map((type) => {
            const doc = documents[type];
            const inputId = `doc-${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            return (
              <div key={type} className="rounded-md border border-[#222533] bg-[#191C26] p-4">
                <Field label={type} id={inputId}>
                  <input
                    id={inputId}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => selectDocument(type, event.target.files?.[0])}
                    className="sr-only"
                  />
                  <label
                    htmlFor={inputId}
                    className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#222533] bg-[#13151D] px-4 py-5 text-sm font-semibold text-[#94A3B8] transition hover:border-[#6366F1] hover:text-[#F8FAFC]"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Choose file
                  </label>
                </Field>
                {doc?.fileName ? (
                  <p className="mt-3 text-xs text-[#94A3B8]">
                    {doc.fileName} · {Math.ceil(doc.size / 1024)} KB
                  </p>
                ) : null}
                {doc?.fileUrl || doc?.storageUrl ? (
                  <a
                    href={doc.fileUrl || doc.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-[#38C7BE] hover:text-[#7DDCD6]"
                  >
                    Preview uploaded document
                  </a>
                ) : null}
                {doc?.progress > 0 ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#13151D]">
                    <div className="h-full rounded-full bg-[#6366F1]" style={{ width: `${doc.progress}%` }} />
                  </div>
                ) : null}
                {doc?.uploaded && doc?.verificationStatus !== "Rejected" ? (
                  <div className="mt-3">
                    {doc.verificationStatus === "Verified" ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
                        Verified ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
                        Under Review
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    {doc?.verificationStatus === "Rejected" && (
                      <span className="text-xs font-semibold text-rose-400 mb-1">
                        Rejected ✗ (Please re-upload)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => uploadDocument(type)}
                      className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-bold text-[#F8FAFC] hover:bg-indigo-500 transition duration-200 disabled:opacity-50"
                      disabled={!doc?.fileName || uploadingDocs[type]}
                    >
                      {doc?.verificationStatus === "Rejected" ? "Re-upload" : "Upload"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ChecklistCard>

      <ChecklistCard
        id="policies"
        title="Policy Acknowledgment"
        description="Read and acknowledge the required company policies."
        color="#FFD76A"
        done={isDone("policies")}
        locked={!isUnlocked("policies")}
        expanded={expandedItem === "policies"}
        setExpandedItem={setExpandedItem}
      >
        <div className="mb-5 rounded-md border border-[#222533] bg-[#191C26] p-4">
          <h3 className="text-sm font-bold text-[#F8FAFC]">Why they are important</h3>
          <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
            These policies explain how employees work together safely, ethically, and responsibly.
            They protect people, company information, customer trust, and day-to-day business
            operations.
          </p>
        </div>
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.key} className="rounded-md border border-[#222533] bg-[#191C26] p-4">
              <h3 className="font-bold">{policy.title}</h3>
              <div className="mt-3 max-h-24 overflow-y-auto rounded-md bg-[#13151D] border border-[#222533] p-4 text-sm leading-6 text-[#94A3B8]">
                {policy.text}
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={policyChecks[policy.key]}
                  onChange={(event) => setPolicyChecks((current) => ({ ...current, [policy.key]: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-[#222533] bg-[#13151D] text-[#6366F1] focus:ring-[#6366F1]"
                />
                I have read and agree to the {policy.title}
              </label>
            </div>
          ))}
        </div>
        {policyError ? <p className="mt-4 text-sm text-[#FF7A5A]">{policyError}</p> : null}
        <button type="button" onClick={acknowledgePolicies} className="mt-5 rounded-md bg-[#6366F1] px-5 py-3 text-sm font-bold text-[#F8FAFC] hover:bg-indigo-500 transition duration-200">
          Acknowledge All Policies
        </button>
      </ChecklistCard>

      <ChecklistCard
        id="training"
        title="Training Completion"
        description={isUnlocked("training") ? "Complete the assigned onboarding training modules." : TRAINING_LOCK_MESSAGE}
        color="#27BFAE"
        done={isDone("training")}
        locked={!isUnlocked("training")}
        expanded={expandedItem === "training"}
        setExpandedItem={setExpandedItem}
        onLockedClick={() => showToast(TRAINING_LOCK_MESSAGE)}
      >
        <TrainingCompletionView
          trainingSummary={trainingSummary}
          employee={employee}
          completeTrainingModule={completeTrainingModule}
          compact
        />
      </ChecklistCard>
    </div>
  );
}

function ChecklistCard({ id, title, description, color, done, locked, expanded, setExpandedItem, onLockedClick, children }) {
  const status = locked ? "Locked" : done ? "Completed" : expanded ? "In Progress" : "Pending";

  return (
    <Card className="overflow-hidden" style={{}}>
      <div className="border-l-4" style={{ borderLeftColor: locked ? "#7A6F58" : color }}>
        <button
          type="button"
          disabled={locked && !onLockedClick}
          onClick={() => {
            if (locked) {
              onLockedClick?.();
              return;
            }
            setExpandedItem(expanded ? "" : id);
          }}
          className={`flex w-full items-center justify-between p-5 text-left transition duration-200 ${locked ? "cursor-not-allowed opacity-50" : "hover:bg-[#191C26]/30"}`}
        >
          <div className="flex items-start gap-4">
            <div className="mt-1">
              {locked ? (
                <LockKeyhole className="h-5 w-5 text-[#7A6F58]" aria-hidden="true" />
              ) : done ? (
                <CheckCircle2 className="h-5 w-5 text-[#27BFAE]" aria-hidden="true" />
              ) : (
                <CheckSquare className="h-5 w-5" style={{ color }} aria-hidden="true" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={
                locked
                  ? "border-[#222533] bg-[#191C26] text-[#94A3B8]"
                  : done
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-400"
              }
            >
              {status}
            </Badge>
            <ChevronDown className={`h-5 w-5 text-[#94A3B8] transition ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>
        {expanded && !locked ? <div className="border-t border-[#222533] p-5 bg-[#0D0E12]/30">{children}</div> : null}
      </div>
    </Card>
  );
}

function TrainingCompletionView({ trainingSummary, employee, completeTrainingModule, compact = false }) {
  const modules = trainingSummary?.modules || [];
  const progress = trainingSummary?.trainingProgress || 0;
  const status = trainingSummary?.trainingStatus || (modules.length ? "In Progress" : "Not Started");
  const Frame = ({ children, className = "" }) => compact
    ? <div className={`rounded-md border border-[#222533] bg-[#191C26] ${className}`}>{children}</div>
    : <Card className={className}>{children}</Card>;

  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
      {!compact ? (
        <div>
          <h2 className="text-2xl font-bold">Training Completion</h2>
          <p className="mt-2 text-sm text-[#5F6B6A]">Complete the modules uploaded by HR.</p>
        </div>
      ) : null}

      <Frame className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#94A3B8]">Training Status</p>
            <h3 className="mt-1 text-2xl font-bold text-[#F8FAFC]">{status}</h3>
            <p className="mt-1 text-sm text-[#5F6B6A]">
              {trainingSummary ? `${trainingSummary.completedModules} of ${trainingSummary.totalModules} modules completed` : "Training modules are loading."}
            </p>
          </div>
          <div className="min-w-[220px]">
            <div className="h-3 overflow-hidden rounded-full bg-[#191C26]">
              <div className="h-full rounded-full bg-[#27BFAE]" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-right text-sm font-bold text-[#27BFAE]">{progress}%</p>
          </div>
        </div>
      </Frame>

      {modules.length === 0 ? (
        <Frame>
          <EmptyState icon={GraduationCap} title="No training modules yet" text="Modules uploaded by HR will appear here." color="text-[#38C7BE]" />
        </Frame>
      ) : (
        <div className="grid gap-5">
          {modules.map((module) => (
            <Frame key={module.id} className="overflow-hidden">
              <div className="grid gap-5 p-5 xl:grid-cols-[1fr_420px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-[#F8FAFC]">{module.title}</h3>
                    {module.completed ? (
                      <Badge className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">Completed</Badge>
                    ) : (
                      <Badge className="border-amber-500/25 bg-amber-500/10 text-amber-400">Pending</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{module.description}</p>
                  <p className="mt-3 text-xs font-semibold text-[#5F6B6A]">Uploaded {formatDate(module.uploadDate)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={module.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-[#222533] px-3 py-2 text-sm font-semibold text-[#38C7BE] transition hover:bg-[#191C26]"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      View PDF Document
                    </a>
                    {!module.completed ? (
                      <button
                        type="button"
                        onClick={() => completeTrainingModule(module.id)}
                        disabled={!employee}
                        className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-bold text-[#F8FAFC] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Mark as Completed
                      </button>
                    ) : null}
                  </div>
                  {module.completedAt ? (
                    <p className="mt-3 text-xs font-semibold text-emerald-400">Completed {formatDate(module.completedAt)}</p>
                  ) : null}
                </div>
                <video controls className="min-h-[220px] w-full rounded-md border border-[#222533] bg-black object-contain">
                  <source src={module.videoUrl} />
                </video>
              </div>
            </Frame>
          ))}
        </div>
      )}

      {status === "Completed" ? (
        <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
          Training Status is Completed and Training Progress is 100%.
        </div>
      ) : null}
    </div>
  );
}

function DocumentsView({ documents }) {
  const uploadedDocuments = Object.entries(documents).filter(([, doc]) => doc.uploaded);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold">Documents</h2>
      {uploadedDocuments.length === 0 ? (
        <EmptyState icon={FileText} title="No documents uploaded yet" text="Uploaded onboarding documents will appear here." color="text-[#38C7BE]" />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {uploadedDocuments.map(([type, doc]) => (
            <div key={type} className="rounded-md border border-[#222533] bg-[#191C26] p-4">
              <p className="font-bold">{type}</p>
              <p className="mt-2 text-sm text-[#5F6B6A]">{doc.fileName}</p>
              <p className="mt-3 text-sm font-semibold text-emerald-400">Uploaded ✓</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AccessRequestsView(props) {
  const {
    isRequestOpen,
    setIsRequestOpen,
    requestForm,
    setRequestForm,
    updateRequestSystem,
    requestErrors,
    submitRequest,
    requestFilter,
    setRequestFilter,
    filteredRequests,
    requests,
    availableSystems,
  } = props;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Access Requests</h2>
          <p className="mt-2 text-sm text-[#5F6B6A]">Request access to systems and tools you need for your role.</p>
        </div>
        <button type="button" onClick={() => setIsRequestOpen(true)} className="rounded-md bg-[#6366F1] px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition duration-200">
          New Access Request
        </button>
      </div>

      {isRequestOpen ? (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Request Form</h3>
            <button type="button" onClick={() => setIsRequestOpen(false)} aria-label="Close request form">
              <X className="h-5 w-5 text-[#5F6B6A]" aria-hidden="true" />
            </button>
          </div>
          <form className="mt-5 grid gap-5 md:grid-cols-2" onSubmit={submitRequest}>
            <Field label="System" id="request-system">
              <select
                id="request-system"
                value={requestForm.systemCatalogId}
                onChange={(event) => updateRequestSystem(event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                disabled={availableSystems.length === 0}
              >
                <option value="">
                  {availableSystems.length === 0 ? "No active systems available" : "Select a system"}
                </option>
                {availableSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
              {requestForm.systemType ? <p className="mt-2 text-xs text-[#94A3B8]">{requestForm.systemType}</p> : null}
              {requestErrors.systemCatalogId ? <p className="mt-2 text-xs text-[#FF7A5A]">{requestErrors.systemCatalogId}</p> : null}
            </Field>
            <Field label="Justification" id="request-justification">
              <textarea
                id="request-justification"
                rows={4}
                value={requestForm.justification}
                onChange={(event) => setRequestForm((current) => ({ ...current, justification: event.target.value }))}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
              {requestErrors.justification ? <p className="mt-2 text-xs text-[#FF7A5A]">{requestErrors.justification}</p> : null}
            </Field>
            <div className="grid gap-5">
              <Field label="Priority" id="request-priority">
                <select
                  id="request-priority"
                  value={requestForm.priority}
                  onChange={(event) => setRequestForm((current) => ({ ...current, priority: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                >
                  {["Low", "Medium", "High", "Urgent"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Required By" id="request-required-by">
                <input
                  id="request-required-by"
                  type="date"
                  value={requestForm.requiredBy}
                  onChange={(event) => setRequestForm((current) => ({ ...current, requiredBy: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
                />
                {requestErrors.requiredBy ? <p className="mt-2 text-xs text-[#FF7A5A]">{requestErrors.requiredBy}</p> : null}
              </Field>
            </div>
            <button type="submit" className="rounded-md bg-[#6366F1] text-white hover:bg-indigo-500 transition duration-200 px-5 py-3 text-sm font-bold md:col-span-2">
              Submit Request
            </button>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-[rgba(122,111,88,0.16)] p-5">
          {requestStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setRequestFilter(status)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                requestFilter === status ? "bg-[#6366F1] text-[#F8FAFC]" : "bg-[#191C26] text-[#94A3B8] hover:bg-[#222533] hover:text-[#F8FAFC]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        {requests.length === 0 ? (
          <EmptyState icon={KeyRound} title="No access requests yet" text="Submit a request using the button above." color="text-[#38C7BE]" />
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-sm text-[#5F6B6A]">No requests match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#191C26] border-b border-[#222533] text-xs uppercase tracking-wider text-[#94A3B8]">
                <tr>
                  <th className="px-6 py-4">System</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4">Approved</th>
                  <th className="px-6 py-4">Provisioned</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/40">
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-5 font-semibold">{request.specificSystem}</td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{request.systemType}</td>
                    <td className="px-6 py-5">
                      <Badge className={priorityStyles[request.priority]}>{request.priority}</Badge>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={requestStatusStyles[request.status]}>{request.status}</Badge>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{formatDate(request.submittedDate)}</td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{formatDate(request.approvedDate)}</td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{formatDate(request.provisionedDate)}</td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{request.remarks || "-"}</td>
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

function CredentialsView({ credentials, userEmail, loading, error, revealedCredential, setRevealedCredential }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My System Credentials</h2>
        <p className="mt-2 text-sm text-[#5F6B6A]">Credentials are assigned after access is provisioned by IT.</p>
      </div>
      <div className="flex items-start gap-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-400">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
        Keep your credentials confidential. Never share passwords with anyone.
      </div>

      {loading ? (
        <Card>
          <div className="flex min-h-[230px] items-center justify-center p-8 text-sm font-semibold text-[#94A3B8]">
            Loading credentials...
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="flex min-h-[230px] items-center justify-center p-8 text-center text-sm font-semibold text-[#FF7A5A]">
            {error}
          </div>
        </Card>
      ) : credentials.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No credentials assigned yet"
            text="Credentials will appear here once IT provisions your systems."
            color="text-[#38C7BE]"
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {credentials.map((credential) => {
            const revealed = revealedCredential === credential.id;
            return (
              <Card key={credential.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{credential.systemName}</h3>
                    <p className="mt-2 text-sm text-[#5F6B6A]">Username: {credential.username || userEmail}</p>
                  </div>
                  <KeyRound className="h-6 w-6 text-[#FF8A66]" aria-hidden="true" />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-md bg-[#191C26] px-4 py-3 border border-[#222533]">
                  <span className="text-sm">Password: {revealed ? credential.password : "********"}</span>
                  <button
                    type="button"
                    onClick={() => setRevealedCredential(revealed ? "" : credential.id)}
                    aria-label={revealed ? "Hide password" : "Reveal password"}
                    className="rounded-md p-1 transition hover:bg-[#222533]"
                  >
                    {revealed ? <EyeOff className="h-4 w-4 text-[#5F6B6A]" /> : <Eye className="h-4 w-4 text-[#5F6B6A]" />}
                  </button>
                </div>
                <p className="mt-4 text-sm text-[#5F6B6A]">Provisioned On: {formatDate(credential.provisionedOn)}</p>
                <Badge className={`mt-4 ${credentialStatusStyles[credential.status]}`}>{credential.status}</Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationsView({ notifications, setNotifications }) {
  // Normalize notifications to ensure title, message, createdAt, and read properties are present
  const normalizedNotifications = useMemo(() => {
    return notifications.map((n) => {
      let title = "System Update";
      let message = n.msg || "";
      if (n.msg && n.msg.includes(":")) {
        const parts = n.msg.split(":");
        title = parts[0].trim();
        message = parts.slice(1).join(":").trim();
      }
      
      let rawTime = n.createdAt || n.time || null;
      let parsedTime = null;
      if (rawTime !== null && rawTime !== undefined) {
        if (typeof rawTime === "number") {
          parsedTime = rawTime;
        } else if (typeof rawTime === "string") {
          const trimmed = rawTime.trim();
          if (/^\d+$/.test(trimmed)) {
            parsedTime = parseInt(trimmed, 10);
          } else {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
              parsedTime = trimmed;
            }
          }
        }
      }

      return {
        ...n,
        title: n.title || title,
        message: n.message || message,
        createdAt: parsedTime,
      };
    });
  }, [notifications]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 backdrop-blur-xl p-8 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Notifications
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Stay updated with your latest onboarding activities and status reports.
          </p>
        </div>
        {normalizedNotifications.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setNotifications((current) => {
                const next = current.map((notification) => ({ ...notification, read: true }));
                db.markAllNotificationsAsRead("Employee");
                return next;
              });
            }}
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-300 transition-all duration-300 shadow-sm"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      {normalizedNotifications.length === 0 ? (
        <div className="py-12">
          <EmptyState icon={Bell} title="No notifications yet" text="Your activity updates will appear here." color="text-[#38C7BE]" />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {normalizedNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                setNotifications((current) => {
                  const next = current.map((item) => (item.id === notification.id ? { ...item, read: true } : item));
                  db.updateNotification(notification.id, { read: true });
                  return next;
                });
              }}
              className={`notification-item group flex w-full items-start gap-5 rounded-2xl border p-6 text-left transition-all duration-300 ease-out transform hover:scale-[1.01] hover:-translate-y-0.5 ${
                notification.read
                  ? "bg-slate-950/20 backdrop-blur-md border-white/[0.06] text-slate-300 hover:bg-slate-950/30 hover:border-white/[0.12] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                  : "bg-indigo-950/20 backdrop-blur-md border-indigo-500/20 text-slate-100 hover:bg-indigo-950/30 hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]"
              }`}
            >
              <div className="relative flex items-center justify-center mt-1.5">
                <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentcolor]" style={{ backgroundColor: notification.color, color: notification.color }} />
                {!notification.read && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`notification-title text-base font-bold tracking-tight ${notification.read ? "text-slate-200" : "text-white"}`}>
                    {notification.title}
                  </h3>
                  <div>
                    {notification.read ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08] shadow-sm">
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>
                <p className="notification-description mt-2 text-sm text-slate-400 font-normal leading-relaxed group-hover:text-slate-300 transition-colors duration-200">
                  {notification.message}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-slate-400 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {notification.createdAt
                      ? formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })
                      : "Just now"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView(props) {
  const {
    profileForm,
    setProfileForm,
    updateProfile,
    showToast,
    preferences,
    setPreferences,
  } = props;
  const employeeId = getStoredEmployeeId();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>
      <Card className="p-6">
        <h3 className="text-lg font-bold">Profile Information</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Full Name" id="settings-name">
            <input
              id="settings-name"
              type="text"
              value={profileForm.fullName}
              onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            />
          </Field>
          <Field label="Email" id="settings-email">
            <input
              id="settings-email"
              type="email"
              value={profileForm.email}
              readOnly
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none"
            />
          </Field>
          <Field label="Employee ID" id="settings-employee-id">
            <input
              id="settings-employee-id"
              type="text"
              value={employeeId}
              readOnly
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none"
            />
          </Field>
          <Field label="Phone Number" id="settings-phone">
            <input
              id="settings-phone"
              type="text"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
              className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
            />
          </Field>
        </div>
        <button type="button" onClick={updateProfile} className="mt-5 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition px-5 py-3 text-sm font-bold">
          Update Profile
        </button>
      </Card>

      <Card className="p-6">
        <ThemeSettingsPanel />
      </Card>

      <Card className="p-6">
        <ChangePasswordSection idPrefix="employee" showToast={showToast} />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold">Notification Preferences</h3>
        <div className="mt-5 space-y-4">
          {[
            ["email", "Email notifications", "Receive updates in your work inbox."],
            ["reminders", "Onboarding task reminders", "Get prompted when checklist tasks need attention."],
            ["access", "Access request updates", "Receive status changes for access requests."],
            ["announcements", "System announcements", "Hear about platform maintenance and releases."],
          ].map(([key, label, description]) => (
            <div key={key} className="flex items-center justify-between rounded-md bg-[#191C26] border border-[#222533] p-4">
              <div>
                <p className="font-semibold">{label}</p>
                <p className="mt-1 text-sm text-[#5F6B6A]">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences((current) => ({ ...current, [key]: !current[key] }))}
                className={`flex h-7 w-12 items-center rounded-full p-1 transition ${preferences[key] ? "bg-[#6366F1]" : "bg-[#222533]"}`}
                aria-label={label}
              >
                <span className={`h-5 w-5 rounded-full bg-[#F8FAFC] transition ${preferences[key] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, color }) {
  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center p-8 text-center">
      <Icon className={`h-16 w-16 opacity-30 ${color}`} aria-hidden="true" />
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#5F6B6A]">{text}</p>
    </div>
  );
}
