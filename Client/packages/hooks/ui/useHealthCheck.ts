import { useState, useEffect } from "react";

/**
 * Hook to check application health status
 * Returns maintenance state and completion status
 */
export function useHealthCheck() {
  const [maintenance, setMaintenance] = useState(false);
  const [healthCheckComplete, setHealthCheckComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/healthz", { method: "GET" })
      .then((res) => {
        if (!res.ok) {
          console.error("/healthz responded with status:", res.status);
          throw new Error(`Healthz failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: unknown) => {
        if (isMounted) {
          if (
            data &&
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            (data as { status: string }).status === "ok"
          ) {
            setMaintenance(false);
          } else {
            setMaintenance(true);
            console.warn("/healthz returned unexpected data:");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setMaintenance(true);
          console.error("Error fetching /healthz:", err);
        }
      })
      .finally(() => {
        if (isMounted) setHealthCheckComplete(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { maintenance, healthCheckComplete };
}
