import { ProfileAvatar } from "packages/ui/components";
import { Box } from "packages/ui/components/structure/primitives";
import { SIDEBAR_AVATAR_WRAP } from "packages/ui/components/structure/sidebar/sidebarTheme";

export function MessagingSidebarAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <Box className={SIDEBAR_AVATAR_WRAP}>
      <ProfileAvatar imageUrl={imageUrl} label={name} imageClassName="h-full w-full object-cover" />
    </Box>
  );
}
