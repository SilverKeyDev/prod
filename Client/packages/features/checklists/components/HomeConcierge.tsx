import { useLocalization } from "packages/contexts";
import { Image } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import Card from "@/components/layout/Card.web";
import { NavigationButton, Subtitle } from "@/components/ui";

export default function HomeConcierge() {
  const { t } = useLocalization();
  return (
    <div className="px-responsive-sm mx-auto w-full max-w-none">
      <Card padding="md" className="mb-2">
        <div className="gap-responsive-md flex flex-row items-start text-left">
          <Image
            src="/MoveConcierge.jpg"
            alt={t("close.home_concierge.alt")}
            className="md:w-30 border-beige/30 w-28 flex-shrink-0 rounded-lg border"
            loading="lazy"
          />
          <div className="flex min-w-0 max-w-[72ch] flex-1 flex-col justify-between self-stretch">
            <Subtitle size="sm" muted className="leading-relaxed md:text-base lg:text-lg">
              {t("close.home_concierge.subtitle")}
            </Subtitle>
            <Subtitle
              size="xs"
              muted
              className="my-auto hidden leading-relaxed md:block md:text-xs lg:text-xs"
            >
              {t("close.home_concierge.how_possible")}
            </Subtitle>
            <NavigationButton
              onClick={() =>
                getWindow()?.open?.(
                  "https://mc.partners/SilverKey",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              size="md"
              className="text-olive hover:text-olive/80 border-olive rounded border border-dotted px-2 py-1"
            >
              {t("close.home_concierge.start_today")}
            </NavigationButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
