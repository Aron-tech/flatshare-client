import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, removeToken, saveToken } from "../services/authStorage";

interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  language: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const BACKEND_URL = "http://192.168.0.39:8000/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
          const res = await fetch(`${BACKEND_URL}/user/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              Accept: "application/json",
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            await removeToken();
            setToken(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const logout = async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isLoading, login, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
