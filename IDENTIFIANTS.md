# 🔐 Identifiants de Test - EuroNova Banking

## 👨‍💼 Compte Administrateur

### Accès complet au panel d'administration
- **Identifiant** : `admin`
- **Mot de passe** : `admin123`
- **Email** : `admin@euronova.com`
- **Rôle** : Administrateur système

**Fonctionnalités disponibles :**
- Gestion complète des clients
- Validation des étapes de vérification
- Suivi des transactions et virements
- Génération de rapports
- Configuration système
- Gestion des cartes bancaires
- Support client

---

## 👤 Compte Client de Test

### Accès à l'interface client bancaire
- **Identifiant** : `client1`
- **Mot de passe** : `client123`
- **Email** : `client1@example.com`
- **Nom** : Client One
- **Statut** : Actif

**Informations bancaires :**
- **Numéro de compte** : `BRV-0002`
- **Solde initial** : `€2,500.00`
- **Carte bancaire** : `4532 1234 5678 9012`
- **Date d'expiration** : `12/27`
- **CVV** : `123`

**Fonctionnalités disponibles :**
- Tableau de bord personnel
- Consultation des comptes
- Historique des transactions
- Gestion des virements
- Processus de vérification en 5 étapes
- Notifications email automatiques
- Interface multilingue

---

## 🌍 Test des Langues

L'application supporte 11 langues. Vous pouvez tester le changement de langue via le sélecteur en haut à droite :

1. 🇫🇷 **Français** (par défaut)
2. 🇬🇧 **English**
3. 🇪🇸 **Español**
4. 🇩🇪 **Deutsch**
5. 🇮🇹 **Italiano**
6. 🇸🇦 **العربية**
7. 🇨🇳 **中文**
8. 🇷🇺 **Русский**
9. 🇧🇷 **Português**
10. 🇯🇵 **日本語**
11. 🇰🇷 **한국어**

---

## 📧 Test des Emails

Le système d'envoi d'emails est configuré avec Brevo. Les emails sont automatiquement traduits selon la langue préférée de l'utilisateur.

**Types d'emails testables :**
- Email de bienvenue avec identifiants
- Notifications de transactions
- Rappels de paiement pour les étapes de vérification
- Notifications de changement de statut de compte

---

## 🔄 Processus de Vérification

Le client de test peut tester le processus de vérification en 5 étapes :

1. **Étape 1** : Frais d'enregistrement de crédit (€150)
2. **Étape 2** : Frais de virement international (€200)
3. **Étape 3** : Frais de justice (€300)
4. **Étape 4** : Frais d'assurance (€250)
5. **Étape 5** : Frais d'autorisation de décaissement (€400)

---

## 🚀 URLs d'Accès

- **Page d'accueil** : `/`
- **Connexion** : `/auth`
- **Dashboard Admin** : `/admin` (après connexion admin)
- **Dashboard Client** : `/client` (après connexion client)

---

## ⚠️ Notes Importantes

1. **Base de données** : Configurée avec PostgreSQL (Neon)
2. **Emails** : Système configuré avec Brevo API
3. **Sécurité** : Tous les mots de passe sont hashés avec bcrypt
4. **Sessions** : Authentification persistante avec sessions sécurisées
5. **Responsive** : Interface optimisée pour mobile et desktop

---

## 🛠️ Pour les Tests

1. **Connexion Admin** : Utilisez `admin` / `admin123` pour accéder au panel d'administration
2. **Connexion Client** : Utilisez `client1` / `client123` pour l'interface client
3. **Test Multilingue** : Changez la langue via le sélecteur en haut à droite
4. **Test Emails** : Les emails sont envoyés automatiquement lors des actions (simulation si pas de clé API)
5. **Test Responsive** : Redimensionnez la fenêtre ou utilisez les outils de développement

---

**Bon test ! 🎉**

