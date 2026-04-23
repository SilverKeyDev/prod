import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingStop,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

export type ViewingRoutePlanEditorProps = {
  viewingStops: ViewingStop[];
  onViewingStopsChange: (next: ViewingStop[]) => void;
  startSelection: ViewingTourStartSelection;
  onStartSelectionChange: (next: ViewingTourStartSelection) => void;
  endMode: ViewingRouteEndMode;
  onEndModeChange: (next: ViewingRouteEndMode) => void;
  endFixed: ViewingRouteEndpoint | null;
  onEndFixedChange: (next: ViewingRouteEndpoint | null) => void;
  savedAnchors: ViewingTourAnchor[];
  scriptsReady: boolean;
  loadError: string | null;
};
