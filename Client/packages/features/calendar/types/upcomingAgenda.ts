import type { AgendaTodoDTO } from "./agenda";
import type { ExtendedGoogleEvent } from "./calendar";

export type UpcomingAgendaItem =
  | { kind: "event"; event: ExtendedGoogleEvent }
  | { kind: "todo"; todo: AgendaTodoDTO };
