import i18n from "@/i18n";
import { showToast } from "@/lib/toast";

/** A backend hibaválaszából dobott hiba; a felhasználó már toastban látta. */
export class ApiError extends Error {
  public constructor(
    message: string,
    /** Mezőnkénti validációs hibák (422), mezőnként az első üzenettel. */
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  /** A validációs hibát (422) a képernyő mutatja a mezők mellett, ezért nem jelenik meg toast. */
  inlineValidation?: boolean;
}

/** A Laravel `errors` objektumából mezőnként az első üzenet. */
function firstFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== "object") return {};
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") result[field] = messages[0];
  }
  return result;
}

/**
 * A folyamatban lévő GET kérések (kulcs: token + URL). Több képernyő ugyanazt az
 * adatot egyszerre kérve (pl. `/households/{id}/me` újratöltéskor) egy kérésen osztozik.
 */
const inFlightGets = new Map<string, Promise<unknown>>();

export class HttpClient {
  public constructor(private readonly baseUrl: string) {}

  public request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null,
    requestOptions: RequestOptions = {},
  ): Promise<T> {
    const isGet = (options.method ?? "GET").toUpperCase() === "GET" && !options.body;
    if (!isGet) return this.send<T>(endpoint, options, token, requestOptions);

    const key = `${token ?? ""} ${this.baseUrl}${endpoint}`;
    const pending = inFlightGets.get(key);
    if (pending) return pending as Promise<T>;

    const promise = this.send<T>(endpoint, options, token, requestOptions).finally(() => {
      inFlightGets.delete(key);
    });
    inFlightGets.set(key, promise);
    return promise;
  }

  private async send<T>(
    endpoint: string,
    options: RequestInit,
    token: string | null | undefined,
    { inlineValidation = false }: RequestOptions,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Bejelentkezés előtt ebből tudja a backend a válaszok nyelvét.
      "Accept-Language": i18n.language,
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
      // A nyers szerverhiba (data.error, pl. SQL) sosem kerülhet a felhasználó elé.
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
