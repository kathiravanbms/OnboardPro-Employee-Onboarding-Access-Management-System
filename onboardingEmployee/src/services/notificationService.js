import { apiClient, unwrapApiResponse } from "./apiClient";

function mapNotification(notification) {
  return {
    raw: notification,
    id: notification.id,
    employeeId: notification.employeeId,
    recipientUserId: notification.recipientUserId,
    email: notification.recipientEmail,
    role: notification.recipientRole,
    title: notification.title,
    message: notification.message,
    msg: notification.message,
    read: notification.read,
    readAt: notification.readAt,
    createdAt: notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now(),
    time: notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now(),
    color: "#6366F1",
  };
}

export async function listNotifications(params = {}) {
  const response = await apiClient.get("/notifications", { params });
  return unwrapApiResponse(response).map(mapNotification);
}

export async function markNotificationRead(id) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return mapNotification(unwrapApiResponse(response));
}

export async function markAllNotificationsRead(params = {}) {
  const response = await apiClient.patch("/notifications/read-all", null, { params });
  return unwrapApiResponse(response).map(mapNotification);
}

export async function createNotification(notification) {
  const response = await apiClient.post("/notifications", notification);
  return mapNotification(unwrapApiResponse(response));
}

export const notificationService = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
};
