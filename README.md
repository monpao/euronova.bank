# EuroNova Banking - Application Bancaire Moderne

Une application bancaire complète avec interface multilingue, système de paiements sécurisés et gestion administrative avancée.

## 🚀 Fonctionnalités

- **Interface multilingue** : Support de 11 langues (FR, EN, ES, DE, IT, AR, ZH, RU, PT, JA, KO)
- **Système de paiements sécurisés** : Vérification en 5 étapes
- **Gestion des comptes** : Comptes multiples, cartes virtuelles et physiques
- **Notifications automatiques** : Emails multilingues avec Brevo
- **Interface d'administration** : Gestion complète des clients et transactions
- **Responsive design** : Compatible mobile et desktop

## 🛠️ Technologies

- **Frontend** : React, TypeScript, Tailwind CSS, Vite
- **Backend** : Node.js, Express, TypeScript
- **Base de données** : PostgreSQL avec Drizzle ORM
- **Emails** : Brevo API
- **Déploiement** : Vercel

## 📦 Installation

1. Cloner le repository
```bash
git clone <repository-url>
cd euronova-banking
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos configurations :
```env
DATABASE_URL=postgresql://user:password@host:port/database
BREVO_API_KEY=your_brevo_api_key
APP_URL=http://localhost:5000
NODE_ENV=development
```

4. Initialiser la base de données
```bash
npm run db:push
```

5. Démarrer l'application
```bash
npm run dev
```

## 🚀 Déploiement sur Vercel

1. Installer Vercel CLI
```bash
npm i -g vercel
```

2. Se connecter à Vercel
```bash
vercel login
```

3. Configurer les variables d'environnement sur Vercel
```bash
vercel env add DATABASE_URL
vercel env add BREVO_API_KEY
```

4. Déployer
```bash
vercel --prod
```

## 👥 Comptes de test

### Administrateur
- **Identifiant** : `admin`
- **Mot de passe** : `admin123`
- **Accès** : Panel d'administration complet

### Client de test
- **Identifiant** : `client1`
- **Mot de passe** : `client123`
- **Email** : `client1@example.com`
- **Accès** : Interface client avec fonctionnalités bancaires

## 📧 Configuration des emails

L'application utilise Brevo pour l'envoi d'emails automatiques :

1. Créer un compte sur [Brevo](https://www.brevo.com)
2. Générer une clé API
3. Ajouter la clé dans les variables d'environnement
4. Vérifier l'adresse email d'expédition dans Brevo

## 🌍 Langues supportées

- 🇫🇷 Français (par défaut)
- 🇬🇧 English
- 🇪🇸 Español
- 🇩🇪 Deutsch
- 🇮🇹 Italiano
- 🇸🇦 العربية
- 🇨🇳 中文
- 🇷🇺 Русский
- 🇧🇷 Português
- 🇯🇵 日本語
- 🇰🇷 한국어

## 🔧 Scripts disponibles

- `npm run dev` : Démarrer en mode développement
- `npm run build` : Construire pour la production
- `npm run db:push` : Synchroniser le schéma de base de données
- `npm run db:studio` : Ouvrir Drizzle Studio

## 📱 Fonctionnalités principales

### Pour les clients
- Tableau de bord avec vue d'ensemble des comptes
- Gestion des transactions et virements
- Système de vérification en 5 étapes
- Notifications email automatiques
- Interface multilingue

### Pour les administrateurs
- Gestion complète des clients
- Validation des étapes de vérification
- Suivi des transactions et virements
- Génération de rapports
- Configuration système

## 🔒 Sécurité

- Authentification sécurisée avec sessions
- Hashage des mots de passe avec bcrypt
- Validation des données côté serveur
- Protection CSRF
- Chiffrement des communications

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

© 2025 EuroNova Banking. Tous droits réservés.

