import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/lib/auth.tsx";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, Account } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CardItem, CardListItem } from "@/components/ui/card-item";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Cards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isVirtual, setIsVirtual] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<"visa" | "mastercard">("visa");
  
  // Fetch accounts for the current user
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts/user'],
    enabled: !!user,
  });
  
  // Fetch cards for the current user
  const { data: cards = [], isLoading: isLoadingCards } = useQuery<Card[]>({
    queryKey: ['/api/cards/user'],
    enabled: !!user,
  });
  
  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: { userId: number, accountId: number, cardType: string, isVirtual: boolean }) => {
      const cardholderName = `${user?.firstName?.toUpperCase()} ${user?.lastName?.toUpperCase()}`;
      
      const cardData = {
        userId: data.userId,
        accountId: data.accountId,
        cardType: data.cardType,
        isVirtual: data.isVirtual,
        cardholderName,
        // These fields would usually be generated server-side
        // but are required for the form submission
        cardNumber: "",
        expiryDate: "",
        cvv: ""
      };
      
      const res = await apiRequest("POST", "/api/cards", cardData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Carte créée",
        description: "Votre nouvelle carte a été créée avec succès",
      });
      
      // Close dialog and reset state
      setIsAddCardDialogOpen(false);
      setSelectedAccountId(null);
      setIsVirtual(false);
      setSelectedCardType("visa");
      
      // Refresh cards data
      queryClient.invalidateQueries({ queryKey: ['/api/cards/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateCard = () => {
    if (!user || !selectedAccountId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un compte",
        variant: "destructive",
      });
      return;
    }
    
    createCardMutation.mutate({
      userId: user.id,
      accountId: selectedAccountId,
      cardType: selectedCardType,
      isVirtual: isVirtual
    });
  };
  
  // Loading states
  if (!user) {
    return <div>Chargement...</div>;
  }
  
  // Group cards by physical and virtual
  const physicalCards = cards.filter(card => !card.isVirtual);
  const virtualCards = cards.filter(card => card.isVirtual);
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header />
      
      <div className="flex-1 container mx-auto p-4 md:p-6 mb-16 md:mb-0 md:ml-64">
        <h2 className="text-2xl font-bold mb-6">Cartes et comptes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Physical Cards */}
          {physicalCards.map(card => (
            <CardItem key={card.id} card={card} />
          ))}
          
          {/* Virtual Cards */}
          {virtualCards.map(card => (
            <CardItem key={card.id} card={card} />
          ))}
          
          {/* Add New Card */}
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <PlusCircle className="h-8 w-8" />
            </div>
            <h3 className="font-medium mb-2">Ajouter une nouvelle carte</h3>
            <p className="text-sm text-neutral-500 mb-4">Physique ou virtuelle pour vos achats en ligne</p>
            <Button 
              onClick={() => setIsAddCardDialogOpen(true)}
            >
              Demander une carte
            </Button>
          </div>
        </div>
        
        {/* Card Management */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="font-bold mb-4">Gérer vos cartes</h3>
          
          <div className="space-y-4">
            {cards.map(card => (
              <CardListItem key={card.id} card={card} />
            ))}
            
            {cards.length === 0 && (
              <div className="text-center py-6 text-neutral-500">
                Vous n'avez pas encore de carte. Créez-en une nouvelle en cliquant sur "Demander une carte".
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Sidebar />
      <MobileNav />
      
      {/* Add Card Dialog */}
      <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une nouvelle carte</DialogTitle>
            <DialogDescription>
              Choisissez les options pour votre nouvelle carte
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Compte associé</Label>
              <Select 
                value={selectedAccountId?.toString()} 
                onValueChange={(value) => setSelectedAccountId(parseInt(value))}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.accountType === 'current' ? 'Compte courant' : 
                        account.accountType === 'savings' ? 'Épargne' : 
                        account.accountType} - {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="card-type">Type de carte</Label>
              <Select 
                value={selectedCardType} 
                onValueChange={(value) => setSelectedCardType(value as "visa" | "mastercard")}
              >
                <SelectTrigger id="card-type">
                  <SelectValue placeholder="Sélectionner un type de carte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="is-virtual" 
                checked={isVirtual}
                onCheckedChange={setIsVirtual}
              />
              <Label htmlFor="is-virtual">Carte virtuelle</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddCardDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateCard}
              disabled={!selectedAccountId || createCardMutation.isPending}
            >
              {createCardMutation.isPending ? "Création en cours..." : "Créer la carte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
