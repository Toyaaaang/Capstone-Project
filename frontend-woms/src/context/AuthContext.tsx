"use client";
import { toast } from "sonner";
import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const role = localStorage.getItem("role");
      const isRoleConfirmed = localStorage.getItem("is_role_confirmed") === "true"; // Convert to boolean

      setUser({ ...decodedToken, role, is_role_confirmed: isRoleConfirmed });
    } catch (error) {
      console.error("Invalid token:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async ({ identifier, password }) => {
    if (!identifier || !password) {
      toast.error("Login failed", {
        description: "Username/email and password are required.",
      });
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:8000/api/authentication/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(responseData.detail || "Invalid credentials. Please try again.");
        } else if (response.status === 401) {
          throw new Error("Unauthorized access. Please check your credentials.");
        } else if (response.status === 403) {
          throw new Error("Your account has not been verified yet.");
        }
        throw new Error("Something went wrong. Please try again.");
      }
  
      // Prevent login if role is not confirmed
      if (!responseData.is_role_confirmed) {
        toast.error("Login blocked", {
          description: "Your role has not been verified by the admin. Please wait for confirmation.",
        });
        return;
      }
  
      // Proceed with login
      console.log("Login successful:", responseData);
  
      localStorage.setItem("access_token", responseData.access);
      localStorage.setItem("refresh_token", responseData.refresh);
      localStorage.setItem("role", responseData.role);
      localStorage.setItem("is_role_confirmed", JSON.stringify(responseData.is_role_confirmed));
  
      const decoded = jwtDecode(responseData.access);
      setUser({ ...decoded, role: responseData.role, is_role_confirmed: responseData.is_role_confirmed });
  
      toast.success("Login successful", {
        description: `Please wait. Redirecting to your dashboard...`,
      });
  
      const roleRoutes = {
        warehouse_admin: "/dashboard/warehouse-admin",
        warehouse_staff: "/dashboard/warehouse-staff",
        budget_analyst: "/dashboard/budget-analyst",
        engineering: "/dashboard/engineering",
        operations_maintenance: "/dashboard/operations-maintenance",
        manager: "/dashboard/manager",
        employee: "/dashboard/employee",
      };
  
      router.push(roleRoutes[responseData.role] || "/dashboard/employee");
  
    } catch (error) {
      console.error("Login failed:", error.message);
      toast.error("Login failed", { description: error.message });
    }
  };
  

  const logout = () => {
    toast.info("Logging out...", {
      description: "You will be redirected shortly.",
    });

    setTimeout(() => {
      localStorage.clear();
      setUser(null);
      router.push("/login");
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
