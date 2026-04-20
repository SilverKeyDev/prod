export const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png,image/gif";
export const PROFILE_PHOTO_MAX_BYTES = 15 * 1024 * 1024;

export function validateProfilePhotoFile(file: File): string | null {
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Image must be 15MB or smaller.";
  }
  const allowed = ["image/jpeg", "image/png", "image/gif"];
  if (!allowed.includes(file.type)) {
    return "Please use a JPEG, PNG, or GIF image.";
  }
  return null;
}
