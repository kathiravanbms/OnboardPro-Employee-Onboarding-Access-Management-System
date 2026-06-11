package com.onboardpro.authidentity.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private String employeeId;
    private String username;
    private String email;
    private String phoneNumber;
    private Boolean isActive;
    private Instant createdAt;
    private Instant lastLogin;
    private List<String> roles;
}
