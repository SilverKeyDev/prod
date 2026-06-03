import {
  ADMIN_LOGGER_UI_GROUPS,
  LOGGER_CONFIG_KEY_TO_LOG_PATH,
} from "packages/logger/config/adminLoggerUiMeta.generated";
import { Box } from "packages/ui/components/primitives";

import { AccessibleCheckboxInput, BodyText, Label, Title } from "@/components/ui";

type BooleanConfigRecord = Record<string, boolean | undefined>;

type AdminLoggerCategoryGroupProps = {
  groupKey: keyof typeof ADMIN_LOGGER_UI_GROUPS;
  config: BooleanConfigRecord;
  disabled?: boolean;
  readOnlyKeys?: ReadonlySet<string>;
  isPending: boolean;
  onToggle: (configKey: string) => void;
};

export function AdminLoggerCategoryGroup({
  groupKey,
  config,
  disabled = false,
  readOnlyKeys,
  isPending,
  onToggle,
}: AdminLoggerCategoryGroupProps) {
  const group = ADMIN_LOGGER_UI_GROUPS[groupKey];

  return (
    <Box className="space-y-3">
      <Title size="sm" as="h3" className="mb-1">
        {group.title}
      </Title>
      {group.keys.map((key) => {
        const readOnly = readOnlyKeys?.has(key) ?? false;
        const label = LOGGER_CONFIG_KEY_TO_LOG_PATH[key] ?? key;
        return (
          <Label key={key} size="sm" className="flex items-center gap-2">
            <AccessibleCheckboxInput
              checked={readOnly ? true : Boolean(config[key])}
              disabled={disabled || isPending || readOnly}
              className="border-border accent-primary focus:ring-primary/30 h-4 w-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
              label={`Toggle ${label}`}
              onChange={() => onToggle(key)}
            />
            <BodyText as="span" size="sm">
              {label}
            </BodyText>
          </Label>
        );
      })}
    </Box>
  );
}
