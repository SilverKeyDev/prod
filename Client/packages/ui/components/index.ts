/**
 * Root barrel for packages/ui/components so that imports like
 * "packages/ui/components" and "@ui" resolve for both TypeScript and ESLint.
 */
export * from "./accessibility";
export * from "./backgrounds";
export * from "./feedback";
export * from "./primitives";
export * from "./text";

// Text components
export { default as BodyText } from "./text/BodyText";
export { default as Label } from "./text/Label.web";
export { default as PropertyStat } from "./text/PropertyStat";
export { default as Subtitle } from "./text/Subtitle";
export { default as Title } from "./text/Title";

// Form components (implementation paths — no root-level shim files)
export {
  type AddressData,
  AddressInput,
  type AddressInputProps,
} from "./form/AddressInput/AddressInput";
export { default as AccessibleCheckboxInput } from "./form/checkbox/AccessibleCheckboxInput";
export type { ChecklistItem } from "./form/checkbox/ChecklistCheckbox";
export { default as ChecklistCheckbox } from "./form/checkbox/ChecklistCheckbox";
export { default as OliveCheckbox } from "./form/checkbox/OliveCheckbox";
export type { OliveCheckboxRowLabelProps } from "./form/checkbox/OliveCheckboxRowLabel";
export { OliveCheckboxRowLabel } from "./form/checkbox/OliveCheckboxRowLabel";
export { default as Dropdown, type DropdownOption, type DropdownProps } from "./form/dropdown";
export { default as FavoriteHomesDropdown } from "./form/dropdowns/FavoriteHomesDropdown";
export { default as FieldShell } from "./form/field/FieldShell";
export { default as FormField, Textarea } from "./form/field/FormField";
export * from "./form/fileUploadStyles";
export { default as GooglePlacesAutocompleteField } from "./form/GooglePlacesAutocompleteField/GooglePlacesAutocompleteField";
export { default as AccessibleTextInput } from "./form/inputs/AccessibleTextInput";
export { default as Input, Input, type InputProps } from "./form/inputs/Input";
export { default as AccessibleRadioInput } from "./form/pickers/AccessibleRadioInput";
export { default as DateInput } from "./form/pickers/DateInput";
export { default as RangeInput } from "./form/pickers/RangeInput";
export { default as Select } from "./form/pickers/Select";
export { default as TimeInput } from "./form/pickers/TimeInput";
export { default as Toggle } from "./form/pickers/Toggle";

// Avatar
export type { ProfileAvatarProps } from "./avatar";
export { ProfileAvatar } from "./avatar";

// Asset/loading components
export { default as AppImage } from "./asset/AppImage";
export { default as KeyLogo } from "./asset/KeyLogo";
export { default as KeyTurnLoader } from "./asset/loading/KeyTurnLoader";
export { default as MiniLogo } from "./asset/MiniLogo";
export { default as StatusBadge } from "./asset/StatusBadge";
export { default as WhiteLogo } from "./asset/WhiteLogo";

// Security components
export { default as SecureFileUpload } from "./security/SecureFileUpload";

// Button components (implementation paths — no root-level shim files)
export { default as Button } from "./button/core/Button";
export { default as CancelButton } from "./button/core/CancelButton";
export { default as CloseButton } from "./button/core/CloseButton";
export { default as DropdownChevron } from "./button/core/DropdownChevron";
export { default as IconButton } from "./button/core/IconButton";
export {
  OVERLAY_MARKER_CIRCLE_CLASSES,
  OVERLAY_MARKER_ICON_BUTTON_SIZE,
  OVERLAY_MARKER_ICON_CLASSES,
} from "./button/core/overlayMarkerButtonTypes";
export { default as NavigationButton } from "./button/navigation/NavigationButton";
export { default as NavigationButtons, SkipButton } from "./button/navigation/NavigationButtons";
export { default as ClientSelector } from "./button/propertyActions/ClientSelector";
export { ConnectedCardHeartSave } from "./button/propertyActions/ConnectedCardHeartSave";
export { default as HeartSave } from "./button/propertyActions/HeartSave";
export { default as NotInterested } from "./button/propertyActions/NotInterested";

// Sidebar / inset two-column layouts
export { TwoColumnInsetPageLayout } from "./sidebar/TwoColumnInsetPageLayout";

// Layout components
export { default as AlignedRow } from "./layout/AlignedRow";
export { default as SectionCard } from "./layout/SectionCard";
export { default as Popover } from "./popover/Popover";

// Match score
export type { MatchPillProps } from "./match";
export { MatchPill } from "./match";

// Card components
export { default as BaseCard } from "./cards/BaseCard";
export { default as CompCard } from "./cards/CompCard";
export { default as HomeCard } from "./cards/HomeCard";
export { default as PropertyCard } from "./cards/property/PropertyCard";
export * from "./cards/property/PropertyCardBodySection";
export { default as ReportCard } from "./cards/ReportCard";

// Modal components
export { default as BaseModal } from "./modals/BaseModal";
export type { CoverAnimation, CoverProps } from "./modals/cover";
export { default as Cover } from "./modals/cover";
export { default as ModalPortal } from "./modals/ModalPortal";
export { default as ShareHomeModal } from "./modals/ShareHomeModal";
