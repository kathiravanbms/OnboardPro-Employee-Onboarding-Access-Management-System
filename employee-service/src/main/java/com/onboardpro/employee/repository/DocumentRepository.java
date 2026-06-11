package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.Document;
import com.onboardpro.employee.entity.DocumentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByEmployeeId(Long employeeId);
    List<Document> findByEmployeeIdAndDocumentTypeIgnoreCase(Long employeeId, String documentType);
    List<Document> findByStatus(DocumentStatus status);
    List<Document> findAllByOrderByUpdatedAtDesc();
    long countByStatus(DocumentStatus status);
    long countByEmployeeId(Long employeeId);
    long countByEmployeeIdAndStatus(Long employeeId, DocumentStatus status);

    @Query("select count(distinct d.employee.id) from Document d where d.status = :status")
    long countDistinctEmployeesByStatus(@Param("status") DocumentStatus status);
}
