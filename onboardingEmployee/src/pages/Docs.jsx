import { ArrowLeft, ArrowRight, BookOpen, FileText, Lock, Search, Shield, ShieldCheck, Sparkles, UserCheck, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const footerLinks = [
  { label: "Features", path: "/features" },
  { label: "Support", path: "/support" }
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-white">
        <Users className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="text-xl font-bold text-white">OnboardPro</span>
    </div>
  );
}

const groups = [
  {
    title: "Getting Started",
    items: [
      "what-is-onboardpro",
      "how-to-sign-up",
      "choosing-your-role",
      "first-login",
    ],
  },
  {
    title: "Employee Guide",
    items: [
      "your-dashboard",
      "onboarding-checklist",
      "uploading-documents",
      "policy-acknowledgment",
      "training-modules",
      "requesting-access",
    ],
  },
  {
    title: "HR Manager Guide",
    items: [
      "initiating-onboarding",
      "verifying-documents",
      "tracking-progress",
      "generating-reports",
    ],
  },
  {
    title: "Department Manager Guide",
    items: [
      "reviewing-access-requests",
      "approving-or-rejecting",
      "adding-remarks",
    ],
  },
  {
    title: "IT Administrator Guide",
    items: [
      "access-queue",
      "provisioning-access",
      "system-catalog",
      "deactivating-access",
    ],
  },
  {
    title: "Admin Guide",
    items: [
      "managing-users",
      "workflow-configuration",
      "access-categories",
      "audit-logs",
    ],
  },
  {
    title: "Security & Compliance",
    items: [
      "role-based-access-control",
      "audit-trail",
      "compliance-reports",
    ],
  },
];

const sections = [
  {
    id: "what-is-onboardpro",
    title: "What is OnboardPro?",
    category: "Getting Started",
    subtitle: "A single platform for employee onboarding and access management.",
    blocks: [
      {
        type: "paragraph",
        text: "OnboardPro is a web-based Employee Onboarding and Access Management System designed to streamline the onboarding of new employees and manage system access permissions. The platform brings HR, managers, IT, and employees together in one secure workspace so that every step of a hire’s first days is tracked and coordinated.",
      },
      {
        type: "heading",
        text: "Designed for cross-functional teams",
      },
      {
        type: "paragraph",
        text: "From the moment a person is hired, OnboardPro creates a shared timeline with tasks for HR, approvals for managers, and system access requests for IT. Employees see a clear checklist while stakeholders receive only the actions they need to take. That alignment reduces email, prevents delays, and helps new hires feel supported from day one.",
      },
      {
        type: "paragraph",
        text: "The system includes built-in dashboards, role-based permissions, and administrative controls that make onboarding repeatable and compliant. Each role experiences a tailored workflow without exposing unnecessary information, while the underlying platform maintains a consistent record of every action and approval.",
      },
      {
        type: "info",
        text: "OnboardPro supports 5 user roles with defined permissions and access control.",
      },
    ],
  },
  {
    id: "how-to-sign-up",
    title: "How to Sign Up",
    category: "Getting Started",
    subtitle: "Registering your account and starting your first onboarding journey.",
    blocks: [
      {
        type: "paragraph",
        text: "Signing up for OnboardPro is fast and intuitive. You begin on the homepage, provide basic company and identity information, select the role that matches your work, and create a secure password. Once registration is complete, your dashboard and available actions are configured around that role.",
      },
      {
        type: "heading",
        text: "Setup steps",
      },
      {
        type: "list",
        items: [
          "Step 1: Visit the OnboardPro homepage.",
          "Step 2: Click \"Get started free\".",
          "Step 3: Fill in your name, email, company.",
          "Step 4: Select your role from the dropdown.",
          "Step 5: Create a secure password.",
          "Step 6: Click \"Create account\".",
        ],
      },
      {
        type: "paragraph",
        text: "During signup, use a business email address and a strong password that meets your organization’s security expectations. The role you choose determines the first dashboard you see and the workflows that are available to you, so select carefully and verify your company association before continuing.",
      },
      {
        type: "warning",
        text: "Your role determines which dashboard you see. Contact your System Admin if you selected the wrong role.",
      },
    ],
  },
  {
    id: "choosing-your-role",
    title: "Choosing Your Role",
    category: "Getting Started",
    subtitle: "How role selection affects your onboarding experience.",
    blocks: [
      {
        type: "paragraph",
        text: "The role you select during signup is the foundation of your OnboardPro experience. Each role has access to a different set of tiles, workflows, approvals, and documentation. The system is designed to show the right tasks for HR, managers, IT, admins, and employees rather than a one-size-fits-all interface.",
      },
      {
        type: "heading",
        text: "Why it matters",
      },
      {
        type: "paragraph",
        text: "If you choose Employee, you will see your onboarding checklist, document upload tasks, policy acknowledgments, and access requests. HR Managers have tools for initiating onboarding, verifying documents, and measuring progress. Department Managers review access requests and add remarks, while IT Administrators provision systems and manage the access queue.",
      },
      {
        type: "paragraph",
        text: "Selecting the correct role helps ensure that sensitive access and administrative controls remain restricted to the right people. If your organization has a dedicated System Admin, they can adjust your role later if your responsibilities change or if you need broader platform permissions.",
      },
      {
        type: "code",
        text: "Role: HR Manager\nAvailable features: onboarding, documents, reports, employee status.",
      },
    ],
  },
  {
    id: "first-login",
    title: "First Login",
    category: "Getting Started",
    subtitle: "What to expect when you log in for the first time.",
    blocks: [
      {
        type: "paragraph",
        text: "After account creation, your first login takes you directly into a secure dashboard tailored to your role. The homepage summarizes pending tasks, recent notifications, and key status indicators. If you are an employee, onboarding steps appear first. If you are HR or IT, you see intake forms and pending approvals.",
      },
      {
        type: "heading",
        text: "Your first steps",
      },
      {
        type: "list",
        items: [
          "Step 1: Open the login page and enter your email.",
          "Step 2: Enter the secure password you created.",
          "Step 3: Confirm any multi-factor authentication prompt if enabled.",
          "Step 4: Review the welcome summary on your dashboard.",
          "Step 5: Click the first task or request to begin your workflow.",
        ],
      },
      {
        type: "paragraph",
        text: "OnboardPro uses secure authentication and will let you know if your session requires extra verification. If your company has enabled SSO, the first login may redirect through that provider. Once signed in, avoid sharing passwords and keep your browser session protected, especially on shared or public devices.",
      },
      {
        type: "info",
        text: "If your organization uses SSO, your first login may include a provider authorization step before your dashboard appears.",
      },
    ],
  },
  {
    id: "your-dashboard",
    title: "Your Dashboard",
    category: "Employee Guide",
    subtitle: "A central view of your onboarding progress and required actions.",
    blocks: [
      {
        type: "paragraph",
        text: "The employee dashboard is your home for every onboarding task. It shows your current checklist items, document upload status, access requests, and any notifications from HR or IT. The goal is to reduce uncertainty and keep you moving forward with clear next steps.",
      },
      {
        type: "heading",
        text: "What you will see",
      },
      {
        type: "paragraph",
        text: "Your dashboard typically begins with the most urgent items, such as missing personal details or pending policy acknowledgments. Below that, you can review open access requests, see the status of uploaded documents, and track progress through training modules. When items are complete, they are marked clearly so you know what remains.",
      },
      {
        type: "paragraph",
        text: "If HR or your manager sends you a direct message or request, it appears in the notification panel. This keeps task-related communication in one place rather than mixed into email. Your dashboard is also the starting point for any follow-up actions after the initial onboarding is complete.",
      },
      {
        type: "info",
        text: "The dashboard updates in real time as HR, managers, and IT complete approvals or verify documentation on your behalf.",
      },
    ],
  },
  {
    id: "onboarding-checklist",
    title: "Onboarding Checklist",
    category: "Employee Guide",
    subtitle: "A step-by-step guide to completing your new hire process.",
    blocks: [
      {
        type: "paragraph",
        text: "Your onboarding checklist is the spine of the employee experience in OnboardPro. It breaks the process into clearly defined steps and guides you through each requirement. The checklist is designed so the next item becomes available only when the previous one is complete, helping you focus on the right task at the right time.",
      },
      {
        type: "heading",
        text: "Checklist items",
      },
      {
        type: "list",
        items: [
          "Personal Details Submission: Fill in your contact info, DOB, address, and emergency contact.",
          "Document Upload: Upload National ID, Educational Certificate, Address Proof.",
          "Policy Acknowledgment: Read and acknowledge 3 company policies.",
          "Training Completion: Complete 3 training modules.",
        ],
      },
      {
        type: "paragraph",
        text: "As you complete each task, the system automatically unlocks the next step. This ordering ensures you do not skip a required item and helps HR verify your progress in a consistent sequence. Some items may require manager or IT action before the next step becomes available.",
      },
      {
        type: "info",
        text: "Steps must be completed in order. The next step unlocks automatically when the current one is done.",
      },
    ],
  },
  {
    id: "uploading-documents",
    title: "Uploading Documents",
    category: "Employee Guide",
    subtitle: "How to securely submit required employee files.",
    blocks: [
      {
        type: "paragraph",
        text: "Submitting documents through OnboardPro is secure and straightforward. When a document upload task appears, select the correct file type and attach the document from your device. The system supports common formats and keeps a timestamped record of every submission so HR can review and verify it quickly.",
      },
      {
        type: "heading",
        text: "Accepted documents",
      },
      {
        type: "paragraph",
        text: "Most organizations require a combination of government ID, educational certificates, and proof of address. OnboardPro tracks the exact documents requested, so you only upload what is needed. If there are extra requirements, the task will list them clearly and provide guidance on acceptable formats.",
      },
      {
        type: "warning",
        text: "Files should be uploaded in supported formats and must be legible. Poor scans or incorrect files can delay verification.",
      },
      {
        type: "code",
        text: "Accepted file names:\n- passport-id.jpg\n- degree-certificate.pdf\n- address-proof.png",
      },
    ],
  },
  {
    id: "policy-acknowledgment",
    title: "Policy Acknowledgment",
    category: "Employee Guide",
    subtitle: "Review and sign the company policies required for onboarding.",
    blocks: [
      {
        type: "paragraph",
        text: "Policy acknowledgment lets you read the company rules and confirm your agreement. OnboardPro presents policies in a clear format and records your acknowledgement with a timestamp. This is typically required before you can continue through training modules or access sensitive systems.",
      },
      {
        type: "heading",
        text: "How it works",
      },
      {
        type: "paragraph",
        text: "Each policy is displayed as a separate item with a link to read the full text. After reviewing the policy, you click the acknowledgement button and optionally add comments if your organization requests them. Once acknowledged, the status changes to complete and is visible to HR and compliance teams.",
      },
      {
        type: "info",
        text: "Acknowledging a policy does not grant immediate system access. It is a necessary step that confirms you have read the requirement and agree to follow it.",
      },
      {
        type: "paragraph",
        text: "If there are multiple policies, complete them in sequence and ensure you understand the expectations for acceptable use, security, and workplace conduct. If you need clarification, contact HR before acknowledging the policy to avoid later issues.",
      },
    ],
  },
  {
    id: "training-modules",
    title: "Training Modules",
    category: "Employee Guide",
    subtitle: "Complete required learning content as part of your onboarding.",
    blocks: [
      {
        type: "paragraph",
        text: "Training modules in OnboardPro help you get up to speed with company policies, tools, and team processes. Each module contains the material you need to review, followed by a short acknowledgement or quiz question. Completion is tracked automatically so your manager and HR can verify the learning path.",
      },
      {
        type: "heading",
        text: "What to expect",
      },
      {
        type: "paragraph",
        text: "Modules are presented as a list of items, with progress percentages shown for each one. Typical training includes security awareness, company culture, and role-specific practices. You can revisit completed modules at any time if your organization allows it, but the checklist only requires the initial completion.",
      },
      {
        type: "list",
        items: [
          "Complete 3 training modules.",
          "Review course material and key policies.",
          "Confirm completion or answer quick prompts.",
          "Monitor your dashboard for the next available task.",
        ],
      },
      {
        type: "info",
        text: "Training modules are designed to be digestible and directly relevant to your role and company culture.",
      },
    ],
  },
  {
    id: "requesting-access",
    title: "Requesting Access",
    category: "Employee Guide",
    subtitle: "How to ask for the systems and tools you need to do your job.",
    blocks: [
      {
        type: "paragraph",
        text: "Access requests allow employees to ask for the systems, applications, and hardware needed for their role. OnboardPro captures the request details, routes them through the proper approvals, and provides visibility into the status so you know when your tools are ready.",
      },
      {
        type: "heading",
        text: "Submission process",
      },
      {
        type: "paragraph",
        text: "When requesting access, select the resource category and provide a justification for why you need it. The request is then sent to your department manager for approval, and once approved it reaches IT for provisioning. Each stage is tracked so you can see if the request is pending, approved, or rejected.",
      },
      {
        type: "warning",
        text: "Don't submit duplicate requests for the same system. If you're unsure whether access is already being provisioned, check the request history first.",
      },
      {
        type: "paragraph",
        text: "You will receive notifications when the request moves forward or if additional information is required. This reduces manual follow-up and ensures a smoother transition between employee onboarding and IT provisioning.",
      },
    ],
  },
  {
    id: "initiating-onboarding",
    title: "Initiating Onboarding",
    category: "HR Manager Guide",
    subtitle: "How HR managers start a new employee onboarding case.",
    blocks: [
      {
        type: "paragraph",
        text: "HR managers initiate onboarding by creating a new hire workflow within OnboardPro. The initiation process captures essential profile details, the employee role, and department. This sets the stage for task assignments, document requirements, and approval routing.",
      },
      {
        type: "heading",
        text: "Key initiation steps",
      },
      {
        type: "list",
        items: [
          "Open the HR dashboard and select \"New Onboarding\".",
          "Enter the employee name, email, start date, and department.",
          "Choose the role or position that defines the onboarding workflow.",
          "Submit the case and confirm the checklist details.",
        ],
      },
      {
        type: "paragraph",
        text: "OnboardPro saves this information as the source of truth for the new hire. It ensures that every task and request created from that case is linked back to the same employee record so progress and approvals remain coherent throughout the process.",
      },
      {
        type: "info",
        text: "You can save a draft of the onboarding case if you need to gather more details before launching the workflow.",
      },
    ],
  },
  {
    id: "verifying-documents",
    title: "Verifying Documents",
    category: "HR Manager Guide",
    subtitle: "How HR confirms employee submissions and completes verification steps.",
    blocks: [
      {
        type: "paragraph",
        text: "Once an employee uploads documents, HR reviews them in the verification queue. The platform displays each file, the requested document type, and any previous status changes. HR can approve the document, request corrections, or reject it with a reason to keep the process transparent.",
      },
      {
        type: "heading",
        text: "Review workflow",
      },
      {
        type: "paragraph",
        text: "HR should verify that the document is complete, legible, and matches the employee’s submitted details. For example, an ID must show a clear name and date of birth, while a certificate should show the issuing institution and qualification. If the document does not meet standards, request a new upload instead of approving it.",
      },
      {
        type: "warning",
        text: "Reject documents with a clear explanation so the employee can correct the submission without confusion.",
      },
      {
        type: "paragraph",
        text: "Approving documents updates the employee’s onboarding progress and triggers any subsequent tasks that depend on verification. This keeps the workflow moving and provides a clear audit trail for compliance review.",
      },
    ],
  },
  {
    id: "tracking-progress",
    title: "Tracking Progress",
    category: "HR Manager Guide",
    subtitle: "How HR monitors onboarding completion across new hires.",
    blocks: [
      {
        type: "paragraph",
        text: "The HR dashboard provides a consolidated view of every active onboarding case, showing status indicators, completion percentages, and pending actions. Tracking progress at a glance helps HR identify which new hires need follow-up or where a bottleneck exists in the workflow.",
      },
      {
        type: "heading",
        text: "What to monitor",
      },
      {
        type: "paragraph",
        text: "Focus on tasks that are overdue, documents that are awaiting verification, and requests that are still waiting for manager approval. The platform highlights these items and allows HR to drill into any case for more detail. This prevents small issues from becoming larger delays.",
      },
      {
        type: "list",
        items: [
          "Review onboarding completion percentages.",
          "Check pending document verifications.",
          "Monitor approval requests and response times.",
          "Follow up on overdue employee tasks.",
        ],
      },
      {
        type: "info",
        text: "The progress tracker is updated in real time, so HR always sees the current state of each onboarding case.",
      },
    ],
  },
  {
    id: "generating-reports",
    title: "Generating Reports",
    category: "HR Manager Guide",
    subtitle: "How to export onboarding and compliance information.",
    blocks: [
      {
        type: "paragraph",
        text: "OnboardPro lets HR generate standard reports for onboarding completion, document verification, and role assignments. Reports can be filtered by department, hire date, or workflow stage, and then exported for review, leadership updates, or audit preparation.",
      },
      {
        type: "heading",
        text: "Report types",
      },
      {
        type: "list",
        items: [
          "Onboarding completion status across teams.",
          "Document verification outcomes and timing.",
          "Policy acknowledgement summaries.",
          "Access requests and approval turnaround.",
        ],
      },
      {
        type: "paragraph",
        text: "Reports are built to help HR demonstrate compliance and to identify training gaps or process improvements. You can schedule report generation periodically or run a one-time export when preparing for a review or executive briefing.",
      },
      {
        type: "info",
        text: "Exported reports are available in common formats so you can share them securely with stakeholders outside the platform.",
      },
    ],
  },
  {
    id: "reviewing-access-requests",
    title: "Reviewing Access Requests",
    category: "Department Manager Guide",
    subtitle: "How managers evaluate and approve employee access needs.",
    blocks: [
      {
        type: "paragraph",
        text: "Department managers are responsible for reviewing access requests submitted by employees. OnboardPro presents each request with the requested resource, justification, and employee role. This enables a fast decision while ensuring the request aligns with departmental needs and security policies.",
      },
      {
        type: "heading",
        text: "Decision criteria",
      },
      {
        type: "paragraph",
        text: "When reviewing access requests, consider whether the requested access is required for the employee’s role, whether the requested systems are already provisioned, and whether the request follows your team’s internal standards. If the access level is too broad, discuss a narrower alternative with IT.",
      },
      {
        type: "list",
        items: [
          "Verify the requested resource is role-appropriate.",
          "Confirm the employee has completed prerequisite onboarding tasks.",
          "Check the requested start date and urgency.",
          "Validate the justification before approving.",
        ],
      },
      {
        type: "info",
        text: "The manager review step is a critical gate for keeping access aligned with business requirements and reducing excessive permissions.",
      },
    ],
  },
  {
    id: "approving-or-rejecting",
    title: "Approving or Rejecting",
    category: "Department Manager Guide",
    subtitle: "How to make a decision and record your rationale.",
    blocks: [
      {
        type: "paragraph",
        text: "When an access request arrives, managers can approve it, reject it, or ask for more information. Approving sends the request to IT for provisioning, while rejecting returns it to the requester with a required reason. Keeping the decision process transparent helps employees understand the next steps.",
      },
      {
        type: "heading",
        text: "Best practices",
      },
      {
        type: "paragraph",
        text: "Approve requests that clearly support the employee’s role and workflow. Reject requests that are unnecessary, overly broad, or inconsistent with team policies. If the request requires clarification, use the remarks field to explain what information is missing or what alternative access might work better.",
      },
      {
        type: "warning",
        text: "Avoid blanket approvals for broad access permissions. Approve only what is necessary and appropriate for the employee's responsibilities.",
      },
      {
        type: "paragraph",
        text: "When you reject a request, provide a concise explanation so the employee can revise it correctly. If you approve it, the system automatically includes your decision in the audit log and routes the request to IT for fulfillment.",
      },
    ],
  },
  {
    id: "adding-remarks",
    title: "Adding Remarks",
    category: "Department Manager Guide",
    subtitle: "How notes improve handoffs between managers, HR, and IT.",
    blocks: [
      {
        type: "paragraph",
        text: "Remarks provide context for approvals, rejections, and follow-up actions. When you add remarks to a request, the message is stored with the request history, giving HR and IT insight into why a decision was made and how to proceed.",
      },
      {
        type: "heading",
        text: "When to add remarks",
      },
      {
        type: "paragraph",
        text: "Use remarks whenever a request deviates from the normal path, when an employee needs additional instruction, or when IT should provision an unusual configuration. Remarks are especially valuable for capturing edge cases, special accommodations, or temporary access requirements.",
      },
      {
        type: "info",
        text: "Clear remarks reduce back-and-forth and help every stakeholder understand the request without chasing additional details.",
      },
      {
        type: "paragraph",
        text: "Your remarks appear in the request timeline, so future reviewers can see past decisions. This is helpful during audits, handoffs, and transfer cases where another manager or administrator may need to understand the original rationale.",
      },
    ],
  },
  {
    id: "access-queue",
    title: "Access Queue",
    category: "IT Administrator Guide",
    subtitle: "Where IT sees pending access provisioning requests.",
    blocks: [
      {
        type: "paragraph",
        text: "The access queue is the IT administrator’s command center for provisioning work. It lists requests that have been approved by managers and are ready for fulfillment. Each request includes the requested resource, employee details, approval history, and any remarks from managers or HR.",
      },
      {
        type: "heading",
        text: "Queue management",
      },
      {
        type: "paragraph",
        text: "IT teams can sort and filter the queue by priority, request type, department, or due date. This makes it easy to work in batches or handle urgent requests first. Requests that require additional verification can be flagged and returned with a note rather than silently delayed.",
      },
      {
        type: "list",
        items: [
          "Review the request details and approval history.",
          "Confirm the requested system or access category.",
          "Provision the access or return with a question.",
          "Update the request status when complete.",
        ],
      },
      {
        type: "info",
        text: "The access queue helps IT focus on work that has already passed manager review, reducing rework and ensuring prompt delivery.",
      },
    ],
  },
  {
    id: "provisioning-access",
    title: "Provisioning Access",
    category: "IT Administrator Guide",
    subtitle: "How IT fulfills approved requests and provides credentials.",
    blocks: [
      {
        type: "paragraph",
        text: "Provisioning access means activating the requested systems and delivering credentials to the employee when required. OnboardPro tracks the provisioning step and updates the request status so the employee and manager know when the resource is ready.",
      },
      {
        type: "heading",
        text: "Provisioning workflow",
      },
      {
        type: "paragraph",
        text: "IT administrators review the approved request, assign the correct access group or role, and set up credentials if needed. After provisioning, the status changes to complete and the employee is notified. For certain systems, the platform can also create a secure record of the credential or account name created.",
      },
      {
        type: "code",
        text: "Provisioning example:\n- Employee: Maya Johnson\n- Resource: CRM application\n- Access level: Read / Write\n- Provisioned account: maya.johnson@company.com",
      },
      {
        type: "info",
        text: "Provisioning decisions should follow the approved request and avoid giving broader permissions than necessary.",
      },
    ],
  },
  {
    id: "system-catalog",
    title: "System Catalog",
    category: "IT Administrator Guide",
    subtitle: "A central inventory of applications and access categories.",
    blocks: [
      {
        type: "paragraph",
        text: "The system catalog lists every resource that can be requested through OnboardPro. It includes categories such as email, collaboration tools, internal applications, and physical hardware. Each catalog item is tagged with the required approval path, access level, and owning team.",
      },
      {
        type: "heading",
        text: "Catalog management",
      },
      {
        type: "paragraph",
        text: "IT administrators can add, edit, or retire catalog items as the organization changes. Catalog entries should be kept up to date so employees request the correct systems and managers understand the access being approved. Clear descriptions and categories help reduce mistaken requests.",
      },
      {
        type: "info",
        text: "A clean catalog improves request accuracy and helps managers make better approval decisions.",
      },
      {
        type: "paragraph",
        text: "The catalog is also where access categories are defined, such as Public, Internal, Confidential, and Restricted. These categories determine approval requirements and can be used to enforce least-privilege access across the platform.",
      },
    ],
  },
  {
    id: "deactivating-access",
    title: "Deactivating Access",
    category: "IT Administrator Guide",
    subtitle: "How IT handles access removal when employees exit or change roles.",
    blocks: [
      {
        type: "paragraph",
        text: "Deactivating access is a critical part of the employee offboarding process. OnboardPro captures deactivation requests and links them to the employee record so IT can remove credentials, revoke system roles, and close accounts in a controlled way.",
      },
      {
        type: "heading",
        text: "Offboarding steps",
      },
      {
        type: "paragraph",
        text: "When an employee leaves, IT reviews the active access list and deactivates systems based on the offboarding checklist. This can include email, collaboration tools, internal apps, and physical badge access. The system logs every deactivation for audit purposes.",
      },
      {
        type: "warning",
        text: "Deactivations should be completed promptly to avoid orphaned accounts and unauthorized access.",
      },
      {
        type: "paragraph",
        text: "OnboardPro makes it easy to generate a bulk deactivation workflow for a departing employee, ensuring no required system is missed. The platform also records who completed the deactivation and when it occurred.",
      },
    ],
  },
  {
    id: "managing-users",
    title: "Managing Users",
    category: "Admin Guide",
    subtitle: "How admins control account creation, roles, and lifecycle settings.",
    blocks: [
      {
        type: "paragraph",
        text: "Admins manage the user base for the entire OnboardPro environment. This includes creating accounts, assigning roles, updating employment status, and removing access when necessary. The user management interface provides a complete view of every active account and role assignment.",
      },
      {
        type: "heading",
        text: "Key controls",
      },
      {
        type: "paragraph",
        text: "Admins can change a user’s role if their responsibilities shift, disable accounts for inactive employees, and review profile details at any time. These controls help maintain security and ensure employees only see what is relevant to them.",
      },
      {
        type: "info",
        text: "User management is the foundation of a secure onboarding platform, and admin actions should be audited carefully.",
      },
      {
        type: "paragraph",
        text: "The admin interface also allows bulk updates for large teams, such as activating a new cohort of hires or deactivating a group of contractors. Each change is tracked so the organization can understand who made the update and why.",
      },
    ],
  },
  {
    id: "workflow-configuration",
    title: "Workflow Configuration",
    category: "Admin Guide",
    subtitle: "How admins define the sequence of onboarding steps.",
    blocks: [
      {
        type: "paragraph",
        text: "Workflow configuration enables admins to adjust the onboarding path to fit the organization’s needs. You can add or remove steps, change approval chains, and define which tasks must be completed before others. This flexibility makes onboarding adaptable to different departments and roles.",
      },
      {
        type: "heading",
        text: "Configuration tips",
      },
      {
        type: "paragraph",
        text: "Start with a standard workflow and then customize steps for specific teams. For example, sales hires may need CRM access sooner, while technical roles may require additional security training. When you change the workflow, the platform applies the new sequence to future cases without impacting active onboardings.",
      },
      {
        type: "info",
        text: "Workflows are versioned, so you can review past configurations and understand how onboarding has evolved over time.",
      },
      {
        type: "paragraph",
        text: "Clear workflow configuration reduces confusion across HR, managers, and IT because everyone works from the same plan. It also makes it easier to onboard new hires consistently and avoid skipped requirements.",
      },
    ],
  },
  {
    id: "access-categories",
    title: "Access Categories",
    category: "Admin Guide",
    subtitle: "How to define permission groups and access levels.",
    blocks: [
      {
        type: "paragraph",
        text: "Access categories help admins organize resources by sensitivity and approval needs. Categories such as Public, Internal, Confidential, and Restricted indicate how sensitive a system is and who should be able to request it. This makes approval decisions faster and more consistent.",
      },
      {
        type: "heading",
        text: "Category design",
      },
      {
        type: "paragraph",
        text: "When defining categories, include clear descriptions and the expected review path. For example, Restricted access may require executive approval, while Internal access may only require a department manager’s signoff. This structure ensures access is granted according to company policy.",
      },
      {
        type: "code",
        text: "Category examples:\n- Public: general tools\n- Internal: department systems\n- Confidential: sensitive data\n- Restricted: high-risk access",
      },
      {
        type: "info",
        text: "Access categories are part of the security model and should be reviewed regularly as systems and business needs change.",
      },
    ],
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    category: "Admin Guide",
    subtitle: "How administrators use logs for governance and review.",
    blocks: [
      {
        type: "paragraph",
        text: "Audit logs provide a complete record of every meaningful action taken in OnboardPro. This includes account creation, role changes, document approvals, access provisioning, and deactivation events. Logs are essential for governance, compliance, and incident response.",
      },
      {
        type: "heading",
        text: "Reviewing logs",
      },
      {
        type: "paragraph",
        text: "Admins can filter logs by user, action type, date range, and affected resource. This makes it possible to answer questions like who approved a request, when a document was verified, or which admin deactivated an account. The logs are tamper-evident and preserved for compliance purposes.",
      },
      {
        type: "info",
        text: "Use audit logs when preparing for audits or investigating unusual access patterns.",
      },
      {
        type: "paragraph",
        text: "Because audit logs capture both successful and rejected actions, they also help administrators identify process issues and training opportunities. When log entries are complete and clear, cross-team collaboration becomes more reliable.",
      },
    ],
  },
  {
    id: "role-based-access-control",
    title: "Role-Based Access Control",
    category: "Security & Compliance",
    subtitle: "How RBAC enforces permissions across OnboardPro.",
    blocks: [
      {
        type: "paragraph",
        text: "Role-Based Access Control (RBAC) is the security model used by OnboardPro to ensure users only see the features and data they need. Each role is assigned a set of permissions, and access to onboarding workflows, documents, approvals, and admin controls is granted based on that role.",
      },
      {
        type: "heading",
        text: "Why RBAC matters",
      },
      {
        type: "paragraph",
        text: "RBAC reduces the risk of accidental exposure because it prevents non-essential users from accessing sensitive information. For example, employees do not see the HR management tools, and managers do not see full administrative settings. This separation supports both security and usability.",
      },
      {
        type: "info",
        text: "RBAC is a core compliance control that helps organizations demonstrate least privilege across onboarding and access workflows.",
      },
      {
        type: "paragraph",
        text: "Admins can review and update role permissions whenever policies change. This means the security posture can evolve without disrupting employee or manager workflows, while still maintaining consistent enforcement across the platform.",
      },
    ],
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    category: "Security & Compliance",
    subtitle: "How OnboardPro preserves every action for accountability.",
    blocks: [
      {
        type: "paragraph",
        text: "The audit trail captures every change made in the platform, including approvals, document verifications, access requests, and configuration updates. Each entry records who completed the action and when, providing a reliable history for compliance and operational review.",
      },
      {
        type: "heading",
        text: "What is tracked",
      },
      {
        type: "paragraph",
        text: "OnboardPro tracks both successful and rejected actions. This includes onboarding milestone completion, access request approvals or rejections, user role changes, and deactivation events. The detailed trail helps stakeholders understand the full lifecycle of a hire and any related access decisions.",
      },
      {
        type: "warning",
        text: "Audit trails should be treated as authoritative records. Do not edit or remove entries unless your organization has a documented change control process.",
      },
      {
        type: "paragraph",
        text: "Because the audit trail is integrated across HR, manager, IT, and admin workflows, it becomes a single source of truth for reviews, audits, and internal investigations. This improves trust in the platform and reduces the need for manual log reconciliation.",
      },
    ],
  },
  {
    id: "compliance-reports",
    title: "Compliance Reports",
    category: "Security & Compliance",
    subtitle: "How to generate reports for audits and internal inspections.",
    blocks: [
      {
        type: "paragraph",
        text: "Compliance reports in OnboardPro are built to support audits and regulatory reviews. They summarize onboarding completion, access approvals, role assignments, and document verification status. Reports can be generated on demand or exported for stakeholders outside the platform.",
      },
      {
        type: "heading",
        text: "Report capabilities",
      },
      {
        type: "paragraph",
        text: "You can produce reports filtered by department, hire date range, workflow status, and access category. This enables precise analysis of compliance posture and helps identify areas where onboarding or access controls need improvement.",
      },
      {
        type: "info",
        text: "Compliance reports are especially helpful when preparing for external audits or internal policy reviews.",
      },
      {
        type: "paragraph",
        text: "By combining audit data with onboarding progress and access approvals, these reports give a complete picture of how your organization is enforcing access policies and completing required new hire tasks.",
      },
    ],
  },
];

function SidebarLink({ title, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`docs-sidebar-link w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
        isActive ? "bg-[#1E2030] text-[#6366F1]" : "text-[#94A3B8] hover:bg-[#1E2030] hover:text-[#F8FAFC]"
      } ${isActive ? "is-active" : ""}`}
    >
      {title}
    </button>
  );
}

function ContentBlock({ block }) {
  if (block.type === "heading") {
    return (
      <h2 className="mt-10 scroll-mt-24 text-2xl font-semibold text-[#EC4899]" id={block.id || undefined}>
        {block.text}
      </h2>
    );
  }

  if (block.type === "paragraph") {
    return <p className="mt-5 text-sm leading-8 text-[#CBD5E1]">{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ol className="mt-5 space-y-3 rounded-3xl border border-[#222533] bg-[#191C26] p-5 text-sm leading-7 text-[#CBD5E1]">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/15 text-[#818CF8]">{block.ordered ? <span>{block.items.indexOf(item) + 1}</span> : "•"}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "info") {
    return (
      <div className="mt-6 rounded-3xl border border-[#6366F1]/20 bg-[#191C26] p-5 text-sm leading-7 text-[#CBD5E1]">
        <div className="mb-2 flex items-center gap-2 text-[#818CF8]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span className="font-semibold">Info</span>
        </div>
        <p>{block.text}</p>
      </div>
    );
  }

  if (block.type === "warning") {
    return (
      <div className="mt-6 rounded-3xl border border-[#F59E0B]/20 bg-[#2C1A1A]/30 p-5 text-sm leading-7 text-[#CBD5E1]">
        <div className="mb-2 flex items-center gap-2 text-[#F59E0B]">
          <Shield className="h-4 w-4" aria-hidden="true" />
          <span className="font-semibold">Warning</span>
        </div>
        <p>{block.text}</p>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="mt-6 overflow-x-auto rounded-3xl border border-[#222533] bg-[#08090C] px-5 py-4 text-sm leading-7 text-[#D1D5DB]">
        <code>{block.text}</code>
      </pre>
    );
  }

  return null;
}

export default function Docs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("what-is-onboardpro");
  const [isExiting, setIsExiting] = useState(false);

  const handleFooterNav = (e, path) => {
    e.preventDefault();
    setIsExiting(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  const sectionById = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [],
  );

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sections;
    }

    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.category.toLowerCase().includes(query) ||
        section.blocks.some(
          (block) => block.text && block.text.toLowerCase().includes(query),
        ),
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!filteredSections.find((section) => section.id === activeSectionId) && filteredSections.length > 0) {
      setActiveSectionId(filteredSections[0].id);
    }
  }, [activeSectionId, filteredSections]);

  const activeSection = sectionById.get(activeSectionId) || sections[0];
  const activeIndex = sections.findIndex((section) => section.id === activeSection.id);
  const previousSection = sections[activeIndex - 1] ?? null;
  const nextSection = sections[activeIndex + 1] ?? null;

  const filteredGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((id) => filteredSections.some((section) => section.id === id)),
  }));

  return (
    <div className={`docs-theme-page public-theme-page min-h-screen bg-[#08090C] text-[#F8FAFC] transition-opacity duration-500 ease-in-out ${isExiting ? "opacity-0" : "opacity-100"}`}>
      <nav className="sticky top-0 z-50 border-b border-[#222533] bg-[#13151D]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/features"
              className="text-sm font-semibold text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              Features
            </Link>
            <Link
              to="/docs"
              className="text-sm font-semibold text-[#6366F1] border-b-2 border-[#6366F1] pb-0.5"
            >
              Docs
            </Link>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-md border border-[#222533] bg-[#13151D] px-4 py-2 text-sm font-semibold text-[#94A3B8] transition hover:border-[#6366F1] hover:text-[#6366F1]"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8">
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <div className="mb-6 rounded-3xl border border-[#222533] bg-[#13151D] p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.7)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#EC4899]">Search docs</p>
              <label htmlFor="docs-search" className="mt-4 block text-sm font-medium text-[#CBD5E1]">
                Filter doc sections
              </label>
              <input
                id="docs-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search documentation..."
                className="mt-2 w-full rounded-2xl border border-[#222533] bg-[#191C26] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30"
              />
            </div>
            <div className="hidden lg:block rounded-3xl border border-[#222533] bg-[#13151D] p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.7)] sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#EC4899]">
                <Search className="h-4 w-4" aria-hidden="true" />
                Docs navigation
              </div>
              <div className="space-y-6">
                {filteredGroups.map((group) =>
                  group.items.length > 0 ? (
                    <div key={group.title}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#94A3B8]">
                        {group.title}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((id) => {
                          const section = sectionById.get(id);
                          return (
                            <SidebarLink
                              key={id}
                              title={section?.title || id}
                              isActive={activeSection.id === id}
                              onClick={() => setActiveSectionId(id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-8">
            <div className="block lg:hidden rounded-3xl border border-[#222533] bg-[#13151D] p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.7)] sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#EC4899]">
                <Search className="h-4 w-4" aria-hidden="true" />
                Docs navigation
              </div>
              <div className="space-y-4">
                {filteredGroups.map((group) =>
                  group.items.length > 0 ? (
                    <div key={group.title}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#94A3B8]">
                        {group.title}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((id) => {
                          const section = sectionById.get(id);
                          return (
                            <SidebarLink
                              key={id}
                              title={section?.title || id}
                              isActive={activeSection.id === id}
                              onClick={() => setActiveSectionId(id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </div>

            <article className="rounded-3xl border border-[#222533] bg-[#13151D] p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.65)] sm:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#94A3B8]">
                <span>{activeSection.category}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1]" />
                <span>{activeSection.title}</span>
              </div>
              <h1 className="font-syne text-3xl font-semibold tracking-tight text-[#F8FAFC] sm:text-4xl">
                {activeSection.title}
              </h1>
              <p className="mt-3 text-sm text-[#94A3B8]">Last updated: May 2025</p>
              <div className="mt-6 h-px bg-[#222533]" />

              <div className="mt-8">
                {activeSection.blocks.map((block, index) => (
                  <ContentBlock key={`${activeSection.id}-${index}`} block={block} />
                ))}
              </div>

              <div className="mt-12 flex flex-col gap-3 border-t border-[#222533] pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={!previousSection}
                  onClick={() => previousSection && setActiveSectionId(previousSection.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#191C26] px-5 py-3 text-sm font-semibold text-[#94A3B8] transition hover:bg-[#222533] hover:text-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {previousSection ? previousSection.title : "Beginning"}
                </button>
                <button
                  type="button"
                  disabled={!nextSection}
                  onClick={() => nextSection && setActiveSectionId(nextSection.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {nextSection ? nextSection.title : "End of docs"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#222533] bg-[#08090C] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-[#94A3B8]">Modern onboarding workflows for fast-moving teams.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => handleFooterNav(e, link.path)}
                className="text-sm font-semibold text-[#94A3B8] transition hover:text-[#6366F1]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
