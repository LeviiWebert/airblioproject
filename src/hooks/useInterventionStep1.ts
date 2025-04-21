
import { useCallback } from "react";

const STORAGE_KEY = "interventionStep1";

export function useInterventionStep1() {
  const saveStep1 = useCallback((data: any) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const getStep1 = useCallback(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  const clearStep1 = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return { saveStep1, getStep1, clearStep1 };
}
