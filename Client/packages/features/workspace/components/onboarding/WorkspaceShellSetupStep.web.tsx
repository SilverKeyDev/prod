import Input from "@ui/form/Input";

import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Label, Title } from "@/components/ui";

import type { WorkspaceShellSetupStepProps } from "./WorkspaceShellSetupStep.types";

export function WorkspaceShellSetupStep({
  formData,
  updateFormData,
  copy,
}: WorkspaceShellSetupStepProps) {
  return (
    <Box className="px-4 pt-4 sm:px-6">
      <Title as="h2" size="lg" className="text-text-primary mb-2">
        {copy.title}
      </Title>
      <BodyText size="sm" muted className="mb-6 max-w-xl">
        {copy.subtitle}
      </BodyText>
      <Label size="sm">{copy.inputLabel}</Label>
      <Input
        value={formData.workspace_shell_test_input ?? ""}
        onChange={(event) => updateFormData("workspace_shell_test_input", event.target.value)}
        className="mt-2"
      />
    </Box>
  );
}
