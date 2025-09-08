import React from "react";
import { Card } from "../layout";
import { Eye, Download, Share, Trash2, Clock } from "lucide-react";
import { Report } from "../../types";
import { formatFilenameToAddress } from "../../lib/addressFormat";
import ActionButton from "../../features/decide/ActionButton";
import { getInteractiveCardClasses } from "./base/CardHoverStyles";
import CardPriceBubble from "./base/CardPriceBubble";

export interface ReportCardProps {
  report: Report;
  viewMode: "grid" | "list";
  onView: (id: string, address: string) => void;
  onDownload: (id: string, address: string) => void;
  onShare: (report: Report) => void;
  onDelete: (id: string, s3Key: string) => void;
  loadingUrls: Set<string>;
}

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
          ? `${getInteractiveCardClasses()} flex flex-col h-full relative`
          : "flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 relative"
      }
      hover={true}
    >
      {/* Date in top left */}
      <div className="absolute top-3 left-3 z-10">
        <p className="text-xs sm:text-sm text-black/60 flex items-center bg-white/90 px-2 py-1 rounded-md shadow-sm">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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

      <div className="flex-grow flex flex-col">
        {viewMode === "grid" ? (
          <div className="flex-grow pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 mt-1.5 mb-3">
                <h3
                  className="text-sm sm:text-base font-medium text-black overflow-hidden"
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
              className="font-medium text-black overflow-hidden leading-5 mt-6 mb-3"
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
                    text="Download"
                    colorClasses="bg-brown-muted hover:bg-brown/90 text-white"
                    className="flex-1 min-w-0"
                    hideTextOnMobile
                  />
                  <ActionButton
                    onClick={() => onShare(report)}
                    disabled={loadingUrls.has(report.id)}
                    icon={<Share />}
                    text="Share"
                    colorClasses="bg-gold hover:bg-gold/90 text-white"
                    className="flex-1 min-w-0"
                    hideTextOnMobile
                  />
                  <ActionButton
                    onClick={() => {
                      if (report.s3Key) {
                        onDelete(report.id, report.s3Key);
                      }
                    }}
                    disabled={loadingUrls.has(report.id) || !report.s3Key}
                    icon={<Trash2 />}
                    colorClasses="bg-transparent hover:bg-danger/10 text-danger border border-danger"
                    title="Delete report"
                    className="flex-1 min-w-0 sm:flex-initial sm:w-auto"
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
                  text="Download"
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
                  text="Share"
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
                  disabled={loadingUrls.has(report.id) || !report.s3Key}
                  icon={<Trash2 />}
                  colorClasses="bg-transparent hover:bg-danger/10 text-danger border border-danger"
                  title="Delete report"
                  className="sm:flex-initial sm:w-auto"
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
              <div className="w-full bg-gray-200 rounded-full h-2.5">
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
              disabled={loadingUrls.has(report.id) || !report.s3Key}
              className="w-full btn-danger flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ReportCard;
