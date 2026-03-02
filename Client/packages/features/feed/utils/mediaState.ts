/**
 * Formal media state machine for VideoItem lifecycle.
 * States and transitions per SilverKey Intent Discovery Engine spec.
 */

export type MediaState =
  | "DETACHED"
  | "ATTACHING"
  | "READY"
  | "PLAYING"
  | "BUFFERING"
  | "PAUSED"
  | "ERROR";

export type MediaEvent =
  | "ATTACH"
  | "ATTACHED"
  | "DETACH"
  | "PLAY"
  | "PAUSE"
  | "BUFFER_START"
  | "BUFFER_END"
  | "ERROR"
  | "VISIBILITY_HIDDEN"
  | "VISIBILITY_VISIBLE";

const TRANSITIONS: Partial<Record<MediaState, Partial<Record<MediaEvent, MediaState>>>> = {
  DETACHED: {
    ATTACH: "ATTACHING",
  },
  ATTACHING: {
    ATTACHED: "READY",
    DETACH: "DETACHED",
    ERROR: "ERROR",
  },
  READY: {
    PLAY: "PLAYING",
    PAUSE: "PAUSED",
    DETACH: "DETACHED",
    ERROR: "ERROR",
  },
  PLAYING: {
    PAUSE: "PAUSED",
    BUFFER_START: "BUFFERING",
    DETACH: "DETACHED",
    VISIBILITY_HIDDEN: "PAUSED",
    ERROR: "ERROR",
  },
  BUFFERING: {
    BUFFER_END: "PLAYING",
    PAUSE: "PAUSED",
    DETACH: "DETACHED",
    VISIBILITY_HIDDEN: "PAUSED",
    ERROR: "ERROR",
  },
  PAUSED: {
    PLAY: "PLAYING",
    DETACH: "DETACHED",
    ERROR: "ERROR",
  },
  ERROR: {
    ATTACH: "ATTACHING",
    DETACH: "DETACHED",
  },
};

export function transitionMediaState(current: MediaState, event: MediaEvent): MediaState {
  const next = TRANSITIONS[current]?.[event];
  return next ?? current;
}

export function getInitialMediaState(shouldAttach: boolean): MediaState {
  return shouldAttach ? "ATTACHING" : "DETACHED";
}
