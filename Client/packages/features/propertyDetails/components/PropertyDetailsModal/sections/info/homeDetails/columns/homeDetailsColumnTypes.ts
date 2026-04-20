import type { ReactNode } from "react";

import type { IconName } from "packages/ui/types/icons";

export type HomeDetailsBlock = {
  id: string;
  icon: IconName;
  title: string;
  lines?: string[];
  component?: ReactNode;
};

export type HomeDetailsTranslate = (key: string, options?: Record<string, unknown>) => string;
