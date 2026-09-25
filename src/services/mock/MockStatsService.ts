import { currentCycle } from "@/lib/cycle";
import { HouseholdStats, IStatsService } from "@/types/stats";

const HOUR = 60 * 60 * 1000;

/**
 * MOCK – a backenden még nincs statisztika / büntetés / aktivitás végpont.
 * Ha elkészül, egy valódi `IStatsService` implementációra kell cserélni,
 * a képernyők csak az interfészt használják.
 */
export class MockStatsService implements IStatsService {
  public async getStats(): Promise<HouseholdStats> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const now = Date.now();
    const cycle = currentCycle(new Date(now));
    const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString();

    return {
      cycle: {
        number: 14,
        starts_at: cycle.startsAt.toISOString(),
        ends_at: cycle.endsAt.toISOString(),
        total_points: 235,
        target_points: 320,
      },
      balance_percent: 88,
      members: [
        { user_id: 1, first_name: "Eszter", last_name: "Rácz", role: "admin", points: 78, target: 80, is_me: false },
        { user_id: 2, first_name: "Márton", last_name: "Tóth", role: "user", points: 65, target: 80, is_me: false },
        { user_id: 3, first_name: "Sára", last_name: "Molnár", role: "admin", points: 52, target: 80, is_me: true },
        { user_id: 4, first_name: "Levente", last_name: "Kiss", role: "user", points: 40, target: 80, is_me: false },
      ],
      penalties: [
        {
          id: 1,
          user_id: 4,
          user_name: "Levente K.",
          task_name: "Vasárnapi közös vacsora főzése 4 főre",
          status: "pending",
          due_at: cycle.endsAt.toISOString(),
        },
        {
          id: 2,
          user_id: 3,
          user_name: "Sára M.",
          task_name: "Szelektív és komposzt tároló kisúrolása",
          status: "resolved",
          due_at: null,
        },
      ],
      activity: [
        { id: 1, user_id: 2, user_name: "Márton T.", is_me: false, task_name: "Tűzhely és főzőlap alapos tisztítása", category_icon: "kitchen", points: 20, completed_at: iso(2 * HOUR) },
        { id: 2, user_id: 1, user_name: "Eszter R.", is_me: false, task_name: "Fürdőszobai készletek feltöltése", category_icon: "bathroom", points: 10, completed_at: iso(5 * HOUR) },
        { id: 3, user_id: 3, user_name: "Sára M.", is_me: true, task_name: "Konyhapult és kávégép letörlése", category_icon: "kitchen", points: 15, completed_at: iso(9 * HOUR) },
      ],
    };
  }
}

export const statsService: IStatsService = new MockStatsService();
