import { apiClient, unwrapApiResponse } from "./apiClient";

export async function getItProfile() {
  const response = await apiClient.get("/it/profile");
  return unwrapApiResponse(response);
}

export async function updateItProfile(profile) {
  const response = await apiClient.put("/it/profile", profile);
  return unwrapApiResponse(response);
}

export const itProfileService = {
  getItProfile,
  updateItProfile,
};
