import MiniLogo from "../base/MiniLogo";
import Card from "../base/Card";

interface ClosePageHeaderProps {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading?: boolean;
}

export default function ClosePageHeader({
  title,
  subtitle,
  completedCount,
  totalCount,
  loading = false,
}: ClosePageHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <div className="hidden sm:block sm:max-w-[90vw] sm:mx-auto sm:px-4 md:px-6 lg:px-8">
        <Card
          className="border-b border-beige/40 rounded-t-2xl rounded-b-none relative z-30"
          padding="sm"
        >
        <div className="flex items-center gap-responsive-sm">
          <MiniLogo size="md" className="sm:hidden" />
          <MiniLogo size="lg" className="hidden sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="heading-responsive-md text-navy truncate">
              {title}
            </h1>
            <p className="text-responsive-sm text-navy/70 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {!loading && (
          <div className="mt-4">
            <p className="text-xs text-navy/70 mb-2">
              {completedCount} of {totalCount} items completed
            </p>
            <div className="w-full h-2 bg-beige/30 rounded">
              <div
                className="h-full bg-olive rounded transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
        </Card>
      </div>

      {/* Mobile Header */}
      <Card
        className="sm:hidden border-b border-beige/40 rounded-2xl relative z-30"
        padding="sm"
      >
        <div className="flex items-center gap-2">
          <MiniLogo size="sm" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-semibold text-navy truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        {!loading && (
          <div className="mt-1">
            <div className="w-full h-1 bg-beige/30 rounded">
              <div
                className="h-full bg-olive rounded transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
