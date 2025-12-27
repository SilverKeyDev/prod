import React from "react";

export function formatStrategyValue(
  val: unknown
): React.JSX.Element | string {
  if (typeof val === "object" && val !== null) {
    if (Array.isArray(val)) {
      // Format arrays as clean bullet points with modern styling
      return (
        <ul className="ml-2 space-y-2">
          {val.map((item, idx) => (
            <li
              key={idx}
              className="text-responsive-sm flex items-start gap-2 text-navy/80"
            >
              <span className="flex h-5 flex-shrink-0 items-center text-brown">
                <span className="h-px w-2 bg-brown"></span>
              </span>
              <span>
                {typeof item === "object" && item !== null
                  ? // Handle objects properly - extract meaningful content
                    Object.entries(item as Record<string, unknown>)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(", ")
                      .replace(/_/g, " ")
                  : // Handle strings and primitives
                    String(item)
                      .replace(/_/g, " ")
                      .replace(/([a-z])([A-Z])/g, "$1 $2")
                      .split(" ")
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      )
                      .join(" ")}
              </span>
            </li>
          ))}
        </ul>
      );
    } else {
      // For objects, create clean structured display without JSON
      return (
        <div className="space-y-2">
          {Object.entries(val).map(([subKey, subValue]) => {
            // Format the sub-key nicely
            const formattedKey = subKey
              .replace(/_/g, " ")
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .split(" ")
              .map(
                (word: string) =>
                  word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(" ");

            return (
              <div
                key={subKey}
                className="rounded-lg border-l-4 border-brown/30 bg-gray-50/50 p-3"
              >
                <div className="text-responsive-sm mb-2 font-semibold text-brown">
                  {formattedKey}
                </div>
                <div className="text-responsive-sm text-navy/80">
                  {typeof subValue === "object" && subValue !== null ? (
                    Array.isArray(subValue) ? (
                      <ul className="ml-2 space-y-2">
                        {subValue.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-responsive-sm flex items-start gap-2"
                          >
                            <span className="flex h-5 flex-shrink-0 items-center text-brown">
                              <span className="h-px w-2 bg-brown"></span>
                            </span>
                            <span>
                              {typeof item === "object"
                                ? Object.entries(
                                    item as Record<string, unknown>
                                  )
                                    .map(
                                      ([k, v]) =>
                                        `${k.replace(/_/g, " ")}: ${String(v)}`
                                    )
                                    .join(", ")
                                : String(item)
                                    .replace(/_/g, " ")
                                    .replace(/([a-z])([A-Z])/g, "$1 $2")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Nested objects - display as key-value pairs with bullets
                      <div className="space-y-2">
                        {Object.entries(
                          subValue as Record<string, unknown>
                        ).map(([nestedKey, nestedValue]) => (
                          <div
                            key={nestedKey}
                            className="text-responsive-xs flex items-start gap-2"
                          >
                            <span className="flex h-5 flex-shrink-0 items-center text-brown">
                              <span className="h-px w-2 bg-brown"></span>
                            </span>
                            <div className="flex-1">
                              <span className="font-medium text-brown/80">
                                {nestedKey
                                  .replace(/_/g, " ")
                                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                                  .split(" ")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                                :
                              </span>{" "}
                              <span className="text-navy/70">
                                {typeof nestedValue === "boolean"
                                  ? nestedValue
                                    ? "Yes"
                                    : "No"
                                  : typeof nestedValue === "number"
                                    ? nestedValue.toLocaleString()
                                    : Array.isArray(nestedValue)
                                      ? nestedValue
                                          .join(", ")
                                          .replace(/_/g, " ")
                                      : (nestedValue
                                          ?.toString()
                                          .replace(/_/g, " ")
                                          .replace(/([a-z])([A-Z])/g, "$1 $2") ??
                                        "Not specified")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : typeof subValue === "boolean" ? (
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        subValue
                          ? "bg-green-100 text-green-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {subValue ? "Yes" : "No"}
                    </span>
                  ) : typeof subValue === "number" ? (
                    <span className="font-mono text-brown">
                      {subValue.toLocaleString()}
                    </span>
                  ) : // Special formatting for price rationale
                  subKey === "price_rationale" &&
                    typeof subValue === "string" ? (
                    <div className="space-y-2">
                      {subValue
                        .split(". ")
                        .filter((sentence) => sentence.trim().length > 0)
                        .map((sentence, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2"
                          >
                            <span className="flex h-5 flex-shrink-0 items-center text-brown mt-1">
                              <span className="h-px w-2 bg-brown"></span>
                            </span>
                            <span className="text-responsive-sm text-navy/80 leading-relaxed">
                              {sentence.trim()}
                              {!sentence.endsWith(".") && "."}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="leading-relaxed">
                      {subValue && typeof subValue === "string"
                        ? subValue
                            .replace(/_/g, " ")
                            .replace(/([a-z])([A-Z])/g, "$1 $2")
                        : subValue && typeof subValue === "number"
                          ? subValue
                              .toString()
                              .replace(/_/g, " ")
                              .replace(/([a-z])([A-Z])/g, "$1 $2")
                          : "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  } else if (typeof val === "boolean") {
    return (
      <span
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          val
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {val ? "Yes" : "No"}
      </span>
    );
  } else if (typeof val === "number") {
    return (
      <span className="font-mono text-lg font-semibold text-brown">
        {val.toLocaleString()}
      </span>
    );
  } else {
    return (
      <p className="leading-relaxed text-navy/80">
        {String(val)
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")}
      </p>
    );
  }
}

