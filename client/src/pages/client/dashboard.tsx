import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/lib/auth.tsx";
import { Link } from "wouter";
import { 
  CreditCard, 
  Wallet, 
  LineChart, 
  ArrowUpRight 
} from "lucide-react";
import { TransactionItem } from "@/components/ui/transaction-item";
import { VerificationProgress } from "@/components/ui/verification-step";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Account, Transaction, VerificationStep } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  // Fetch accounts for the current user
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts/user'],
    enabled: !!user,
  });
  
  // Fetch recent transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions/account/' + (accounts[0]?.id || 0)],
    enabled: !!accounts && accounts.length > 0,
    // S'assurer que les transactions sont rechargées chaque fois que les comptes changent
    refetchOnWindowFocus: true,
    staleTime: 5000, // Les données sont considérées comme obsolètes après 5 secondes
  });
  
  // Fetch verification steps
  const { data: verificationStep, isLoading: isLoadingVerification } = useQuery<VerificationStep>({
    queryKey: ['/api/verification-steps/user'],
    enabled: !!user,
  });
  
  // Complete verification step mutation
  const completeStepMutation = useMutation({
    mutationFn: async ({ stepId, stepNumber }: { stepId: number, stepNumber: number }) => {
      const fieldName = `step${stepNumber}Completed`;
      const data = { [fieldName]: true };
      
      const res = await apiRequest("PATCH", `/api/verification-steps/${stepId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Paiement effectué",
        description: "Le paiement a été effectué avec succès",
      });
      
      // Close dialog
      setPaymentStep(null);
      
      // Refresh verification data
      queryClient.invalidateQueries({ queryKey: ['/api/verification-steps/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de paiement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handlePayNow = (stepNumber: number) => {
    if (!verificationStep) return;
    
    // Get amount for the step
    let amount = 0;
    switch (stepNumber) {
      case 1: amount = verificationStep.step1Amount || 75; break;
      case 2: amount = verificationStep.step2Amount || 150; break;
      case 3: amount = verificationStep.step3Amount || 225; break;
      case 4: amount = verificationStep.step4Amount || 180; break;
      case 5: amount = verificationStep.step5Amount || 95; break;
    }
    
    setPaymentStep(stepNumber);
    setPaymentAmount(amount);
  };
  
  const processPayment = () => {
    if (!verificationStep || !paymentStep) return;
    
    completeStepMutation.mutate({
      stepId: verificationStep.id,
      stepNumber: paymentStep
    });
  };
  
  // Loading states
  if (!user) {
    return <div>Chargement...</div>;
  }
  
  const mainAccount = accounts.find(account => account.accountType === 'current') || accounts[0];
  const savingsAccount = accounts.find(account => account.accountType === 'savings');
  const creditAccount = accounts.find(account => account.accountType === 'credit');
  const investmentAccount = accounts.find(account => account.accountType === 'investment');
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 mb-16 md:mb-0 md:ml-64">
        <h2 className="text-2xl font-bold mb-6">Tableau de bord</h2>
        
        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Main Account Card */}
          {mainAccount && (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Compte courant</p>
                  <h3 className="text-xl font-bold">€{mainAccount.balance.toFixed(2)}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500">{mainAccount.accountNumber}</p>
            </div>
          )}
          
          {/* Savings Account Card */}
          {savingsAccount ? (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Épargne</p>
                  <h3 className="text-xl font-bold">€{savingsAccount.balance.toFixed(2)}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-neutral-500">{savingsAccount.accountNumber}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Épargne</p>
                  <h3 className="text-xl font-bold">€0.00</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-neutral-500">Aucun compte d'épargne</p>
            </div>
          )}
          
          {/* Investments Card */}
          {investmentAccount ? (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Investissements</p>
                  <h3 className="text-xl font-bold">€{investmentAccount.balance.toFixed(2)}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <LineChart className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-success flex items-center">+5.2% <ArrowUpRight className="ml-1 h-3 w-3" /></span>
                <span className="text-xs text-neutral-500 ml-2">ce mois</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Investissements</p>
                  <h3 className="text-xl font-bold">€0.00</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <LineChart className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500">Aucun investissement</p>
            </div>
          )}
          
          {/* Credit Card */}
          {creditAccount ? (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Carte de crédit</p>
                  <h3 className="text-xl font-bold">€{Math.abs(creditAccount.balance).toFixed(2)}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500">Limite: €5,000 • Échéance: 15/08/2023</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-neutral-500 text-sm">Carte de crédit</p>
                  <h3 className="text-xl font-bold">€0.00</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-neutral-500">Aucune carte de crédit</p>
            </div>
          )}
        </div>
        
        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow p-5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Historique des transactions</h3>
            <Link href="/transactions" className="text-primary text-sm font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-500">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-500">Catégorie</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-500">Montant</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">Chargement des transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">Aucune transaction trouvée</td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map(transaction => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction} 
                      account={mainAccount} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        

      </div>
      
      <Sidebar />
      <MobileNav />
      
      {/* Payment Dialog */}
      <Dialog open={paymentStep !== null} onOpenChange={(open) => !open && setPaymentStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Effectuer le paiement</DialogTitle>
            <DialogDescription>
              Veuillez confirmer le paiement pour continuer le processus de vérification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Étape de vérification:</p>
              <p className="font-medium">
                {paymentStep === 1 && "Frais d'enregistrement de crédit"}
                {paymentStep === 2 && "Frais de virement international"}
                {paymentStep === 3 && "Frais de justice"}
                {paymentStep === 4 && "Frais d'assurance"}
                {paymentStep === 5 && "Frais d'autorisation de décaissement"}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Montant:</p>
              <p className="text-xl font-bold">€{paymentAmount.toFixed(2)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Compte à débiter:</p>
              <p className="font-medium">Compte courant - {mainAccount?.accountNumber}</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button 
              onClick={processPayment}
              disabled={completeStepMutation.isPending}
            >
              {completeStepMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement...
                </>
              ) : (
                "Confirmer le paiement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
