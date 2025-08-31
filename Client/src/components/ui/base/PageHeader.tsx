import MiniLogo from "./MiniLogo";
import Card from "./Card";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  contentWidth?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <Card
        className="hidden sm:block border-b border-beige/40 rounded-t-2xl rounded-b-none relative z-30"
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

      {/* Mobile Header */}
      <Card
        className="sm:hidden border-b border-beige/40 rounded-t-2xl rounded-b-none relative z-30"
        padding="sm"
      >
        <div className="flex items-center justify-center gap-2">
          <MiniLogo size="md" />
          <h1 className="heading-responsive-sm text-navy text-center">
            {title}
          </h1>
        </div>
      </Card>
    </>
  );
}
