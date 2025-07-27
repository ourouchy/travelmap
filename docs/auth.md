# Authentification JWT - TravelMap

## Vue d'ensemble

L'authentification de TravelMap utilise **JWT (JSON Web Tokens)** pour une approche moderne, sécurisée et stateless. Cette implémentation permet aux utilisateurs de s'inscrire, se connecter et rester authentifiés sans gestion de sessions côté serveur.

## Architecture

### Backend (Django + DRF)
- **Framework** : Django REST Framework avec `djangorestframework-simplejwt`
- **Base de données** : Utilisation du modèle User Django par défaut
- **Sécurité** : Passwords hashés automatiquement, validation côté serveur
- **Tokens** : Access token (24h) + Refresh token (7 jours)

### Frontend (React)
- **Stockage** : Tokens en localStorage
- **Gestion d'état** : useState pour l'authentification (pas de Context API)
- **Validation** : Côté client et serveur
- **UX** : États de loading, gestion d'erreurs, persistance session

## Configuration Backend

### 1. Dépendances installées

```bash
pip install djangorestframework-simplejwt django-cors-headers
```

**Fichier `requirements.txt` :**
```
django
djangorestframework
djangorestframework-simplejwt
psycopg2-binary
django-cors-headers
```

### 2. Configuration Django (`settings.py`)

```python
INSTALLED_APPS = [
    # ...
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "places",
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# JWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS pour le frontend
CORS_ALLOW_ALL_ORIGINS = True  # En développement
```

### 3. Sérialiseurs (`places/serializers.py`)

#### UserSerializer
```python
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)
```

#### RegisterSerializer
```python
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        return user
```

#### LoginSerializer
```python
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)
```

### 4. Vues (`places/views.py`)

#### Inscription
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

#### Connexion
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 5. URLs (`places/urls.py`)

```python
from django.urls import path
from . import views

urlpatterns = [
    path('ping/', views.ping, name='ping'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
]
```

## API Endpoints

### Base URL
```
http://localhost:8000/api/
```

### Endpoints d'authentification

#### 1. Inscription
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
- **Réponse succès** (201) :
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

#### 2. Connexion
- **URL** : `POST /api/auth/login/`
- **Content-Type** : `application/json`
- **Body** :
```json
{
    "username": "user@example.com",
    "password": "securepassword123"
}
```
- **Réponse succès** (200) : Même format que l'inscription
- **Réponse erreur** (401) :
```json
{
    "error": "Invalid credentials"
}
```

## Implémentation Frontend

### 1. Gestion des tokens

#### Stockage en localStorage
```javascript
// Stockage après connexion/inscription
localStorage.setItem('authToken', data.access);
localStorage.setItem('refreshToken', data.refresh);
localStorage.setItem('user', JSON.stringify(data.user));

// Récupération
const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user'));

// Suppression lors du logout
localStorage.removeItem('authToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
```

### 2. Composant Login (`Login.jsx`)

#### Changements principaux :
- **Remplacement du fake token** par un vrai appel API
- **Ajout de la gestion d'erreurs** avec affichage des messages
- **État de loading** pendant les requêtes
- **Validation côté client** avant envoi

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Stocker le token et les infos utilisateur
      localStorage.setItem('authToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.access);
    } else {
      setError(data.error || 'Erreur de connexion');
    }
  } catch (err) {
    setError('Erreur de connexion au serveur');
  } finally {
    setLoading(false);
  }
};
```

### 3. Composant Register (`Register.jsx`)

#### Changements principaux :
- **Validation password confirmation** côté client
- **Gestion des erreurs de validation** Django détaillée
- **Séparation nom/prénom** automatique avec `split()`
- **États de loading** et désactivation des champs

```javascript
// Validation côté client
if (password !== password2) {
  setError('Les mots de passe ne correspondent pas');
  return;
}

// Séparation automatique nom/prénom
const firstName = name.split(' ')[0] || name;
const lastName = name.split(' ').slice(1).join(' ') || '';

// Gestion des erreurs de validation Django
if (data.username) {
  setError(`Nom d'utilisateur: ${data.username[0]}`);
} else if (data.email) {
  setError(`Email: ${data.email[0]}`);
} else if (data.password) {
  setError(`Mot de passe: ${data.password[0]}`);
} else {
  setError('Erreur lors de l\'inscription');
}
```

### 4. Gestion d'état globale (`App.jsx`)

#### Changements principaux :
- **État utilisateur** ajouté pour stocker les infos
- **Vérification automatique** de l'authentification au chargement
- **Logout complet** avec nettoyage des données
- **Passage des données utilisateur** aux composants

```javascript
const [user, setUser] = useState(null);

// Vérification au chargement
useEffect(() => {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('user');
  
  if (token && userData) {
    setIsAuthenticated(true);
    setUser(JSON.parse(userData));
  }
}, []);

// Logout complet
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  setIsAuthenticated(false);
  setUser(null);
  setCurrentPage('Index');
};
```

### 5. Composant Profile (`Profile.jsx`)

#### Changements principaux :
- **Affichage des vraies données** utilisateur
- **Interface utilisateur** améliorée avec les infos du profil
- **Bouton de déconnexion** fonctionnel

```javascript
const Profile = ({ onLogout, user }) => {
  return (
    <div className="profile-container">
      <div className="card">
        <h2>Profil</h2>
        {user && (
          <div className="user-info">
            <p><strong>Nom d'utilisateur:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Prénom:</strong> {user.first_name}</p>
            <p><strong>Nom:</strong> {user.last_name}</p>
          </div>
        )}
        <button onClick={onLogout} className="auth-button">
          Se déconnecter
        </button>
      </div>
    </div>
  );
};
```

## Gestion des erreurs

### Backend
- **Validation des champs** : Utilisation des validateurs Django par défaut
- **Messages d'erreur** : Retour des erreurs de validation dans le format Django
- **Authentification** : Messages d'erreur personnalisés pour les credentials invalides

### Frontend
- **Validation côté client** : Vérification de la correspondance des mots de passe
- **Gestion des erreurs API** : Parsing des erreurs Django et affichage utilisateur
- **États de loading** : Désactivation des champs pendant les requêtes
- **Messages d'erreur** : Affichage contextuel des erreurs de validation

#### Exemples d'erreurs gérées :
```javascript
// Erreur de validation password
if (password !== password2) {
  setError('Les mots de passe ne correspondent pas');
  return;
}

// Erreurs de validation Django
if (data.username) {
  setError(`Nom d'utilisateur: ${data.username[0]}`);
} else if (data.email) {
  setError(`Email: ${data.email[0]}`);
} else if (data.password) {
  setError(`Mot de passe: ${data.password[0]}`);
}

// Erreur de connexion
if (response.status === 401) {
  setError('Identifiants invalides');
}
```

## Sécurité

### Backend
- **Passwords hashés** avec bcrypt (Django par défaut)
- **Validation côté serveur** (longueur, complexité, unicité)
- **Tokens JWT signés** avec expiration automatique
- **CORS configuré** pour le domaine frontend
- **Rate limiting** possible sur les endpoints auth

### Frontend
- **Validation côté client** pour une meilleure UX
- **Gestion des erreurs** avec messages utilisateur
- **États de loading** pour éviter les soumissions multiples
- **Nettoyage complet** lors du logout

## Utilisation des tokens

### Pour les requêtes authentifiées
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:8000/api/protected-endpoint/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Gestion de l'expiration
```javascript
if (response.status === 401) {
  // Token expiré, rediriger vers login
  localStorage.removeItem('authToken');
  setIsAuthenticated(false);
  setCurrentPage('Login');
}
```

## Tests

### 1. Test d'inscription
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "email": "test@example.com",
    "password": "testpass123",
    "password2": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Test de connexion
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "testpass123"
  }'
```

### 3. Test avec token
```bash
curl -X GET http://localhost:8000/api/protected-endpoint/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Prochaines étapes

1. **Refresh token** : Implémenter le renouvellement automatique des tokens
2. **Validation email** : Ajouter la vérification d'email lors de l'inscription
3. **Récupération de mot de passe** : Endpoint pour reset password
4. **Permissions** : Système de rôles et permissions
5. **Sécurité renforcée** : Rate limiting, validation plus stricte

## Dépannage

### Erreurs courantes

#### "Invalid credentials"
- Vérifier que l'utilisateur existe
- Vérifier le mot de passe
- Vérifier que l'utilisateur n'est pas désactivé

#### "Password fields didn't match"
- Les champs password et password2 doivent être identiques
- Validation côté client et serveur

#### "Username already exists"
- L'email/username est déjà utilisé
- Utiliser un autre email pour l'inscription

#### "This field is required" (first_name, last_name)
- Les champs prénom et nom sont obligatoires
- Vérifier que la séparation automatique fonctionne correctement

#### Erreur CORS
- Vérifier que `CORS_ALLOW_ALL_ORIGINS = True` en développement
- Vérifier que le middleware CORS est bien configuré

#### Token expiré
- Le token d'accès a expiré (24h par défaut)
- Utiliser le refresh token pour obtenir un nouveau token
- Ou rediriger vers la page de connexion
