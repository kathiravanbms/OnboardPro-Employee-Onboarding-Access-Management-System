package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.AccessDeactivation;
import com.onboardpro.employee.dto.AccessDeactivationSummaryRow;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccessDeactivationRepository extends JpaRepository<AccessDeactivation, Long> {
    List<AccessDeactivation> findByEmployeeId(Long employeeId);
    List<AccessDeactivation> findByStatusIgnoreCase(String status);
    List<AccessDeactivation> findTop10ByOrderByUpdatedAtDesc();
    long countByStatusIgnoreCase(String status);
    Optional<AccessDeactivation> findTopByEmployeeIdOrderByIdDesc(Long employeeId);
    List<AccessDeactivation> findByEmployeeIdAndIdNot(Long employeeId, Long id);

    @Query("""
            select d from AccessDeactivation d
            where d.employee.id = :employeeId
              and lower(d.status) in :statuses
            """)
    Optional<AccessDeactivation> findOpenForEmployee(
            @Param("employeeId") Long employeeId,
            @Param("statuses") List<String> statuses
    );

    @Query("""
            select new com.onboardpro.employee.dto.AccessDeactivationSummaryRow(
                deactivation.id,
                coalesce(deactivation.employeeCode, employee.employeeCode),
                coalesce(deactivation.employeeName, employee.fullName),
                coalesce(deactivation.department, department.name),
                deactivation.systems,
                deactivation.status,
                deactivation.deactivatedAt,
                deactivation.exitDate,
                deactivation.reason
            )
            from AccessDeactivation deactivation
            left join deactivation.employee employee
            left join employee.department department
            where lower(deactivation.status) = lower(:status)
              and deactivation.id = (
                select max(latest.id)
                from AccessDeactivation latest
                where latest.employee = deactivation.employee
                  and lower(latest.status) = lower(:status)
              )
            order by deactivation.deactivatedAt desc, deactivation.updatedAt desc
            """)
    List<AccessDeactivationSummaryRow> findLatestDeactivatedRows(@Param("status") String status);
}
