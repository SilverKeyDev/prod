import { SavedFeature } from "packages/features/saved";

type SavedHomesProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export default function SavedHomes({ setMobileHeaderActions }: SavedHomesProps) {
  return <SavedFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
