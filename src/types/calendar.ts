/** Whose calendar: own claims/assignments, or the whole household's. */
export type CalendarScope = "mine" | "household";

export type CalendarView = "day" | "week" | "month";

/** `completed` done, `open` open, `overdue` overdue, `planned` a projected (not yet existing) instance of a recurring task. */
export type CalendarEventStatus = "completed" | "open" | "overdue" | "planned";

export interface CalendarEventAssignee {
  user_id: number;
  name: string;
  completed: boolean;
}

/** `GET /households/{h}/calendar` egy eleme. */
export interface CalendarEvent {
  id: string;
  task_id: number;
  task_instance_id: number | null;
  name: string;
  description: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
  duration_minutes: number;
  is_recurring: boolean;
  status: CalendarEventStatus;
  /** Where it goes in the calendar: completion, otherwise the deadline, without a deadline the claim time. */
  at: string;
  due_at: string | null;
  completed_at: string | null;
  is_mine: boolean;
  assignees: CalendarEventAssignee[];
}

export interface CalendarEventListResponse {
  events: CalendarEvent[];
}

export interface CalendarFeedUrls {
  /** https URL (Google Calendar "add by URL"). */
  url: string;
  /** webcal:// URL (Apple Calendar subscription). */
  webcal_url: string;
}

/** `POST /households/{h}/calendar/subscription` */
export type CalendarSubscription = Record<CalendarScope, CalendarFeedUrls>;

export interface ICalendarService {
  getEvents(householdId: number, scope: CalendarScope, from: Date, to: Date, token: string): Promise<CalendarEvent[]>;
  getSubscription(householdId: number, token: string): Promise<CalendarSubscription>;
  /** Revokes the subscription links (the old ones stop updating). */
  resetSubscription(householdId: number, token: string): Promise<void>;
}
