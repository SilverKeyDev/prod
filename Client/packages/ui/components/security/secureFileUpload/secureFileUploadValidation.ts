import { formatFileSize } from "packages/services/security/imageProcessor";

export function buildSecureFileValidationErrors(
  file: File,
  maxSize: number,
  acceptedTypes: string[]
): string[] {
  const errors: string[] = [];
  if (file.size > maxSize) {
    errors.push(
      `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxSize)}.`
    );
  }
  if (!acceptedTypes.includes(file.type)) {
    errors.push(
      `File "${file.name}" has unsupported type (${file.type}). Accepted types: ${acceptedTypes.join(", ")}.`
    );
  }
  return errors;
}
