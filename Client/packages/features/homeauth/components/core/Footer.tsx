import { useLocalization } from "packages/contexts";
import { dateNow } from "packages/utils/date";

import { BodyText } from "@/components/ui";

import AuthLink from "./Link";

export default function AuthFooter() {
  const { t } = useLocalization();
  return (
    <div className="animate-fade-in border-border mt-4 border-t pt-4">
      <div className="flex flex-col items-center justify-center gap-2 text-center text-sm">
        <div className="text-text-secondary flex items-center justify-center gap-1 whitespace-nowrap sm:gap-2 md:gap-3">
          <AuthLink to="/privacy" variant="footer">
            {t("auth.footer.privacy_policy")}
          </AuthLink>
          <AuthLink to="/terms" variant="footer">
            {t("auth.footer.terms_of_service")}
          </AuthLink>
          <AuthLink to="/contact" variant="footer">
            {t("auth.footer.contact_us")}
          </AuthLink>
        </div>
        <BodyText as="p" size="xs" className="text-text-disabled">
          © {dateNow().year()} SilverKey. {t("auth.footer.copyright")}
        </BodyText>
      </div>
    </div>
  );
}
