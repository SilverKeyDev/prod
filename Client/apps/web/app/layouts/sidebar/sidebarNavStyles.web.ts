export function getButtonStyles(isActive: boolean): string {
  const baseStyles =
    "w-full flex items-center py-3 transition-all duration-200 font-medium touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-white/10 hover:bg-white/10";
  const activeStyles = `${hoverActiveStyles} text-white font-bold`;
  const inactiveStyles =
    "text-white/80 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:bg-white/10 active:text-white";
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

export function getSubItemStyles(isActive: boolean): string {
  const baseStyles =
    "flex items-center transition-all duration-200 font-medium touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-white/10 hover:bg-white/10";
  const activeStyles = `${hoverActiveStyles} text-white font-bold`;
  const inactiveStyles =
    "text-white/80 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:bg-white/10 active:text-white";
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}
