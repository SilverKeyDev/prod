import { useRef, useEffect } from "react";
import { Download, Share, X } from "lucide-react";
import MiniLogo from "../ui/MiniLogo";
import { formatFilenameToAddress } from "../../lib/addressFormat";

export interface PdfModalProps {
  currentPdf: string | null;
  currentReportAddress: string | null;
  onClose: () => void;
  onShare?: () => void;
  // reports?: any[]; // Optional, not used in modal rendering
}

const PdfModal: React.FC<PdfModalProps> = ({
  currentPdf,
  currentReportAddress,
  onClose,
  onShare,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const getReportTitle = () => {
    if (currentReportAddress) {
      return formatFilenameToAddress(currentReportAddress);
    }
    if (!currentPdf) return "Property Report";
    return formatFilenameToAddress(currentPdf);
  };

  const handleDownload = () => {
    if (currentPdf) {
      const link = document.createElement("a");
      link.href = currentPdf;
      link.download = `${getReportTitle()}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!currentPdf) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        ref={modalRef}
        className="viewer-container w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        style={{
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Gold Header with Address and Actions */}
        <div
          className="bg-gradient-to-r from-brown to-brown/90 px-4 py-3 flex items-center justify-between"
          style={{ borderRadius: "24px 24px 0 0" }}
        >
          {/* Logo and Address Title */}
          <div className="flex items-center space-x-3">
            <div
              className="text-white"
              style={{ filter: "brightness(0) invert(1)" }}
            >
              <MiniLogo className="w-6 h-6" />
            </div>
            <h2 className="text-white font-semibold text-lg truncate">
              {getReportTitle()}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
              title="Download PDF"
            >
              <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Share Button */}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                title="Share Report"
              >
                <Share className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
              title="Close"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          className="flex-1 overflow-hidden"
          style={{ background: "rgba(250, 249, 247, 0.3)" }}
        >
          <iframe
            src={`${currentPdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={() => {
              /* Optionally log or handle load */
            }}
            onError={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              if (iframe?.contentDocument?.body) {
                // Create error content safely using DOM methods
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'padding: 40px; text-align: center; font-family: system-ui, -apple-system, sans-serif; background: #faf9f7;';
                
                const contentDiv = document.createElement('div');
                contentDiv.style.cssText = 'max-width: 400px; margin: 0 auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(164, 117, 81, 0.1); border: 1px solid #D4AF7F;';
                
                const iconDiv = document.createElement('div');
                iconDiv.style.cssText = 'width: 60px; height: 60px; background: #A47551; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;';
                
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '24');
                svg.setAttribute('height', '24');
                svg.setAttribute('fill', 'white');
                svg.setAttribute('viewBox', '0 0 24 24');
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z');
                
                svg.appendChild(path);
                iconDiv.appendChild(svg);
                
                const title = document.createElement('h3');
                title.style.cssText = 'color: #A47551; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;';
                title.textContent = 'Unable to load PDF preview';
                
                contentDiv.appendChild(iconDiv);
                contentDiv.appendChild(title);
                errorDiv.appendChild(contentDiv);
                
                const description = document.createElement('p');
                description.style.cssText = 'color: #666; margin: 0 0 20px 0; line-height: 1.5;';
                description.textContent = "The PDF couldn't be displayed in the browser. You can download it directly instead.";
                
                const downloadLink = document.createElement('a');
                downloadLink.href = currentPdf;
                downloadLink.download = '';
                downloadLink.style.cssText = 'display: inline-block; background: #A47551; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;';
                downloadLink.textContent = 'Download PDF';
                downloadLink.onmouseover = () => downloadLink.style.background = '#8B5A3C';
                downloadLink.onmouseout = () => downloadLink.style.background = '#A47551';
                
                contentDiv.appendChild(description);
                contentDiv.appendChild(downloadLink);
                
                iframe.contentDocument.body.textContent = '';
                iframe.contentDocument.body.appendChild(errorDiv);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
