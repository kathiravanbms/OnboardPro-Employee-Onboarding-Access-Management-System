package com.onboardpro.employee.serviceimpl;

import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthAccountClient {

    private final RestClient.Builder restClientBuilder;

    @Value("${onboardpro.auth-service.base-url:http://localhost:8081}")
    private String authServiceBaseUrl;

    public void deactivateByEmail(String email, String bearerToken) {
        if (email == null || email.isBlank() || bearerToken == null || bearerToken.isBlank()) {
            log.warn("Skipping auth account deactivation because email or bearer token is missing");
            return;
        }

        URI uri = UriComponentsBuilder
                .fromHttpUrl(authServiceBaseUrl)
                .path("/api/users/by-email/{email}/deactivate")
                .buildAndExpand(email.trim().toLowerCase())
                .toUri();

        restClientBuilder.build()
                .put()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .retrieve()
                .toBodilessEntity();
    }
}
