import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import LanguageSwitcher from "@/components/ui/language-switcher";

export default function AuthPage() {
  const { user, isLoading, isAdmin, isClient } = useAuth();
  
  // Redirect if user is already logged in
  if (user) {
    if (isAdmin) {
      return <Redirect to="/admin" />;
    } else if (isClient) {
      return <Redirect to="/dashboard" />;
    }
  }
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-neutral-50 to-neutral-100">
      <div className="absolute top-5 right-5">
        <LanguageSwitcher />
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 max-w-6xl gap-10 relative">
        <div className="absolute top-0 right-0 -z-10 w-3/4 h-3/4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-3/4 h-3/4 bg-gradient-to-br from-blue-50 to-primary/5 rounded-full blur-3xl"></div>
        
        <div className="flex items-center justify-center order-2 lg:order-1">
          <AuthForm />
        </div>
        
        <div className="hidden lg:flex flex-col justify-center p-10 bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl shadow-xl order-1 lg:order-2 backdrop-blur-sm">
          <h2 className="text-4xl font-bold mb-6">
            Bienvenue sur EuroNova
          </h2>
          <p className="text-lg mb-8 text-white/90">
            La plateforme bancaire européenne qui révolutionne la façon dont vous gérez votre argent, avec sécurité et simplicité.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2.5 rounded-full">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">Transactions sécurisées</h3>
                <p className="text-white/80">Protection par vérification en 5 étapes pour toutes vos transactions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2.5 rounded-full">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">Gestion de cartes intelligente</h3>
                <p className="text-white/80">Contrôlez vos cartes physiques et virtuelles simplement</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2.5 rounded-full">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">Virements internationaux</h3>
                <p className="text-white/80">Transferts d'argent partout en Europe à tarifs avantageux</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2.5 rounded-full">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">Notifications en temps réel</h3>
                <p className="text-white/80">Suivez vos mouvements financiers instantanément</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/20">
            <p className="text-white/80">
              Déjà plus de 500,000 utilisateurs satisfaits dans l'Union Européenne font confiance à EuroNova.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
