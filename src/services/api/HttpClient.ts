import { Config } from "@/config/env";
import i18n from "@/i18n";
import { showToast } from "@/lib/toast";

/** An error thrown from the backend's error response; the user already saw it in a toast. */
export class ApiError extends Error {
  public constructor(
    message: string,
    /** Per-field validation errors (422), the first message per field. */
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  /** A validation error (422) is shown by the screen next to the fields, so no toast appears. */
  inlineValidation?: boolean;
}

/** The first message per field from Laravel's `errors` object. */
function firstFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== "object") return {};
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") result[field] = messages[0];
  }
  return result;
}

export class HttpClient {
  public constructor(private readonly baseUrl: string) {}

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null,
    { inlineValidation = false }: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Before sign-in the backend knows the response language from this.
      "Accept-Language": i18n.language,
      "X-App-Key": Config.APP_KEY,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch {
      showToast(i18n.t("errors.operationFailed"));
      throw new ApiError(i18n.t("errors.operationFailed"));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // The raw server error (data.error, e.g. SQL) must never reach the user.
      const errorMessage =
        typeof data?.message === "string" && data.message
          ? data.message
          : i18n.t("errors.operationFailed");
      const fieldErrors = response.status === 422 ? firstFieldErrors(data?.errors) : {};
      if (!(inlineValidation && Object.keys(fieldErrors).length > 0)) {
        showToast(errorMessage);
      }
      throw new ApiError(errorMessage, fieldErrors);
    }

    if (typeof data?.message === "string" && data.message) {
      showToast(data.message);
    }

    return data as T;
  }
}
