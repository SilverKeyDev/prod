import { useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";
import { Outlet, useLocation } from "react-router-dom";

import {
  ADMIN_BASE_PATH,
  ADMIN_ROUTE_SEGMENTS,
  segmentFromPath,
  visibleAdminNavSpec,
} from "packages/features/admin/utils/adminSidebarNavConfig";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { useStepUpAuth } from "packages/hooks/ui";
import type { NavItem } from "packages/navigation";
import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";
import SidebarNavigation from "packages/ui/components/sidebar/SidebarNavigation";
import { TwoColumnInsetPageLayout } from "packages/ui/components/sidebar/TwoColumnInsetPageLayout";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";

export function AdminWorkspaceLayout() {
  const location = useLocation();
  const { navigateToPath } = useNavigation();
  const { user } = useAuthStoreIntegration();
  const { userProfile } = useUserData();

  const { isStepUpRequired, requestStepUpAuth, stepUpModalProps } = useStepUpAuth();
  const [stepUpSatisfied, setStepUpSatisfied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const ensureStepUp = async () => {
      if (!isStepUpRequired("access_admin_panel")) {
        if (mounted) setStepUpSatisfied(true);
        return;
      }

      const ok = await requestStepUpAuth(
        "access_admin_panel",
        "Confirm your identity to access the SilverKey admin workspace."
      );

      if (mounted) setStepUpSatisfied(ok);
    };

    void ensureStepUp();

    return () => {
      mounted = false;
    };
  }, [isStepUpRequired, requestStepUpAuth]);

  const roles = userProfile?.roles ?? user?.roles ?? [];
  const includeSuperadmin = roles.includes("super_admin");

  const navItems = useMemo(
    (): NavItem[] =>
      visibleAdminNavSpec(includeSuperadmin).map((row) => ({
        key: row.key,
        to: `${ADMIN_BASE_PATH}/${row.key}`,
        label: row.label,
        icon: (props: { size?: number; className?: string }) => (
          <Icon name={row.iconName} {...props} />
        ),
      })),
    [includeSuperadmin]
  );

  const activeSegment = useMemo(() => {
    const seg = segmentFromPath(location.pathname);
    if (seg && !includeSuperadmin && seg === ADMIN_ROUTE_SEGMENTS.superadmin) {
      return ADMIN_ROUTE_SEGMENTS.logging;
    }
    return seg ?? ADMIN_ROUTE_SEGMENTS.logging;
  }, [includeSuperadmin, location.pathname]);

  useEffect(() => {
    const seg = segmentFromPath(location.pathname);
    if (seg === ADMIN_ROUTE_SEGMENTS.superadmin && !includeSuperadmin) {
      void navigateToPath(`${ADMIN_BASE_PATH}/${ADMIN_ROUTE_SEGMENTS.logging}`, { replace: true });
    }
  }, [includeSuperadmin, location.pathname, navigateToPath]);

  const handleNavKey = (key: string) => {
    navigateToPath(`${ADMIN_BASE_PATH}/${key}`);
  };

  const renderStepUpModal = () => {
    if (!stepUpModalProps.isOpen) return null;

    return (
      <Box className="fixed inset-0 z-modal flex items-center justify-center bg-overlay-backdrop p-4">
        <Card border="light" className="w-full max-w-md" padding="lg">
          <Title size="lg" as="h2" className="mb-2">
            Confirm your identity
          </Title>
          <BodyText size="sm" muted className="mb-4">
            {stepUpModalProps.description ??
              "For your security, please confirm your identity to access this admin feature."}
          </BodyText>
          <Box className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={stepUpModalProps.onClose} iconName="arrow-left">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={stepUpModalProps.onSuccess} iconName="chevron-right">
              Continue
            </Button>
          </Box>
        </Card>
      </Box>
    );
  };

  if (!stepUpSatisfied) {
    return (
      <Box className="flex min-h-[60vh] items-center justify-center p-6">
        <BodyText size="sm" muted>
          Preparing admin workspace…
        </BodyText>
        {renderStepUpModal()}
      </Box>
    );
  }

  return (
    <TwoColumnInsetPageLayout
      maxWidthClassName="max-w-7xl"
      regionClassName="flex w-full flex-1 flex-col gap-8"
      sidebar={
        <SidebarNavigation
          sectionTitle="Admin"
          items={navItems}
          activeItem={activeSegment}
          onItemClick={handleNavKey}
        />
      }
    >
      <Title size="lg" as="h1" className="sr-only">
        Admin workspace
      </Title>
      <Outlet />
      {renderStepUpModal()}
    </TwoColumnInsetPageLayout>
  );
}
