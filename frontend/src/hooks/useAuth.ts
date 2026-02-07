import { useCallback, useState } from "react";

const TOKEN_KEY = "token";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const setToken = useCallback((t: string | null) => {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    setTokenState(t);
  }, []);

  const logout = useCallback(() => setToken(null), [setToken]);

  return { token, setToken, logout };
}
