import { Icon } from "@ui/icons";

import { Link, ROUTES } from "packages/navigation";
import { LOGO } from "packages/ui/components/asset";
import { RippleBackground } from "packages/ui/components/backgrounds";
import { Image } from "packages/ui/components/primitives";

import { BodyText, Button, CloseButton, Title } from "@/components/ui";
const FEATURE_CARDS = [
  {
    title: "Find Properties",
    description: "Select your preferences and let our AI find the best homes for you",
    icon: <Icon name="building-2" className="mobile-icon-lg text-text-secondary" />,
  },
  {
    title: "Decide on a Home",
    description:
      "Input the facts of homes into spreadsheets or reports and get detailed analysis of the neighborhood.",
    icon: <Icon name="bar-chart-2" className="mobile-icon-lg text-text-secondary" />,
  },
  {
    title: "Negotiate",
    description:
      "Analyze the market and home to draft a competitive offer and automate the associated paperwork.",
    icon: <Icon name="handshake" className="mobile-icon-lg text-text-secondary" />,
  },
  {
    title: "Purchase",
    description:
      "Use our timelines and paperwork to find and submit the appropriate paperwork, disclosures, etc, without paying legal fees.",
    icon: <Icon name="folder-lock" className="mobile-icon-lg text-text-secondary" />,
  },
] as const;
export function HomePageHeader() {
  return (
    <header className="px-responsive-sm border-border bg-background-surface fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between border-b py-2 shadow-lg sm:py-3">
      <Image src={LOGO} alt="SilverKey Logo" className="h-8 w-auto" />
      <div className="text-responsive-sm flex gap-1.5 font-medium sm:gap-2">
        <Link
          to={ROUTES.LOGIN}
          className="rounded-md px-3 py-2 hover:underline sm:px-4 sm:py-2.5 md:px-5"
        >
          Login
        </Link>
        <Link
          to={ROUTES.SIGNUP}
          className="bg-accent hover:bg-accent rounded-md px-3 py-2 text-white transition-colors sm:px-4 sm:py-2.5"
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
export function HomePageHero({ onStartNow }: { onStartNow: () => void }) {
  return (
    <main className="px-responsive-sm py-responsive-lg relative flex flex-1 flex-col items-center justify-center">
      <div className="absolute inset-0 z-0">
        <RippleBackground />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[85%] flex-col items-center">
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="bg-background-surface rounded-lg p-6 shadow-lg sm:p-8">
            <Title size="xl" as="h1" className="mb-4">
              Discover a New Way to Buy
            </Title>
            <BodyText size="lg" className="mb-6">
              Onboard, Search, Decide, Negotiate, Close
            </BodyText>
            <div className="mt-4 sm:mt-8">
              <Button onClick={onStartNow} variant="primary" size="md" className="w-1/2">
                Start Now
              </Button>
            </div>
          </div>
        </div>

        <div className="z-12 gap-responsive-sm relative mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((f, i) => (
            <div
              key={i}
              className="touch-friendly bg-background-surface flex cursor-pointer flex-col items-center rounded-xl p-4 text-center shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
            >
              <div className="mb-2">{f.icon}</div>
              <Title size="md" as="h3" className="mb-3 w-[87%]">
                {f.title}
              </Title>
              <BodyText size="sm" muted className="w-[87%]">
                {f.description}
              </BodyText>
            </div>
          ))}
        </div>

        <div className="gap-responsive-sm text-responsive-xs relative mt-10 flex flex-wrap items-center justify-center text-center">
          <Link
            to={ROUTES.PRIVACY}
            className="px-responsive-xl py-responsive-xs touch-friendly bg-background-surface text-text-secondary hover:text-text-primary flex items-center justify-center rounded-lg shadow transition-all duration-200 hover:shadow-md"
          >
            Privacy Policy
          </Link>
          <Link
            to={ROUTES.TERMS}
            className="px-responsive-xl py-responsive-xs touch-friendly bg-background-surface text-text-secondary hover:text-text-primary flex items-center justify-center rounded-lg shadow transition-all duration-200 hover:shadow-md"
          >
            Terms of Service
          </Link>
          <Link
            to={ROUTES.CONTACT}
            className="px-responsive-xl py-responsive-xs touch-friendly bg-background-surface text-text-secondary hover:text-text-primary flex items-center justify-center rounded-lg shadow transition-all duration-200 hover:shadow-md"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  );
}
export function HomePageAuthModal({
  onClose,
  onLogin,
  onSignUp,
}: {
  onClose: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}) {
  return (
    <div className="space-responsive-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="space-responsive-lg bg-background-surface w-full max-w-md rounded-2xl shadow">
        <div className="mb-4 flex justify-between">
          <div className="gap-responsive-xs flex items-center">
            <Icon name="lock" className="mobile-icon-sm text-text-secondary" />
            Account Required
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <BodyText size="sm" muted className="mb-4 text-center">
          Please log in or create an account to generate a report.
        </BodyText>
        <div className="flex gap-2 sm:gap-3">
          <Button onClick={onLogin} variant="outline" size="md" fullWidth>
            Login
          </Button>
          <Button onClick={onSignUp} variant="primary" size="md" fullWidth>
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}
