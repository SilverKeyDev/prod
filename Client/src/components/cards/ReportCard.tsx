import React from "react";
import { Card } from "../../components/ui/base";
import { Download, Share2, Eye, Trash2, Calendar } from "lucide-react";
import { CardPriceBubble, getInteractiveCardClasses } from "./base";
import { formatFilenameToAddress } from "../../lib/addressFormat";

export interface Report {
  id: string;
  address: string;
  status: "generating" | "completed" | "failed";
  generatedAt: Date;
  fileUrl?: string;
}

// Progress bar component for generating reports
interface ProgressBarProps {
  startTime: Date;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ startTime }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const updateProgress = () => {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / 1000; // seconds
      const maxTime = 290; // 240 seconds to reach 95%
      const maxProgress = 95; // 95% completion

      let currentProgress = (elapsed / maxTime) * maxProgress;
      currentProgress = Math.min(currentProgress, maxProgress); // Cap at 95%

      setProgress(currentProgress);
    };

    // Update immediately
    updateProgress();

    // Update every second
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-responsive-xs text-gold font-medium">
          Generating...
        </span>
        <span className="text-xs text-gold font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2.5 shadow-inner">
        <div
          className="bg-gold h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export interface ReportData {
  id: string;
  address: string;
  status: string;
  generatedAt: Date;
  s3Key?: string | null;
}

interface ReportCardProps {
  report: ReportData;
  loadingUrls: Set<string>;
  viewMode: "grid" | "list";
  onView: (reportId: string, address: string) => void;
  onDownload: (reportId: string, address: string) => void;
  onShare: (report: ReportData) => void;
  onDelete: (reportId: string, s3Key: string | null | undefined) => void;
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          {formatDate(report.generatedAt)}
        </p>
      </div>

      {/* Status Bubble in top right */}
      <CardPriceBubble
        price={getStatusText(report.status)}
        position="top-right"
        size="sm"
        className={`${getStatusColor(report.status)} border-0`}
      />

      {viewMode === "grid" ? (
        <>
          <div className="flex-grow pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 mt-1.5 mb-6">
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
        </>
      ) : (
        <>
          <div className="flex-1 pt-6">
            <h3
              className="font-medium text-black overflow-hidden leading-5 mt-6 mb-6"
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
        </>
      )}

      <div
        className={`flex flex-col gap-2 ${
          report.status === "completed" ? "mb-2" : ""
        }`}
      >
        {report.status === "completed" && (
          <>
            {viewMode === "grid" ? (
              <>
                {/* Mobile: Share, Delete, View buttons at top */}
                <div className="sm:hidden">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => onShare(report)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-beige hover:bg-beige/80 text-black font-medium py-1 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Share2 className="h-2.5 w-2.5 mr-1" />
                      Share
                    </button>
                    <button
                      onClick={() => onDelete(report.id, report.s3Key)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-white border border-red-600 text-red-600 hover:bg-red-500 hover:text-white font-medium py-1 rounded-lg transition-all duration-200 text-xs flex items-center justify-center touch-manipulation"
                      title="Delete report"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                    <button
                      onClick={() => onView(report.id, report.address)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-transparent border border-brown text-black hover:bg-brown hover:text-white font-medium py-1 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Eye className="h-2.5 w-2.5 mr-1" />
                      View
                    </button>
                  </div>
                  {/* Download button below */}
                  <button
                    onClick={() => onDownload(report.id, report.address)}
                    disabled={loadingUrls.has(report.id)}
                    className="w-full btn-primary py-1 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                  >
                    <Download className="h-2.5 w-2.5 mr-1" />
                    {loadingUrls.has(report.id) ? "Loading..." : "Download"}
                  </button>
                </div>

                {/* Desktop: Original layout */}
                <div className="hidden sm:flex sm:flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(report.id, report.address)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-transparent border border-brown text-black hover:bg-brown hover:text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {loadingUrls.has(report.id) ? "Loading..." : "View"}
                    </button>
                    <button
                      onClick={() => onDownload(report.id, report.address)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 btn-primary py-2 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {loadingUrls.has(report.id) ? "Loading..." : "Download"}
                    </button>
                    <button
                      onClick={() => onDelete(report.id, report.s3Key)}
                      disabled={loadingUrls.has(report.id)}
                      className="py-2 px-3 text-xs bg-white border border-red-600 text-red-600 hover:bg-red-500 hover:text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center touch-manipulation"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onShare(report)}
                    disabled={loadingUrls.has(report.id)}
                    className="w-full bg-beige hover:bg-beige/80 text-black font-medium px-6 py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    {loadingUrls.has(report.id) ? "Loading..." : "Share"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Mobile: Download button at top, shorter */}
                <div className="sm:hidden">
                  <button
                    onClick={() => onDownload(report.id, report.address)}
                    disabled={loadingUrls.has(report.id)}
                    className="w-full btn-primary py-2 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                  >
                    <Download className="h-2.5 w-2.5 mr-1" />
                    {loadingUrls.has(report.id) ? "Loading..." : "Download"}
                  </button>
                  {/* Share, Delete, View buttons side by side below */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onShare(report)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-beige hover:bg-beige/80 text-black font-medium py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Share2 className="h-2.5 w-2.5 mr-1" />
                      Share
                    </button>
                    <button
                      onClick={() => onDelete(report.id, report.s3Key)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-white border border-red-600 text-red-600 hover:bg-red-500 hover:text-white font-medium py-2 rounded-lg transition-all duration-200 text-xs flex items-center justify-center touch-manipulation"
                      title="Delete report"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                    <button
                      onClick={() => onView(report.id, report.address)}
                      disabled={loadingUrls.has(report.id)}
                      className="flex-1 bg-transparent border border-brown text-gray-600 hover:bg-brown hover:text-white font-medium py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Eye className="h-2.5 w-2.5 mr-1" />
                      View
                    </button>
                  </div>
                </div>

                {/* Desktop: Original layout */}
                <div className="hidden sm:flex sm:flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(report.id, report.address)}
                      disabled={loadingUrls.has(report.id)}
                      className="bg-transparent border border-brown text-gray-600 hover:bg-brown hover:text-white font-medium px-2 py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {loadingUrls.has(report.id) ? "Loading..." : "View"}
                    </button>
                    <button
                      onClick={() => onDownload(report.id, report.address)}
                      disabled={loadingUrls.has(report.id)}
                      className="btn-primary py-2 px-2 text-xs font-bold flex items-center disabled:opacity-50 touch-manipulation select-none"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {loadingUrls.has(report.id) ? "Loading..." : "Download"}
                    </button>
                    <button
                      onClick={() => onDelete(report.id, report.s3Key)}
                      disabled={loadingUrls.has(report.id)}
                      className="sm:p-2 sm:text-red-600 sm:hover:bg-red-50 sm:rounded-lg sm:transition-colors touch-friendly bg-white border border-red-600 text-red-600 hover:bg-red-500 hover:text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onShare(report)}
                    disabled={loadingUrls.has(report.id)}
                    className="w-full bg-beige hover:bg-beige/80 text-black font-medium px-6 py-2 rounded-lg transition-all duration-200 text-xs font-bold flex items-center justify-center disabled:opacity-50 touch-manipulation select-none"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    {loadingUrls.has(report.id) ? "Loading..." : "Share"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {report.status === "generating" && (
          <div
            className={viewMode === "grid" ? "w-full py-2" : "w-full space-y-2"}
          >
            <ProgressBar
              startTime={
                viewMode === "list"
                  ? new Date(report.generatedAt.getTime())
                  : report.generatedAt
              }
            />
          </div>
        )}
        {report.status === "error" && (
          <div
            className={
              viewMode === "grid"
                ? "flex items-center justify-center space-x-2 w-full"
                : "flex items-center space-x-2"
            }
          >
            <button
              onClick={() => onDelete(report.id, report.s3Key)}
              disabled={loadingUrls.has(report.id)}
              className={
                viewMode === "grid"
                  ? "flex-1 btn-danger py-2 text-sm flex items-center justify-center disabled:opacity-50"
                  : "btn-danger py-2 px-3 text-xs sm:text-sm flex items-center disabled:opacity-50 touch-friendly"
              }
            >
              <Trash2
                className={
                  viewMode === "grid"
                    ? "h-4 w-4 mr-1"
                    : "h-3 w-3 sm:h-4 sm:w-4 mr-1"
                }
              />
              Delete
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportCard;
