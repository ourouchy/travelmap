# TravelMap

TravelMap est une application web de suivi de voyage gamifiée, développée dans le cadre d’un projet universitaire (L2 Informatique, Paris 8). Elle permet aux utilisateurs de documenter leurs voyages sur une carte interactive, de contribuer du contenu (activités, quiz), et de gagner des points pour encourager l’exploration culturelle.

## État actuel du projet
- **Architecture full-stack** prête :
  - Backend Django + Django REST Framework
  - Frontend React + Vite
  - Base de données PostgreSQL
- **Connexion front/back opérationnelle** (testée via un endpoint `/api/ping/`)
- **Pas encore de modèles ou de logique métier** (prochaine étape)

## Structure du projet
```
travelmap/
├── travelmap_backend/      # Projet Django principal (config, routes, settings)
├── places/                # App Django (lieux, endpoints API)
├── travelmap-frontend/    # Frontend React (Vite)
├── manage.py              # Entrée Django
├── venv/                  # Environnement virtuel Python (non versionné)
├── .gitignore             # Fichiers/dossiers à ignorer
└── README.md              # Ce fichier
```

## Installation et lancement (Linux)

### 1. Cloner le dépôt
```bash
git clone <https://github.com/ourouchy/travelmap>
cd travelmap
```

### 2. Backend Django
#### a) Créer et activer un environnement virtuel
```bash
python3 -m venv venv
source venv/bin/activate
```
#### b) Installer les dépendances
```bash
pip install -r requirements.txt
```
#### c) Configurer la base de données
- Assure-toi que PostgreSQL est installé et qu’une base `travelmapdb` et un utilisateur `travelmapuser` existent.
- Mets à jour le mot de passe dans `travelmap_backend/settings.py` si besoin.
#### d) Appliquer les migrations
```bash
python manage.py migrate
```
#### e) Lancer le serveur
```bash
python manage.py runserver
```

### 3. Frontend React
#### a) Installer les dépendances
```bash
cd travelmap-frontend
npm install
```
#### b) Lancer le serveur de développement
```bash
npm run dev
```
- L’interface sera accessible sur `http://localhost:5173` (par défaut).

### 4. Tester la connexion front/back
- Clique sur le bouton **Ping Backend** dans l’interface React.
- Tu dois voir : `Réponse du backend : pong`

## Notes
- Le dossier `venv/` et les fichiers sensibles ne sont pas versionnés (voir `.gitignore`).
- Pour la production, pense à sécuriser les mots de passe et à utiliser des variables d’environnement.
- Prochaines étapes : création des modèles, endpoints REST, logique métier, etc.

## Auteurs
- Projet réalisé par une équipe de 4 étudiants L2 Informatique, Paris 8.

---

**N’hésite pas à contribuer ou à signaler des issues !** 