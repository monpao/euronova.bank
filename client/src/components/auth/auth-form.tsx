import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useAuth } from "@/lib/auth.tsx";
import { Redirect } from "wouter";

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, isLoading } = useAuth();
  
  // Redirect if user is already logged in
  if (user && !isLoading) {
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    }
    return <Redirect to="/" />;
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-neutral-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Euro<span className="font-extrabold">Nova</span>
        </h1>
        <p className="text-neutral-600">Votre expérience bancaire européenne</p>
      </div>

      <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex justify-center gap-8 border-b border-neutral-200 mb-6 w-full bg-transparent">
          <TabsTrigger 
            value="login" 
            className="py-3 px-4 font-medium text-base data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:text-neutral-500 bg-transparent transition-all"
          >
            Connexion
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className="py-3 px-4 font-medium text-base data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:text-neutral-500 bg-transparent transition-all"
          >
            Inscription
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        
        <TabsContent value="register">
          <RegisterForm onSuccess={() => setActiveTab("login")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
