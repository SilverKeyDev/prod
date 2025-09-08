import { MiniLogo } from "../../components/ui";
import { Card } from "../../components/layout";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  contentWidth?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <div className="hidden sm:block sm:max-w-[90vw] sm:mx-auto sm:px-4 md:px-6 lg:px-8">
        <Card
          className="border-b border-beige/40 rounded-t-2xl rounded-b-none relative z-30"
          padding="sm"
        >
          <div className="flex items-center gap-responsive-sm">
            <MiniLogo size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="heading-responsive-md text-navy truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-responsive-sm text-navy/70 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Header */}
      <Card
        className="sm:hidden border-b border-beige/40 rounded-2xl relative z-30"
        padding="sm"
      >
        <div className="flex items-center gap-responsive-sm">
          <MiniLogo size="md" />
          <div className="min-w-0 flex-1">
            <h1 className="heading-responsive-sm text-navy truncate">
              {title}
            </h1>
            {/* No subtitle on mobile - following ClosePageHeader pattern */}
          </div>
        </div>
      </Card>
    </>
  );
}
