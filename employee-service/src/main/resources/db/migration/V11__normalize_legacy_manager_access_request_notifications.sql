DELETE n1 FROM notifications n1
JOIN notifications n2
  ON n1.id > n2.id
  AND n1.employee_id = n2.employee_id
  AND n1.recipient_role = n2.recipient_role
  AND n1.notification_type = n2.notification_type
WHERE n1.request_id IS NULL
  AND n2.request_id IS NULL
  AND n1.notification_type = 'ACCESS_REQUEST_SUBMITTED';

DELETE n1 FROM notifications n1
JOIN access_requests ar ON ar.employee_id = n1.employee_id
JOIN notifications n2
  ON n2.request_id = ar.id
  AND n2.recipient_user_id = 0
  AND n2.recipient_role = n1.recipient_role
  AND n2.notification_type = n1.notification_type
WHERE n1.request_id IS NULL
  AND n1.notification_type = 'ACCESS_REQUEST_SUBMITTED';

UPDATE notifications n
JOIN access_requests ar ON ar.employee_id = n.employee_id
SET n.request_id = ar.id,
    n.recipient_user_id = 0
WHERE n.request_id IS NULL
  AND n.notification_type = 'ACCESS_REQUEST_SUBMITTED'
  AND n.recipient_role = 'Department Manager';
