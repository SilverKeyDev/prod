import { useState } from "react";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { rememberRecentBrokerageId } from "packages/features/admin/utils/integrations/adminSkySlopeRecentBrokerages";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { BrokerageIdPicker } from "./BrokerageIdPicker";
import { SkySlopeCredentialPanel } from "./SkySlopeCredentialPanel";

export function AdminIntegrationsSection({ scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  const [selectedBrokerageId, setSelectedBrokerageId] = useState<string | null>(null);

  return (
    <Box className="mt-6 flex flex-col gap-6" data-admin-scope={scope.kind}>
      <Box>
        <Title size="md" as="h1" className="mb-2">
          Brokerage integrations
        </Title>
        <BodyText size="sm" muted className="max-w-2xl">
          Manually configure third-party integrations per brokerage. MVP scope covers SkySlope
          credentials for historical transaction sync after brokerage onboarding.
        </BodyText>
      </Box>

      <BrokerageIdPicker
        selectedBrokerageId={selectedBrokerageId}
        onSelect={(brokerageId) => {
          rememberRecentBrokerageId(brokerageId);
          setSelectedBrokerageId(brokerageId);
        }}
      />

      {selectedBrokerageId ? <SkySlopeCredentialPanel brokerageId={selectedBrokerageId} /> : null}
    </Box>
  );
}
