import { User, Account, Card, Transaction, VerificationStep } from "./schema";

// Types for auth
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

// Extended types with related data
export interface UserWithAccounts extends User {
  accounts: Account[];
}

// Interface for generated user credentials
export interface GeneratedCredentials {
  clientId: string;
  password: string;
  accountNumber: string;
  cardNumber?: string;
  cardExpiryDate?: string;
  cardCvv?: string;
}

export interface AccountWithTransactions extends Account {
  transactions: Transaction[];
}

export interface AccountWithCards extends Account {
  cards: Card[];
}

// Verification step status
export type VerificationStepStatus = "completed" | "pending" | "locked";

// Verification step details
export interface VerificationStepDetails {
  number: number;
  name: string;
  amount: number;
  status: VerificationStepStatus;
  date?: Date;
}

// Transaction category
export type TransactionCategory = 
  | "deposit" 
  | "withdrawal" 
  | "transfer" 
  | "salary" 
  | "groceries" 
  | "transport" 
  | "housing" 
  | "utilities"
  | "other";

// Custom account types
export type AccountType = "current" | "savings" | "credit" | "investment" | "joint";

// Card types
export type CardType = "visa" | "mastercard";

// Transaction types
export type TransactionType = "deposit" | "withdrawal" | "transfer" | "payment" | "refund" | "fee";

// Transaction status
export type TransactionStatus = "completed" | "pending" | "failed";

// User roles
export type UserRole = "client" | "admin";

// User status
export type UserStatus = "active" | "blocked" | "pending" | "verification";

// Email notification type
export type EmailNotificationType = "transaction" | "reminder" | "welcome" | "status";

export interface PaymentAccount {
  accountOwner: string;
  accountNumber: string;
  description?: string;
  stepNumber: number;
}
