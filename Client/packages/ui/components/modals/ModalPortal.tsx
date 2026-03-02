import { type ReactNode, useEffect, useState } from "react";

import { Portal } from "packages/ui/components/portal";

export default function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Portal>{children}</Portal>;
}
