/**
 * Barrel so "./DropdownMenuBody" resolves for TypeScript and madge. Bundlers pick the .web file.
 * (No native variant: dropdown uses raw <input> and HTML refs; mobile uses a different picker.)
 */
export * from "./DropdownMenuBody.web";
