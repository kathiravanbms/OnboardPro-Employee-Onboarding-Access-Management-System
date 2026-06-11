package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.OnboardingTask;
import com.onboardpro.employee.entity.TaskStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, Long> {
    List<OnboardingTask> findByEmployeeId(Long employeeId);
    long countByEmployeeId(Long employeeId);
    long countByEmployeeIdAndStatus(Long employeeId, TaskStatus status);
    List<OnboardingTask> findByStatus(TaskStatus status);
    List<OnboardingTask> findByStatusOrderByDueDateAsc(TaskStatus status);
    long countByStatus(TaskStatus status);
}
