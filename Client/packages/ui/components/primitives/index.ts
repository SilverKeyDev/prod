// Base primitives (platform-resolved .web / .native; use for shared web/native code)
export { Box } from "./box";
export { Button as Pressable } from "./button";
export { Input as PrimitiveInput } from "./input";
export { List } from "./list";
export { Image, Video } from "./media";
export { ScrollView } from "./scroll";
export { Text } from "./text";

// UI Components - Buttons
export { default as Button } from "@ui/button/Button";
export { default as IconButton } from "@ui/button/IconButton";
export { default as NavigationButton } from "@ui/button/NavigationButton";
export { default as NavigationButtons } from "@ui/button/NavigationButtons";

// UI Components - Form
export { default as OliveCheckbox } from "@ui/form/checkbox/OliveCheckbox";
export { default as ChecklistCheckbox } from "@ui/form/ChecklistCheckbox";
export { default as Dropdown } from "@ui/form/Dropdown";
export { default as FavoriteHomesDropdown } from "@ui/form/FavoriteHomesDropdown";
export { default as FieldShell } from "@ui/form/FieldShell";
export { default as FormField } from "@ui/form/FormField";
export { default as Input } from "@ui/form/Input";
export { default as PhoneInput } from "@ui/form/PhoneInput/PhoneInput";
export { default as Toggle } from "@ui/form/Toggle";

// UI Components - Text
export { default as Label } from "@ui/text/Label.web";
export { default as Subtitle } from "@ui/text/Subtitle";
export { default as Title } from "@ui/text/Title";

// UI Components - Assets
export { default as KeyLogo } from "@ui/asset/KeyLogo";
export { default as MiniLogo } from "@ui/asset/MiniLogo";
export { default as StatusBadge } from "@ui/asset/StatusBadge";

// UI Components - Loading
export { default as KeyTurnLoader } from "@ui/asset/loading/KeyTurnLoader.web";
export { default as Loading } from "@ui/asset/loading/Loading";

// Cards - now exported from cards folder
export { default as BaseCard } from "@ui/cards/BaseCard";
export { default as PropertyCard } from "@ui/cards/PropertyCard";

// Modal Components
export { default as BaseModal } from "@ui/modals/BaseModal";

// Re-export types
export type { StatusBadgeProps } from "@ui/asset/StatusBadge";
export type { ButtonProps } from "@ui/button/Button";
export type { IconButtonProps } from "@ui/button/IconButton";
export type { BaseCardProps } from "@ui/cards/BaseCard";
export type { PropertyCardProps } from "@ui/cards/PropertyCard";
export type { PhoneInputProps } from "@ui/form/PhoneInput/PhoneInput";
export type { BaseModalProps } from "@ui/modals/BaseModal";
export type { LabelProps } from "@ui/text/Label.web";
