package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.NotificationRequest;
import com.onboardpro.employee.dto.NotificationResponse;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.service.NotificationService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogServiceImpl auditLogService;

    @Override
    @Transactional
    public NotificationResponse sendNotification(NotificationRequest request) {
        Employee employee = request.employeeId() == null ? null : employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Notification notification = Notification.builder()
                .employee(employee)
                .recipientUserId(request.recipientUserId() == null && employee != null ? employee.getId() : request.recipientUserId())
                .recipientEmail(request.recipientEmail().trim().toLowerCase())
                .recipientRole(request.recipientRole().trim())
                .title(request.title().trim())
                .message(request.message().trim())
                .readFlag(false)
                .readAt(null)
                .build();
        Notification saved = notificationRepository.save(notification);
        auditLogService.record(
                request.recipientRole().trim(),
                request.recipientRole().trim(),
                "Notifications",
                "Notification sent",
                "Notification sent to %s: %s.".formatted(saved.getRecipientRole(), saved.getTitle()),
                saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                saved.getEmployee() == null ? null : saved.getEmployee().getFullName()
        );
        return ResponseMapper.notification(saved);
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        boolean wasUnread = !notification.isReadFlag();
        notification.setReadFlag(true);
        if (wasUnread || notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        Notification saved = notificationRepository.save(notification);
        if (wasUnread) {
            auditLogService.record(
                    saved.getRecipientRole(),
                    saved.getRecipientRole(),
                    "Notifications",
                    "Notification marked as read",
                    "Notification marked as read: %s.".formatted(saved.getTitle()),
                    saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                    saved.getEmployee() == null ? null : saved.getEmployee().getFullName()
            );
        }
        return ResponseMapper.notification(saved);
    }

    @Override
    @Transactional
    public List<NotificationResponse> markAllRead(Long recipientUserId, String recipientEmail, String recipientRole) {
        List<Notification> notifications = findNotifications(recipientUserId, recipientEmail, recipientRole);
        Instant readAt = Instant.now();
        boolean changed = false;

        for (Notification notification : notifications) {
            if (!notification.isReadFlag()) {
                notification.setReadFlag(true);
                notification.setReadAt(readAt);
                changed = true;
            } else if (notification.getReadAt() == null) {
                notification.setReadAt(readAt);
                changed = true;
            }
        }

        if (changed) {
            notificationRepository.saveAll(notifications);
            String actor = recipientRole == null || recipientRole.isBlank() ? "Admin" : recipientRole.trim();
            auditLogService.record(
                    actor,
                    actor,
                    "Notifications",
                    "Notifications marked as read",
                    "All unread notifications marked as read.",
                    null,
                    null
            );
        }

        return notifications.stream().map(ResponseMapper::notification).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> listNotifications(Long recipientUserId, String recipientEmail, String recipientRole) {
        return findNotifications(recipientUserId, recipientEmail, recipientRole).stream()
                .map(ResponseMapper::notification)
                .toList();
    }

    private List<Notification> findNotifications(Long recipientUserId, String recipientEmail, String recipientRole) {
        List<Notification> notifications;
        if (recipientUserId != null) {
            notifications = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(recipientUserId);
        } else if (recipientEmail != null && !recipientEmail.isBlank()) {
            notifications = notificationRepository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(recipientEmail);
        } else if (recipientRole != null && !recipientRole.isBlank()) {
            notifications = notificationRepository.findByRecipientRoleIgnoreCaseOrderByCreatedAtDesc(recipientRole);
        } else {
            notifications = notificationRepository.findAll();
        }
        return notifications;
    }
}
