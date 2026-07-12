declare module "virtual:silverkey-wiki" {
  import type { WikiPageRecord, WikiTreeNode } from "packages/features/admin/types/wiki";

  export const tree: WikiTreeNode[];
  export const pages: Record<string, WikiPageRecord>;
}
