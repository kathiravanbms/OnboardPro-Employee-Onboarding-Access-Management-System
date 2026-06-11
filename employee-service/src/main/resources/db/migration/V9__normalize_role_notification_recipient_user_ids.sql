UPDATE notifications
SET recipient_user_id = NULL
WHERE recipient_role <> 'Employee';
