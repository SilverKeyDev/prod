import {
  Edit,
  Save,
  X,
  User,
  Building,
  Home,
  MapPin,
  MessageSquare,
  ListOrdered,
} from "lucide-react";

import Card from "../../../components/format/Card";
import type { NavItem } from "../../../core/schemas/navigation";
// Force refresh

const STEPS: NavItem[] = [
  {
    key: "reportcustomization",
    to: "#reportcustomization",
    label: "Report Customization",
    icon: ListOrdered,
  },
  {
    key: "demographics",
    to: "#demographics",
    label: "Demographics",
    icon: User,
  },
  {
    key: "financial",
    to: "#financial",
    label: "Financial Profile",
    icon: Building,
  },
  { key: "housing", to: "#housing", label: "Housing Preferences", icon: Home },
  {
    key: "location",
    to: "#location",
    label: "Location Preferences",
    icon: MapPin,
  },
  {
    key: "communication",
    to: "#communication",
    label: "Communication Preferences",
    icon: MessageSquare,
  },
];

type PersonalizationSidebarProps = {
  activeSection: string;
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScrollToSection: (sectionId: string) => void;
};

export default function PersonalizationSidebar({
  activeSection,
  isEditMode,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onScrollToSection,
}: PersonalizationSidebarProps) {
  return (
    <aside
      className="sticky self-start"
      style={{
        width: window.innerWidth >= 1024 ? "16rem" : "3rem",
        top: window.innerWidth >= 1024 ? "1rem" : "6rem",
      }}
    >
      <Card
        className={
          window.innerWidth >= 1024
            ? "space-y-2"
            : "space-y-2 rounded-lg border border-beige/30 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md"
        }
        padding={window.innerWidth >= 1024 ? "md" : "none"}
      >
        {/* Edit/Save Buttons - Hidden on mobile */}
        {window.innerWidth >= 1024 && (
          <div className="mb-8">
            {!isEditMode ? (
              <button
                onClick={onEdit}
                className="hover:bg-olive-dark flex w-full items-center justify-center gap-2 rounded-lg bg-olive px-3 py-2 text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-2"
              >
                <Edit className="h-5 w-5" />
                Edit
              </button>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="hover:bg-olive-dark flex w-full items-center justify-center gap-2 rounded-lg bg-olive px-3 py-2 text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-2 disabled:bg-gray-400"
                >
                  <Save className="h-5 w-5" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={onCancel}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-200 px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        {STEPS.map((step) => (
          <button
            key={step.key}
            onClick={() => onScrollToSection(step.key)}
            className={`flex w-full items-center rounded-lg px-3 py-2 transition-colors ${
              window.innerWidth >= 1024 ? "gap-3" : "justify-center"
            } ${activeSection === step.key ? "bg-gold text-gray-800" : "hover:bg-gold-lighter"}`}
          >
            {step.icon && (
              <step.icon
                size={20}
                className={`flex-shrink-0 ${
                  activeSection === step.key ? "text-gray-800" : "text-gray-500"
                }`}
              />
            )}
            {window.innerWidth >= 1024 && (
              <span className="text-left">{step.label}</span>
            )}
          </button>
        ))}
      </Card>
    </aside>
  );
}
