// Base primitives (platform-resolved .web / .native; use for shared web/native code)
// These are true primitives that don't import from this barrel, preventing circular dependencies
// NOTE: Loading and ConnectedCardHeartSave removed - they import from this barrel causing cycles.
// Import from: packages/ui/components/media/asset/loading/Loading, packages/ui/components/actions/button/ConnectedCardHeartSave
export { BlurView } from "./blur";
export { Box } from "./box";
export { Button as Pressable } from "./button";
export { DashedDivider } from "./divider";
export { UniversalGradient } from "./gradient";
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
// - Form components: import from "@ui/form/..."
// - Text components: import from "@ui/text/..."
// - etc.
