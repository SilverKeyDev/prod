import { BarChart2, Home } from "lucide-react";
import Button from "../../components/ui/button/Button";

export type ReportsSubView = "reports" | "compare";

type ReportsSubViewNavigationProps = {
  currentView: ReportsSubView;
  onViewChange: (view: ReportsSubView) => void;
};

/**
 * Navigation buttons for switching between Reports and Compare views
 * Handles button click blur to prevent stuck hover states
 */
export default function ReportsSubViewNavigation({
  currentView,
  onViewChange,
}: ReportsSubViewNavigationProps) {
  // Handler to blur button after click to prevent stuck hover state
  const handleButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    action();
    // Store reference to button element before async operation
    const buttonElement = e.currentTarget;
    // Blur the button after click to prevent hover state from persisting
    setTimeout(() => {
      if (buttonElement) {
        buttonElement.blur();
      }
    }, 0);
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="ghost"
        size="md"
        icon={<Home />}
        hideTextBelow="md"
        onClick={(e) => handleButtonClick(e, () => onViewChange("reports"))}
        className={`h-11 px-4 py-2 text-sm font-medium ${
          currentView === "reports"
            ? "bg-gold text-white hover:bg-gold/90"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-100 focus:bg-gray-100 focus-visible:bg-gray-100"
        }`}
      >
        Saved
      </Button>
      <Button
        variant="ghost"
        size="md"
        icon={<BarChart2 />}
        hideTextBelow="md"
        onClick={(e) => handleButtonClick(e, () => onViewChange("compare"))}
        className={`h-11 px-4 py-2 text-sm font-medium ${
          currentView === "compare"
            ? "bg-gold text-white hover:bg-gold/90"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-100 focus:bg-gray-100 focus-visible:bg-gray-100"
        }`}
      >
        Compare
      </Button>
      {/* <Button
        variant="ghost"
        size="md"
        icon={<Bot />}
        hideTextBelow="md"
        onClick={(e) => handleButtonClick(e, () => onViewChange("chatbot"))}
        className={`h-11 px-4 py-2 text-sm font-medium ${
          currentView === "chatbot"
            ? "bg-gold text-white hover:bg-gold/90"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-100 focus:bg-gray-100 focus-visible:bg-gray-100"
        }`}
      >
        Chatbot
      </Button> */}
    </div>
  );
}
