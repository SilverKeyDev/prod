import React from "react";

import type { AgentClient, AgentConversation } from "packages/api";
import { ProfileAvatar } from "packages/ui/components";
import { Box } from "packages/ui/components/structure/primitives";
import { SIDEBAR_AVATAR_WRAP } from "packages/ui/components/structure/sidebar/sidebarTheme";
import NotificationBadge from "packages/ui/components/surfaces/badge/NotificationBadge";

import { BodyText, Title } from "@/components/ui";
import {
  clientHasRequiredAction,
  getClientListActionInput,
} from "@/features/agent/utils/clientList/clientListActionPriority";
import { resolveClientAvatarUrl } from "@/features/agent/utils/clientList/resolveClientAvatarUrl";

import AgentClientListRowSubtitle from "./AgentClientListRowSubtitle";

export type AgentClientListRowProps = {
  client: AgentClient;
  conversation?: AgentConversation | null;
  selected?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** Secondary line below subtitle (message preview, email, phone). */
  detailLine?: string | null;
  /** Optional extra class for the outer row container. */
  rowClassName?: string;
  /** Card layout (dashboard) vs compact sidebar row. */
  variant?: "card" | "sidebar";
  /** When true, render only inner content (parent supplies row chrome / selection stripe). */
  embedded?: boolean;
  children?: never;
};

function avatarWrapClass(variant: "card" | "sidebar"): string {
  if (variant === "card") {
    return "h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100 sm:h-12 sm:w-12";
  }
  return SIDEBAR_AVATAR_WRAP;
}

export default function AgentClientListRow({
  client,
  conversation,
  selected = false,
  onClick,
  onKeyDown,
  detailLine,
  rowClassName = "",
  variant = "sidebar",
  embedded = false,
}: AgentClientListRowProps) {
  const avatarUrl = resolveClientAvatarUrl(client, conversation);
  const unreadCount = conversation?.unread_count ?? 0;
  const showActionDot = clientHasRequiredAction(getClientListActionInput(client, unreadCount));

  const interactive = Boolean(onClick) && !embedded;
  const baseRowClass = embedded
    ? rowClassName
    : variant === "card"
      ? `cursor-pointer transition-all ${rowClassName}`
      : `border-border group cursor-pointer border-b p-3 transition-colors hover:bg-neutral-50 ${
          selected ? "bg-olive/10 border-l-olive border-l-4" : ""
        } ${rowClassName}`;

  const inner = (
    <Box
      className={
        variant === "card"
          ? "flex flex-col gap-4 sm:flex-row sm:items-center"
          : "flex items-start gap-3"
      }
    >
      <Box className="relative flex-shrink-0">
        <Box className={avatarWrapClass(variant)}>
          <ProfileAvatar
            imageUrl={avatarUrl}
            label={client.name}
            imageClassName="h-full w-full object-cover"
          />
        </Box>
        {showActionDot ? (
          <NotificationBadge count={1} className="absolute -right-0.5 -top-0.5" />
        ) : null}
      </Box>

      <Box className="min-w-0 flex-1">
        <Title
          as="h3"
          size={variant === "card" ? "md" : "sm"}
          className={`text-text-primary truncate font-medium ${variant === "card" ? "font-semibold" : "mb-1"}`}
        >
          {client.name}
        </Title>
        <AgentClientListRowSubtitle client={client} className="mb-0.5" />
        {detailLine ? (
          <BodyText as="p" size="xs" className="text-text-secondary truncate text-xs">
            {detailLine}
          </BodyText>
        ) : null}
      </Box>
    </Box>
  );

  if (embedded) {
    return inner;
  }

  return (
    <Box
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={baseRowClass.trim()}
    >
      {inner}
    </Box>
  );
}
