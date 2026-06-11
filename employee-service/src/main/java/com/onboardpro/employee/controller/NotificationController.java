package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.NotificationRequest;
import com.onboardpro.employee.dto.NotificationResponse;
import com.onboardpro.employee.service.NotificationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<NotificationResponse> sendNotification(@Valid @RequestBody NotificationRequest request) {
        return ApiResponse.success("Notification created", notificationService.sendNotification(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<List<NotificationResponse>> listNotifications(
            @RequestParam(required = false) Long recipientUserId,
            @RequestParam(required = false) String recipientEmail,
            @RequestParam(required = false) String recipientRole) {
        return ApiResponse.success("Notifications fetched", notificationService.listNotifications(recipientUserId, recipientEmail, recipientRole));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) {
        return ApiResponse.success("Notification marked read", notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<List<NotificationResponse>> markAllRead(
            @RequestParam(required = false) Long recipientUserId,
            @RequestParam(required = false) String recipientEmail,
            @RequestParam(required = false) String recipientRole) {
        return ApiResponse.success("Notifications marked read", notificationService.markAllRead(recipientUserId, recipientEmail, recipientRole));
    }
}
