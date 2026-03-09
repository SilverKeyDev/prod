import React from "react";

import { Loading } from "@/components/ui";

import SectionBox from "./SectionBox";

export function LoadingSection(): React.JSX.Element {
  return (
    <SectionBox>
      <div className="flex justify-center">
        <Loading message="We appreciate feedback! jayce@usesilverkey.com" />
      </div>
    </SectionBox>
  );
}
