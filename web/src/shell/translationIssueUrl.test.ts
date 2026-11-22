import { describe, expect, it } from "vitest";
import { ISSUES_URL } from "../config";
import { translationIssueUrl } from "./translationIssueUrl";

describe("translationIssueUrl", () => {
  it("round-trips title and body through the query string", () => {
    const issue = { title: "[eu] Itzulpen akatsa", body: "a&b\nc" };
    const url = translationIssueUrl(issue);
    expect(url.startsWith(`${ISSUES_URL}?`)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("title")).toBe(issue.title);
    expect(params.get("body")).toBe(issue.body);
  });
});
