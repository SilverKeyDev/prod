import React from "react";
import { SectionBox } from "./index";
import { Loading } from "../../components/ui";

export function LoadingSection(): React.JSX.Element {
  return (
    <SectionBox>
      <div className="flex justify-center">
        <Loading message="We appreciate feedback! jayce@usesilverkey.com" />
      </div>
    </SectionBox>
  );
}

