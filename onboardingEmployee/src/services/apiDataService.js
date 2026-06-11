import { apiClient, unwrapApiResponse } from "./apiClient";
import { auditLogService } from "./auditLogService";
import { employeeService } from "./employeeService";
import { getDocumentWorkflowStatus, mapDocumentsByType, onboardingWorkflowService } from "./onboardingWorkflowService";
import { notificationService } from "./notificationService";
import { systemCatalogService } from "./systemCatalogService";

const cache = {
  employees: [],
  accessRequests: [],
  systemCatalog: [],
  deactivations: [],
  notifications: [],
  activities: [],
  auditLogs: [],
  accessCategories: [],
  workflowSteps: [],
};

const IT_ACCESS_DATA_ROLES = new Set(["Admin", "System Admin", "IT Manager", "IT Administrator"]);

function canLoadItAccessData(role) {
  return IT_ACCESS_DATA_ROLES.has(role);
}

function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();

  if (["REQUESTED", "PENDING", "APPROVED", "PROVISIONED", "REJECTED"].includes(value)) {
    return value === "PENDING" ? "PENDING" : value;
  }
  return value || "PENDING";
}

function parseCredentials(credentials) {
  if (!credentials) {
    return null;
  }
  if (typeof credentials === "object") {
    return credentials;
  }
  try {
    return JSON.parse(credentials);
  } catch {
    return { temporaryPassword: credentials, password: credentials };
  }
}

function mapAccessRequest(request) {
  return {
    raw: request,
    id: request.id,
    employeeId: request.employeeCode || request.employeeId,
    employeeName: request.employeeCode || `Employee ${request.employeeId}`,
    email: "",
    systemCatalogId: request.systemCatalogId,
    specificSystem: request.systemName,
    system: request.systemName,
    systemType: request.systemCategory || request.category || "",
    justification: request.justification,
    status: normalizeStatus(request.status),
    remarks: request.remarks || "",
    approvedBy: request.approvedBy || "",
    provisionedBy: request.provisionedBy || "",
    decidedAt: request.decidedAt,
    provisionedAt: request.provisionedAt,
    provisionedOn: request.provisionedOn,
    submittedDate: request.createdAt,
    submittedOn: request.createdAt,
    priority: "Medium",
    credentials: parseCredentials(request.credentials),
  };
}

async function loadAccessRequests() {
  const response = await apiClient.get("/access-requests");
  cache.accessRequests = unwrapApiResponse(response).map(mapAccessRequest);
  return cache.accessRequests;
}

async function loadDocumentsForEmployees(role) {
  if (!cache.employees.length) return;

  const documents = role === "Employee"
    ? await Promise.all(cache.employees.map((employee) =>
        onboardingWorkflowService.listDocuments(employee.databaseId || employee.raw?.id).catch(() => [])
      )).then((groups) => groups.flat())
    : await onboardingWorkflowService.listDocuments(null).catch(() => []);

  const documentsByEmployeeId = documents.reduce((acc, document) => {
    const key = String(document.employeeId);
    acc[key] = acc[key] || [];
    acc[key].push(document);
    return acc;
  }, {});

  cache.employees = cache.employees.map((employee) => {
    const persistedDocuments = mapDocumentsByType(documentsByEmployeeId[String(employee.databaseId || employee.raw?.id)] || []);
    return {
      ...employee,
      documents: persistedDocuments,
      docsStatus: getDocumentWorkflowStatus(persistedDocuments),
    };
  });
}

async function loadEmployeesForCurrentUser() {
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  const employeeId = localStorage.getItem("userEmployeeId");

  const loadEmployees = role === "Employee" && email
    ? onboardingWorkflowService.getEmployeeByEmail(email).then((employee) => { cache.employees = employee ? [employee] : []; })
    : employeeService.listEmployees().then((data) => { cache.employees = data; });

  return loadEmployees.catch(() => {
    if (role === "Employee" && employeeId && /^\d+$/.test(employeeId)) {
      return employeeService.getEmployee(employeeId).then((employee) => { cache.employees = [employee]; }).catch(() => {});
    }
    return Promise.resolve();
  });
}

async function refreshTeamOnboardingCache({ includeDocuments = true } = {}) {
  const role = localStorage.getItem("userRole");

  await Promise.allSettled([
    loadEmployeesForCurrentUser(),
    loadAccessRequests().catch(() => {}),
  ]);

  if (includeDocuments) {
    await loadDocumentsForEmployees(role);
  }
}

async function refreshDocumentsForCachedEmployees() {
  const role = localStorage.getItem("userRole");
  await loadDocumentsForEmployees(role);
}

async function refreshAll() {
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  const employeeId = localStorage.getItem("userEmployeeId");
  const notificationParams = getNotificationParams(role, email);
  const loadEmployees = role === "Employee" && email
    ? onboardingWorkflowService.getEmployeeByEmail(email).then((employee) => { cache.employees = employee ? [employee] : []; })
    : employeeService.listEmployees().then((data) => { cache.employees = data; });

  const tasks = [
    loadEmployees.catch(() => {
      if (role === "Employee" && employeeId && /^\d+$/.test(employeeId)) {
        return employeeService.getEmployee(employeeId).then((employee) => { cache.employees = [employee]; }).catch(() => {});
      }
      return Promise.resolve();
    }),
    loadAccessRequests().catch(() => {}),
    (role === "Employee"
      ? apiClient.get("/access-requests/systems/active").then((response) => { cache.systemCatalog = unwrapApiResponse(response); })
      : canLoadItAccessData(role)
        ? systemCatalogService.listSystems().then((data) => { cache.systemCatalog = data; })
        : Promise.resolve([]).then((data) => { cache.systemCatalog = data; })
    ).catch(() => {}),
    (canLoadItAccessData(role)
      ? import("./accessDeactivationService").then(({ accessDeactivationService }) =>
          accessDeactivationService.listDeactivatedEmployees()
        )
      : Promise.resolve([])
    ).then((data) => { cache.deactivations = data; }).catch(() => {}),
    notificationService.listNotifications(notificationParams).then((data) => { cache.notifications = data; }).catch(() => {}),
    (canLoadItAccessData(role)
      ? auditLogService.listAuditLogs()
      : Promise.resolve([])
    ).then((data) => { cache.auditLogs = data; }).catch(() => {}),
  ];

  await Promise.allSettled(tasks);
  await loadDocumentsForEmployees(role);
}

async function refreshDashboardCache() {
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  const employeeId = localStorage.getItem("userEmployeeId");
  const notificationParams = getNotificationParams(role, email);
  const loadEmployees = role === "Employee" && email
    ? onboardingWorkflowService.getEmployeeByEmail(email).then((employee) => { cache.employees = employee ? [employee] : []; })
    : employeeService.listEmployees().then((data) => { cache.employees = data; });

  const tasks = [
    loadEmployees.catch(() => {
      if (role === "Employee" && employeeId && /^\d+$/.test(employeeId)) {
        return employeeService.getEmployee(employeeId).then((employee) => { cache.employees = [employee]; }).catch(() => {});
      }
      return Promise.resolve();
    }),
    notificationService.listNotifications(notificationParams).then((data) => { cache.notifications = data; }).catch(() => {}),
    (canLoadItAccessData(role)
      ? auditLogService.listAuditLogs()
      : Promise.resolve([])
    ).then((data) => { cache.auditLogs = data; }).catch(() => {}),
  ];

  await Promise.allSettled(tasks);
}

function getNotificationParams(role, email) {
  if (role === "Employee" && email) {
    return { recipientEmail: email };
  }
  if (role === "HR Manager") {
    return { recipientRole: "HR Manager" };
  }
  if (role === "Department Manager" || role === "Dept Manager") {
    return { recipientRole: "Department Manager" };
  }
  if (role === "IT Manager" || role === "IT Administrator") {
    return { recipientRole: "IT Administrator" };
  }
  return {};
}

function fireAndRefresh(action) {
  return action().then((result) => refreshAll().then(() => result));
}

export const db = {
  init() {
    return refreshDashboardCache();
  },
  loadAll() {
    return refreshAll();
  },
  loadTeamOnboarding(options) {
    return refreshTeamOnboardingCache(options);
  },
  loadTeamDocuments() {
    return refreshDocumentsForCachedEmployees();
  },
  reset() {
    return refreshAll();
  },
  getEmployees() {
    return cache.employees;
  },
  addEmployee(employee) {
    fireAndRefresh(() => employeeService.createEmployee(employee));
  },
  updateEmployee(employee) {
    if (!employee.databaseId && !employee.raw?.id) return;
    fireAndRefresh(() => employeeService.updateEmployee(employee.databaseId || employee.raw.id, employee));
  },
  deleteEmployee() {},
  getAccessRequests() {
    return cache.accessRequests;
  },
  addAccessRequest(request) {
    return fireAndRefresh(() => apiClient.post("/access-requests", {
      employeeId: request.employeeId,
      systemCatalogId: request.systemCatalogId,
      systemName: request.specificSystem || request.system,
      justification: request.justification || "",
    }));
  },
  updateAccessRequest(id, status, remarks) {
    return fireAndRefresh(() => apiClient.patch(`/access-requests/${id}/status`, {
      status: String(status || "").toUpperCase(),
      actorEmail: localStorage.getItem("userEmail") || "",
      remarks,
    }));
  },
  getSystemCatalog() {
    return cache.systemCatalog;
  },
  saveSystemCatalog() {
    refreshAll();
  },
  getDeactivations() {
    return cache.deactivations;
  },
  saveDeactivations() {
    refreshAll();
  },
  deactivateUser() {},
  getNotifications(role, email) {
    return cache.notifications.filter((item) => {
      const roleMatches = !role || item.role === role;
      const emailMatches = !email || item.email === email;
      return roleMatches && emailMatches;
    });
  },
  addNotification(role, message, color, email = "") {
    fireAndRefresh(() => notificationService.createNotification({
      recipientEmail: email || localStorage.getItem("userEmail") || "notifications@onboardpro.local",
      recipientRole: role,
      title: "Notification",
      message,
    }));
  },
  updateNotification(id, updates) {
    if (updates?.read) {
      fireAndRefresh(() => notificationService.markNotificationRead(id));
    }
  },
  deleteNotification() {},
  markAllNotificationsAsRead(role) {
    const notifications = cache.notifications.filter((item) => !role || item.role === role);
    fireAndRefresh(() => Promise.all(notifications.map((item) => notificationService.markNotificationRead(item.id))));
  },
  getActivities() {
    return cache.activities;
  },
  addActivity() {},
  getAuditLogs() {
    return cache.auditLogs;
  },
  addAuditLog(userName, action, module) {
    fireAndRefresh(() => auditLogService.createAuditLog({
      userName,
      role: localStorage.getItem("userRole") || "Admin",
      module,
      action,
      description: action,
    }));
  },
  getAccessCategories() {
    try {
      const stored = localStorage.getItem("accessCategoriesStatus");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  saveAccessCategories(cats) {
    try {
      localStorage.setItem("accessCategoriesStatus", JSON.stringify(cats));
    } catch (err) {
      console.warn("Failed to save access categories status", err);
    }
  },
  getWorkflowSteps() {
    return cache.workflowSteps;
  },
};
