import React from "react";

import { log, LOG_CATEGORIES } from "logger";
import { Clock, Download, Eye, Share, Trash2 } from "lucide-react";

import { useLocalization } from "packages/contexts";
import type { Report } from "packages/schemas";
import { dateNow } from "packages/utils/core/date";
import {
  formatDate,
  formatFilenameToAddress,
} from "packages/utils/domain/search/address";

import { Card } from "@/components/layout";
import {
  BodyText,
  Button,
  StatusBadge,
  Title,
} from "@/components/ui/index.web";
import ActionButton from "@/features/decide/ActionButton";

import { getInteractiveCardClasses } from "./base/index.web";

export type ReportCardProps = {
  report: Report;
  viewMode: "grid" | "list";
  onView: (id: string, address: string) => void;
  onDownload: (id: string, address: string) => void;
  onShare: (report: Report) => void;
  onDelete: (id: string, s3Key: string) => void;
  loadingUrls: Set<string>;
};

function getStatusVariant(
  status: string,
): "success" | "warning" | "error" | "info" | "processing" | "default" {
  switch (status) {
    case "completed":
      return "success";
    case "generating":
      return "processing";
    case "error":
      return "error";
    default:
      return "default";
  }
}

function formatReportDate(report: Report): string {
  try {
    if (
      report.generatedAt &&
      typeof report.generatedAt.toISOString === "function"
    ) {
      return formatDate(report.generatedAt.toISOString());
    }
    return formatDate(
      report.generatedAt?.toString() || dateNow().toISOString(),
    );
  } catch {
    return formatDate(dateNow().toISOString());
  }
}

const reportTitleStyleGrid = {
  display: "-webkit-box" as const,
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  wordBreak: "break-word" as const,
  hyphens: "auto" as const,
  minHeight: "3rem",
  maxHeight: "3rem",
  lineHeight: "1.5",
};

const reportTitleStyleList = {
  maxWidth: "calc(100% - 10rem)",
  display: "-webkit-box" as const,
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  wordBreak: "break-word" as const,
  hyphens: "auto" as const,
  minHeight: "2.4rem",
  maxHeight: "2.4rem",
  lineHeight: "1.2",
};

function ReportCardDate({ report }: { report: Report }) {
  return (
    <div className="absolute left-3 top-3 z-10">
      <BodyText
        as="p"
        size="xs"
        className="flex items-center rounded-md bg-white/90 px-2 py-1 text-black/60 shadow-sm sm:text-sm"
      >
        <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
        {formatReportDate(report)}
      </BodyText>
    </div>
  );
}

function ReportCardTitle({
  report,
  viewMode,
}: {
  report: Report;
  viewMode: "grid" | "list";
}) {
  const address = formatFilenameToAddress(report.address);
  if (viewMode === "grid") {
    return (
      <div className="flex-grow pt-4">
        <div className="flex items-start justify-between">
          <div className="mb-3 mt-1.5 flex-1">
            <Title
              as="h3"
              size="sm"
              className="overflow-hidden font-medium text-black sm:text-base"
              title={address}
              style={reportTitleStyleGrid}
            >
              {address}
            </Title>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 pt-6">
      <Title
        as="h3"
        className="mb-3 mt-6 overflow-hidden font-medium leading-5 text-black"
        title={address}
        style={reportTitleStyleList}
      >
        {address}
      </Title>
    </div>
  );
}

function ReportCardCompletedActions({
  report,
  viewMode,
  loadingUrls,
  onView,
  onDownload,
  onShare,
  onDelete,
  viewLabel,
  deleteTitle,
}: {
  report: Report;
  viewMode: "grid" | "list";
  loadingUrls: Set<string>;
  onView: (id: string, address: string) => void;
  onDownload: (id: string, address: string) => void;
  onShare: (report: Report) => void;
  onDelete: (id: string, s3Key: string) => void;
  viewLabel: string;
  deleteTitle: string;
}) {
  const handleView = () => {
    log.debug(LOG_CATEGORIES.PAGES, "[ReportCard] View button clicked", {
      reportId: report.id,
      address: report.address,
      s3Key: report.s3Key,
      status: report.status,
      timestamp: dateNow().toISOString(),
    });
    onView(report.id, report.address);
  };

  const disabled = loadingUrls.has(report.id);
  const canDelete = !!report.s3Key;

  if (viewMode === "grid") {
    return (
      <div className="flex w-full min-w-0 flex-col gap-2">
        <ActionButton
          onClick={handleView}
          disabled={disabled}
          icon={<Eye />}
          text={viewLabel}
          colorClasses="bg-olive-muted hover:bg-olive-light text-white"
          className="w-full"
        />
        <div className="flex min-w-0 gap-2">
          <ActionButton
            onClick={() => onDownload(report.id, report.address)}
            disabled={disabled}
            icon={<Download />}
            text=""
            colorClasses="bg-brown-muted hover:bg-brown/90 text-white"
            className="min-w-0 flex-1"
            hideTextOnMobile
          />
          <ActionButton
            onClick={() => onShare(report)}
            disabled={disabled}
            icon={<Share />}
            text=""
            colorClasses="bg-gold hover:bg-gold/90 text-white"
            className="min-w-0 flex-1"
            hideTextOnMobile
          />
          <ActionButton
            onClick={() => report.s3Key && onDelete(report.id, report.s3Key)}
            disabled={disabled || !canDelete}
            icon={<Trash2 />}
            colorClasses="bg-transparent hover:bg-danger/10 text-danger border border-danger"
            title={deleteTitle}
            className="min-w-0 flex-1 sm:w-auto sm:flex-initial"
            hideTextOnMobile
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <ActionButton
        onClick={() => onDownload(report.id, report.address)}
        disabled={disabled}
        icon={<Download />}
        text=""
        colorClasses="bg-brown-muted hover:bg-brown/90 text-white"
        className="min-w-0 flex-1"
        hideTextOnMobile
      />
      <ActionButton
        onClick={handleView}
        disabled={disabled}
        icon={<Eye />}
        text={viewLabel}
        colorClasses="bg-olive-muted hover:bg-olive-light text-white"
        className="min-w-0 flex-1"
      />
      <ActionButton
        onClick={() => onShare(report)}
        disabled={disabled}
        icon={<Share />}
        text=""
        colorClasses="bg-gold hover:bg-gold/90 text-white"
        className="min-w-0 flex-1"
        hideTextOnMobile
      />
      <ActionButton
        onClick={() => report.s3Key && onDelete(report.id, report.s3Key)}
        disabled={disabled || !canDelete}
        icon={<Trash2 />}
        colorClasses="bg-transparent hover:bg-danger/10 text-danger border border-danger"
        title={deleteTitle}
        className="min-w-0 sm:w-auto sm:flex-initial"
        hideTextOnMobile
      />
    </div>
  );
}

function ReportCardGeneratingProgress({
  viewMode,
}: {
  viewMode: "grid" | "list";
}) {
  return (
    <div className={viewMode === "grid" ? "w-full py-2" : "w-full space-y-2"}>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div
          className="bg-primary h-2.5 rounded-full"
          style={{ width: "50%" }}
        />
      </div>
    </div>
  );
}

function ReportCardErrorAction({
  report,
  loadingUrls,
  onDelete,
  deleteLabel,
}: {
  report: Report;
  loadingUrls: Set<string>;
  onDelete: (id: string, s3Key: string) => void;
  deleteLabel: string;
}) {
  return (
    <Button
      variant="danger"
      size="md"
      onClick={() => report.s3Key && onDelete(report.id, report.s3Key)}
      disabled={loadingUrls.has(report.id) || !report.s3Key}
      className="w-full"
    >
      <Trash2 className="mr-1 h-4 w-4" />
      {deleteLabel}
    </Button>
  );
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
  const { t } = useLocalization();
  const statusText = (() => {
    switch (report.status) {
      case "completed":
        return t("reports.completed");
      case "generating":
        return t("reports.generating");
      case "error":
        return t("reports.error");
      default:
        return report.status;
    }
  })();

  return (
    <Card
      className={
        viewMode === "grid"
          ? `${getInteractiveCardClasses()} relative flex h-full flex-col`
          : "relative flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
      }
      hover={true}
      padding="md"
    >
      <ReportCardDate report={report} />
      <div className="absolute top-3 right-3 z-10 hidden sm:block">
        <StatusBadge
          text={statusText}
          variant={getStatusVariant(report.status)}
          size="sm"
        />
      </div>

      <div className="flex min-w-0 flex-grow flex-col">
        <ReportCardTitle report={report} viewMode={viewMode} />
        <div className="mt-auto w-full min-w-0 pt-4">
          {report.status === "completed" && (
            <ReportCardCompletedActions
              report={report}
              viewMode={viewMode}
              loadingUrls={loadingUrls}
              onView={onView}
              onDownload={onDownload}
              onShare={onShare}
              onDelete={onDelete}
              viewLabel={t("common.view")}
              deleteTitle={t("reports.delete_report")}
            />
          )}
          {report.status === "generating" && (
            <ReportCardGeneratingProgress viewMode={viewMode} />
          )}
          {report.status === "error" && (
            <ReportCardErrorAction
              report={report}
              loadingUrls={loadingUrls}
              onDelete={onDelete}
              deleteLabel={t("reports.delete")}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default ReportCard;
