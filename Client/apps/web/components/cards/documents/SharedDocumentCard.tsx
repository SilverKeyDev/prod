import DocumentCard from "./DocumentCard";
import type { DocumentCardProps } from "./types";

type SharedDocumentCardProps = Omit<DocumentCardProps, "showDelete">;

/**
 * Shared document card component - same as DocumentCard but with showDelete always false.
 * Used for displaying documents in shared contexts where deletion should not be allowed.
 */
export default function SharedDocumentCard(props: SharedDocumentCardProps) {
  return <DocumentCard {...props} showDelete={false} />;
}
