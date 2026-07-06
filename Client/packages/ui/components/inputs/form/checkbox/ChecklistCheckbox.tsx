import React from "react";

import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { Box, TouchableBox } from "packages/ui/components/structure/primitives";
import { HOVER_BG_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

/** Nested controls inside a checklist row that must receive their own clicks. */
const ROW_NESTED_INTERACTIVE_SELECTOR = "a[href], button, input, textarea, select";
type ResourceLink = {
  label: string;
  href?: string;
};
export type ChecklistItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
  optional?: boolean;
};
type ChecklistCheckboxProps = {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  itemLabelClass: string;
  itemExplanationClass: string;
  checkboxContainerClass: string;
  number?: number;
  /** When true, checkbox is disabled and shows locked state. */
  disabled?: boolean;
  /**
   * Buyer roadmap: when the step is the active one and blocked, use info cue instead of lock;
   * parent handles navigation via a row-level press target.
   */
  roadmapSoftBlocked?: boolean;
  /**
   * Shown inline after the title (gapped, muted rose) when `roadmapSoftBlocked` is true.
   * Typically the prerequisite step name (e.g. “Partner with a real estate agent”).
   */
  roadmapBlockerInlineText?: string | null;
  /** `integration_hint` uses smaller italic copy for “complete via form” style cues. */
  roadmapBlockerInlineVariant?: "default" | "integration_hint";
  /** When false, hides explanation, bullets, and resource. Default true for backward compatibility. */
  showDetails?: boolean;
  /**
   * When true, row visuals are presentational and a parent TouchableBox owns press
   * (e.g. expand/collapse or roadmap handoff). Default false.
   */
  deferInteractionToParent?: boolean;
};
/**
 * Reusable styled checkbox row for checklist pages.
 * Keeps consistent styling across Closing & Moving In, Inspections & Inspections, etc.
 */
const ChecklistCheckbox: React.FC<ChecklistCheckboxProps> = ({
  item,
  checked,
  onToggle,
  itemLabelClass,
  itemExplanationClass,
  checkboxContainerClass,
  number,
  disabled = false,
  roadmapSoftBlocked = false,
  roadmapBlockerInlineText = null,
  roadmapBlockerInlineVariant = "default",
  showDetails = true,
  deferInteractionToParent = false,
}) => {
  const ariaLabel = number != null ? `${number}. ${item.label}` : item.label;
  const showLockIcon = disabled && !checked && !roadmapSoftBlocked;
  const showInfoCue = disabled && !checked && roadmapSoftBlocked;
  const handleToggle = () => {
    if (!disabled) onToggle();
  };
  /** Completed steps may be non-interactive (cannot uncheck) but should still look checked, not "locked" gray. */
  const checkedReadOnly = checked && disabled;
  const rowPressDisabled = disabled || showInfoCue || checkedReadOnly;
  const hasExplanation = Boolean(item.explanation?.trim());
  const hasBullets = Boolean(item.bullets && item.bullets.length > 0);
  const hasTip = Boolean(item.tip?.trim());
  const showDetailsBlock =
    showDetails && (hasExplanation || hasBullets || Boolean(item.resource) || hasTip);
  const inlineBlocker =
    roadmapSoftBlocked &&
    roadmapBlockerInlineText != null &&
    roadmapBlockerInlineText.trim() !== "";
  const titleRow = (
    <Box className="flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-0 text-left">
      <BodyText as="span" size="sm" className={`!leading-snug ${itemLabelClass}`}>
        {number != null ? `${number}. ` : ""}
        {item.label}
        {item.optional ? (
          <BodyText as="span" size="xs" className="text-text-tertiary font-normal !leading-snug">
            {" "}
            (optional)
          </BodyText>
        ) : null}
      </BodyText>
      {inlineBlocker ? (
        <BodyText
          as="span"
          size={roadmapBlockerInlineVariant === "integration_hint" ? "xs" : "sm"}
          className={
            roadmapBlockerInlineVariant === "integration_hint"
              ? "text-rose-muted font-normal italic !leading-snug"
              : "text-rose-muted text-responsive-sm font-normal !leading-snug"
          }
        >
          {roadmapBlockerInlineText}
        </BodyText>
      ) : null}
    </Box>
  );

  const detailsBlock = showDetailsBlock ? (
    <Box className="flex flex-col gap-1.5">
      {hasExplanation ? (
        <BodyText size="xs" className={itemExplanationClass}>
          {item.explanation}
        </BodyText>
      ) : null}
      {hasBullets ? (
        <Box className="mt-1 flex flex-col gap-1.5">
          {item.bullets!.map((bullet, idx) => (
            <Box key={idx} className="flex flex-row items-start gap-2">
              <BodyText size="xs" className="text-text-secondary">
                •
              </BodyText>
              <BodyText size="xs" className="text-text-secondary flex-1">
                {bullet}
              </BodyText>
            </Box>
          ))}
        </Box>
      ) : null}
      {item.resource ? (
        <BodyText size="xs" className="text-responsive-xs text-primary">
          {item.resource.href ? (
            /* eslint-disable-next-line silverkey/no-primitive-components -- external link; href from resource */
            <a
              href={item.resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover active:text-primary underline"
            >
              {item.resource.label}
            </a>
          ) : (
            item.resource.label
          )}
        </BodyText>
      ) : null}
      {hasTip ? (
        <BodyText size="xs" className="text-primary-700 mt-1 font-medium">
          {item.tip}
        </BodyText>
      ) : null}
    </Box>
  ) : null;

  const checkboxVisual = (
    <Box
      role="presentation"
      aria-hidden
      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 flex-row items-center justify-center rounded border lg:h-6 lg:w-6 ${
        showInfoCue
          ? "border-border bg-background-surface"
          : checkedReadOnly
            ? "border-primary bg-primary cursor-default"
            : `${HOVER_BG_CLASSES} ${
                disabled
                  ? "border-border bg-disabled cursor-not-allowed"
                  : checked
                    ? "border-primary bg-primary"
                    : "border-border-input"
              }`
      }`}
    >
      {checked && (
        <Icon name="check" className="h-3.5 w-3.5 text-white lg:h-4 lg:w-4" strokeWidth={4} />
      )}
      {showLockIcon ? <Icon name="lock" className="text-text-secondary h-3 w-3" /> : null}
      {showInfoCue ? (
        <Icon name="info" className="text-gold h-3 w-3 opacity-90 lg:h-3.5 lg:w-3.5" />
      ) : null}
    </Box>
  );

  const rowContent = (
    <>
      {checkboxVisual}
      <Box className="min-w-0 flex-1 text-left">
        {titleRow}
        {detailsBlock}
      </Box>
    </>
  );

  if (deferInteractionToParent) {
    return (
      <Box className={`${checkboxContainerClass} pointer-events-none`} aria-hidden>
        {rowContent}
      </Box>
    );
  }

  return (
    <TouchableBox
      label={ariaLabel}
      onPress={handleToggle}
      disabled={rowPressDisabled}
      className={checkboxContainerClass}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest(ROW_NESTED_INTERACTIVE_SELECTOR)) {
          return;
        }
        if (rowPressDisabled) {
          return;
        }
        e.stopPropagation();
        handleToggle();
      }}
    >
      {rowContent}
    </TouchableBox>
  );
};
export default ChecklistCheckbox;
