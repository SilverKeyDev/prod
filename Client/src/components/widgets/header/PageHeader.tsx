import { Card } from "../../format";
import { MiniLogo } from "../../ui/asset/MiniLogo";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  contentWidth?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <div className="hidden sm:mx-auto sm:block sm:max-w-[90vw] sm:px-4 md:px-6 lg:px-8">
        <Card
          className="relative z-30 rounded-b-none rounded-t-2xl border-b border-beige/40"
          padding="sm"
        >
          <div className="gap-responsive-sm flex items-center">
            <MiniLogo size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="heading-responsive-md truncate text-navy">
                {title}
              </h1>
              {subtitle && (
                <p className="text-responsive-sm truncate text-navy/70">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Header */}
      <Card
        className="relative z-30 rounded-2xl border-b border-beige/40 sm:hidden"
        padding="sm"
      >
        <div className="gap-responsive-sm flex items-center">
          <MiniLogo size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="heading-responsive-sm truncate text-navy">
              {title}
            </h1>
            {/* No subtitle on mobile - following ClosePageHeader pattern */}
          </div>
        </div>
      </Card>
    </>
  );
}
