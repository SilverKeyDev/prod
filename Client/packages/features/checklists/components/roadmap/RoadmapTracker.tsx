import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { RoadmapTrackerProps } from "packages/features/checklists/types/roadmapTracker";
import Region from "packages/ui/components/accessibility/Region";
import IconButton from "packages/ui/components/button/IconButton";
import { Box } from "packages/ui/components/primitives";

import { PhaseNode } from "./PhaseNode";
import { PhaseSequenceChevron } from "./PhaseSequenceChevron";

function statusTranslationKey(status: "complete" | "active" | "locked" | "available"): string {
  switch (status) {
    case "complete":
      return "checklists.roadmap_tracker.status_complete";
    case "active":
      return "checklists.roadmap_tracker.status_active";
    case "locked":
      return "checklists.roadmap_tracker.status_locked";
    default:
      return "checklists.roadmap_tracker.status_available";
  }
}

function nextFocusIndex(from: number, dir: 1 | -1, count: number): number {
  const next = from + dir;
  if (next < 0 || next >= count) return from;
  return next;
}

export function RoadmapTracker({
  phases,
  activePhaseId,
  journeyPhaseId: journeyPhaseIdProp,
  onPhaseSelect,
}: RoadmapTrackerProps) {
  const { t } = useLocalization();
  const journeyPhaseId = journeyPhaseIdProp ?? activePhaseId;

  const journeyIndex = useMemo(
    () => phases.findIndex((p) => p.id === journeyPhaseId),
    [phases, journeyPhaseId]
  );

  const selectedIndex = useMemo(
    () => phases.findIndex((p) => p.id === activePhaseId),
    [phases, activePhaseId]
  );

  const n = phases.length;
  const maxStart = n > 3 ? n - 3 : 0;

  const [mobileWindowStart, setMobileWindowStart] = useState(0);
  const [focusIndex, setFocusIndex] = useState(selectedIndex);

  useEffect(() => {
    if (n <= 3) {
      setMobileWindowStart(0);
      return;
    }
    const preferred = Math.min(Math.max(selectedIndex - 1, 0), maxStart);
    setMobileWindowStart(preferred);
  }, [selectedIndex, n, maxStart]);

  useEffect(() => {
    const idx = phases.findIndex((p) => p.id === activePhaseId);
    if (idx >= 0) setFocusIndex(idx);
  }, [activePhaseId, phases]);

  const shiftMobileWindow = useCallback(
    (dir: -1 | 1) => {
      setMobileWindowStart((prev) => {
        const next = prev + dir;
        if (next < 0 || next > maxStart) return prev;
        return next;
      });
    },
    [maxStart]
  );

  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const dir: 1 | -1 = e.key === "ArrowRight" ? 1 : -1;
      const next = nextFocusIndex(focusIndex, dir, n);
      if (next !== focusIndex) setFocusIndex(next);
    },
    [focusIndex, n]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const phase = phases[focusIndex];
      if (phase == null) return;
      e.preventDefault();
      onPhaseSelect(phase.id);
    },
    [phases, focusIndex, onPhaseSelect]
  );

  const phaseAriaLabel = useCallback(
    (phase: RoadmapTrackerProps["phases"][number]) => {
      const statusLabel = t(statusTranslationKey(phase.status));
      const tasks = t("checklists.roadmap_tracker.tasks_inline", {
        completed: phase.completedTasks,
        total: phase.totalTasks,
      });
      return t("checklists.roadmap_tracker.phase_aria", {
        label: phase.label,
        status: statusLabel,
        tasks,
      });
    },
    [t]
  );

  const navAria = t("checklists.roadmap_tracker.nav_label");

  const canShiftLeft = n > 3 && mobileWindowStart > 0;
  const canShiftRight = n > 3 && mobileWindowStart < maxStart;

  const stripTranslatePercent = n > 3 ? (100 / n) * mobileWindowStart : 0;
  const stripWidthPercent = n > 3 ? (n / 3) * 100 : 100;
  const slotPercent = n > 0 ? 100 / n : 0;

  const handlePhasePress = useCallback(
    (phaseId: string) => {
      onPhaseSelect(phaseId);
    },
    [onPhaseSelect]
  );

  return (
    <Region
      role="navigation"
      label={navAria}
      className="mb-4 w-full"
      onKeyDown={handleNavKeyDown}
      onKeyUp={handleKeyUp}
    >
      {/* Mobile */}
      <Box className="flex flex-col md:hidden">
        <Box className="flex flex-row items-stretch gap-1">
          <IconButton
            iconName="chevron-left"
            variant="ghost"
            size="sm"
            label={t("checklists.roadmap_tracker.chevron_prev_phases")}
            disabled={!canShiftLeft}
            onPress={() => {
              shiftMobileWindow(-1);
            }}
            className="shrink-0 self-center"
          />
          <Box className="min-w-0 flex-1 overflow-hidden">
            <Box
              className="flex flex-row motion-safe:transition-transform motion-safe:duration-200 motion-reduce:transition-none"
              style={{
                width: `${stripWidthPercent}%`,
                transform: `translateX(-${stripTranslatePercent}%)`,
              }}
            >
              {phases.map((phase, phaseIndex) => (
                <PhaseNode
                  key={phase.id}
                  phase={phase}
                  journeyPhaseId={journeyPhaseId}
                  ariaLabel={phaseAriaLabel(phase)}
                  tabIndex={focusIndex === phaseIndex ? 0 : -1}
                  emphasize={phaseIndex === selectedIndex || phase.id === journeyPhaseId}
                  mobileStripSlotPercent={slotPercent}
                  onFocus={() => {
                    setFocusIndex(phaseIndex);
                  }}
                  onPress={() => {
                    handlePhasePress(phase.id);
                  }}
                />
              ))}
            </Box>
          </Box>
          <IconButton
            iconName="chevron-right"
            variant="ghost"
            size="sm"
            label={t("checklists.roadmap_tracker.chevron_next_phases")}
            disabled={!canShiftRight}
            onPress={() => {
              shiftMobileWindow(1);
            }}
            className="shrink-0 self-center"
          />
        </Box>
      </Box>

      {/* Desktop — equal columns with chevron sequence indicators */}
      <Box className="hidden md:flex md:w-full md:flex-row md:items-center md:gap-0">
        {phases.map((phase, index) => {
          const pathActive = index > 0 && index - 1 < journeyIndex;
          return (
            <React.Fragment key={phase.id}>
              {index > 0 ? <PhaseSequenceChevron pathActive={pathActive} /> : null}
              <Box className="min-w-0 flex-1 basis-0">
                <PhaseNode
                  phase={phase}
                  journeyPhaseId={journeyPhaseId}
                  ariaLabel={phaseAriaLabel(phase)}
                  layout="desktop"
                  tabIndex={focusIndex === index ? 0 : -1}
                  onFocus={() => {
                    setFocusIndex(index);
                  }}
                  onPress={() => {
                    handlePhasePress(phase.id);
                  }}
                />
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    </Region>
  );
}
