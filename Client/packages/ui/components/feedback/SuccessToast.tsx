import type { ToastProps } from "./Toast";
import Toast from "./Toast";

type SuccessToastProps = Omit<ToastProps, "variant">;

export default function SuccessToast(props: SuccessToastProps) {
  return <Toast variant="success" {...props} />;
}
