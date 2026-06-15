import { Box, Text } from "packages/ui/components/structure/primitives";
import Input from "packages/ui/components/structure/primitives/input/Input";

import type { WorkspaceShellSetupStepProps } from "./WorkspaceShellSetupStep.types";

export function WorkspaceShellSetupStep({
  formData,
  updateFormData,
  copy,
}: WorkspaceShellSetupStepProps) {
  return (
    <Box className="gap-4">
      <Text className="text-text-primary text-lg font-semibold">{copy.title}</Text>
      <Text className="text-text-secondary text-sm leading-snug">{copy.subtitle}</Text>
      <Text className="text-text-primary text-sm font-medium">{copy.inputLabel}</Text>
      <Input
        value={formData.workspace_shell_test_input ?? ""}
        onChangeText={(value) => updateFormData("workspace_shell_test_input", value)}
      />
    </Box>
  );
}
