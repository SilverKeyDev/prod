// Base primitives (platform-resolved .web / .native; use for shared web/native code)
// These are true primitives that don't import from this barrel, preventing circular dependencies
export { ConnectedCardHeartSave } from "../../actions/button/ConnectedCardHeartSave";
export { Loading } from "../../media/asset/loading/Loading";
export { default as NotificationBadge } from "../../surfaces/badge/NotificationBadge";
export { Box } from "./box";
export { Button as Pressable } from "./button";
export { Input as PrimitiveInput } from "./input";
export { List } from "./list";
export { Image, Video } from "./media";
export { Row } from "./row";
export { ScrollView } from "./scroll";
export { Text } from "./text";
export { TouchableBox } from "./touchable";
export type { IconName } from "@ui/icons";
export type { IconProps } from "@ui/icons";
export { Icon } from "@ui/icons";

// NOTE: Higher-level UI components removed from this barrel to prevent circular dependencies.
// Import them directly from their paths:
// - Button: import Button from "@ui/button/Button"
// - IconButton: import IconButton from "@ui/button/IconButton"
// - NavigationButton: import NavigationButton from "@ui/button/NavigationButton"
// - Form components: import from "@ui/form/..."
// - Text components: import from "@ui/text/..."
// - Modal components: import from "@/components/modals/..."
// - Sidebar components: import from "@ui/sidebar/..."
// - etc.
