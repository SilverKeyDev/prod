import { FileText } from "lucide-react";

interface DocumentCardProps {
  /**
   * Display name or filename of the document
   */
  doc: string;
}

/**
 * Simple presentation component to display a user document.
 * Mirrors the styling of `HomeCard` for visual consistency.
 */
export default function DocumentCard({ doc }: DocumentCardProps) {
  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition p-4 flex items-center gap-3">
      {/* Icon */}
      <div className="flex-shrink-0 text-brown">
        <FileText size={32} />
      </div>
      {/* Name */}
      <div className="flex-1 overflow-hidden">
        <p className="font-medium truncate" title={doc}>
          {doc}
        </p>
      </div>
    </div>
  );
}
