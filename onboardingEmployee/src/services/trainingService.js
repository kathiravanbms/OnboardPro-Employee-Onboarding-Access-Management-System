import { apiClient, unwrapApiResponse } from "./apiClient";

export async function createTrainingModule(module) {
  const response = await apiClient.post("/training/modules", {
    title: module.title,
    description: module.description,
    videoUrl: module.videoUrl,
    pdfUrl: module.pdfUrl,
  });
  return unwrapApiResponse(response);
}

export async function listTrainingModules() {
  const response = await apiClient.get("/training/modules");
  return unwrapApiResponse(response);
}

export async function getEmployeeTraining(employeeId) {
  const response = await apiClient.get("/training/employee-training", { params: { employeeId } });
  return unwrapApiResponse(response);
}

export async function completeTrainingModule(employeeId, moduleId) {
  const response = await apiClient.patch(`/training/modules/${moduleId}/complete`, { employeeId });
  return unwrapApiResponse(response);
}

export const trainingService = {
  createTrainingModule,
  listTrainingModules,
  getEmployeeTraining,
  completeTrainingModule,
};
