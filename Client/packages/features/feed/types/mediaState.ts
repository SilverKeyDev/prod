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
