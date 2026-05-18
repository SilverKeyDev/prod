export type PhaseStatus = "complete" | "active" | "locked" | "available";

export type Phase = {
  id: string;
  label: string;
  status: PhaseStatus;
  completedTasks: number;
  totalTasks: number;
  /** True when this phase is the checklist tab shown below the tracker. */
  isSelected?: boolean;
};

export type RoadmapTrackerProps = {
  phases: Phase[];
  /** Selected checklist phase (drives content below). */
  activePhaseId: string;
  /**
   * First incomplete phase in the buyer journey. Defaults to {@link activePhaseId}.
   * Drives the journey gold dot and `aria-current="step"` on that phase when not locked.
   */
  journeyPhaseId?: string;
  onPhaseSelect: (phaseId: string) => void;
};
