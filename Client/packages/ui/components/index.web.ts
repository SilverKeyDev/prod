// Web UI barrel – re-exports from primitives so @ui and @/components/ui resolve
export * from "./primitives/index.web";
export * from "./text";

// Text components (explicit exports for commonly used ones)
export { default as PropertyStat } from "./text/PropertyStat";

// Avatar
export type { ProfileAvatarProps } from "./avatar";
export { ProfileAvatar } from "./avatar";

// Higher-level components that are frequently imported
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

// Accessibility components
export * from "./accessibility";

// Form components
export {
  type AddressData,
  AddressInput,
  type AddressInputProps,
} from "./form/AddressInput/AddressInput";
export { default as AccessibleCheckboxInput } from "./form/checkbox/AccessibleCheckboxInput";
export { default as ChecklistCheckbox } from "./form/checkbox/ChecklistCheckbox";
export { default as OliveCheckbox } from "./form/checkbox/OliveCheckbox";
export type { OliveCheckboxRowLabelProps } from "./form/checkbox/OliveCheckboxRowLabel";
export { OliveCheckboxRowLabel } from "./form/checkbox/OliveCheckboxRowLabel";
export { default as Dropdown, type DropdownOption, type DropdownProps } from "./form/dropdown";
export { default as FavoriteHomesDropdown } from "./form/dropdowns/FavoriteHomesDropdown";
export { default as FieldShell } from "./form/field/FieldShell";
export { default as FormField } from "./form/field/FormField";
export { Textarea } from "./form/field/FormField";
export * from "./form/fileUploadStyles";
export { default as GooglePlacesAutocompleteField } from "./form/GooglePlacesAutocompleteField/GooglePlacesAutocompleteField";
export { default as AccessibleTextInput } from "./form/inputs/AccessibleTextInput";
export { AutoExpandingTextarea } from "./form/inputs/AutoExpandingTextarea";
export { default as Input } from "./form/inputs/Input";
export { default as VerificationCodeInput } from "./form/inputs/VerificationCodeInput";
export { PhoneInput } from "./form/PhoneInput/PhoneInput";
export { default as AccessibleRadioInput } from "./form/pickers/AccessibleRadioInput";
export { default as DateInput } from "./form/pickers/DateInput";
export { default as RangeInput } from "./form/pickers/RangeInput";
export { default as Select } from "./form/pickers/Select";
export { default as TimeInput } from "./form/pickers/TimeInput";
export { default as Toggle } from "./form/pickers/Toggle";

// Layout components
export { default as AlignedRow } from "./layout/AlignedRow";
export { default as Card } from "./layout/Card.web";
export { default as SectionCard } from "./layout/SectionCard";
export { default as Popover } from "./popover/Popover";

// Modal components
export { default as BaseModal } from "./modals/BaseModal";
export type { CoverAnimation, CoverProps } from "./modals/cover";
export { default as Cover } from "./modals/cover";
export { default as ModalPortal } from "./modals/ModalPortal";
export { default as ShareHomeModal } from "./modals/ShareHomeModal";
export { default as DeleteModal } from "./modals/standalone/DeleteModal";

// Card components
export { default as BaseCard } from "./cards/BaseCard";
export { default as CompCard } from "./cards/CompCard";
export { default as HomeCard } from "./cards/HomeCard";
export { default as PropertyCard } from "./cards/property/PropertyCard";
export * from "./cards/property/PropertyCardBodySection";
export { default as WhyNotInterestedCard } from "./cards/property/WhyNotInterestedCard.web";
export { default as ReportCard } from "./cards/ReportCard";

// Asset components
export { default as AppImage } from "./asset/AppImage";
export { default as KeyLogo } from "./asset/KeyLogo";
export { default as KeyTurnLoader } from "./asset/loading/KeyTurnLoader";
export { default as MiniLogo } from "./asset/MiniLogo";
export { default as StatusBadge } from "./asset/StatusBadge";
export { default as WhiteLogo } from "./asset/WhiteLogo";

// Security components
export { SecureFileUpload } from "./security/SecureFileUpload";

// Tab components
export { UnderlineTabs } from "./tabs/UnderlineTabs";

// Portal components
export { Portal } from "./portal/Portal.web";
