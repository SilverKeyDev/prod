import { describe, expect, it } from "vitest";

import {
  mergeOlderLocalsWithTail,
  mergeServerMessagesPreservingTimestamp,
} from "packages/features/messaging/hooks/data/messaging/send/useMessaging.sendHelpers";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import { dateParseISO } from "packages/utils/core/date";

function msg(
  partial: Partial<ChatMessage> & Pick<ChatMessage, "id" | "content" | "role">
): ChatMessage {
  return {
    timestamp: dateParseISO("2026-01-01T12:00:00.000Z").toDate(),
    ...partial,
  };
}

describe("mergeOlderLocalsWithTail", () => {
  it("drops excluded id and prepends older locals before merged tail", () => {
    const prev: ChatMessage[] = [
      msg({
        id: "old-1",
        content: "a",
        role: "user",
        timestamp: dateParseISO("2026-01-01T11:00:00.000Z").toDate(),
      }),
      msg({
        id: "temp-1",
        content: "b",
        role: "user",
        timestamp: dateParseISO("2026-01-01T12:00:05.000Z").toDate(),
      }),
    ];
    const tail: ChatMessage[] = [
      msg({
        id: "srv-1",
        content: "b",
        role: "user",
        timestamp: dateParseISO("2026-01-01T12:00:10.000Z").toDate(),
      }),
    ];
    const out = mergeOlderLocalsWithTail(prev, "temp-1", tail);
    expect(out.map((m) => m.id)).toEqual(["old-1", "srv-1"]);
  });

  it("dedupes older locals when tail contains same ids", () => {
    const prev: ChatMessage[] = [
      msg({
        id: "dup",
        content: "x",
        role: "agent",
        timestamp: dateParseISO("2026-01-01T10:00:00.000Z").toDate(),
      }),
      msg({
        id: "temp",
        content: "y",
        role: "user",
        timestamp: dateParseISO("2026-01-01T12:00:00.000Z").toDate(),
      }),
    ];
    const tail: ChatMessage[] = [
      msg({
        id: "dup",
        content: "x",
        role: "agent",
        timestamp: dateParseISO("2026-01-01T10:00:01.000Z").toDate(),
      }),
    ];
    const out = mergeOlderLocalsWithTail(prev, "temp", tail);
    expect(out.map((m) => m.id)).toEqual(["dup"]);
  });
});

describe("mergeServerMessagesPreservingTimestamp", () => {
  it("matches optimistic row by server id after temp swap", () => {
    const serverTail: ChatMessage[] = [
      msg({
        id: "srv-99",
        content: "hello",
        role: "user",
        timestamp: dateParseISO("2026-01-01T12:00:02.000Z").toDate(),
      }),
    ];
    const tempTs = dateParseISO("2026-01-01T12:00:01.000Z").toDate();
    const merged = mergeServerMessagesPreservingTimestamp(
      serverTail,
      "srv-99",
      "hello",
      tempTs,
      "user"
    );
    expect(merged[0].timestamp.getTime()).toBe(tempTs.getTime());
  });
});
