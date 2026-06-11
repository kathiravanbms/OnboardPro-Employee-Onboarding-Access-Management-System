package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.TrainingModule;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingModuleRepository extends JpaRepository<TrainingModule, Long> {
    List<TrainingModule> findAllByOrderByUploadDateDesc();
}
