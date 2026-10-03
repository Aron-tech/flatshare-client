import { Category } from "./task";

/** A still existing task created by the departed member. */
export interface MemberDepartureTask {
  id: number;
  name: string;
  is_recurring: boolean;
  category: Category | null;
}

/** A member's departure whose tasks an admin still has to decide about. */
export interface MemberDeparture {
  id: number;
  user: { id: number; name: string };
  /** The admin's user_id who removed them; `null` if they left on their own. */
  removed_by: number | null;
  created_at: string;
  tasks: MemberDepartureTask[];
}

/** `GET /households/{h}/member-departures` – csak admin. */
export interface MemberDepartureListResponse {
  member_departures: MemberDeparture[];
}

/** `POST /households/{h}/member-departures/{id}/resolve` */
export interface ResolveMemberDepartureResponse {
  deleted_count: number;
  message: string;
}
