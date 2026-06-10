import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

export function FormsBrowserLoading() {
  const { t } = useLocalization();
  return (
    <Box className="w-full py-4">
      <BodyText size="sm" muted>
        {t("forms.loading_library", { defaultValue: "Loading forms..." })}
      </BodyText>
    </Box>
  );
}

export function FormsBrowserError() {
  const { t } = useLocalization();
  return (
    <Box className="w-full py-4">
      <BodyText size="sm" className="text-destructive">
        {t("forms.error_loading_library", {
          defaultValue: "Error loading forms. Please try again.",
        })}
      </BodyText>
    </Box>
  );
}

export function FormsBrowserNoSearchResults() {
  const { t } = useLocalization();
  return (
    <Box className="w-full py-4">
      <BodyText size="sm" muted>
        {t("forms.no_forms_match_search", {
          defaultValue: "No forms match your search.",
        })}
      </BodyText>
    </Box>
  );
}

export function FormsBrowserEmptyLibrary() {
  const { t } = useLocalization();
  return (
    <Box className="w-full py-4">
      <BodyText size="sm" muted>
        {t("forms.no_forms_available", {
          defaultValue: "No forms available. Forms will be added by your administrator.",
        })}
      </BodyText>
    </Box>
  );
}
