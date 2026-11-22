import { ISSUES_URL } from "../config";

export function translationIssueUrl(issue: {
  title: string;
  body: string;
}): string {
  return `${ISSUES_URL}?${new URLSearchParams(issue)}`;
}
