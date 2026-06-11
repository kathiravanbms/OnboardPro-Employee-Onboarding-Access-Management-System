package com.onboardpro.authidentity.repository;

import com.onboardpro.authidentity.domain.Role;
import com.onboardpro.authidentity.domain.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(RoleName roleName);
}
