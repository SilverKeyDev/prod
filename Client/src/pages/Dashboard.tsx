import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { favoriteHomesApi } from "../lib/api";
import ReportCard from "../components/cards/ReportCard";
import { useReports } from "../context";
import { Report } from "../context/utils";
import { CardCarousel } from "../components/cards/base";
import TimelineChecklist from "../components/ui/dashboard/DashboardButtonHeader";
import HomeCard, { HomeDescription } from "../components/cards/HomeCard";
// Card component available but not used in this file yet
import CircularButton from "../components/ui/base/CircularButton";
import { useDocumentActions } from "../hooks/useDocumentActions";
import PdfModal from "../components/modals/PdfModal";

export default function Dashboard() {
  const navigate = useNavigate();
  // 🆕 Fetch favorite homes
  const [favoriteHomes, setFavoriteHomes] = useState<HomeDescription[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [favError, setFavError] = useState<string | null>(null);

  // Use preloaded report data from context
  const { reports, loading: reportsLoading, refreshReports } = useReports();

  // Use centralized document actions
  const {
    loadingUrls,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    currentPdf,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  // Helper function to check if a home is saved
  const isHomeSaved = (homeId: string): boolean => {
    return favoriteHomes.some((home) => home.home_id === homeId);
  };

  // Handle saving a home
  const handleSaveHome = async (property: any) => {
    try {
      await favoriteHomesApi.addFavorite(property);
      // Refresh the saved homes list - we'll trigger a re-fetch via useEffect
      window.location.reload();
    } catch (error) {
      console.error("Error saving home:", error);
    }
  };

  // Handle removing a saved home
  const handleRemoveHome = async (homeId: string) => {
    try {
      await favoriteHomesApi.removeFavorite(homeId);
      // Update local state by removing the home
      setFavoriteHomes((prev) =>
        prev.filter((home) => home.home_id !== homeId)
      );
    } catch (error) {
      console.error("Error removing home from favorites:", error);
    }
  };

  // Navigation handlers
  const handleSavedHomesClick = () => {
    navigate("/dashboard/search");
  };

  const handleDocumentsClick = () => {
    navigate("/dashboard/reports");
  };

  useEffect(() => {
    const fetchFavs = async () => {
      setFavLoading(true);
      setFavError(null);
      try {
        const res = await favoriteHomesApi.getFavorites();
        if (res.success) {
          // Backend returns { favorites: HomeUniversal[] } where each is an object
          const rawHomes = res.favorites || [];
          // Map HomeUniversal fields to HomeDescription for HomeCard
          const homeObjects: HomeDescription[] = rawHomes.map(
            (home: any, index: number) => ({
              home_id: home.address || `home_${index}_${Date.now()}`,
              description: home.address || "",
              address: home.address || "",
              price: home.price || "",
              bedrooms: parseInt(home.beds) || 0,
              bathrooms: parseInt(home.baths) || 0,
              sqft: parseInt(home.sqft) || 0,
              lot_size: home.lot_size || "",
              image_url: home.image_url || undefined,
              lat: home.lat || 0,
              lng: home.lng || 0,
              // Any other HomeUniversal fields can be passed through
              ...home,
            })
          );
          setFavoriteHomes(homeObjects);
        } else {
          setFavError(res.error || "Failed to load favorite homes");
        }
      } catch (error) {
        setFavError("Failed to load favorite homes");
      }
      setFavLoading(false);
    };

    fetchFavs();
    // Refresh reports when dashboard loads
    refreshReports();
  }, [refreshReports]);

  // Share individual report using centralized function
  const handleShareReport = useCallback(
    async (report: Report) => {
      await handleShareDocument(report.address);
      // Handle success/error feedback here if needed
    },
    [handleShareDocument]
  );

  // Handle delete - redirect to PastReports for full functionality
  const handleDeleteReport = useCallback(
    async (_reportId: string, _s3Key: string | null | undefined) => {
      // Navigate to PastReports where delete functionality is fully implemented
      navigate("/reports");
    },
    [navigate]
  );

  return (
    <div>
      {currentPdf && (
        <PdfModal
          currentPdf={currentPdf}
          currentReportAddress={currentDocumentName}
          onClose={closePdfModal}
        />
      )}
      {/* Timeline Progress - Full Width */}
      <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8">
        <TimelineChecklist variant="horizontal" completedStepKey="search" />
      </div>

      {/* Favorite Homes */}
      <div className="mt-12">
        <CardCarousel
          items={favoriteHomes}
          embeddedButton={
            <CircularButton
              onClick={handleSavedHomesClick}
              title="Click to view all saved homes"
            >
              Your Saved Homes
            </CircularButton>
          }
          loading={favLoading}
          error={favError}
          emptyMessage="Save your first home today"
          minCardWidth={320}
          maxCardWidth={400}
          cardGap={16}
          renderItem={(home) => (
            <HomeCard
              home={home}
              isHomeSaved={isHomeSaved}
              onSave={handleSaveHome}
              onRemove={handleRemoveHome}
            />
          )}
          getItemKey={(home) => home.home_id}
        />
      </div>

      {/* Recent Reports */}
      <div className="my-8">
        <CardCarousel
          items={reports}
          embeddedButton={
            <CircularButton
              onClick={handleDocumentsClick}
              title="Click to view all reports"
            >
              Your Reports
            </CircularButton>
          }
          loading={reportsLoading}
          error={null}
          emptyMessage="Generate your first property report to get started"
          minCardWidth={320}
          maxCardWidth={400}
          renderItem={(report) => (
            <div>
              <ReportCard
                report={report}
                loadingUrls={loadingUrls}
                viewMode="grid"
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                onShare={() => handleShareReport(report)}
                onDelete={handleDeleteReport}
              />
            </div>
          )}
          getItemKey={(report) => report.id}
        />
      </div>
    </div>
  );
}
