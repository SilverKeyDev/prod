import React from "react";

import { Box } from "packages/ui/components/primitives";

import { Loading } from "@/components/ui";

import SectionBox from "./SectionBox";
export function LoadingSection(): React.JSX.Element {
  return (
    <SectionBox>
      <Box className="flex justify-center">
        <Loading message="We appreciate feedback! jayce@usesilverkey.com" />
      </Box>
    </SectionBox>
  );
}
