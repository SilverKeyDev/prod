import { useCallback, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { docusignApi } from "packages/features/documents/api/docusign";
import { Button, CancelButton } from "packages/ui";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { BodyText, Input, Title } from "@/components/ui";

export type DocusignTemplateWizardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DocusignTemplateWizardModal({ isOpen, onClose }: DocusignTemplateWizardModalProps) {
  const { t } = useLocalization();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rolesRaw, setRolesRaw] = useState("Buyer, Agent");
  const [files, setFiles] = useState<File[]>([]);

  const createMutation = useMutation({
    mutationFn: () => {
      const roles = rolesRaw
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      if (!name.trim() || roles.length < 1 || files.length < 1) {
        return Promise.reject(new Error("invalid_form"));
      }
      return docusignApi.createTemplate({
        metadata: { name: name.trim(), description: description.trim() || null, roles },
        files,
      });
    },
    onSuccess: async (res) => {
      if (res.success && res.edit_url) {
        const w = getWindow();
        if (w) w.open(res.edit_url, "_blank", "noopener,noreferrer");
      }
      await qc.invalidateQueries({ queryKey: queryKeys.docusign.templates() });
      onClose();
      setName("");
      setDescription("");
      setRolesRaw("Buyer, Agent");
      setFiles([]);
    },
  });

  const onSubmit = useCallback(() => {
    createMutation.mutate();
  }, [createMutation]);

  const errMsg =
    createMutation.error instanceof Error && createMutation.error.message !== "invalid_form"
      ? createMutation.error.message
      : createMutation.error?.message === "invalid_form"
        ? t("docusign.template_wizard_error_form", {
            defaultValue: "Enter a name, at least one role, and one PDF.",
          })
        : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("docusign.template_wizard_title", { defaultValue: "New DocuSign template" })}
      size="md"
    >
      <Box className="space-y-4 py-2">
        <BodyText size="sm" muted>
          {t("docusign.template_wizard_intro", {
            defaultValue:
              "Upload one or more PDFs and name the signer roles. You will open DocuSign to place signature and form fields.",
          })}
        </BodyText>
        <Box>
          <Title as="h3" size="xs" className="mb-1">
            {t("docusign.template_wizard_name", { defaultValue: "Template name" })}
          </Title>
          <Input variant="compact" value={name} onChange={(e) => setName(e.target.value)} />
        </Box>
        <Box>
          <Title as="h3" size="xs" className="mb-1">
            {t("docusign.template_wizard_description", { defaultValue: "Description (optional)" })}
          </Title>
          <Input
            variant="compact"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
        <Box>
          <Title as="h3" size="xs" className="mb-1">
            {t("docusign.template_wizard_roles", {
              defaultValue: "Signer roles (comma-separated, order matters)",
            })}
          </Title>
          <Input variant="compact" value={rolesRaw} onChange={(e) => setRolesRaw(e.target.value)} />
        </Box>
        <Box>
          <Title as="h3" size="xs" className="mb-1">
            {t("docusign.template_wizard_pdfs", { defaultValue: "PDF documents" })}
          </Title>
          <Input
            type="file"
            accept="application/pdf"
            multiple
            className="text-sm"
            onChange={(e) => setFiles(e.target.files ? [...e.target.files] : [])}
          />
        </Box>
        {errMsg ? (
          <BodyText size="sm" className="text-destructive">
            {errMsg}
          </BodyText>
        ) : null}
        <Box className="flex justify-end gap-2 pt-2">
          <CancelButton onClick={onClose} size="md" disabled={createMutation.isPending}>
            {t("docusign.template_wizard_cancel", { defaultValue: "Cancel" })}
          </CancelButton>
          <Button variant="primary" size="md" loading={createMutation.isPending} onClick={onSubmit}>
            {t("docusign.template_wizard_submit", { defaultValue: "Create & open editor" })}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
