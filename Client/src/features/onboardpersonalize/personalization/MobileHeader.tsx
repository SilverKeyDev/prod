import { Edit, Save, X } from 'lucide-react';
import React from 'react';

type PersonalizationMobileHeaderProps = {
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

const PersonalizationMobileHeader: React.FC<PersonalizationMobileHeaderProps> = ({
  isEditMode,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}) => {
  if (!isEditMode) {
    return (
      <div className="flex w-full justify-center px-4">
        <button
          onClick={onEdit}
          className="touch-friendly flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-olive px-4 py-3 text-sm text-white transition-colors hover:bg-olive/80"
        >
          <Edit size={16} />
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm gap-2 px-4">
      <button
        onClick={onCancel}
        className="touch-friendly flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-300"
      >
        <X size={14} />
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="touch-friendly flex flex-1 items-center justify-center gap-1 rounded-lg bg-olive px-3 py-2 text-sm text-white transition-colors hover:bg-olive/80 disabled:opacity-50"
      >
        <Save size={14} />
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default PersonalizationMobileHeader;
