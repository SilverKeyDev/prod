import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { formatDate, formatFilenameToAddress } from "packages/features/search/types/search/formatters/address";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { Report } from "packages/schemas";
import StatusBadge from "packages/ui/components/asset/StatusBadge";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { dateNow } from "packages/utils/date";

import { Card } from "@/components/layout";

import ActionButton from "./base/buttons/ActionButton";
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
  status: string
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
    if (report.generatedAt && typeof report.generatedAt.toISOString === "function") {
      return formatDate(report.generatedAt.toISOString());
    }
    return formatDate(report.generatedAt?.toString() || dateNow().toISOString());
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
    <Box className="absolute left-3 top-3 z-10">
      <BodyText
        as="p"
        size="xs"
        className="bg-background-surface text-text-secondary flex items-center rounded-md px-2 py-1 shadow-sm sm:text-sm"
      >
        <Icon name="clock" className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
        {formatReportDate(report)}
      </BodyText>
    </Box>
  );
}
function ReportCardTitle({ report, viewMode }: { report: Report; viewMode: "grid" | "list" }) {
  const address = formatFilenameToAddress(report.address);
  if (viewMode === "grid") {
    return (
      <Box className="flex-grow pt-4">
        <Box className="flex items-start justify-between">
          <Box className="mb-3 mt-1.5 flex-1">
            <Title
              as="h3"
              size="sm"
              className="overflow-hidden font-medium text-black sm:text-base"
              title={address}
              style={reportTitleStyleGrid}
            >
              {address}
            </Title>
          </Box>
        </Box>
      </Box>
    );
  }
  return (
    <Box className="flex-1 pt-6">
      <Title
        as="h3"
        className="mb-3 mt-6 overflow-hidden font-medium leading-5 text-black"
        title={address}
        style={reportTitleStyleList}
      >
        {address}
      </Title>
    </Box>
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
      <Box className="flex w-full min-w-0 flex-col gap-2">
        <ActionButton
          onClick={handleView}
          disabled={disabled}
          icon={<Icon name="eye" />}
          text={viewLabel}
          colorClasses="bg-primary-muted hover:bg-primary-hover text-white"
          className="w-full"
        />
        <Box className="flex min-w-0 gap-2">
          <ActionButton
            onClick={() => onDownload(report.id, report.address)}
            disabled={disabled}
            icon={<Icon name="download" />}
            text=""
            colorClasses="bg-accent-muted hover:!bg-neutral-200 active:!bg-neutral-300 text-white shadow-sm"
            className="min-w-0 flex-1"
            hideTextOnMobile
          />
          <ActionButton
            onClick={() => onShare(report)}
            disabled={disabled}
            icon={<Icon name="share" />}
            text=""
            colorClasses="bg-accent hover:bg-accent-hover text-white shadow-sm"
            className="min-w-0 flex-1"
            hideTextOnMobile
          />
          <ActionButton
            onClick={() => report.s3Key && onDelete(report.id, report.s3Key)}
            disabled={disabled || !canDelete}
            icon={<Icon name="trash-2" />}
            colorClasses="bg-transparent hover:bg-primary-muted text-destructive border border-border"
            title={deleteTitle}
            className="min-w-0 flex-1 sm:w-auto sm:flex-initial"
            hideTextOnMobile
          />
        </Box>
      </Box>
    );
  }
  return (
    <Box className="flex min-w-0 items-center gap-2">
      <ActionButton
        onClick={() => onDownload(report.id, report.address)}
        disabled={disabled}
        icon={<Icon name="download" />}
        text=""
        colorClasses="bg-accent-muted hover:!bg-neutral-200 active:!bg-neutral-300 text-white shadow-sm"
        className="min-w-0 flex-1"
        hideTextOnMobile
      />
      <ActionButton
        onClick={handleView}
        disabled={disabled}
        icon={<Icon name="eye" />}
        text={viewLabel}
        colorClasses="bg-primary-muted hover:bg-primary-hover text-white"
        className="min-w-0 flex-1"
      />
      <ActionButton
        onClick={() => onShare(report)}
        disabled={disabled}
        icon={<Icon name="share" />}
        text=""
        colorClasses="bg-accent hover:bg-accent-hover text-white shadow-sm"
        className="min-w-0 flex-1"
        hideTextOnMobile
      />
      <ActionButton
        onClick={() => report.s3Key && onDelete(report.id, report.s3Key)}
        disabled={disabled || !canDelete}
        icon={<Icon name="trash-2" />}
        colorClasses="bg-transparent hover:bg-primary-muted text-destructive border border-border"
        title={deleteTitle}
        className="min-w-0 sm:w-auto sm:flex-initial"
        hideTextOnMobile
      />
    </Box>
  );
}
function ReportCardGeneratingProgress({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <Box className={viewMode === "grid" ? "w-full py-2" : "w-full space-y-2"}>
      <Box className="h-2.5 w-full rounded-full bg-gray-200">
        <Box className="bg-primary h-2.5 rounded-full" style={{ width: "50%" }} />
      </Box>
    </Box>
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
      iconName="trash-2"
    >
      <Icon name="trash-2" className="mr-1 h-4 w-4" />
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
      border="charcoal"
      className={
        viewMode === "grid"
          ? `${getInteractiveCardClasses()} relative flex h-full flex-col`
          : "relative flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
      }
      hover={true}
      padding="md"
    >
      <ReportCardDate report={report} />
      <Box className="absolute right-3 top-3 z-10 hidden sm:block">
        <StatusBadge text={statusText} variant={getStatusVariant(report.status)} size="sm" />
      </Box>

      <Box className="flex min-w-0 flex-grow flex-col">
        <ReportCardTitle report={report} viewMode={viewMode} />
        <Box className="mt-auto w-full min-w-0 pt-4">
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
          {report.status === "generating" && <ReportCardGeneratingProgress viewMode={viewMode} />}
          {report.status === "error" && (
            <ReportCardErrorAction
              report={report}
              loadingUrls={loadingUrls}
              onDelete={onDelete}
              deleteLabel={t("reports.delete")}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
};
export default ReportCard;
