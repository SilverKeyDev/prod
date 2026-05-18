import { Box } from "packages/ui/components/primitives";

/**
 * Left-edge indicator for a selected messaging inset list row.
 * Real DOM node (not border-l utilities) so purge/order cannot show gold/destructive accents.
 */
export function SidebarInsetListSelectionStripe() {
  return (
    <Box
      aria-hidden
      className="bg-olive z-sidebar pointer-events-none absolute bottom-0 left-0 top-0 w-1"
    />
  );
}
