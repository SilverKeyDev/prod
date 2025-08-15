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
    <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4 mb-6">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <MiniLogo size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-navy">{title}</h1>
            <p className="text-navy/70">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
