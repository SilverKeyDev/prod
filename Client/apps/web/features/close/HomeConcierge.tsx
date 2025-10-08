import Card from "../../components/layout/Card";
import { NavigationButton, Subtitle } from "../../components/ui";

export default function HomeConcierge() {
  return (
    <div className="px-responsive-sm mx-auto w-full max-w-none">
      <Card padding="md" className="mb-[8px]">
        <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-responsive-md items-center text-center md:text-left">
          <img
            src="/MoveConcierge.jpg"
            alt="Moving Concierge"
            className="w-[112px] md:w-[120px] rounded-lg border border-beige/30 mb-responsive-sm mx-auto md:mx-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0 max-w-[72ch] mx-auto md:mx-0">
            <Subtitle
              size="sm"
              muted
              className="mb-responsive-lg leading-relaxed"
            >
              Get a free concierge to compare movers, schedule services,
              transfer utilities, and handle logistics, all in one 30 minute
              call
            </Subtitle>
            <Subtitle
              size="xs"
              muted
              className="mt-[6px] mb-responsive-md leading-relaxed"
            >
              <strong>How is this possible?</strong> MoveConcierge takes
              commission from service providers, so it’s free for you
            </Subtitle>
            <NavigationButton
              onClick={() =>
                window.open(
                  "https://mc.partners/SilverKey",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              size="md"
              className="text-olive hover:text-olive/80 mt-responsive-xs"
            >
              Start Today
            </NavigationButton>
          </div>
        </div>
      </Card>
    </div>
  );
}