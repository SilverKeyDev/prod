import { useEffect } from "react";

import { Calendar } from "../features/dashboard/calendar";

type CalendarPageProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function CalendarPage({
  setMobileHeaderActions,
}: CalendarPageProps) {
  // Set mobile header actions (calendar handles its own mobile UI)
  useEffect(() => {
    if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [setMobileHeaderActions]);

  return <Calendar />;
}
