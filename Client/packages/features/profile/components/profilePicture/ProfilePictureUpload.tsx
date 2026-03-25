import React, { useEffect, useRef, useState } from "react";

import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { Image } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
import { FEED_AVATAR_IMAGE_CLASS } from "@/features/feed/components/Overlay/FeedActionButton";
import { DEFAULT_AVATAR_IMAGE } from "@/features/feed/utils";
import Label from "@/features/profile/components/settings/inputs/Label";
const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif";
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return `Image must be ${MAX_SIZE_MB}MB or smaller.`;
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
  const { uploadProfilePicture, isUploading, error } = useProfilePictureUpload();
  const [remoteLoadFailed, setRemoteLoadFailed] = useState(false);

  const profilePictureUrl = userProfile?.profile_picture_url ?? null;
  const trimmedUrl = profilePictureUrl?.trim() ?? null;
  const showRemote = Boolean(trimmedUrl && !remoteLoadFailed);

  useEffect(() => {
    setRemoteLoadFailed(false);
  }, [trimmedUrl]);

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
    <Box className="space-y-3">
      <Label>Profile picture</Label>
      <Box className="flex flex-wrap items-center gap-4">
        <Box className="bg-primary-muted flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-full">
          <Image
            src={showRemote ? trimmedUrl! : DEFAULT_AVATAR_IMAGE}
            alt="Profile"
            fetchPriority={showRemote ? "high" : "low"}
            className={`h-full w-full ${FEED_AVATAR_IMAGE_CLASS}`}
            onError={() => {
              // #region agent log
              // eslint-disable-next-line no-restricted-globals -- debug NDJSON ingest (session 244579)
              fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Debug-Session-Id": "244579",
                },
                body: JSON.stringify({
                  sessionId: "244579",
                  location: "ProfilePictureUpload.tsx:Image.onError",
                  message: "profile image load failed",
                  data: {
                    wasTryingRemote: showRemote,
                    urlLen: trimmedUrl?.length ?? 0,
                  },
                  timestamp: Date.now(),
                  hypothesisId: "C",
                }),
              }).catch(() => {});
              // #endregion
              setRemoteLoadFailed(true);
            }}
          />
        </Box>
        <Box className="flex flex-col gap-1">
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
        </Box>
      </Box>
      <BodyText size="xs" muted>
        JPEG, PNG, or GIF. Max 15MB.
      </BodyText>
    </Box>
  );
}
