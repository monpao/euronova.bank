import { nanoid } from "nanoid";
import {
  User, InsertUser,
  Account, InsertAccount,
  Card, InsertCard,
  Transaction, InsertTransaction,
  VerificationStep, InsertVerificationStep,
  Notification, InsertNotification,
  SystemSetting, InsertSystemSetting
} from "@shared/schema";
import { AccountType, CardType, TransactionType, PaymentAccount } from "@shared/types";
import { hashPassword } from "./auth";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Account operations
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByNumber(accountNumber: string): Promise<Account | undefined>;
  getAccountsByUserId(userId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<Account>): Promise<Account | undefined>;
  
  // Card operations
  getCard(id: number): Promise<Card | undefined>;
  getCardsByAccountId(accountId: number): Promise<Card[]>;
  getCardsByUserId(userId: number): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, data: Partial<Card>): Promise<Card | undefined>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByAccountId(accountId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Verification steps operations
  getVerificationStep(id: number): Promise<VerificationStep | undefined>;
  getVerificationStepByUserId(userId: number): Promise<VerificationStep | undefined>;
  createVerificationStep(step: InsertVerificationStep): Promise<VerificationStep>;
  updateVerificationStep(id: number, data: Partial<VerificationStep>): Promise<VerificationStep | undefined>;
  
  // Notification operations
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // System Settings operations
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: string, userId?: number): Promise<SystemSetting | undefined>;
  
  // Payment Account operations
  getPaymentAccountForStep(stepNumber: number): Promise<PaymentAccount | undefined>;
  updatePaymentAccountForStep(stepNumber: number, data: PaymentAccount): Promise<PaymentAccount>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private cards: Map<number, Card>;
  private transactions: Map<number, Transaction>;
  private verificationSteps: Map<number, VerificationStep>;
  private notifications: Map<number, Notification>;
  private systemSettings: Map<string, SystemSetting>;
  private currentId: { [key: string]: number };

  constructor() {
    // Use persistent storage for memory database between server restarts
    this.users = global.users || new Map();
    this.accounts = global.accounts || new Map();
    this.cards = global.cards || new Map();
    this.transactions = global.transactions || new Map();
    this.verificationSteps = global.verificationSteps || new Map();
    this.notifications = global.notifications || new Map();
    this.systemSettings = global.systemSettings || new Map();
    
    // Store maps in global for persistence between hot reloads
    global.users = this.users;
    global.accounts = this.accounts;
    global.cards = this.cards;
    global.transactions = this.transactions;
    global.verificationSteps = this.verificationSteps;
    global.notifications = this.notifications;
    global.systemSettings = this.systemSettings;
    
    this.currentId = global.currentId || {
      users: 1,
      accounts: 1,
      cards: 1,
      transactions: 1,
      verificationSteps: 1,
      notifications: 1,
      systemSettings: 1
    };
    
    // Store currentId in global for persistence
    global.currentId = this.currentId;
    
    // Créer un utilisateur admin par défaut s'il n'existe pas déjà
    this.createDefaultUsers();
  }
  
  private async createDefaultUsers() {
    try {
      // Admin user
      const adminExists = await this.getUserByUsername('admin');
      if (!adminExists) {
        // Créer l'admin directement avec un mot de passe haché manuellement
        // Note: Pour un environnement de production, il faudrait un mot de passe plus fort
        // Mot de passe: admin123
        // Nous allons créer un nouveau hash pour être sûrs que c'est correct
        const hashedAdminPassword = await hashPassword('admin123');
        const admin = {
          id: this.currentId.users++,
          username: 'admin',
          password: hashedAdminPassword,
          email: 'admin@euronova.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin', // Rôle admin pour les opérations administratives
          isActive: true,
          createdAt: new Date(),
          phone: null,
          address: null,
          dateOfBirth: null,
          idType: null,
          idNumber: null,
          profileImage: null
        };
        this.users.set(admin.id, admin);
        console.log("Admin created with ID:", admin.id);
      }
      
      // Client user
      const clientExists = await this.getUserByUsername('client1');
      if (!clientExists) {
        // Créer le client avec un mot de passe haché manuellement
        const hashedClientPassword = 'c1507c63632cea7bf18c26c82e06f80f9db75f7a904000682be5ef986ae603d45c6db08a11c3ccc5d77e5b58d93773fea4ce1913b5a20ff20ed20e817b6109bd.0037633161e6948c5dac494581ea7e9b';
        const client = {
          id: this.currentId.users++,
          username: 'client1',
          password: hashedClientPassword,
          email: 'client1@example.com',
          firstName: 'Client',
          lastName: 'One',
          role: 'client',
          isActive: true,
          createdAt: new Date(),
          phone: null,
          address: null,
          dateOfBirth: null,
          idType: null,
          idNumber: null,
          profileImage: null
        };
        this.users.set(client.id, client);
        console.log("Client created with ID:", client.id);
        
        // Créer un compte par défaut pour le client
        const account = {
          id: this.currentId.accounts++,
          userId: client.id,
          accountNumber: this.generateAccountNumber(),
          accountType: 'current' as AccountType,
          balance: 1000, // Solde initial pour faciliter les tests
          currency: 'EUR',
          isActive: true,
          createdAt: new Date()
        };
        this.accounts.set(account.id, account);
        
        // Créer une carte pour le compte
        const card = {
          id: this.currentId.cards++,
          userId: client.id,
          accountId: account.id,
          cardNumber: this.generateCardNumber(),
          cardType: 'visa' as CardType,
          cardholderName: `${client.firstName.toUpperCase()} ${client.lastName.toUpperCase()}`,
          expiryDate: this.generateExpiryDate(),
          cvv: this.generateCVV(),
          isVirtual: false,
          isActive: true,
          createdAt: new Date()
        };
        this.cards.set(card.id, card);
        
        // Créer une étape de vérification pour le client
        const verificationStep = {
          id: this.currentId.verificationSteps++,
          userId: client.id,
          transactionId: null,
          step1Completed: false,
          step1Amount: 75,
          step1Date: null,
          step2Completed: false,
          step2Amount: 150,
          step2Date: null,
          step3Completed: false,
          step3Amount: 225,
          step3Date: null,
          step4Completed: false,
          step4Amount: 180,
          step4Date: null,
          step5Completed: false,
          step5Amount: 95,
          step5Date: null,
          notes: null,
          createdAt: new Date()
        };
        this.verificationSteps.set(verificationStep.id, verificationStep);
      }
    } catch (error) {
      console.error("Error creating default users:", error);
    }
  }

  // Helper functions
  private generateAccountNumber(): string {
    return `FR76 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(100 + Math.random() * 900)}`;
  }

  private generateCardNumber(): string {
    return `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private generateExpiryDate(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String((now.getFullYear() + 4) % 100).padStart(2, '0');
    return `${month}/${year}`;
  }

  private generateCVV(): string {
    return String(Math.floor(100 + Math.random() * 900));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { ...userData, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Account operations
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountByNumber(accountNumber: string): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(
      account => account.accountNumber === accountNumber
    );
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      account => account.userId === userId
    );
  }

  async createAccount(accountData: InsertAccount): Promise<Account> {
    const id = this.currentId.accounts++;
    const now = new Date();
    const accountNumber = accountData.accountNumber || this.generateAccountNumber();
    
    const account: Account = { 
      ...accountData, 
      id, 
      accountNumber, 
      createdAt: now 
    };
    
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, data: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount: Account = { ...account, ...data };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  // Card operations
  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getCardsByAccountId(accountId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      card => card.accountId === accountId
    );
  }

  async getCardsByUserId(userId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(
      card => card.userId === userId
    );
  }

  async createCard(cardData: InsertCard): Promise<Card> {
    const id = this.currentId.cards++;
    const now = new Date();
    const cardNumber = cardData.cardNumber || this.generateCardNumber();
    const expiryDate = cardData.expiryDate || this.generateExpiryDate();
    const cvv = cardData.cvv || this.generateCVV();
    
    const card: Card = { 
      ...cardData, 
      id, 
      cardNumber, 
      expiryDate, 
      cvv, 
      createdAt: now 
    };
    
    this.cards.set(id, card);
    return card;
  }

  async updateCard(id: number, data: Partial<Card>): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;
    
    const updatedCard: Card = { ...card, ...data };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
    console.log(`Recherche des transactions pour le compte ${accountId}, il y a ${this.transactions.size} transactions au total`);
    
    const transactions = Array.from(this.transactions.values()).filter(
      tx => {
        const isFromAccount = tx.fromAccountId === accountId;
        const isToAccount = tx.toAccountId === accountId;
        if (isFromAccount || isToAccount) {
          console.log(`Transaction trouvée: ID=${tx.id}, Type=${tx.type}, Montant=${tx.amount}, De=${tx.fromAccountId}, Vers=${tx.toAccountId}`);
        }
        return isFromAccount || isToAccount;
      }
    );
    
    console.log(`${transactions.length} transactions trouvées pour le compte ${accountId}`);
    
    // Trier les transactions par date (les plus récentes en premier)
    return transactions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = this.currentId.transactions++;
    const now = new Date();
    
    const transaction: Transaction = { 
      ...transactionData, 
      id, 
      createdAt: now 
    };
    
    this.transactions.set(id, transaction);
    
    // Update account balances
    if (transaction.fromAccountId) {
      const fromAccount = await this.getAccount(transaction.fromAccountId);
      if (fromAccount) {
        await this.updateAccount(fromAccount.id, {
          balance: fromAccount.balance - transaction.amount
        });
      }
    }
    
    if (transaction.toAccountId) {
      const toAccount = await this.getAccount(transaction.toAccountId);
      if (toAccount) {
        await this.updateAccount(toAccount.id, {
          balance: toAccount.balance + transaction.amount
        });
      }
    }
    
    return transaction;
  }

  // Verification steps operations
  async getVerificationStep(id: number): Promise<VerificationStep | undefined> {
    return this.verificationSteps.get(id);
  }

  async getVerificationStepByUserId(userId: number): Promise<VerificationStep | undefined> {
    return Array.from(this.verificationSteps.values()).find(
      step => step.userId === userId
    );
  }

  async createVerificationStep(stepData: InsertVerificationStep): Promise<VerificationStep> {
    const id = this.currentId.verificationSteps++;
    const now = new Date();
    
    const step: VerificationStep = { 
      ...stepData, 
      id, 
      createdAt: now 
    };
    
    this.verificationSteps.set(id, step);
    return step;
  }

  async updateVerificationStep(id: number, data: Partial<VerificationStep>): Promise<VerificationStep | undefined> {
    const step = this.verificationSteps.get(id);
    if (!step) return undefined;
    
    const updatedStep: VerificationStep = { ...step, ...data };
    this.verificationSteps.set(id, updatedStep);
    return updatedStep;
  }

  // Notification operations
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.currentId.notifications++;
    const now = new Date();
    
    const notification: Notification = { 
      ...notificationData, 
      id, 
      createdAt: now 
    };
    
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: Notification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Payment Account operations
  private paymentAccounts: Map<number, PaymentAccount> = new Map();

  async getPaymentAccountForStep(stepNumber: number): Promise<PaymentAccount | undefined> {
    return this.paymentAccounts.get(stepNumber);
  }

  async updatePaymentAccountForStep(stepNumber: number, data: PaymentAccount): Promise<PaymentAccount> {
    this.paymentAccounts.set(stepNumber, data);
    return data;
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    return Array.from(this.systemSettings.values()).find(
      setting => setting.settingKey === key
    );
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values());
  }

  async createSystemSetting(settingData: InsertSystemSetting): Promise<SystemSetting> {
    const id = this.currentId.systemSettings++;
    const now = new Date();
    
    const setting: SystemSetting = { 
      ...settingData, 
      id, 
      updatedAt: now 
    };
    
    this.systemSettings.set(setting.settingKey, setting);
    return setting;
  }

  async updateSystemSetting(key: string, value: string, userId?: number): Promise<SystemSetting | undefined> {
    const setting = Array.from(this.systemSettings.values()).find(s => s.settingKey === key);
    if (!setting) return undefined;
    
    const now = new Date();
    const updatedSetting: SystemSetting = { 
      ...setting, 
      settingValue: value,
      updatedAt: now,
      updatedBy: userId
    };
    
    this.systemSettings.set(key, updatedSetting);
    return updatedSetting;
  }
}

export const storage = new MemStorage();
