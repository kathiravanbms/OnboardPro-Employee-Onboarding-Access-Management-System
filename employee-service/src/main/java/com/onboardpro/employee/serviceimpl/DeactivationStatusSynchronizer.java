package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.entity.AccessDeactivation;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.repository.AccessDeactivationRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeactivationStatusSynchronizer {

    private final AccessDeactivationRepository accessDeactivationRepository;

    @Transactional
    public void markLatestDeactivated(Employee employee) {
        accessDeactivationRepository.findTopByEmployeeIdOrderByIdDesc(employee.getId()).ifPresent(latest -> {
            latest.setEmployeeCode(employee.getEmployeeCode());
            latest.setEmployeeName(employee.getFullName());
            latest.setEmployeeEmail(employee.getEmail());
            latest.setDepartment(employee.getDepartment().getName());
            latest.setStatus("Deactivated");
            if (latest.getDeactivatedAt() == null) {
                latest.setDeactivatedAt(Instant.now());
            }

            accessDeactivationRepository.findByEmployeeIdAndIdNot(employee.getId(), latest.getId()).stream()
                    .filter(this::isActiveWorkflowStatus)
                    .forEach(deactivation -> deactivation.setStatus("Superseded"));
        });
    }

    private boolean isActiveWorkflowStatus(AccessDeactivation deactivation) {
        String status = deactivation.getStatus();
        return status != null
                && ("pending".equalsIgnoreCase(status)
                || "approved".equalsIgnoreCase(status)
                || "deactivated".equalsIgnoreCase(status));
    }
}
