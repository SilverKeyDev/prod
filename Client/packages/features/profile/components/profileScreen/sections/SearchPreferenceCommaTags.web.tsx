import React from "react";

import TagInput from "@/features/profile/components/settings/inputs/tags/TagInput.web";

export type SearchPreferenceCommaTagsProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  isEditMode: boolean;
};

/** Web: chip/tag entry for school districts and neighborhood notes. */
export function SearchPreferenceCommaTags(props: SearchPreferenceCommaTagsProps) {
  return (
    <TagInput
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      isEditMode={props.isEditMode}
    />
  );
}
