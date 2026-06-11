package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.AccessRequestResponse;
import com.onboardpro.employee.dto.ApprovalResponse;
import com.onboardpro.employee.dto.DocumentResponse;
import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.NotificationResponse;
import com.onboardpro.employee.dto.TaskResponse;
import com.onboardpro.employee.entity.AccessRequest;
import com.onboardpro.employee.entity.Approval;
import com.onboardpro.employee.entity.Document;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.OnboardingTask;

final class ResponseMapper {

    private ResponseMapper() {
    }

    static EmployeeResponse employee(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getDepartment().getCode(),
                employee.getDepartment().getName(),
                employee.getJobTitle(),
                employee.getManagerName(),
                employee.getStartDate(),
                employee.getPhoneNumber(),
                employee.getDateOfBirth(),
                employee.getGender(),
                employee.getAddress(),
                employee.getEmergencyContactName(),
                employee.getEmergencyContactPhone(),
                employee.isPolicyConductAcknowledged(),
                employee.isPolicyWorkingHoursAcknowledged(),
                employee.isPolicyAntiHarassmentAcknowledged(),
                employee.isPolicyDataSecurityAcknowledged(),
                employee.isPolicyHealthSafetyAcknowledged(),
                employee.getStatus(),
                employee.getOnboardingStatus(),
                employee.getOnboardingProgress(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }

    static TaskResponse task(OnboardingTask task) {
        return new TaskResponse(
                task.getId(),
                task.getEmployee().getId(),
                task.getEmployee().getEmployeeCode(),
                task.getTitle(),
                task.getDescription(),
                task.getAssignedRole(),
                task.getStatus(),
                task.getDueDate(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    static DocumentResponse document(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getEmployee().getId(),
                document.getEmployee().getEmployeeCode(),
                document.getDocumentType(),
                document.getFileName(),
                document.getStorageUrl(),
                document.getContentType(),
                document.getFileSize(),
                document.getStatus(),
                document.getReviewComment(),
                document.getReviewedBy(),
                document.getReviewedAt(),
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }

    static ApprovalResponse approval(Approval approval) {
        return new ApprovalResponse(
                approval.getId(),
                approval.getEmployee().getId(),
                approval.getEmployee().getEmployeeCode(),
                approval.getEmployee().getFullName(),
                approval.getApprovalType(),
                approval.getStatus(),
                approval.getRequestedBy(),
                approval.getApprover(),
                approval.getRemarks(),
                approval.getDecidedAt(),
                approval.getCreatedAt(),
                approval.getUpdatedAt()
        );
    }

    static AccessRequestResponse accessRequest(AccessRequest accessRequest) {
        return new AccessRequestResponse(
                accessRequest.getId(),
                accessRequest.getEmployee().getId(),
                accessRequest.getEmployee().getEmployeeCode(),
                accessRequest.getSystemCatalog() == null ? null : accessRequest.getSystemCatalog().getId(),
                accessRequest.getSystemName(),
                accessRequest.getSystemCatalog() == null ? null : accessRequest.getSystemCatalog().getCategory(),
                accessRequest.getJustification(),
                accessRequest.getStatus(),
                accessRequest.getRequestedBy(),
                accessRequest.getApprovedBy(),
                accessRequest.getProvisionedBy(),
                accessRequest.getRemarks(),
                accessRequest.getDecidedAt(),
                accessRequest.getProvisionedAt(),
                accessRequest.getCreatedAt(),
                accessRequest.getUpdatedAt(),
                null,
                null
        );
    }

    static NotificationResponse notification(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getEmployee() == null ? null : notification.getEmployee().getId(),
                notification.getRecipientUserId(),
                notification.getRequestId(),
                notification.getRecipientEmail(),
                notification.getRecipientRole(),
                notification.getNotificationType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isReadFlag(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}
