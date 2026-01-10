import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";

import { BodyText, Button, Title } from "../ui";
import Card from "../layout/Card";
import type { SearchResult } from "../../../../packages/schemas/search";
import type { Property } from "../../../../packages/schemas/property";
import { StyledImage } from "./base/CardImageStyles";

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
  property: SearchResult | Property;
  onSelectReason: (why: string) => Promise<void>;
  onUndo: () => Promise<void>;
  cardType?: "searchpage" | "regular";
};

export default function WhyNotInterestedCard({
  property,
  onSelectReason,
  onUndo,
  cardType = "searchpage",
}: WhyNotInterestedCardProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  // Get 3 random reasons (2 from ALL_REASONS + "Other")
  const availableReasons = useMemo(() => {
    // Shuffle array and take first 2
    const shuffled = [...ALL_REASONS].sort(() => Math.random() - 0.5);
    const randomTwo = shuffled.slice(0, 2);
    return [...randomTwo, { id: "other", label: "Other" }];
  }, []); // Generate once on mount

  const propertyAddress =
    typeof property.address === "string" ? property.address : undefined;

  // Get image from either images array or imageUrl
  const propertyImage =
    "images" in property && property.images && property.images.length > 0
      ? typeof property.images[0] === "string"
        ? property.images[0]
        : undefined
      : "imageUrl" in property && property.imageUrl
        ? property.imageUrl
        : undefined;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    let why: string | undefined;
    if (selectedReason === "other") {
      why = customReason.trim() || undefined;
    } else if (selectedReason) {
      const reason = ALL_REASONS.find((r) => r.id === selectedReason);
      why = reason?.label;
    }

    if (!why) return;

    setIsSubmitting(true);
    try {
      await onSelectReason(why);
    } catch (error) {
      console.error("Failed to submit reason:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo();
    } catch (error) {
      console.error("Failed to undo:", error);
    } finally {
      setIsUndoing(false);
    }
  };

  const canConfirm =
    selectedReason === "other"
      ? customReason.trim().length > 0
      : selectedReason !== null;

  return (
    <Card
      className="relative w-full overflow-hidden transition-none"
      padding="none"
      hover={false}
    >
      {/* Image container - matching PropertyCard structure */}
      {propertyImage && (
        <div
          className={`relative overflow-hidden ${
            cardType === "searchpage"
              ? "h-24 sm:h-28 md:h-32"
              : "h-32 sm:h-40 md:h-48"
          }`}
        >
          <StyledImage
            src={propertyImage}
            alt={propertyAddress || "Property"}
            variant="professional"
            className="h-full w-full"
          />

          {/* Back button - positioned on image overlay like PropertyCard buttons */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative h-full w-full pointer-events-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={isUndoing || isSubmitting}
                icon={<ArrowLeft className="w-4 h-4" />}
                iconPosition="left"
                className="absolute top-2 left-2 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white focus:ring-white/50 focus:ring-offset-transparent"
                aria-label="Go back"
                title="Go back"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content section - matching PropertyCard padding */}
      <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
        {/* Address */}
        {propertyAddress && (
          <div className="w-full">
            <Title size="sm" as="h3" className="mb-1 line-clamp-2">
              {propertyAddress}
            </Title>
            <BodyText size="xs" muted className="mb-3">
              Why isn't this home a fit?
            </BodyText>
          </div>
        )}

        {/* Reason selection */}
        <div className="space-y-2 mb-4">
          {availableReasons.map((reason) => (
            <label
              key={reason.id}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                selectedReason === reason.id
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${isSubmitting || isUndoing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="not-interested-reason"
                value={reason.id}
                checked={selectedReason === reason.id}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={isSubmitting || isUndoing}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 disabled:opacity-50"
              />
              <span className="ml-3 text-sm text-gray-900">{reason.label}</span>
            </label>
          ))}
        </div>

        {/* Custom reason textarea */}
        {selectedReason === "other" && (
          <div className="mb-4">
            <label
              htmlFor="custom-reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Please tell us more
            </label>
            <textarea
              id="custom-reason"
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              disabled={isSubmitting || isUndoing}
              placeholder="Enter your reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Confirm button */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleConfirm}
          disabled={!canConfirm || isSubmitting || isUndoing}
          loading={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Confirm"}
        </Button>
      </div>
    </Card>
  );
}
