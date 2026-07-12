/**
 * useAgentChatsSse — SIL-180
 *
 * SSE subscription for agent↔client messaging.
 * Connects to /api/v1/agent/chats/stream (Redis pub/sub fan-out)
 * and invalidates React Query cache when new message events arrive.
 *
 * Background: The backend already publishes to a per-user Redis channel
 * whenever a new agent message is sent or received. Without this hook,
 * the frontend had no listener — messages only appeared after manual
 * refresh or tab switch (refetchOnWindowFocus). This hook closes that gap.
 *
 * Mirrors useWorkspaceMessagingSse which does the same for workspace
 * conversations. Both use the same _messaging_sse_generator on the backend.
 *
 * TODO: If refetchInterval is ever added to useAgentChats, remove it —
 * this SSE hook makes polling redundant for real-time updates.
 */
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

/**
 * SSE subscription for agent conversations.
 * Invalidates agent conversation and history query keys on new events.
 * Call this once in the top-level messaging component when the user is
 * an agent or client with an active agent conversation.
 */
export function useAgentChatsSse(enabled: boolean): void {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !authReady || !isAuthenticated) return;

    const runId = ++runIdRef.current;
    const baseUrl = getEnv().apiBaseUrl.replace(/\/+$/, "");
    const url = `${baseUrl || ""}/api/v1/agent/chats/stream`;
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
            throw new Error(`agent_chats_sse_http_${res.status}`);
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

              // Skip the hello handshake event
              if (o.kind === "_hello") continue;

              // Invalidate the specific conversation history if we know which one
              if (typeof o.conversation_id === "string") {
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.agent.history(o.conversation_id),
                });
              }

              // Always invalidate the conversations list so unread counts update
              void queryClient.invalidateQueries({
                queryKey: queryKeys.agent.conversations(),
              });

              // Also invalidate the notification counter so the badge updates
              void queryClient.invalidateQueries({
                queryKey: queryKeys.agent.notificationCounter(),
              });
            }

            retryMs = 2000;
          }
        } catch (e) {
          if (cancelled || ac.signal.aborted || runId !== runIdRef.current) {
            break;
          }
          log.warn("POLLING", "Agent chats SSE reconnecting", {
            error: String(e),
          });
          await new Promise((r) => setTimeout(r, retryMs));
          retryMs = Math.min(retryMs * 2, 60_000);
          continue;
        }

        if (cancelled || runId !== runIdRef.current) break;
        await new Promise((r) => setTimeout(r, retryMs));
        retryMs = Math.min(retryMs * 2, 60_000);
      }
    };

    void run();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [authReady, enabled, isAuthenticated, queryClient]);
}
