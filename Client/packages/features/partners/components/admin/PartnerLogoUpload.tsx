import { useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { partnersApi } from "packages/features/partners/api/partners";
import { getPartnerLogoUploadErrorMessage } from "packages/features/partners/api/partnersLogoUploadError";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { Box, Image } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label";

import { Button } from "@/components/ui";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp";
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return `Image must be ${MAX_SIZE_MB}MB or smaller.`;
  }
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (file.type && !allowed.includes(file.type)) {
    return "Please use a JPEG, PNG, GIF, or WebP image.";
  }
  return null;
}

type PartnerLogoUploadProps = {
  partnerId?: string;
  logoUrl?: string | null;
  onLogoUrlChange: (url: string | null) => void;
  onPendingFile?: (file: File | null) => void;
  disabled?: boolean;
};

export function PartnerLogoUpload({
  partnerId,
  logoUrl,
  onLogoUrlChange,
  onPendingFile,
  disabled,
}: PartnerLogoUploadProps) {
  const { t } = useLocalization();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl ?? null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewUrl(logoUrl ?? null);
  }, [logoUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      showErrorToast(validationError);
      e.target.value = "";
      return;
    }

    if (!partnerId) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      onPendingFile?.(file);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const result = await partnersApi.uploadPartnerLogo(partnerId, file);
      setPreviewUrl(result.logo_url ?? null);
      onLogoUrlChange(result.logo_url ?? null);
      onPendingFile?.(null);
    } catch (err: unknown) {
      showErrorToast(
        getPartnerLogoUploadErrorMessage(err, t("partners.admin.form.logo_upload_failed"))
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Box className="space-y-2">
      <Label>{t("partners.admin.form.logo")}</Label>
      <Box className="flex flex-wrap items-center gap-4">
        {previewUrl ? (
          <Box className="border-border h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border">
            <Image
              src={previewUrl}
              alt={t("partners.admin.form.logo")}
              className="h-full w-full object-cover"
            />
          </Box>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? t("partners.admin.form.logo_uploading")
            : t("partners.admin.form.logo_upload")}
        </Button>
        {!partnerId ? (
          <BodyText size="xs" muted>
            {t("partners.admin.form.logo_save_first")}
          </BodyText>
        ) : null}
      </Box>
      {/* Native file input required for upload; design system Input does not support type="file" */}
      {/* eslint-disable-next-line silverkey/no-primitive-components -- file input has no UI replacement */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
    </Box>
  );
}
