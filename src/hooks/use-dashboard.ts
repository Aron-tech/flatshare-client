import i18n from "@/i18n";
import {
  useHouseholdMutation,
  useHouseholdQuery,
  useHouseholdSession,
} from "@/hooks/use-household-query";
import { householdKey, HouseholdQueries } from "@/lib/queries";
import { showToast } from "@/lib/toast";
import { dashboardService } from "@/services/api/DashboardService";
import { taskCompletionService } from "@/services/api/TaskCompletionService";
import { CreateTaskOfferDto, MyHouseholdPointsResponse, TaskInstanceListResponse } from "@/types/dashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const EMPTY_INSTANCES: TaskInstanceListResponse = { available: [], claimed: [], offered: [] };

interface LocalCompletions {
  /** A betöltött lista, amelyhez a teljesítések tartoznak; újratöltéskor érvénytelenek. */
  source: TaskInstanceListResponse | null;
  /** Teljesített feladat → jóváírt pont (a kártya "kész" állapotához). */
  points: Record<number, number>;
}

/** Csere / türelmi nap kérés: a kártya azonosítója (a busy jelzéshez) és a művelet. */
interface RequestAction {
  taskInstanceId: number;
  send: (householdId: number, token: string) => Promise<unknown>;
  successKey: string;
}

export function useDashboard() {
  const queryClient = useQueryClient();
  const { householdId } = useHouseholdSession();
  const me = useHouseholdQuery(HouseholdQueries.me);
  const instances = useHouseholdQuery(HouseholdQueries.taskInstances);

  /**
   * A frissen teljesített feladatok "kész" állapotban maradnak a listában a
   * következő újratöltésig; utána a backend már nem adja vissza őket.
   */
  const [local, setLocal] = useState<LocalCompletions>({ source: null, points: {} });
  const completedIds = local.source === instances.data ? local.points : {};

  const claim = useHouseholdMutation((h, token, taskInstanceId: number) =>
    dashboardService.claimTaskInstance(h, taskInstanceId, token)
  );

  /** Azonnali elvégzés: vállalás, majd rögtön lezárás (a backend a lezáráshoz vállalást kér). */
  const claimAndComplete = useHouseholdMutation(async (h, token, taskInstanceId: number) => {
    await dashboardService.claimTaskInstance(h, taskInstanceId, token);
    await taskCompletionService.complete(h, taskInstanceId, token);
  });

  const request = useHouseholdMutation(async (h, token, { send, successKey }: RequestAction) => {
    await send(h, token);
    showToast(i18n.t(successKey));
  });

  // A lista szándékosan nem töltődik újra, hogy a teljesített kártya "kész" maradjon.
  const completion = useHouseholdMutation(
    (h, token, taskInstanceId: number) => taskCompletionService.complete(h, taskInstanceId, token),
    { invalidate: false }
  );

  /** A jóváírt pontot adja vissza, hiba esetén `null`-t. */
  const complete = async (taskInstanceId: number): Promise<number | null> => {
    const result = await completion.run(taskInstanceId);
    if (!result || householdId === null) return null;

    const earned = result.points + (result.offer_points ?? 0);
    setLocal((prev) => ({
      source: instances.data,
      points: { ...(prev.source === instances.data ? prev.points : {}), [taskInstanceId]: earned },
    }));
    queryClient.setQueryData<MyHouseholdPointsResponse>(HouseholdQueries.me.key(householdId), (current) =>
      current && { ...current, weekly_points: result.weekly_points, spendable_points: result.spendable_points }
    );
    // A pont a statisztikát és a jutalmakat is érinti; a feladatlista és a friss pontállás marad.
    const keep = [HouseholdQueries.taskInstances.key(householdId), HouseholdQueries.me.key(householdId)];
    void queryClient.invalidateQueries({
      queryKey: householdKey(householdId),
      predicate: (query) => !keep.some((key) => key[2] === query.queryKey[2]),
    });
    return earned;
  };

  const runRequest = async (action: RequestAction) => (await request.run(action)) !== null;
  const points = me.data;

  return {
    points: points
      ? {
          weeklyPoints: points.weekly_points,
          minPoints: points.min_points,
          spendablePoints: points.spendable_points,
          role: points.household_user.role,
          graceDaysLeft: points.grace_days_left ?? 0,
        }
      : null,
    taskInstances: instances.data ?? EMPTY_INSTANCES,
    completedIds,
    isLoading: me.isLoading || instances.isLoading,
    error: me.error ?? instances.error,
    refetch: () => Promise.all([me.refetch(), instances.refetch()]),
    claimingId: claim.pending ?? claimAndComplete.pending,
    completingId: completion.pending,
    claim: claim.run,
    claimAndComplete: claimAndComplete.run,
    complete,
    requestBusyId: request.pending?.taskInstanceId ?? null,
    requestGraceDay: (taskInstanceId: number) =>
      runRequest({
        taskInstanceId,
        send: (h, token) => dashboardService.requestGraceDay(h, taskInstanceId, token),
        successKey: "request.graceGranted",
      }),
    createOffer: (taskInstanceId: number, dto: CreateTaskOfferDto) =>
      runRequest({
        taskInstanceId,
        send: (h, token) => dashboardService.createOffer(h, taskInstanceId, dto, token),
        successKey: "request.offerCreated",
      }),
    cancelOffer: (taskInstanceId: number, offerId: number) =>
      runRequest({
        taskInstanceId,
        send: (h, token) => dashboardService.cancelOffer(h, offerId, token),
        successKey: "request.offerCancelled",
      }),
    acceptOffer: (taskInstanceId: number, offerId: number) =>
      runRequest({
        taskInstanceId,
        send: (h, token) => dashboardService.acceptOffer(h, offerId, token),
        successKey: "request.offerAccepted",
      }),
  };
}
