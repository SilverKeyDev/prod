import { Subtitle } from "@ui";
import NavigationButton from "@ui/button/NavigationButton";

import { useLocalization } from "packages/contexts";
import { useMoveConciergeEmbedUrl } from "packages/features/checklists/hooks/data/useMoveConciergeEmbedUrl";
import Card from "packages/ui/components/cards/Card";
import { Box, Image } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

export default function HomeConcierge() {
  const { t } = useLocalization();
  const embedUrl = useMoveConciergeEmbedUrl();

  return (
    <Box className="px-responsive-sm w-full max-w-none self-center">
      <Card border="dotted" padding="md" className="mb-2">
        <Box className="gap-responsive-md flex flex-row items-start text-left">
          <Image
            src="/MoveConcierge.jpg"
            alt={t("close.home_concierge.alt")}
            className="md:w-30 border-border-card-muted w-28 flex-shrink-0 rounded-lg border"
            loading="lazy"
          />
          <Box className="flex min-w-0 max-w-[72ch] flex-1 flex-col justify-between self-stretch">
            <Subtitle size="sm" muted className="leading-relaxed md:text-base lg:text-lg">
              {t("close.home_concierge.subtitle")}
            </Subtitle>
            <Subtitle
              size="xs"
              muted
              className="my-auto hidden leading-relaxed md:flex md:flex-col md:text-xs lg:text-xs"
            >
              {t("close.home_concierge.how_possible")}
            </Subtitle>
          </Box>
        </Box>
      </Card>
      <Box className="gap-responsive-sm flex w-full flex-col">
        <iframe
          src={embedUrl}
          title={t("close.home_concierge.alt")}
          className="border-border min-h-80 w-full rounded-lg border md:min-h-96"
        />
        <NavigationButton
          onClick={() => getWindow()?.open?.(embedUrl, "_blank", "noopener,noreferrer")}
          size="md"
          className="text-olive hover:text-olive active:text-olive self-start rounded border border-dotted border-neutral-400 px-2 py-1"
        >
          {t("close.home_concierge.open_in_new_tab")}
        </NavigationButton>
      </Box>
    </Box>
  );
}
