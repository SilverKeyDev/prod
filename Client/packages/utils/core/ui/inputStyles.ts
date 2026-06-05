export function getSharedInputTextStyles(): string {
  /** Base `text-base` avoids iOS zoom on focus (see documentation/client/standards/responsive-ui-standards.md WEB-7). */
  return "text-gray-600 text-base text-left leading-tight disabled:text-gray-400";
}
