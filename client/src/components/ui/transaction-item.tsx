import { Transaction, Account } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Badge,
  BadgeProps
} from "@/components/ui/badge";

interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
}

export function TransactionItem({ transaction, account }: TransactionItemProps) {
  // Si c'est un dépôt et que le compte est défini et qu'il s'agit du compte cible
  const isCredit = account && (
    transaction.toAccountId === account.id || 
    (transaction.type === 'deposit' && !transaction.fromAccountId)
  );
  const isDebit = account && transaction.fromAccountId === account.id;
  
  // Gérer les dates potentiellement nulles ou invalides
  let date;
  try {
    date = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
  } catch (e) {
    date = new Date(); // Utiliser la date actuelle en cas d'erreur
  }
  
  // Format date to show relative time (e.g., "il y a 2 heures")
  const formattedDate = formatDistanceToNow(date, {
    addSuffix: true,
    locale: fr
  });
  
  // Format date for full display
  const fullDate = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  
  // Format amount with +/- sign
  const formatAmount = () => {
    if (isCredit) return `+${transaction.amount.toFixed(2)}€`;
    if (isDebit) return `-${transaction.amount.toFixed(2)}€`;
    return `${transaction.amount.toFixed(2)}€`;
  };
  
  // Determine category badge color
  const getCategoryBadge = (): { variant: BadgeProps["variant"], label: string } => {
    if (isCredit) {
      if (transaction.category === "salary") {
        return { variant: "success", label: "Salaire" };
      }
      if (transaction.category === "deposit") {
        return { variant: "success", label: "Dépôt" };
      }
      return { variant: "success", label: "Crédit" };
    }
    
    switch (transaction.category) {
      case "deposit":
        return { variant: "success", label: "Dépôt" };
      case "groceries":
        return { variant: "outline", label: "Courses" };
      case "transport":
        return { variant: "outline", label: "Transport" };
      case "housing":
        return { variant: "outline", label: "Logement" };
      case "utilities":
        return { variant: "outline", label: "Factures" };
      default:
        return { variant: "outline", label: transaction.category || "Autre" };
    }
  };
  
  const { variant, label } = getCategoryBadge();
  
  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
      <td className="py-3 px-4" title={fullDate}>
        {formattedDate}
      </td>
      <td className="py-3 px-4">
        {transaction.description || "Transaction"}
      </td>
      <td className="py-3 px-4">
        <Badge variant={variant} className="px-2 py-1 text-xs">
          {label}
        </Badge>
      </td>
      <td className={`py-3 px-4 text-right font-medium ${isCredit ? 'text-success' : ''}`}>
        {formatAmount()}
      </td>
    </tr>
  );
}
