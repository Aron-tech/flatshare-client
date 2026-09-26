import { HOUSEHOLDS_KEY } from "@/lib/queries";
import { householdService } from "@/services/api/HouseholdService";
import { householdStorage } from "@/services/storage/HouseholdStorage";
import {
  Household,
  IHouseholdService,
  IHouseholdStorage,
  UpdateHouseholdSettingsDto,
} from "@/types/household";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

interface HouseholdContextType {
  households: Household[];
  activeHousehold: Household | null;
  isLoading: boolean;
  selectHousehold: (householdId: number) => Promise<void>;
  refreshHouseholds: () => Promise<void>;
  renameHousehold: (householdId: number, name: string) => Promise<void>;
  updateHouseholdSettings: (householdId: number, dto: UpdateHouseholdSettingsDto) => Promise<void>;
  leaveHousehold: (householdId: number) => Promise<void>;
  deleteHousehold: (householdId: number) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | null>(null);

const NO_HOUSEHOLDS: Household[] = [];

interface HouseholdProviderProps {
  children: React.ReactNode;
  storage?: IHouseholdStorage;
  service?: IHouseholdService;
}

export const HouseholdProvider: React.FC<HouseholdProviderProps> = ({
  children,
  storage = householdStorage,
  service = householdService,
}) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const householdsQuery = useQuery({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: token ? () => service.getAll(token) : skipToken,
  });
  const households = householdsQuery.data ?? NO_HOUSEHOLDS;

  /** A tárolt választás; `undefined`, amíg a tárolóból be nem olvastuk. */
  const [selectedId, setSelectedId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    storage.getActiveHouseholdId().then((id) => {
      if (!cancelled) setSelectedId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  // Ha nincs korábbi választás, vagy azt a háztartást azóta elhagyta / törölték, az első az aktív.
  const activeHousehold = households.find((h) => h.id === selectedId) ?? households[0] ?? null;

  /**
   * Csak az első betöltésnél igaz: a gyökér navigáció ilyenkor spinnert mutat, ami egy
   * későbbi frissítésnél az összes képernyőt újramountolná.
   */
  const isLoading = selectedId === undefined || (token !== null && householdsQuery.isPending);

  const contextValue = useMemo<HouseholdContextType>(() => {
    const refreshHouseholds = () => queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });

    const mutateAndRefresh =
      <A extends unknown[]>(action: (token: string, ...args: A) => Promise<unknown>) =>
      async (...args: A) => {
        if (!token) return;
        await action(token, ...args);
        await refreshHouseholds();
      };

    return {
      households,
      activeHousehold,
      isLoading,
      selectHousehold: async (householdId) => {
        setSelectedId(householdId);
        await storage.setActiveHouseholdId(householdId);
      },
      refreshHouseholds,
      renameHousehold: mutateAndRefresh((tk, householdId: number, name: string) =>
        service.rename(householdId, { name }, tk)
      ),
      updateHouseholdSettings: mutateAndRefresh((tk, householdId: number, dto: UpdateHouseholdSettingsDto) =>
        service.updateSettings(householdId, dto, tk)
      ),
      leaveHousehold: mutateAndRefresh((tk, householdId: number) => service.leave(householdId, tk)),
      deleteHousehold: mutateAndRefresh((tk, householdId: number) => service.destroy(householdId, tk)),
    };
  }, [households, activeHousehold, isLoading, token, service, storage, queryClient]);

  return <HouseholdContext.Provider value={contextValue}>{children}</HouseholdContext.Provider>;
};

export const useHousehold = (): HouseholdContextType => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
};
