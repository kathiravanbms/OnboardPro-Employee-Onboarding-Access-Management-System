package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.dto.ManagerApprovalRequest;
import com.onboardpro.employee.entity.Approval;
import com.onboardpro.employee.entity.ApprovalStatus;
import com.onboardpro.employee.entity.ApprovalType;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.repository.ApprovalRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceImplTest {

    @Mock
    private ApprovalRepository approvalRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private OnboardingServiceImpl onboardingService;
    @Mock
    private AuditLogServiceImpl auditLogService;

    private ApprovalServiceImpl approvalService;
    private Employee employee;

    @BeforeEach
    void setUp() {
        approvalService = new ApprovalServiceImpl(
                approvalRepository,
                employeeRepository,
                notificationRepository,
                onboardingService,
                auditLogService
        );
        employee = Employee.builder()
                .id(4L)
                .employeeCode("EMP-004")
                .fullName("Test Employee")
                .email("employee@example.com")
                .onboardingStatus(OnboardingStatus.IN_PROGRESS)
                .build();
        when(employeeRepository.findById(4L)).thenReturn(Optional.of(employee));
        when(approvalRepository.save(any(Approval.class))).thenAnswer(invocation -> {
            Approval approval = invocation.getArgument(0);
            if (approval.getId() == null) {
                approval.setId(1L);
            }
            return approval;
        });
    }

    @Test
    void approveCreatesManagerApprovalAndMovesEmployeeToHrVerification() {
        when(approvalRepository.findByEmployeeIdAndApprovalType(4L, ApprovalType.MANAGER_APPROVAL))
                .thenReturn(Optional.empty());

        var response = approvalService.approveManagerOnboarding(
                new ManagerApprovalRequest(4L, "Ready for HR"),
                "manager@example.com"
        );

        assertThat(response.approvalType()).isEqualTo(ApprovalType.MANAGER_APPROVAL);
        assertThat(response.status()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(response.requestedBy()).isEqualTo("Test Employee");
        assertThat(response.approver()).isEqualTo("manager@example.com");
        assertThat(employee.getOnboardingStatus()).isEqualTo(OnboardingStatus.HR_VERIFICATION);
        verify(auditLogService).record(
                eq("manager@example.com"),
                eq("Department Manager"),
                eq("Approvals"),
                eq("Approved"),
                any(String.class),
                eq(4L),
                eq("Test Employee")
        );

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue().getRecipientRole()).isEqualTo("HR Manager");
    }

    @Test
    void rejectUpdatesExistingManagerApprovalWithoutCreatingDuplicate() {
        Approval existing = Approval.builder()
                .id(9L)
                .employee(employee)
                .approvalType(ApprovalType.MANAGER_APPROVAL)
                .status(ApprovalStatus.APPROVED)
                .build();
        when(approvalRepository.findByEmployeeIdAndApprovalType(4L, ApprovalType.MANAGER_APPROVAL))
                .thenReturn(Optional.of(existing));

        var response = approvalService.rejectManagerOnboarding(
                new ManagerApprovalRequest(4L, "Needs correction"),
                "manager@example.com"
        );

        assertThat(response.id()).isEqualTo(9L);
        assertThat(response.status()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(response.remarks()).isEqualTo("Needs correction");
        assertThat(employee.getOnboardingStatus()).isEqualTo(OnboardingStatus.PENDING_APPROVAL);

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue().getRecipientEmail()).isEqualTo("employee@example.com");
    }
}
