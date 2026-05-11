import type { Dispatch, ReactNode, SetStateAction } from "react";

import { SavedFeature } from "packages/features/saved";

type LibraryPageProps = {
  setMobileHeaderActions?: Dispatch<SetStateAction<ReactNode | null>>;
};

/** Library route (`/library`): documents, forms (agents), and agreements. */
export default function LibraryPage({ setMobileHeaderActions }: LibraryPageProps) {
  return <SavedFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
