import { Config } from "@/config/env";
import {
  CalendarEvent,
  CalendarEventListResponse,
  CalendarScope,
  CalendarSubscription,
  ICalendarService,
} from "@/types/calendar";
import { HttpClient } from "./HttpClient";

export class CalendarService implements ICalendarService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async getEvents(
    householdId: number,
    scope: CalendarScope,
    from: Date,
    to: Date,
    token: string
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({ scope, from: from.toISOString(), to: to.toISOString() });
    const response = await this.http.request<CalendarEventListResponse>(
      `/households/${householdId}/calendar?${params}`,
      { method: "GET" },
      token
    );
    return response.events;
  }

  public getSubscription(householdId: number, token: string): Promise<CalendarSubscription> {
    return this.http.request<CalendarSubscription>(
      `/households/${householdId}/calendar/subscription`,
      { method: "POST" },
      token
    );
  }

  public async resetSubscription(householdId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/calendar/subscription`,
      { method: "DELETE" },
      token
    );
  }
}

export const calendarService = new CalendarService();
