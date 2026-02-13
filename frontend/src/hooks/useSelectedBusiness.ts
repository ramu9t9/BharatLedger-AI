import { useState, useEffect } from "react";

/**
 * Custom hook for managing selected business state
 * Persists selection to localStorage and provides easy access
 */
export function useSelectedBusiness() {
  const [selectedBusiness, setSelectedBusinessState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedBusiness") || "";
    }
    return "";
  });

  // Sync with localStorage on change
  useEffect(() => {
    localStorage.setItem("selectedBusiness", selectedBusiness);
  }, [selectedBusiness]);

  const setSelectedBusiness = (businessId: string) => {
    setSelectedBusinessState(businessId);
  };

  return {
    selectedBusiness,
    setSelectedBusiness,
  };
}
