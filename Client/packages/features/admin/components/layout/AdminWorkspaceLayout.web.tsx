import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";
import Card from "@ui/layout/Card.web";

import {
  ADMIN_BASE_PATH,
  ADMIN_ROUTE_SEGMENTS,
  segmentFromPath,
  superadminOnlyRouteSegments,
  visibleAdminNavSpec,
} from "packages/features/admin/utils/navigation";
import { useAuthStoreIntegration } from "packages/features/homeauth/hooks/store/useAuthStoreIntegration";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { checkStepUpRequired, useStepUpAuth } from "packages/hooks/ui";
import { log } from "packages/logger";
import type { NavItem } from "packages/navigation";
import { useNavigation } from "packages/navigation";
import { NavigationOutlet } from "packages/navigation/router/NavigationOutlet.web";
import { BodyText, Box, Button, Title } from "packages/ui";
import SidebarNavigation from "packages/ui/components/structure/sidebar/SidebarNavigation";
import { TwoColumnInsetPageLayout } from "packages/ui/components/structure/sidebar/TwoColumnInsetPageLayout";
import { getWindow } from "packages/utils/core/platform";

export function AdminWorkspaceLayout() {
  const { getCurrentRoute, navigateToPath } = useNavigation();
  const route = getCurrentRoute();
  const instanceLabelRef = useRef<string | null>(null);
  if (instanceLabelRef.current === null) {
    instanceLabelRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `admin-layout-${Date.now()}`;
  }

  const routeRef = useRef(route);
  routeRef.current = route;
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
    const loc = routeRef.current;
    log.info("ROUTING", "[ADMIN_WORKSPACE] mounted", {
      instanceId: label,
      windowPath: getWindow()?.location?.pathname ?? "",
      routerPath: loc.pathname,
      routerSearch: loc.search,
    });
    return () => {
      const locUnmount = routeRef.current;
      log.info("ROUTING", "[ADMIN_WORKSPACE] unmounted", {
        instanceId: label,
        windowPath: getWindow()?.location?.pathname ?? "",
        routerPath: locUnmount.pathname,
        routerSearch: locUnmount.search,
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ensureStepUp = async () => {
      if (!isStepUpRequiredRef.current("access_admin_panel")) {
        if (!cancelled) setStepUpSatisfied(true);
        return;
      }

      log.info("ROUTING", "[ADMIN_WORKSPACE] step-up required, opening flow", {
        instanceId: instanceLabelRef.current,
      });

      const ok = await requestStepUpAuthRef.current(
        "access_admin_panel",
        "Confirm your identity to access the SilverKey admin workspace."
      );

      if (cancelled) {
        log.info("ROUTING", "[ADMIN_WORKSPACE] step-up await returned after effect cleanup", {
          instanceId: instanceLabelRef.current,
          ok,
          note: "setStepUpSatisfied skipped — likely React Strict Mode remount or parent unmount",
        });
        return;
      }

      setStepUpSatisfied(ok);
      log.info("ROUTING", "[ADMIN_WORKSPACE] step-up finished", {
        instanceId: instanceLabelRef.current,
        ok,
      });
    };

    void ensureStepUp();

    return () => {
      log.info(
        "ROUTING",
        "[ADMIN_WORKSPACE] step-up effect cancelled (strict remount or parent unmount)",
        {
          instanceId: instanceLabelRef.current,
          routerPath: routeRef.current.pathname,
        }
      );
      cancelled = true;
    };
  }, []);

  const roles = userProfile?.roles ?? user?.roles ?? [];
  const includeSuperadmin = roles.includes("super_admin");
  const superadminOnlySegments = useMemo(() => new Set(superadminOnlyRouteSegments()), []);

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
    const seg = segmentFromPath(route.pathname);
    if (seg && !includeSuperadmin && superadminOnlySegments.has(seg)) {
      return ADMIN_ROUTE_SEGMENTS.logging;
    }
    return seg ?? ADMIN_ROUTE_SEGMENTS.logging;
  }, [includeSuperadmin, route.pathname, superadminOnlySegments]);

  const isEmbeddedMessaging = activeSegment === ADMIN_ROUTE_SEGMENTS.supportMessaging;

  useEffect(() => {
    const seg = segmentFromPath(route.pathname);
    if (seg && !includeSuperadmin && superadminOnlySegments.has(seg)) {
      void navigateToPath(`${ADMIN_BASE_PATH}/${ADMIN_ROUTE_SEGMENTS.logging}`, {
        replace: true,
      });
    }
  }, [includeSuperadmin, route.pathname, navigateToPath, superadminOnlySegments]);

  const handleNavKey = (key: string) => {
    navigateToPath(`${ADMIN_BASE_PATH}/${key}`);
  };

  const renderStepUpModal = () => {
    if (!stepUpModalProps.isOpen) return null;

    return (
      <Box className="z-modal bg-overlay-backdrop fixed inset-0 flex items-center justify-center p-4">
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
      regionClassName={
        isEmbeddedMessaging
          ? "relative flex w-full min-h-[calc(100dvh-10rem)] flex-1 flex-col overflow-hidden"
          : "flex w-full flex-1 flex-col gap-8"
      }
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
      <NavigationOutlet />
      {renderStepUpModal()}
    </TwoColumnInsetPageLayout>
  );
}
