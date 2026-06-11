import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  AUTH_API_BASE_URL,
  clearAuthSession,
  fetchWithAuth,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  persistTokens,
  redirectToLogin,
  scheduleProactiveRefresh,
  stopProactiveRefresh,
} from "../services/authSession";

const API_BASE = AUTH_API_BASE_URL;

const AuthContext = createContext(null);

export const roleRedirects = {
  "Admin": "/admin-dashboard",
  "System Admin": "/admin-dashboard",
  "HR Manager": "/hr-dashboard",
  "HR Personnel": "/hr-dashboard",
  "HR": "/hr-dashboard",
  "Employee": "/employee-dashboard",
  "IT Manager": "/it-dashboard",
  "IT_MANAGER": "/it-dashboard",
  "it_manager": "/it-dashboard",
  "IT Administrator": "/it-dashboard",
  "IT/Admin": "/it-dashboard",
  "IT Admin": "/it-dashboard",
  "Department Manager": "/manager-dashboard",
  "Manager": "/manager-dashboard"
};

export function getDashboardRoute(role) {
  if (!role) return "/employee-dashboard";
  
  // Exact map lookup first
  if (roleRedirects[role]) return roleRedirects[role];
  
  // Normalised fallback
  const cleanRole = role.toUpperCase().replace(/[\s_\-/]/g, "");
  if (cleanRole === "ADMIN") return "/admin-dashboard";
  if (cleanRole === "ITMANAGER" || cleanRole.startsWith("IT")) return "/it-dashboard";
  if (cleanRole.includes("HR")) return "/hr-dashboard";
  if (cleanRole.includes("MANAGER")) return "/manager-dashboard";
  if (cleanRole === "EMPLOYEE" || cleanRole.includes("EMPLOYEE")) return "/employee-dashboard";
  
  return "/employee-dashboard";
}

const mapBackendToFrontendRole = (backendRole) => {
  switch (backendRole) {
    case "ADMIN": return "Admin";
    case "HR_MANAGER": return "HR Manager";
    case "DEPARTMENT_MANAGER": return "Department Manager";
    case "IT_ADMIN": return "IT Manager";
    case "EMPLOYEE": return "Employee";
    default: return "Employee";
  }
};

const mapFrontendToBackendRole = (frontendRole) => {
  switch (frontendRole) {
    case "Admin": return "ADMIN";
    case "HR Manager": return "HR_MANAGER";
    case "Department Manager": return "DEPARTMENT_MANAGER";
    case "IT Manager": return "IT_ADMIN";
    case "it_manager": return "IT_ADMIN";
    case "Employee": return "EMPLOYEE";
    default: return "EMPLOYEE";
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUser();
  });

  const [users, setUsers] = useState([]);
  const sessionRestoreStartedRef = useRef(false);

  useEffect(() => {
    if (sessionRestoreStartedRef.current) return;
    sessionRestoreStartedRef.current = true;

    const restoreSession = async () => {
      const token = getAccessToken();
      const storedUser = getStoredUser();
      if (!token || !storedUser) return;

      try {
        const response = await fetchWithAuth(`${API_BASE}/users/me`);

        if (!response.ok) {
          // If even after a refresh attempt we get a non-200, check whether
          // we still have a refresh token.  If not, the session is truly dead.
          if (!getRefreshToken()) {
            throw new Error("Session invalid and no refresh token");
          }
          // Still have a refresh token — leave the user logged-in with stored data.
          // The next API call will trigger the reactive refresh in fetchWithAuth.
          scheduleProactiveRefresh();
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          if (data.data.isActive === false) {
            throw new Error("Your account has been deactivated. Please contact IT.");
          }
          const nextUser = {
            ...storedUser,
            employeeId: data.data.employeeId,
            status: data.data.isActive === false ? "Inactive" : "Active",
          };
          localStorage.setItem("currentUser", JSON.stringify(nextUser));
          if (data.data.employeeId) {
            localStorage.setItem("userEmployeeId", data.data.employeeId);
          } else {
            localStorage.removeItem("userEmployeeId");
          }
          setCurrentUser(nextUser);
          scheduleProactiveRefresh();
        }
      } catch (error) {
        console.warn("[Auth] Session restore failed — clearing session", error);
        setCurrentUser(null);
        clearAuthSession();
        redirectToLogin();
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password.");
      }

      const { accessToken, refreshToken, userId, email: userEmail, roles } = data.data;
      const backendRole = roles && roles.length > 0 ? roles[0] : "EMPLOYEE";
      const mappedRole = mapBackendToFrontendRole(backendRole);

      const user = {
        id: userId,
        employeeId: data.data.employeeId,
        name: userEmail.split("@")[0],
        email: userEmail,
        role: mappedRole,
        status: "Active",
        token: accessToken
      };

      persistTokens({ accessToken, refreshToken });
      localStorage.setItem("userRole", mappedRole);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userEmail", user.email);
      if (user.employeeId) {
        localStorage.setItem("userEmployeeId", user.employeeId);
      } else {
        localStorage.removeItem("userEmployeeId");
      }
      localStorage.setItem("currentUser", JSON.stringify(user));

      setCurrentUser(user);
      scheduleProactiveRefresh(); // start background timer to refresh before expiry
      return user;
    } catch (error) {
      if (error.name === "TypeError" || error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Make sure the backend is running on port 8081.");
      }
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      if (!getAccessToken()) {
        throw new Error("Account creation requires an authenticated admin session.");
      }

      const backendRole = mapFrontendToBackendRole(userData.role);
      const username = userData.name || userData.email.split("@")[0];

      const response = await fetchWithAuth(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: userData.email,
          password: userData.password,
          role: backendRole
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      return data.data;
    } catch (error) {
      if (error.name === "TypeError" || error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Make sure the backend is running on port 8081.");
      }
      throw error;
    }
  };

  const refreshUsers = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await fetchWithAuth(`${API_BASE}/users`);
      const data = await response.json();
      if (response.ok && data.success) {
        const mappedUsers = data.data.map(u => ({
          id: u.id,
          employeeId: u.employeeId,
          name: u.username,
          email: u.email,
          role: u.roles && u.roles.length > 0 ? mapBackendToFrontendRole(u.roles[0]) : "Employee",
          status: u.isActive ? "Active" : "Inactive",
          createdOn: u.createdAt
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.warn("Failed to refresh users", err);
    }
  };

  const addUser = async (userData) => {
    try {
      const backendRole = mapFrontendToBackendRole(userData.role);
      const username = userData.name || userData.email.split("@")[0];

      const response = await fetchWithAuth(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: userData.email,
          password: userData.password || "demo12345",
          role: backendRole,
          sendWelcomeEmail: true
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add user.");
      }

      const normalizedEmail = userData.email.toLowerCase().trim();
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
      registeredUsers[normalizedEmail] = {
        id: data.data?.userId || userData.id,
        employeeId: data.data?.employeeId || userData.employeeId || null,
        name: userData.name || username,
        email: normalizedEmail,
        password: userData.password || "demo12345",
        role: userData.role,
        status: userData.status || "Active",
        department: userData.department || "",
        phone: userData.phone || "",
        startDate: userData.startDate || "",
        createdOn: userData.createdOn || new Date().toISOString().slice(0, 10)
      };
      localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
      localStorage.setItem("users", JSON.stringify(Object.values(registeredUsers)));
      
      await refreshUsers();
      return data.data;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (oldEmail, updatedData) => {
    try {
      const userToUpdate = users.find(u => u.email.toLowerCase() === oldEmail.toLowerCase());
      if (!userToUpdate) throw new Error("User not found.");

      if (updatedData.role && updatedData.role !== userToUpdate.role) {
        const backendRole = mapFrontendToBackendRole(updatedData.role);
        const response = await fetchWithAuth(`${API_BASE}/users/${userToUpdate.id}/role`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role: backendRole })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to update role.");
        }
      }
      
      await refreshUsers();
    } catch (error) {
      throw error;
    }
  };

  const deleteUser = async (userRef) => {
    try {
      let userId = typeof userRef === "object" ? userRef.id : userRef;
      const userEmail = typeof userRef === "object" ? userRef.email : null;

      const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "");

      if (!isUuid(userId) && userEmail) {
        const usersResponse = await fetchWithAuth(`${API_BASE}/users`);
        const usersData = await usersResponse.json().catch(() => ({}));
        if (!usersResponse.ok || usersData.success === false) {
          throw new Error(usersData.message || "Failed to delete user");
        }
        const backendUser = (usersData.data || []).find((user) => user.email?.toLowerCase() === userEmail.toLowerCase());
        userId = backendUser?.id;
      }

      if (!isUuid(userId)) {
        throw new Error("Failed to delete user");
      }

      const response = await fetchWithAuth(`${API_BASE}/users/${userId}`, {
        method: "DELETE"
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete user");
      }

      if (userEmail) {
        const normalizedEmail = userEmail.toLowerCase().trim();
        const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
        delete registeredUsers[normalizedEmail];
        localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
        localStorage.setItem("users", JSON.stringify(Object.values(registeredUsers)));
      }
      
      await refreshUsers();
      setUsers((current) => current.filter((user) => user.id !== userId && user.email?.toLowerCase() !== userEmail?.toLowerCase()));
    } catch (error) {
      console.warn("Failed to delete user", error);
      throw error;
    }
  };

  const toggleUserStatus = async (email) => {
    try {
      const userToToggle = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!userToToggle) return;

      await fetchWithAuth(`${API_BASE}/users/${userToToggle.id}/deactivate`, {
        method: "PUT"
      });
      
      await refreshUsers();
    } catch (error) {
      console.warn("Failed to toggle status", error);
    }
  };

  const logout = () => {
    const token = getAccessToken();
    if (token) {
      fetchWithAuth(`${API_BASE}/auth/logout`, {
        method: "POST"
      }).catch(err => console.warn("Logout request failed", err));
    }

    stopProactiveRefresh();
    clearAuthSession();
    setCurrentUser(null);
  };

  const isAuthenticated = !!currentUser;
  const role = currentUser ? currentUser.role : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        role,
        login,
        register,
        logout,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        refreshUsers,
        getDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
