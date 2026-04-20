// Web UI barrel – re-exports from primitives so @ui and @/components/ui resolve
export * from "./primitives/index.web";
export * from "./text";

// Text components (explicit exports for commonly used ones)
export { default as PropertyStat } from "./text/PropertyStat";

// Avatar
export type { ProfileAvatarProps } from "./avatar";
export { ProfileAvatar } from "./avatar";

// Higher-level components that are frequently imported
export { default as Button } from "./button/Button";
export { default as CancelButton } from "./button/CancelButton";
export { default as ClientSelector } from "./button/ClientSelector";
export { default as CloseButton } from "./button/CloseButton";
export { ConnectedCardHeartSave } from "./button/ConnectedCardHeartSave";
export { default as DropdownChevron } from "./button/DropdownChevron";
export { default as HeartSave } from "./button/HeartSave";
export { default as IconButton } from "./button/IconButton";
export { default as NavigationButton } from "./button/NavigationButton";
export { default as NavigationButtons } from "./button/NavigationButtons";
export { default as NotInterested } from "./button/NotInterested";

// Accessibility components
export * from "./accessibility";

// Form components
export { default as AccessibleRadioInput } from "./form/AccessibleRadioInput";
export { default as AccessibleTextInput } from "./form/AccessibleTextInput";
export { AutoExpandingTextarea } from "./form/AutoExpandingTextarea";
export { default as AccessibleCheckboxInput } from "./form/checkbox/AccessibleCheckboxInput";
export { default as ChecklistCheckbox } from "./form/ChecklistCheckbox";
export { default as DateInput } from "./form/DateInput";
export { default as Dropdown } from "./form/dropdown";
export { default as FavoriteHomesDropdown } from "./form/FavoriteHomesDropdown";
export { default as FieldShell } from "./form/FieldShell";
export { default as FormField } from "./form/FormField";
export { Textarea } from "./form/FormField";
export { default as Input } from "./form/Input";
export { default as OliveCheckbox } from "./form/OliveCheckbox";
export { PhoneInput } from "./form/PhoneInput/PhoneInput";
export { default as RangeInput } from "./form/RangeInput";
export { default as Select } from "./form/Select";
export { default as TimeInput } from "./form/TimeInput";
export { default as Toggle } from "./form/Toggle";
export { default as VerificationCodeInput } from "./form/VerificationCodeInput";

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
