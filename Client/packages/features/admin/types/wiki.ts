export type WikiPageRecord = {
  title: string;
  content: string;
};

export type WikiTreeFolder = {
  type: "folder";
  name: string;
  label: string;
  path: string;
  children: WikiTreeNode[];
};

export type WikiTreePage = {
  type: "page";
  name: string;
  label: string;
  path: string;
  title: string;
};

export type WikiTreeNode = WikiTreeFolder | WikiTreePage;

export type WikiTocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};
