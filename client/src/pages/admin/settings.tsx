import React from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PaymentAccountForm } from '@/components/admin/payment-account-form';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('payments');
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
          <p className="text-muted-foreground">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Paramètres du système</h2>
          <p className="text-muted-foreground">
            Configurez les paramètres globaux de l'application.
          </p>
        </div>
        
        <Separator />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-transparent border-b rounded-none justify-start">
            <TabsTrigger 
              value="payments" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-b-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Configurations des paiements
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-b-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Configurations des emails
            </TabsTrigger>
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-b-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
            >
              Paramètres généraux
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="pt-6">
            <PaymentAccountForm />
          </TabsContent>
          
          <TabsContent value="email" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des emails</CardTitle>
                <CardDescription>
                  Configurez les paramètres d'envoi des emails et les modèles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Cette section sera implémentée prochainement.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="general" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>
                  Configurez les paramètres généraux de l'application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Cette section sera implémentée prochainement.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}