import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { ClientLayout } from '@/components/layout/client-layout';
import { PaymentStepInfo } from '@/components/client/payment-step-info';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckIcon, AlertCircle, ArrowLeft, ArrowRight, Lock, Unlock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function PaymentsPage() {
  const { user, isLoading } = useAuth();
  const [activeStep, setActiveStep] = useState('1');
  
  // Données de vérification
  const { data: verificationStep, isLoading: isLoadingVerification } = useQuery({
    queryKey: ['/api/verification-step'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });
  
  if (isLoading || isLoadingVerification) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ClientLayout>
    );
  }
  
  // Montants par étape
  const stepAmounts = {
    1: verificationStep?.step1Amount || 250,
    2: verificationStep?.step2Amount || 450,
    3: verificationStep?.step3Amount || 750,
    4: verificationStep?.step4Amount || 1200,
    5: verificationStep?.step5Amount || 2000,
  };
  
  // État de vérification par étape
  const stepVerifications = {
    step1Completed: verificationStep?.step1Completed || false,
    step2Completed: verificationStep?.step2Completed || false,
    step3Completed: verificationStep?.step3Completed || false,
    step4Completed: verificationStep?.step4Completed || false,
    step5Completed: verificationStep?.step5Completed || false,
  };
  
  const totalSteps = 5;
  const completedSteps = Object.values(stepVerifications).filter(Boolean).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const isStepEnabled = (step: number) => {
    // L'étape 1 est toujours activée
    if (step === 1) return true;
    
    // Pour les autres étapes, l'étape précédente doit être complétée
    const prevStep = step - 1;
    return stepVerifications[`step${prevStep}Completed` as keyof typeof stepVerifications];
  };
  
  const isStepCompleted = (step: number) => {
    return stepVerifications[`step${step}Completed` as keyof typeof stepVerifications];
  };
  
  // Gérer le changement d'étape
  const handleStepChange = (step: string) => {
    setActiveStep(step);
  };
  
  // Navigation entre les étapes
  const goToNextStep = () => {
    const currentStep = parseInt(activeStep);
    if (currentStep < totalSteps) {
      setActiveStep((currentStep + 1).toString());
    }
  };
  
  const goToPrevStep = () => {
    const currentStep = parseInt(activeStep);
    if (currentStep > 1) {
      setActiveStep((currentStep - 1).toString());
    }
  };
  
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Paiements de vérification</h2>
          <p className="text-muted-foreground mt-2">
            Effectuez les paiements requis pour compléter le processus de vérification de votre compte.
          </p>
        </div>
        
        <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>Processus de vérification</AlertTitle>
          <AlertDescription>
            Pour accéder à votre transfert final, toutes les étapes de vérification doivent être complétées. 
            Veuillez effectuer les paiements dans l'ordre indiqué ci-dessous.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Progression globale</h3>
          <Progress value={progressPercentage} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedSteps} étape{completedSteps > 1 ? 's' : ''} sur {totalSteps} complétée{completedSteps > 1 ? 's' : ''}</span>
            <span>
              {progressPercentage.toFixed(0)}% terminé
            </span>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Étapes de paiement</CardTitle>
            <CardDescription>
              Suivez ces étapes pour valider votre transfert.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs 
              value={activeStep} 
              onValueChange={handleStepChange}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 mb-8">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                  <TabsTrigger 
                    key={step} 
                    value={step.toString()}
                    disabled={!isStepEnabled(step)}
                    className="relative"
                  >
                    <span className="flex items-center gap-2">
                      {isStepCompleted(step) && (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      )}
                      {!isStepEnabled(step) && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isStepEnabled(step) && !isStepCompleted(step) && (
                        <Unlock className="h-4 w-4 text-blue-500" />
                      )}
                      Étape {step}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <TabsContent key={step} value={step.toString()}>
                  <PaymentStepInfo 
                    currentStep={step} 
                    stepAmount={stepAmounts[step as keyof typeof stepAmounts]} 
                    totalSteps={totalSteps}
                    verificationStatus={stepVerifications}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={activeStep === '1'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              onClick={goToNextStep}
              disabled={activeStep === totalSteps.toString()}
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Separator />
        
        <div className="bg-muted/30 rounded-lg p-6 border">
          <h3 className="text-lg font-medium mb-4">Informations importantes</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</div>
              <div>
                <h4 className="font-medium">Effectuez le paiement via votre banque</h4>
                <p className="text-sm text-muted-foreground">
                  Tous les paiements doivent être effectués par virement bancaire depuis votre compte personnel.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</div>
              <div>
                <h4 className="font-medium">Mentionnez votre identifiant client</h4>
                <p className="text-sm text-muted-foreground">
                  Indiquez votre identifiant client ({user?.clientId || 'Non disponible'}) dans la référence du virement pour faciliter la vérification.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</div>
              <div>
                <h4 className="font-medium">Attendez la validation</h4>
                <p className="text-sm text-muted-foreground">
                  Après chaque paiement, notre équipe vérifiera et validera votre paiement dans un délai de 24 à 48 heures.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">4</div>
              <div>
                <h4 className="font-medium">Déblocage du transfert</h4>
                <p className="text-sm text-muted-foreground">
                  Une fois toutes les étapes validées, votre transfert sera débloqué et disponible sur votre compte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}