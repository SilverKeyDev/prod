// Export the shared styles function for use in other components
// Uses direct responsive classes exactly like onboarding components
export const getSharedInputTextStyles = (): string => {
  return `text-gray-600 text-xs sm:text-sm md:text-base text-left leading-tight disabled:text-gray-400`;
};
