import { User, Phone } from "lucide-react";
import React from "react";

import Card from "../../format/Card";

import type { PropertyComponentProps } from "./types";

export const PropertyAgent: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const listedBy = (property as unknown as { listed_by: unknown }).listed_by;

  if (!listedBy || typeof listedBy !== "object") {
    return null;
  }

  const agent = listedBy as Record<string, unknown>;
  const imageUrl = agent.image_url as string | undefined;
  const displayName = agent.display_name as string | undefined;
  const businessName = agent.business_name as string | undefined;
  const phone = agent.phone as Record<string, unknown> | undefined;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-brown">Listing Agent</h3>
      </div>

      <Card className="p-4">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-brown/20 bg-brown/10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={displayName ?? "Listing Agent"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`h-full w-full items-center justify-center ${
                  imageUrl ? "hidden" : "flex"
                }`}
              >
                <User className="h-8 w-8 text-brown/60" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h4 className="text-lg font-medium text-brown">{displayName}</h4>
            {businessName && <p className="text-brown/70">{businessName}</p>}
            {phone && (
              <div className="mt-2 flex items-center text-brown">
                <Phone className="mr-1 h-4 w-4" />
                <span>
                  {(() => {
                    const ph = phone;
                    if (!ph) return "Phone available";
                    const { areacode, prefix, number } = ph;

                    // Type-safe string conversion with proper type guards
                    const safeStringify = (value: unknown): string => {
                      if (typeof value === "string") return value;
                      if (typeof value === "number") return String(value);
                      if (value === null || value === undefined) return "";
                      if (typeof value === "object" && value !== null) {
                        try {
                          return JSON.stringify(value);
                        } catch {
                          return "[Object]";
                        }
                      }
                      try {
                        if (typeof value === "string") return value;
                        if (typeof value === "number") return String(value);
                        if (typeof value === "boolean") return String(value);
                        if (value === null || value === undefined) return "";
                        return "[Unknown]";
                      } catch {
                        return "[Unknown]";
                      }
                    };

                    if (areacode && prefix && number) {
                      return `(${safeStringify(areacode)}) ${safeStringify(prefix)}-${safeStringify(number)}`;
                    }
                    return (
                      (typeof areacode === "string" ? areacode : null) ??
                      (typeof prefix === "string" ? prefix : null) ??
                      (typeof number === "string" ? number : null) ??
                      "Phone available"
                    );
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
