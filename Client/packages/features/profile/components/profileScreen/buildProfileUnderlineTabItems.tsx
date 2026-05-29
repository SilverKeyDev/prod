import React from "react";

import type { ProfileSectionCompletionMap } from "packages/features/profile/types/sections/profileSections";

export type ProfileUnderlineTabStep = {
  id: string;
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

export function buildProfileUnderlineTabItems(
  steps: readonly ProfileUnderlineTabStep[],
  sectionCompletion: ProfileSectionCompletionMap
): Array<{ id: string; label: string; icon: React.ReactNode | undefined }> {
  return steps.map((step) => {
    const status = sectionCompletion[step.id as keyof ProfileSectionCompletionMap] ?? "empty";
    const isComplete = status === "complete";
    const needsAttention = status === "needs_attention";
    const icon = step.icon ? React.createElement(step.icon, { className: "h-4 w-4" }) : undefined;
    const suffix = isComplete ? " \u2713" : !isComplete && needsAttention ? " •" : "";
    return {
      id: step.id,
      label: `${step.title}${suffix}`,
      icon,
    };
  });
}
