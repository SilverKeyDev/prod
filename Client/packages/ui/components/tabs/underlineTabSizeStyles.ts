export type UnderlineTabsSize = "sm" | "md" | "lg";

export type UnderlineTabSizeStyleSet = {
  activeText: string;
  inactiveText: string;
  activeIcon: string;
  inactiveIcon: string;
  paddingCompact: string;
  paddingDefault: string;
};

export const UNDERLINE_TAB_SIZE_STYLES: Record<
  UnderlineTabsSize,
  UnderlineTabSizeStyleSet
> = {
  sm: {
    activeText: "text-responsive-md",
    inactiveText: "text-responsive-sm",
    activeIcon: "h-5 w-5",
    inactiveIcon: "h-4 w-4",
    paddingCompact:
      "relative flex flex-row items-center justify-center px-responsive-sm py-responsive-xs",
    paddingDefault:
      "relative flex flex-row flex-1 items-center justify-center px-responsive-md py-responsive-sm",
  },
  md: {
    activeText: "text-responsive-lg",
    inactiveText: "text-responsive-md",
    activeIcon: "h-6 w-6",
    inactiveIcon: "h-5 w-5",
    paddingCompact:
      "relative flex flex-row items-center justify-center px-responsive-sm py-responsive-sm",
    paddingDefault:
      "relative flex flex-row flex-1 items-center justify-center px-responsive-md py-responsive-md",
  },
  lg: {
    activeText: "text-responsive-xl",
    inactiveText: "text-responsive-lg",
    activeIcon: "h-7 w-7",
    inactiveIcon: "h-6 w-6",
    paddingCompact:
      "relative flex flex-row items-center justify-center px-responsive-md py-responsive-sm",
    paddingDefault:
      "relative flex flex-row flex-1 items-center justify-center px-responsive-lg py-responsive-md",
  },
};

export function underlineTabsButtonSize(
  tabSize: UnderlineTabsSize,
): "sm" | "md" | "lg" {
  if (tabSize === "lg") {
    return "lg";
  }
  if (tabSize === "md") {
    return "md";
  }
  return "sm";
}
