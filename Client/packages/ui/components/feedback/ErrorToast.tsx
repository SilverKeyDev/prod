import type { ToastProps } from "./Toast";
import Toast from "./Toast";

type ErrorToastProps = Omit<ToastProps, "variant">;

export default function ErrorToast(props: ErrorToastProps) {
  return <Toast variant="error" {...props} />;
}
