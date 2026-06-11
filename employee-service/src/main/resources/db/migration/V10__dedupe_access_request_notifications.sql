ALTER TABLE notifications
  ADD COLUMN request_id BIGINT NULL AFTER recipient_user_id,
  ADD COLUMN notification_type VARCHAR(80) NULL AFTER recipient_role;

UPDATE notifications
SET notification_type = title
WHERE notification_type IS NULL;

UPDATE notifications
SET notification_type = 'ACCESS_REQUEST_SUBMITTED',
    title = 'Access Request Alert'
WHERE title IN (
  'Employee submitted access request',
  'Employee onboarding review pending',
  'Approval required'
);

UPDATE notifications
SET notification_type = 'ACCESS_REQUEST_APPROVED_FOR_IT',
    title = 'Access request approved by Manager'
WHERE title IN (
  'Access request approved by Manager',
  'New provisioning request available'
);

UPDATE notifications
SET notification_type = 'ACCESS_REQUEST_APPROVED'
WHERE title = 'Access request approved'
  AND recipient_role = 'Employee';

UPDATE notifications
SET notification_type = 'ACCESS_REQUEST_REJECTED'
WHERE title = 'Access request rejected'
  AND recipient_role = 'Employee';

UPDATE notifications
SET notification_type = 'ACCESS_PROVISIONED'
WHERE title = 'Access provisioned'
  AND recipient_role = 'Employee';

UPDATE notifications n
JOIN access_requests ar ON ar.employee_id = n.employee_id
  AND n.title IN (
    'Employee submitted access request',
    'Employee onboarding review pending',
    'Approval required',
    'Access request approved',
    'Access request rejected',
    'Access request approved by Manager',
    'New provisioning request available',
    'Access provisioned'
  )
SET n.request_id = ar.id
WHERE n.request_id IS NULL;

UPDATE notifications
SET recipient_user_id = 0
WHERE request_id IS NOT NULL
  AND recipient_user_id IS NULL
  AND recipient_role <> 'Employee';

DELETE n1 FROM notifications n1
JOIN notifications n2
  ON n1.id > n2.id
  AND COALESCE(n1.request_id, -1) = COALESCE(n2.request_id, -1)
  AND COALESCE(n1.recipient_user_id, -1) = COALESCE(n2.recipient_user_id, -1)
  AND n1.recipient_role = n2.recipient_role
  AND n1.notification_type = n2.notification_type
WHERE n1.request_id IS NOT NULL
  AND n1.notification_type IS NOT NULL;

ALTER TABLE notifications
  ADD UNIQUE KEY uk_notifications_request_recipient_type (
    request_id,
    recipient_user_id,
    recipient_role,
    notification_type
  );
