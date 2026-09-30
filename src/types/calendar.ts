/** Kinek a naptára: a saját vállalások/kiosztások, vagy a teljes háztartásé. */
export type CalendarScope = "mine" | "household";

export type CalendarView = "day" | "week" | "month";

/** `completed` kész, `open` nyitott, `overdue` lejárt, `planned` az ismétlődő feladat előre vetített (még nem létező) példánya. */
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
  /** Ahová a naptárban kerül: teljesítés, különben határidő, határidő nélkül a vállalás ideje. */
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
  /** https cím (Google Naptár "URL alapján" hozzáadás). */
  url: string;
  /** webcal:// cím (Apple Naptár feliratkozás). */
  webcal_url: string;
}

/** `POST /households/{h}/calendar/subscription` */
export type CalendarSubscription = Record<CalendarScope, CalendarFeedUrls>;

export interface ICalendarService {
  getEvents(householdId: number, scope: CalendarScope, from: Date, to: Date, token: string): Promise<CalendarEvent[]>;
  getSubscription(householdId: number, token: string): Promise<CalendarSubscription>;
  /** Visszavonja a feliratkozási linkeket (a régiek nem frissülnek tovább). */
  resetSubscription(householdId: number, token: string): Promise<void>;
}
