import Card from "../../components/layout/Card";
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
        <Card className="relative z-30 rounded-b-none rounded-t-2xl border-b border-beige/40 p-2 sm:p-3 lg:p-4">
          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center">
              {/* Title row with logo */}
              <div className="gap-2 lg:gap-3 xl:gap-4 flex items-center justify-center">
                <MiniLogo size="sm" className="lg:hidden" />
                <MiniLogo size="md" className="hidden lg:block xl:hidden" />
                <MiniLogo size="lg" className="hidden xl:block" />
                <h1 className="heading-responsive-md text-navy">{title}</h1>
              </div>

              {/* Subtitle */}
              <p className="text-responsive-sm text-navy/70 mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {!loading && (
            <div className="mt-2">
              {/* <p className="mb-1 text-center text-xs text-navy/70">
                {completedCount} of {totalCount} items completed
              </p> */}
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
      <div className="mx-auto w-full lg:hidden">
        <Card className="relative z-30 rounded-2xl border-b border-beige/40 p-1 sm:p-2">
          <div className="flex justify-center py-1">
            <div className="flex flex-col items-center">
              {/* Title row with logo */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                  <MiniLogo size="xs" className="sm:hidden" />
                  <MiniLogo size="sm" className="hidden sm:block" />
                </div>
                <h1 className="text-sm sm:text-base font-semibold text-navy">
                  {title}
                </h1>
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
