import { HttpClientError } from "../lib/http";

const knownErrorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Please check your input and try again.",
  NO_AVAILABILITY: "No slot is available for the selected window.",
  CONFLICT: "The slot was contested. Please check availability and retry.",
  REQUEST_TIMEOUT: "Request timed out. Please retry.",
  NETWORK_ERROR: "Network error. Verify API connectivity and retry.",
};

export function toUserErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return (
      knownErrorMessages[error.code] ??
      error.message ??
      "Unexpected error occurred."
    );
  }
  return "Unexpected error occurred.";
}
