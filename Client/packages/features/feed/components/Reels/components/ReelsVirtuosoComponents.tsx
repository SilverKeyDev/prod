import { forwardRef, useCallback, useEffect, useRef } from "react";

import { spacing } from "packages/design-tokens";

export type ReelsScrollerProps = React.HTMLAttributes<HTMLDivElement> & {
  isHorizontalGestureActive?: boolean;
};

const ReelsScroller = forwardRef<HTMLDivElement, ReelsScrollerProps>(
  ({ isHorizontalGestureActive = false, style, onWheel, ...props }, ref) => {
    const localRef = useRef<HTMLDivElement | null>(
      null
    ) as React.MutableRefObject<HTMLDivElement | null>;
    const onWheelRef = useRef(onWheel);
    onWheelRef.current = onWheel;
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        localRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) {
          (ref as unknown as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      },
      [ref]
    );
    useEffect(() => {
      const el = localRef.current;
      if (!el) return;
      const handleWheel = (e: WheelEvent) => {
        if (isHorizontalGestureActive) e.preventDefault();
        onWheelRef.current?.(e as unknown as React.WheelEvent<HTMLDivElement>);
      };
      const handleScroll = () => {
        if (el.scrollTop < 0) el.scrollTop = 0;
      };
      el.addEventListener("wheel", handleWheel, { passive: false });
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("scroll", handleScroll);
      };
    }, [isHorizontalGestureActive]);
    return (
      <div
        ref={setRef}
        {...props}
        className={`scrollbar-hide ${props.className ?? ""}`.trim()}
        style={{
          ...style,
          overflow: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "none",
          touchAction: isHorizontalGestureActive ? "pan-x" : undefined,
        }}
      />
    );
  }
);
ReelsScroller.displayName = "ReelsScroller";

const zeroPadding = {
  paddingTop: spacing(0),
  paddingRight: spacing(0),
  paddingBottom: spacing(0),
  paddingLeft: spacing(0),
};
const zeroMargin = {
  marginTop: spacing(0),
  marginRight: spacing(0),
  marginBottom: spacing(0),
  marginLeft: spacing(0),
};

const ReelsList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  (props, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        ...props.style,
        display: "flex",
        flexDirection: "column",
        gap: spacing(0),
        ...zeroMargin,
        ...zeroPadding,
      }}
      className={props.className}
    />
  )
);
ReelsList.displayName = "ReelsList";

const ReelsItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  (props, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        ...props.style,
        ...zeroMargin,
        ...zeroPadding,
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
      }}
      className={props.className}
    />
  )
);
ReelsItem.displayName = "ReelsItem";

export { ReelsItem, ReelsList, ReelsScroller };
