package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.SystemCatalog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemCatalogRepository extends JpaRepository<SystemCatalog, Long> {
    List<SystemCatalog> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(String name, String category);
    List<SystemCatalog> findByStatusIgnoreCase(String status);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
