import Card from "../../components/layout/Card";
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

const STEPS = [
  {
    id: "reportcustomization",
    title: "Report Customization",
    icon: ListOrdered,
  },
  { id: "demographics", title: "Demographics", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  {
    id: "communication",
    title: "Communication Preferences",
    icon: MessageSquare,
  },
];

interface PersonalizationSidebarProps {
  activeSection: string;
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScrollToSection: (sectionId: string) => void;
}

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
    <aside className="w-12 md:w-64 sticky top-24 md:top-4 self-start">
      <Card className="space-y-2">
        {/* Edit/Save Buttons - Hidden on small screens */}
        <div className="hidden md:block mb-8">
          {!isEditMode ? (
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-lg font-medium text-white bg-olive rounded-lg hover:bg-olive-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive"
            >
              <Edit className="w-5 h-5" />
              Edit
            </button>
          ) : (
            <div className="flex flex-col space-y-2">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-lg font-medium text-white bg-olive rounded-lg hover:bg-olive-dark disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive"
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancel}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-lg font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => onScrollToSection(step.id)}
            className={`w-full justify-center md:justify-start md:text-left px-3 py-2 rounded-lg transition-colors flex items-center md:gap-3 ${
              activeSection === step.id
                ? "bg-gold text-gray-800"
                : "hover:bg-gold-lighter"
            }`}
          >
            <step.icon
              size={20}
              className={`flex-shrink-0 ${
                activeSection === step.id ? "text-gray-800" : "text-gray-500"
              }`}
            />
            <span className="hidden md:inline">{step.title}</span>
          </button>
        ))}
      </Card>
    </aside>
  );
}
