import { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import type {
  ChecklistStepOption,
  Partner,
  PartnerCreateRequest,
} from "packages/features/partners/api/partners";
import { ChecklistStepPicker } from "packages/features/partners/components/admin/ChecklistStepPicker";
import { PartnerLogoUpload } from "packages/features/partners/components/admin/PartnerLogoUpload";
import { PartnerIntegrationExperience } from "packages/features/partners/components/PartnerIntegrationExperience";
import {
  DEFAULT_PARTNER_INTEGRATION_DISPLAY_MODE,
  type PartnerIntegrationDisplayMode,
  partnerShowsIframe,
} from "packages/features/partners/types/integrationDisplay";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Label from "packages/ui/components/text/Label";
import Title from "packages/ui/components/text/Title";
import { interpolateDestinationUrl } from "packages/utils/revShare/interpolateDestinationUrl";
import { ALL_WORKSPACES, type Workspace } from "packages/utils/workspace";
import { workspaceSwitcherLabelKey } from "packages/utils/workspace/workspaceNavConfig";

import { Button, Dropdown, Input } from "@/components/ui";
import OptionTagInput from "@/features/profile/components/settings/inputs/tags/OptionTagInput.web";

const CHECKLIST_ROLES: Workspace[] = ["buyer", "seller"];

const PAYOUT_TYPE_OPTIONS = [
  { value: "on_click" as const, labelKey: "partners.admin.form.payout_type.on_click" },
  { value: "on_close" as const, labelKey: "partners.admin.form.payout_type.on_close" },
];

const INTEGRATION_DISPLAY_OPTIONS = [
  {
    value: "iframe_and_link" as const,
    labelKey: "partners.admin.form.integration_display_mode.iframe_and_link",
  },
  {
    value: "link_only" as const,
    labelKey: "partners.admin.form.integration_display_mode.link_only",
  },
];

type AdminPartnerFormProps = {
  initial: PartnerCreateRequest | Partner;
  steps: ChecklistStepOption[];
  partnerId?: string;
  isEdit?: boolean;
  onCancel: () => void;
  onSubmit: (body: PartnerCreateRequest) => Promise<void>;
  onPendingLogoFile?: (file: File | null) => void;
};

function initialFormState(initial: PartnerCreateRequest | Partner): PartnerCreateRequest {
  const partner = initial as Partner;
  return {
    name: initial.name,
    slug: initial.slug,
    destination_url_template: initial.destination_url_template,
    description: initial.description ?? undefined,
    target_roles: partner.target_roles?.length ? [...partner.target_roles] : ["buyer"],
    step_ids: partner.step_ids?.length
      ? [...partner.step_ids]
      : partner.step_id
        ? [partner.step_id]
        : [],
    payout_type: partner.payout_type ?? "on_click",
    payout_per_conversion: initial.payout_per_conversion ?? 0,
    integration_display_mode:
      partner.integration_display_mode ?? DEFAULT_PARTNER_INTEGRATION_DISPLAY_MODE,
    embed_url_template: partner.embed_url_template ?? undefined,
  };
}

export function AdminPartnerForm({
  initial,
  steps,
  partnerId,
  isEdit,
  onCancel,
  onSubmit,
  onPendingLogoFile,
}: AdminPartnerFormProps) {
  const { t } = useLocalization();
  const [form, setForm] = useState<PartnerCreateRequest>(() => initialFormState(initial));
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(initial.logo_url ?? null);
  const [saving, setSaving] = useState(false);

  const roleOptions = useMemo(
    () =>
      ALL_WORKSPACES.map((ws) => ({
        value: ws,
        label: t(workspaceSwitcherLabelKey(ws)),
      })),
    [t]
  );

  const showStepPicker = form.target_roles?.some((r) => CHECKLIST_ROLES.includes(r as Workspace));

  const payoutLabel =
    form.payout_type === "on_close"
      ? t("partners.admin.form.payout_on_close")
      : t("partners.admin.form.payout_on_click");

  const integrationDisplayMode = (form.integration_display_mode ??
    DEFAULT_PARTNER_INTEGRATION_DISPLAY_MODE) as PartnerIntegrationDisplayMode;
  const showEmbedUrlField = partnerShowsIframe(integrationDisplayMode);

  const previewDestinationUrl = useMemo(() => {
    const template = form.destination_url_template?.trim();
    if (!template) return undefined;
    return interpolateDestinationUrl(template, {
      linkId: "preview",
      partnerSlug: form.slug?.trim() || "preview",
    });
  }, [form.destination_url_template, form.slug]);

  return (
    <Box className="flex flex-col gap-4">
      <Label>{t("partners.admin.table.name")}</Label>
      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <Label>{t("partners.admin.table.slug")}</Label>
      <Input
        value={form.slug}
        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        disabled={isEdit}
      />
      <Label>{t("partners.admin.form.rev_share_link")}</Label>
      <Input
        value={form.destination_url_template}
        onChange={(e) => setForm((f) => ({ ...f, destination_url_template: e.target.value }))}
        placeholder="https://partner.example/your-rev-share-link"
      />
      <BodyText size="xs" muted>
        {t("partners.admin.form.rev_share_link_help")}
      </BodyText>

      <Label>{t("partners.admin.form.integration_display_mode")}</Label>
      <Dropdown
        size="sm"
        label={t("partners.admin.form.integration_display_mode")}
        hideLabel
        options={INTEGRATION_DISPLAY_OPTIONS.map((opt) => ({
          value: opt.value,
          label: t(opt.labelKey),
        }))}
        value={integrationDisplayMode}
        onChange={(value) =>
          setForm((f) => ({
            ...f,
            integration_display_mode: value as PartnerIntegrationDisplayMode,
          }))
        }
      />

      {showEmbedUrlField ? (
        <>
          <Label>{t("partners.admin.form.embed_url")}</Label>
          <Input
            value={form.embed_url_template ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, embed_url_template: e.target.value }))}
            placeholder="https://partner.example/embed-page"
          />
          <BodyText size="xs" muted>
            {t("partners.admin.form.embed_url_help")}
          </BodyText>
        </>
      ) : null}

      <PartnerLogoUpload
        partnerId={partnerId}
        logoUrl={previewLogoUrl}
        onLogoUrlChange={setPreviewLogoUrl}
        onPendingFile={onPendingLogoFile}
        disabled={saving}
      />

      <Label>{t("partners.admin.form.description")}</Label>
      <Input
        value={form.description ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />

      <Label>{t("partners.admin.form.target_roles")}</Label>
      <OptionTagInput
        options={roleOptions}
        value={form.target_roles ?? []}
        onChange={(target_roles) => setForm((f) => ({ ...f, target_roles }))}
      />

      {showStepPicker ? (
        <>
          <Label>{t("partners.admin.form.steps")}</Label>
          <ChecklistStepPicker
            steps={steps}
            targetRoles={form.target_roles ?? []}
            value={form.step_ids ?? []}
            onChange={(step_ids) => setForm((f) => ({ ...f, step_ids }))}
            disabled={saving}
          />
        </>
      ) : null}

      <Label>{t("partners.admin.form.payout_type_label")}</Label>
      <Dropdown
        size="sm"
        label={t("partners.admin.form.payout_type_label")}
        hideLabel
        options={PAYOUT_TYPE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: t(opt.labelKey),
        }))}
        value={form.payout_type ?? "on_click"}
        onChange={(value) => setForm((f) => ({ ...f, payout_type: value }))}
      />

      <Label>{payoutLabel}</Label>
      <Input
        type="number"
        value={String(form.payout_per_conversion ?? 0)}
        onChange={(e) => setForm((f) => ({ ...f, payout_per_conversion: Number(e.target.value) }))}
      />

      <Box className="border-border mt-2 border-t pt-4">
        <Title size="sm" as="h3" className="mb-2">
          {t("partners.admin.form.preview")}
        </Title>
        <PartnerIntegrationExperience
          name={form.name || t("partners.admin.form.preview_name")}
          logoUrl={previewLogoUrl}
          description={form.description}
          integrationDisplayMode={integrationDisplayMode}
          embedSrc={
            showEmbedUrlField
              ? form.embed_url_template?.trim() || form.destination_url_template?.trim() || null
              : null
          }
          href={previewDestinationUrl}
          ctaLabel={t("partners.placement.open_partner")}
        />
      </Box>

      <Box className="flex flex-row gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const { logo_url: _logoUrl, ...bodyWithoutLogo } = form as PartnerCreateRequest & {
                logo_url?: string;
              };
              await onSubmit(bodyWithoutLogo);
            } finally {
              setSaving(false);
            }
          }}
        >
          {t("partners.admin.save")}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {t("partners.admin.cancel")}
        </Button>
      </Box>
    </Box>
  );
}
