import { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { log } from "packages/logger";
import Button from "packages/ui/components/actions/button/Button";
import { Textarea } from "packages/ui/components/inputs/form/field/FormField";
import { Box } from "packages/ui/components/structure/primitives";
import Input from "packages/ui/components/structure/primitives/input/Input";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label.web";
import Title from "packages/ui/components/structure/text/Title";
import { StyledImage } from "packages/ui/components/surfaces/cards/base/index.web";

import Card from "@/components/layout/Card.web";

import type { NotInterestedCardProperty } from "./notInterestedCardProperty.types";

export type NotInterestedReason = {
  id: string;
  label: string;
};

const ALL_REASONS: NotInterestedReason[] = [
  { id: "price", label: "Price is too high" },
  { id: "location", label: "Location doesn't work" },
  { id: "size", label: "Too small or too large" },
  { id: "condition", label: "Needs too much work" },
  { id: "neighborhood", label: "Not the right neighborhood" },
  { id: "schools", label: "Schools don't meet needs" },
  { id: "commute", label: "Commute is too long" },
  { id: "layout", label: "Layout doesn't work" },
  { id: "yard", label: "Yard size or features" },
  { id: "timing", label: "Timing isn't right" },
];

export type WhyNotInterestedCardProps = {
  property: NotInterestedCardProperty;
  onSelectReason: (why: string) => Promise<void>;
  onUndo: () => Promise<void>;
  cardType?: "searchpage" | "regular";
};

const REASON_LABEL_KEYS: Record<string, string> = {
  price: "why_not.reason_price",
  location: "why_not.reason_location",
  size: "why_not.reason_size",
  condition: "why_not.reason_condition",
  neighborhood: "why_not.reason_neighborhood",
  schools: "why_not.reason_schools",
  commute: "why_not.reason_commute",
  layout: "why_not.reason_layout",
  yard: "why_not.reason_yard",
  timing: "why_not.reason_timing",
  other: "why_not.other",
};

function getPropertyImage(property: NotInterestedCardProperty): string | undefined {
  if ("images" in property && property.images?.length) {
    const first = property.images[0];
    return typeof first === "string" ? first : undefined;
  }
  if ("imageUrl" in property && property.imageUrl) return property.imageUrl;
  return undefined;
}

function WhyNotInterestedImageSection({
  propertyImage,
  propertyAddress,
  cardType,
  onBack,
  isDisabled,
  t,
}: {
  propertyImage: string;
  propertyAddress: string | undefined;
  cardType: "searchpage" | "regular";
  onBack: () => void;
  isDisabled: boolean;
  t: (key: string) => string;
}) {
  const heightClass = cardType === "searchpage" ? "h-24 sm:h-28 md:h-32" : "h-32 sm:h-40 md:h-48";
  return (
    <Box className={`relative overflow-hidden ${heightClass}`}>
      <StyledImage
        src={propertyImage}
        alt={propertyAddress || "Property"}
        variant="professional"
        className="h-full w-full"
      />
      <Box className="pointer-events-none absolute inset-0">
        <Box className="pointer-events-auto relative h-full w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isDisabled}
            iconName="arrow-left"
            iconPosition="left"
            className="focus:ring-accent-muted z-header absolute left-2 top-2 bg-neutral-900/50 text-white backdrop-blur-sm hover:bg-neutral-900/60 focus:ring-offset-transparent"
            aria-label="Go back"
            title={t("why_not.back")}
          >
            {t("why_not.back")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function WhyNotInterestedReasonList({
  availableReasons,
  selectedReason,
  setSelectedReason,
  t,
  disabled,
}: {
  availableReasons: NotInterestedReason[];
  selectedReason: string | null;
  setSelectedReason: (v: string | null) => void;
  t: (key: string) => string;
  disabled: boolean;
}) {
  return (
    <Box className="mb-4 space-y-2">
      {availableReasons.map((reason) => (
        <Label
          key={reason.id}
          htmlFor={`not-interested-reason-${reason.id}`}
          className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors ${
            selectedReason === reason.id
              ? "border-border bg-primary-muted"
              : "border-border hover:border-border"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Input
            type="radio"
            id={`not-interested-reason-${reason.id}`}
            name="not-interested-reason"
            value={reason.id}
            checked={selectedReason === reason.id}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={disabled}
            className="border-border text-text-primary disabled:bg-disabled disabled:text-text-disabled h-4 w-4 focus:ring-neutral-400"
          />
          <BodyText as="span" className="ml-3 text-sm text-gray-900">
            {t(REASON_LABEL_KEYS[reason.id] ?? "why_not.other")}
          </BodyText>
        </Label>
      ))}
    </Box>
  );
}

function WhyNotInterestedCustomReason({
  customReason,
  setCustomReason,
  disabled,
  t,
}: {
  customReason: string;
  setCustomReason: (v: string) => void;
  disabled: boolean;
  t: (key: string) => string;
}) {
  return (
    <Box className="mb-4">
      <Label htmlFor="custom-reason" className="mb-2 block">
        {t("why_not.tell_more")}
      </Label>
      <Textarea
        id="custom-reason"
        rows={3}
        value={customReason}
        onChange={(e) => setCustomReason(e.target.value)}
        disabled={disabled}
        placeholder={t("why_not.reason_placeholder")}
        className="border-border focus:border-input-variant-focus-border disabled:bg-disabled disabled:text-text-disabled w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-neutral-400 disabled:cursor-not-allowed"
      />
    </Box>
  );
}

function getConfirmReason(selectedReason: string | null, customReason: string): string | undefined {
  if (selectedReason === "other") return customReason.trim() || undefined;
  if (selectedReason) return ALL_REASONS.find((r) => r.id === selectedReason)?.label;
  return undefined;
}

function WhyNotInterestedContentSection({
  propertyAddress,
  availableReasons,
  selectedReason,
  setSelectedReason,
  customReason,
  setCustomReason,
  disabled,
  canConfirm,
  isSubmitting,
  onConfirm,
  t,
}: {
  propertyAddress: string | undefined;
  availableReasons: NotInterestedReason[];
  selectedReason: string | null;
  setSelectedReason: (v: string | null) => void;
  customReason: string;
  setCustomReason: (v: string) => void;
  disabled: boolean;
  canConfirm: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  t: (key: string) => string;
}) {
  return (
    <Box className="space-y-2 p-3 sm:space-y-3 sm:p-4">
      {propertyAddress && (
        <Box className="w-full">
          <Title size="sm" as="h3" className="mb-1 line-clamp-2">
            {propertyAddress}
          </Title>
          <BodyText size="xs" muted className="mb-3">
            {t("why_not.why_not_fit")}
          </BodyText>
        </Box>
      )}
      <WhyNotInterestedReasonList
        availableReasons={availableReasons}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        t={t}
        disabled={disabled}
      />
      {selectedReason === "other" && (
        <WhyNotInterestedCustomReason
          customReason={customReason}
          setCustomReason={setCustomReason}
          disabled={disabled}
          t={t}
        />
      )}
      <Button
        type="button"
        variant="primary"
        size="md"
        fullWidth
        onClick={onConfirm}
        disabled={!canConfirm || disabled}
        loading={isSubmitting}
        iconName="save"
      >
        {isSubmitting ? t("why_not.submitting") : t("why_not.confirm")}
      </Button>
    </Box>
  );
}

export default function WhyNotInterestedCard({
  property,
  onSelectReason,
  onUndo,
  cardType = "searchpage",
}: WhyNotInterestedCardProps) {
  const { t } = useLocalization();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const availableReasons = useMemo(() => {
    const shuffled = [...ALL_REASONS].sort(() => Math.random() - 0.5);
    return [...shuffled.slice(0, 2), { id: "other", label: "Other" }];
  }, []);

  const propertyAddress = typeof property.address === "string" ? property.address : undefined;
  const propertyImage = getPropertyImage(property);
  const disabled = isSubmitting || isUndoing;
  const canConfirm =
    selectedReason === "other" ? customReason.trim().length > 0 : selectedReason !== null;

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo();
    } catch (error) {
      log.error("ERRORS", "Failed to undo", error);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleConfirm = async () => {
    const why = getConfirmReason(selectedReason, customReason);
    if (!why) return;
    setIsSubmitting(true);
    try {
      await onSelectReason(why);
    } catch (error) {
      log.error("ERRORS", "Failed to submit reason", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      border="charcoal"
      className="relative w-full overflow-hidden transition-none"
      padding="none"
      hover={false}
    >
      {propertyImage && (
        <WhyNotInterestedImageSection
          propertyImage={propertyImage}
          propertyAddress={propertyAddress}
          cardType={cardType}
          onBack={handleUndo}
          isDisabled={disabled}
          t={t}
        />
      )}
      <WhyNotInterestedContentSection
        propertyAddress={propertyAddress}
        availableReasons={availableReasons}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        customReason={customReason}
        setCustomReason={setCustomReason}
        disabled={disabled}
        canConfirm={canConfirm}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirm}
        t={t}
      />
    </Card>
  );
}
