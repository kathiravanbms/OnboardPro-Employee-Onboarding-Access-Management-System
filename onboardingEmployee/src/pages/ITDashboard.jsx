import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadRoleSettings, normalizeUserRole, saveRoleSettings, logoutPreservingSettings } from "../utils/roleSettings";
import { accessAssignmentService } from "../services/accessAssignmentService";
import { accessDeactivationService } from "../services/accessDeactivationService";
import { employeeService } from "../services/employeeService";
import { notifyUserProfileUpdated, userProfileService } from "../services/userProfileService";
import { apiClient, getApiErrorMessage, unwrapApiResponse } from "../services/apiClient";
import { auditLogService } from "../services/auditLogService";
import { notificationService } from "../services/notificationService";
import { systemCatalogService } from "../services/systemCatalogService";
import UserProfileMenu from "../components/UserProfileMenu";
import ChangePasswordSection from "../components/ChangePasswordSection";
import ThemeToggle, { ThemeSettingsPanel } from "../components/ThemeToggle";

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
  coral: "#rose-500",
  green: "#10B981",
  violet: "#8B5CF6",
  txt: "#F8FAFC",
  txt2: "#94A3B8",
  txt3: "#94A3B8",
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Access Queue", icon: KeyRound },
  { label: "System Catalog", icon: Server },
  { label: "Deactivations", icon: UserX },
  { label: "Audit Log", icon: ClipboardList },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];

const IT_AUDIT_MODULES = ["Access Queue", "System Catalog", "Deactivations"];
const IT_AUDIT_FILTERS = ["All", ...IT_AUDIT_MODULES];
const IT_AUDIT_ROLES = ["IT Manager", "IT Administrator"];

const priorityOptions = ["Low", "Medium", "High", "Urgent"];
const catalogCategories = ["Communication", "Development", "Business", "Infrastructure", "Security"];
const departments = ["IT", "HR", "Manager", "Employee"];
const deactivationReasons = ["Resignation", "Termination", "Contract End", "Transfer", "Retirement"];

const emptySystemForm = {
  name: "",
  category: "Communication",
  description: "",
  accessLevel: "Read Only",
  owner: "",
};

const emptyDeactivationForm = {
  employeeId: "",
  employeeCode: "",
  employee: "",
  email: "",
  department: "IT",
  exitDate: "",
  reason: "Resignation",
  systems: [],
  systemsRaw: "",
  notes: "",
};

const emptyItDashboard = {
  queuedRequests: 0,
  provisionedToday: 0,
  pendingProvisioning: 0,
  deactivationsPending: 0,
  accessQueuePreview: [],
  recentActivities: [],
};

const td = "px-5 py-4 text-sm text-[#F8FAFC] border-b border-[#222533]";
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

  return `${Math.floor(minutes / 60)}h ago`;
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

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function getRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createIp() {
  return `192.168.1.${Math.floor(100 + Math.random() * 900)}`;
}

function mapAssignmentsToQueue(assignmentList) {
  const queueByKey = new Map();
  assignmentList.forEach((item) => {
    const key = `${item.employeeEmail || item.employeeName || "employee"}-${item.systemName || "system"}-${item.id}`;
    queueByKey.set(key, {
      id: item.id,
      employee: item.employeeName || "Unknown employee",
      email: item.employeeEmail || "",
      system: item.systemName || "",
      approvedBy: item.approvedBy || "Department Manager",
      priority: item.priority || "Medium",
      provisionStatus: item.status === "PROVISIONED" || item.status === "Provisioned" ? "Provisioned" : "Pending",
      provisionedOn: item.provisionedOn,
    });
  });
  return Array.from(queueByKey.values());
}

function mapProvisionedQueue(queue) {
  return queue.filter((item) => item.provisionStatus === "Provisioned").map((item) => ({
    id: `PROV-${item.id}`,
    employee: item.employee,
    system: item.system,
    provisionedOn: item.provisionedOn || today(),
    status: "Provisioned",
  }));
}

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-[${C.border}] bg-[#13151D] ${className}`}>{children}</section>;
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
  const styles = {
    pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    provisioned: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    inactive: "border-rose-500/25 bg-rose-500/10 text-rose-400",
    indigo: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    coral: "border-rose-500/25 bg-rose-500/10 text-rose-400",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  };

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone] || styles.indigo}`}>{children}</span>;
}

function EmptyState({ icon: Icon, title, text, color }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center p-8 text-center">
      <Icon className={`h-16 w-16 opacity-30 ${color}`} aria-hidden="true" />
      <h3 className="mt-5 text-lg font-bold text-[#F8FAFC]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#94A3B8]">{text}</p>
    </div>
  );
}

function Toast({ message, visible }) {
  return (
    <div
      className={`fixed right-5 top-5 z-50 rounded-md border border-[#EC4899]/20 bg-[#13151D] px-4 py-3 text-sm font-semibold text-[#F8FAFC] shadow-2xl shadow-black/55 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      {message}
    </div>
  );
}

export default function ITDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("IT Administrator");
  const [userEmail, setUserEmail] = useState("");
  const [userRoleLabel, setUserRoleLabel] = useState("IT Administrator");
  const [activePage, setActivePage] = useState("Dashboard");
  const [accessQueue, setAccessQueue] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [deactivationCandidates, setDeactivationCandidates] = useState([]);
  const [deactivations, setDeactivations] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [itDashboard, setItDashboard] = useState(emptyItDashboard);
  const [provisioned, setProvisioned] = useState([]);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isDeactivationOpen, setIsDeactivationOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [auditFilter, setAuditFilter] = useState("All");
  const [deactivationFilter, setDeactivationFilter] = useState("Deactivated");
  const [systemForm, setSystemForm] = useState(emptySystemForm);
  const [systemFormError, setSystemFormError] = useState("");
  const [deactivationForm, setDeactivationForm] = useState(emptyDeactivationForm);
  const [deactivationFormError, setDeactivationFormError] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [profileName, setProfileName] = useState("IT Administrator");
  const [profileEmployeeId, setProfileEmployeeId] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [editSystemId, setEditSystemId] = useState("");
  const [editSystemForm, setEditSystemForm] = useState(emptySystemForm);
  const [activeUsersModal, setActiveUsersModal] = useState({
    system: null,
    users: [],
    loading: false,
    error: "",
    detail: null,
  });
  const [credentialDraft, setCredentialDraft] = useState({ username: "", accessLevel: "Standard", notes: "", password: "", showPassword: false });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState("");

  const runLoader = useCallback(async (loader, { silent = false } = {}) => {
    if (!silent) {
      setIsLoadingData(true);
    }
    setApiError("");
    try {
      await loader();
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      if (!silent) {
        setIsLoadingData(false);
      }
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    const assignmentList = await accessAssignmentService.listAssignments();
    const mappedQueue = mapAssignmentsToQueue(assignmentList);
    setAccessQueue(mappedQueue);
    setProvisioned(mapProvisionedQueue(mappedQueue));
  }, []);

  const loadDeactivationCandidates = useCallback(async () => {
    setDeactivationCandidates(await accessDeactivationService.listActiveDeactivationCandidates());
  }, []);

  const loadDeactivations = useCallback(async () => {
    setDeactivations(await accessDeactivationService.listDeactivatedEmployees());
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalog(await systemCatalogService.listSystems());
  }, []);

  const loadAuditLog = useCallback(async () => {
    setAuditLog(await auditLogService.listAuditLogs());
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifications(await notificationService.listNotifications({ recipientRole: "IT Administrator" }));
  }, []);

  const loadDashboardData = useCallback((options) => runLoader(async () => {
    const response = await apiClient.get("/it/dashboard");
    const data = unwrapApiResponse(response);
    setItDashboard({
      queuedRequests: data.queuedRequests ?? 0,
      provisionedToday: data.provisionedToday ?? 0,
      pendingProvisioning: data.pendingProvisioning ?? 0,
      deactivationsPending: data.deactivationsPending ?? 0,
      accessQueuePreview: data.accessQueuePreview || [],
      recentActivities: (data.recentActivities || []).slice(0, 5),
    });
  }, options), [runLoader]);

  const loadSettingsProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const profile = await userProfileService.getCurrentUserProfile();
      const fullName = profile.fullName || "";
      setProfileName(fullName);
      setUserName(fullName || "IT Manager");
      setUserEmail(profile.email || "");
      setProfileEmployeeId(profile.employeeId || "");
      setProfilePhone(profile.phoneNumber || "");
      setUserRoleLabel(profile.role || "IT Manager");
      notifyUserProfileUpdated({
        fullName: fullName || "IT Manager",
        employeeId: profile.employeeId || "Not assigned",
        email: profile.email || "",
        role: profile.role || "IT Manager",
        accountStatus: "Active",
        phoneNumber: profile.phoneNumber || "",
      });
      localStorage.setItem("userName", fullName);
      if (profile.email) {
        localStorage.setItem("userEmail", profile.email);
      }
      if (profile.employeeId) {
        localStorage.setItem("userEmployeeId", profile.employeeId);
      }
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Unable to load IT Manager profile."));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadAccessQueuePage = useCallback((options) => runLoader(loadAssignments, options), [loadAssignments, runLoader]);
  const loadCatalogPage = useCallback((options) => runLoader(loadCatalog, options), [loadCatalog, runLoader]);
  const loadAuditLogPage = useCallback((options) => runLoader(loadAuditLog, options), [loadAuditLog, runLoader]);
  const loadNotificationsPage = useCallback((options) => runLoader(loadNotifications, options), [loadNotifications, runLoader]);
  const loadDeactivationsPage = useCallback((options) => runLoader(async () => {
    await Promise.all([
      loadDeactivationCandidates(),
      loadDeactivations(),
      loadCatalog(),
    ]);
  }, options), [loadCatalog, loadDeactivationCandidates, loadDeactivations, runLoader]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const normalizedRole = normalizeUserRole(role);
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const savedSettings = loadRoleSettings(normalizedRole);
    const allowedRoles = ["it_manager"];

    if (!token || !allowedRoles.includes(normalizedRole)) {
      navigate("/login");
      return;
    }

    const resolvedName = savedSettings.userName || storedName || "IT Manager";
    setUserName(resolvedName);
    setProfileName(resolvedName);
    setUserEmail(savedSettings.userEmail || storedEmail || "");
    setUserRoleLabel("IT Manager");
  }, [navigate]);

  useEffect(() => {
    if (activePage === "Dashboard") {
      loadDashboardData();
    } else if (activePage === "Access Queue") {
      loadAccessQueuePage();
    } else if (activePage === "System Catalog") {
      loadCatalogPage();
    } else if (activePage === "Deactivations") {
      loadDeactivationsPage();
    } else if (activePage === "Audit Log") {
      loadAuditLogPage();
    } else if (activePage === "Notifications") {
      loadNotificationsPage();
    } else if (activePage === "Settings") {
      loadSettingsProfile();
    }
  }, [
    activePage,
    loadAccessQueuePage,
    loadAuditLogPage,
    loadCatalogPage,
    loadDashboardData,
    loadDeactivationsPage,
    loadSettingsProfile,
    loadNotificationsPage,
  ]);

  const showToast = (message) => {
    setToast(message);
    setToastVisible(true);
    window.setTimeout(() => {
      setToastVisible(false);
      window.setTimeout(() => setToast(""), 300);
    }, 2400);
  };

  const pendingProvisionCount = accessQueue.filter((item) => item.provisionStatus === "Pending").length;
  const accessQueueBadgeCount = pendingProvisionCount || itDashboard.pendingProvisioning || 0;
  const unreadCount = notifications.filter((item) => !item.read).length;

  const filteredQueue = useMemo(() => {
    return accessQueue.filter((item) => {
      const matchesText =
        !searchQ.trim() ||
        item.employee.toLowerCase().includes(searchQ.trim().toLowerCase()) ||
        item.system.toLowerCase().includes(searchQ.trim().toLowerCase()) ||
        item.approvedBy.toLowerCase().includes(searchQ.trim().toLowerCase());
      const matchesStatus = filterStatus === "All" || item.provisionStatus === filterStatus;
      return matchesText && matchesStatus;
    });
  }, [accessQueue, filterStatus, searchQ]);

  const itAuditLog = useMemo(() => {
    return auditLog.filter((entry) => IT_AUDIT_MODULES.includes(entry.module) && IT_AUDIT_ROLES.includes(entry.role));
  }, [auditLog]);

  const filteredAuditLog = useMemo(() => {
    return itAuditLog.filter((entry) => {
      return auditFilter === "All" || entry.module === auditFilter;
    });
  }, [auditFilter, itAuditLog]);

  const activeDeactivationRows = deactivationCandidates;
  const deactivatedRows = deactivations;
  const visibleDeactivations = useMemo(() => {
    return deactivationFilter === "Active" ? activeDeactivationRows : deactivatedRows;
  }, [activeDeactivationRows, deactivatedRows, deactivationFilter]);

  const resetSystemForm = () => {
    setSystemForm(emptySystemForm);
    setSystemFormError("");
  };

  const resetDeactivationForm = () => {
    setDeactivationForm(emptyDeactivationForm);
    setDeactivationFormError("");
  };

  const closeDeactivationModal = () => {
    setIsDeactivationOpen(false);
    resetDeactivationForm();
  };

  const openDeactivationModal = () => {
    setIsDeactivationOpen(true);
    loadDeactivationsPage({ silent: true });
  };

  const updateSystemForm = (field, value) => {
    setSystemForm((current) => ({ ...current, [field]: value }));
    setSystemFormError("");
  };

  const updateDeactivationForm = (field, value) => {
    setDeactivationForm((current) => ({ ...current, [field]: value }));
    setDeactivationFormError("");
  };

  const selectDeactivationEmployee = async (employeeCode) => {
    const employee = deactivationCandidates.find((item) => String(item.id) === String(employeeCode));

    if (!employee) {
      setDeactivationForm((current) => ({ ...current, employeeId: "", employeeCode: "", employee: "", email: "", department: "IT", systems: [] }));
      return;
    }

    try {
      const latestEmployee = await employeeService.getEmployee(employee.id);
      if (latestEmployee.accountStatus !== "ACTIVE") {
        setDeactivationForm((current) => ({ ...current, employeeId: "", employeeCode: "", employee: "", email: "", department: "IT", systems: [] }));
        setDeactivationFormError("Employee is already deactivated.");
        await loadDeactivationsPage({ silent: true });
        return;
      }

      setDeactivationForm((current) => ({
        ...current,
        employeeId: employee.id,
        employeeCode: employee.employeeCode || latestEmployee.employeeId || employee.id,
        employee: employee.name || employee.employeeName || latestEmployee.name,
        email: latestEmployee.email,
        department: employee.department || latestEmployee.departmentName || latestEmployee.department || "IT",
        systems: employee.systems || [],
      }));
    } catch (err) {
      setDeactivationFormError(getApiErrorMessage(err, "Unable to load employee details for deactivation."));
    }
  };

  const updateEditSystemForm = (field, value) => {
    setEditSystemForm((current) => ({ ...current, [field]: value }));
  };

  const refreshAccessAssignments = async () => {
    await loadAccessQueuePage();
    showToast("Access queue updated successfully.");
  };

  const openProvisionPanel = async (row) => {
    setActiveRow(row.id);
    setCredentialDraft({
      username: row.email || row.employee,
      accessLevel: "Standard",
      notes: "",
      password: getRandomPassword(),
      showPassword: false,
    });
    try {
      const details = await accessAssignmentService.getAssignmentDetails(row.id);
      setCredentialDraft((current) => ({
        ...current,
        username: details.username || details.employeeEmail || current.username,
        accessLevel: details.accessLevel || current.accessLevel,
        notes: details.notes || "",
        password: details.temporaryPassword || current.password,
      }));
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to load access assignment details."));
    }
  };

  const closeProvisionPanel = () => {
    setActiveRow(null);
    setCredentialDraft({ username: "", accessLevel: "Standard", notes: "", password: "", showPassword: false });
  };

  const confirmProvision = async (request) => {
    try {
      await accessAssignmentService.updateAssignment(request.id, {
        status: "Provisioned",
        accessLevel: credentialDraft.accessLevel,
        notes: credentialDraft.notes,
        credentials: JSON.stringify({
          username: credentialDraft.username || request.email || request.employee,
          temporaryPassword: credentialDraft.password,
          password: credentialDraft.password,
        }),
      });
      closeProvisionPanel();
      showToast(`Access provisioned successfully for ${request.employee}`);
      await loadAccessQueuePage();
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to provision access assignment."));
    }
  };

  const submitSystem = async (event) => {
    event.preventDefault();

    const hasEmpty = Object.values(systemForm).some((value) => !String(value).trim());

    if (hasEmpty) {
      setSystemFormError("Fill in every field before adding the system.");
      return;
    }

    const system = {
      name: systemForm.name,
      category: systemForm.category,
      description: systemForm.description,
      accessLevels: systemForm.accessLevel,
      owner: systemForm.owner,
    };

    try {
      await systemCatalogService.createSystem(system);
      setIsCatalogOpen(false);
      resetSystemForm();
      showToast("Catalog submitted for Admin approval.");
      await loadCatalogPage();
    } catch (err) {
      setSystemFormError(getApiErrorMessage(err, "Unable to add system catalog item."));
    }
  };

  const startEditingSystem = (system) => {
    if (!["PENDING_APPROVAL", "DRAFT"].includes(String(system.status || "").toUpperCase())) {
      showToast("Only pending catalog requests can be edited.");
      return;
    }
    setEditSystemId(system.id);
    setEditSystemForm({
      name: system.name,
      category: system.category,
      description: system.description,
      accessLevel: system.accessLevels,
      owner: system.owner,
    });
  };

  const saveSystemEdit = async (system) => {
    if (!editSystemForm.name.trim() || !editSystemForm.description.trim() || !editSystemForm.owner.trim()) {
      showToast("All system fields must be filled before saving.");
      return;
    }

    try {
      await systemCatalogService.updateSystem(system.id, {
        ...system,
        name: editSystemForm.name,
        category: editSystemForm.category,
        description: editSystemForm.description,
        accessLevels: editSystemForm.accessLevel,
        owner: editSystemForm.owner,
      });
      setEditSystemId("");
      showToast(`${system.name} updated successfully`);
      await loadCatalogPage();
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to update system catalog item."));
    }
  };

  const withdrawSystemRequest = async (system) => {
    if (!["PENDING_APPROVAL", "DRAFT"].includes(String(system.status || "").toUpperCase())) {
      showToast("Only pending catalog requests can be withdrawn.");
      return;
    }

    try {
      await systemCatalogService.withdrawSystem(system.id);
      showToast(`${system.name} request withdrawn`);
      await loadCatalogPage();
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to withdraw system catalog request."));
    }
  };

  const closeActiveUsersModal = () => {
    setActiveUsersModal({
      system: null,
      users: [],
      loading: false,
      error: "",
      detail: null,
    });
  };

  const loadSystemActiveUsers = async (system, { keepOpen = true } = {}) => {
    if (!system?.id) {
      return;
    }

    setActiveUsersModal((current) => ({
      ...current,
      system,
      loading: true,
      error: "",
      detail: keepOpen ? current.detail : null,
    }));

    try {
      const users = await systemCatalogService.listActiveUsers(system.id);
      setActiveUsersModal((current) => ({
        ...current,
        system,
        users,
        loading: false,
        error: "",
      }));
    } catch (err) {
      setActiveUsersModal((current) => ({
        ...current,
        system,
        loading: false,
        error: getApiErrorMessage(err, "Unable to load active users for this system."),
      }));
    }
  };

  const openSystemActiveUsers = (system) => {
    loadSystemActiveUsers(system, { keepOpen: false });
  };

  const removeSystemAccess = async (record) => {
    if (!record?.assignmentId || !activeUsersModal.system) {
      return;
    }

    try {
      await accessAssignmentService.revokeAssignment(record.assignmentId);
      showToast(`Access removed for ${record.employeeName || record.employeeCode}`);
      await loadSystemActiveUsers(activeUsersModal.system, { keepOpen: false });
      await loadCatalogPage({ silent: true });
    } catch (err) {
      setActiveUsersModal((current) => ({
        ...current,
        error: getApiErrorMessage(err, "Unable to remove access for this employee."),
      }));
    }
  };

  const submitDeactivation = async (event) => {
    event.preventDefault();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deactivationForm.email.trim());
    const hasCatalogSystems = catalog.length ? deactivationForm.systems.length > 0 : deactivationForm.systemsRaw.trim().length > 0;

    if (!deactivationForm.employeeId) {
      setDeactivationFormError("Select an employee from the employee list.");
      return;
    }



    if (!deactivationForm.email.trim() || !emailValid) {
      setDeactivationFormError("Enter a valid employee email.");
      return;
    }

    if (!deactivationForm.exitDate.trim()) {
      setDeactivationFormError("Exit Date is required.");
      return;
    }

    if (!deactivationForm.department.trim()) {
      setDeactivationFormError("Department is required.");
      return;
    }

    if (!deactivationForm.reason.trim()) {
      setDeactivationFormError("Reason for deactivation is required.");
      return;
    }

    if (!deactivationForm.notes.trim()) {
      setDeactivationFormError("Please include notes for the deactivation record.");
      return;
    }

    if (!hasCatalogSystems) {
      setDeactivationFormError("Select at least one system or enter systems to deactivate.");
      return;
    }

    const deactSystems = catalog.length
      ? deactivationForm.systems
      : deactivationForm.systemsRaw.split(",").map((value) => value.trim()).filter(Boolean);

    setIsDeactivating(true);

    try {
      const latestEmployee = await employeeService.getEmployee(deactivationForm.employeeId);
      if (latestEmployee.accountStatus !== "ACTIVE") {
        setDeactivationFormError("Employee is already deactivated.");
        await loadDeactivationsPage({ silent: true });
        return;
      }

      await accessDeactivationService.createDeactivationRequest({
        employeeId: deactivationForm.employeeId,
        employeeCode: deactivationForm.employeeCode,
        employeeName: deactivationForm.employee,
        email: deactivationForm.email.trim().toLowerCase(),
        department: deactivationForm.department,
        exitDate: deactivationForm.exitDate,
        reason: deactivationForm.reason,
        systems: deactSystems,
        notes: deactivationForm.notes,
        requestedBy: userName,
      });
      closeDeactivationModal();
      showToast(`Access deactivation request submitted for ${deactivationForm.employee}`);
      await loadDeactivationsPage();
    } catch (err) {
      setDeactivationFormError(getApiErrorMessage(err, "Unable to create access deactivation request."));
    } finally {
      setIsDeactivating(false);
    }
  };

  const saveProfile = async (event, profile) => {
    event.preventDefault();

    const fullName = profile?.fullName?.trim() || "";
    const phoneNumber = profile?.phoneNumber?.trim() || "";

    if (!fullName) {
      showToast("Full name is required");
      return;
    }

    if (phoneNumber && !/^[+()\-\s0-9]{7,20}$/.test(phoneNumber)) {
      showToast("Enter a valid phone number");
      return;
    }

    setProfileLoading(true);
    setProfileError("");
    try {
      const updatedProfile = await userProfileService.updateCurrentUserProfile({
        fullName,
        phoneNumber,
      });
      setProfileName(updatedProfile.fullName || "");
      setUserName(updatedProfile.fullName || "IT Manager");
      setUserEmail(updatedProfile.email || "");
      setProfileEmployeeId(updatedProfile.employeeId || "");
      setProfilePhone(updatedProfile.phoneNumber || "");
      setUserRoleLabel(updatedProfile.role || "IT Manager");

      const normalizedRole = normalizeUserRole(localStorage.getItem("userRole"));
      const existingSettings = loadRoleSettings(normalizedRole);
      saveRoleSettings(normalizedRole, {
        ...existingSettings,
        userName: updatedProfile.fullName || fullName,
        userEmail: updatedProfile.email || userEmail,
      });
      localStorage.setItem("userName", updatedProfile.fullName || fullName);
      if (updatedProfile.email) {
        localStorage.setItem("userEmail", updatedProfile.email);
      }
      if (updatedProfile.employeeId) {
        localStorage.setItem("userEmployeeId", updatedProfile.employeeId);
      }
      notifyUserProfileUpdated({
        fullName: updatedProfile.fullName || fullName,
        employeeId: updatedProfile.employeeId || "Not assigned",
        email: updatedProfile.email || userEmail,
        role: updatedProfile.role || "IT Manager",
        accountStatus: "Active",
        phoneNumber: updatedProfile.phoneNumber || "",
      });
      showToast("Profile updated successfully");
    } catch (err) {
      setProfileError(getApiErrorMessage(err, "Unable to update IT Manager profile."));
    } finally {
      setProfileLoading(false);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await Promise.all(notifications.filter((item) => !item.read).map((item) => notificationService.markNotificationRead(item.id)));
      showToast("All notifications marked as read");
      await loadNotificationsPage();
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to mark notifications as read."));
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await notificationService.markNotificationRead(notificationId);
      await loadNotificationsPage();
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Unable to update notification."));
    }
  };

  const mainMargin = sidebarOpen ? "ml-[240px]" : "ml-20";

  return (
    <div className="dashboard-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC]">
      {toast ? <Toast message={toast} visible={toastVisible} /> : null}

      <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#222533] bg-[#0D0E12] ${sidebarOpen ? "w-[240px]" : "w-20"}`}>
        <Link to="/" className="flex h-20 items-center gap-3 px-5 text-inherit no-underline">
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
            const badge = item.label === "Access Queue" ? accessQueueBadgeCount : item.label === "Notifications" ? unreadCount : 0;

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
                <p className="text-xs text-[#94A3B8]">{userRoleLabel}</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
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

      <div className={`${mainMargin} min-h-screen`}>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">IT Portal</p>
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
            <DashboardPage
              userName={userName}
              dashboard={itDashboard}
              setActivePage={setActivePage}
            />
          ) : null}

          {activePage === "Access Queue" ? (
            <AccessQueuePage
              accessQueue={filteredQueue}
              searchQ={searchQ}
              filterStatus={filterStatus}
              setSearchQ={setSearchQ}
              setFilterStatus={setFilterStatus}
              openProvisionPanel={openProvisionPanel}
              activeRow={activeRow}
              credentialDraft={credentialDraft}
              setCredentialDraft={setCredentialDraft}
              closeProvisionPanel={closeProvisionPanel}
              confirmProvision={confirmProvision}
              onRefresh={refreshAccessAssignments}
              pendingProvisionCount={pendingProvisionCount}
            />
          ) : null}

          {activePage === "System Catalog" ? (
            <SystemCatalogPage
              catalog={catalog}
              isCatalogOpen={isCatalogOpen}
              setIsCatalogOpen={setIsCatalogOpen}
              systemForm={systemForm}
              updateSystemForm={updateSystemForm}
              submitSystem={submitSystem}
              systemFormError={systemFormError}
              startEditingSystem={startEditingSystem}
              editSystemId={editSystemId}
              editSystemForm={editSystemForm}
              updateEditSystemForm={updateEditSystemForm}
              saveSystemEdit={saveSystemEdit}
              setEditSystemId={setEditSystemId}
              withdrawSystemRequest={withdrawSystemRequest}
              activeUsersModal={activeUsersModal}
              openSystemActiveUsers={openSystemActiveUsers}
              closeActiveUsersModal={closeActiveUsersModal}
              removeSystemAccess={removeSystemAccess}
              setActiveUsersModal={setActiveUsersModal}
            />
          ) : null}

          {activePage === "Deactivations" ? (
            <DeactivationsPage
              deactivations={visibleDeactivations}
              deactivationFilter={deactivationFilter}
              setDeactivationFilter={setDeactivationFilter}
              deactivationCounts={{
                Active: activeDeactivationRows.length,
                Deactivated: deactivatedRows.length,
              }}
              isDeactivationOpen={isDeactivationOpen}
              openDeactivationModal={openDeactivationModal}
              closeDeactivationModal={closeDeactivationModal}
              deactivationForm={deactivationForm}
              updateDeactivationForm={updateDeactivationForm}
              submitDeactivation={submitDeactivation}
              deactivationFormError={deactivationFormError}
              catalog={catalog}
              employees={deactivationCandidates}
              selectDeactivationEmployee={selectDeactivationEmployee}
              isDeactivating={isDeactivating}
            />
          ) : null}

          {activePage === "Audit Log" ? (
            <AuditLogPage
              filteredAuditLog={filteredAuditLog}
              auditFilter={auditFilter}
              setAuditFilter={setAuditFilter}
            />
          ) : null}

          {activePage === "Notifications" ? (
            <NotificationsPage
              notifications={notifications}
              markAllNotificationsRead={markAllNotificationsRead}
              handleNotificationClick={handleNotificationClick}
            />
          ) : null}

          {activePage === "Settings" ? (
            <SettingsPage
              profileName={profileName}
              setProfileName={setProfileName}
              userEmail={userEmail}
              employeeId={profileEmployeeId}
              phone={profilePhone}
              setPhone={setProfilePhone}
              userRoleLabel={userRoleLabel}
              saveProfile={saveProfile}
              profileLoading={profileLoading}
              profileError={profileError}
              showToast={showToast}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DashboardPage({ userName, dashboard, setActivePage }) {
  const accessQueuePreview = dashboard.accessQueuePreview || [];
  const recentActivities = (dashboard.recentActivities || []).slice(0, 5);
  const pendingProvisioning = dashboard.pendingProvisioning ?? 0;
  const deactivationsPending = dashboard.deactivationsPending ?? 0;
  const cards = [
    { label: "Queued Requests", value: dashboard.queuedRequests ?? 0, icon: KeyRound, color: C.indigo },
    { label: "Provisioned Today", value: dashboard.provisionedToday ?? 0, icon: CheckCircle2, color: C.green },
    { label: "Pending Provisioning", value: pendingProvisioning, icon: ChevronDown, color: C.amber },
    { label: "Deactivations Pending", value: deactivationsPending, icon: UserX, color: C.coral },
  ];

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Welcome back, {userName} 👋</h2>
            <p className="mt-3 text-sm text-[#94A3B8]">
              You have {pendingProvisioning} requests pending provisioning and {deactivationsPending} deactivations pending.
            </p>
          </div>
          <div className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm font-semibold text-[#94A3B8]">
            {formatTimestamp(new Date().toISOString())}
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
                  <p className="mt-3 text-4xl font-bold">{card.value}</p>
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Quick Preview: Access Queue</h2>
            <p className="mt-1 text-sm text-[#5F6B6A]">View the most recent requests waiting for provisioning.</p>
          </div>
          <button type="button" onClick={() => setActivePage("Access Queue")} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26]">
            View all
          </button>
        </div>
        {accessQueuePreview.length === 0 ? (
          <div className="mt-6 rounded-md border border-[#222533] bg-[#191C26] px-6 py-10 text-center text-sm text-[#94A3B8]">
            No requests in queue
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">System</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {accessQueuePreview.map((item) => (
                  <tr key={`${item.employeeName}-${item.systemName}-${item.status}`}>
                    <td className="px-6 py-5">
                      <p className="font-semibold">{item.employeeName}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">Approved by {item.approvedBy}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{item.systemName}</td>
                    <td className="px-6 py-5">
                      <Badge tone={item.status === "Pending" ? "amber" : "indigo"}>{item.status}</Badge>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#94A3B8]">{item.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold">Recent Activity</h2>
        {recentActivities.length === 0 ? (
          <div className="mt-6 rounded-md border border-[#222533] bg-[#191C26] px-6 py-10 text-center text-sm text-[#94A3B8]">
            No activity yet
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {recentActivities.map((activity) => (
              <div key={`${activity.timestamp}-${activity.module}-${activity.action}`} className="flex items-start gap-3 rounded-md border border-[#222533] bg-[#191C26] p-4">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
                <div>
                  <p className="text-sm font-semibold">{activity.action}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">{activity.module} - {formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function AccessQueuePage({ accessQueue, searchQ, filterStatus, setSearchQ, setFilterStatus, openProvisionPanel, activeRow, credentialDraft, setCredentialDraft, closeProvisionPanel, confirmProvision, onRefresh, pendingProvisionCount }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Access Provisioning Queue</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Provision approved access requests for employees.</p>
          </div>
          <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-md bg-[#6366F1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh Queue
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Field label="Search queue" id="it-search-queue">
              <input
                id="it-search-queue"
                type="text"
                value={searchQ}
                onChange={(event) => setSearchQ(event.target.value)}
                className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition"
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending', 'Provisioned'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === status ? 'bg-[#6366F1] text-white' : 'border border-[#222533] text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {accessQueue.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={KeyRound} title="No requests in queue" text="Approved requests from managers will appear here." color="text-[#6366F1]" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Requested System</th>
                  <th className="px-6 py-4">Approval Details</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {accessQueue.map((request) => (
                <Fragment key={request.id}>
                  <tr>
                    <td className={td}>
                      <p className="font-semibold text-[#F8FAFC]">{request.employee}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">{request.email || ""}</p>
                    </td>
                      <td className={td}>{request.system}</td>
                      <td className={td}>
                        <p className="font-semibold text-[#F8FAFC]">{request.approvedBy}</p>
                      </td>
                      <td className={td}>{request.priority}</td>
                      <td className={td}>
                        <Badge tone={request.provisionStatus === "Pending" ? "amber" : "indigo"}>{request.provisionStatus}</Badge>
                      </td>
                      <td className={td}>
                        {request.provisionStatus === "Pending" ? (
                          <button type="button" onClick={() => openProvisionPanel(request)} className="inline-flex items-center gap-2 rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
                            <Zap className="h-4 w-4" aria-hidden="true" />
                            Provision Access
                          </button>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-400">Provisioned ✓</p>
                            <p className="text-xs text-[#94A3B8]">{request.provisionedOn}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                    {activeRow === request.id && request.provisionStatus === "Pending" ? (
                      <tr>
                        <td colSpan={6} className="bg-[#13151D]/80 px-6 py-6 border-b border-[#222533]">
                          <div className="space-y-4 rounded-xl border border-[#222533] bg-[#191C26] p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold">Generate Credentials</h3>
                                <p className="mt-1 text-sm text-[#5F6B6A]">Complete access details before provisioning.</p>
                              </div>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                              <Field label="Username" id="it-username">
                                <input id="it-username" type="text" value={credentialDraft.username} readOnly className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md" />
                              </Field>
                              <Field label="Temporary Password" id="it-temp-password">
                                <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] border border-[#222533] rounded-md">
                                  <span className="flex-1">{credentialDraft.showPassword ? credentialDraft.password : "•".repeat(10)}</span>
                                  <button type="button" onClick={() => setCredentialDraft((current) => ({ ...current, showPassword: !current.showPassword }))} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                                    {credentialDraft.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </Field>
                              <Field label="Access Level" id="it-access-level">
                                <select id="it-access-level" value={credentialDraft.accessLevel} onChange={(event) => setCredentialDraft((current) => ({ ...current, accessLevel: event.target.value }))} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                                  <option value="Read Only">Read Only</option>
                                  <option value="Standard">Standard</option>
                                  <option value="Admin">Admin</option>
                                </select>
                              </Field>
                              <Field label="Notes" id="it-provision-notes">
                                <textarea id="it-provision-notes" value={credentialDraft.notes} onChange={(event) => setCredentialDraft((current) => ({ ...current, notes: event.target.value }))} className="mt-2 h-28 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
                              </Field>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2">
                              <button type="button" onClick={() => confirmProvision(request)} className="rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-semibold">
                                Confirm Provision
                              </button>
                              <button type="button" onClick={closeProvisionPanel} className="rounded-md border border-[#222533] bg-[#13151D] px-5 py-3 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SystemCatalogPage({
  catalog,
  isCatalogOpen,
  setIsCatalogOpen,
  systemForm,
  updateSystemForm,
  submitSystem,
  systemFormError,
  startEditingSystem,
  editSystemId,
  editSystemForm,
  updateEditSystemForm,
  saveSystemEdit,
  setEditSystemId,
  withdrawSystemRequest,
  activeUsersModal,
  openSystemActiveUsers,
  closeActiveUsersModal,
  removeSystemAccess,
  setActiveUsersModal,
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">System Access Catalog</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Manage all systems and applications in your organization.</p>
          </div>
          <button type="button" onClick={() => setIsCatalogOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#6366F1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-md">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add System
          </button>
        </div>
      </Card>

      {catalog.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={Server} title="No systems in catalog" text="Add your first system using the button above." color="text-[#6366F1]" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalog.map((system) => {
            const color =
              system.category === "Communication"
                ? C.indigo
                : system.category === "Development"
                ? C.teal
                : system.category === "Business"
                ? C.amber
                : system.category === "Infrastructure"
                ? C.coral
                : C.green;

            return (
              <Card key={system.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                      <Server className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      {editSystemId === system.id ? (
                        <input value={editSystemForm.name} onChange={(event) => updateEditSystemForm("name", event.target.value)} className="w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] px-3 py-2 text-sm" />
                      ) : (
                        <h3 className="text-lg font-bold text-[#F8FAFC]">{system.name}</h3>
                      )}
                      <Badge tone={String(system.status || "").toUpperCase() === "ACTIVE" ? "active" : String(system.status || "").toUpperCase() === "PENDING_APPROVAL" ? "pending" : "inactive"}>{system.status}</Badge>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#94A3B8]">{system.category}</p>
                {editSystemId === system.id ? (
                  <textarea value={editSystemForm.description} onChange={(event) => updateEditSystemForm("description", event.target.value)} className="mt-3 h-20 w-full rounded-md border border-[#222533] bg-[#191C26] text-[#F8FAFC] outline-none focus:border-[#6366F1] px-3 py-3 text-sm" />
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[#94A3B8]">{system.description}</p>
                )}
                <p className="mt-4 text-sm text-[#94A3B8]">Owner: {system.owner}</p>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => openSystemActiveUsers(system)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#EC4899]/25 bg-[#EC4899]/10 px-3 py-2 text-sm font-semibold text-[#F472B6] transition hover:border-[#EC4899]/45 hover:bg-[#EC4899]/15 hover:text-[#F9A8D4]"
                  >
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Active Users ({system.activeUsers || 0})
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {editSystemId === system.id ? (
                      <>
                        <button type="button" onClick={() => saveSystemEdit(system)} className="rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition duration-200 px-4 py-2 text-sm font-semibold">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditSystemId("")} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">
                          Cancel
                        </button>
                      </>
                    ) : ["PENDING_APPROVAL", "DRAFT"].includes(String(system.status || "").toUpperCase()) ? (
                      <>
                        <button type="button" onClick={() => startEditingSystem(system)} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26]">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => withdrawSystemRequest(system)}
                          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                        >
                          Withdraw
                        </button>
                      </>
                    ) : (
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">Approval Status</p>
                    )}
                  </div>
                </div>
                {editSystemId === system.id ? (
                  <div className="mt-4 grid gap-3">
                    <Field id={`edit-category-${system.id}`} label="Category">
                      <select value={editSystemForm.category} onChange={(event) => updateEditSystemForm("category", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                        {catalogCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </Field>
                    <Field id={`edit-access-${system.id}`} label="Access Level">
                      <select value={editSystemForm.accessLevel} onChange={(event) => updateEditSystemForm("accessLevel", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                        <option value="Read Only">Read Only</option>
                        <option value="Standard">Standard</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </Field>
                    <Field id={`edit-owner-${system.id}`} label="Owner / Team">
                      <input value={editSystemForm.owner} onChange={(event) => updateEditSystemForm("owner", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
                    </Field>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {activeUsersModal.system ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-6xl flex-col border-l border-[#222533] bg-[#0D0E12] shadow-2xl shadow-black/85">
            <div className="flex items-start justify-between gap-4 border-b border-[#222533] bg-[#13151D] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Active Users</p>
                <h3 className="mt-2 text-2xl font-bold text-[#F8FAFC]">{activeUsersModal.system.name}</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">{activeUsersModal.system.category} | {activeUsersModal.users.length} provisioned assignments</p>
              </div>
              <button type="button" onClick={closeActiveUsersModal} className="rounded-md border border-[#222533] bg-[#191C26] p-2 text-[#94A3B8] transition hover:text-[#F8FAFC]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeUsersModal.error ? (
                <p className="mb-4 rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">{activeUsersModal.error}</p>
              ) : null}

              {activeUsersModal.loading ? (
                <div className="rounded-md border border-[#222533] bg-[#13151D] px-5 py-10 text-center text-sm font-semibold text-[#94A3B8]">
                  Loading active users from API...
                </div>
              ) : activeUsersModal.users.length === 0 ? (
                <Card className="p-10 text-center">
                  <EmptyState icon={Users} title="No active users" text="Provisioned users for this system will appear here." color="text-[#EC4899]" />
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left">
                      <thead className="border-b border-[#222533] bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8]">
                        <tr>
                          <th className="px-5 py-4">Employee Code</th>
                          <th className="px-5 py-4">Employee Name</th>
                          <th className="px-5 py-4">Email</th>
                          <th className="px-5 py-4">Department</th>
                          <th className="px-5 py-4">Role</th>
                          <th className="px-5 py-4">Access Status</th>
                          <th className="px-5 py-4">Provisioned Date</th>
                          <th className="px-5 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                        {activeUsersModal.users.map((record) => {
                          const employeeInactive = ["INACTIVE", "DEACTIVATED"].includes(String(record.employeeStatus || "").toUpperCase());
                          return (
                            <tr key={record.assignmentId}>
                              <td className={td}>{record.employeeCode || "-"}</td>
                              <td className={td}>
                                <p>{record.employeeName || "Unknown employee"}</p>
                                {employeeInactive ? <p className="mt-1 text-xs font-semibold text-rose-400">{record.employeeStatus}</p> : null}
                              </td>
                              <td className={td}>{record.email || "-"}</td>
                              <td className={td}>{record.department || "-"}</td>
                              <td className={td}>{record.role || "-"}</td>
                              <td className={td}>
                                <Badge tone={employeeInactive ? "inactive" : "active"}>{employeeInactive ? record.employeeStatus : record.accessStatus}</Badge>
                              </td>
                              <td className={td}>{record.provisionedDate || formatTimestamp(record.assignedAt)}</td>
                              <td className={td}>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveUsersModal((current) => ({ ...current, detail: { type: "profile", record } }))}
                                    className="rounded-md border border-[#222533] bg-[#191C26] px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#222533]"
                                  >
                                    View Profile
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeSystemAccess(record)}
                                    className="rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                                  >
                                    Remove Access
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveUsersModal((current) => ({ ...current, detail: { type: "assignment", record } }))}
                                    className="rounded-md border border-[#222533] bg-[#191C26] px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#222533]"
                                  >
                                    Details
                                  </button>
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

              {activeUsersModal.detail ? (
                <Card className="mt-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                        {activeUsersModal.detail.type === "profile" ? "Employee Profile" : "Assignment Details"}
                      </p>
                      <h4 className="mt-2 text-lg font-bold text-[#F8FAFC]">{activeUsersModal.detail.record.employeeName || activeUsersModal.detail.record.employeeCode}</h4>
                    </div>
                    <button type="button" onClick={() => setActiveUsersModal((current) => ({ ...current, detail: null }))} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Employee Code", activeUsersModal.detail.record.employeeCode],
                      ["Email", activeUsersModal.detail.record.email],
                      ["Department", activeUsersModal.detail.record.department],
                      ["Role", activeUsersModal.detail.record.role],
                      ["Employee Status", activeUsersModal.detail.record.employeeStatus || "ACTIVE"],
                      ["Access Status", activeUsersModal.detail.record.accessStatus],
                      ["Access Level", activeUsersModal.detail.record.accessLevel || "-"],
                      ["Approved By", activeUsersModal.detail.record.approvedBy || "-"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-[#222533] bg-[#191C26] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#94A3B8]">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{value || "-"}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isCatalogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-[#222533] bg-[#13151D] p-7 shadow-2xl shadow-black/85">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">Add System</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">Submit the new system catalog item for Admin approval.</p>
              </div>
              <button type="button" onClick={() => setIsCatalogOpen(false)} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {systemFormError ? <p className="mt-4 rounded-md bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">{systemFormError}</p> : null}
            <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={submitSystem}>
              <Field id="system-name" label="System Name">
                <input id="system-name" value={systemForm.name} onChange={(event) => updateSystemForm("name", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
              </Field>
              <Field id="system-category" label="Category">
                <select id="system-category" value={systemForm.category} onChange={(event) => updateSystemForm("category", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                  {catalogCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field id="system-access-level" label="Access Levels">
                <select id="system-access-level" value={systemForm.accessLevel} onChange={(event) => updateSystemForm("accessLevel", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                  <option value="Read Only">Read Only</option>
                  <option value="Standard">Standard</option>
                  <option value="Admin">Admin</option>
                </select>
              </Field>
              <Field id="system-owner" label="Owner / Team">
                <input id="system-owner" value={systemForm.owner} onChange={(event) => updateSystemForm("owner", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
              </Field>
              <Field id="system-description" label="Description">
                <textarea id="system-description" value={systemForm.description} onChange={(event) => updateSystemForm("description", event.target.value)} className="mt-2 h-28 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE] md:col-span-2" />
              </Field>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-semibold">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DeactivationsPage({ deactivations, deactivationFilter, setDeactivationFilter, deactivationCounts, isDeactivationOpen, openDeactivationModal, closeDeactivationModal, deactivationForm, updateDeactivationForm, submitDeactivation, deactivationFormError, catalog, employees, selectDeactivationEmployee, isDeactivating }) {
  const filterOptions = ["Active", "Deactivated"];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Access Deactivations</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Deactivate system access for employees who have exited.</p>
          </div>
          <button type="button" onClick={openDeactivationModal} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 shadow-md">
            <UserX className="h-4 w-4" aria-hidden="true" />
            New Deactivation
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDeactivationFilter(option)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                deactivationFilter === option
                  ? "bg-[#6366F1] text-white"
                  : "border border-[#222533] bg-[#13151D] text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC]"
              }`}
            >
              {option} ({deactivationCounts[option] || 0})
            </button>
          ))}
        </div>
      </Card>

      {deactivations.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={UserX} title={`No ${deactivationFilter.toLowerCase()} deactivations`} text="Matching deactivation records will appear here." color="text-rose-400" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#191C26] text-xs uppercase tracking-wider text-[#94A3B8] border-b border-[#222533]">
                <tr>
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Employee Code</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Exit Date</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Systems</th>
                  <th className="px-6 py-4">Deactivated On</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533] bg-[#13151D]/45">
                {deactivations.map((record) => (
                  <tr key={record.id}>
                    <td className={td}>{record.employeeName || record.employee}</td>
                    <td className={td}>{record.employeeCode || record.employeeId}</td>
                    <td className={td}>{record.department}</td>
                    <td className={td}>{record.exitDate}</td>
                    <td className={td}>{record.reason}</td>
                    <td className={td}>{(record.systems || []).join(", ")}</td>
                    <td className={td}>{formatTimestamp(record.deactivatedAt || record.deactivatedOn)}</td>
                    <td className={td}>
                      <Badge tone="completed">{record.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isDeactivationOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-[#222533] bg-[#13151D] p-7 shadow-2xl shadow-black/85 transition-transform duration-300 ease-out max-h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">New Deactivation</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">Record the access removal details for the employee.</p>
              </div>
              <button type="button" onClick={closeDeactivationModal} disabled={isDeactivating} className="text-[#94A3B8] hover:text-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {deactivationFormError ? <p className="mt-4 rounded-md bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">{deactivationFormError}</p> : null}
            <div className="mt-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
              <form className="grid gap-5 md:grid-cols-2" onSubmit={submitDeactivation}>
              <Field id="deactivate-employee" label="Employee">
                <select id="deactivate-employee" value={deactivationForm.employeeId || ""} onChange={(event) => selectDeactivationEmployee(event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                  <option value="">Select employee from API</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name} ({employee.employeeCode})</option>
                  ))}
                </select>
              </Field>
              <Field id="deactivate-email" label="Employee Email">
                <input id="deactivate-email" type="email" value={deactivationForm.email} onChange={(event) => updateDeactivationForm("email", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
              </Field>
              <Field id="deactivate-department" label="Department">
                <input id="deactivate-department" type="text" value={deactivationForm.department} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#94A3B8] outline-none" />
              </Field>
              <Field id="deactivate-exit-date" label="Exit Date">
                <input id="deactivate-exit-date" type="date" value={deactivationForm.exitDate} onChange={(event) => updateDeactivationForm("exitDate", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
              </Field>
              <Field id="deactivate-reason" label="Reason">
                <select id="deactivate-reason" value={deactivationForm.reason} onChange={(event) => updateDeactivationForm("reason", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]">
                  {deactivationReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-[#F8FAFC]">Systems to Deactivate</label>
                <div className="mt-2 rounded-md border border-[#222533] bg-[#191C26] px-4 py-4">
                  {catalog.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {catalog.map((system) => (
                        <label key={system.id} className="flex items-center gap-3 rounded-md border border-[#222533] px-3 py-2 bg-[#13151D] rounded-md">
                          <input type="checkbox" checked={deactivationForm.systems.includes(system.name)} onChange={(event) => {
                              if (event.target.checked) {
                                updateDeactivationForm("systems", [...deactivationForm.systems, system.name]);
                              } else {
                                updateDeactivationForm("systems", deactivationForm.systems.filter((name) => name !== system.name));
                              }
                            }} className="h-4 w-4 rounded border-[#222533] bg-[#13151D] text-[#6366F1] focus:ring-[#6366F1]" />
                          <span className="text-sm text-[#F8FAFC]">{system.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea id="deactivate-systems-raw" value={deactivationForm.systemsRaw} onChange={(event) => updateDeactivationForm("systemsRaw", event.target.value)} className="mt-2 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE]" />
                  )}
                </div>
              </div>
              <Field id="deactivate-notes" label="Notes">
                <textarea id="deactivate-notes" value={deactivationForm.notes} onChange={(event) => updateDeactivationForm("notes", event.target.value)} className="mt-2 h-28 w-full rounded-[10px] border border-[rgba(122,111,88,0.18)] bg-[#13151D] px-4 py-3 text-sm text-[#F8FAFC] outline-none border border-[#222533] focus:border-[#6366F1] transition rounded-md focus:border-[#38C7BE] md:col-span-2" />
              </Field>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 mt-2 border-t border-[#222533]">
                <button type="button" onClick={closeDeactivationModal} disabled={isDeactivating} className="rounded-md border border-[#222533] bg-[#13151D] px-5 py-3 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#191C26] disabled:opacity-50">
                  Close
                </button>
                <button type="submit" disabled={isDeactivating} className="rounded-md bg-rose-600 hover:bg-rose-500 text-white transition duration-200 px-5 py-3 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {isDeactivating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Deactivating...
                    </>
                  ) : (
                    "Submit Deactivation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      ) : null}
    </div>
  );
}

function AuditLogPage({ filteredAuditLog, auditFilter, setAuditFilter }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Audit Trail</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Complete log of all IT administrator actions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {IT_AUDIT_FILTERS.map((filter) => (
              <button key={filter} type="button" onClick={() => setAuditFilter(filter)} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${auditFilter === filter ? "bg-[#6366F1] text-white" : "border border-[#222533] text-[#94A3B8] hover:bg-[#191C26] hover:text-[#F8FAFC]"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filteredAuditLog.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={ClipboardList} title="No audit logs yet" text="All IT actions will be recorded here automatically." color="text-indigo-400" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
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
                {filteredAuditLog.map((entry) => (
                  <tr key={entry.id}>
                    <td className={td}>{formatTimestamp(entry.timestamp)}</td>
                    <td className={td}>{entry.user}</td>
                    <td className={td}>{entry.role}</td>
                    <td className={td}>{entry.module}</td>
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

function NotificationsPage({ notifications, markAllNotificationsRead, handleNotificationClick }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            <p className="mt-2 text-sm text-[#94A3B8]">Every IT action creates a notification here.</p>
          </div>
          <button type="button" onClick={markAllNotificationsRead} className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#191C26]">
            Mark all as read
          </button>
        </div>
      </Card>

      {notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <EmptyState icon={Bell} title="No notifications yet" text="Your activity updates will appear here." color="text-[#6366F1]" />
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification.id)}
              className={`notification-item w-full rounded-md border border-[#222533] px-5 py-4 text-left transition ${notification.read ? "bg-[#13151D] text-[#94A3B8]" : "bg-[#191C26] text-[#F8FAFC]"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="notification-title text-sm text-[#F8FAFC]">{notification.msg}</p>
                <span className="text-xs text-[#94A3B8]">{timeAgo(notification.time)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPage({ profileName, setProfileName, userEmail, employeeId, phone, setPhone, userRoleLabel, saveProfile, profileLoading, profileError, showToast }) {
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

    await saveProfile(event, {
      fullName: profileName.trim(),
      phoneNumber: phone.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>
      <Card className="p-6">
        <h3 className="text-lg font-bold">Profile Information</h3>
        {profileLoading ? <p className="mt-3 text-sm text-[#94A3B8]">Loading profile...</p> : null}
        {profileError ? <p className="mt-3 rounded-md border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">{profileError}</p> : null}
        <form className="mt-5" onSubmit={submitProfile}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="settings-name" label="Full Name">
              <input id="settings-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} disabled={profileLoading} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition disabled:opacity-60" />
            </Field>
            <Field id="settings-email" label="Email">
              <input id="settings-email" type="email" value={userEmail} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none" />
            </Field>
            <Field id="settings-employee-id" label="Employee ID">
              <input id="settings-employee-id" type="text" value={employeeId} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none" />
            </Field>
            <Field id="settings-phone" label="Phone Number">
              <input id="settings-phone" type="text" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={profileLoading} className="mt-2 w-full rounded-md border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] transition disabled:opacity-60" />
            </Field>
            <Field id="settings-role" label="Role">
              <input id="settings-role" type="text" value={userRoleLabel} readOnly className="mt-2 w-full rounded-md border border-[#222533] bg-[#13151D] text-[#94A3B8] outline-none" />
            </Field>
          </div>
          <button type="submit" disabled={profileLoading} className="mt-5 rounded-md bg-[#6366F1] hover:bg-indigo-500 text-white transition duration-200 px-5 py-3 text-sm font-bold disabled:opacity-60">
            {profileLoading ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <ThemeSettingsPanel />
      </Card>

      <Card className="p-6">
        <ChangePasswordSection idPrefix="it" showToast={showToast} />
      </Card>
    </div>
  );
}
