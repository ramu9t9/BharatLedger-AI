import { useState, useCallback, useEffect } from "react";
import { authApi } from "@/api/client";

interface User {
  id: string;
  email: string;
  exp?: number;
}

/**
 * Decode JWT token to get payload (without verification for display purposes)
 */
function decodeJWT(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub || "",
      email: payload.email || "",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
function isTokenExpired(exp?: number): boolean {
  if (!exp) return false;
  return Date.now() >= exp * 1000;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from token on mount
  useEffect(() => {
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && !isTokenExpired(decoded.exp)) {
        setUser(decoded);
      } else {
        // Token expired or invalid - clear it
        localStorage.removeItem("token");
        setToken(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const accessToken = response.access_token;
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      
      const decoded = decodeJWT(accessToken);
      setUser(decoded ? { ...decoded, email } : { id: "", email });
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
    localStorage.removeItem("selectedBusiness");
    setToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token && !isLoading,
    isLoading,
    login,
    signup,
    logout,
  };
}
