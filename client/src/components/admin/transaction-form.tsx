import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTransactionSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserRound, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Extended schema for the transaction form
const transactionFormSchema = z.object({
  selectedClientId: z.string().optional(),
  amount: z.string().transform(val => Number(val) || 0),
  type: z.string(),
  currency: z.string().default("EUR"),
  reference: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  sendEmail: z.boolean().default(false),
}).refine(data => data.amount > 0, {
  message: "Le montant doit être supérieur à 0",
  path: ["amount"],
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function TransactionForm() {
  const { toast } = useToast();
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [clientAccounts, setClientAccounts] = useState<any[]>([]);
  
  // Fetch all accounts for the lookup with user information
  const { data: accounts = [] } = useQuery({
    queryKey: ['/api/accounts'],
    // Attention, cette requête ne fonctionnera que pour les admins
  });
  
  // Fetch all users for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Combiner les données utilisateur et compte si nécessaire
  const enrichedAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];
    if (!users || users.length === 0) return accounts;
    
    console.log("Enrichissement des comptes avec les utilisateurs...", 
                { totalAccounts: accounts.length, totalUsers: users.length });
    
    // Afficher tous les utilisateurs disponibles pour le débogage
    console.log("Utilisateurs disponibles:", users.map((u: any) => 
      `${u.id}: ${u.firstName} ${u.lastName} (${u.username})`));
    
    // Afficher tous les comptes disponibles
    console.log("Comptes disponibles:", accounts.map((a: any) => 
      `${a.id}: userId=${a.userId}, numéro=${a.accountNumber}`));
    
    return accounts.map((account: any) => {
      // Si l'account a déjà un objet user complet, le garder tel quel
      if (account.user && account.user.firstName && account.user.lastName) {
        console.log(`Compte ${account.id} a déjà un utilisateur attaché: ${account.user.firstName} ${account.user.lastName}`);
        return account;
      }
      
      // Sinon, chercher l'utilisateur correspondant et le rattacher
      // Essayer plusieurs méthodes pour s'assurer de trouver l'utilisateur correct
      let user = null;
      
      // Méthode 1: Comparaison directe des IDs
      user = users.find((u: any) => u.id === account.userId);
      
      // Méthode 2: Comparaison des chaînes de caractères si la première méthode échoue
      if (!user && account.userId) {
        user = users.find((u: any) => u.id.toString() === account.userId.toString());
      }
      
      if (user) {
        console.log(`✅ Compte ${account.id} enrichi avec l'utilisateur ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      } else {
        console.log(`❌ Aucun utilisateur trouvé pour le compte ${account.id} (userId: ${account.userId})`);
      }
      
      return {
        ...account,
        user: user ? {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        } : null
      };
    });
  }, [accounts, users]);
  
  // Organize data for easier selection
  useEffect(() => {
    if (users.length > 0) {
      // Filter to only show clients (not admin users)
      const clientUsers = users.filter((user: any) => user.role === 'client');
      setClients(clientUsers);
    }
  }, [users]);
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      selectedClientId: "",
      amount: "",
      type: "transfer",
      currency: "EUR",
      reference: "",
      description: "",
      category: "other",
      sendEmail: true,
    },
  });
  
  // Quand un client est sélectionné, on récupère directement ses comptes via l'API
  const fetchUserAccounts = useMutation({
    mutationFn: async (userId: number) => {
      console.log("Fetching accounts for user ID:", userId);
      const res = await apiRequest("GET", `/api/users/${userId}/accounts`);
      return await res.json();
    },
    onSuccess: (data: any[], variables: number) => {
      console.log("Comptes récupérés pour l'utilisateur:", data);
      
      // Trouver l'utilisateur sélectionné pour enrichir les comptes
      const selectedClient = users.find((u: any) => u.id === variables);
      
      if (!selectedClient) {
        console.error("Client non trouvé avec ID:", variables);
        toast({
          title: "Erreur",
          description: "Client non trouvé dans la liste des utilisateurs",
          variant: "destructive",
        });
        return;
      }
      
      // Enrichir les comptes avec les informations utilisateur
      const enrichedAccounts = data.map((account: any) => ({
        ...account,
        user: {
          id: selectedClient.id,
          username: selectedClient.username,
          firstName: selectedClient.firstName,
          lastName: selectedClient.lastName,
          email: selectedClient.email,
          role: selectedClient.role
        }
      }));
      
      console.log("Comptes enrichis:", enrichedAccounts);
      
      if (enrichedAccounts.length > 0) {
        setClientAccounts(enrichedAccounts);
        setSelectedAccount(null);
      } else {
        toast({
          title: "Aucun compte trouvé",
          description: "Ce client n'a pas de comptes bancaires",
          variant: "destructive",
        });
        setClientAccounts([]);
        setSelectedAccount(null);
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la récupération des comptes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les comptes du client",
        variant: "destructive",
      });
      setClientAccounts([]);
      setSelectedAccount(null);
    }
  });
  
  // Fonction de gestion du changement de client
  const handleClientSelect = (clientId: string) => {
    // Reset if "_empty" is selected or no value
    if (clientId === "_empty" || !clientId) {
      setClientAccounts([]);
      setSelectedAccount(null);
      return;
    }
    
    // Find client accounts via API
    const userId = parseInt(clientId);
    console.log("UserID sélectionné:", userId);
    
    if (!isNaN(userId)) {
      // Faire une requête spécifique pour récupérer les comptes de l'utilisateur
      fetchUserAccounts.mutate(userId);
    } else {
      toast({
        title: "Erreur",
        description: "ID client invalide",
        variant: "destructive",
      });
      setClientAccounts([]);
      setSelectedAccount(null);
    }
  };
  
  // When an account is selected
  const handleAccountSelect = (accountId: string) => {
    console.log("Account selection - ID:", accountId, "Type:", typeof accountId);
    console.log("Available accounts:", clientAccounts);
    
    // Try different comparison methods
    const accountIdNum = parseInt(accountId);
    console.log("Parsed accountId as number:", accountIdNum);
    
    // Method 1: Direct comparison with ID as number
    let account = clientAccounts.find((acc: any) => acc.id === accountIdNum);
    
    // Method 2: String comparison if method 1 fails
    if (!account) {
      account = clientAccounts.find((acc: any) => acc.id.toString() === accountId);
    }
    
    // Method 3: Case-insensitive string comparison if method 2 fails
    if (!account) {
      account = clientAccounts.find((acc: any) => 
        acc.id.toString().toLowerCase() === accountId.toLowerCase());
    }
    
    if (account) {
      console.log("Account found:", account);
      setSelectedAccount(account);
      
      toast({
        title: "Compte sélectionné",
        description: `RIB: ${account.accountNumber}`,
      });
    } else {
      console.error("No account found with ID:", accountId);
      console.error("Available account IDs:", clientAccounts.map((acc: any) => acc.id));
      
      toast({
        title: "Erreur",
        description: "Compte non trouvé",
        variant: "destructive",
      });
    }
  };
  

  
  const transactionMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending transaction data:", data);
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Transaction success:", data);
      toast({
        title: "Transaction effectuée",
        description: "La transaction a été effectuée avec succès",
      });
      
      // Réinitialiser seulement le formulaire mais conserver le client et le compte sélectionné
      form.reset({
        selectedClientId: form.getValues("selectedClientId"),
        sendEmail: true,
        type: "transfer",
        currency: "EUR",
        amount: "",
        reference: "",
        description: "",
        category: "other",
      });
      
      // Rafraîchir les données des comptes
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] }).then(() => {
        // Si un client est sélectionné, recharger ses comptes
        const clientId = form.getValues("selectedClientId");
        if (clientId && clientId !== "_empty") {
          handleClientSelect(clientId);
        }
      });
    },
    onError: (error: Error) => {
      console.error("Transaction error:", error);
      toast({
        title: "Erreur de transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TransactionFormValues) => {
    if (!selectedAccount) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sélectionner un compte",
        variant: "destructive",
      });
      return;
    }
    
    const { sendEmail, selectedClientId, ...transactionData } = data;
    
    // Assurez-vous que le montant est bien converti en nombre
    const amount = parseFloat(data.amount.toString());
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    // Préparer les données de transaction selon le type (crédit ou débit)
    let fromAccountId = null;
    let toAccountId = null;
    
    console.log("Preparing transaction with selectedAccount:", selectedAccount);
    console.log("Transaction type:", transactionType);
    
    if (transactionType === 'credit') {
      // Pour un crédit, le compte sélectionné est le bénéficiaire
      toAccountId = selectedAccount.id;
      console.log("Credit transaction - Setting toAccountId:", toAccountId);
    } else {
      // Pour un débit, le compte sélectionné est l'émetteur
      fromAccountId = selectedAccount.id;
      console.log("Debit transaction - Setting fromAccountId:", fromAccountId);
    }
    
    // Transaction proprement formatée pour l'API
    const transaction = {
      fromAccountId: fromAccountId,
      toAccountId: toAccountId,
      amount: amount,
      type: data.type,
      currency: data.currency || "EUR",
      reference: data.reference || null,
      description: data.description || null,
      category: data.category || null,
      status: "completed" // Toujours compléter les transactions admin
    };
    
    console.log("Données de transaction préparées:", transaction);
    transactionMutation.mutate(transaction);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nouvelle interface de sélection de client et compte */}
        <div className="bg-muted/20 p-4 rounded-md border border-border">
          <h3 className="text-lg font-medium mb-4">Sélection du client et du compte</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <FormField
              control={form.control}
              name="selectedClientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sélectionnez un client</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleClientSelect(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_empty">Sélectionner...</SelectItem>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.firstName} {client.lastName} {client.username ? `(${client.username})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {clientAccounts.length > 0 && (
              <div>
                <FormLabel>Sélectionnez un compte</FormLabel>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {clientAccounts.map((account: any) => (
                    <Card 
                      key={account.id} 
                      className={`cursor-pointer hover:border-primary transition-colors ${selectedAccount?.id === account.id ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => {
                        console.log("Clicking account card with ID:", account.id);
                        handleAccountSelect(account.id.toString());
                      }}
                    >
                      <CardContent className="p-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <div>
                            <p className="text-sm font-medium">{account.accountType === 'current' ? 'Compte courant' : 
                                            account.accountType === 'savings' ? 'Compte épargne' : 
                                            account.accountType === 'joint' ? 'Compte joint' : 'Compte'}
                            </p>
                            <p className="text-xs text-muted-foreground">{account.accountNumber}</p>
                          </div>
                        </div>
                        <Badge variant={account.isActive ? 'default' : 'destructive'}>
                          {account.balance.toFixed(2)} €
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        

        
        {selectedAccount && (
          <div className="p-4 border rounded-md bg-primary/5 shadow-sm">
            <div className="flex items-center mb-2">
              <UserRound className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">Compte sélectionné</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedAccount.user ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Client:</p>
                    <p className="font-medium">{selectedAccount.user.firstName} {selectedAccount.user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID Client:</p>
                    <p className="font-medium">{selectedAccount.user.username}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Client:</p>
                  <p className="font-medium">ID utilisateur: {selectedAccount.userId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">RIB:</p>
                <p className="font-medium">{selectedAccount.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde actuel:</p>
                <p className="font-medium">{selectedAccount.balance.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex space-x-4 mb-6">
              <Button
                type="button"
                variant={transactionType === 'credit' ? "default" : "outline"}
                className={transactionType === 'credit' ? "bg-success hover:bg-success/90" : ""}
                onClick={() => setTransactionType('credit')}
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créditer
              </Button>
              <Button
                type="button"
                variant={transactionType === 'debit' ? "default" : "outline"}
                className={transactionType === 'debit' ? "bg-destructive hover:bg-destructive/90" : ""}
                onClick={() => setTransactionType('debit')}
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Débiter
              </Button>
            </div>
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de transaction</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="transfer">Virement standard</SelectItem>
                    <SelectItem value="international">Virement international</SelectItem>
                    <SelectItem value="refund">Remboursement</SelectItem>
                    <SelectItem value="fee">Frais bancaires</SelectItem>
                    <SelectItem value="interest">Intérêts</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="ex: Remboursement erreur bancaire" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Référence</FormLabel>
              <FormControl>
                <Input placeholder="ex: REF-12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="salary">Salaire</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="groceries">Courses</SelectItem>
                  <SelectItem value="housing">Logement</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="utilities">Factures</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="sendEmail"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Envoyer une notification par e-mail au client
                </FormLabel>
                <FormDescription>
                  Le client recevra un e-mail détaillant cette transaction
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setSelectedAccount(null);
              setClientAccounts([]);
            }}
            disabled={transactionMutation.isPending}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={transactionMutation.isPending || !selectedAccount}
          >
            {transactionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              transactionType === 'credit' ? "Créditer le compte" : "Débiter le compte"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
