package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.entity.Department;
import com.onboardpro.employee.entity.Document;
import com.onboardpro.employee.entity.DocumentStatus;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.entity.OnboardingTask;
import com.onboardpro.employee.entity.RoleName;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.repository.DocumentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HrReportServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private OnboardingTaskRepository onboardingTaskRepository;

    @InjectMocks
    private HrReportServiceImpl hrReportService;

    @Test
    void onboardingCompletionReportUsesCompletedEmployees() {
        Employee employee = employee();
        when(employeeRepository.findByOnboardingStatusOrderByUpdatedAtDesc(OnboardingStatus.COMPLETED))
                .thenReturn(List.of(employee));

        var rows = hrReportService.onboardingCompletionReport();

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).employeeCode()).isEqualTo("EMP1001");
        assertThat(rows.get(0).onboardingStatus()).isEqualTo(OnboardingStatus.COMPLETED);
        verify(employeeRepository).findByOnboardingStatusOrderByUpdatedAtDesc(OnboardingStatus.COMPLETED);
    }

    @Test
    void documentVerificationReportUsesDocuments() {
        Document document = Document.builder()
                .id(10L)
                .employee(employee())
                .documentType("Aadhaar Card")
                .fileName("aadhaar.pdf")
                .storageUrl("local://aadhaar.pdf")
                .status(DocumentStatus.VERIFIED)
                .reviewedBy("HR Manager")
                .reviewedAt(Instant.parse("2026-06-08T10:00:00Z"))
                .createdAt(Instant.parse("2026-06-08T09:00:00Z"))
                .build();
        when(documentRepository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(document));

        var rows = hrReportService.documentVerificationReport();

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).documentId()).isEqualTo(10);
        assertThat(rows.get(0).status()).isEqualTo(DocumentStatus.VERIFIED);
        verify(documentRepository).findAllByOrderByUpdatedAtDesc();
    }

    @Test
    void pendingTaskReportUsesPendingTasks() {
        OnboardingTask task = OnboardingTask.builder()
                .id(20L)
                .employee(employee())
                .title("Upload required documents")
                .assignedRole(RoleName.EMPLOYEE)
                .status(TaskStatus.PENDING)
                .dueDate(LocalDate.of(2026, 6, 10))
                .createdAt(Instant.parse("2026-06-08T09:00:00Z"))
                .build();
        when(onboardingTaskRepository.findByStatusOrderByDueDateAsc(TaskStatus.PENDING)).thenReturn(List.of(task));

        var rows = hrReportService.pendingTaskReport();

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).taskId()).isEqualTo(20);
        assertThat(rows.get(0).status()).isEqualTo(TaskStatus.PENDING);
        verify(onboardingTaskRepository).findByStatusOrderByDueDateAsc(TaskStatus.PENDING);
    }

    private Employee employee() {
        Department department = Department.builder()
                .id(1L)
                .name("Engineering")
                .code("ENG")
                .active(true)
                .build();

        return Employee.builder()
                .id(1L)
                .employeeCode("EMP1001")
                .fullName("Vasanth")
                .email("vasanth@example.com")
                .department(department)
                .jobTitle("Developer")
                .startDate(LocalDate.of(2026, 6, 1))
                .status(EmployeeStatus.ACTIVE)
                .onboardingStatus(OnboardingStatus.COMPLETED)
                .onboardingProgress(100)
                .updatedAt(Instant.parse("2026-06-08T10:00:00Z"))
                .build();
    }
}
