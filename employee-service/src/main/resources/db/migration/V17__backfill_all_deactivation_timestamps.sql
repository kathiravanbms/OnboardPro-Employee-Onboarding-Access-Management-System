UPDATE access_deactivations
SET deactivated_at = COALESCE(deactivated_at, updated_at, created_at, CURRENT_TIMESTAMP(6))
WHERE deactivated_at IS NULL;
