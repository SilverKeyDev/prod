import { useLocalization } from "packages/contexts";
import { BodyText } from "packages/ui/components/index.web";
import { dateNow } from "packages/utils/date";

import AuthLink from "./Link";

export default function AuthFooter() {
  const { t } = useLocalization();
  return (
    <div className="animate-fade-in mt-4 border-t border-gray-100 pt-4">
      <div className="flex flex-col items-center justify-center gap-2 text-center text-sm">
        <div className="flex items-center justify-center gap-1 whitespace-nowrap text-black/60 sm:gap-2 md:gap-3">
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
        <BodyText as="p" size="xs" className="text-black/40">
          © {dateNow().year()} SilverKey. {t("auth.footer.copyright")}
        </BodyText>
      </div>
    </div>
  );
}
