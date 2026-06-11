package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.NotificationRequest;
import com.onboardpro.employee.dto.NotificationResponse;
import java.util.List;

public interface NotificationService {
    NotificationResponse sendNotification(NotificationRequest request);
    NotificationResponse markRead(Long id);
    List<NotificationResponse> markAllRead(Long recipientUserId, String recipientEmail, String recipientRole);
    List<NotificationResponse> listNotifications(Long recipientUserId, String recipientEmail, String recipientRole);
}
