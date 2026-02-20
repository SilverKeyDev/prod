import { useLocalization } from "packages/contexts";

import Card from "@/components/layout/Card.web";
import { Image, NavigationButton, Subtitle } from "@/components/ui/index.web";

export default function HomeConcierge() {
  const { t } = useLocalization();
  return (
    <div className="px-responsive-sm mx-auto w-full max-w-none">
      <Card padding="md" className="mb-2">
        <div className="flex flex-row gap-responsive-md items-start text-left">
          <Image
            src="/MoveConcierge.jpg"
            alt={t("close.home_concierge.alt")}
            className="w-28 md:w-30 rounded-lg border border-beige/30 flex-shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col flex-1 min-w-0 max-w-[72ch] self-stretch justify-between">
            <Subtitle
              size="sm"
              muted
              className="leading-relaxed md:text-base lg:text-lg"
            >
              {t("close.home_concierge.subtitle")}
            </Subtitle>
            <Subtitle
              size="xs"
              muted
              className="hidden md:block my-auto leading-relaxed md:text-xs lg:text-xs"
            >
              {t("close.home_concierge.how_possible")}
            </Subtitle>
            <NavigationButton
              onClick={() =>
                window.open(
                  "https://mc.partners/SilverKey",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              size="md"
              className="text-olive hover:text-olive/80 border border-dotted border-olive rounded px-2 py-1"
            >
              {t("close.home_concierge.start_today")}
            </NavigationButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
