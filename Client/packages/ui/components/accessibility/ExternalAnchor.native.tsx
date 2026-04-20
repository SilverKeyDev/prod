import { Linking } from "react-native";

import { Text } from "packages/ui/components/primitives/text/Text";
import { TouchableBox } from "packages/ui/components/primitives/touchable";

import type { ExternalAnchorProps } from "./ExternalAnchor.types";

export function ExternalAnchor({
  href,
  children,
  className = "",
  label: labelProp,
}: ExternalAnchorProps) {
  const label = labelProp ?? href;

  return (
    <TouchableBox onPress={() => void Linking.openURL(href)} label={label} className={className}>
      {typeof children === "string" || typeof children === "number" ? (
        <Text className="text-brand-accent underline">{children}</Text>
      ) : (
        children
      )}
    </TouchableBox>
  );
}
