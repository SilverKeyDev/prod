/**
 * Property type formatting utilities.
 * Converts property types from various formats (ALL_CAPS, underscores, dashes) to readable text.
 */
export const formatPropertyType = (type?: string): string => {
  if (!type || type.trim() === "") return "N/A";

  const normalized = type.replace(/[_-]/g, " ");

  return normalized
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      if (word === word.toUpperCase() && word.length > 1) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};
