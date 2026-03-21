import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";

import { BodyText } from "@/components/ui";

import AuthLink from "./Link";

export default function AuthFooter() {
  const { t } = useLocalization();
  return (
    <Box className="animate-fade-in mt-4 pt-4">
      <Box className="flex flex-col items-center justify-center gap-2 text-center text-sm">
        <Box className="text-text-secondary flex items-center justify-center gap-1 whitespace-nowrap sm:gap-2 md:gap-3">
          <AuthLink to="/privacy" variant="footer">
            {t("auth.footer.privacy_policy")}
          </AuthLink>
          <AuthLink to="/terms" variant="footer">
            {t("auth.footer.terms_of_service")}
          </AuthLink>
          <AuthLink to="/contact" variant="footer">
            {t("auth.footer.contact_us")}
          </AuthLink>
        </Box>
        <BodyText as="p" size="xs" className="text-text-disabled">
          © {dateNow().year()} SilverKey. {t("auth.footer.copyright")}
        </BodyText>
      </Box>
    </Box>
  );
}
