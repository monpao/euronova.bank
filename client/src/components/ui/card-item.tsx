import { Card } from "@shared/schema";
import { 
  CreditCard, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Settings, 
  Lock, 
  Unlock,
  Trash
} from "lucide-react";
import { useState } from "react";
import { Card as CardUI } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CardItemProps {
  card: Card;
  isAdmin?: boolean;
}

export function CardItem({ card, isAdmin = false }: CardItemProps) {
  const [showCardDetails, setShowCardDetails] = useState(false);
  
  const updateCardMutation = useMutation({
    mutationFn: async (data: { isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/cards/${card.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/cards/account/${card.accountId}`] });
    }
  });
  
  const toggleLock = () => {
    updateCardMutation.mutate({ isActive: !card.isActive });
  };
  
  const formatCardNumber = (number: string) => {
    if (showCardDetails) return number;
    return number.replace(/\d{4} \d{4} \d{4} (\d{4})/, "•••• •••• •••• $1");
  };
  
  const formatCVV = (cvv: string) => {
    if (showCardDetails) return cvv;
    return "•••";
  };
  
  const getGradientClass = () => {
    return card.isVirtual
      ? "bg-gradient-to-r from-accent to-[#30E8D5]"
      : "bg-gradient-to-r from-secondary to-primary";
  };
  
  return (
    <CardUI className={`${getGradientClass()} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex justify-between items-start mb-6">
        <span className="font-medium">{card.isVirtual ? "Carte Virtuelle" : "EuroNova"}</span>
        <div className="text-2xl">
          {card.cardType === "visa" ? (
            <span className="ri-visa-line">Visa</span>
          ) : (
            <span className="ri-mastercard-line">Mastercard</span>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <p className="mb-1 opacity-80 text-sm">Numéro de carte</p>
        <p className="font-medium tracking-wider flex justify-between">
          <span>{formatCardNumber(card.cardNumber)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white p-0 h-auto"
            onClick={() => setShowCardDetails(!showCardDetails)}
          >
            {showCardDetails ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </p>
      </div>
      
      <div className="flex justify-between">
        <div>
          <p className="opacity-80 text-xs">Titulaire</p>
          <p className="font-medium">{card.cardholderName}</p>
        </div>
        <div>
          <p className="opacity-80 text-xs">Expire</p>
          <p className="font-medium">{card.expiryDate}</p>
        </div>
        {showCardDetails && (
          <div>
            <p className="opacity-80 text-xs">CVV</p>
            <p className="font-medium">{formatCVV(card.cvv)}</p>
          </div>
        )}
      </div>
      
      {/* Card actions */}
      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-white/20 flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20"
            onClick={toggleLock}
          >
            {card.isActive ? <Lock size={16} /> : <Unlock size={16} />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20"
          >
            <Settings size={16} />
          </Button>
        </div>
      )}
      
      {/* Status indicator */}
      {!card.isActive && (
        <div className="absolute top-4 right-4 bg-error/90 text-white text-xs px-2 py-1 rounded-full">
          Bloquée
        </div>
      )}
    </CardUI>
  );
}

export function CardListItem({ card }: CardItemProps) {
  const [showCardDetails, setShowCardDetails] = useState(false);
  
  const updateCardMutation = useMutation({
    mutationFn: async (data: { isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/cards/${card.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/cards/account/${card.accountId}`] });
    }
  });
  
  const toggleLock = () => {
    updateCardMutation.mutate({ isActive: !card.isActive });
  };
  
  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50">
      <div className="flex items-center">
        <CreditCard className={`text-xl mr-4 ${card.isVirtual ? 'text-accent' : 'text-primary'}`} />
        <div>
          <h4 className="font-medium">
            Carte {card.cardType === "visa" ? "Visa" : "Mastercard"} ***{card.cardNumber.slice(-4)}
          </h4>
          <p className="text-sm text-muted-foreground">
            {card.isVirtual ? "Carte virtuelle" : "Carte physique"}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-600 hover:text-primary"
          onClick={toggleLock}
        >
          {card.isActive ? <Lock size={18} /> : <Unlock size={18} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-600 hover:text-primary"
          onClick={() => setShowCardDetails(!showCardDetails)}
        >
          <Eye size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-600 hover:text-primary"
        >
          <Settings size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-600 hover:text-error"
        >
          <Trash size={18} />
        </Button>
      </div>
    </div>
  );
}
