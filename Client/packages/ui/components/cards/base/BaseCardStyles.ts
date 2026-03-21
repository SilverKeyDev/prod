import { CARD_TRANSITION_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

import { getCardHoverClasses, getInteractiveCardClasses } from "./styles";

export type BaseCardStyleProps = {
  variant: "default" | "elevated" | "outlined" | "flat";
  padding: "none" | "sm" | "md" | "lg" | "xl";
  rounded: "none" | "sm" | "md" | "lg" | "xl";
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  hover: boolean;
  interactive: boolean;
  loading: boolean;
  cardType: "searchpage" | "regular";
  width?: "auto" | "full" | "standard" | "wide" | "narrow";
  height?: "auto" | "full" | "standard" | "tall" | "compact";
  scale?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /** When "white", use solid white background; otherwise use design token. */
  background?: "default" | "white";
  className: string;
};

function getCardTypeDefaults(cardType: "searchpage" | "regular") {
  return cardType === "searchpage"
    ? {
        width: "standard" as const,
        height: "auto" as const,
        scale: "md" as const,
      }
    : {
        width: "wide" as const,
        height: "standard" as const,
        scale: "lg" as const,
      };
}

function getWidthStyles(width: string): string {
  if (typeof width === "string" && width.includes("w-")) return width;
  const widthStyles: Record<string, string> = {
    auto: "w-auto",
    full: "w-full",
    standard: "card-width-standard",
    wide: "w-full max-w-2xl self-center sm:self-auto",
    narrow: "w-[60%] max-w-xs self-center sm:self-auto",
  };
  return widthStyles[width] ?? widthStyles.standard;
}

function getHeightStyles(height: string): string {
  if (typeof height === "string" && height.includes("h-")) return height;
  const heightStyles: Record<string, string> = {
    auto: "h-auto",
    full: "h-full",
    standard: "h-auto min-h-52",
    tall: "h-auto min-h-72",
    compact: "h-auto min-h-40",
  };
  return heightStyles[height] ?? heightStyles.auto;
}

function getScaleStyles(scale: string | number): string {
  // Use concatenation so Tailwind doesn't scan literal "scale-[${scale}]" and emit invalid CSS
  if (typeof scale === "number") return "scale-[" + String(scale) + "]";
  const scaleStyles: Record<string, string> = {
    xs: "scale-75",
    sm: "scale-90",
    md: "scale-100",
    lg: "scale-110",
    xl: "scale-125",
  };
  return scaleStyles[scale as string] ?? scaleStyles.md;
}

export function getBaseCardClasses(props: BaseCardStyleProps): string {
  const {
    variant,
    padding,
    rounded,
    shadow,
    hover,
    interactive,
    loading,
    cardType,
    width: widthProp,
    height: heightProp,
    scale: scaleProp,
    background = "default",
    className,
  } = props;

  const bgClass = background === "white" ? "bg-white" : "bg-background-base";
  const baseStyles = `${bgClass} ${CARD_TRANSITION_CLASSES}`;
  const variantStyles: Record<string, string> = {
    default: "border border-border-card-subtle",
    elevated: "border-0",
    outlined: "border-2 border-border-card-subtle",
    flat: "border-0 shadow-none",
  };
  const paddingStyles: Record<string, string> = {
    none: "p-0",
    sm: "card-content-spacing space-responsive-xs",
    md: "card-content-spacing space-responsive-sm",
    lg: "card-content-spacing space-responsive-md",
    xl: "card-content-spacing space-responsive-lg",
  };
  const roundedStyles: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  };
  const shadowStyles: Record<string, string> = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  const cardDefaults = getCardTypeDefaults(cardType);
  const width = widthProp ?? cardDefaults.width;
  const height = heightProp ?? cardDefaults.height;
  const scale = scaleProp ?? cardDefaults.scale;

  const hoverStyles = hover ? getCardHoverClasses() : "";
  const interactiveStyles = interactive ? getInteractiveCardClasses() : "";
  const loadingStyles = loading ? "opacity-60 pointer-events-none" : "";
  const overflowStyles = rounded !== "none" ? "overflow-hidden" : "";

  return [
    baseStyles,
    variantStyles[variant],
    paddingStyles[padding],
    roundedStyles[rounded],
    shadowStyles[shadow],
    hoverStyles,
    interactiveStyles,
    loadingStyles,
    overflowStyles,
    getWidthStyles(width),
    getHeightStyles(height),
    getScaleStyles(scale),
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
