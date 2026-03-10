import { useEffect } from "react";

import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { useUIStore } from "packages/store";
import { Text } from "packages/ui/components/primitives";
import { SHADOW_OFFSET_ELEVATED } from "packages/ui/styles/shadows.native";

const TOAST_DURATION_MS = 3000;

export function ToastsPortalNative() {
  const activeToastId = useUIStore((s) => s.activeToastId);
  const toastQueue = useUIStore((s) => s.toastQueue);
  const dequeueToast = useUIStore((s) => s.dequeueToast);

  const activeToast = toastQueue.find((t) => t.id === activeToastId) ?? toastQueue[0];

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(
      () => {
        dequeueToast(activeToast.id);
      },
      activeToast.type === "error" ? 5000 : TOAST_DURATION_MS
    );
    return () => clearTimeout(timer);
  }, [activeToast?.id, activeToast?.type, dequeueToast]);

  if (!activeToast) return null;

  const onClose = () => dequeueToast(activeToast.id);
  const isError = activeToast.type === "error";

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.toast, isError ? styles.toastError : styles.toastSuccess]}>
        <Text
          style={[styles.message, isError ? styles.messageError : styles.messageSuccess]}
          numberOfLines={2}
        >
          {activeToast.message}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.close}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    maxWidth: "100%",

    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 4px rgba(0,0,0,0.15)" }
      : {
          shadowColor: "#000",
          shadowOffset: SHADOW_OFFSET_ELEVATED,
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }),
  },
  toastSuccess: {
    backgroundColor: "#A3B18A",
  },
  toastError: {
    backgroundColor: "#F43F5E",
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  messageSuccess: {
    color: "#fff",
  },
  messageError: {
    color: "#fff",
  },
  close: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "300",
  },
});
