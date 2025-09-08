import React, { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  MapPin,
  GraduationCap,
  Shield,
  ExternalLink,
  Star,
  Home,
  User,
  Phone,
} from "lucide-react";
import { StyledImage } from "../cards/base";
import Card from "../layout/Card";
import { SearchResult } from "../../types/search";
import { Property } from "../../hooks/usePropertyDetails";

interface PropertyDetailsModalProps {
  property: Property | SearchResult | null;
  onClose: () => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (property: Property | SearchResult) => Promise<void> | void;
  removeSavedHome: (id: string) => void;
  onGenerateReport?: (address: string) => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  onGenerateReport,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

  if (!property) return null;

  /* =========================
     Helpers
     ========================= */

  const formatAddress = (address: any): string => {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const parts: string[] = [];
      if (address.streetAddress) parts.push(address.streetAddress);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipcode) parts.push(address.zipcode);
      return parts.join(", ");
    }
    return String(address);
  };

  const formatPrice = (price: string | number): string => {
    if (price === null || price === undefined || price === ("" as any))
      return "Price not available";
    const numPrice =
      typeof price === "string"
        ? parseFloat(price.replace(/[^0-9.-]+/g, ""))
        : price;
    if (isNaN(numPrice)) return "Price not available";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatPropertyType = (type?: string): string => {
    if (!type) return "N/A";
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Prefer provided images -> Zillow photos -> stock fallbacks
  const getPropertyImages = (): string[] => {
    const imgs = (property as any).images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs as string[];

    const photos = (property as any).photos;
    if (Array.isArray(photos) && photos.length > 0) {
      return photos
        .map((p: any) => {
          if (typeof p === "string") return p;
          if (p?.url) return p.url;
          const jpeg = p?.mixedSources?.jpeg;
          if (Array.isArray(jpeg) && jpeg.length > 0) {
            return jpeg[jpeg.length - 1]?.url;
          }
          return null;
        })
        .filter(Boolean) as string[];
    }

    return [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ];
  };

  const propertyImages = getPropertyImages();
  const thumbnailsPerView = 4;

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  const prevImage = () =>
    setCurrentImageIndex(
      (prev) => (prev - 1 + propertyImages.length) % propertyImages.length
    );
  const goToImage = (index: number) => setCurrentImageIndex(index);

  const nextThumbnails = () => {
    if (thumbnailStartIndex + thumbnailsPerView < propertyImages.length) {
      setThumbnailStartIndex((prev) => prev + 1);
    }
  };
  const prevThumbnails = () => {
    if (thumbnailStartIndex > 0) setThumbnailStartIndex((prev) => prev - 1);
  };

  const handleGenerateFullReport = () => {
    if (onGenerateReport) {
      onGenerateReport(formatAddress((property as any).address));
    }
  };

  const handleZillowOpen = () => {
    try {
      const p: any = property;
      if (p?.zillow_url) {
        window.open(p.zillow_url, "_blank", "noopener,noreferrer");
        return;
      }
      if (p?.zpid) {
        window.open(
          `https://www.zillow.com/homedetails/${p.zpid}_zpid/`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      }
      const addr = formatAddress(p?.address ?? "");
      window.open(
        `https://www.zillow.com/homes/${encodeURIComponent(addr)}_rb/`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      const addr = formatAddress((property as any)?.address ?? "");
      window.open(
        `https://www.zillow.com/homes/${encodeURIComponent(addr)}_rb/`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const isSaved = isHomeSaved((property as any).id);
  const hasImages = propertyImages.length > 0;

  // Commute helpers (supports both shapes)
  const commute = (property as any).commute_data;
  const hasTravelTimes =
    commute &&
    Array.isArray(commute.travel_times) &&
    commute.travel_times.length > 0;
  const hasSimpleCommute =
    commute && (commute.commute_time || commute.commute_distance);

  /* =========================
     UI
     ========================= */

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-brown/30 hover:scrollbar-thumb-brown/50">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 space-responsive-md rounded-t-lg z-10">
          <div className="flex items-start justify-between gap-responsive-sm">
            <div className="flex items-center gap-responsive-sm flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-responsive-lg font-bold text-brown truncate">
                  Property Details
                </h2>
                <p className="text-responsive-xs text-gray-600 mt-1 truncate">
                  {formatAddress((property as any).address)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-responsive-xs flex-shrink-0">
              {/* Generate Report (desktop) */}
              <button
                onClick={handleGenerateFullReport}
                className="bg-olive-light text-white py-1 px-2 rounded text-responsive-xs font-medium hover:bg-olive-light/80 transition-colors touch-manipulation hidden sm:flex items-center h-10 whitespace-nowrap"
              >
                Generate Full Report
              </button>
              {/* Generate Report (mobile) */}
              <button
                onClick={handleGenerateFullReport}
                className="bg-olive-light text-white p-2 rounded text-responsive-xs font-medium hover:bg-olive-light/80 transition-colors touch-manipulation sm:hidden flex items-center justify-center h-10 w-10"
                title="Generate Full Report"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Zillow */}
              <button
                onClick={handleZillowOpen}
                className="border border-blue-600 text-blue-600 py-1 px-2 rounded text-responsive-xs font-medium hover:bg-blue-50 transition-colors flex items-center gap-2 touch-manipulation h-10 whitespace-nowrap"
                title="View on Zillow"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Zillow</span>
              </button>

              {/* Save / Unsave */}
              <button
                onClick={() => {
                  if (isSaved) {
                    removeSavedHome((property as any).id);
                  } else {
                    saveHome(property);
                  }
                }}
                className={`border rounded p-2 transition-colors flex items-center justify-center h-10 w-10 touch-manipulation ${
                  isSaved
                    ? "border-red-500 text-red-500 hover:bg-red-50"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                aria-label={isSaved ? "Remove from saved" : "Save property"}
              >
                <svg
                  className="w-4 h-4"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded transition-colors touch-manipulation flex items-center justify-center h-10 w-10"
                aria-label="Close modal"
              >
                <svg
                  className="w-4 h-4 text-gray-500 hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-responsive-lg p-6">
          {/* Image + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-responsive-lg mb-4 sm:mb-6 md:mb-8">
            {/* Images */}
            <div>
              {hasImages && (
                <div className="relative">
                  <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 rounded-lg overflow-hidden">
                    <StyledImage
                      src={propertyImages[currentImageIndex]}
                      alt={`Property image ${currentImageIndex + 1}`}
                      variant="professional"
                      className="w-full h-full"
                    />
                    {/* Arrows */}
                    {propertyImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-1 sm:left-2 md:left-3 lg:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
                          aria-label="Previous image"
                        >
                          <svg
                            className="mobile-icon-sm"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-1 sm:right-2 md:right-3 lg:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
                          aria-label="Next image"
                        >
                          <svg
                            className="mobile-icon-sm"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                        {/* Counter */}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {propertyImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {propertyImages.length > 1 && (
                    <div className="relative mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={prevThumbnails}
                          className="flex-shrink-0 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-brown shadow-sm transition-all duration-200"
                          aria-label="Previous thumbnails"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        <div className="flex gap-2 flex-1 overflow-hidden">
                          {propertyImages
                            .slice(
                              thumbnailStartIndex,
                              thumbnailStartIndex + thumbnailsPerView
                            )
                            .map((image, relativeIndex) => {
                              const actualIndex =
                                thumbnailStartIndex + relativeIndex;
                              return (
                                <button
                                  key={actualIndex}
                                  onClick={() => goToImage(actualIndex)}
                                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
                                    actualIndex === currentImageIndex
                                      ? "border-brown shadow-md"
                                      : "border-gray-200 hover:border-gray-400"
                                  }`}
                                  aria-label={`Go to image ${actualIndex + 1}`}
                                >
                                  <StyledImage
                                    src={image}
                                    alt={`Thumbnail ${actualIndex + 1}`}
                                    variant="professional"
                                    className="w-full h-full"
                                  />
                                </button>
                              );
                            })}
                        </div>

                        <button
                          onClick={nextThumbnails}
                          className="flex-shrink-0 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-brown shadow-sm transition-all duration-200"
                          aria-label="Next thumbnails"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div>
              <div className="text-3xl font-bold text-brown mb-4">
                {formatPrice((property as any).price)}
              </div>
              <div
                className={`grid gap-4 mb-6 ${
                  (property as any).sqft && (property as any).sqft > 0
                    ? "grid-cols-3"
                    : "grid-cols-2 justify-center"
                }`}
              >
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-black">
                    {(property as any).bedrooms ?? "—"}
                  </div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-black">
                    {(property as any).bathrooms ?? "—"}
                  </div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                {(property as any).sqft && (property as any).sqft > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {Math.round((property as any).sqft).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Sq Ft</div>
                  </div>
                )}
              </div>

              {/* Additional stats */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Year Built:</span>
                  <span className="font-medium">
                    {(property as any).yearBuilt || "N/A"}
                  </span>
                </div>
                {(property as any).lotSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lot Size:</span>
                    <span className="font-medium">
                      {(property as any).lotSize}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium">
                    {formatPropertyType(
                      (property as any).homeType ||
                        (property as any).propertyType ||
                        ""
                    )}
                  </span>
                </div>
                {(property as any).pricePerSquareFoot && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Sq Ft:</span>
                    <span className="font-medium">
                      ${(property as any).pricePerSquareFoot}
                    </span>
                  </div>
                )}
                {((property as any).garageSpaces ||
                  (property as any).parking) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parking:</span>
                    <span className="font-medium">
                      {(property as any).garageSpaces
                        ? `${(property as any).garageSpaces}-car garage`
                        : (property as any).parking
                        ? `${(property as any).parking} spaces`
                        : "N/A"}
                    </span>
                  </div>
                )}
                {(property as any).daysOnZillow && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days on Market:</span>
                    <span className="font-medium">
                      {(property as any).daysOnZillow} days
                    </span>
                  </div>
                )}
                {(property as any).zestimate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimate:</span>
                    <span className="font-medium">
                      $
                      {((property as any).zestimate as number).toLocaleString()}
                    </span>
                  </div>
                )}
                {(property as any).rentZestimate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rent Estimate:</span>
                    <span className="font-medium">
                      $
                      {(
                        (property as any).rentZestimate as number
                      ).toLocaleString()}
                      /month
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Details (from your working version) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-4">
              {/* ROI Explanation */}
              {(property as any).property_analysis?.roi_explanation && (
                <div className="">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-brown" />
                    <h3 className="text-lg font-semibold text-brown">
                      Investment Analysis & ROI
                    </h3>
                  </div>
                  <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        {(() => {
                          const roiText = ((property as any).property_analysis
                            ?.roi_explanation || "") as string;
                          const sentences = roiText
                            .split(/[.!?]+/)
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0);

                          if (sentences.length === 0)
                            return (
                              <p className="text-brown/80 text-sm leading-relaxed">
                                No investment analysis available.
                              </p>
                            );
                          const summary = sentences[0] + ".";
                          const bullets = sentences
                            .slice(1)
                            .filter((s) => s.length > 10);

                          return (
                            <div>
                              <p className="text-brown/80 text-sm leading-relaxed mb-3">
                                {summary}
                              </p>
                              {bullets.length > 0 && (
                                <ul className="space-y-2">
                                  {bullets.map((point, i) => (
                                    <li
                                      key={i}
                                      className="text-brown/80 text-sm leading-relaxed"
                                    >
                                      {point.trim()}.
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4">
              {/* Neighborhood Overview */}
              {(() => {
                return null;
              })()}
              {(property.property_analysis as any)?.neighborhood_overview && (
                <div className="">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-brown" />
                    <h3 className="text-lg font-semibold text-brown">
                      Neighborhood Overview
                    </h3>
                  </div>
                  <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-brown/80 text-sm leading-relaxed">
                          {
                            (property.property_analysis as any)
                              ?.neighborhood_overview?.description
                          }
                        </p>
                      </div>
                      {(property.property_analysis as any)
                        ?.neighborhood_overview?.vibe && (
                        <div>
                          <div className="bg-olive/10 border border-olive/20 rounded-lg px-3 py-2">
                            <span className="text-olive text-sm font-medium">
                              {
                                (property.property_analysis as any)
                                  ?.neighborhood_overview?.vibe
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Agent (if present) & Schools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {(property as any).listed_by && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-brown" />
                  <h3 className="text-lg font-semibold text-brown">
                    Listing Agent
                  </h3>
                </div>
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full border-2 border-brown/20 flex-shrink-0 overflow-hidden bg-brown/10">
                      {(property as any).listed_by?.image_url ? (
                        <img
                          src={(property as any).listed_by.image_url}
                          alt={
                            (property as any).listed_by.display_name ||
                            "Listing Agent"
                          }
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.style.display = "none";
                            const fallback =
                              t.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full items-center justify-center ${
                          (property as any).listed_by?.image_url
                            ? "hidden"
                            : "flex"
                        }`}
                      >
                        <User className="w-8 h-8 text-brown/40" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-brown text-lg">
                        {(property as any).listed_by?.display_name}
                      </h4>
                      {(property as any).listed_by?.business_name && (
                        <p className="text-brown/70">
                          {(property as any).listed_by.business_name}
                        </p>
                      )}
                      {(property as any).listed_by?.phone && (
                        <div className="flex items-center text-brown mt-2">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>
                            {(() => {
                              const ph = (property as any).listed_by.phone;
                              if (!ph) return "Phone available";
                              const { areacode, prefix, number } = ph;
                              if (areacode && prefix && number)
                                return `(${areacode}) ${prefix}-${number}`;
                              return (
                                areacode ||
                                prefix ||
                                number ||
                                "Phone available"
                              );
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">
                  Nearby Schools
                </h3>
              </div>
              <div className="space-y-3">
                {(property as any).schools &&
                (property as any).schools.length > 0 ? (
                  (property as any).schools
                    .slice(0, 6)
                    .map((school: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-beige/10 border border-beige/40 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-brown">
                            {school.name || "Unknown School"}
                          </h4>
                          {typeof school.rating === "number" && (
                            <span
                              className={`px-2 py-1 rounded text-sm font-medium border ${
                                school.rating >= 8
                                  ? "bg-olive/20 text-olive border-olive/30"
                                  : school.rating >= 6
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : "bg-red-50 text-red-600 border-red-200"
                              }`}
                            >
                              {school.rating}/10
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-brown/70 space-y-1">
                          {typeof school.distance === "number" && (
                            <p>{school.distance.toFixed(1)} miles</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {school.type && <span>{school.type}</span>}
                            {school.grades && (
                              <span>• Grades {school.grades}</span>
                            )}
                            {school.level && <span>• {school.level}</span>}
                          </div>
                          {school.studentsPerTeacher && (
                            <p>
                              Student/Teacher Ratio: {school.studentsPerTeacher}
                              :1
                            </p>
                          )}
                          {school.isAssigned && (
                            <p className="text-blue-600 font-medium">
                              Assigned School
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                    <p className="text-brown/70">
                      No school information available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property Features */}
          {(property as any).features && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">
                  Property Features
                </h3>
              </div>

              <div className="bg-beige/20 border border-beige rounded-lg p-6">
                {/* AI-detected from images */}
                {(property as any).image_features?.clean?.length > 0 &&
                  !(property as any).image_features?.error && (
                    <div className="mb-4">
                      <h4 className="text-brown font-semibold text-sm mb-2">
                        AI-Detected Features from Photos
                      </h4>
                      <div className="text-brown/70 text-xs leading-relaxed">
                        {(property as any).image_features.clean.map(
                          (feature: string, i: number) => (
                            <span key={i} className="inline-block">
                              {feature.trim()}
                              {i <
                                (property as any).image_features.clean.length -
                                  1 && (
                                <span className="text-brown/40 mx-2">•</span>
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="space-y-4">
                  {typeof (property as any).features === "object" ? (
                    Object.entries(
                      (property as any).features as Record<string, string[]>
                    ).map(([category, list]) => (
                      <div key={category}>
                        <h4 className="text-brown font-semibold text-sm mb-2">
                          {category}
                        </h4>
                        <div className="text-brown/70 text-xs leading-relaxed">
                          {list.map((f, i) => (
                            <span key={i} className="inline-block">
                              {f.trim()}
                              {i < list.length - 1 && (
                                <span className="text-brown/40 mx-2">•</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-brown/60 text-sm text-center py-4">
                      No detailed features available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Property Analysis */}
          {(property as any).property_analysis &&
            !(property as any).property_analysis?.error && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-brown" />
                  <h3 className="text-lg font-semibold text-brown">
                    AI Property Analysis
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Pros */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-olive" />
                      <h3 className="text-lg font-semibold text-olive">
                        Pros for You
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {(property as any).property_analysis?.pros?.map(
                        (pro: string, i: number) => (
                          <div
                            key={i}
                            className="bg-olive/10 border border-olive/30 rounded-lg p-4"
                          >
                            <h4 className="font-medium text-olive mb-1">
                              Property Advantage
                            </h4>
                            <p className="text-sm text-brown/80">{pro}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  {/* Cons */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-amber-600">
                        Considerations
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {(property as any).property_analysis?.cons?.map(
                        (con: string, i: number) => (
                          <div
                            key={i}
                            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                          >
                            <h4 className="font-medium text-amber-600 mb-1">
                              Consideration
                            </h4>
                            <p className="text-sm text-brown/70">{con}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Crime & Gentrification (if provided) */}
                {(property as any).property_analysis?.crime_stats && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-brown" />
                        <h3 className="text-lg font-semibold text-brown">
                          Crime & Safety Analysis
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="font-medium text-brown">
                              Overall Safety Score
                            </h4>
                            <span className="bg-olive/20 text-olive border border-olive/30 px-3 py-1 rounded-full text-sm font-medium">
                              {
                                (property as any).property_analysis.crime_stats
                                  .overall_safety_score
                              }
                            </span>
                          </div>
                          <div className="space-y-3 ml-2.5 text-xs">
                            <div className="flex">
                              <span className="text-brown/70">Crime Rate</span>
                              <span className="text-olive ml-2">
                                {
                                  (property as any).property_analysis
                                    .crime_stats.crime_rate
                                }
                              </span>
                            </div>
                            <div className="flex">
                              <span className="text-brown/70">Trend</span>
                              <span className="ml-2 text-olive">
                                {
                                  (property as any).property_analysis
                                    .crime_stats.recent_trends
                                }
                              </span>
                            </div>
                            <div className="flex">
                              <span className="text-brown/70">Data Source</span>
                              <span className="text-olive ml-2">
                                {
                                  (property as any).property_analysis
                                    .crime_stats.data_source
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {(property as any).property_analysis.crime_stats
                          .specific_concerns?.length > 0 && (
                          <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                            <h4 className="font-medium text-brown mb-2">
                              Specific Concerns
                            </h4>
                            <div className="space-y-1 text-sm text-brown/70">
                              {(
                                property as any
                              ).property_analysis.crime_stats.specific_concerns.map(
                                (c: string, i: number) => (
                                  <p key={i}>{c}</p>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {(property as any).property_analysis
                      ?.gentrification_index && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Home className="w-5 h-5 text-brown" />
                          <h3 className="text-lg font-semibold text-brown">
                            Gentrification Analysis
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-6">
                              <h4 className="font-medium text-brown">
                                Gentrification Score
                              </h4>
                              <span className="bg-olive/20 text-olive border border-olive/30 px-3 py-1 rounded-full text-sm font-medium">
                                {
                                  (property as any).property_analysis
                                    .gentrification_index.score
                                }
                              </span>
                            </div>
                            <div className="space-y-3 ml-2.5 text-xs">
                              <div className="flex">
                                <span className="text-brown/70">Trend</span>
                                <span className="ml-2 text-olive">
                                  {
                                    (property as any).property_analysis
                                      .gentrification_index.trend
                                  }
                                </span>
                              </div>
                              <div className="flex">
                                <span className="text-brown/70">Timeline</span>
                                <span className="text-olive ml-2">
                                  {
                                    (property as any).property_analysis
                                      .gentrification_index.timeline
                                  }
                                </span>
                              </div>
                              <div className="flex">
                                <span className="text-brown/70">
                                  Property Value Impact
                                </span>
                                <span className="text-olive ml-2">
                                  {
                                    (property as any).property_analysis
                                      .gentrification_index
                                      .impact_on_property_value
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {(property as any).property_analysis
                            .gentrification_index.indicators?.length > 0 && (
                            <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                              <h4 className="font-medium text-brown mb-2">
                                Key Indicators
                              </h4>
                              <div className="space-y-1 text-sm text-brown/70">
                                {(
                                  property as any
                                ).property_analysis.gentrification_index.indicators.map(
                                  (ind: string, i: number) => (
                                    <p key={i}>{ind}</p>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          {(property as any).property_analysis?.error && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">
                  AI Property Analysis
                </h3>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  Property analysis is temporarily unavailable. Please try again
                  later.
                </p>
              </div>
            </div>
          )}

          {/* Commute Section (supports both shapes) */}
          {(hasTravelTimes || hasSimpleCommute) && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">
                  Commute Information
                </h3>
              </div>

              <div className="bg-beige/20 border border-beige rounded-lg p-6">
                {/* New rich commute */}
                {hasTravelTimes ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Map */}
                    <div>
                      {commute.map_url ? (
                        <div className="bg-white border border-beige/40 rounded-lg p-4">
                          <div className="aspect-square w-full">
                            <img
                              src={commute.map_url}
                              alt="Commute Map"
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.style.display = "none";
                                const fallback =
                                  t.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div className="hidden h-full items-center justify-center text-center text-brown/60">
                              <div>
                                <MapPin className="w-12 h-12 mx-auto mb-3 text-brown/40" />
                                <p className="text-brown font-medium">
                                  Map unavailable
                                </p>
                                <p className="text-sm text-brown/60 mt-1">
                                  Unable to load commute map
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-beige/40 rounded-lg p-4">
                          <div className="aspect-square w-full flex items-center justify-center">
                            <div className="text-center text-brown/60">
                              <MapPin className="w-12 h-12 mx-auto mb-3 text-brown/40" />
                              <p className="text-brown font-medium">
                                Commute Map
                              </p>
                              <p className="text-sm text-brown/60 mt-1">
                                Map generation in progress...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Travel times list */}
                    <div className="flex flex-col justify-center h-full space-y-4">
                      {commute.travel_times.map((c: any, i: number) => {
                        const travelTimeMinutes = c.travel_time
                          ? parseInt(String(c.travel_time).replace(/\D/g, ""))
                          : null;
                        const tolerance = c.commute_tolerance;

                        let colorClass = "text-olive bg-olive/10";
                        if (
                          typeof travelTimeMinutes === "number" &&
                          typeof tolerance === "number"
                        ) {
                          if (travelTimeMinutes > tolerance * 1.2) {
                            colorClass = "text-red-600 bg-red-50";
                          } else if (travelTimeMinutes > tolerance) {
                            colorClass = "text-amber-600 bg-amber-50";
                          }
                        }

                        return (
                          <Card key={i}>
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-brown/80 font-medium truncate">
                                    {c.location_name || c.name}
                                  </span>
                                  <span
                                    className={`font-medium px-2 py-1 rounded ml-2 flex-shrink-0 ${colorClass}`}
                                  >
                                    {c.travel_time || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-brown/60 truncate flex-1">
                                    {c.location_address || c.address}
                                  </p>
                                  {tolerance && (
                                    <p className="text-xs text-brown/60 ml-2 flex-shrink-0">
                                      Target: {tolerance} min
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Simple commute fallback
                  <div className="text-brown/70 text-sm">
                    {(property as any).commute_data?.commute_time && (
                      <p>
                        <strong className="text-brown">Commute Time:</strong>{" "}
                        {(property as any).commute_data.commute_time} minutes
                      </p>
                    )}
                    {(property as any).commute_data?.commute_distance && (
                      <p>
                        <strong className="text-brown">
                          Commute Distance:
                        </strong>{" "}
                        {(property as any).commute_data.commute_distance} miles
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
