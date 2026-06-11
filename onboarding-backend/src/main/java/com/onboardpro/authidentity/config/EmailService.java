package com.onboardpro.authidentity.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;
    private static final String GMAIL_DAILY_LIMIT_MESSAGE = "Gmail daily sending limit exceeded for the configured sender. Use another Gmail sender/App Password or wait until Gmail resets the sending quota.";

    @Value("${app.login.url:http://localhost:5173/login}")
    private String loginUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @PostConstruct
    void logMailConfiguration() {
        log.info("SMTP username loaded: {}", mailUsername);
        log.info("SMTP password loaded: present={}, length={}, hasSpaces={}",
                mailPassword != null && !mailPassword.isBlank(),
                mailPassword == null ? 0 : mailPassword.length(),
                mailPassword != null && mailPassword.matches(".*\\s.*"));
        log.info("SMTP configured: {}", isMailConfigured());
    }

    public boolean isMailConfigured() {
        boolean configured = mailUsername != null
                && mailPassword != null
                && !mailUsername.isBlank()
                && !mailPassword.isBlank()
                && !"yourgmail@gmail.com".equalsIgnoreCase(mailUsername.trim())
                && !"your-gmail-app-password".equals(mailPassword.trim());
        log.info("Gmail SMTP configuration status: usernamePresent={}, passwordPresent={}, configured={}",
                mailUsername != null && !mailUsername.isBlank(),
                mailPassword != null && !mailPassword.isBlank(),
                configured);
        return configured;
    }

    // Sends the password reset email as an HTML message.
    public void sendResetEmail(String toEmail, String resetLink) {
        try {
            log.info("Password reset email sending started. recipient={}, sender={}", toEmail, mailUsername);
            log.info("Attempting reset email send to {}", toEmail);
            // Create a MIME email message so we can send HTML content.
            var message = javaMailSender.createMimeMessage();

            // Wrap the MIME message with a helper for subject, recipient, and body setup.
            var helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set the recipient email address.
            helper.setTo(toEmail);
            helper.setFrom(mailUsername);

            // Set the email subject shown in the user's inbox.
            helper.setSubject("Reset Password");

            // Build the HTML body with a reset-password button linked to the secure reset URL.
            String htmlBody = """
                    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202A;">
                        <p>Click the link below to reset your password.</p>
                        <p>Link is valid for 15 minutes only.</p>
                        <p>
                            <a href="%s"
                               style="display:inline-block;background:#6366F1;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:700;">
                                Reset Password
                            </a>
                        </p>
                        <p>If you did not request this ignore this email.</p>
                    </div>
                    """.formatted(resetLink);

            // Mark the body as HTML so the reset button renders correctly.
            helper.setText(htmlBody, true);

            // Send the email through the configured SMTP provider.
            javaMailSender.send(message);
            log.info("RESET EMAIL SENT SUCCESSFULLY");
            log.info("Password reset email sent successfully. recipient={}", toEmail);
        } catch (Exception ex) {
            log.error("RESET EMAIL FAILED", ex);
            log.error("Password reset email failed. recipient={}, errorType={}, message={}",
                    toEmail, ex.getClass().getName(), ex.getMessage(), ex);
            String failureMessage = resolveMailFailureMessage(ex, "Failed to send reset email");
            log.warn("Reset email delivery failure classified. recipient={}, reason={}", toEmail, failureMessage);
            // Convert mail errors into a clear application error for the controller response.
            throw new IllegalStateException(failureMessage, ex);
        }
    }

    public void sendWelcomeEmail(String toEmail, String displayName, String temporaryPassword, String role, String employeeId) {
        try {
            log.info("Welcome email sending started. recipient={}, sender={}, role={}, employeeId={}",
                    toEmail, mailUsername, role, employeeId == null ? "<none>" : employeeId);
            log.info("Attempting onboarding email send to {}", toEmail);
            var message = javaMailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");

            String safeName = HtmlUtils.htmlEscape(displayName == null || displayName.isBlank() ? toEmail : displayName);
            String safeEmail = HtmlUtils.htmlEscape(toEmail);
            String safePassword = HtmlUtils.htmlEscape(temporaryPassword);
            String safeRole = HtmlUtils.htmlEscape(role);
            String safeLoginUrl = HtmlUtils.htmlEscape(loginUrl);
            String employeeIdRow = employeeId == null || employeeId.isBlank()
                    ? ""
                    : "<p><strong>Employee ID:</strong> %s</p>".formatted(HtmlUtils.htmlEscape(employeeId));

            helper.setTo(toEmail);
            helper.setFrom(mailUsername);
            helper.setSubject("Welcome to OnboardPro");

            String htmlBody = """
                    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202A;">
                        <h2 style="margin:0 0 12px;color:#111827;">Welcome to OnboardPro, %s</h2>
                        <p>Your onboarding account has been created by your administrator.</p>
                        %s
                        <p><strong>Login email:</strong> %s</p>
                        <p><strong>Temporary password:</strong> %s</p>
                        <p><strong>Assigned role:</strong> %s</p>
                        <p>
                            <a href="%s"
                               style="display:inline-block;background:#6366F1;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:700;">
                                Log in to OnboardPro
                            </a>
                        </p>
                        <p>Please sign in with these credentials and change your password after your first login.</p>
                        <p>If you were not expecting this account, contact your administrator.</p>
                    </div>
                    """.formatted(safeName, employeeIdRow, safeEmail, safePassword, safeRole, safeLoginUrl);

            helper.setText(htmlBody, true);
            javaMailSender.send(message);
            log.info("ONBOARDING EMAIL SENT SUCCESSFULLY");
            log.info("Welcome email sent successfully. recipient={}, role={}, employeeId={}",
                    toEmail, role, employeeId == null ? "<none>" : employeeId);
        } catch (Exception ex) {
            log.error("ONBOARDING EMAIL FAILED", ex);
            log.error("Welcome email failed. recipient={}, role={}, employeeId={}, errorType={}, message={}",
                    toEmail, role, employeeId == null ? "<none>" : employeeId, ex.getClass().getName(), ex.getMessage(), ex);
            String failureMessage = resolveMailFailureMessage(ex, "Failed to send welcome email. Check Gmail SMTP configuration.");
            log.warn("Onboarding email delivery failure classified. recipient={}, reason={}", toEmail, failureMessage);
            throw new IllegalStateException(failureMessage, ex);
        }
    }

    private String resolveMailFailureMessage(Exception ex, String fallbackMessage) {
        if (hasCauseMessage(ex, "Daily user sending limit exceeded")
                || hasCauseMessage(ex, "user sending limit exceeded")
                || hasCauseMessage(ex, "550-5.4.5")) {
            return GMAIL_DAILY_LIMIT_MESSAGE;
        }
        if (hasCauseMessage(ex, "AuthenticationFailedException")
                || hasCauseMessage(ex, "Username and Password not accepted")
                || hasCauseMessage(ex, "535-5.7.8")) {
            return "Gmail SMTP authentication failed. Verify ONBOARDPRO_MAIL_USERNAME and the Gmail App Password.";
        }
        return fallbackMessage;
    }

    private boolean hasCauseMessage(Throwable throwable, String expectedText) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.toLowerCase().contains(expectedText.toLowerCase())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
