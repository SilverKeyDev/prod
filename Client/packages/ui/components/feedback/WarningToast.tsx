import type { ToastProps } from "./Toast";
import Toast from "./Toast";

type WarningToastProps = Omit<ToastProps, "variant">;

export default function WarningToast(props: WarningToastProps) {
  return <Toast variant="warning" {...props} />;
}
