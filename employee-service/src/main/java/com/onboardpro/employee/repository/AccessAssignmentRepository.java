package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.AccessAssignment;
import com.onboardpro.employee.dto.AccessDeactivationCandidateRow;
import com.onboardpro.employee.dto.AccessAssignmentListResponse;
import com.onboardpro.employee.dto.ItDashboardAccessQueuePreviewRow;
import com.onboardpro.employee.dto.SystemCatalogActiveUserSummaryProjection;
import com.onboardpro.employee.entity.EmployeeStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccessAssignmentRepository extends JpaRepository<AccessAssignment, Long> {
    List<AccessAssignment> findByEmployeeId(Long employeeId);
    List<AccessAssignment> findByEmployeeIdAndStatusIgnoreCase(Long employeeId, String status);
    List<AccessAssignment> findByStatusIgnoreCase(String status);
    List<AccessAssignment> findTop5ByOrderByUpdatedAtDesc();
    List<AccessAssignment> findTop10ByOrderByUpdatedAtDesc();
    long countByStatusIgnoreCase(String status);
    long countByStatusIgnoreCaseAndProvisionedOn(String status, LocalDate provisionedOn);
    Optional<AccessAssignment> findByAccessRequestId(Long accessRequestId);
    Optional<AccessAssignment> findFirstByEmployeeIdAndSystemNameIgnoreCase(Long employeeId, String systemName);
    boolean existsByEmployeeIdAndSystemNameIgnoreCase(Long employeeId, String systemName);
    boolean existsByAccessRequestId(Long accessRequestId);

    @Query("""
            select new com.onboardpro.employee.dto.ItDashboardAccessQueuePreviewRow(
                assignment.employeeName,
                assignment.systemName,
                assignment.status,
                assignment.priority,
                assignment.approvedBy
            )
            from AccessAssignment assignment
            order by assignment.updatedAt desc
            """)
    List<ItDashboardAccessQueuePreviewRow> findDashboardAccessQueuePreview(Pageable pageable);

    @Query("""
            select new com.onboardpro.employee.dto.AccessDeactivationCandidateRow(
                employee.id,
                employee.employeeCode,
                employee.fullName,
                department.name,
                assignment.systemName
            )
            from AccessAssignment assignment
            join assignment.employee employee
            join employee.department department
            where employee.status = :employeeStatus
              and lower(assignment.status) in :assignmentStatuses
              and not exists (
                select deactivation.id
                from AccessDeactivation deactivation
                where deactivation.employee = employee
                  and lower(deactivation.status) in :deactivationStatuses
              )
            order by employee.fullName asc, assignment.systemName asc
            """)
    List<AccessDeactivationCandidateRow> findDeactivationCandidateRows(
            @Param("employeeStatus") EmployeeStatus employeeStatus,
            @Param("assignmentStatuses") List<String> assignmentStatuses,
            @Param("deactivationStatuses") List<String> deactivationStatuses);

    @Query("""
            select new com.onboardpro.employee.dto.AccessAssignmentListResponse(
                assignment.id,
                assignment.employeeName,
                assignment.employeeEmail,
                assignment.systemName,
                assignment.approvedBy,
                assignment.priority,
                assignment.status,
                assignment.provisionedOn
            )
            from AccessAssignment assignment
            """)
    List<AccessAssignmentListResponse> findAssignmentList();

    @Query("""
            select new com.onboardpro.employee.dto.AccessAssignmentListResponse(
                assignment.id,
                assignment.employeeName,
                assignment.employeeEmail,
                assignment.systemName,
                assignment.approvedBy,
                assignment.priority,
                assignment.status,
                assignment.provisionedOn
            )
            from AccessAssignment assignment
            where lower(assignment.status) = lower(:status)
            """)
    List<AccessAssignmentListResponse> findAssignmentListByStatus(@Param("status") String status);

    @Query("""
            select assignment
            from AccessAssignment assignment
            left join fetch assignment.accessRequest request
            left join fetch request.systemCatalog catalog
            where lower(assignment.employeeEmail) = lower(:email)
              and assignment.credentials is not null
            order by assignment.provisionedOn desc, assignment.updatedAt desc
            """)
    List<AccessAssignment> findCredentialsByEmployeeEmail(@Param("email") String email);

    @Query("""
            select assignment
            from AccessAssignment assignment
            left join assignment.accessRequest request
            left join request.systemCatalog catalog
            where lower(assignment.status) = lower(:status)
              and (
                catalog.id = :systemId
                or lower(assignment.systemName) = lower(:systemName)
              )
            order by assignment.provisionedOn desc, assignment.updatedAt desc
            """)
    List<AccessAssignment> findActiveUsersForSystem(
            @Param("systemId") Long systemId,
            @Param("systemName") String systemName,
            @Param("status") String status);

    @Query("""
            select count(distinct assignment)
            from AccessAssignment assignment
            left join assignment.accessRequest request
            left join request.systemCatalog catalog
            where lower(assignment.status) = lower(:status)
              and (
                catalog.id = :systemId
                or lower(assignment.systemName) = lower(:systemName)
              )
            """)
    long countActiveUsersForSystem(
            @Param("systemId") Long systemId,
            @Param("systemName") String systemName,
            @Param("status") String status);

    @Query(value = """
            SELECT
              sc.id AS systemCatalogId,
              COUNT(DISTINCT CASE
                WHEN aa.id IS NOT NULL
                 AND (e.id IS NULL OR UPPER(e.status) = 'ACTIVE')
                THEN aa.id
              END) AS activeUsers
            FROM system_catalog sc
            LEFT JOIN access_assignments aa
              ON LOWER(aa.status) = LOWER(:status)
             AND (
                LOWER(aa.system_name) = LOWER(sc.name)
                OR aa.access_request_id IN (
                    SELECT ar.id
                    FROM access_requests ar
                    WHERE ar.system_catalog_id = sc.id
                )
             )
            LEFT JOIN employees e ON e.id = aa.employee_id
            GROUP BY sc.id
            """, nativeQuery = true)
    List<SystemCatalogActiveUserSummaryProjection> countActiveUsersBySystem(@Param("status") String status);
}
