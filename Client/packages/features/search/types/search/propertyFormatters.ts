/**
 * Property type formatting utilities.
 * Converts property types from various formats (ALL_CAPS, underscores, dashes) to readable text.
 */

/**
 * Converts property type strings from various formats to readable text.
 * Handles:
 * - All caps: "SINGLE_FAMILY" -> "Single Family"
 * - Underscores: "single_family" -> "Single Family"
 * - Dashes: "single-family" -> "Single Family"
 * - Mixed: "SINGLE-FAMILY" -> "Single Family"
 *
 * @param type - The property type string to format (e.g., "SINGLE_FAMILY", "CONDO-TOWNHOUSE")
 * @returns Formatted property type string (e.g., "Single Family", "Condo Townhouse") or "N/A" if empty
 */
export const formatPropertyType = (type?: string): string => {
  if (!type || type.trim() === "") return "N/A";

  // Replace underscores and dashes with spaces, then split by spaces
  const normalized = type.replace(/[_-]/g, " ");

  // Split by spaces and format each word
  return normalized
    .split(/\s+/)
    .filter((word) => word.length > 0) // Remove empty strings from multiple spaces
    .map((word) => {
      // Handle all caps words
      if (word === word.toUpperCase() && word.length > 1) {
        // Convert "SINGLE" -> "Single"
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      // Handle mixed case or already formatted words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};
