ALTER TABLE users
    ADD COLUMN last_login TIMESTAMP NULL AFTER created_at;
