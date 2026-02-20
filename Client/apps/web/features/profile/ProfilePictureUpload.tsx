import React, { useRef } from "react";

import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";

import { BodyText, Button } from "@/components/ui/index.web";
import Image from "@/components/ui/media/Image";
import { FEED_AVATAR_IMAGE_CLASS } from "@/features/feed/Overlay/FeedActionButton";
import Label from "@/features/profile/components/Label.web";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  const allowed = ["image/jpeg", "image/png", "image/gif"];
  if (!allowed.includes(file.type)) {
    return "Please use a JPEG, PNG, or GIF image.";
  }
  return null;
}

export default function ProfilePictureUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useUserData();
  const { uploadProfilePicture, isUploading, error } =
    useProfilePictureUpload();

  const profilePictureUrl = userProfile?.profile_picture_url ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      showErrorToast(validationError);
      e.target.value = "";
      return;
    }

    try {
      await uploadProfilePicture(file);
    } catch {
      showErrorToast("Failed to upload profile picture. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <Label>Profile picture</Label>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="Profile"
              className={`h-full w-full ${FEED_AVATAR_IMAGE_CLASS}`}
            />
          ) : (
            <div
              className={`h-full w-full ${FEED_AVATAR_IMAGE_CLASS} bg-gray-200`}
              aria-hidden
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          {/* Native file input required for upload; design system Input does not support type="file" */}
          {/* eslint-disable-next-line silverkey/no-primitive-components -- file input has no UI replacement */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClick}
            disabled={isUploading}
            loading={isUploading}
          >
            {profilePictureUrl ? "Change photo" : "Upload photo"}
          </Button>
          {error && (
            <BodyText size="xs" muted>
              {error.message}
            </BodyText>
          )}
        </div>
      </div>
      <BodyText size="xs" muted>
        JPEG, PNG, or GIF. Max 5MB.
      </BodyText>
    </div>
  );
}
