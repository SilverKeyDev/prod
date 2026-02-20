/**
 * Converts a report file path into a human-readable title.
 *
 * Example input:
 * 41eb4540-6061-7075-f969-126c4f7632d8/reports/standard/050509da2feb40628_1130_Grassland_Rd_Rancho_Mission_Viejo_CA_92694.pdf
 *
 * Output:
 * 1130 Grassland Rd Rancho Mission Viejo CA 92694
 */
export function extractReportTitleFromPath(path: string): string {
  // Get filename (everything after last slash)
  const filename = path.substring(path.lastIndexOf("/") + 1);

  // Remove extension (everything after last dot)
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf("."));

  // Remove first 17 characters
  const nameWithoutPrefix =
    nameWithoutExtension.length > 17
      ? nameWithoutExtension.substring(17)
      : nameWithoutExtension;

  // Replace underscores with spaces
  return nameWithoutPrefix.replace(/_/g, " ");
}
