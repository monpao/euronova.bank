import { useState, useEffect } from "react";
import { User, VerificationStep } from "@shared/schema";
import { Loader2, Copy, Eye, EyeOff, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { VerificationProgress } from "@/components/ui/verification-step";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface ClientDetailsModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailsModal({ 
  userId, 
  isOpen, 
  onClose 
}: ClientDetailsModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [stepAmounts, setStepAmounts] = useState<{[key: string]: number}>({
    step1Amount: 0,
    step2Amount: 0,
    step3Amount: 0,
    step4Amount: 0,
    step5Amount: 0
  });
  const { toast } = useToast();

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'details'],
    queryFn: async () => {
      if (!userId) return null;
      
      const res = await fetch(`/api/users/${userId}/details`);
      if (!res.ok) {
        throw new Error('Erreur lors de la récupération des détails du client');
      }
      return res.json();
    },
    enabled: isOpen && userId !== null,
  });
  
  const { data: verificationStep, isLoading: isLoadingVerification } = useQuery({
    queryKey: ['/api/verification-steps/user', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const res = await fetch(`/api/verification-steps/user/${userId}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Erreur lors de la récupération des étapes de vérification');
      }
      return res.json();
    },
    enabled: isOpen && userId !== null,
  });

  // Mutation pour mettre à jour les montants des étapes de vérification
  const updateVerificationStepsMutation = useMutation({
    mutationFn: async (data: {[key: string]: number}) => {
      if (!verificationStep?.id) return null;
      const res = await apiRequest(
        "PATCH", 
        `/api/verification-steps/${verificationStep.id}`, 
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/verification-steps/user', userId] });
      toast({
        title: "Montants mis à jour",
        description: "Les montants des étapes ont été mis à jour avec succès",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les montants des étapes",
        variant: "destructive",
      });
      console.error("Erreur de mise à jour des montants:", error);
    }
  });

  // Remplir les montants des étapes quand les données sont chargées
  useEffect(() => {
    if (verificationStep) {
      setStepAmounts({
        step1Amount: verificationStep.step1Amount || 75,
        step2Amount: verificationStep.step2Amount || 150,
        step3Amount: verificationStep.step3Amount || 225,
        step4Amount: verificationStep.step4Amount || 180,
        step5Amount: verificationStep.step5Amount || 95,
      });
    }
  }, [verificationStep]);

  const handleAmountChange = (step: string, value: string) => {
    const amount = parseInt(value);
    if (!isNaN(amount) && amount >= 0) {
      setStepAmounts(prev => ({
        ...prev,
        [step]: amount
      }));
    }
  };

  const saveCustomAmounts = () => {
    updateVerificationStepsMutation.mutate(stepAmounts);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copié !",
        description: `${label} copié dans le presse-papiers`,
        variant: "default",
      });
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du client</DialogTitle>
          <DialogDescription>
            Informations complètes sur le client et ses moyens de paiement
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !userDetails ? (
          <div className="text-center py-6 text-muted-foreground">
            Aucun détail disponible pour ce client
          </div>
        ) : (
          <Tabs defaultValue="verifications" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Informations personnelles</TabsTrigger>
              <TabsTrigger value="accounts" className="flex-1">Comptes bancaires</TabsTrigger>
              <TabsTrigger value="cards" className="flex-1">Cartes bancaires</TabsTrigger>
              <TabsTrigger value="verifications" className="flex-1 bg-primary/20 font-bold">Vérifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Identifiants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom d'utilisateur</p>
                      <p className="font-medium">{userDetails.username}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(userDetails.username, "Nom d'utilisateur")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mot de passe</p>
                      <p className="font-medium flex items-center">
                        {showPassword ? userDetails.password : "••••••••••••••"}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(userDetails.password, "Mot de passe")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom</p>
                      <p className="font-medium">{userDetails.firstName} {userDetails.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-medium">{userDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{userDetails.phone || "Non renseigné"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                      <p className="font-medium">{userDetails.dateOfBirth || "Non renseignée"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="font-medium">{userDetails.address || "Non renseignée"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    <Badge 
                      variant={userDetails.isActive ? "success" : "destructive"}
                      className="mt-1"
                    >
                      {userDetails.isActive ? "Actif" : "Bloqué"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="accounts" className="space-y-4 mt-4">
              {userDetails.accounts && userDetails.accounts.length > 0 ? (
                userDetails.accounts.map((account: any) => (
                  <Card key={account.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between">
                        <span>Compte {account.accountType}</span>
                        <Badge variant={account.isActive ? "success" : "destructive"}>
                          {account.isActive ? "Actif" : "Bloqué"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">RIB / Numéro de compte</p>
                          <p className="font-medium">{account.accountNumber}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(account.accountNumber, "RIB")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Solde</p>
                          <p className="font-medium">{account.balance.toFixed(2)} {account.currency}</p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          ID: {account.id}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun compte bancaire associé
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cards" className="space-y-4 mt-4">
              {userDetails.cards && userDetails.cards.length > 0 ? (
                userDetails.cards.map((card: any) => (
                  <Card key={card.id} className="overflow-hidden">
                    <div className="bg-primary/10 p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">EuroNova</p>
                          <p className="font-bold text-lg mt-5">{card.cardholderName}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={card.cardType === "visa" ? "default" : "outline"}>
                            {card.cardType === "visa" ? "VISA" : "MASTERCARD"}
                          </Badge>
                          <p className="font-mono text-xl mt-5 tracking-wider">
                            {card.cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4")}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between mt-5">
                        <div>
                          <p className="text-xs text-muted-foreground">EXPIRE</p>
                          <p className="font-medium">{card.expiryDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CVV</p>
                          <p className="font-medium">{card.cvv}</p>
                        </div>
                        <Badge variant={card.isActive ? "success" : "destructive"}>
                          {card.isActive ? "Active" : "Bloquée"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Numéro de carte</p>
                          <p className="font-medium">{card.cardNumber}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(card.cardNumber, "Numéro de carte")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CVV</p>
                          <p className="font-medium">{card.cvv}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(card.cvv, "CVV")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune carte bancaire associée
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="verifications" className="space-y-4 mt-4">
              {isLoadingVerification ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !verificationStep ? (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune étape de vérification pour ce client
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center">
                        <span>Montants personnalisés des étapes</span>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={saveCustomAmounts}
                          disabled={updateVerificationStepsMutation.isPending}
                        >
                          {updateVerificationStepsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Enregistrer
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="step1Amount">Étape 1: Frais d'enregistrement de crédit</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              id="step1Amount"
                              type="number"
                              value={stepAmounts.step1Amount}
                              onChange={(e) => handleAmountChange('step1Amount', e.target.value)}
                              className="w-32"
                              min={0}
                            />
                            <span className="ml-2">€</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="step2Amount">Étape 2: Frais de virement international</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              id="step2Amount"
                              type="number"
                              value={stepAmounts.step2Amount}
                              onChange={(e) => handleAmountChange('step2Amount', e.target.value)}
                              className="w-32"
                              min={0}
                            />
                            <span className="ml-2">€</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="step3Amount">Étape 3: Frais de justice</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              id="step3Amount"
                              type="number"
                              value={stepAmounts.step3Amount}
                              onChange={(e) => handleAmountChange('step3Amount', e.target.value)}
                              className="w-32"
                              min={0}
                            />
                            <span className="ml-2">€</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="step4Amount">Étape 4: Frais d'assurance</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              id="step4Amount"
                              type="number"
                              value={stepAmounts.step4Amount}
                              onChange={(e) => handleAmountChange('step4Amount', e.target.value)}
                              className="w-32"
                              min={0}
                            />
                            <span className="ml-2">€</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="step5Amount">Étape 5: Frais d'autorisation de décaissement</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              id="step5Amount"
                              type="number"
                              value={stepAmounts.step5Amount}
                              onChange={(e) => handleAmountChange('step5Amount', e.target.value)}
                              className="w-32"
                              min={0}
                            />
                            <span className="ml-2">€</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>État des vérifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VerificationProgress 
                        verificationStep={verificationStep}
                        isAdmin={true}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}