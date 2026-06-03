import { useEffect, useState } from "react";

import { healthApi } from "packages/api/health";
import { log } from "packages/logger";

/**
 * Hook to check application health status
 * Returns maintenance state and completion status
 */
export function useHealthCheck() {
  const [maintenance, setMaintenance] = useState(false);
  const [healthCheckComplete, setHealthCheckComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    healthApi
      .get()
      .then((data) => {
        if (isMounted) {
          if (data?.status === "ok") {
            setMaintenance(false);
          } else {
            setMaintenance(true);
            log.warn("ERRORS", "/healthz returned unexpected data");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setMaintenance(true);
          log.error("ERRORS", "Error fetching /healthz", err);
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
