import Card from "../../components/format/Card";
import MiniLogo from "../../components/ui/asset/MiniLogo";

type ClosePageHeaderProps = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading?: boolean;
};

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
      <div className="hidden lg:mx-auto lg:block lg:max-w-[90vw] lg:px-4 xl:px-6 2xl:px-8">
        <Card
          className="relative z-30 rounded-b-none rounded-t-2xl border-b border-beige/40"
          padding="sm"
        >
          <div className="flex justify-center">
            <div className="gap-responsive-sm flex items-center">
              <MiniLogo size="lg" />
              <div className="min-w-0">
                <h1 className="heading-responsive-md text-navy">{title}</h1>
                <p className="text-responsive-sm text-navy/70">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!loading && (
            <div className="mt-4">
              <p className="mb-2 text-center text-xs text-navy/70">
                {completedCount} of {totalCount} items completed
              </p>
              <div className="h-2 w-full rounded bg-beige/30">
                <div
                  className="h-full rounded bg-olive transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile Header */}
      <div className="mx-auto w-3/4 lg:hidden">
        <Card
          className="relative z-30 rounded-2xl border-b border-beige/40"
          padding="sm"
        >
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <MiniLogo size="md" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-navy">{title}</h1>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!loading && (
            <div className="mt-1">
              <div className="h-1 w-full rounded bg-beige/30">
                <div
                  className="h-full rounded bg-olive transition-all duration-500"
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
