import { Edit, Save, X } from "lucide-react";
import React from "react";
import Button from "../../../components/ui/button/Button";

type PersonalizationMobileHeaderProps = {
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

const PersonalizationMobileHeader: React.FC<
  PersonalizationMobileHeaderProps
> = ({ isEditMode, isSaving, onEdit, onCancel, onSave }) => {
  if (!isEditMode) {
    return (
      <div className="flex w-full justify-center px-4">
        <Button
          onClick={onEdit}
          variant="olive"
          size="sm"
          fullWidth
          className="max-w-sm"
          icon={<Edit />}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm gap-2">
      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
        className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-200"
        icon={<X />}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="olive"
        size="sm"
        className="flex-1"
        icon={<Save />}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
};

export default PersonalizationMobileHeader;
