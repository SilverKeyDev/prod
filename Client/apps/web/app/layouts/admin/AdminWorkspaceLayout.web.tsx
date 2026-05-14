import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";
import { Outlet, useLocation } from "react-router-dom";

import {
  ADMIN_BASE_PATH,
  ADMIN_ROUTE_SEGMENTS,
  segmentFromPath,
  visibleAdminNavSpec,
} from "packages/features/admin/utils/navigation";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { checkStepUpRequired, useStepUpAuth } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
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
  const instanceLabelRef = useRef<string | null>(null);
  if (instanceLabelRef.current === null) {
    instanceLabelRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `admin-layout-${Date.now()}`;
  }

  const locationRef = useRef(location);
  locationRef.current = location;

  const { navigateToPath } = useNavigation();
  const { user } = useAuthStoreIntegration();
  const { userProfile } = useUserData();

  const { isStepUpRequired, requestStepUpAuth, stepUpModalProps } = useStepUpAuth();
  const [stepUpSatisfied, setStepUpSatisfied] = useState(
    () => !checkStepUpRequired("access_admin_panel")
  );
  const isStepUpRequiredRef = useRef(isStepUpRequired);
  const requestStepUpAuthRef = useRef(requestStepUpAuth);
  isStepUpRequiredRef.current = isStepUpRequired;
  requestStepUpAuthRef.current = requestStepUpAuth;

  useEffect(() => {
    const label = instanceLabelRef.current ?? "admin-layout";
    const loc = locationRef.current;
    log.info(LOG_CATEGORIES.ROUTING, "[ADMIN_WORKSPACE] mounted", {
      instanceId: label,
      windowPath: typeof window !== "undefined" ? window.location.pathname : "",
      routerPath: loc.pathname,
      routerSearch: loc.search,
      routerKey: loc.key,
    });
    return () => {
      const locUnmount = locationRef.current;
      log.info(LOG_CATEGORIES.ROUTING, "[ADMIN_WORKSPACE] unmounted", {
        instanceId: label,
        windowPath: typeof window !== "undefined" ? window.location.pathname : "",
        routerPath: locUnmount.pathname,
        routerSearch: locUnmount.search,
        routerKey: locUnmount.key,
      });
    };
    // Intentionally mount-only: tracks remount loops (see DynamicRoutes stable admin subtree).
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ensureStepUp = async () => {
      if (!isStepUpRequiredRef.current("access_admin_panel")) {
        if (!cancelled) setStepUpSatisfied(true);
        return;
      }

      log.info(LOG_CATEGORIES.ROUTING, "[ADMIN_WORKSPACE] step-up required, opening flow", {
        instanceId: instanceLabelRef.current,
      });

      const ok = await requestStepUpAuthRef.current(
        "access_admin_panel",
        "Confirm your identity to access the SilverKey admin workspace."
      );

      if (cancelled) {
        log.info(
          LOG_CATEGORIES.ROUTING,
          "[ADMIN_WORKSPACE] step-up await returned after effect cleanup",
          {
            instanceId: instanceLabelRef.current,
            ok,
            note: "setStepUpSatisfied skipped — likely React Strict Mode remount or parent unmount",
          }
        );
        return;
      }

      setStepUpSatisfied(ok);
      log.info(LOG_CATEGORIES.ROUTING, "[ADMIN_WORKSPACE] step-up finished", {
        instanceId: instanceLabelRef.current,
        ok,
      });
    };

    void ensureStepUp();

    return () => {
      log.info(
        LOG_CATEGORIES.ROUTING,
        "[ADMIN_WORKSPACE] step-up effect cancelled (strict remount or parent unmount)",
        {
          instanceId: instanceLabelRef.current,
          routerPath: locationRef.current.pathname,
          routerKey: locationRef.current.key,
        }
      );
      cancelled = true;
    };
  }, []);

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
            <Button
              variant="secondary"
              size="sm"
              onClick={stepUpModalProps.onClose}
              iconName="arrow-left"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={stepUpModalProps.onSuccess}
              iconName="chevron-right"
            >
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
