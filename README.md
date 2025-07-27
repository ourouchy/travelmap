# TravelMap

TravelMap est une application web de suivi de voyage gamifiée, développée dans le cadre d'un projet universitaire (L2 Informatique, Paris 8). Elle permet aux utilisateurs de documenter leurs voyages sur une carte interactive, de contribuer du contenu (activités, quiz), et de gagner des points pour encourager l'exploration culturelle.

## État actuel du projet

### Backend - FONCTIONNEL
- **API REST complète** avec Django REST Framework
- **Authentification JWT** (inscription, connexion, tokens)
- **Modèles de base** : Pays, Lieu, Voyage, Favori
- **Endpoints CRUD** pour voyages et favoris
- **Recherche globale** dans lieux et pays
- **Statistiques utilisateur** (lieux visités, score, etc.)
- **Validation et permissions** complètes

### Frontend - À DÉVELOPPER
- **Architecture React + Vite** prête
- **Documentation d'intégration** complète
- **Hooks et composants** d'exemple fournis
- **Interface utilisateur** à implémenter

### Documentation - COMPLÈTE
- **Architecture des modèles** (`docs/models.md`)
- **Endpoints API** (`docs/api_endpoints.md`)
- **Flux utilisateur** (`docs/user_flow.md`)
- **Guide d'intégration frontend** (`docs/frontend_integration.md`)
- **Authentification JWT** (`docs/auth.md`)

## Structure du projet

```
travelmap/
├── travelmap_backend/      # Projet Django principal
├── places/                # App Django (modèles, API)
│   ├── models.py         # Modèles: Pays, Lieu, Voyage, Favori
│   ├── views.py          # ViewSets et vues personnalisées
│   ├── urls.py           # Configuration des routes
│   └── serializers.py    # Sérialisation JSON
├── travelmap-frontend/    # Frontend React (Vite)
├── docs/                 # Documentation complète
│   ├── models.md         # Architecture des modèles
│   ├── api_endpoints.md  # Endpoints API
│   ├── user_flow.md      # État fonctionnel
│   ├── frontend_integration.md # Guide appelle d'api frontend 
│   └── auth.md           # Authentification
├── manage.py             # Entrée Django
├── requirements.txt      # Dépendances Python
├── venv/                 # Environnement virtuel (non versionné)
├── .gitignore           # Fichiers à ignorer
└── README.md            # Ce fichier
```

## Installation et lancement

### 1. Cloner le dépôt
```bash
git clone https://github.com/ourouchy/travelmap
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
- Assure-toi que PostgreSQL est installé
- Crée une base `travelmapdb` et un utilisateur `travelmapuser`
- Mets à jour le mot de passe dans `travelmap_backend/settings.py` si besoin

#### d) Appliquer les migrations
```bash
python manage.py migrate
```

#### e) Lancer le serveur
```bash
python manage.py runserver
```

L'API sera accessible sur `http://localhost:8000/api/`

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

L'interface sera accessible sur `http://localhost:5173`

## Documentation

### Pour comprendre l'architecture
- [`docs/models.md`](docs/models.md) - Modèles de données et relations

### Pour utiliser l'API
- [`docs/api_endpoints.md`](docs/api_endpoints.md) - Tous les endpoints disponibles
- [`docs/auth.md`](docs/auth.md) - Authentification JWT

### Pour développer le frontend
- [`docs/frontend_integration.md`](docs/frontend_integration.md) - Guide complet d'intégration
- [`docs/user_flow.md`](docs/user_flow.md) - État des fonctionnalités

## Fonctionnalités disponibles

### Implémentées
- **Authentification** : Inscription, connexion, JWT
- **Gestion des lieux** : Liste, recherche, détails
- **Gestion des voyages** : CRUD complet (utilisateur connecté)
- **Gestion des favoris** : Ajouter/supprimer des lieux favoris
- **Recherche globale** : Lieux et pays
- **Statistiques utilisateur** : Dashboard personnel
- **API REST** : Endpoints documentés et testés

### À implémenter (Phase 2)
- **Activités** : Créer/consulter des activités par lieu
- **Quizz** : Système de quiz et apprentissage
- **Médias** : Photos/vidéos dans les voyages
- **Score avancé** : Gamification et classements
- **Intégration GeoNames** : Auto-complétion des lieux

## Tester l'API

### Test de connexion
```bash
curl http://localhost:8000/api/ping/
# Réponse: {"message": "pong"}
```

### Inscription d'un utilisateur
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "email": "test@example.com",
    "password": "password123",
    "password2": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Recherche de lieux
```bash
curl "http://localhost:8000/api/search/?q=Paris"
```

## Développement

### Pour les développeurs backend
- Les modèles sont dans `places/models.py`
- Les ViewSets dans `places/views.py`
- Les sérialiseurs dans `places/serializers.py`
- Documentation complète dans `docs/`

### Pour les développeurs frontend
- Guide d'intégration complet dans `docs/frontend_integration.md`
- Hooks React et composants d'exemple fournis
- Gestion d'erreurs et authentification documentées

### Conventions utilisées
- **ViewSets** : Endpoints avec paramètre `{id}` (convention DRF)
- **Vues personnalisées** : Endpoints avec paramètres spécifiques (ex: `{lieu_id}`)
- **Permissions** : `AllowAny` pour données publiques, `IsAuthenticated` pour données privées

## Notes importantes

- Lieu c'est juste Ville pour pas de confustion

## Auteurs

Projet réalisé par une équipe de 4 étudiants L2 Informatique, Paris 8.

---

**Le projet est prêt pour le développement frontend ! Consultez la documentation dans `docs/` pour commencer.** 
