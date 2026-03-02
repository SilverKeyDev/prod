// Responsive
export { useMediaQuery } from "./responsive";
export { type ResponsiveState, useIsMobile, useResponsive } from "./responsive";

// Feed
export { useFeedGestureTrap } from "../../features/feed/hooks/ui";
export { useFeedAxisLock } from "../../features/feed/hooks/ui";
export { useHlsVideo } from "../../features/feed/hooks/ui";
export { useReelsShortcuts, type UseReelsShortcutsParams } from "../../features/feed/hooks/ui";
export { useReelsCleanup } from "../../features/feed/hooks/ui";
export {
  useFeedScrollContainer,
  type UseFeedScrollContainerParams,
} from "../../features/feed/hooks/ui";

// Documents
export { useSavedPageEffects } from "../../features/documents/hooks/ui";
export { useSavedPageModals } from "../../features/documents/hooks/ui";
export { useSavedHomesDocuSign } from "../../features/documents/hooks/ui";

// Auth
export { formatTimeRemaining, useSessionTimeout } from "../../features/homeauth/hooks/ui";
export { useLocalStorage, type UseLocalStorageReturn } from "../../features/homeauth/hooks/ui";
export {
  checkStepUpRequired,
  useStepUpAuth,
  withStepUpAuth,
} from "../../features/homeauth/hooks/ui";

// Toast
export {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showToast,
  showWarningToast,
  useToast,
} from "./toast";

// Scroll
export { useMessageScroll } from "../../features/messaging/hooks/ui";

// Client messaging modals
export { useClientMessagingModals } from "../../features/messaging/hooks/ui/useClientMessagingModals";

// Container width
export { useContainerWidth, type UseContainerWidthOptions } from "./useContainerWidth";

// Clipboard
export { useSecureClipboardCopy } from "./clipboard";

// Core
export { useCountdown, type UseCountdownReturn } from "./core";
export { usePreActionSnapshot, type UsePreActionSnapshotReturn } from "./core";
export { useWhyRender } from "./core";
export { useHealthCheck } from "./core";
export { useModal, type UseModalReturn } from "./core";
export { useOnceEffect } from "./core";
