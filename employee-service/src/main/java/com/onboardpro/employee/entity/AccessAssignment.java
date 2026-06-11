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
@Table(name = "access_assignments")
public class AccessAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_request_id")
    private AccessRequest accessRequest;

    @Column(length = 40)
    private String employeeCode;

    @Column(nullable = false, length = 120)
    private String employeeName;

    @Column(nullable = false, length = 160)
    private String employeeEmail;

    @Column(nullable = false, length = 160)
    private String systemName;

    @Column(length = 160)
    private String approvedBy;

    @Column(nullable = false, length = 32)
    private String priority;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(length = 80)
    private String accessLevel;

    @Column(length = 1000)
    private String notes;

    @Column(length = 1000)
    private String credentials;

    private LocalDate provisionedOn;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
