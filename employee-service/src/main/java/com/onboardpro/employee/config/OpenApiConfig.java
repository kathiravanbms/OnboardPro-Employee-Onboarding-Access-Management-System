package com.onboardpro.employee.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI employeeServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("OnboardPro Employee Service API")
                        .version("v1")
                        .description("Employee onboarding, documents, tasks, approvals, access requests, notifications, and reports."));
    }
}
