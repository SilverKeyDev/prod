// Web UI barrel – re-exports from primitives so @ui and @/components/ui resolve
export * from "./structure/primitives/index.web";
export * from "./structure/text";

// Text components (explicit exports for commonly used ones)
export { default as PropertyStat } from "./structure/text/PropertyStat";

// Avatar
export type { ProfileAvatarProps } from "./media/avatar";
export { ProfileAvatar } from "./media/avatar";

// Higher-level components that are frequently imported
export { default as Button } from "./actions/button/core/Button";
export { default as CancelButton } from "./actions/button/core/CancelButton";
export { default as CloseButton } from "./actions/button/core/CloseButton";
export { default as DropdownChevron } from "./actions/button/core/DropdownChevron";
export { default as IconButton } from "./actions/button/core/IconButton";
export {
  OVERLAY_MARKER_CIRCLE_CLASSES,
  OVERLAY_MARKER_ICON_BUTTON_SIZE,
  OVERLAY_MARKER_ICON_CLASSES,
} from "./actions/button/core/overlayMarkerButtonTypes";
export { default as NavigationButton } from "./actions/button/navigation/NavigationButton";
export {
  default as NavigationButtons,
  SkipButton,
} from "./actions/button/navigation/NavigationButtons";
export { default as ClientSelector } from "./actions/button/propertyActions/ClientSelector";
export { ConnectedCardHeartSave } from "./actions/button/propertyActions/ConnectedCardHeartSave";
export { default as HeartSave } from "./actions/button/propertyActions/HeartSave";
export { default as NotInterested } from "./actions/button/propertyActions/NotInterested";

// Accessibility components
export * from "./system/accessibility";

// Form components
export {
  type AddressData,
  AddressInput,
  type AddressInputProps,
} from "./inputs/form/AddressInput/AddressInput";
export { default as AccessibleCheckboxInput } from "./inputs/form/checkbox/AccessibleCheckboxInput";
export { default as ChecklistCheckbox } from "./inputs/form/checkbox/ChecklistCheckbox";
export { default as OliveCheckbox } from "./inputs/form/checkbox/OliveCheckbox";
export type { OliveCheckboxRowLabelProps } from "./inputs/form/checkbox/OliveCheckboxRowLabel";
export { OliveCheckboxRowLabel } from "./inputs/form/checkbox/OliveCheckboxRowLabel";
export {
  default as Dropdown,
  type DropdownOption,
  type DropdownProps,
  default as MultiSelectDropdown,
  type MultiSelectDropdownProps,
} from "./inputs/form/dropdown";
export { default as FavoriteHomesDropdown } from "./inputs/form/dropdowns/FavoriteHomesDropdown";
export { default as FieldShell } from "./inputs/form/field/FieldShell";
export { default as FormField } from "./inputs/form/field/FormField";
export { Textarea } from "./inputs/form/field/FormField";
export * from "./inputs/form/fileUploadStyles";
export { default as GooglePlacesAutocompleteField } from "./inputs/form/GooglePlacesAutocompleteField/GooglePlacesAutocompleteField";
export { default as AccessibleTextInput } from "./inputs/form/inputs/AccessibleTextInput";
export { AutoExpandingTextarea } from "./inputs/form/inputs/AutoExpandingTextarea";
export { default as Input } from "./inputs/form/inputs/Input";
export { default as VerificationCodeInput } from "./inputs/form/inputs/VerificationCodeInput";
export { PhoneInput } from "./inputs/form/PhoneInput/PhoneInput";
export { default as AccessibleRadioInput } from "./inputs/form/pickers/AccessibleRadioInput";
export { default as DateInput } from "./inputs/form/pickers/DateInput";
export { default as RangeInput } from "./inputs/form/pickers/RangeInput";
export { default as Select } from "./inputs/form/pickers/Select";
export { default as TimeInput } from "./inputs/form/pickers/TimeInput";
export { default as Toggle } from "./inputs/form/pickers/Toggle";
export {
  BudgetRangeSlider,
  type BudgetRangeSliderProps,
  BudgetSlider,
  EditModeCheckbox,
  type EditModeCheckboxProps,
  FORM_EMPTY_VALUE_LABEL,
  FormFieldLabel,
  type FormFieldLabelProps,
  OnPerLabel,
  OptionalLabel,
  OptionTagInput,
  type OptionTagInputProps,
  type OptionTagOption,
  PriceRangeSlider,
  ProfileCheckbox,
  RequiredLabel,
  TagChip,
  type TagChipProps,
  TagInput,
  type TagInputProps,
  useSliderTickMapping,
} from "./inputs/form/preferences";

// Layout components
export { default as AlignedRow } from "./structure/layout/AlignedRow";
export { default as Card } from "./structure/layout/Card.web";
export { ResponsiveEqualColumns } from "./structure/layout/ResponsiveEqualColumns";
export {
  SCROLL_PANEL_MAX,
  ScrollPanel,
  type ScrollPanelProps,
} from "./structure/layout/ScrollPanel";
export { default as SectionCard } from "./structure/layout/SectionCard";
export { default as Popover } from "./surfaces/popover/Popover";

// Modal components
export { default as BaseModal } from "./surfaces/modals/BaseModal";
export type { CoverAnimation, CoverProps } from "./surfaces/modals/cover";
export { default as Cover } from "./surfaces/modals/cover";
export { default as ModalPortal } from "./surfaces/modals/ModalPortal";
export { default as ShareHomeModal } from "./surfaces/modals/ShareHomeModal";
export { default as DeleteModal } from "./surfaces/modals/standalone/DeleteModal";

// Card components
export { default as BaseCard } from "./surfaces/cards/BaseCard";
export { default as CompCard } from "./surfaces/cards/CompCard";
export { default as HomeCard } from "./surfaces/cards/HomeCard";
export { default as PropertyCard } from "./surfaces/cards/property/PropertyCard";
export * from "./surfaces/cards/property/PropertyCardBodySection";
export { default as WhyNotInterestedCard } from "./surfaces/cards/property/WhyNotInterestedCard.web";
export { default as ReportCard } from "./surfaces/cards/ReportCard";

// Data visualization (charts)
export type {
  ChartLegendItem,
  ChartLegendProps,
  DonutChartProps,
  LabeledBarRowProps,
  LollipopChartProps,
  VerticalBarChartProps,
} from "./data-viz";
export {
  ChartLegend,
  DonutChart,
  LabeledBarRow,
  LollipopChart,
  VerticalBarChart,
} from "./data-viz";

// Asset components
export { default as AppImage } from "./media/asset/AppImage";
export { default as KeyLogo } from "./media/asset/KeyLogo";
export { default as KeyTurnLoader } from "./media/asset/loading/KeyTurnLoader";
export { default as MiniLogo } from "./media/asset/MiniLogo";
export { default as StatusBadge } from "./media/asset/StatusBadge";
export { default as WhiteLogo } from "./media/asset/WhiteLogo";

// Security components
export { SecureFileUpload } from "./system/security/SecureFileUpload";

// Tab components
export { UnderlineTabs } from "./structure/tabs/UnderlineTabs";

// Portal components
export { Portal } from "./structure/portal/Portal.web";
