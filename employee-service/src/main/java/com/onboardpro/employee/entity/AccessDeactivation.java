package com.onboardpro.employee.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "access_deactivations")
public class AccessDeactivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, length = 40)
    private String employeeCode;

    @Column(nullable = false, length = 120)
    private String employeeName;

    @Column(nullable = false, length = 160)
    private String employeeEmail;

    @Column(nullable = false, length = 80)
    private String department;

    @Column(nullable = false)
    private LocalDate exitDate;

    @Column(nullable = false, length = 120)
    private String reason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String systems;

    @Column(nullable = false, length = 1000)
    private String notes;

    @Column(length = 160)
    private String requestedBy;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
