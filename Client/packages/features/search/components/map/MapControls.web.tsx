import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";

import { Button } from "@/components/ui";
export function MapControls(props: {
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
}): JSX.Element {
  const { page, total, perPage, onPrev, onNext, onZoomIn, onZoomOut, disabled = false } = props;
  const { t } = useLocalization();
  const showNavigation = total > perPage;
  const currentItem = Math.min((page + 1) * perPage, total);
  const isPrevDisabled = page === 0;
  const isNextDisabled = (page + 1) * perPage >= total;
  // Unified controls (single layout, equal button sizing)
  return (
    <>
      {/* Zoom Controls */}
      <div className="absolute bottom-[calc(3rem+4rem+env(safe-area-inset-bottom))] left-8 z-10 flex flex-row gap-1 md:bottom-12">
        <Button
          type="button"
          onClick={onZoomOut}
          disabled={disabled}
          variant="secondary"
          size="xs"
          className="hover:border-primary hover:text-primary focus:ring-accent-muted border-border bg-background-surface text-text-secondary hover:bg-background-surface h-8 w-8 border p-0 shadow-md transition-all duration-200 hover:shadow-lg focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10"
          title={t("search.zoom_out")}
        >
          {t("search.zoom_out_symbol")}
        </Button>
        <Button
          type="button"
          onClick={onZoomIn}
          disabled={disabled}
          variant="secondary"
          size="xs"
          className="hover:border-primary hover:text-primary focus:ring-accent-muted border-border bg-background-surface text-text-secondary hover:bg-background-surface h-8 w-8 border p-0 shadow-md transition-all duration-200 hover:shadow-lg focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10"
          title={t("search.zoom_in")}
        >
          {t("search.zoom_in_symbol")}
        </Button>
      </div>

      {/* Property Navigation Controls (aligned and same size as zoom) */}
      {showNavigation && (
        <div className="absolute bottom-[calc(3rem+4rem+env(safe-area-inset-bottom))] right-8 z-10 flex flex-row gap-1 md:bottom-12">
          <Button
            type="button"
            onClick={onPrev}
            disabled={isPrevDisabled || disabled}
            variant="secondary"
            size="xs"
            className="hover:border-primary hover:text-primary focus:ring-accent-muted border-border bg-background-surface text-text-secondary hover:bg-background-surface disabled:hover:border-border disabled:hover:bg-background-surface disabled:hover:text-text-secondary h-8 w-8 border p-0 shadow-md transition-all duration-200 hover:shadow-lg focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10"
            title={t("search.previous_properties")}
          >
            <Icon name="chevron-left" className="h-3 w-3 lg:h-3 lg:w-3" />
          </Button>
          <div className="border-border bg-background-surface text-text-secondary flex h-8 w-auto items-center justify-center rounded-lg border px-2 text-xs font-medium shadow-md lg:h-10 lg:px-2 lg:text-xs">
            {t("search.page_of", { current: currentItem, total })}
          </div>
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || disabled}
            variant="secondary"
            size="xs"
            className="hover:border-primary hover:text-primary focus:ring-accent-muted border-border bg-background-surface text-text-secondary hover:bg-background-surface disabled:hover:border-border disabled:hover:bg-background-surface disabled:hover:text-text-secondary h-8 w-8 border p-0 shadow-md transition-all duration-200 hover:shadow-lg focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10"
            title={t("search.next_properties")}
          >
            <Icon name="chevron-right" className="h-3 w-3 lg:h-3 lg:w-3" />
          </Button>
        </div>
      )}
    </>
  );
}
