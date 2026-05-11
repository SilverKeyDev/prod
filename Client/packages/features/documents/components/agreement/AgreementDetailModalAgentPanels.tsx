import type { Dispatch, SetStateAction } from "react";

import type { AgreementParticipant } from "packages/features/documents/types/docusign";
import { AccessibleCheckboxInput, Button, FormField, Textarea } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import Input from "packages/ui/components/primitives/input/Input";

import { BodyText, Title } from "@/components/ui";

type LocalizationT = (key: string) => string;

export function AgreementDetailSendOptionsPanel(props: {
  t: LocalizationT;
  advancedSendOpen: boolean;
  onToggleAdvanced: () => void;
  sendRemDelay: string;
  setSendRemDelay: (v: string) => void;
  sendRemFreq: string;
  setSendRemFreq: (v: string) => void;
  sendExpAfter: string;
  setSendExpAfter: (v: string) => void;
  sendExpWarn: string;
  setSendExpWarn: (v: string) => void;
}) {
  const {
    t,
    advancedSendOpen,
    onToggleAdvanced,
    sendRemDelay,
    setSendRemDelay,
    sendRemFreq,
    setSendRemFreq,
    sendExpAfter,
    setSendExpAfter,
    sendExpWarn,
    setSendExpWarn,
  } = props;

  return (
    <Box className="border-border mt-3 rounded-md border px-3 py-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-2 px-0"
        onClick={onToggleAdvanced}
      >
        {advancedSendOpen
          ? t("docusign.detail_advanced_send_hide")
          : t("docusign.detail_advanced_send_show")}
      </Button>
      {advancedSendOpen ? (
        <Box className="space-y-3">
          <Title size="sm" as="h3">
            {t("docusign.detail_advanced_send_heading")}
          </Title>
          <BodyText size="xs" muted>
            {t("docusign.detail_advanced_send_help")}
          </BodyText>
          <FormField label={t("docusign.detail_reminder_first_days")}>
            <Input
              type="number"
              min={0}
              max={999}
              inputMode="numeric"
              value={sendRemDelay}
              onChange={(e) => setSendRemDelay(e.target.value)}
            />
          </FormField>
          <FormField label={t("docusign.detail_reminder_repeat_days")}>
            <Input
              type="number"
              min={0}
              max={999}
              inputMode="numeric"
              value={sendRemFreq}
              onChange={(e) => setSendRemFreq(e.target.value)}
            />
          </FormField>
          <FormField label={t("docusign.detail_expire_after_days")}>
            <Input
              type="number"
              min={1}
              max={999}
              inputMode="numeric"
              value={sendExpAfter}
              onChange={(e) => setSendExpAfter(e.target.value)}
            />
          </FormField>
          <FormField label={t("docusign.detail_expire_warn_days")}>
            <Input
              type="number"
              min={0}
              max={999}
              inputMode="numeric"
              value={sendExpWarn}
              onChange={(e) => setSendExpWarn(e.target.value)}
            />
          </FormField>
        </Box>
      ) : null}
    </Box>
  );
}

export function AgreementDetailInFlightEnvelopePanel(props: {
  t: LocalizationT;
  pendingSigners: AgreementParticipant[];
  resendNotes: Record<string, string>;
  setResendNotes: Dispatch<SetStateAction<Record<string, string>>>;
  onResend: (participantId: string) => void;
  isResendingAgreementRecipient: boolean;
  resendingParticipantId: string | null;
  notifUseAccountDefaults: boolean;
  setNotifUseAccountDefaults: (v: boolean) => void;
  notifRemDelay: string;
  setNotifRemDelay: (v: string) => void;
  notifRemFreq: string;
  setNotifRemFreq: (v: string) => void;
  notifExpAfter: string;
  setNotifExpAfter: (v: string) => void;
  notifExpWarn: string;
  setNotifExpWarn: (v: string) => void;
  onSaveNotification: () => void;
  isUpdatingAgreementEnvelopeNotification: boolean;
}) {
  const {
    t,
    pendingSigners,
    resendNotes,
    setResendNotes,
    onResend,
    isResendingAgreementRecipient,
    resendingParticipantId,
    notifUseAccountDefaults,
    setNotifUseAccountDefaults,
    notifRemDelay,
    setNotifRemDelay,
    notifRemFreq,
    setNotifRemFreq,
    notifExpAfter,
    setNotifExpAfter,
    notifExpWarn,
    setNotifExpWarn,
    onSaveNotification,
    isUpdatingAgreementEnvelopeNotification,
  } = props;

  return (
    <>
      {pendingSigners.length ? (
        <Box className="border-border mt-3 rounded-md border px-3 py-3">
          <Title size="sm" as="h3" className="mb-2">
            {t("docusign.detail_resend_section")}
          </Title>
          <BodyText size="xs" muted className="mb-3">
            {t("docusign.detail_resend_help")}
          </BodyText>
          <Box className="space-y-4">
            {pendingSigners.map((p) => (
              <Box key={p.id} className="border-border/80 space-y-2 border-b pb-3 last:border-0">
                <BodyText size="sm" className="font-medium">
                  {p.name}
                </BodyText>
                <FormField label={t("docusign.detail_resend_note")}>
                  <Textarea
                    value={resendNotes[p.id] ?? ""}
                    onChange={(e) =>
                      setResendNotes((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </FormField>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onResend(p.id)}
                  disabled={isResendingAgreementRecipient || resendingParticipantId === p.id}
                >
                  {resendingParticipantId === p.id
                    ? t("docusign.detail_resend_sending")
                    : t("docusign.detail_resend_button")}
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box className="border-border mt-3 rounded-md border px-3 py-3">
        <Title size="sm" as="h3" className="mb-2">
          {t("docusign.detail_notification_section")}
        </Title>
        <BodyText size="xs" muted className="mb-3">
          {t("docusign.detail_notification_help")}
        </BodyText>
        <Box className="mb-3 flex items-center gap-2">
          <AccessibleCheckboxInput
            label={t("docusign.detail_use_account_defaults")}
            checked={notifUseAccountDefaults}
            onChange={(e) => setNotifUseAccountDefaults(e.target.checked)}
          />
          <BodyText as="span" size="sm">
            {t("docusign.detail_use_account_defaults")}
          </BodyText>
        </Box>
        {!notifUseAccountDefaults ? (
          <Box className="space-y-3">
            <FormField label={t("docusign.detail_reminder_first_days")}>
              <Input
                type="number"
                min={0}
                max={999}
                inputMode="numeric"
                value={notifRemDelay}
                onChange={(e) => setNotifRemDelay(e.target.value)}
              />
            </FormField>
            <FormField label={t("docusign.detail_reminder_repeat_days")}>
              <Input
                type="number"
                min={0}
                max={999}
                inputMode="numeric"
                value={notifRemFreq}
                onChange={(e) => setNotifRemFreq(e.target.value)}
              />
            </FormField>
            <FormField label={t("docusign.detail_expire_after_days")}>
              <Input
                type="number"
                min={1}
                max={999}
                inputMode="numeric"
                value={notifExpAfter}
                onChange={(e) => setNotifExpAfter(e.target.value)}
              />
            </FormField>
            <FormField label={t("docusign.detail_expire_warn_days")}>
              <Input
                type="number"
                min={0}
                max={999}
                inputMode="numeric"
                value={notifExpWarn}
                onChange={(e) => setNotifExpWarn(e.target.value)}
              />
            </FormField>
          </Box>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="mt-3"
          onClick={onSaveNotification}
          disabled={isUpdatingAgreementEnvelopeNotification}
        >
          {isUpdatingAgreementEnvelopeNotification
            ? t("docusign.detail_notification_saving")
            : t("docusign.detail_notification_save")}
        </Button>
      </Box>
    </>
  );
}
