import { authService } from "@/services/api/AuthService";
import { pushNotificationService } from "@/services/notifications/PushNotificationService";
import { applyUserLanguage } from "@/i18n";
import { tokenStorage } from "@/services/storage/TokenStorage";
import { IAuthService, ITokenStorage, User } from "@/types/auth";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  /** Permanently deletes the account on the backend (App Store / Google Play requirement), then signs out. */
  deleteAccount: () => Promise<void>;
  authService: IAuthService;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  storage?: ITokenStorage;
  service?: IAuthService;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  storage = tokenStorage,
  service = authService,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const storedToken = await storage.getToken();
        if (!storedToken) {
          return;
        }

        // The token only goes into the state after verification, otherwise the other providers would query
        // data with an expired token (401).
        const currentUser = await service.getCurrentUser(storedToken);
        if (isMounted) {
          setToken(storedToken);
          setUser(currentUser);
          applyUserLanguage(currentUser.language);
        }
      } catch {
        await storage.removeToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [storage, service]);

  const login = useCallback(
    async (newToken: string, newUser: User) => {
      await storage.saveToken(newToken);
      // A previous account's cached data must not be visible.
      queryClient.clear();
      setToken(newToken);
      setUser(newUser);
      applyUserLanguage(newUser.language);
    },
    [storage, queryClient]
  );

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    applyUserLanguage(updatedUser.language);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      // After signing out the device must not receive notifications for this account.
      await pushNotificationService.unregister(token).catch(() => undefined);
    }
    await storage.removeToken();
    queryClient.clear();
    setToken(null);
    setUser(null);
  }, [storage, token, queryClient]);

  const deleteAccount = useCallback(async () => {
    if (!token) return;
    // The backend also deletes the push and API tokens, so only the local state needs clearing here.
    await service.deleteAccount(token);
    await storage.removeToken();
    queryClient.clear();
    setToken(null);
    setUser(null);
  }, [service, storage, token, queryClient]);

  const contextValue = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      updateUser,
      logout,
      deleteAccount,
      authService: service,
    }),
    [token, user, isLoading, login, updateUser, logout, deleteAccount, service]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
