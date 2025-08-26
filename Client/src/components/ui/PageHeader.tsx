import MiniLogo from "./MiniLogo";

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-1 sm:mx-2 mt-2 sm:mt-4 mb-4 sm:mb-6 relative z-30" style={{ maxWidth: '80vw' }}>
      <div className="mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-16 sm:ml-0">
          <MiniLogo size="md" className="sm:hidden" />
          <MiniLogo size="lg" className="hidden sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-navy truncate">{title}</h1>
            <p className="responsive-text-sm text-navy/70 truncate">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
