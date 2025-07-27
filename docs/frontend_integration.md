# Guide d'Intégration Frontend - TravelMap API

## Vue d'ensemble

Ce guide explique comment intégrer le frontend React avec l'API TravelMap. L'API utilise JWT pour l'authentification et fournit des endpoints REST pour gérer les pays, lieux, voyages et favoris.

## Configuration de Base

### URL de l'API
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### Headers par défaut
```javascript
const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
```

## Authentification

### 1. Inscription d'un utilisateur

```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        username: userData.email,   
        email: userData.email,
        password: userData.password,
        password2: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Stocker les tokens
      localStorage.setItem('authToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true, user: data.user };
    } else {
      return { success: false, errors: data };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

### 2. Connexion d'un utilisateur

```javascript
const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        username: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Stocker les tokens
      localStorage.setItem('authToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Identifiants invalides' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

### 3. Déconnexion

```javascript
const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
```

### 4. Vérification de l'authentification

```javascript
const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
```

## Gestion des Lieux

### 1. Recherche de lieux

```javascript
const searchPlaces = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de recherche' };
  }
};

// Utilisation
const results = await searchPlaces('Paris');
if (results.success) {
  console.log('Lieux trouvés:', results.data.lieux);
  console.log('Pays trouvés:', results.data.pays);
}
```

### 2. Récupération de la liste des lieux

```javascript
const getPlaces = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lieux/`);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, places: data };
    } else {
      return { success: false, error: 'Erreur de récupération' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

### 3. Détails d'un lieu

```javascript
const getPlaceDetails = async (placeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lieux/${placeId}/`);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, place: data };
    } else {
      return { success: false, error: 'Lieu non trouvé' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

### 4. Détails complets d'un lieu (avec favoris et voyages utilisateur)

```javascript
const getPlaceFullDetails = async (placeId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/lieux/${placeId}/detail/`, {
      headers: getHeaders(token)
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, place: data };
    } else {
      return { success: false, error: 'Lieu non trouvé' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

## Gestion des Voyages

### 1. Récupération des voyages de l'utilisateur

```javascript
const getUserTrips = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/voyages/`, {
      headers: getHeaders(token)
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, trips: data };
    } else if (response.status === 401) {
      return { success: false, error: 'Non authentifié' };
    } else {
      return { success: false, error: 'Erreur de récupération' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

### 2. Création d'un voyage

```javascript
const createTrip = async (tripData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/voyages/`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        lieu_id: tripData.placeId,
        date_debut: tripData.startDate,
        date_fin: tripData.endDate || null,
        note: tripData.rating || null,
        commentaire: tripData.comment || ''
      })
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, trip: data };
    } else {
      return { success: false, errors: data };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de création' };
  }
};

// Utilisation
const newTrip = await createTrip({
  placeId: 'uuid-du-lieu',
  startDate: '2024-06-15',
  endDate: '2024-06-20',
  rating: 5,
  comment: 'Super voyage !'
});
```

### 3. Modification d'un voyage

```javascript
const updateTrip = async (tripId, tripData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/voyages/${tripId}/`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({
        lieu_id: tripData.placeId,
        date_debut: tripData.startDate,
        date_fin: tripData.endDate || null,
        note: tripData.rating || null,
        commentaire: tripData.comment || ''
      })
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, trip: data };
    } else {
      return { success: false, errors: data };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de modification' };
  }
};
```

### 4. Suppression d'un voyage

```javascript
const deleteTrip = async (tripId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/voyages/${tripId}/`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Erreur de suppression' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

## Gestion des Favoris

### 1. Récupération des favoris de l'utilisateur

```javascript
const getUserFavorites = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/favoris/`, {
      headers: getHeaders(token)
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, favorites: data };
    } else {
      return { success: false, error: 'Erreur de récupération' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

### 2. Ajouter un lieu aux favoris

```javascript
const addToFavorites = async (placeId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/favoris/`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        lieu_id: placeId
      })
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, favorite: data };
    } else {
      return { success: false, errors: data };
    }
  } catch (error) {
    return { success: false, error: 'Erreur d\'ajout' };
  }
};
```

### 3. Supprimer un lieu des favoris

```javascript
const removeFromFavorites = async (favoriteId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/favoris/${favoriteId}/`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Erreur de suppression' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};
```

## Profil Utilisateur

### Récupération des statistiques utilisateur

```javascript
const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      headers: getHeaders(token)
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, profile: data };
    } else {
      return { success: false, error: 'Erreur de récupération' };
    }
  } catch (error) {
    return { success: false, error: 'Erreur de connexion' };
  }
};

// Utilisation
const profile = await getUserProfile();
if (profile.success) {
  console.log('Lieux visités:', profile.profile.lieux_visites);
  console.log('Pays visités:', profile.profile.pays_visites);
  console.log('Score total:', profile.profile.score_total);
  console.log('Nombre de voyages:', profile.profile.nombre_voyages);
  console.log('Nombre de favoris:', profile.profile.nombre_favoris);
}
```

## Gestion des Erreurs

### Classe utilitaire pour la gestion des erreurs

```javascript
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

const handleAPIResponse = async (response) => {
  const data = await response.json();
  
  if (response.ok) {
    return data;
  }
  
  switch (response.status) {
    case 400:
      throw new APIError('Données invalides', 400, data);
    case 401:
      throw new APIError('Non authentifié', 401, data);
    case 403:
      throw new APIError('Accès refusé', 403, data);
    case 404:
      throw new APIError('Ressource non trouvée', 404, data);
    case 500:
      throw new APIError('Erreur serveur', 500, data);
    default:
      throw new APIError('Erreur inconnue', response.status, data);
  }
};
```

### Utilisation avec gestion d'erreurs

```javascript
const safeAPIRequest = async (apiCall) => {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.message, details: error.data };
    }
    return { success: false, error: 'Erreur de connexion' };
  }
};

// Utilisation
const result = await safeAPIRequest(() => getUserTrips());
if (result.success) {
  console.log('Voyages:', result.data);
} else {
  console.error('Erreur:', result.error);
}
```

## Hooks React Personnalisés

### Hook pour l'authentification

```javascript
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const result = await loginUser(credentials);
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };
};
```

### Hook pour les lieux

```javascript
import { useState, useEffect } from 'react';

export const usePlaces = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchPlaces = async (query) => {
    setLoading(true);
    setError(null);
    
    const result = await searchPlaces(query);
    
    if (result.success) {
      setPlaces(result.data.lieux);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  return {
    places,
    loading,
    error,
    searchPlaces
  };
};
```

### Hook pour les voyages

```javascript
import { useState, useEffect } from 'react';

export const useTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTrips = async () => {
    setLoading(true);
    setError(null);
    
    const result = await getUserTrips();
    
    if (result.success) {
      setTrips(result.trips);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const createTrip = async (tripData) => {
    const result = await createTrip(tripData);
    if (result.success) {
      setTrips(prev => [...prev, result.trip]);
    }
    return result;
  };

  useEffect(() => {
    loadTrips();
  }, []);

  return {
    trips,
    loading,
    error,
    loadTrips,
    createTrip
  };
};
```

## Exemples d'Utilisation dans React

### Composant de recherche

```jsx
import React, { useState } from 'react';
import { usePlaces } from './hooks/usePlaces';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const { places, loading, error, searchPlaces } = usePlaces();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      await searchPlaces(query);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un lieu..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="results">
        {places.map(place => (
          <div key={place.id} className="place-card">
            <h3>{place.nom_ville}</h3>
            <p>{place.pays.nom}</p>
            <p>Note: {place.note_moyenne || 'Aucune note'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Composant de création de voyage

```jsx
import React, { useState } from 'react';
import { useTrips } from './hooks/useTrips';

const CreateTripForm = ({ placeId, onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    rating: '',
    comment: ''
  });
  const { createTrip } = useTrips();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await createTrip({
      placeId,
      ...formData
    });
    
    if (result.success) {
      onSuccess(result.trip);
      setFormData({ startDate: '', endDate: '', rating: '', comment: '' });
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Date de début:</label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <label>Date de fin (optionnel):</label>
        <input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </div>
      
      <div>
        <label>Note (1-5):</label>
        <select
          value={formData.rating}
          onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
        >
          <option value="">Sélectionner</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>
      
      <div>
        <label>Commentaire:</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
        />
      </div>
      
      <button type="submit">Créer le voyage</button>
    </form>
  );
};
```

## Bonnes Pratiques

### 1. Gestion des tokens
- Stockez les tokens dans localStorage
- Vérifiez l'expiration des tokens
- Implémentez un refresh automatique

### 2. Gestion d'état
- Utilisez des hooks personnalisés pour encapsuler la logique API
- Gérez les états de loading et d'erreur
- Mettez à jour l'état local après les opérations CRUD

### 3. Validation
- Validez les données côté client avant envoi
- Gérez les erreurs de validation de l'API
- Affichez des messages d'erreur utilisateur

### 4. Performance
- Mettez en cache les données fréquemment utilisées
- Utilisez la pagination pour les grandes listes
- Optimisez les requêtes avec des paramètres de filtrage

Cette documentation fournit tous les outils nécessaires pour intégrer le frontend React avec l'API TravelMap de manière efficace et robuste. 