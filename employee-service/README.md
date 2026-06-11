# OnboardPro Employee Service

Separate Spring Boot microservice for employee onboarding operations. Authentication APIs stay in the Auth Service; this service only validates JWTs issued by that service.

## Requirements

- Java 17
- MySQL 8
- Maven wrapper included

## Database

Default database:

```text
onboardpro_employee
```

The service uses Flyway and creates these tables:

- `departments`
- `employees`
- `onboarding_tasks`
- `documents`
- `approvals`
- `access_requests`
- `notifications`

## Configuration

Create `C:\Project\employee-service\.env` if you need local overrides:

```properties
EMPLOYEE_SERVICE_DB_URL=jdbc:mysql://localhost:3306/onboardpro_employee?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
EMPLOYEE_SERVICE_DB_USERNAME=root
EMPLOYEE_SERVICE_DB_PASSWORD=your-mysql-password
ONBOARDPRO_JWT_SECRET=change-this-production-secret-key-at-least-32-bytes-long
```

`ONBOARDPRO_JWT_SECRET` must match the Auth Service JWT secret.

## Run

From `C:\Project\employee-service`:

```powershell
.\mvnw.cmd spring-boot:run
```

Run with the local dev profile:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

Build:

```powershell
.\mvnw.cmd -DskipTests package
```

Run tests:

```powershell
.\mvnw.cmd test
```

## Local URLs

- Health: [http://127.0.0.1:8082/api/health](http://127.0.0.1:8082/api/health)
- Actuator Health: [http://127.0.0.1:8082/actuator/health](http://127.0.0.1:8082/actuator/health)
- Actuator Info: [http://127.0.0.1:8082/actuator/info](http://127.0.0.1:8082/actuator/info)
- Swagger: [http://127.0.0.1:8082/swagger-ui.html](http://127.0.0.1:8082/swagger-ui.html)

## JWT Usage

All business APIs require a Bearer token from the Auth Service:

```powershell
$token = "<access-token-from-auth-service>"
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8082/api/employees" `
  -Headers @{ Authorization = "Bearer $token" }
```

For local protected API testing, generate a JWT signed with the same default HMAC secret:

```powershell
$token = .\scripts\generate-local-jwt.ps1 `
  -Subject "local.hr.manager@onboardpro.test" `
  -Roles ROLE_HR_MANAGER

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8082/api/employees" `
  -Headers @{ Authorization = "Bearer $token" }
```

Generate a token for another role:

```powershell
.\scripts\generate-local-jwt.ps1 -Roles ROLE_ADMIN
.\scripts\generate-local-jwt.ps1 -Roles ROLE_DEPARTMENT_MANAGER
.\scripts\generate-local-jwt.ps1 -Roles ROLE_IT_MANAGER
.\scripts\generate-local-jwt.ps1 -Roles ROLE_EMPLOYEE
```

If you override `ONBOARDPRO_JWT_SECRET`, pass the same value to the helper:

```powershell
.\scripts\generate-local-jwt.ps1 -Secret "your-local-secret"
```

## Main API Groups

- `GET /api/health`
- `/api/employees`
- `/api/onboarding`
- `/api/onboarding/tasks`
- `/api/documents`
- `/api/approvals`
- `/api/access-requests`
- `/api/notifications`
- `/api/reports`
