package com.onboardpro.authidentity.repository;

import com.onboardpro.authidentity.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("select u from User u left join fetch u.roleMappings rm left join fetch rm.role where lower(u.email) = lower(:email)")
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    @Query(value = "select max(cast(substring(employee_id, 4) as unsigned)) from users where employee_id regexp '^EMP[0-9]+$'", nativeQuery = true)
    Integer findMaxEmployeeIdNumber();
}
