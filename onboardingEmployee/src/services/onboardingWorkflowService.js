import { apiClient, unwrapApiResponse } from "./apiClient";
import { mapEmployee } from "./employeeService";

export const TASK_TITLES = {
  personal: ["Personal Details Submission", "Complete profile"],
  documents: ["Document Upload", "Upload required documents"],
  policies: ["Policy Acknowledgment"],
  training: ["Training Completion"],
};

export const REQUIRED_DOCUMENT_TYPES = [
  "Aadhaar Card",
  "10th Marksheet",
  "12th Marksheet",
  "Degree Completion Certificate",
];

function normalizeTaskKey(title) {
  const normalizedTitle = String(title || "").trim().toLowerCase();
  return Object.entries(TASK_TITLES).find(([, titles]) =>
    titles.some((candidate) => candidate.toLowerCase() === normalizedTitle)
  )?.[0] || null;
}

export function mapTasksByChecklistKey(tasks = []) {
  return tasks.reduce((acc, task) => {
    const key = normalizeTaskKey(task.title);
    if (key && (!acc[key] || acc[key].status !== "COMPLETED")) {
      acc[key] = task;
    }
    return acc;
  }, {});
}

export function mapDocumentsByType(documents = []) {
  return documents.reduce((acc, document) => {
    acc[document.documentType] = {
      uploaded: Boolean(document.fileName),
      fileName: document.fileName,
      size: document.fileSize || 0,
      progress: 100,
      verificationStatus: document.status === "VERIFIED" ? "Verified" : document.status === "REJECTED" ? "Rejected" : "Pending",
      storageUrl: document.storageUrl,
      fileUrl: document.storageUrl,
      uploadDate: document.createdAt,
      reviewComment: document.reviewComment,
      id: document.id,
    };
    return acc;
  }, {});
}

export function getDocumentWorkflowStatus(documentsByType = {}) {
  const requiredDocs = REQUIRED_DOCUMENT_TYPES.map((type) => documentsByType[type]).filter(Boolean);

  if (requiredDocs.some((doc) => doc.verificationStatus === "Rejected")) return "Rejected";
  if (requiredDocs.length === REQUIRED_DOCUMENT_TYPES.length && requiredDocs.every((doc) => doc.verificationStatus === "Verified")) return "Approved";
  if (requiredDocs.length === REQUIRED_DOCUMENT_TYPES.length && requiredDocs.every((doc) => doc.uploaded)) return "Under Review";
  if (requiredDocs.some((doc) => doc.uploaded)) return "Submitted";
  return "Pending";
}

export async function getEmployeeByEmail(email) {
  if (!email) return null;

  try {
    const response = await apiClient.get("/employees/by-email", { params: { email } });
    return mapEmployee(unwrapApiResponse(response));
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function listTasks(employeeId) {
  const response = await apiClient.get("/onboarding/tasks", { params: { employeeId } });
  return unwrapApiResponse(response);
}

export async function listDocuments(employeeId) {
  const response = await apiClient.get("/documents", { params: { employeeId } });
  return unwrapApiResponse(response);
}

export async function submitPersonalDetails(employeeId, details) {
  const response = await apiClient.patch(`/onboarding/${employeeId}/personal-details`, {
    phoneNumber: details.phone,
    dateOfBirth: details.dob,
    gender: details.gender,
    address: details.address,
    emergencyContactName: details.emergencyName,
    emergencyContactPhone: details.emergencyPhone,
  });
  return mapEmployee(unwrapApiResponse(response));
}

export async function uploadDocument(employeeId, type, fileMeta) {
  const response = await apiClient.post("/documents", {
    employeeId,
    documentType: type,
    fileName: fileMeta.fileName,
    storageUrl: fileMeta.fileUrl || `local://${encodeURIComponent(fileMeta.fileName)}`,
    contentType: fileMeta.contentType || "application/octet-stream",
    fileSize: fileMeta.size || 0,
  });
  return unwrapApiResponse(response);
}

export async function acknowledgePolicies(employeeId, policyChecks) {
  const response = await apiClient.patch(`/onboarding/${employeeId}/policy-acknowledgment`, {
    conduct: Boolean(policyChecks.conduct),
    workingHours: Boolean(policyChecks["working-hours"]),
    antiHarassment: Boolean(policyChecks["anti-harassment"]),
    dataSecurity: Boolean(policyChecks["data-security"]),
    healthSafety: Boolean(policyChecks["health-safety"]),
  });
  return mapEmployee(unwrapApiResponse(response));
}

export async function reviewDocument(documentId, status, reviewComment = "") {
  const response = await apiClient.patch(`/documents/${documentId}/verify`, {
    status,
    reviewComment,
  });
  return unwrapApiResponse(response);
}

export async function reReviewDocument(documentId, status, reviewComment = "") {
  const response = await apiClient.patch(`/documents/${documentId}/re-review`, {
    status,
    reviewComment,
  });
  return unwrapApiResponse(response);
}

export const onboardingWorkflowService = {
  getEmployeeByEmail,
  listTasks,
  listDocuments,
  submitPersonalDetails,
  uploadDocument,
  acknowledgePolicies,
  reviewDocument,
  reReviewDocument,
};
