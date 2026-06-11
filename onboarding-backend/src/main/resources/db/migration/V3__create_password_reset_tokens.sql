CREATE TABLE password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(160) NOT NULL,
    token VARCHAR(80) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_password_reset_tokens_token (token),
    INDEX idx_password_reset_tokens_email (email)
);
