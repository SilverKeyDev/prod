import React from "react";
import { Edit, Save, X } from "lucide-react";

interface PersonalizationMobileHeaderProps {
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

const PersonalizationMobileHeader: React.FC<
  PersonalizationMobileHeaderProps
> = ({ isEditMode, isSaving, onEdit, onCancel, onSave }) => {
  if (!isEditMode) {
    return (
      <div className="flex justify-center w-full px-4">
        <button
          onClick={onEdit}
          className="w-full max-w-sm flex items-center justify-center gap-2 px-4 py-3 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors touch-friendly text-sm"
        >
          <Edit size={16} />
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 max-w-sm mx-auto w-full px-4">
      <button
        onClick={onCancel}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-friendly text-sm"
      >
        <X size={14} />
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors disabled:opacity-50 touch-friendly text-sm"
      >
        <Save size={14} />
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default PersonalizationMobileHeader;
