package com.onboardpro.employee.security;

import java.security.Principal;

public record AuthenticatedUserPrincipal(String userId, String username) implements Principal {

    @Override
    public String getName() {
        return username;
    }
}
