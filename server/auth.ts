import { Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import createMemoryStore from "memorystore";
import { sendEmailByType } from "./email";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Générer un ID client
export function generateClientId(): string {
  // Format: CN-XXXX-XXXX où X est un chiffre aléatoire
  return `CN-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Générer un RIB
export function generateRIB(): string {
  // Format: FR76 XXXX XXXX XXXX XXXX XXX
  return `FR76 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(100 + Math.random() * 900)}`;
}

// Générer un numéro de carte
export function generateCardNumber(): string {
  return `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
}

// Générer une date d'expiration
export function generateExpiryDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String((now.getFullYear() + 4) % 100).padStart(2, '0');
  return `${month}/${year}`;
}

// Générer un CVV
export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

// Générer un mot de passe sécurisé
export function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Password hashing and verification
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Vérifier si le mot de passe stocké a le format attendu
  if (!stored || !stored.includes('.')) {
    console.error('Format de mot de passe stocké invalide:', stored);
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  
  if (!hashed || !salt) {
    console.error('Hash ou sel manquant dans le mot de passe stocké');
    return false;
  }
  
  console.log(`Comparing password: supplied=${supplied}, salt=${salt}`);
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  const result = timingSafeEqual(hashedBuf, suppliedBuf);
  console.log(`Password comparison result: ${result}`);
  
  return result;
}

export function setupAuth(app: Express) {
  // Setup session
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET || "euronova-session-secret-key-for-development";
  
  console.log("Setting up auth with session store...");
  
  const sessionSettings: session.SessionOptions = {
    name: 'euronova.sid', // Nom personnalisé du cookie pour plus de sécurité
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    }),
    cookie: { 
      secure: false, // Désactivé même en production pour les tests
      sameSite: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup passport strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        
        // Vérifier si le compte est explicitement désactivé
        if (user.isActive === false) {
          return done(null, false, { message: "Account is inactive or blocked." });
        }
        
        if (await comparePasswords(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect password." });
        }
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const { 
        username: providedUsername, 
        password: providedPassword, 
        email, 
        firstName, 
        lastName, 
        role = "client" 
      } = req.body;
      
      // Générer un ID client unique
      const clientId = generateClientId();
      // Utiliser l'ID fourni ou l'ID client généré comme username
      const username = providedUsername || clientId;
      
      // Générer un mot de passe sécurisé si c'est un client et qu'aucun mot de passe n'est fourni
      let password = providedPassword;
      let generatedPassword = null;
      
      if (role === "client" && !providedPassword) {
        generatedPassword = generateSecurePassword();
        password = generatedPassword;
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        role,
        isActive: true
      });
      
      // Informations pour l'email
      let accountNumber = "";
      let cardNumber = "";
      let cardExpiryDate = "";
      let cardCvv = "";
      
      // Create default account for the user if it's a client
      if (role === "client") {
        // Générer un RIB
        accountNumber = generateRIB();
        
        const account = await storage.createAccount({
          userId: user.id,
          accountNumber,
          accountType: "current",
          balance: 0,
          currency: "EUR",
          isActive: true
        });
        
        // Create default card for the account
        cardNumber = generateCardNumber();
        cardExpiryDate = generateExpiryDate();
        cardCvv = generateCVV();
        
        await storage.createCard({
          userId: user.id,
          accountId: account.id,
          cardNumber,
          cardType: "visa",
          cardholderName: `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`,
          expiryDate: cardExpiryDate,
          cvv: cardCvv,
          isVirtual: false,
          isActive: true
        });
        
        // Create default verification step for the user
        await storage.createVerificationStep({
          userId: user.id,
          step1Completed: false,
          step1Amount: 100, // Montant par défaut pour l'étape 1
          step2Completed: false,
          step2Amount: 150, // Montant par défaut pour l'étape 2
          step3Completed: false,
          step3Amount: 200, // Montant par défaut pour l'étape 3
          step4Completed: false,
          step4Amount: 250, // Montant par défaut pour l'étape 4
          step5Completed: false,
          step5Amount: 300, // Montant par défaut pour l'étape 5
        });
        
        // Envoyer un email avec les informations d'identification générées
        try {
          console.log(`Tentative d'envoi d'email à ${user.email} pour l'utilisateur ${user.username}`);
          
          const emailResult = await sendEmailByType("welcome", user, {
            accountNumber,
            clientId,
            password: generatedPassword,
            cardNumber,
            cardExpiryDate,
            cardCvv
          });
          
          if (emailResult) {
            console.log(`✅ Credentials email sent successfully to ${user.email}`);
          } else {
            console.error(`❌ Failed to send credentials email to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`❌ Error sending credentials email to ${user.email}:`, emailError);
        }
        
        // Créer une notification pour l'utilisateur
        try {
          await storage.createNotification({
            userId: user.id,
            title: "Bienvenue chez EuroNova",
            type: "welcome",
            message: "Votre compte a été créé avec succès. Vérifiez votre email pour vos informations d'identification.",
            isRead: false
          });
        } catch (notifError) {
          console.error("Error creating welcome notification:", notifError);
        }
      }
      
      // Auto login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        // If credentials were generated, include them in the response for administrators to see
        if (role === "admin" && generatedPassword) {
          userResponse.generatedCredentials = {
            accountNumber,
            clientId,
            password: generatedPassword,
            cardNumber,
            cardExpiryDate,
            cardCvv
          };
        }
        
        return res.status(201).json(userResponse);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error during registration" });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    let { username, password } = req.body;
    console.log("Login attempt for:", username);
    
    // Si l'utilisateur tente de se connecter avec un email, essayons de trouver le username correspondant
    if (username.includes('@')) {
      try {
        const userByEmail = await storage.getUserByEmail(username);
        if (userByEmail) {
          console.log(`Found user by email: ${username} -> username: ${userByEmail.username}`);
          username = userByEmail.username;
        }
      } catch (error) {
        console.error("Error finding user by email:", error);
      }
    }
    
    // Si l'utilisateur tente de se connecter avec un ID client formaté comme BRV-0003
    // que nous devons convertir au format CN-XXXX-XXXX
    if (username.startsWith('BRV-')) {
      try {
        // Extraire l'ID numérique et trouver l'utilisateur
        const userId = parseInt(username.replace('BRV-', ''));
        if (!isNaN(userId)) {
          const user = await storage.getUser(userId);
          if (user) {
            console.log(`Found user by BRV ID: ${username} -> username: ${user.username}`);
            username = user.username;
          }
        }
      } catch (error) {
        console.error("Error finding user by BRV ID:", error);
      }
    }
    
    // Procéder à l'authentification standard avec le nom d'utilisateur (potentiellement résolu)
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      console.log("User authenticated:", user.username, "with role:", user.role);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return next(err);
        }
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        console.log("Login successful for:", user.username);
        return res.status(200).json(userResponse);
      });
    })({ ...req, body: { username, password } }, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      
      res.status(200).json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - isAuthenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("User data:", req.user);
    
    // Remove password from response
    const userResponse = { ...req.user };
    delete userResponse.password;
    
    console.log("Sending user data:", userResponse);
    res.status(200).json(userResponse);
  });

  return app;
}
