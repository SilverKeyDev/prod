interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({
  title,
}: MobileHeaderProps) {
  return (
    <div className="bg-white border-b border-beige/40 rounded-t-2xl mr-4 ml-1 mt-2 mb-2 relative z-30">
      <div className="px-2 py-2">
        <div className="flex items-center justify-center">
          <h1 className="text-base sm:text-lg font-bold text-navy text-center">{title}</h1>
        </div>
      </div>
    </div>
  );
}
