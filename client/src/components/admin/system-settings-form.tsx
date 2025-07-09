import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schéma pour les paramètres de compte de paiement
const paymentAccountSchema = z.object({
  settingKey: z.string(),
  settingValue: z.string().min(8, "Numéro de compte requis (au moins 8 caractères)"),
  description: z.string().optional(),
});

type PaymentAccountFormValues = z.infer<typeof paymentAccountSchema>;

// Fonctions utilitaires
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Formulaire pour configurer un compte de paiement pour une étape
function PaymentAccountForm({ step }: { step: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settingKey = `payment_account_${step}`;
  const stepNumber = step.replace("step", "");
  const stepNames = [
    "Registration Fee",
    "International Transfer Fee",
    "Legal Fee",
    "Insurance Fee",
    "Disbursement Authorization Fee"
  ];
  const stepName = stepNames[parseInt(stepNumber) - 1] || "Fee";

  // Récupérer les comptes disponibles
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/accounts');
      return res.json();
    },
  });

  // Récupérer le paramètre existant s'il existe
  const { data: setting, isLoading: settingLoading } = useQuery({
    queryKey: ['/api/system-settings', settingKey],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/system-settings/${settingKey}`);
        return res.json();
      } catch (error) {
        // Si le paramètre n'existe pas, retourner undefined
        if (error instanceof Response && error.status === 404) {
          return undefined;
        }
        throw error;
      }
    },
  });

  // Formulaire
  const form = useForm<PaymentAccountFormValues>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues: {
      settingKey,
      settingValue: "",
      description: `Compte bancaire pour le paiement des frais de ${stepName.toLowerCase()}`
    },
  });

  // Mettre à jour les valeurs par défaut quand les données sont chargées
  useEffect(() => {
    if (setting) {
      form.reset({
        settingKey: setting.settingKey,
        settingValue: setting.settingValue,
        description: setting.description || `Compte bancaire pour le paiement des frais de ${stepName.toLowerCase()}`
      });
    }
  }, [setting, form, stepName]);

  // Mutation pour créer ou mettre à jour le paramètre
  const mutation = useMutation({
    mutationFn: async (data: PaymentAccountFormValues) => {
      if (setting) {
        // Mettre à jour un paramètre existant
        const res = await apiRequest('PUT', `/api/system-settings/${settingKey}`, { 
          settingValue: data.settingValue,
          description: data.description
        });
        return res.json();
      } else {
        // Créer un nouveau paramètre
        const res = await apiRequest('POST', '/api/system-settings', data);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Paramètre sauvegardé",
        description: `Le compte de paiement pour l'étape ${stepNumber} (${stepName}) a été configuré avec succès.`,
      });
      // Invalider les requêtes pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings', settingKey] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la sauvegarde du paramètre: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Soumettre le formulaire
  const onSubmit = (data: PaymentAccountFormValues) => {
    mutation.mutate(data);
  };

  // Rechercher le compte correspondant
  const selectedAccount = accounts?.find((account: any) => account.accountNumber === form.watch("settingValue"));

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Configuration du compte pour l'étape {stepNumber}</CardTitle>
        <CardDescription>
          {stepName} - Sélectionnez le compte bancaire qui recevra les paiements pour cette étape.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="settingValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte de réception</FormLabel>
                  <Select
                    disabled={mutation.isPending || accountsLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un compte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts && accounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.accountNumber}>
                          {account.accountNumber} - {account.user.firstName} {account.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Description du compte" 
                      disabled={mutation.isPending}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAccount && (
              <Alert className="mt-4">
                <AlertDescription>
                  <div className="flex flex-col space-y-1">
                    <p><strong>Compte sélectionné:</strong> {selectedAccount.accountNumber}</p>
                    <p><strong>Propriétaire:</strong> {selectedAccount.user.firstName} {selectedAccount.user.lastName}</p>
                    <p><strong>Email:</strong> {selectedAccount.user.email}</p>
                    <p><strong>Solde:</strong> {selectedAccount.balance} {selectedAccount.currency}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Composant principal pour la configuration des paramètres du système
export function SystemSettingsForm() {
  const [activeTab, setActiveTab] = useState("payment-accounts");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Paramètres du système</h2>
        <p className="text-muted-foreground">
          Configurez les paramètres globaux du système, y compris les comptes pour les étapes de vérification.
        </p>
      </div>

      <Tabs defaultValue="payment-accounts" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="payment-accounts">Comptes de paiement</TabsTrigger>
          <TabsTrigger value="general">Paramètres généraux</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment-accounts" className="space-y-4">
          <p className="mb-4">
            Configurez les comptes bancaires qui recevront les paiements pour chaque étape de vérification.
            Ces comptes seront affichés aux clients lorsqu'ils procèdent au paiement des frais.
          </p>
          
          <PaymentAccountForm step="step1" />
          <PaymentAccountForm step="step2" />
          <PaymentAccountForm step="step3" />
          <PaymentAccountForm step="step4" />
          <PaymentAccountForm step="step5" />
        </TabsContent>
        
        <TabsContent value="general">
          <p>Les paramètres généraux seront implémentés ultérieurement.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}