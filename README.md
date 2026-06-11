# OnboardPro - Employee Onboarding and Access Management System

OnboardPro is a full-stack employee onboarding and access management platform. It combines identity management, role-based dashboards, employee onboarding workflows, access requests, IT provisioning, audit logging, notifications, and platform configuration in one system.

## Project Structure

```text
OnboardPro-Employee-Onboarding-Access-Management-System/
├── onboarding-backend/      # Auth and identity Spring Boot service
├── employee-service/        # Employee onboarding and access Spring Boot service
├── onboardingEmployee/      # React + Vite frontend application
├── start-full-stack.cmd     # Local Windows helper to start all services
├── .gitignore               # Root ignore rules for secrets/build artifacts/logs
└── README.md                # Project documentation
```

## Modules

### `onboarding-backend`

Auth and identity service running on port `8081`.

Responsibilities:

- Login, refresh token, logout, forgot password, and reset password
- JWT issuing and validation
- User and role management
- Platform settings API
- Email notification control
- Auto-assigned employee ID control

Key APIs:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/register` - admin JWT required
- `GET /api/users` - admin JWT required
- `GET /api/platform-settings` - admin JWT required
- `PUT /api/platform-settings` - admin JWT required

### `employee-service`

Employee onboarding and access management service running on port `8082`.

Responsibilities:

- Employee records
- Onboarding tasks
- Document tracking and verification
- Manager approvals
- Access request workflow
- System catalog and IT provisioning
- Notifications
- Reports
- Audit logs

All APIs in this service require a valid JWT bearer token.

### `onboardingEmployee`

React frontend running locally on port `5173`.

Main dashboards:

- System Admin dashboard
- HR dashboard
- Employee dashboard
- Department Manager dashboard
- IT dashboard

Frontend features:

- JWT login session handling
- Token refresh support
- Role-based protected routes
- Admin user management
- Platform configuration toggles
- Onboarding workflow screens
- Access request and approval screens
- Notifications and audit logs

## Security

The application uses JWT authentication across the backend services.

Public auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Everything else requires:

```http
Authorization: Bearer <access-token>
```

Admin-only actions include:

- Creating users
- Listing users
- Updating roles
- Managing platform settings

## Platform Configuration

Admins can manage platform behavior from the Settings page.

### Email Notifications

When enabled, the system can send email alerts such as onboarding welcome emails and password reset emails.

When disabled, user creation and workflows continue, but welcome emails are skipped. This is useful during demos, testing, maintenance, or SMTP outages.

### Auto-assign Employee IDs

When enabled, the auth service generates employee IDs for non-admin users, such as `EMP1001`.

When disabled, new users are created without an employee ID so the organization can assign IDs manually.

### Audit Log Retention

The UI includes an audit retention toggle. The current project keeps this setting locally unless a backend purge job is added.

## Requirements

- Java 17
- Maven or included Maven wrappers
- Node.js 18+
- MySQL 8

## Environment Variables

Create environment files locally as needed. Do not commit real `.env` files.

### Auth service

Path: `onboarding-backend/.env`

```properties
AUTH_SERVICE_DB_URL=jdbc:mysql://localhost:3306/onboardpro_auth?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
AUTH_SERVICE_DB_USERNAME=root
AUTH_SERVICE_DB_PASSWORD=your-mysql-password
ONBOARDPRO_JWT_SECRET=change-this-production-secret-key-at-least-32-bytes-long
ONBOARDPRO_JWT_ACCESS_EXPIRY=60m
ONBOARDPRO_JWT_REFRESH_EXPIRY=7d
ONBOARDPRO_MAIL_USERNAME=your-email@gmail.com
ONBOARDPRO_MAIL_PASSWORD=your-gmail-app-password
ONBOARDPRO_LOGIN_URL=http://localhost:5173/login
ONBOARDPRO_RESET_PASSWORD_URL=http://localhost:5173/reset-password
```

### Employee service

Path: `employee-service/.env`

```properties
EMPLOYEE_SERVICE_DB_URL=jdbc:mysql://localhost:3306/onboardpro_employee?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
EMPLOYEE_SERVICE_DB_USERNAME=root
EMPLOYEE_SERVICE_DB_PASSWORD=your-mysql-password
ONBOARDPRO_JWT_SECRET=change-this-production-secret-key-at-least-32-bytes-long
```

The `ONBOARDPRO_JWT_SECRET` value must match in both backend services.

## Local Setup

### 1. Start MySQL

Make sure MySQL is running. The services use Flyway migrations and can create the configured databases if allowed by the connection string.

### 2. Run the auth service

```powershell
cd onboarding-backend
.\mvnw.cmd spring-boot:run
```

Auth service URL:

```text
http://localhost:8081
```

### 3. Run the employee service

```powershell
cd employee-service
.\mvnw.cmd spring-boot:run
```

Employee service URL:

```text
http://localhost:8082
```

### 4. Run the frontend

```powershell
cd onboardingEmployee
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Build

Auth service:

```powershell
cd onboarding-backend
.\mvnw.cmd -DskipTests package
```

Employee service:

```powershell
cd employee-service
.\mvnw.cmd -DskipTests package
```

Frontend:

```powershell
cd onboardingEmployee
npm run build
```

## Deployment Notes

Before deploying:

- Replace all default secrets with environment variables.
- Configure production MySQL databases.
- Configure SMTP credentials if email notifications should be enabled.
- Set the deployed frontend URL in `ONBOARDPRO_LOGIN_URL` and `ONBOARDPRO_RESET_PASSWORD_URL`.
- Update frontend API base URLs if the backend services are not running on localhost.
- Use HTTPS in production.

## Repository

GitHub:

https://github.com/kathiravanbms/OnboardPro-Employee-Onboarding-Access-Management-System
