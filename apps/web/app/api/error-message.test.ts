import { describe, expect, it } from "vitest";

import { HttpClientError } from "../lib/http";
import { toUserErrorMessage } from "./error-message";

describe("toUserErrorMessage", () => {
  it("maps known HttpClientError codes to friendly copy", () => {
    expect(
      toUserErrorMessage(new HttpClientError("NO_AVAILABILITY", "raw", 409)),
    ).toBe("No slot is available for the selected window.");
  });

  it("falls back to the error message for unknown codes", () => {
    expect(toUserErrorMessage(new HttpClientError("CUSTOM", "Something special", 500))).toBe(
      "Something special",
    );
  });

  it("returns a generic message for non-HTTP errors", () => {
    expect(toUserErrorMessage(new Error("boom"))).toBe("Unexpected error occurred.");
  });
});
