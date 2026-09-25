import i18n from "@/i18n";
import { showToast } from "@/lib/toast";

/** A backend hibaválaszából dobott hiba; a felhasználó már toastban látta. */
export class ApiError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class HttpClient {
  public constructor(private readonly baseUrl: string) {}

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || `HTTP error ${response.status}`;
      showToast(
        typeof data?.message === "string" && data.message
          ? data.message
          : i18n.t("errors.operationFailed"),
      );
      throw new ApiError(errorMessage);
    }

    if (typeof data?.message === "string" && data.message) {
      showToast(data.message);
    }

    return data as T;
  }
}
