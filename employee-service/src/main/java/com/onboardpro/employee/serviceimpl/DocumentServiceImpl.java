package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.DocumentRequest;
import com.onboardpro.employee.dto.DocumentResponse;
import com.onboardpro.employee.dto.DocumentVerificationRequest;
import com.onboardpro.employee.entity.Document;
import com.onboardpro.employee.entity.DocumentStatus;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.DocumentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.service.DocumentService;
import java.util.Locale;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private static final String HR_ROLE = "HR Manager";
    private static final String HR_INBOX = "hr@onboardpro.local";

    private static final Set<String> REQUIRED_DOCUMENT_TYPES = Set.of(
            "aadhaar card",
            "10th marksheet",
            "12th marksheet",
            "degree completion certificate"
    );

    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final OnboardingServiceImpl onboardingService;
    private final TaskServiceImpl taskService;
    private final AuditLogServiceImpl auditLogService;

    @Override
    @Transactional
    public DocumentResponse uploadDocument(DocumentRequest request) {
        Employee employee = findEmployee(request.employeeId());
        onboardingService.ensureCoreWorkflowTasks(employee);
        if (!onboardingService.isWorkflowTaskCompleted(employee, OnboardingServiceImpl.PERSONAL_DETAILS_TASK, "Complete profile")) {
            throw new BusinessException("Personal Details Submission must be completed before Document Upload");
        }

        String documentType = request.documentType().trim();
        if (!REQUIRED_DOCUMENT_TYPES.contains(documentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessException("Unsupported onboarding document type");
        }

        Document document = latestDocument(employee.getId(), documentType);
        if (document == null) {
            document = Document.builder()
                    .employee(employee)
                    .documentType(documentType)
                    .build();
        }
        document.setFileName(request.fileName().trim());
        document.setStorageUrl(request.storageUrl().trim());
        document.setContentType(request.contentType());
        document.setFileSize(request.fileSize());
        document.setStatus(DocumentStatus.UPLOADED);
        document.setReviewComment(null);
        document.setReviewedBy(null);
        document.setReviewedAt(null);
        Document saved = documentRepository.save(document);
        auditLogService.record(
                employee.getFullName(),
                "Employee",
                "Documents",
                "Document uploaded",
                "%s uploaded %s.".formatted(employee.getFullName(), documentType),
                employee.getId(),
                employee.getFullName()
        );

        notifyHr(
                employee,
                "Employee uploaded document",
                "%s uploaded %s.".formatted(employee.getFullName(), documentType)
        );
        if (allRequiredDocumentsUploaded(employee.getId())) {
            onboardingService.setWorkflowTaskStatus(employee, OnboardingServiceImpl.DOCUMENT_UPLOAD_TASK, TaskStatus.IN_PROGRESS, "Upload required documents");
            taskService.updateEmployeeProgress(employee);
            notifyHr(
                    employee,
                    "Document verification pending",
                    "%s has uploaded all required onboarding documents. Verification is pending.".formatted(employee.getFullName())
            );
        }

        return ResponseMapper.document(saved);
    }

    @Override
    @Transactional
    public DocumentResponse verifyDocument(Long id, DocumentVerificationRequest request, String reviewer) {
        validateReviewStatus(request);
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (isFinalStatus(document.getStatus())) {
            throw new BusinessException("Document review is locked. Use re-review to change the decision");
        }
        return applyReview(document, request, reviewer, false);
    }

    @Override
    @Transactional
    public DocumentResponse reReviewDocument(Long id, DocumentVerificationRequest request, String reviewer) {
        validateReviewStatus(request);
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!isFinalStatus(document.getStatus())) {
            throw new BusinessException("Only verified or rejected documents can be re-reviewed");
        }
        return applyReview(document, request, reviewer, true);
    }

    private DocumentResponse applyReview(
            Document document,
            DocumentVerificationRequest request,
            String reviewer,
            boolean reReview) {
        document.setStatus(request.status());
        document.setReviewComment(request.reviewComment());
        document.setReviewedBy(reviewer);
        document.setReviewedAt(Instant.now());
        Document saved = documentRepository.save(document);
        auditLogService.record(
                reviewer,
                "HR Manager",
                "Documents",
                reReview
                        ? (document.getStatus() == DocumentStatus.VERIFIED ? "Document re-reviewed and approved" : "Document re-reviewed and rejected")
                        : (document.getStatus() == DocumentStatus.VERIFIED ? "Document approved" : "Document rejected"),
                "%s was %s for %s.".formatted(
                        document.getDocumentType(),
                        document.getStatus() == DocumentStatus.VERIFIED ? "approved" : "rejected",
                        document.getEmployee().getFullName()
                ),
                document.getEmployee().getId(),
                document.getEmployee().getFullName()
        );
        updateDocumentWorkflowStatus(document.getEmployee());
        notifyEmployeeAfterReview(saved);
        return ResponseMapper.document(saved);
    }

    private void validateReviewStatus(DocumentVerificationRequest request) {
        if (request.status() != DocumentStatus.VERIFIED && request.status() != DocumentStatus.REJECTED) {
            throw new BusinessException("Document review status must be VERIFIED or REJECTED");
        }
    }

    private boolean isFinalStatus(DocumentStatus status) {
        return status == DocumentStatus.VERIFIED || status == DocumentStatus.REJECTED;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(Long employeeId) {
        List<Document> documents = employeeId == null ? documentRepository.findAll() : documentRepository.findByEmployeeId(employeeId);
        return documents.stream().map(ResponseMapper::document).toList();
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private boolean allRequiredDocumentsUploaded(Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId).stream()
                .filter(document -> document.getStatus() != DocumentStatus.REJECTED)
                .map(document -> document.getDocumentType().trim().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet())
                .containsAll(REQUIRED_DOCUMENT_TYPES);
    }

    private boolean allRequiredDocumentsVerified(Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId).stream()
                .filter(document -> document.getStatus() == DocumentStatus.VERIFIED)
                .map(document -> document.getDocumentType().trim().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet())
                .containsAll(REQUIRED_DOCUMENT_TYPES);
    }

    private boolean anyRequiredDocumentRejected(Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId).stream()
                .anyMatch(document ->
                        REQUIRED_DOCUMENT_TYPES.contains(document.getDocumentType().trim().toLowerCase(Locale.ROOT))
                                && document.getStatus() == DocumentStatus.REJECTED);
    }

    private void updateDocumentWorkflowStatus(Employee employee) {
        onboardingService.ensureCoreWorkflowTasks(employee);
        if (allRequiredDocumentsVerified(employee.getId())) {
            onboardingService.completeWorkflowTask(employee, OnboardingServiceImpl.DOCUMENT_UPLOAD_TASK, "Upload required documents");
        } else if (allRequiredDocumentsUploaded(employee.getId()) || anyRequiredDocumentRejected(employee.getId())) {
            onboardingService.setWorkflowTaskStatus(employee, OnboardingServiceImpl.DOCUMENT_UPLOAD_TASK, TaskStatus.IN_PROGRESS, "Upload required documents");
        }
        taskService.updateEmployeeProgress(employee);
    }

    private Document latestDocument(Long employeeId, String documentType) {
        List<Document> documents = documentRepository.findByEmployeeIdAndDocumentTypeIgnoreCase(employeeId, documentType);
        if (documents.isEmpty()) {
            return null;
        }
        return documents.get(documents.size() - 1);
    }

    private void notifyHr(Employee employee, String title, String message) {
        Notification notification = Notification.builder()
                .employee(employee)
                .recipientEmail(HR_INBOX)
                .recipientRole(HR_ROLE)
                .title(title)
                .message(message)
                .readFlag(false)
                .build();
        notificationRepository.save(notification);
    }

    private void notifyEmployeeAfterReview(Document document) {
        String title = document.getStatus() == DocumentStatus.VERIFIED ? "Document approved" : "Document rejected";
        String message = document.getStatus() == DocumentStatus.VERIFIED
                ? "%s has been approved by HR.".formatted(document.getDocumentType())
                : "%s was rejected by HR. Please re-upload it.%s".formatted(
                        document.getDocumentType(),
                        document.getReviewComment() == null || document.getReviewComment().isBlank()
                                ? ""
                                : " Reason: " + document.getReviewComment()
                );

        Notification notification = Notification.builder()
                .employee(document.getEmployee())
                .recipientUserId(document.getEmployee().getId())
                .recipientEmail(document.getEmployee().getEmail())
                .recipientRole("Employee")
                .title(title)
                .message(message)
                .readFlag(false)
                .build();
        notificationRepository.save(notification);
    }
}
