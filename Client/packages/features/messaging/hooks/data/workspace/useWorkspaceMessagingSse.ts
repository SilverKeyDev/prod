import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getEnv } from "packages/config/env";
import { queryKeys } from "packages/config/query/keys";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { getFetch } from "packages/utils/core/platform";

function parseSseBlocks(buffer: string): { events: unknown[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: unknown[] = [];
  for (const block of parts) {
    for (const line of block.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      try {
        events.push(JSON.parse(raw) as unknown);
      } catch {
        // ignore malformed JSON
      }
    }
  }
  return { events, rest };
}

/** SSE for workspace conversations — same Redis channel as agent messaging. */
export function useWorkspaceMessagingSse(enabled: boolean): void {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !authReady || !isAuthenticated) return;

    const runId = ++runIdRef.current;
    const baseUrl = getEnv().apiBaseUrl.replace(/\/+$/, "");
    const url = `${baseUrl || ""}/api/v1/conversations/stream`;
    const fetchFn = getFetch();
    const ac = new AbortController();
    let cancelled = false;
    let retryMs = 2000;

    const run = async () => {
      while (!cancelled && runId === runIdRef.current && !ac.signal.aborted) {
        try {
          const res = await fetchFn(url, {
            method: "GET",
            headers: { Accept: "text/event-stream" },
            credentials: "include",
            signal: ac.signal,
          });
          if (!res.ok || !res.body) {
            throw new Error(`workspace_messaging_sse_http_${res.status}`);
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (!cancelled && runId === runIdRef.current && !ac.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const { events, rest } = parseSseBlocks(buf);
            buf = rest;
            for (const ev of events) {
              if (!ev || typeof ev !== "object") continue;
              const o = ev as Record<string, unknown>;
              if (o.kind === "_hello") continue;
              if (typeof o.conversation_id === "string") {
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.workspaceConversations.history(o.conversation_id),
                });
              }
              void queryClient.invalidateQueries({
                queryKey: queryKeys.workspaceConversations.all,
              });
            }
            retryMs = 2000;
          }
        } catch (e) {
          if (cancelled || ac.signal.aborted || runId !== runIdRef.current) break;
          log.warn("POLLING", "Workspace messaging SSE reconnecting", { error: String(e) });
          await new Promise((r) => setTimeout(r, retryMs));
          retryMs = Math.min(retryMs * 2, 60000);
          continue;
        }
        if (cancelled || runId !== runIdRef.current) break;
        await new Promise((r) => setTimeout(r, retryMs));
        retryMs = Math.min(retryMs * 2, 60000);
      }
    };

    void run();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [authReady, enabled, isAuthenticated, queryClient]);
}
