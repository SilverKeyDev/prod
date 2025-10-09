export type ComparisonRow = {
  Address?: string;
  [key: string]: string | number | boolean | undefined;
};

export { ComparisonSpreadsheet } from "./ComparisonSpreadsheet";
export { ManageRowsModal } from "./ManageRowsModal";
