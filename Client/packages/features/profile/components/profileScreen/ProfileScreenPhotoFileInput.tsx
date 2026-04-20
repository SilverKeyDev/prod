import React from "react";

import { isWeb } from "packages/utils/platform";

import { PROFILE_PHOTO_ACCEPT } from "./profilePhotoValidation";

export type ProfileScreenPhotoFileInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ProfileScreenPhotoFileInput({
  inputRef,
  onChange,
}: ProfileScreenPhotoFileInputProps) {
  if (!isWeb) {
    return null;
  }

  return (
    <>
      {/* eslint-disable-next-line silverkey/no-primitive-components -- file input has no UI replacement */}
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_PHOTO_ACCEPT}
        onChange={onChange}
        className="hidden"
        aria-hidden
      />
    </>
  );
}
