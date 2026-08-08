export type DiscussionTypeCode = "REQ" | "QRY" | "DSN" | "DEC" | "REV" | "RFI" | "ACT" | "CLT" | "AGR";

export const discussionTypeLabels: Record<DiscussionTypeCode, string> = {
  REQ: "Requirement",
  QRY: "Query",
  DSN: "Design Discussion",
  DEC: "Decision",
  REV: "Review",
  RFI: "Request for Information",
  ACT: "Action",
  CLT: "Client Feedback",
  AGR: "Agreement",
};

export const discussionTypeBadgeClass: Record<DiscussionTypeCode, string> = {
  REQ: "bg-discussion-type-req/15 text-discussion-type-req",
  QRY: "bg-discussion-type-qry/15 text-discussion-type-qry",
  DSN: "bg-discussion-type-dsn/15 text-discussion-type-dsn",
  DEC: "bg-discussion-type-dec/15 text-discussion-type-dec",
  REV: "bg-discussion-type-rev/15 text-discussion-type-rev",
  RFI: "bg-discussion-type-rfi/15 text-discussion-type-rfi",
  ACT: "bg-discussion-type-act/15 text-discussion-type-act",
  CLT: "bg-discussion-type-clt/15 text-discussion-type-clt",
  AGR: "bg-discussion-type-agr/15 text-discussion-type-agr",
};

export const discussionTypeDotClass: Record<DiscussionTypeCode, string> = {
  REQ: "bg-discussion-type-req",
  QRY: "bg-discussion-type-qry",
  DSN: "bg-discussion-type-dsn",
  DEC: "bg-discussion-type-dec",
  REV: "bg-discussion-type-rev",
  RFI: "bg-discussion-type-rfi",
  ACT: "bg-discussion-type-act",
  CLT: "bg-discussion-type-clt",
  AGR: "bg-discussion-type-agr",
};
