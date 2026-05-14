import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes; later tokens win. Use for design-system + consumer `className`. */
export function twMergeClasses(...inputs: Array<string | undefined | false>): string {
  const parts = inputs.filter(Boolean) as string[];
  return parts.length ? twMerge(...parts) : "";
}
