package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.TrainingCompletion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingCompletionRepository extends JpaRepository<TrainingCompletion, Long> {
    List<TrainingCompletion> findByEmployeeId(Long employeeId);
    long countByEmployeeId(Long employeeId);
    boolean existsByEmployeeIdAndTrainingModuleId(Long employeeId, Long trainingModuleId);
    Optional<TrainingCompletion> findByEmployeeIdAndTrainingModuleId(Long employeeId, Long trainingModuleId);
}
