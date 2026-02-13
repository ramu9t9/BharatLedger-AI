import { useState, useCallback, useEffect } from "react";
import { authApi } from "@/api/client";

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const accessToken = response.access_token;
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      setUser({ id: "", email }); // Will be fetched from token or session
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      await authApi.signup({ email, password, full_name: fullName });
      // Auto-login after signup
      await login(email, password);
      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      // Decode token or fetch user profile
      // For now, we'll just set a placeholder
      setUser({ id: "", email: "" });
    }
  }, [token]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    signup,
    logout,
  };
}
