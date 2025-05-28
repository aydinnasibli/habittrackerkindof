"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("necmettinyo-user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          if (publicRoutes.includes(pathname)) {
            router.push('/dashboard');
          }
        } else if (!publicRoutes.includes(pathname)) {
          router.push('/login');
        }
      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock login - replace with real auth
      const mockUser = {
        id: "user-1",
        email,
        name: "Demo User",
      };
      localStorage.setItem("necmettinyo-user", JSON.stringify(mockUser));
      setUser(mockUser);
      router.push('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem("necmettinyo-user");
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Mock registration - replace with real auth
      const mockUser = {
        id: "user-1",
        email,
        name,
      };
      localStorage.setItem("necmettinyo-user", JSON.stringify(mockUser));
      setUser(mockUser);
      router.push('/dashboard');
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};