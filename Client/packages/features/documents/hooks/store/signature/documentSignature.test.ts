import { describe, expect, it } from "vitest";

import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";

import {
  canSendForSignature,
  getDefaultAgreementTitle,
  sendForSignatureDisabledReason,
} from "./documentSignature";

function makeDocument(overrides: Partial<DocumentData> = {}): DocumentData {
  return {
    id: "doc-1",
    filename: "Purchase_Contract.pdf",
    file_path: "/tmp/Purchase_Contract.pdf",
    status: "draft",
    created_at: null,
    updated_at: null,
    user_id: "buyer-1",
    document_type: "contract",
    address: "123 Main St",
    library_kind: "upload",
    ...overrides,
  };
}

describe("documentSignature helpers", () => {
  it("derives a default title from upload filenames", () => {
    const document = makeDocument({
      filename: "Offer_Draft_v2.pdf",
      library_kind: "upload",
    });
    expect(getDefaultAgreementTitle(document)).toBe("Offer_Draft_v2");
  });

  it("uses agreement filename when row is an agreement", () => {
    const document = makeDocument({
      filename: "Buyer Representation",
      library_kind: "agreement",
    });
    expect(getDefaultAgreementTitle(document)).toBe("Buyer Representation");
  });

  it("allows sending non-agreement rows", () => {
    const document = makeDocument({
      library_kind: "upload",
      status: "completed",
    });
    expect(canSendForSignature(document)).toBe(true);
    expect(sendForSignatureDisabledReason(document)).toBeNull();
  });

  it("blocks sending agreements when not in draft", () => {
    const document = makeDocument({
      library_kind: "agreement",
      status: "sent",
    });
    expect(canSendForSignature(document)).toBe(false);
    expect(sendForSignatureDisabledReason(document)).toBe("Agreement in sent state cannot be sent");
  });
});
