import { StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color, Z_LAYERS } from "packages/design-tokens";
import IconButton from "packages/ui/components/button/IconButton";
import { Text } from "packages/ui/components/primitives";
import { shadowStyleForToken } from "packages/ui/styles/shadows.native";

import type { ToastVariant } from "./toastTypes";

export type ToastNativeProps = {
  variant: ToastVariant;
  message: string;
  onClose: () => void;
};

function surfaceBackground(v: ToastVariant): string {
  switch (v) {
    case "error":
      return color("rose.50");
    case "success":
      return color("green.50");
    case "warning":
      return color("yellow.50");
    default:
      return color("blue.50");
  }
}

/**
 * Presentational toast matching web {@link ./Toast} variants and neutral dismiss.
 */
export function ToastNative({ variant, message, onClose }: ToastNativeProps) {
  const { t } = useLocalization();
  const closeLabel = t("feedback.close_aria");
  const bg = surfaceBackground(variant);

  const messageColumn =
    variant === "error" ? (
      <View style={styles.messageColumn}>
        <Text className="text-sm font-semibold text-rose-800">{t("feedback.error_title")}</Text>
        <Text className="mt-1 text-xs leading-relaxed text-rose-600" numberOfLines={4}>
          {message}
        </Text>
      </View>
    ) : (
      <View style={styles.messageColumn}>
        <Text
          className={
            variant === "success"
              ? "text-sm font-semibold leading-relaxed text-green-800"
              : variant === "warning"
                ? "text-sm font-semibold leading-relaxed text-yellow-800"
                : "text-sm font-semibold leading-relaxed text-blue-800"
          }
          numberOfLines={4}
        >
          {message}
        </Text>
      </View>
    );

  return (
    <View style={styles.shell} pointerEvents="box-none">
      <View
        style={[
          styles.surface,
          { backgroundColor: bg },
          shadowStyleForToken("elevated", color("neutral.900")),
        ]}
      >
        {messageColumn}
        <IconButton
          variant="ghost"
          size="sm"
          label={closeLabel}
          iconName="x"
          onPress={onClose}
          className="shrink-0 text-neutral-500 active:opacity-70"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    zIndex: Z_LAYERS.toast,
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: "flex-end",
    maxWidth: "100%",
  },
  surface: {
    maxWidth: 400,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("border"),
    gap: 8,
  },
  messageColumn: {
    flex: 1,
    minWidth: 0,
  },
});
