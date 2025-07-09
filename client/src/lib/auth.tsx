import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { LoginCredentials, RegisterCredentials } from "@shared/types";
import { getQueryFn, apiRequest, queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

// Type défini explicitement
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isClient: boolean;
  loginMutation: UseMutationResult<User, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterCredentials>;
};

// Valeur par défaut du contexte
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  isAdmin: false,
  isClient: false,
  loginMutation: {} as UseMutationResult<User, Error, LoginCredentials>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<User, Error, RegisterCredentials>,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";

  const loginMutation = useMutation<User, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Login attempt with credentials:", credentials);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        const userData = await res.json();
        console.log("Login success, user data:", userData);
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.firstName} ${user.lastName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<User, Error, RegisterCredentials>({
    mutationFn: async (credentials: RegisterCredentials) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Inscription réussie",
        description: `Bienvenue, ${user.firstName} ${user.lastName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    error,
    isAdmin,
    isClient,
    loginMutation,
    logoutMutation,
    registerMutation,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
