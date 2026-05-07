import { useEffect, useMemo } from "react";

import { AGREEMENT_SIGNING_COMPLETE_POSTMESSAGE_SOURCE } from "packages/features/documents/utils/agreementSigningPostMessage";
import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button, Title } from "@/components/ui";

/**
 * Shown after DocuSign redirects to `return_url` (`/agreements/:agreementId/complete`).
 * DocuSign appends `?event=signing_complete` on success; other `event` values are treated neutrally.
 */
export default function AgreementSigningCompletePage() {
  const { getSearchParams, navigateToPath } = useNavigation();
  const event = getSearchParams().get("event");

  useEffect(() => {
    const win = getWindow();
    if (!win || win.parent === win) return;

    const successLike = event === "signing_complete" || event === null || event === "";

    if (!successLike) return;

    win.parent.postMessage(
      {
        event: "signing_complete",
        source: AGREEMENT_SIGNING_COMPLETE_POSTMESSAGE_SOURCE,
      },
      win.location.origin
    );
  }, [event]);
  const headline = useMemo(() => {
    if (event === "signing_complete" || event === null || event === "") {
      return "Signing complete";
    }
    if (event === "cancel" || event === "decline") {
      return "Signing session ended";
    }
    return "Returned from DocuSign";
  }, [event]);

  const description = useMemo(() => {
    if (event === "signing_complete" || event === null || event === "") {
      return "Your signature has been submitted. You can close this page or return to your agreements.";
    }
    if (event === "cancel" || event === "decline") {
      return "You left the signing flow before finishing. You can try again from your agreements when you are ready.";
    }
    return "You were redirected back from DocuSign. Return to your agreements to continue.";
  }, [event]);

  return (
    <Box className="flex flex-col items-center justify-center px-4 py-12 text-center md:py-16">
      <Title as="h1" size="lg" className="mb-3">
        {headline}
      </Title>
      <BodyText size="md" muted className="mb-8 max-w-md">
        {description}
      </BodyText>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigateToPath("/saved?saved=agreements")}
        iconName="home"
      >
        Back to agreements
      </Button>
    </Box>
  );
}
