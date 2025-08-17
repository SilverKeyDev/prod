import MiniLogo from "./MiniLogo";

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
    <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4 mb-6">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <MiniLogo size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-navy">{title}</h1>
            <p className="text-navy/70">{subtitle}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {!loading && (
          <div className="mt-4">
            <p className="text-sm text-navy/70 mb-1">
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
  );
}
