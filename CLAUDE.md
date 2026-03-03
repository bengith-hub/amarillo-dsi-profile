# Amarillo DSI Profile

Plateforme d'evaluation comportementale pour Directeurs des Systemes d'Information (DSI). Evalue 12 dimensions regroupees en 3 piliers (Leadership & Influence, Excellence Operationnelle, Innovation & Posture) via des tests de jugement situationnel (SJT).

## Commandes

- `npm run dev` — serveur de developpement (Vite)
- `npm run build` — build production (sortie dans `dist/`)
- `npm run lint` — linter ESLint
- `npm run preview` — preview du build de production

## Architecture

```
src/
  App.jsx              # Composant principal (interface multi-mode : candidat, admin, resultats)
  main.jsx             # Point d'entree React
  index.css            # Styles globaux et regles d'export PDF
  backup.js            # Integration Google Drive (OAuth2, upload/download, retry)
  assessments/
    index.js           # Registre des evaluations disponibles
    dsi.js             # Definition complete de l'evaluation DSI (dimensions, questions, scoring)
    methodology.js     # Cadre theorique partage (Competing Values Framework, SJT)
netlify/functions/
  store.mjs            # API Netlify Blobs (GET/PUT metadonnees backup)
  send-email.js        # Service email via Resend (invitations, resultats, notifications admin)
  scheduled-backup.js  # Backup automatique quotidien Google Drive (3h UTC, rotation 7 snapshots)
  backup-status.js     # Suivi du statut des backups
public/                # Assets statiques, favicons, logos
```

## Stack technique

- **Frontend** : React 19.2, Vite 7.2, JavaScript/JSX (pas de TypeScript)
- **Styling** : CSS vanilla
- **Backend** : Netlify Functions (serverless), Netlify Blobs
- **Services externes** : JSONBin.io (stockage donnees), Google Drive API (backups), Resend (emails)
- **Export** : html2pdf.js pour generation PDF des resultats
- **Auth** : Google Identity Services (GIS) OAuth2 pour backup Drive

## Conventions de code

- JavaScript/JSX avec modules ES (`"type": "module"`)
- ESLint 9 flat config : `no-unused-vars` avec exception pour constantes `^[A-Z_]`
- Pas de framework CSS, pas de TypeScript
- Les fonctions Netlify utilisent `.mjs` ou `.js` selon le besoin

## Variables d'environnement

Voir `.env.example` pour la liste complete. Cles requises :
- `VITE_JSONBIN_MASTER_KEY` / `VITE_JSONBIN_BIN_ID` — stockage JSONBin
- `VITE_ADMIN_PASSWORD` — acces admin
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` — OAuth Google Drive
- `RESEND_API_KEY` — service email
- `GOOGLE_DRIVE_FOLDER_ID` — optionnel, cree automatiquement si absent

## Deploiement

- Heberge sur **Netlify** (`amarillo-dsi-profile.netlify.app`)
- Build : `npm run build`, publish `dist/`
- Fonctions serverless dans `netlify/functions/`
- Backup automatique quotidien a 3h UTC via scheduled function (config dans `netlify.toml`)
