import MiniLogo from "../../components/ui/asset/MiniLogo";
import Card from "../../components/layout/Card";

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
      <div className="hidden lg:block lg:max-w-[90vw] lg:mx-auto lg:px-4 xl:px-6 2xl:px-8">
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
      <div className="lg:hidden w-3/4 mx-auto">
        <Card
          className="border-b border-beige/40 rounded-2xl relative z-30"
          padding="sm"
        >
          <div className="flex items-center justify-start gap-3">
            <div className="flex-shrink-0">
              <MiniLogo size="md" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold text-navy truncate">
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
      </div>
    </>
  );
}
