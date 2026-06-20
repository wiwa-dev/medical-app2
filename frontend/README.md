# SIF Medical Software — Angular 20

Application de gestion médicale construite avec **Angular 20** (standalone components) + **Tailwind CSS** + **Chart.js**.

---

## ⚡ Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement
npm start
# → http://localhost:4200

# 3. Build production
npm run build
# → dist/sif-medical/
```

---

## 🏗️ Architecture

```
src/app/
├── core/
│   ├── models/
│   │   ├── patient.model.ts       # Interface Patient
│   │   ├── document.model.ts      # Interfaces Document / Template
│   │   └── toast.model.ts         # Interface Toast
│   └── services/
│       ├── patient.service.ts     # CRUD patients (signals)
│       ├── document.service.ts    # Gestion templates + génération
│       └── toast.service.ts       # Notifications globales
├── shared/
│   └── components/
│       ├── sidebar/               # Navigation latérale (desktop)
│       ├── mobile-nav/            # Navigation bottom (mobile)
│       ├── header/                # Header sticky par page
│       └── toast/                 # Notifications toast
└── pages/
    ├── dashboard/                 # KPIs + Chart.js
    ├── patients/                  # Liste + recherche
    ├── new-patient/               # Formulaire réactif
    ├── documents/                 # Upload templates + génération
    ├── document-preview/          # Aperçu + export
    └── settings/                  # Profil + sécurité + notifications
```

---

## 🦺 Intégration Wails

```bash
# Build pour Wails (output vers frontend/dist)
npm run build:wails
```

Dans `wails.json` :
```json
{
  "frontend": {
    "dir": "./frontend",
    "install": "npm install",
    "build": "npm run build",
    "dev": "npm start",
    "devUrl": "http://localhost:4200"
  }
}
```

Structure Wails recommandée :
```
mon-projet-wails/
├── frontend/          ← ce dossier Angular
│   ├── src/
│   ├── package.json
│   └── angular.json
├── main.go
└── wails.json
```

---

## 🛠️ Stack technique

| Outil              | Version  | Rôle                          |
|--------------------|----------|-------------------------------|
| Angular            | ^20.0.0  | Framework principal           |
| Tailwind CSS       | ^3.4.0   | Styling utilitaire            |
| Chart.js           | ^4.4.1   | Graphiques dashboard          |
| Angular Signals    | built-in  | State management réactif      |
| Angular Router     | built-in  | Lazy-loaded routes            |
| Reactive Forms     | built-in  | Formulaires typés             |

---

## 📦 Fonctionnalités

- **Dashboard** — KPIs temps réel, graphique donut (répartition docs), graphique barres (activité hebdo)
- **Patients** — Liste, recherche, ajout, suppression
- **Nouveau patient** — Formulaire réactif avec validation
- **Documents** — Upload templates Word, génération conditionnelle par type
- **Aperçu document** — Preview imprimable, export Word/Excel
- **Paramètres** — Profil médecin, sécurité, notifications
- **Toasts** — Notifications globales via service injectable
- **Responsive** — Sidebar desktop + navigation bottom mobile
- **Print-ready** — Classes `no-print` pour l'impression propre
