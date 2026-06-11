package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmployeeCodeIgnoreCase(String employeeCode);
    Optional<Employee> findByEmailIgnoreCase(String email);
    Optional<Employee> findByEmployeeCodeIgnoreCase(String employeeCode);
    List<Employee> findByStatus(EmployeeStatus status);
    List<Employee> findByDepartmentId(Long departmentId);
    long countByStatus(EmployeeStatus status);
    List<Employee> findByOnboardingStatus(OnboardingStatus onboardingStatus);
    List<Employee> findByOnboardingStatusOrderByUpdatedAtDesc(OnboardingStatus onboardingStatus);
    long countByOnboardingStatus(OnboardingStatus onboardingStatus);
    long countByOnboardingStatusIn(Collection<OnboardingStatus> onboardingStatuses);

    @Query("""
            select employee
            from Employee employee
            where employee.managerName is not null
              and lower(employee.managerName) in :managerKeys
            """)
    List<Employee> findManagedEmployeesByManagerKeys(@Param("managerKeys") Collection<String> managerKeys);
}
