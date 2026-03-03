# Amarillo DSI Profile™

Plateforme d'évaluation comportementale en ligne pour Directeurs des Systèmes d'Information (DSI). Conçue par **Amarillo Search**, elle cartographie les compétences managériales des dirigeants IT à travers des mises en situation professionnelles (Situational Judgment Test).

## Aperçu

Le DSI Profile™ évalue **12 dimensions** regroupées en **3 piliers** :

| Pilier | Dimensions |
|---|---|
| **Leadership & Influence** | Vision Stratégique IT, Leadership d'Équipe, Conduite du Changement, Influence COMEX |
| **Excellence Opérationnelle** | Pilotage Budgétaire & ROI, Gestion des Risques & Cyber, Maîtrise de la Complexité, Orientation Résultats |
| **Innovation & Posture** | Innovation & Veille Tech, Orientation Client/Métier, Résilience & Gestion du Stress, Agilité & Adaptabilité |

Le candidat est classé parmi **8 profils archétypaux** (DSI Visionnaire, Stratège-Opérationnel, Innovateur-Pragmatique, Leader d'Influence, Bâtisseur, Explorateur, en Développement, Émergent).

## Fonctionnalités

- **Interface Admin** : création de sessions, choix du format (court ~17 min / standard ~24 min), suivi en temps réel, envoi d'invitations par email
- **Interface Candidat** : accès par code unique (AMA-XXXX), questions en choix forcé ipsatif (classement de 4 options), reprise possible à tout moment
- **Résultats** : scores par dimension et par pilier, profil archétypal, indicateurs de fiabilité (cohérence interne + désirabilité sociale)
- **Export PDF** : génération de rapports détaillés avec méthodologie
- **Envoi par email** : envoi automatique des résultats via Resend
- **Backup** : sauvegarde automatique quotidienne sur Google Drive + backup local

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | React 19, Vite 7 |
| Hébergement | Netlify |
| Stockage | JSONBin.io |
| Emails | Resend (Netlify Function) |
| Backup | Google Drive API (Netlify Scheduled Function) |
| PDF | html2pdf.js |

## Méthodologie

L'évaluation s'appuie sur :
- **Competing Values Framework** (Quinn & Rohrbaugh, 1983)
- **Leadership transformationnel** (Bass & Avolio, 1994)
- **Modèles de maturité IT** (COBIT 2019, CMMI)

Le scoring utilise une pondération par rang (1er : 1.0 / 2e : 0.66 / 3e : 0.33 / 4e : 0.0) avec une calibration non linéaire pour résister au gaming. Deux indicateurs de fiabilité sont intégrés : un indice de cohérence (questions miroir) et une échelle de désirabilité sociale.

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd amarillo-dsi-profile

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Renseigner VITE_JSONBIN_MASTER_KEY, VITE_JSONBIN_BIN_ID, VITE_ADMIN_PASSWORD

# Lancer le serveur de développement
npm run dev
```

## Variables d'environnement

| Variable | Description | Obligatoire |
|---|---|---|
| `VITE_JSONBIN_MASTER_KEY` | Clé master JSONBin.io | Oui |
| `VITE_JSONBIN_BIN_ID` | ID du bin JSONBin.io | Oui |
| `VITE_ADMIN_PASSWORD` | Mot de passe admin | Oui |
| `RESEND_API_KEY` | Clé API Resend (emails) | Netlify uniquement |
| `GOOGLE_CLIENT_ID` | OAuth Google (backup Drive) | Optionnel |
| `GOOGLE_CLIENT_SECRET` | OAuth Google (backup Drive) | Optionnel |
| `GOOGLE_REFRESH_TOKEN` | OAuth Google (backup Drive) | Optionnel |
| `GOOGLE_DRIVE_FOLDER_ID` | Dossier cible Google Drive | Optionnel |

## Scripts

```bash
npm run dev      # Serveur de développement (Vite)
npm run build    # Build de production
npm run preview  # Preview du build
npm run lint     # Vérification ESLint
```

## Déploiement

Le projet est configuré pour un déploiement sur **Netlify** :

- Build command : `npm run build`
- Publish directory : `dist`
- Netlify Functions : `netlify/functions`
- Backup automatique : scheduled function quotidienne (3h UTC)

Les variables d'environnement doivent être configurées dans le dashboard Netlify.

## Structure du projet

```
amarillo-dsi-profile/
├── src/
│   ├── App.jsx                 # Application principale (Admin + Candidat + Résultats)
│   ├── main.jsx                # Point d'entrée React
│   ├── index.css               # Styles globaux + mode PDF
│   ├── backup.js               # Logique de backup Google Drive
│   └── assessments/
│       ├── index.js            # Registre des assessments
│       ├── dsi.js              # Configuration DSI Profile™ (dimensions, questions, profils)
│       └── methodology.js      # Méthodologie commune
├── netlify/
│   └── functions/
│       ├── store.mjs           # API stockage JSONBin
│       ├── send-email.js       # Envoi d'emails via Resend
│       ├── scheduled-backup.js # Backup quotidien Google Drive
│       └── backup-status.js    # Statut du backup
├── public/                     # Assets statiques (favicons, logos)
├── index.html                  # Page HTML racine
├── vite.config.js              # Configuration Vite
├── netlify.toml                # Configuration Netlify
└── package.json
```

## Architecture multi-assessment

Le projet est conçu pour supporter plusieurs types d'assessments. Le registre `src/assessments/index.js` permet d'ajouter de nouveaux types d'évaluation en créant un fichier de configuration sur le modèle de `dsi.js`.

## Licence

Projet propriétaire — Amarillo Search. Tous droits réservés.
