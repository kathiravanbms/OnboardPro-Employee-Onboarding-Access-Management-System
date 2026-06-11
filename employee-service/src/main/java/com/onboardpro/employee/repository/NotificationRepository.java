package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    boolean existsByRequestIdAndRecipientUserIdAndRecipientRoleAndNotificationType(
            Long requestId,
            Long recipientUserId,
            String recipientRole,
            String notificationType
    );
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);
    List<Notification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
    List<Notification> findByRecipientRoleIgnoreCaseOrderByCreatedAtDesc(String recipientRole);
    long countByReadFlagFalse();
    long countByRecipientEmailIgnoreCaseAndReadFlagFalse(String recipientEmail);
}
