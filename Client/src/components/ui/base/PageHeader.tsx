import MiniLogo from "./MiniLogo";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <div className="hidden sm:block bg-white border-b border-beige/40 rounded-t-2xl mx-responsive-sm my-responsive-sm relative z-30" style={{ maxWidth: '80vw' }}>
        <div className="mx-auto px-responsive-sm py-responsive-sm max-w-full">
          <div className="flex items-center gap-responsive-sm">
            <MiniLogo size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="heading-responsive-md text-navy truncate">{title}</h1>
              {subtitle && <p className="text-responsive-sm text-navy/70 truncate">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden bg-white border-b border-beige/40 rounded-t-2xl ml-16 mr-4 my-responsive-sm relative z-30">
        <div className="space-responsive-xs">
          <div className="flex items-center justify-center gap-2">
            <MiniLogo size="md" />
            <h1 className="heading-responsive-sm text-navy text-center">{title}</h1>
          </div>
        </div>
      </div>
    </>
  );
}
