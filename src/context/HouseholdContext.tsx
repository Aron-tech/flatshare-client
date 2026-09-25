import { householdService } from "@/services/api/HouseholdService";
import { householdStorage } from "@/services/storage/HouseholdStorage";
import {
  Household,
  IHouseholdService,
  IHouseholdStorage,
} from "@/types/household";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

interface HouseholdContextType {
  households: Household[];
  activeHousehold: Household | null;
  isLoading: boolean;
  selectHousehold: (householdId: number) => Promise<void>;
  refreshHouseholds: () => Promise<void>;
  renameHousehold: (householdId: number, name: string) => Promise<void>;
  leaveHousehold: (householdId: number) => Promise<void>;
  deleteHousehold: (householdId: number) => Promise<void>;
  getHouseholdQrCode: (householdId: number) => Promise<string>;
}

const HouseholdContext = createContext<HouseholdContextType | null>(null);

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
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncActiveHousehold = useCallback(
    async (items: Household[]) => {
      if (items.length === 0) {
        await storage.clearActiveHouseholdId();
        setActiveHousehold(null);
        return;
      }

      const storedId = await storage.getActiveHouseholdId();
      const matched = items.find((h) => h.id === storedId);

      if (matched) {
        setActiveHousehold(matched);
      } else {
        // Ha nincs korábbi választás vagy törölték, az első lesz az aktív
        const fallback = items[0];
        await storage.setActiveHouseholdId(fallback.id);
        setActiveHousehold(fallback);
      }
    },
    [storage]
  );

  const refreshHouseholds = useCallback(async () => {
    if (!token) {
      setHouseholds([]);
      setActiveHousehold(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const list = await service.getAll(token);
      setHouseholds(list);
      await syncActiveHousehold(list);
    } catch (error) {
      console.error("[HouseholdProvider.refreshHouseholds] Failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, service, syncActiveHousehold]);

  useEffect(() => {
    refreshHouseholds();
  }, [refreshHouseholds]);

  const selectHousehold = useCallback(
    async (householdId: number) => {
      const selected = households.find((h) => h.id === householdId);
      if (!selected) return;

      await storage.setActiveHouseholdId(selected.id);
      setActiveHousehold(selected);
    },
    [households, storage]
  );

  const renameHousehold = useCallback(
    async (householdId: number, name: string) => {
      if (!token) return;
      await service.rename(householdId, { name }, token);
      await refreshHouseholds();
    },
    [token, service, refreshHouseholds]
  );

  const leaveHousehold = useCallback(
    async (householdId: number) => {
      if (!token) return;
      await service.leave(householdId, token);
      await refreshHouseholds();
    },
    [token, service, refreshHouseholds]
  );

  const deleteHousehold = useCallback(
    async (householdId: number) => {
      if (!token) return;
      await service.destroy(householdId, token);
      await refreshHouseholds();
    },
    [token, service, refreshHouseholds]
  );

  const getHouseholdQrCode = useCallback(
    async (householdId: number) => {
      if (!token) throw new Error("Nincs bejelentkezve.");
      return service.getQrCode(householdId, token);
    },
    [token, service]
  );

  const contextValue = useMemo(
    () => ({
      households,
      activeHousehold,
      isLoading,
      selectHousehold,
      refreshHouseholds,
      renameHousehold,
      leaveHousehold,
      deleteHousehold,
      getHouseholdQrCode,
    }),
    [
      households,
      activeHousehold,
      isLoading,
      selectHousehold,
      refreshHouseholds,
      renameHousehold,
      leaveHousehold,
      deleteHousehold,
      getHouseholdQrCode,
    ]
  );

  return (
    <HouseholdContext.Provider value={contextValue}>
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = (): HouseholdContextType => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
};
