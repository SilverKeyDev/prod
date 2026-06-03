import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type Partner,
  type PartnerCreateRequest,
  partnersApi,
  type PartnerUpdateRequest,
} from "packages/features/partners/api/partners";

const PARTNERS_KEY = ["admin", "partners"] as const;
const STEPS_KEY = ["admin", "partners", "checklist-steps"] as const;

export function useAdminPartnersList() {
  return useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => partnersApi.listPartners(),
  });
}

export function usePartnerChecklistSteps() {
  return useQuery({
    queryKey: STEPS_KEY,
    queryFn: () => partnersApi.listChecklistSteps(),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PartnerCreateRequest) => partnersApi.createPartner(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTNERS_KEY }),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PartnerUpdateRequest }) =>
      partnersApi.updatePartner(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTNERS_KEY }),
  });
}

export function useTogglePartnerActive() {
  const update = useUpdatePartner();
  return {
    ...update,
    mutate: (partner: Partner, isActive: boolean) =>
      update.mutate({ id: partner.id, body: { is_active: isActive } }),
  };
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partnerId: string) => partnersApi.deletePartner(partnerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTNERS_KEY }),
  });
}
