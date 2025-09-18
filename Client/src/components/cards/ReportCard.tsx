import { Eye, Download, Share, Trash2, Clock } from "lucide-react";
import React from "react";

import type { Report } from "../../core/schemas";
import { formatFilenameToAddress } from "../../core/utils/address";
import ActionButton from "../../features/decide/ActionButton";
import { Card } from "../format";

import { getInteractiveCardClasses } from "./base/CardHoverStyles";
import CardPriceBubble from "./base/CardPriceBubble";

export type ReportCardProps = {
  report: Report;
  viewMode: "grid" | "list";
  onView: (id: string, address: string) => void;
  onDownload: (id: string, address: string) => void;
  onShare: (report: Report) => void;
  onDelete: (id: string, s3Key: string) => void;
  loadingUrls: Set<string>;
};

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  loadingUrls,
  viewMode,
  onView,
  onDownload,
  onShare,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "generating":
        return "text-gold bg-gold/10";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-black/60 bg-beige/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "generating":
        return "Generating...";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  return (
    <Card
      className={
        viewMode === "grid"
          ? `${getInteractiveCardClasses()} relative flex h-full flex-col`
          : "relative flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
      }
      hover={true}
    >
      {/* Date in top left */}
      <div className="absolute left-3 top-3 z-10">
        <p className="flex items-center rounded-md bg-white/90 px-2 py-1 text-xs text-black/60 shadow-sm sm:text-sm">
          <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
          {new Date(report.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Status Bubble in top right */}
      <CardPriceBubble
        price={getStatusText(report.status)}
        position="top-right"
        size="sm"
        className={`${getStatusColor(report.status)} border-0`}
      />

      <div className="flex flex-grow flex-col">
        {viewMode === "grid" ? (
          <div className="flex-grow pt-4">
            <div className="flex items-start justify-between">
              <div className="mb-3 mt-1.5 flex-1">
                <h3
                  className="overflow-hidden text-sm font-medium text-black sm:text-base"
                  title={formatFilenameToAddress(report.address)}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    wordBreak: "break-word",
                    hyphens: "auto",
                    minHeight: "3rem", // Reserve space for 2 lines at text-sm/base
                  }}
                >
                  {formatFilenameToAddress(report.address)}
                </h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 pt-6">
            <h3
              className="mb-3 mt-6 overflow-hidden font-medium leading-5 text-black"
              title={formatFilenameToAddress(report.address)}
              style={{
                maxWidth: "calc(100% - 10rem)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                wordBreak: "break-word",
                hyphens: "auto",
                minHeight: "2.4rem", // Reserve space for 2 lines
              }}
            >
              {formatFilenameToAddress(report.address)}
            </h3>
          </div>
        )}

        <div className="mt-auto pt-4">
          {report.status === "completed" &&
            (viewMode === "grid" ? (
              <div className="flex flex-col gap-2">
                <ActionButton
                  onClick={() => onView(report.id, report.address)}
                  disabled={loadingUrls.has(report.id)}
                  icon={<Eye />}
                  text="View"
                  colorClasses="bg-olive-muted hover:bg-olive-light text-white"
                  className="w-full"
                />
                <div className="flex gap-2">
                  <ActionButton
                    onClick={() => onDownload(report.id, report.address)}
                    disabled={loadingUrls.has(report.id)}
                    icon={<Download />}
                    text=""
                    colorClasses="bg-brown-muted hover:bg-brown/90 text-white"
                    className="min-w-0 flex-1"
                    hideTextOnMobile
                  />
                  <ActionButton
                    onClick={() => onShare(report)}
                    disabled={loadingUrls.has(report.id)}
                    icon={<Share />}
                    text=""
                    colorClasses="bg-gold hover:bg-gold/90 text-white"
                    className="min-w-0 flex-1"
                    hideTextOnMobile
                  />
                  <ActionButton
                    onClick={() => {
                      if (report.s3Key) {
                        onDelete(report.id, report.s3Key);
                      }
                    }}
                    disabled={loadingUrls.has(report.id) ?? !report.s3Key}
                    icon={<Trash2 />}
                    colorClasses="bg-transparent hover:bg-danger/10 text-danger border border-danger"
                    title="Delete report"
                    className="min-w-0 flex-1 sm:w-auto sm:flex-initial"
                    hideTextOnMobile
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={() => onDownload(report.id, report.address)}
                  disabled={loadingUrls.has(report.id)}
                  icon={<Download />}
                  text=""
                  colorClasses="bg-brown-muted hover:bg-brown/90 text-white"
                  className="flex-1"
                  hideTextOnMobile
                />
                <ActionButton
                  onClick={() => onView(report.id, report.address)}
                  disabled={loadingUrls.has(report.id)}
                  icon={<Eye />}
                  text="View"
                  colorClasses="bg-olive-muted hover:bg-olive-light text-white"
                  className="flex-1"
                />
                <ActionButton
                  onClick={() => onShare(report)}
                  disabled={loadingUrls.has(report.id)}
                  icon={<Share />}
                  text=""
                  colorClasses="bg-gold hover:bg-gold/90 text-white"
                  className="flex-1"
                  hideTextOnMobile
                />
                <ActionButton
                  onClick={() => {
                    if (report.s3Key) {
                      onDelete(report.id, report.s3Key);
                    }
                  }}
                  disabled={loadingUrls.has(report.id) ?? !report.s3Key}
                  icon={<Trash2 />}
                  colorClasses="bg-transparent hover:bg-danger/10 text-danger border border-danger"
                  title="Delete report"
                  className="sm:w-auto sm:flex-initial"
                  hideTextOnMobile
                />
              </div>
            ))}

          {report.status === "generating" && (
            <div
              className={
                viewMode === "grid" ? "w-full py-2" : "w-full space-y-2"
              }
            >
              {/* Placeholder for a progress bar */}
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `50%` }}
                ></div>
              </div>
            </div>
          )}
          {report.status === "error" && (
            <button
              onClick={() => {
                if (report.s3Key) {
                  onDelete(report.id, report.s3Key);
                }
              }}
              disabled={loadingUrls.has(report.id) ?? !report.s3Key}
              className="btn-danger flex w-full items-center justify-center"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ReportCard;
