import React from "react";
import { SectionBox } from "./index";

type ErrorSectionProps = {
  errorMessage: string;
};

export function ErrorSection({
  errorMessage,
}: ErrorSectionProps): React.JSX.Element {
  return (
    <SectionBox className="border-rose-100 bg-rose-50">
      <div className="text-responsive-sm text-center text-red-600">
        <p className="mb-2 font-semibold">Error Generating Strategy</p>
        <p className="text-responsive-sm">{errorMessage}</p>
      </div>
    </SectionBox>
  );
}
