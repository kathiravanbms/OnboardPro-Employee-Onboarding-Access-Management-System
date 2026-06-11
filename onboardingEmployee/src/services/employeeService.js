import { apiClient, unwrapApiResponse } from "./apiClient";

const departmentCodeByLabel = {
  IT: "IT",
  HR: "HR",
  Manager: "MGR",
  Management: "MGR",
  Employee: "EMP",
  "Employee Operations": "EMP",
};

function toTitleStatus(onboardingStatus) {
  const value = String(onboardingStatus || "INITIATED").toUpperCase();

  if (value === "COMPLETED") return "Completed";
  if (value === "HR_VERIFICATION") return "HR Verification";
  if (value === "PENDING_APPROVAL") return "Pending Approval";
  if (value === "IN_PROGRESS") return "In Progress";
  return "Initiated";
}

export function mapEmployee(employee) {
  const status = toTitleStatus(employee.onboardingStatus);

  return {
    raw: employee,
    id: employee.employeeCode || String(employee.id),
    databaseId: employee.id,
    employeeId: employee.employeeCode || String(employee.id),
    name: employee.fullName,
    email: employee.email,
    department: employee.departmentCode || employee.departmentName,
    departmentName: employee.departmentName,
    jobTitle: employee.jobTitle,
    position: employee.jobTitle,
    manager: employee.managerName || "",
    startDate: employee.startDate,
    phone: employee.phoneNumber || "",
    dob: employee.dateOfBirth || "",
    gender: employee.gender || "Male",
    address: employee.address || "",
    emergencyName: employee.emergencyContactName || "",
    emergencyPhone: employee.emergencyContactPhone || "",
    policyChecks: {
      conduct: Boolean(employee.policyConductAcknowledged),
      "working-hours": Boolean(employee.policyWorkingHoursAcknowledged),
      "anti-harassment": Boolean(employee.policyAntiHarassmentAcknowledged),
      "data-security": Boolean(employee.policyDataSecurityAcknowledged),
      "health-safety": Boolean(employee.policyHealthSafetyAcknowledged),
    },
    role: "Employee",
    status,
    accountStatus: employee.status || "ACTIVE",
    progress: employee.onboardingProgress ?? 0,
    docsStatus: ["COMPLETED", "PENDING_APPROVAL"].includes(employee.onboardingStatus) ? "Completed" : "Pending",
    documents: {},
    events: [],
    onboardingComplete: status === "Completed",
  };
}

function toCreatePayload(form) {
  return {
    fullName: form.name?.trim() || form.fullName?.trim(),
    email: form.email?.trim().toLowerCase(),
    departmentCode: departmentCodeByLabel[form.department] || form.departmentCode || form.department,
    jobTitle: form.jobTitle?.trim(),
    managerName: form.manager?.trim() || form.managerName?.trim() || "",
    startDate: form.startDate,
  };
}

export async function listEmployees(params = {}) {
  const response = await apiClient.get("/employees", { params });
  return unwrapApiResponse(response).map(mapEmployee);
}

export async function listActiveEmployees() {
  return listEmployees({ status: "ACTIVE" });
}

export async function getEmployee(id) {
  const response = await apiClient.get(`/employees/${id}`);
  return mapEmployee(unwrapApiResponse(response));
}

export async function createEmployee(form) {
  const response = await apiClient.post("/employees", toCreatePayload(form));
  return mapEmployee(unwrapApiResponse(response));
}

export async function updateEmployee(id, employee) {
  const response = await apiClient.put(`/employees/${id}`, toCreatePayload(employee));
  return mapEmployee(unwrapApiResponse(response));
}

export async function updateEmployeeStatus(id, status) {
  const response = await apiClient.patch(`/employees/${id}/status`, { status });
  return mapEmployee(unwrapApiResponse(response));
}

export const employeeService = {
  listEmployees,
  listActiveEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
};
