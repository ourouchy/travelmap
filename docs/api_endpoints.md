# API Endpoints - TravelMap

## Base URL
```
http://localhost:8000/api/
```

## Conventions DRF

### ViewSets vs Vues Personnalisées

**ViewSets (convention {id}) :**
- Utilisent la convention Django REST Framework standard
- Génèrent automatiquement les endpoints CRUD
- Paramètre d'URL : `{id}` ou `{pk}`
- Exemples : `/api/lieux/{id}/`, `/api/voyages/{id}/`

**Vues Personnalisées (convention spécifique) :**
- Endpoints créés manuellement
- Peuvent utiliser des noms de paramètres spécifiques
- Paramètre d'URL : nom personnalisé (ex: `{lieu_id}`)
- Exemples : `/api/lieux/{lieu_id}/detail/`

### Permissions

- **AllowAny** : Endpoint public, accessible sans authentification
- **IsAuthenticated** : Endpoint privé, nécessite un token JWT valide
- **Propriétaire** : L'utilisateur ne peut accéder qu'à ses propres données

## Authentification

### Inscription
- **URL** : `POST /api/auth/register/`
- **Content-Type** : `application/json`
- **Body** :
```json
{
    "username": "user@example.com",
    "email": "user@example.com",
    "password": "securepassword123",
    "password2": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
}
```
- **Réponse** (201) :
```json
{
    "user": {
        "id": 1,
        "username": "user@example.com",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
    },
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Connexion
- **URL** : `POST /api/auth/login/`
- **Content-Type** : `application/json`
- **Body** :
```json
{
    "username": "user@example.com",
    "password": "securepassword123"
}
```
- **Réponse** (200) : Même format que l'inscription

## Pays

### Liste des pays
- **URL** : `GET /api/pays/`
- **Permissions** : Aucune
- **Réponse** (200) :
```json
[
    {
        "code_iso": "FRA",
        "nom": "France"
    }
]
```

### Recherche de pays
- **URL** : `GET /api/pays/search/?q=France`
- **Permissions** : Aucune
- **Réponse** (200) : Liste des pays correspondants

## Lieux

### Liste des lieux
- **URL** : `GET /api/lieux/`
- **Permissions** : Aucune
- **Réponse** (200) :
```json
[
    {
        "id": "uuid",
        "nom_ville": "Paris",
        "pays": {
            "code_iso": "FRA",
            "nom": "France"
        },
        "latitude": "48.856600",
        "longitude": "2.352200"
    }
]
```

### Détails d'un lieu
- **URL** : `GET /api/lieux/{id}/`
- **Permissions** : Aucune
- **Réponse** (200) :
```json
{
    "id": "uuid",
    "nom_ville": "Paris",
    "pays": {
        "code_iso": "FRA",
        "nom": "France"
    },
    "pays_code": "FRA",
    "geoname_id": 2988507,
    "latitude": "48.856600",
    "longitude": "2.352200",
    "date_creation": "2025-07-27T06:19:15.356201Z",
    "note_moyenne": 5.0
}
```

### Création d'un lieu
- **URL** : `POST /api/lieux/`
- **Permissions** : Aucune
- **⚠️ Note :** Endpoint disponible via ModelViewSet mais non utilisé en pratique
- **Body** :
```json
{
    "nom_ville": "Lyon",
    "pays_code": "FRA",
    "geoname_id": 2996944,
    "latitude": 45.7640,
    "longitude": 4.8357
}
```

### Modification d'un lieu
- **URL** : `PUT /api/lieux/{id}/`
- **Permissions** : Aucune
- **⚠️ Note :** Endpoint disponible via ModelViewSet mais non utilisé en pratique
- **Body** : Même format que la création

### Suppression d'un lieu
- **URL** : `DELETE /api/lieux/{id}/`
- **Permissions** : Aucune
- **⚠️ Note :** Endpoint disponible via ModelViewSet mais non utilisé en pratique

### Recherche de lieux
- **URL** : `GET /api/lieux/search/?q=Paris`
- **Permissions** : Aucune
- **Réponse** (200) : Liste des lieux correspondants

### Voyages d'un lieu
- **URL** : `GET /api/lieux/{id}/voyages/`
- **Permissions** : Aucune
- **Réponse** (200) : Liste des voyages pour ce lieu

### Détails complets d'un lieu
- **URL** : `GET /api/lieux/{lieu_id}/detail/`
- **Permissions** : Aucune
- **Réponse** (200) :
```json
{
    "id": "uuid",
    "nom_ville": "Paris",
    "pays": {...},
    "geoname_id": 2988507,
    "latitude": "48.856600",
    "longitude": "2.352200",
    "date_creation": "2025-07-27T06:19:15.356201Z",
    "note_moyenne": 5.0,
    "is_favori": false,
    "user_voyages": [...]
}
```

## Voyages

### Liste des voyages de l'utilisateur
- **URL** : `GET /api/voyages/`
- **Permissions** : Authentifié
- **Headers** : `Authorization: Bearer <token>`
- **Réponse** (200) :
```json
[
    {
        "id": "uuid",
        "utilisateur": {
            "id": 1,
            "username": "user@example.com",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe"
        },
        "lieu": {
            "id": "uuid",
            "nom_ville": "Paris",
            "pays": {...},
            "latitude": "48.856600",
            "longitude": "2.352200"
        },
        "date_debut": "2024-06-15",
        "date_fin": "2024-06-20",
        "note": 5,
        "commentaire": "Super voyage !",
        "date_creation": "2025-07-27T06:20:25.744705Z"
    }
]
```

### Création d'un voyage
- **URL** : `POST /api/voyages/`
- **Permissions** : Authentifié
- **Headers** : `Authorization: Bearer <token>`
- **Body** :
```json
{
    "lieu_id": "uuid",
    "date_debut": "2024-06-15",
    "date_fin": "2024-06-20",
    "note": 5,
    "commentaire": "Super voyage à Paris !"
}
```

### Détails d'un voyage
- **URL** : `GET /api/voyages/{id}/`
- **Permissions** : Authentifié (propriétaire)
- **Headers** : `Authorization: Bearer <token>`

### Modification d'un voyage
- **URL** : `PUT /api/voyages/{id}/`
- **Permissions** : Authentifié (propriétaire)
- **Headers** : `Authorization: Bearer <token>`

### Suppression d'un voyage
- **URL** : `DELETE /api/voyages/{id}/`
- **Permissions** : Authentifié (propriétaire)
- **Headers** : `Authorization: Bearer <token>`

## Favoris

### Liste des favoris de l'utilisateur
- **URL** : `GET /api/favoris/`
- **Permissions** : Authentifié
- **Headers** : `Authorization: Bearer <token>`
- **Réponse** (200) :
```json
[
    {
        "id": 1,
        "utilisateur": {...},
        "lieu": {...},
        "date_ajout": "2025-07-27T06:25:10.123456Z"
    }
]
```

### Ajouter un favori
- **URL** : `POST /api/favoris/`
- **Permissions** : Authentifié
- **Headers** : `Authorization: Bearer <token>`
- **Body** :
```json
{
    "lieu_id": "uuid"
}
```

### Supprimer un favori
- **URL** : `DELETE /api/favoris/{id}/`
- **Permissions** : Authentifié (propriétaire)
- **Headers** : `Authorization: Bearer <token>`

## Profil Utilisateur

### Statistiques de l'utilisateur
- **URL** : `GET /api/profile/`
- **Permissions** : Authentifié
- **Headers** : `Authorization: Bearer <token>`
- **Réponse** (200) :
```json
{
    "lieux_visites": [
        {
            "id": "uuid",
            "nom_ville": "Paris",
            "pays": {...},
            "latitude": "48.856600",
            "longitude": "2.352200"
        }
    ],
    "pays_visites": [
        {
            "code_iso": "FRA",
            "nom": "France"
        }
    ],
    "score_total": 5,
    "nombre_voyages": 1,
    "nombre_favoris": 0
}
```

## Recherche Globale

### Recherche dans lieux et pays
- **URL** : `GET /api/search/?q=Paris`
- **Permissions** : Aucune
- **Réponse** (200) :
```json
{
    "lieux": [
        {
            "id": "uuid",
            "nom_ville": "Paris",
            "pays": {...},
            "latitude": "48.856600",
            "longitude": "2.352200"
        }
    ],
    "pays": [
        {
            "code_iso": "FRA",
            "nom": "France"
        }
    ]
}
```

## Codes d'Erreur

### 400 Bad Request
- Données de validation invalides
- Paramètres manquants

### 401 Unauthorized
- Token d'authentification manquant ou invalide
- Utilisateur non connecté

### 403 Forbidden
- Permissions insuffisantes
- Accès refusé à la ressource

### 404 Not Found
- Ressource inexistante
- Lieu ou voyage non trouvé

### 500 Internal Server Error
- Erreur serveur interne

## Exemples d'Utilisation

### Recherche et création de voyage
```bash
# 1. Rechercher un lieu
curl "http://localhost:8000/api/search/?q=Paris"

# 2. Créer un voyage
curl -X POST "http://localhost:8000/api/voyages/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lieu_id": "uuid-from-step-1",
    "date_debut": "2024-06-15",
    "note": 5,
    "commentaire": "Super voyage !"
  }'
```

### Ajouter un favori
```bash
curl -X POST "http://localhost:8000/api/favoris/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lieu_id": "uuid"}'
```

### Consulter son profil
```bash
curl "http://localhost:8000/api/profile/" \
  -H "Authorization: Bearer YOUR_TOKEN"
``` 