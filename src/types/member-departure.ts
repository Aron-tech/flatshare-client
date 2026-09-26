import { Category } from "./task";

/** A távozott tag egy általa létrehozott, még meglévő feladata. */
export interface MemberDepartureTask {
  id: number;
  name: string;
  is_recurring: boolean;
  category: Category | null;
}

/** Egy tag távozása, amelynek feladatairól egy adminnak még döntenie kell. */
export interface MemberDeparture {
  id: number;
  user: { id: number; name: string };
  /** Az admin user_id-ja, aki eltávolította; `null`, ha maga lépett ki. */
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
