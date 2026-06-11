from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = r"C:\Project\onboardingEmployee\Admin_Dashboard_Frontend_API_Map.pdf"


def p(text, style):
    return Paragraph(text.replace("\n", "<br/>"), style)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitlePageTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#111827"),
        spaceAfter=14,
    )
)
styles.add(
    ParagraphStyle(
        name="Subtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=18,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#312E81"),
        spaceBefore=12,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="Subsection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#374151"),
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#374151"),
    )
)
styles.add(
    ParagraphStyle(
        name="ApiCode",
        parent=styles["BodyText"],
        fontName="Courier",
        fontSize=7.6,
        leading=10,
        textColor=colors.HexColor("#111827"),
    )
)
styles.add(
    ParagraphStyle(
        name="TableHeader",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.7,
        leading=9.5,
        textColor=colors.white,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="TableCell",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.3,
        leading=9.4,
        textColor=colors.HexColor("#111827"),
    )
)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#E5E7EB"))
    canvas.line(doc.leftMargin, 0.55 * inch, A4[0] - doc.rightMargin, 0.55 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(doc.leftMargin, 0.35 * inch, "OnboardPro Admin Dashboard - Frontend Trigger to API Map")
    canvas.drawRightString(A4[0] - doc.rightMargin, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def make_table(headers, rows, widths):
    table_data = [[p(h, styles["TableHeader"]) for h in headers]]
    for row in rows:
        table_data.append([p(str(cell), styles["TableCell"]) for cell in row])

    table = Table(table_data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


trigger_rows = [
    (
        "Login page: click Sign in",
        "AuthContext.jsx -> login(email, password)",
        "POST http://localhost:8081/api/auth/login",
        "Reads users/roles. Creates or updates refresh token. Stores accessToken in localStorage.",
    ),
    (
        "Admin dashboard opens",
        "AdminDashboard.jsx -> useEffect -> refreshData(), refreshRecentUsers(), refreshAdminNotifications()",
        "GET /api/users\nGET /api/employees\nGET /api/notifications",
        "Reads auth users, employee records, and notification records for dashboard cards, recent users, and bell badge.",
    ),
    (
        "Sidebar: Dashboard",
        "AdminDashboard.jsx -> activePage = Dashboard -> refreshRecentUsers() every 15s",
        "GET http://localhost:8081/api/users\nGET http://localhost:8082/api/employees",
        "Refreshes recent users and dashboard summary data from database-backed APIs.",
    ),
    (
        "Sidebar: Users & Roles",
        "AdminDashboard.jsx -> refreshUsersPageUsers()",
        "GET http://localhost:8081/api/users\nGET http://localhost:8082/api/employees",
        "Merges authentication users with employee profile records for the table.",
    ),
    (
        "Users & Roles: search/filter role/filter status",
        "AdminDashboard.jsx -> setSearchQ(), setFilterRole(), setFilterStatus()",
        "No API",
        "Frontend-only filtering of users already loaded into React state.",
    ),
    (
        "Users & Roles: click Add User",
        "AdminDashboard.jsx -> openUserModal('add-user')",
        "No API",
        "Opens modal only. No database change until Submit.",
    ),
    (
        "Users & Roles: submit Add User form",
        "AdminDashboard.jsx -> submitUserForm() -> AuthContext.addUser()",
        "POST http://localhost:8081/api/auth/register",
        "Inserts into onboardpro_auth.users and user_role_mapping. Then refreshes user list.",
    ),
    (
        "Users & Roles: edit user and submit role change",
        "AdminDashboard.jsx -> submitUserForm() -> AuthContext.updateUser()",
        "PUT http://localhost:8081/api/users/{userId}/role",
        "Updates onboardpro_auth.user_role_mapping for that user.",
    ),
    (
        "Users & Roles: deactivate user",
        "AdminDashboard.jsx -> toggleUserStatus() -> AuthContext.toggleUserStatus()",
        "PUT http://localhost:8081/api/users/{userId}/deactivate",
        "Sets onboardpro_auth.users.is_active to false. User can no longer authenticate.",
    ),
    (
        "Users & Roles: delete user",
        "AdminDashboard.jsx -> confirmDelete('user') -> AuthContext.deleteUser()",
        "DELETE http://localhost:8081/api/users/{userId}",
        "Frontend attempts delete. If backend endpoint is unavailable, this fails. Recommended flow is deactivate.",
    ),
    (
        "Sidebar: Workflow Config",
        "AdminDashboard.jsx -> WorkflowPage",
        "No API",
        "Shows fixed frontend workflow constants. No database read/write from this Admin page.",
    ),
    (
        "Sidebar: Access Categories",
        "AdminDashboard.jsx -> refreshAccessCategories()",
        "GET http://localhost:8082/api/system-catalog\nGET http://localhost:8082/api/system-catalog/{systemId}/active-users",
        "Reads active system catalog and active provisioned users from system_catalog/access_assignments.",
    ),
    (
        "Access Categories: click Refresh",
        "AdminDashboard.jsx -> refreshAccessCategories()",
        "GET /api/system-catalog\nGET /api/system-catalog/{systemId}/active-users",
        "Reloads access category counts from backend.",
    ),
    (
        "Access Categories: View details",
        "AdminDashboard.jsx -> setSelectedAccessCategory(category)",
        "No API",
        "Opens modal with already loaded active user records.",
    ),
    (
        "Sidebar: System Catalog Approvals",
        "AdminDashboard.jsx -> refreshCatalogApprovals()",
        "GET http://localhost:8082/api/system-catalog",
        "Reads system_catalog rows with PENDING_APPROVAL, ACTIVE, APPROVED, or REJECTED status.",
    ),
    (
        "System Catalog: View Details",
        "AdminDashboard.jsx -> setSelectedCatalogApproval(catalog)",
        "No API",
        "Opens modal using row data already loaded from GET /api/system-catalog.",
    ),
    (
        "System Catalog: Approve pending request",
        "AdminDashboard.jsx -> approveCatalogRequest() -> systemCatalogService.approveSystem()",
        "PATCH http://localhost:8082/api/system-catalog/{id}/approve",
        "Updates system_catalog.status to ACTIVE, fills approved_by and approved_at, writes audit_logs, creates notification.",
    ),
    (
        "System Catalog: click Reject",
        "AdminDashboard.jsx -> setRejectCatalogTarget(catalog)",
        "No API",
        "Opens rejection modal only.",
    ),
    (
        "System Catalog: submit Reject reason",
        "AdminDashboard.jsx -> rejectCatalogRequest() -> systemCatalogService.rejectSystem()",
        "PATCH http://localhost:8082/api/system-catalog/{id}/reject",
        "Updates system_catalog.status to REJECTED, stores approved_by, approved_at, rejection_reason, writes audit_logs, creates notification.",
    ),
    (
        "Sidebar: Reports",
        "AdminDashboard.jsx -> refreshReportEmployees() on page open",
        "GET http://localhost:8082/api/employees",
        "Reads employee records for onboarding completion report.",
    ),
    (
        "Reports: Generate Onboarding Completion",
        "AdminDashboard.jsx -> generateReport('completion')",
        "GET http://localhost:8082/api/employees",
        "Reads employees and maps rows for report preview.",
    ),
    (
        "Reports: Generate Role Distribution",
        "AdminDashboard.jsx -> generateReport('role-distribution')",
        "GET http://localhost:8081/api/users",
        "Reads users and roles to calculate role distribution.",
    ),
    (
        "Reports: Export",
        "AdminDashboard.jsx -> exportReport(reportId)",
        "No direct report API in Admin component",
        "Exports frontend report data and records local activity/audit-style entry.",
    ),
    (
        "Sidebar: Audit Logs",
        "AdminDashboard.jsx -> AuditLogsPage",
        "No API in this Admin page path",
        "Admin code reads audit data from frontend data layer. Backend audit endpoints exist separately: GET/POST /api/audit-logs.",
    ),
    (
        "Audit Logs: search/filter",
        "AdminDashboard.jsx -> setAuditSearch(), setFilterAudit()",
        "No API",
        "Frontend-only filtering of loaded audit entries.",
    ),
    (
        "Notification bell or Sidebar: Notifications",
        "AdminDashboard.jsx -> refreshAdminNotifications()",
        "GET http://localhost:8082/api/notifications",
        "Reads notifications for admin scopes and updates unread badge.",
    ),
    (
        "Notifications: click one notification",
        "AdminDashboard.jsx -> markNotificationRead(id)",
        "PATCH http://localhost:8082/api/notifications/{id}/read",
        "Sets notifications.read_status=true and read_at timestamp.",
    ),
    (
        "Notifications: Mark all as read",
        "AdminDashboard.jsx -> markAllNotificationsRead()",
        "PATCH http://localhost:8082/api/notifications/read-all",
        "Marks all matching admin-scope notifications as read.",
    ),
    (
        "Sidebar: Settings",
        "AdminDashboard.jsx -> SettingsPage",
        "No API on page open",
        "Displays local profile settings, theme, password form, and platform toggles.",
    ),
    (
        "Settings: Update Profile",
        "AdminDashboard.jsx -> saveProfile()",
        "No API",
        "Stores profile name/phone in local role settings/localStorage only.",
    ),
    (
        "Settings: Theme toggle",
        "ThemeToggle.jsx / ThemeSettingsPanel",
        "No API",
        "Stores light/dark theme preference in localStorage.",
    ),
    (
        "Settings: Change Password",
        "ChangePasswordSection -> passwordChange.js -> changeCurrentUserPassword()",
        "PUT http://localhost:8081/api/users/me/password",
        "Verifies current password and updates onboardpro_auth.users.password with a secure hash.",
    ),
    (
        "Settings: platform configuration toggles",
        "AdminDashboard.jsx -> updateSetting(field)",
        "No API",
        "Saves admin UI settings to local role settings/localStorage only.",
    ),
    (
        "Settings: reset all data",
        "AdminDashboard.jsx -> resetAllData()",
        "No backend API",
        "Resets frontend data layer/local demo data and creates local activity/audit/notification entries.",
    ),
    (
        "Sidebar: Logout",
        "AdminDashboard.jsx -> logoutFromContext() -> AuthContext.logout()",
        "POST http://localhost:8081/api/auth/logout",
        "Revokes/clears auth session token server-side, clears browser localStorage, redirects to login.",
    ),
]


api_rows = [
    ("POST", "http://localhost:8081/api/auth/login", "Login user and issue JWT tokens", "Login button"),
    ("POST", "http://localhost:8081/api/auth/register", "Create auth user and role mapping", "Add User form submit"),
    ("POST", "http://localhost:8081/api/auth/logout", "End current session", "Logout button"),
    ("GET", "http://localhost:8081/api/users/me", "Restore current user/profile", "Session restore and profile menu"),
    ("PUT", "http://localhost:8081/api/users/me/password", "Change logged-in user's password", "Settings password section"),
    ("GET", "http://localhost:8081/api/users", "List auth users", "Dashboard, Users & Roles, Reports"),
    ("PUT", "http://localhost:8081/api/users/{id}/role", "Update role", "Edit user role"),
    ("PUT", "http://localhost:8081/api/users/{id}/deactivate", "Deactivate user account", "Deactivate user"),
    ("DELETE", "http://localhost:8081/api/users/{id}", "Attempted delete from frontend", "Delete user confirm"),
    ("GET", "http://localhost:8082/api/employees", "List employee profiles", "Dashboard, Users & Roles, Reports"),
    ("GET", "http://localhost:8082/api/system-catalog", "List catalog systems", "Access Categories, Catalog Approvals"),
    ("GET", "http://localhost:8082/api/system-catalog/{id}/active-users", "List active/provisioned users for a system", "Access Categories"),
    ("PATCH", "http://localhost:8082/api/system-catalog/{id}/approve", "Approve and activate catalog item", "Catalog Approve button"),
    ("PATCH", "http://localhost:8082/api/system-catalog/{id}/reject", "Reject catalog item with reason", "Catalog Reject submit"),
    ("GET", "http://localhost:8082/api/notifications", "List notifications", "Bell and Notifications page"),
    ("PATCH", "http://localhost:8082/api/notifications/{id}/read", "Mark notification read", "Click notification"),
    ("PATCH", "http://localhost:8082/api/notifications/read-all", "Mark all matching notifications read", "Mark all as read"),
    ("GET", "http://localhost:8082/api/audit-logs", "Backend audit log list endpoint exists", "Audit-related service usage"),
    ("POST", "http://localhost:8082/api/audit-logs", "Backend audit log create endpoint exists", "Audit-related service usage"),
]


db_rows = [
    ("onboardpro_auth.users", "Login, add user, deactivate user, change password", "Stores username, email, password hash, employee_id, is_active."),
    ("onboardpro_auth.roles", "Login and role mapping", "Defines ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, IT_ADMIN, EMPLOYEE."),
    ("onboardpro_auth.user_role_mapping", "Add user, change role", "Connects each user to a role."),
    ("onboardpro_auth.refresh_tokens", "Login/logout", "Stores refresh tokens and revocation/session state."),
    ("onboardpro_employee.employees", "Dashboard, Users & Roles, Reports", "Stores employee code, profile, department, onboarding status."),
    ("onboardpro_employee.system_catalog", "Access Categories, Catalog Approvals, Approve/Reject", "Stores system name, category, owner, status, approval info, rejection reason."),
    ("onboardpro_employee.access_assignments", "Access Categories active users", "Used to count/list provisioned users per catalog system."),
    ("onboardpro_employee.notifications", "Notification bell/page, catalog approve/reject", "Stores recipient, title/message, read_status, read_at."),
    ("onboardpro_employee.audit_logs", "Catalog approve/reject and other backend audit actions", "Stores actor, role, module, action, target, description, timestamp."),
]


request_rows = [
    (
        "Login",
        "POST /api/auth/login",
        '{"email":"admin@example.com","password":"password"}',
    ),
    (
        "Add User",
        "POST /api/auth/register",
        '{"username":"Name","email":"user@company.com","password":"Temp@1234","role":"EMPLOYEE","sendWelcomeEmail":true}',
    ),
    (
        "Change Role",
        "PUT /api/users/{id}/role",
        '{"role":"HR_MANAGER"}',
    ),
    (
        "Reject Catalog",
        "PATCH /api/system-catalog/{id}/reject",
        '{"reason":"Rejected by Admin"}',
    ),
    (
        "Change Password",
        "PUT /api/users/me/password",
        '{"currentPassword":"oldPassword","newPassword":"newStrongPassword1"}',
    ),
]


local_rows = [
    ("Open/close sidebar", "React state only. No API."),
    ("Search users", "React filter only. No API."),
    ("Filter role/status", "React filter only. No API."),
    ("View Details modals", "Uses already loaded row data. No API."),
    ("Workflow Config page", "Displays fixed frontend workflow constants. No API."),
    ("Audit Logs search/filter", "Frontend filtering. No API."),
    ("Theme toggle", "localStorage theme preference. No API."),
    ("Update Admin profile name/phone", "Role settings/localStorage. No API."),
    ("Platform Configuration toggles", "Role settings/localStorage. No API."),
]


story = []
story.append(Spacer(1, 0.8 * inch))
story.append(p("OnboardPro Admin Dashboard", styles["TitlePageTitle"]))
story.append(p("Frontend Click / Trigger to API Map", styles["TitlePageTitle"]))
story.append(
    p(
        "This PDF maps each Admin dashboard frontend action to the exact API endpoint used by the project, plus database impact. "
        "It is based on the current React frontend under C:\\Project\\onboardingEmployee and the Spring Boot APIs on ports 8081 and 8082.",
        styles["Subtitle"],
    )
)
story.append(Spacer(1, 0.25 * inch))
story.append(
    make_table(
        ["Service", "Base URL", "Main responsibility"],
        [
            ("Auth Identity Service", "http://localhost:8081/api", "Login, register, users, roles, password, logout"),
            ("Employee Service", "http://localhost:8082/api", "Employees, catalog, notifications, audit logs, onboarding/access data"),
        ],
        [1.4 * inch, 2.1 * inch, 3.1 * inch],
    )
)
story.append(PageBreak())

story.append(p("1. Complete Admin Click to API Map", styles["Section"]))
story.append(
    p(
        "Use this table when explaining the Admin dashboard. The Trigger column is what the user clicks or what the page lifecycle runs. "
        "Rows marked No API are frontend-only actions.",
        styles["Body"],
    )
)
story.append(
    make_table(
        ["Frontend trigger", "Frontend code/function", "API called", "Database or UI effect"],
        trigger_rows,
        [1.45 * inch, 1.75 * inch, 1.75 * inch, 2.15 * inch],
    )
)
story.append(PageBreak())

story.append(p("2. API Endpoint Summary", styles["Section"]))
story.append(
    make_table(
        ["Method", "Endpoint", "Purpose", "Admin trigger"],
        api_rows,
        [0.55 * inch, 2.35 * inch, 2.05 * inch, 1.85 * inch],
    )
)

story.append(p("3. Database Impact Summary", styles["Section"]))
story.append(
    make_table(
        ["Database table", "Admin actions that use it", "What changes or reads"],
        db_rows,
        [1.8 * inch, 2.0 * inch, 3.0 * inch],
    )
)
story.append(PageBreak())

story.append(p("4. Common Request Body Examples", styles["Section"]))
story.append(
    make_table(
        ["Action", "Endpoint", "Request body example"],
        request_rows,
        [1.15 * inch, 2.05 * inch, 3.6 * inch],
    )
)

story.append(p("5. Frontend-Only Admin Actions", styles["Section"]))
story.append(
    make_table(
        ["Frontend action", "Meaning"],
        local_rows,
        [2.0 * inch, 4.8 * inch],
    )
)

story.append(p("6. Recommended Demo Order", styles["Section"]))
demo_steps = [
    "1. Start MySQL, auth service on 8081, employee service on 8082, and frontend on 5173.",
    "2. Login as Admin. This calls POST /api/auth/login and stores the JWT token.",
    "3. Open Users & Roles. This calls GET /api/users and GET /api/employees.",
    "4. Add a test user. This calls POST /api/auth/register and inserts auth database records.",
    "5. Change the test user's role. This calls PUT /api/users/{id}/role.",
    "6. Open System Catalog Approvals. This calls GET /api/system-catalog.",
    "7. Create a pending catalog from IT Manager, then approve/reject it as Admin.",
    "8. Open Notifications and mark one/all as read. This calls PATCH notification endpoints.",
    "9. Open Settings and change password. This calls PUT /api/users/me/password.",
    "10. Logout. This calls POST /api/auth/logout and clears frontend localStorage.",
]
for step in demo_steps:
    story.append(p(step, styles["Body"]))


doc = BaseDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=0.45 * inch,
    rightMargin=0.45 * inch,
    topMargin=0.55 * inch,
    bottomMargin=0.75 * inch,
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])
doc.build(story)

print(OUTPUT)
