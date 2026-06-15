import { useEffect, useRef } from "react";

import { useQuery } from "@tanstack/react-query";

import { partnersApi } from "packages/features/partners/api/partners";
import { useActiveWorkspace } from "packages/hooks/store";
import type { Workspace } from "packages/utils/product/workspace";

export function usePartnerPlacements(
  stepId: string | undefined,
  transactionId?: string,
  workspace?: Workspace
) {
  const recordedRef = useRef<string | null>(null);
  const activeWorkspace = useActiveWorkspace();
  const resolvedWorkspace = workspace ?? activeWorkspace;

  const placementsQuery = useQuery({
    queryKey: ["partners", "placements", stepId, transactionId ?? null, resolvedWorkspace],
    queryFn: () => partnersApi.getPlacements(stepId!, resolvedWorkspace, transactionId),
    enabled: Boolean(stepId && resolvedWorkspace),
  });

  useEffect(() => {
    if (!stepId || !transactionId) return;
    const key = `${stepId}:${transactionId}`;
    if (recordedRef.current === key) return;
    recordedRef.current = key;
    void partnersApi.recordStepView(stepId, transactionId).catch(() => {
      recordedRef.current = null;
    });
  }, [stepId, transactionId]);

  return placementsQuery;
}
