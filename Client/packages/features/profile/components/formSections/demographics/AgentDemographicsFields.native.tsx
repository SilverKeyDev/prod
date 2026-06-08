import Input from "@ui/form/Input";

import { ProfileReadOnlyValue } from "packages/features/profile/components/profileScreen/tabs/shared/ProfileReadOnlyValue";
import { FIELD_LABELS } from "packages/features/profile/utils";
import { ProfileAvatar } from "packages/ui/components/media/avatar";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/native/nativeFormStyles.native";

import { HAS_BUYERS_AGENT_OPTIONS } from "./AgentDemographicsFields.config";
import {
  createToggleLookingForAgentHandler,
  useAgentDemographicsContext,
} from "./AgentDemographicsFields.logic";
import type { AgentDemographicsFieldsProps } from "./AgentDemographicsFields.types";

type NativeAgentDemographicsFieldsProps = AgentDemographicsFieldsProps & {
  profilePictureUrl?: string | null;
  onUploadPhoto?: () => void | Promise<void>;
  isUploadingProfilePicture?: boolean;
  profilePictureError?: { message: string } | null;
  userDisplayName?: string | null;
};

export function AgentDemographicsFields({
  formData,
  isEditMode,
  updateFormData,
  hideProfilePictureWhenOnboarding = false,
  hideNameWhenOnboarding = false,
  profilePictureUrl,
  onUploadPhoto,
  isUploadingProfilePicture = false,
  profilePictureError,
  userDisplayName,
}: NativeAgentDemographicsFieldsProps) {
  const { showBuyerFacingDemographics } = useAgentDemographicsContext(formData);
  const toggleLookingForAgent = createToggleLookingForAgentHandler(formData, updateFormData);

  return (
    <Box className="gap-5">
      {!hideProfilePictureWhenOnboarding && onUploadPhoto != null && (
        <Box className="gap-3">
          <BodyText size="sm" className="text-text-secondary font-medium">
            Profile picture
          </BodyText>
          <Box className="flex-row flex-wrap items-center gap-4">
            <Box className="bg-primary-muted h-20 w-20 items-center justify-center overflow-hidden rounded-full">
              <ProfileAvatar
                imageUrl={profilePictureUrl}
                label={
                  userDisplayName?.trim() ? `Profile photo, ${userDisplayName.trim()}` : "Profile"
                }
                imageClassName="h-20 w-20 rounded-full"
              />
            </Box>
            <Box className="gap-1">
              <Pressable
                onPress={onUploadPhoto}
                disabled={isUploadingProfilePicture}
                className="border-border bg-background-surface rounded-lg border px-4 py-2"
              >
                <Text className="text-text-primary text-sm font-medium">
                  {profilePictureUrl ? "Change photo" : "Upload photo"}
                </Text>
              </Pressable>
              {profilePictureError != null && (
                <Text className="text-xs text-red-500">{profilePictureError.message}</Text>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {!hideNameWhenOnboarding && (
        <Box>
          <Text className="text-text-secondary mb-2 text-sm font-medium">{FIELD_LABELS.NAME}</Text>
          {isEditMode ? (
            <Input
              value={formData.name ?? ""}
              onValueChange={(v) => updateFormData("name", v || undefined)}
              placeholder="Enter your full name"
              className={MOBILE_TEXT_INPUT_CLASS}
            />
          ) : (
            <ProfileReadOnlyValue value={formData.name} />
          )}
        </Box>
      )}

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">{FIELD_LABELS.AGE}</Text>
        {isEditMode ? (
          <Input
            value={formData.age?.toString() ?? ""}
            onValueChange={(v) => updateFormData("age", v ? parseInt(v, 10) : undefined)}
            placeholder="Enter your age"
            keyboardType="number-pad"
            className={`${MOBILE_TEXT_INPUT_CLASS} w-full`}
          />
        ) : (
          <ProfileReadOnlyValue value={formData.age} />
        )}
      </Box>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.CHILDREN_COUNT}
        </Text>
        {isEditMode ? (
          <Input
            value={formData.children_count?.toString() ?? ""}
            onValueChange={(v) => updateFormData("children_count", v ? parseInt(v, 10) : undefined)}
            placeholder="Number of children"
            keyboardType="number-pad"
            className={MOBILE_TEXT_INPUT_CLASS}
          />
        ) : (
          <ProfileReadOnlyValue value={formData.children_count} />
        )}
      </Box>

      {showBuyerFacingDemographics && (
        <Box className="gap-3">
          <Box>
            <Text className="text-text-secondary mb-2 text-sm font-medium">
              {FIELD_LABELS.HAS_BUYERS_AGENT}
            </Text>
            <Box className="flex flex-row gap-3">
              {HAS_BUYERS_AGENT_OPTIONS.map((opt) => {
                const selected = formData.has_buyers_agent === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateFormData("has_buyers_agent", opt.value)}
                    label={opt.label}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                      selected ? "border-primary bg-primary" : "border-border bg-background-surface"
                    }`}
                  >
                    <Text
                      className={`text-center text-base font-medium ${
                        selected ? "text-primary" : "text-text-secondary"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </Box>
          </Box>

          {formData.has_buyers_agent === "no" && (
            <Pressable
              onPress={toggleLookingForAgent}
              label="I am looking for a buyer's agent"
              className="border-border bg-background-surface flex flex-row items-center gap-3 rounded-lg border px-4 py-3"
            >
              <Box
                className={`h-5 w-5 items-center justify-center rounded border ${
                  formData.looking_for_buyers_agent
                    ? "border-primary bg-primary"
                    : "border-border bg-background-base"
                }`}
              />
              <Text className="text-text-primary text-sm font-medium">
                I am looking for a buyer&apos;s agent
              </Text>
            </Pressable>
          )}
        </Box>
      )}
    </Box>
  );
}
