import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "http://127.0.0.1:8000/api/auth"; // Change if needed

// ✅ Login API Call
export const login = async (email: string, password: string) => {
  try {
    const res = await axios.post(`${API_URL}/login/`, { email, password });
    
    // Store tokens in cookies
    Cookies.set("access", res.data.access, { expires: 1 }); // 1 day
    Cookies.set("refresh", res.data.refresh, { expires: 7 }); // 7 days
    
    return res.data;
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};

// ✅ Fetch User Details (For Role-Based Navigation)
export const getUser = async () => {
  try {
    const token = Cookies.get("access");
    if (!token) throw new Error("No token found");

    const res = await axios.get(`${API_URL}/user/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (error) {
    throw error.response?.data || "Failed to fetch user";
  }
};

// ✅ Logout API Call
export const logout = async () => {
  try {
    const refresh = Cookies.get("refresh");
    if (refresh) {
      await axios.post(`${API_URL}/logout/`, { refresh });
    }
    
    // Clear cookies
    Cookies.remove("access");
    Cookies.remove("refresh");

    return true;
  } catch (error) {
    throw error.response?.data || "Logout failed";
  }
};
