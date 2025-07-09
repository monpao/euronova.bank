import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Copy, LockIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PaymentStepInfoProps {
  currentStep: number;
  stepAmount: number;
  totalSteps: number;
  verificationStatus: {
    step1Completed: boolean | null;
    step2Completed: boolean | null;
    step3Completed: boolean | null;
    step4Completed: boolean | null;
    step5Completed: boolean | null;
  };
}

export function PaymentStepInfo({
  currentStep,
  stepAmount,
  totalSteps,
  verificationStatus
}: PaymentStepInfoProps) {
  const { toast } = useToast();
  
  // Calculate progress percentage
  const completedSteps = Object.values(verificationStatus).filter(status => status === true).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  // Fetch payment account information for the current step
  const { data: paymentAccount, isLoading, error } = useQuery({
    queryKey: [`/api/payment-account/${currentStep}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: currentStep > 0 && currentStep <= totalSteps,
  });
  
  const handleCopyAccountInfo = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Les informations ont été copiées dans le presse-papier.",
      duration: 3000,
    });
  };
  
  const stepName = () => {
    switch(currentStep) {
      case 1: return "Frais d'enregistrement";
      case 2: return "Frais de transfert international";
      case 3: return "Frais légaux";
      case 4: return "Frais d'assurance";
      case 5: return "Frais d'autorisation de décaissement";
      default: return "Étape inconnue";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-primary">
            Étape {currentStep}/{totalSteps} : {stepName()}
          </CardTitle>
          <Badge variant={verificationStatus[`step${currentStep}Completed` as keyof typeof verificationStatus] ? "success" : "outline"}>
            {verificationStatus[`step${currentStep}Completed` as keyof typeof verificationStatus] ? "Validé" : "En attente"}
          </Badge>
        </div>
        <CardDescription>
          Veuillez effectuer un paiement bancaire vers le compte indiqué ci-dessous pour valider cette étape.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Progression de validation</h3>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedSteps} étape{completedSteps > 1 ? 's' : ''} validée{completedSteps > 1 ? 's' : ''}</span>
              <span>{totalSteps - completedSteps} restante{totalSteps - completedSteps > 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold mb-2 flex items-center">
              Détails du paiement
              <AlertCircle className="h-4 w-4 ml-2 text-amber-500" />
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant à payer:</span>
                <span className="font-medium">{stepAmount.toLocaleString('fr-FR')} €</span>
              </div>
              
              <Separator />
              
              {isLoading ? (
                <div className="text-center p-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm mt-2">Chargement des informations de paiement...</p>
                </div>
              ) : error ? (
                <div className="text-center p-2 text-destructive">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Impossible de charger les informations de paiement.</p>
                </div>
              ) : paymentAccount ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Bénéficiaire</span>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{paymentAccount.accountOwner}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2" 
                        onClick={() => handleCopyAccountInfo(paymentAccount.accountOwner)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Numéro de compte / RIB</span>
                    <div className="flex justify-between items-center">
                      <span className="font-medium font-mono text-sm">{paymentAccount.accountNumber}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2" 
                        onClick={() => handleCopyAccountInfo(paymentAccount.accountNumber)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {paymentAccount.description && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Note</span>
                      <p className="text-sm">{paymentAccount.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-2">
                  <LockIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Aucune information de paiement n'est disponible pour cette étape.</p>
                </div>
              )}
            </div>
          </div>
          
          {verificationStatus[`step${currentStep}Completed` as keyof typeof verificationStatus] ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Paiement validé</h4>
                <p className="text-sm text-green-700">Cette étape a été validée avec succès.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <h4 className="font-medium text-amber-800 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Informations importantes
              </h4>
              <p className="text-sm text-amber-700">
                1. Effectuez le virement bancaire du montant exact indiqué ci-dessus.
              </p>
              <p className="text-sm text-amber-700">
                2. Indiquez votre identifiant client dans la référence du virement.
              </p>
              <p className="text-sm text-amber-700">
                3. Après avoir effectué le paiement, notre équipe vérifiera et validera votre paiement dans un délai de 24 à 48 heures.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-xs text-muted-foreground text-center w-full">
          Toutes les étapes de vérification doivent être complétées avant de pouvoir procéder à la transaction finale.
        </p>
      </CardFooter>
    </Card>
  );
}