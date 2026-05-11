import { useCallback, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import { docusignApi } from "packages/features/documents/api/docusign";
import type {
  DocusignTemplateRoleMapEntry,
  SendAgreementRequest,
} from "packages/features/documents/types/docusign";
import { useAuthStore } from "packages/store";
import { Button, CancelButton } from "packages/ui";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Input, Select, Title } from "@/components/ui";

export type DocusignUseTemplateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** DocuSign template GUID */
  docusignTemplateId: string;
  templateDisplayName: string;
};

export function DocusignUseTemplateModal({
  isOpen,
  onClose,
  docusignTemplateId,
  templateDisplayName,
}: DocusignUseTemplateModalProps) {
  const { t } = useLocalization();
  const qc = useQueryClient();
  const agentUserId = useAuthStore((s) => s.user?.id ?? "");
  const agentEmail = useAuthStore((s) => s.user?.email ?? "");
  const agentName = useAuthStore((s) => s.user?.name ?? "");
  const { clients } = useAgentClients();
  const [title, setTitle] = useState("");
  const [buyerId, setBuyerId] = useState("");

  const clientOptions = useMemo(() => clients ?? [], [clients]);

  const buyerSelectOptions = useMemo(
    () =>
      clientOptions.map((c) => ({
        value: c.id,
        label: c.name ?? c.email ?? c.id,
      })),
    [clientOptions]
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!agentUserId || !buyerId || !title.trim()) {
        throw new Error("invalid");
      }
      const detail = await docusignApi.getTemplateDetail(docusignTemplateId);
      if (!detail.success || !detail.roles?.length) {
        throw new Error("template");
      }
      const rolesSorted = [...detail.roles].sort(
        (a, b) => (a.routing_order ?? 0) - (b.routing_order ?? 0)
      );
      const ca = await docusignApi.createAgreement({
        title: title.trim(),
        buyer_id: buyerId,
        agreement_type: "buyer_representation",
        docusign_source_template_id: docusignTemplateId,
      });
      if (!ca.success || !ca.agreement?.id) {
        throw new Error("create");
      }
      const agreementId = ca.agreement.id;

      const buyer = clientOptions.find((c) => c.id === buyerId);

      for (let i = 0; i < rolesSorted.length; i++) {
        const roleRow = rolesSorted[i]!;
        const uid = i === 0 ? buyerId : agentUserId;
        const email =
          i === 0 ? (buyer?.email ?? "client@example.com") : agentEmail || "agent@example.com";
        const nameStr = i === 0 ? (buyer?.name ?? "Client") : agentName || "Agent";
        await docusignApi.addAgreementParticipant(agreementId, {
          user_id: uid,
          role: "signer",
          routing_order: roleRow.routing_order ?? i + 1,
          email,
          name: nameStr,
        });
      }

      const full = await docusignApi.getAgreement(agreementId);
      const participants = full.agreement?.participants ?? [];
      const signers = participants
        .filter((p) => p.role === "signer")
        .sort((a, b) => (a.routing_order ?? 0) - (b.routing_order ?? 0));
      let templateRoleMap: DocusignTemplateRoleMapEntry[] = rolesSorted.map((r, i) => ({
        participant_id: signers[i]?.id ?? "",
        role_name: r.role_name,
      }));
      templateRoleMap = templateRoleMap.filter((m) => m.participant_id);
      const sendBody: SendAgreementRequest = { signing_method: "embedded" };
      if (rolesSorted.length > 1) {
        sendBody.template_role_map = templateRoleMap;
      }
      await docusignApi.sendAgreement(agreementId, sendBody);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.docusign.agreements() });
      onClose();
      setTitle("");
      setBuyerId("");
    },
  });

  const onSubmit = useCallback(() => {
    sendMutation.mutate();
  }, [sendMutation]);

  const errorLabel =
    sendMutation.error instanceof Error
      ? sendMutation.error.message === "invalid"
        ? t("docusign.use_template_error_form", {
            defaultValue: "Choose a client and enter a title.",
          })
        : sendMutation.error.message === "template"
          ? t("docusign.use_template_error_template", {
              defaultValue: "Could not load template roles.",
            })
          : sendMutation.error.message
      : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("docusign.use_template_title", { defaultValue: "Send from template" })}
      size="md"
    >
      <Box className="space-y-4 py-2">
        <BodyText size="sm" muted>
          {templateDisplayName}
        </BodyText>
        <Box>
          <Title as="h3" size="xs" className="mb-1">
            {t("docusign.use_template_agreement_title", { defaultValue: "Agreement title" })}
          </Title>
          <Input variant="compact" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Box>
        <Box>
          <Title as="h3" size="xs" className="mb-1">
            {t("docusign.use_template_client", { defaultValue: "Client (buyer)" })}
          </Title>
          <Select
            options={buyerSelectOptions}
            value={buyerId}
            onChange={setBuyerId}
            placeholder={t("docusign.use_template_select_client", { defaultValue: "Select…" })}
            size="md"
          />
        </Box>
        <BodyText size="xs" muted>
          {t("docusign.use_template_roles_hint", {
            defaultValue:
              "The first signer role maps to the selected client; the second (if any) maps to you. Templates with more than two signer roles require participants to be added on the agreement detail view.",
          })}
        </BodyText>
        {errorLabel ? (
          <BodyText size="sm" className="text-destructive">
            {errorLabel}
          </BodyText>
        ) : null}
        <Box className="flex justify-end gap-2 pt-2">
          <CancelButton onClick={onClose} size="md" disabled={sendMutation.isPending}>
            {t("docusign.use_template_cancel", { defaultValue: "Cancel" })}
          </CancelButton>
          <Button variant="primary" size="md" loading={sendMutation.isPending} onClick={onSubmit}>
            {t("docusign.use_template_send", { defaultValue: "Create & send" })}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
