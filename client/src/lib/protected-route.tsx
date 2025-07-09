import { useAuth } from "./auth.tsx";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
  clientOnly?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  clientOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isClient } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <Route path={path}>
        <Redirect to={isClient ? "/dashboard" : "/"} />
      </Route>
    );
  }

  if (clientOnly && !isClient) {
    return (
      <Route path={path}>
        <Redirect to={isAdmin ? "/admin" : "/"} />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
