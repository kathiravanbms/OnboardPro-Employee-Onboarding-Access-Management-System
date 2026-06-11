import { AUTH_API_BASE_URL, fetchWithAuth, getAccessToken } from "../services/authSession";

export function getPasswordValidation(passwordForm) {
  const errors = {};
  const currentPassword = passwordForm.current || "";
  const newPassword = passwordForm.next || "";
  const confirmPassword = passwordForm.confirm || "";

  if (!currentPassword.trim()) {
    errors.current = "Current password is required.";
  }

  if (!newPassword) {
    errors.next = "New password is required.";
  } else if (newPassword.length < 8) {
    errors.next = "Weak password. Use at least 8 characters.";
  } else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    errors.next = "Medium strength needs both letters and numbers.";
  }

  if (!confirmPassword) {
    errors.confirm = "Confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirm = "New passwords must match.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }

  const response = await fetchWithAuth(`${AUTH_API_BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to update password.");
  }

  return data;
}
