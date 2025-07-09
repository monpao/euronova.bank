import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, DollarSign, FileText, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const paymentAccountSchema = z.object({
  accountOwner: z.string().min(1, 'Le nom du bénéficiaire est requis'),
  accountNumber: z.string().min(1, 'Le numéro de compte est requis'),
  description: z.string().optional(),
  stepNumber: z.number().min(1).max(5)
});

type PaymentAccountFormValues = z.infer<typeof paymentAccountSchema>;

export function PaymentAccountForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState('1');
  
  // Détails des étapes
  const steps = [
    { number: 1, name: "Frais d'enregistrement", description: "Frais initiaux pour l'enregistrement du dossier de transfert." },
    { number: 2, name: "Frais de transfert international", description: "Frais pour le traitement du transfert international." },
    { number: 3, name: "Frais légaux", description: "Frais pour les aspects juridiques et la conformité." },
    { number: 4, name: "Frais d'assurance", description: "Frais pour l'assurance de la transaction." },
    { number: 5, name: "Frais d'autorisation de décaissement", description: "Frais pour l'autorisation finale de décaissement." },
  ];
  
  const activeStepNumber = parseInt(activeTab);
  
  // Requête pour récupérer les détails du compte de paiement pour l'étape active
  const { data: paymentAccount, isLoading } = useQuery({
    queryKey: [`/api/payment-account/${activeStepNumber}`],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: false,
    refetchOnWindowFocus: false
  });
  
  // Configuration du formulaire avec React Hook Form
  const form = useForm<PaymentAccountFormValues>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues: {
      accountOwner: '',
      accountNumber: '',
      description: '',
      stepNumber: activeStepNumber
    },
    values: paymentAccount ? {
      ...paymentAccount,
      stepNumber: activeStepNumber
    } : undefined
  });
  
  // Réinitialiser le formulaire lorsque l'onglet change
  React.useEffect(() => {
    if (paymentAccount) {
      form.reset({
        ...paymentAccount,
        stepNumber: activeStepNumber
      });
    } else {
      form.reset({
        accountOwner: '',
        accountNumber: '',
        description: '',
        stepNumber: activeStepNumber
      });
    }
  }, [paymentAccount, activeStepNumber, form]);
  
  // Mutation pour mettre à jour les détails du compte
  const updateMutation = useMutation({
    mutationFn: async (data: PaymentAccountFormValues) => {
      const res = await apiRequest('POST', `/api/payment-account/${data.stepNumber}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration enregistrée",
        description: `Les détails du compte pour l'étape ${activeStepNumber} ont été mis à jour.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/payment-account/${activeStepNumber}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la mise à jour des détails: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: PaymentAccountFormValues) => {
    updateMutation.mutate({
      ...data,
      stepNumber: activeStepNumber
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration des comptes pour les paiements</CardTitle>
        <CardDescription>
          Configurez les comptes bancaires qui recevront les paiements pour chaque étape de vérification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            {steps.map(step => (
              <TabsTrigger key={step.number} value={String(step.number)}>
                Étape {step.number}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {steps.map(step => (
            <TabsContent key={step.number} value={String(step.number)}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {step.name}
                    {step.number === 1 && <DollarSign className="h-5 w-5 text-primary" />}
                    {step.number === 2 && <FileText className="h-5 w-5 text-primary" />}
                    {step.number === 3 && <FileText className="h-5 w-5 text-primary" />}
                    {step.number === 4 && <FileText className="h-5 w-5 text-primary" />}
                    {step.number === 5 && <CheckCircle className="h-5 w-5 text-primary" />}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                
                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Informations importantes</AlertTitle>
                  <AlertDescription>
                    Les informations saisies ici seront affichées aux clients lorsqu'ils devront effectuer un paiement pour cette étape.
                    Assurez-vous que les informations bancaires sont correctes.
                  </AlertDescription>
                </Alert>
                
                {step.number.toString() === activeTab && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="accountOwner"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du bénéficiaire</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: EuroNova Bank SA" {...field} />
                            </FormControl>
                            <FormDescription>
                              Le nom complet du titulaire du compte qui recevra les paiements.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de compte / RIB</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: FR76 1234 5678 9101 1121 3141 516" {...field} />
                            </FormControl>
                            <FormDescription>
                              Le numéro de compte complet, incluant les codes bancaires si nécessaire.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (optionnel)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ex: Mentionnez votre identifiant client dans la référence du virement" 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Instructions ou informations supplémentaires pour ce paiement.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Enregistrement..." : "Enregistrer la configuration"}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 inline-block mr-1" />
          Les modifications apportées seront immédiatement visibles pour les clients.
        </p>
      </CardFooter>
    </Card>
  );
}