import { useEffect, useState } from "react";

export type Status = "empty" | "loading" | "success" | "error" | "offline";

interface StatusState<T = unknown> {
  loading?: boolean;
  error?: any;
  data?: T | null | undefined;
}

export function useStatus<T>(state: StatusState<T>): Status {
  const { loading, error, data } = state;
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (offline) return "offline";
  if (loading) return "loading";
  if (error) return "error";
  if (!data || (Array.isArray(data) && data.length === 0)) return "empty";
  return "success";
}
