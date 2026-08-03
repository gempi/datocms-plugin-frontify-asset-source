export type SortValue = "RELEVANCE" | "NEWEST" | "OLDEST" | "TITLE_ASCENDING" | "TITLE_DESCENDING";

export type SortOption = {
  label: string;
  value: SortValue;
};

export const SORT_OPTIONS: SortOption[] = [
  { label: "Relevance", value: "RELEVANCE" },
  { label: "Newest first", value: "NEWEST" },
  { label: "Oldest first", value: "OLDEST" },
  { label: "Title A-Z", value: "TITLE_ASCENDING" },
  { label: "Title Z-A", value: "TITLE_DESCENDING" },
];
