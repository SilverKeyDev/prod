import MiniLogo from "../base/MiniLogo";

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
      <div className="hidden sm:block bg-white border-b border-beige/40 rounded-t-2xl mx-responsive-sm my-responsive-sm relative z-30" style={{ maxWidth: '80vw' }}>
        <div className="mx-auto px-responsive-sm py-responsive-sm max-w-full">
          <div className="flex items-center gap-responsive-sm">
            <MiniLogo size="md" className="sm:hidden" />
            <MiniLogo size="lg" className="hidden sm:block" />
            <div className="min-w-0 flex-1">
              <h1 className="heading-responsive-md text-navy truncate">{title}</h1>
              <p className="text-responsive-sm text-navy/70 truncate">{subtitle}</p>
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
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden bg-white border-b border-beige/40 rounded-t-2xl ml-16 mr-4 my-responsive-sm relative z-30">
        <div className="space-responsive-xs">
          <div className="flex items-center justify-center">
            <h1 className="heading-responsive-sm text-navy text-center">{title}</h1>
          </div>
          
          {/* Progress Bar */}
          {!loading && (
            <div className="mt-3">
              <p className="text-xs text-navy/70 mb-2 text-center">
                {completedCount} of {totalCount} completed
              </p>
              <div className="w-full h-1.5 bg-beige/30 rounded">
                <div
                  className="h-full bg-olive rounded transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
