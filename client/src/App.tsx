import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "./lib/auth.tsx";
import { ProtectedRoute } from "./lib/protected-route";
import LandingPage from "@/pages/landing-page";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Client pages
import Dashboard from "@/pages/client/dashboard";
import Payments from "@/pages/client/payments";
import Cards from "@/pages/client/cards";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import Clients from "@/pages/admin/clients";
import AdminCards from "@/pages/admin/cards";
import CreateClient from "@/pages/admin/create-client";
import ManageTransactions from "@/pages/admin/manage-transactions";
import VerificationSteps from "@/pages/admin/verification-steps";
import Reports from "@/pages/admin/reports";
import Settings from "@/pages/admin/settings";

function Router() {
  // Force component to re-render when language changes
  const [, setLanguageChanged] = useState(0);
  const { i18n } = useTranslation();

  useEffect(() => {
    // Handle language changes to force re-render of all components
    const handleLanguageChanged = () => {
      setLanguageChanged(prev => prev + 1);
      console.log("App detected language change event, refreshing components");
    };

    // Listen for custom language change event
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    // Also listen for i18next's own language change event
    i18n.on('languageChanged', () => {
      console.log("App detected i18next language change, refreshing components");
      setLanguageChanged(prev => prev + 1);
    });

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
      // i18n cleanup happens automatically
    };
  }, [i18n]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Client routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} clientOnly />
      <ProtectedRoute path="/payments" component={Payments} clientOnly />
      <ProtectedRoute path="/cards" component={Cards} clientOnly />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/clients" component={Clients} adminOnly />
      <ProtectedRoute path="/admin/cards" component={AdminCards} adminOnly />
      <ProtectedRoute path="/admin/create-client" component={CreateClient} adminOnly />
      <ProtectedRoute path="/admin/transactions" component={ManageTransactions} adminOnly />
      <ProtectedRoute path="/admin/verifications" component={VerificationSteps} adminOnly />
      <ProtectedRoute path="/admin/reports" component={Reports} adminOnly />
      <ProtectedRoute path="/admin/settings" component={Settings} adminOnly />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
