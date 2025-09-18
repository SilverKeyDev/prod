import MiniLogo from '../../../components/ui/asset/MiniLogo';

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  logoSize?: 'xs' | 'sm' | 'md' | 'lg' | 'header';
  titleClassName?: string;
  subtitleClassName?: string;
  containerClassName?: string;
};

export default function AuthHeader({
  title,
  subtitle,
  logoSize = 'lg',
  titleClassName = 'text-responsive-2xl font-serif text-black mb-2 flex items-center justify-center',
  subtitleClassName = 'text-black/60 font-light text-responsive-xs mb-8',
  containerClassName = 'text-center space-y-2',
}: AuthHeaderProps) {
  return (
    <div className={containerClassName}>
      <h2 className={titleClassName}>
        <MiniLogo size={logoSize} />
        <span className="ml-3">{title}</span>
      </h2>
      {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
    </div>
  );
}
