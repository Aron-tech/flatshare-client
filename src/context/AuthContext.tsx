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

        // A tokent csak ellenőrzés után tesszük a state-be, különben a
        // többi provider lejárt tokennel kérdezne le adatokat (401).
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
      // Egy korábbi fiók gyorsítótárazott adatai nem látszhatnak.
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
      // Kijelentkezés után ne kapjon értesítést az eszköz erre a fiókra.
      await pushNotificationService.unregister(token).catch(() => undefined);
    }
    await storage.removeToken();
    queryClient.clear();
    setToken(null);
    setUser(null);
  }, [storage, token, queryClient]);

  const contextValue = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      updateUser,
      logout,
      authService: service,
    }),
    [token, user, isLoading, login, updateUser, logout, service]
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
