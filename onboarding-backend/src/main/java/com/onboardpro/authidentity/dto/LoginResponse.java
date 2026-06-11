package com.onboardpro.authidentity.dto;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private UUID userId;
    private String employeeId;
    private String email;
    private List<String> roles;
    private Boolean welcomeEmailSent;
    private String welcomeEmailMessage;
}
