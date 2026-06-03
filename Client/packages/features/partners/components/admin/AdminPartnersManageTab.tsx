import { useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { Partner, PartnerCreateRequest } from "packages/features/partners/api/partners";
import { partnersApi } from "packages/features/partners/api/partners";
import { AdminPartnerForm } from "packages/features/partners/components/admin/AdminPartnerForm";
import {
  useAdminPartnersList,
  useCreatePartner,
  useDeletePartner,
  usePartnerChecklistSteps,
  useTogglePartnerActive,
  useUpdatePartner,
} from "packages/features/partners/hooks/useAdminPartners";
import { ConfirmationDialog } from "packages/ui/components/modals";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { formatCtrPercent } from "packages/utils/revShare/revShareRedirectUrl";

import Card from "@/components/layout/Card.web";
import { Button } from "@/components/ui";

const EMPTY_PARTNER_CREATE_FORM: PartnerCreateRequest = {
  name: "",
  slug: "",
  destination_url_template: "",
  description: "",
  target_roles: ["buyer"],
  step_ids: [],
  payout_type: "on_click",
  payout_per_conversion: 0,
  integration_display_mode: "iframe_and_link",
};

export function AdminPartnersManageTab() {
  const { t } = useLocalization();
  const { data: partners = [], isLoading } = useAdminPartnersList();
  const { data: steps = [] } = usePartnerChecklistSteps();
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const toggleActive = useTogglePartnerActive();
  const deletePartner = useDeletePartner();
  const [editing, setEditing] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const pendingLogoRef = useRef<File | null>(null);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    pendingLogoRef.current = null;
  };

  const uploadPendingLogo = async (partnerId: string) => {
    const file = pendingLogoRef.current;
    if (!file) return;
    await partnersApi.uploadPartnerLogo(partnerId, file);
    pendingLogoRef.current = null;
  };

  const handleConfirmDelete = async () => {
    if (!partnerToDelete) return;
    await deletePartner.mutateAsync(partnerToDelete.id);
    if (editing?.id === partnerToDelete.id) {
      closeForm();
    }
    setPartnerToDelete(null);
  };

  return (
    <Box className="flex flex-col gap-4">
      <ConfirmationDialog
        isOpen={Boolean(partnerToDelete)}
        title={t("partners.admin.delete_confirm_title")}
        message={t("partners.admin.delete_confirm_message", {
          name: partnerToDelete?.name ?? "",
        })}
        confirmText={t("partners.admin.delete")}
        cancelText={t("partners.admin.cancel")}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => setPartnerToDelete(null)}
      />
      <Box className="flex flex-row flex-wrap items-center justify-between gap-2">
        <Title size="md" as="h2">
          {t("partners.admin.tab.manage")}
        </Title>
        <Button
          variant={showForm ? "secondary" : "primary"}
          size="sm"
          onClick={() => {
            if (showForm) {
              closeForm();
              return;
            }
            setEditing(null);
            pendingLogoRef.current = null;
            setShowForm(true);
          }}
        >
          {showForm ? t("partners.admin.cancel") : t("partners.admin.add_partner")}
        </Button>
      </Box>

      {showForm ? (
        <Card border="light" padding="lg">
          <AdminPartnerForm
            initial={editing ?? EMPTY_PARTNER_CREATE_FORM}
            steps={steps}
            partnerId={editing?.id}
            isEdit={Boolean(editing)}
            onPendingLogoFile={(file) => {
              pendingLogoRef.current = file;
            }}
            onCancel={closeForm}
            onSubmit={async (body) => {
              if (editing) {
                await updatePartner.mutateAsync({ id: editing.id, body });
                closeForm();
              } else {
                const created = await createPartner.mutateAsync(body as PartnerCreateRequest);
                await uploadPendingLogo(created.id);
                closeForm();
              }
            }}
          />
        </Card>
      ) : null}

      <Card border="light" padding="lg" className="overflow-x-auto">
        {isLoading ? (
          <BodyText size="sm" muted>
            Loading…
          </BodyText>
        ) : (
          <table className="min-w-2xl w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4">{t("partners.admin.table.name")}</th>
                <th className="py-2 pr-4">{t("partners.admin.table.slug")}</th>
                <th className="py-2 pr-4">{t("partners.admin.table.step")}</th>
                <th className="py-2 pr-4">{t("partners.admin.table.clicks")}</th>
                <th className="py-2 pr-4">{t("partners.admin.table.ctr")}</th>
                <th className="py-2 pr-4">{t("partners.admin.table.active")}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-border/60 border-b">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4">{p.slug}</td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {(p.step_ids ?? []).join(", ") || p.step_id}
                  </td>
                  <td className="py-2 pr-4">{p.total_clicks ?? 0}</td>
                  <td className="py-2 pr-4">{formatCtrPercent(p.click_through_rate)}</td>
                  <td className="py-2 pr-4">{p.is_active ? "Yes" : "No"}</td>
                  <td className="py-2">
                    <Box className="flex flex-row gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(p);
                          pendingLogoRef.current = null;
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleActive.mutate(p, !p.is_active)}
                      >
                        {p.is_active
                          ? t("partners.admin.deactivate")
                          : t("partners.admin.activate")}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPartnerToDelete(p)}
                        disabled={deletePartner.isPending}
                      >
                        {t("partners.admin.delete")}
                      </Button>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Box>
  );
}
