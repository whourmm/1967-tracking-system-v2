// Shared shapes for the Cases & Resources admin pages and their form dialogs.
export type CaseStatus = "Draft" | "Published";

export interface CaseItem {
  id: string;
  title: string;
  author: string;
  status: CaseStatus;
  summary: string;
  document: string; // attached file name, "" when none
  tags: string[];
  date: string; // display date, e.g. "May 21, 2026"
}

export type ResourceKind = "Guide" | "Template" | "Video";

export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceKind;
  url: string;
  summary: string;
}
