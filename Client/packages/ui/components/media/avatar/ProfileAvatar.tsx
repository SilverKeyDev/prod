import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_AVATAR_BUNDLED,
  DEFAULT_AVATAR_WEB_PATH,
} from "packages/ui/components/media/asset/logoSource";
import Image from "packages/ui/components/structure/primitives/media/Image";

export type ProfileAvatarProps = {
  imageUrl?: string | null;
  /** Accessibility label (alt / RN label). */
  label: string;
  /** Tailwind classes for the image, e.g. `h-full w-full object-cover` or `h-20 w-20 rounded-full`. */
  imageClassName: string;
};

/**
 * Remote profile photo when available; otherwise the same default silhouette as profile
 * (`/default-avatar.svg` on web, bundled asset on native).
 */
export function ProfileAvatar({ imageUrl, label, imageClassName }: ProfileAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const trimmed = imageUrl?.trim();
  const useRemote = Boolean(trimmed && !loadFailed);

  useEffect(() => {
    setLoadFailed(false);
  }, [trimmed]);

  const handleError = useCallback(() => {
    setLoadFailed(true);
  }, []);

  const bundledDefault = typeof DEFAULT_AVATAR_BUNDLED === "number" ? DEFAULT_AVATAR_BUNDLED : null;

  if (bundledDefault != null) {
    return (
      <Image
        source={useRemote ? { uri: trimmed! } : bundledDefault}
        className={imageClassName}
        label={label}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={useRemote ? trimmed! : DEFAULT_AVATAR_WEB_PATH}
      className={imageClassName}
      fetchPriority={useRemote ? "high" : "low"}
      label={label}
      onError={handleError}
    />
  );
}
