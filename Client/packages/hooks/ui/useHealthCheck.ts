import { useState, useEffect } from "react";

import { log, LOG_CATEGORIES } from "../../../logger";

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
          log.error(LOG_CATEGORIES.ERRORS, "/healthz responded with status", {
            status: res.status,
          });
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
            log.warn(
              LOG_CATEGORIES.ERRORS,
              "/healthz returned unexpected data",
            );
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setMaintenance(true);
          log.error(LOG_CATEGORIES.ERRORS, "Error fetching /healthz", err);
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
