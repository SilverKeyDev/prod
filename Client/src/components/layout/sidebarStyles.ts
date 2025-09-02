// Consistent hover styles for all sidebar buttons
export const getButtonStyles = (isActive: boolean) => {
  const baseStyles =
    "w-full flex items-center py-3 transition-all duration-200 font-medium text-white touch-friendly rounded-lg";
  const activeStyles =
    "bg-brown-light/70 text-white font-semibold hover:bg-brown-light/80";
  const inactiveStyles =
    "text-white/70 hover:bg-brown-light/30 hover:text-beige hover:-translate-y-0.5 active:bg-brown-light/20 active:text-beige";

  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
};

export const getSubItemStyles = (isActive: boolean) => {
  const baseStyles =
    "flex items-center transition-all duration-200 font-medium text-white touch-friendly rounded-lg";
  const activeStyles =
    "bg-brown-light text-white font-semibold hover:bg-brown-light/80";
  const inactiveStyles =
    "text-white/50 hover:bg-brown-light/50 hover:text-beige hover:-translate-y-0.5 active:bg-brown-light/30 active:text-beige";

  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
};
