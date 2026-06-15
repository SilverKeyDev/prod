import React from "react";

import { Icon } from "@ui/icons";

import type { Phase } from "packages/features/checklists/types/roadmapTracker";
import { getChecklistPhaseIconName } from "packages/features/checklists/utils/roadmap/checklistPhaseIcons";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import type { IconName } from "packages/ui/types/icons";

export type PhaseNodeLayout = "mobile" | "desktop";

export type PhaseNodeProps = {
  phase: Phase;
  journeyPhaseId: string;
  /** Full accessible name for the phase control. */
  ariaLabel: string;
  tabIndex: number;
  onPress?: () => void;
  onFocus?: () => void;
  layout?: PhaseNodeLayout;
  /** Emphasize size (mobile center column). */
  emphasize?: boolean;
  /** Mobile carousel: fixed share of the sliding strip (percent of strip width). */
  mobileStripSlotPercent?: number;
};

function phaseStatusIconName(phase: Phase): IconName {
  if (phase.status === "locked") return "lock";
  if (phase.status === "complete") return "check";
  return getChecklistPhaseIconName(phase.id) ?? "file-text";
}

function JourneyDot() {
  return (
    <Box
      className="bg-gold ring-background-base z-header absolute -left-1 -top-1 h-1.5 w-1.5 rounded-full ring-2"
      data-testid="journey-dot"
      aria-hidden
    />
  );
}

function PhaseIconSlot({
  iconName,
  showJourneyDot,
  className,
}: {
  iconName: IconName;
  showJourneyDot: boolean;
  className?: string;
}) {
  return (
    <Box className="relative shrink-0" data-testid="phase-icon-slot">
      {showJourneyDot ? <JourneyDot /> : null}
      <Icon name={iconName} className={className ?? "text-text-tertiary h-4 w-4 shrink-0"} />
    </Box>
  );
}

function MobilePhaseNode({
  phase,
  journeyPhaseId: _journeyPhaseId,
  ariaLabel,
  tabIndex,
  onPress,
  onFocus,
  emphasize,
  mobileStripSlotPercent,
  isSelected,
  isLocked,
  isComplete,
  isJourney,
}: PhaseNodeProps & {
  isSelected: boolean;
  isLocked: boolean;
  isComplete: boolean;
  isJourney: boolean;
}) {
  const labelClass = emphasize
    ? "text-sm font-semibold md:text-xs md:font-medium"
    : "text-xs font-medium md:text-xs";

  const shellClass = emphasize
    ? "relative min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center px-1 py-2"
    : "relative min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center px-1 py-1.5";

  const widthStyle =
    mobileStripSlotPercent != null
      ? { width: `${mobileStripSlotPercent}%`, flex: "none" as const }
      : undefined;

  const isDominant = isJourney;

  const pillShellClass = (() => {
    const row = "flex max-w-full flex-row flex-nowrap items-center justify-center gap-1.5";
    if (isDominant) {
      return `border-gold bg-gold-muted/35 text-text-primary ${row} rounded-full border border-solid px-2.5 py-2 shadow-sm`;
    }
    const muted = "opacity-70";
    if (isLocked) {
      return `border-border text-text-secondary ${row} rounded-full border border-dashed px-2 py-1.5 ${muted}`;
    }
    if (isComplete) {
      return `border-border bg-background-base hover:bg-background-muted/80 ${row} rounded-full border px-2 py-1.5 ${muted}`;
    }
    return `border-border text-text-primary hover:bg-background-muted/50 ${row} rounded-full border bg-transparent px-2 py-1.5 ${muted}`;
  })();

  const accentClass = isDominant
    ? "text-gold font-semibold"
    : isSelected
      ? "text-gold"
      : isLocked || isComplete
        ? "text-text-secondary"
        : "text-text-primary";

  const iconName = phaseStatusIconName(phase);
  const iconClass = isDominant
    ? "text-gold h-4 w-4 shrink-0"
    : isSelected
      ? "text-gold h-4 w-4 shrink-0"
      : isLocked
        ? "text-text-tertiary h-3.5 w-3.5 shrink-0"
        : "text-text-tertiary h-4 w-4 shrink-0";

  const labelRow = (
    <Box className={`max-w-full ${pillShellClass}`}>
      <PhaseIconSlot
        iconName={iconName}
        showJourneyDot={isJourney && !isDominant}
        className={iconClass}
      />
      <Text
        className={`min-w-0 shrink text-center ${labelClass} ${accentClass} max-w-[9rem]`}
        numberOfLines={2}
      >
        {phase.label}
      </Text>
    </Box>
  );

  return (
    <Pressable
      data-phase-id={phase.id}
      data-layout="mobile"
      tabIndex={tabIndex}
      label={ariaLabel}
      aria-current={isJourney ? "step" : undefined}
      onPress={onPress}
      onFocus={onFocus}
      className="min-w-0 flex-1 cursor-pointer flex-col items-stretch rounded-lg outline-none"
      style={widthStyle}
    >
      <Box className={shellClass}>
        {labelRow}
        {isSelected || isDominant ? (
          <Box
            className={`bg-gold absolute bottom-0 left-2 right-2 rounded-none ${isDominant ? "h-1" : "h-0.5"}`}
            aria-hidden
          />
        ) : null}
      </Box>
    </Pressable>
  );
}

const DESKTOP_CELL_ROW =
  "box-border flex w-full max-w-full flex-row items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors motion-safe:duration-150";

function desktopCellShellClass(
  status: Phase["status"],
  isSelected: boolean,
  isDominant: boolean
): string {
  if (isDominant) {
    return `${DESKTOP_CELL_ROW} border-gold bg-gold-muted/35 shadow-sm z-10 min-h-9 border-solid hover:bg-gold-muted/45 active:bg-gold-muted/50`;
  }
  const muted = "opacity-65 hover:opacity-80";
  if (status === "locked") {
    return `${DESKTOP_CELL_ROW} border-dashed ${muted} ${
      isSelected
        ? "border-gold/60 bg-gold-muted/15 hover:bg-gold-muted/25"
        : "border-border bg-background-base/70 hover:border-text-tertiary/40 hover:bg-background-muted/50"
    }`;
  }
  if (status === "complete") {
    return `${DESKTOP_CELL_ROW} border-dashed border-border/80 bg-background-base/50 ${muted} hover:bg-background-muted/50`;
  }
  return `${DESKTOP_CELL_ROW} border-dashed border-transparent bg-transparent ${muted} hover:border-border/40 hover:bg-background-muted/40`;
}

function DesktopPhaseNode({
  phase,
  ariaLabel,
  tabIndex,
  onPress,
  onFocus,
  isSelected,
  isJourney,
  isLocked,
}: PhaseNodeProps & {
  isSelected: boolean;
  isJourney: boolean;
  isLocked: boolean;
}) {
  const isDominant = isJourney;
  const accentClass = isDominant
    ? "text-gold text-sm font-semibold"
    : isSelected
      ? "text-gold text-xs font-medium"
      : "text-text-secondary text-xs font-medium";
  const iconName = phaseStatusIconName(phase);
  const iconClass = isDominant
    ? "text-gold h-5 w-5 shrink-0"
    : isSelected
      ? "text-gold h-4 w-4 shrink-0"
      : "text-text-tertiary h-4 w-4 shrink-0 opacity-90";

  return (
    <Pressable
      data-phase-id={phase.id}
      data-layout="desktop"
      tabIndex={tabIndex}
      label={ariaLabel}
      aria-current={isJourney ? "step" : undefined}
      onPress={onPress}
      onFocus={onFocus}
      className={`focus-visible:ring-gold/40 w-full min-w-0 flex-1 cursor-pointer flex-col items-stretch rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${isDominant ? "relative z-10" : ""}`}
    >
      <Box className="relative flex w-full flex-col items-center justify-center px-0.5 pb-2.5 pt-0.5">
        <Box
          className={desktopCellShellClass(phase.status, isSelected, isDominant)}
          data-testid={
            isDominant ? "phase-cell-dominant" : isLocked ? "phase-cell-locked" : "phase-cell"
          }
        >
          <PhaseIconSlot
            iconName={iconName}
            showJourneyDot={isJourney && !isDominant}
            className={iconClass}
          />
          <Text className={`text-center ${accentClass}`} numberOfLines={2}>
            {phase.label}
          </Text>
        </Box>
        {isSelected || isDominant ? (
          <Box
            className={`bg-gold absolute bottom-0 left-1 right-1 rounded-none ${isDominant ? "h-1" : "h-0.5"}`}
            aria-hidden
          />
        ) : null}
      </Box>
    </Pressable>
  );
}

export function PhaseNode({
  phase,
  journeyPhaseId,
  ariaLabel,
  tabIndex,
  onPress,
  onFocus,
  layout = "mobile",
  emphasize = false,
  mobileStripSlotPercent,
}: PhaseNodeProps) {
  const isSelected = phase.isSelected === true;
  const isLocked = phase.status === "locked";
  const isComplete = phase.status === "complete";
  const isJourney =
    phase.id === journeyPhaseId && phase.status !== "locked" && phase.status === "active";

  if (layout === "desktop") {
    return (
      <DesktopPhaseNode
        phase={phase}
        journeyPhaseId={journeyPhaseId}
        ariaLabel={ariaLabel}
        tabIndex={tabIndex}
        onPress={onPress}
        onFocus={onFocus}
        layout={layout}
        isSelected={isSelected}
        isJourney={isJourney}
        isLocked={isLocked}
      />
    );
  }

  return (
    <MobilePhaseNode
      phase={phase}
      journeyPhaseId={journeyPhaseId}
      ariaLabel={ariaLabel}
      tabIndex={tabIndex}
      onPress={onPress}
      onFocus={onFocus}
      layout={layout}
      emphasize={emphasize}
      mobileStripSlotPercent={mobileStripSlotPercent}
      isSelected={isSelected}
      isLocked={isLocked}
      isComplete={isComplete}
      isJourney={isJourney}
    />
  );
}
