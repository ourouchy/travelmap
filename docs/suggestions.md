# 🎯 Système de Suggestions - TravelMap

## 📋 Vue d'ensemble

Le système de suggestions de TravelMap est une fonctionnalité intelligente qui propose des destinations personnalisées aux utilisateurs connectés, basées sur leurs lieux favoris et leurs préférences de voyage.

## 🏗️ Architecture

### **Backend (Django)**
- **Endpoint API** : `/api/suggestions/`
- **Vue** : `SuggestionsView` dans `places/views.py`
- **Permissions** : Authentification JWT requise
- **Méthode** : GET

### **Frontend (React)**
- **Composant** : `Suggestions.jsx`
- **Intégration** : Page d'accueil (`Index.jsx`)
- **Styling** : CSS dans `App.css`

## 🧠 Algorithme de Suggestions

### **Étape 1 : Suggestions par Pays (Priorité Haute)**
```python
# Pour chaque lieu favori de l'utilisateur
for favori in favoris:
    pays_favori = favori.lieu.pays
    # Trouver jusqu'à 3 lieux du même pays
    lieux_meme_pays = Lieu.objects.filter(
        pays=pays_favori
    ).exclude(
        voyages__utilisateur=user  # Pas déjà visités
    ).distinct()[:3]
    suggestions.extend(lieux_meme_pays)
```

**Logique** : Si l'utilisateur a aimé Paris, suggérer d'autres villes françaises.

### **Étape 2 : Suggestions par Continent (Priorité Moyenne)**
```python
# Pour chaque lieu favori
for favori in favoris:
    pays_favori = favori.lieu.pays
    continent_favori = self.get_continent(pays_favori.code_iso)
    
    # Trouver jusqu'à 2 lieux du même continent (pays différent)
    lieux_meme_continent = Lieu.objects.filter(
        pays__code_iso__in=self.get_pays_continent(continent_favori)
    ).exclude(
        voyages__utilisateur=user
    ).exclude(
        pays=pays_favori  # Pas du même pays
    ).distinct()[:2]
    suggestions.extend(lieux_meme_continent)
```

**Logique** : Si l'utilisateur a aimé Paris, suggérer des villes européennes d'autres pays.

### **Étape 3 : Fallback Populaire (Priorité Basse)**
```python
# Si moins de 6 suggestions, compléter avec des lieux populaires
if len(suggestions) < 6:
    lieux_populaires = Lieu.objects.annotate(
        nb_voyages=Count('voyages')
    ).order_by('-nb_voyages')[:10]
    
    # Filtrer les lieux non visités et non déjà suggérés
    lieux_disponibles = [
        lieu for lieu in lieux_populaires 
        if lieu not in suggestions and 
        not lieu.voyages.filter(utilisateur=user).exists()
    ]
    suggestions.extend(lieux_disponibles[:6-len(suggestions)])
```

**Logique** : Compléter avec des destinations populaires si nécessaire.

## 🌍 Mapping Continent-Pays

### **Europe**
```python
europe = ['FRA', 'DEU', 'ITA', 'ESP', 'GBR', 'NLD', 'BEL', 'CHE', 'AUT', 'POL', 'IRL', 'DNK', 'SWE', 'NOR', 'FIN']
```

### **Asie**
```python
asie = ['JPN', 'CHN', 'KOR', 'THA', 'VNM', 'IDN', 'MYS', 'SGP', 'PHL', 'IND', 'PAK', 'BGD', 'LKA']
```

### **Amérique**
```python
amerique = ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'CHL', 'PER', 'COL', 'VE', 'EC', 'BO', 'PY', 'UY']
```

### **Afrique**
```python
afrique = ['ZAF', 'EGY', 'MAR', 'TUN', 'KEN', 'GHA', 'NGA', 'ETH', 'UGA', 'TZA', 'ZWE', 'MWI']
```

### **Océanie**
```python
oceanie = ['AUS', 'NZL', 'FJI', 'PNG', 'VUT', 'NCL', 'PYF']
```

## 📊 Limites et Contraintes

- **Maximum** : 6 suggestions par utilisateur
- **Exclusions** : Lieux déjà visités par l'utilisateur
- **Déduplication** : Suppression des doublons avant retour
- **Ordre** : Priorité pays > continent > populaire

## 🔧 Implémentation Technique

### **Backend - Vue Django**

```python
class SuggestionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        suggestions = []
        
        # Algorithme en 3 étapes...
        
        return Response({
            'suggestions': data,
            'total': len(data),
            'message': self.get_message_explicatif(user, favoris)
        })
```

**Fonctions utilitaires** :
- `get_continent(code_pays)` : Mapping pays → continent
- `get_pays_continent(continent)` : Liste des pays d'un continent
- `get_message_explicatif(user, favoris)` : Message personnalisé

### **Frontend - Composant React**

```jsx
const Suggestions = ({ token, onRefresh, onNavigateToLieu }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Logique de récupération et affichage...
};
```

**États** :
- `suggestions` : Liste des suggestions
- `isLoading` : État de chargement
- `error` : Gestion des erreurs
- `message` : Message explicatif du backend

## 🎨 Interface Utilisateur

### **Design Épuré**
- **Pas de background** coloré
- **Pas de bordures** épaisses
- **Style minimaliste** et professionnel
- **Séparateurs subtils** entre les suggestions

### **Structure**
```
💡 Suggestions pour vous                    [🔄 Actualiser]
─────────────────────────────────────────────────────────────
Paris                    France              →
Brest                    France              →
Lille                    France              →
Amsterdam               Pays-Bas            →
Barcelona               Espagne             →
Berlin                  Allemagne            →
─────────────────────────────────────────────────────────────
```

### **États d'Interface**
1. **Chargement** : "Chargement des suggestions..."
2. **Erreur** : Message d'erreur avec fond rouge
3. **Vide** : Message d'encouragement à ajouter des favoris
4. **Suggestions** : Grille de cartes cliquables

## 🔗 Intégration

### **URLs Backend**
```python
# places/urls.py
path('suggestions/', views.SuggestionsView.as_view(), name='suggestions'),
```

### **Intégration Frontend**
```jsx
// Index.jsx
{token && (
  <Suggestions 
    token={token} 
    onRefresh={() => console.log('Suggestions actualisées')}
    onNavigateToLieu={onNavigateToLieu}
  />
)}
```

### **Navigation**
- **Clic sur suggestion** → Navigation vers la page du lieu
- **Bouton actualiser** → Rechargement des suggestions
- **Callback** → Notification au composant parent

## 📱 Responsive Design

### **Grille Adaptative**
```css
.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

### **Mobile First**
- **Colonnes** : Adaptatives selon la largeur d'écran
- **Espacement** : Cohérent sur tous les appareils
- **Boutons** : Taille optimisée pour le tactile

## 🧪 Tests et Validation

### **Scénarios de Test**
1. **Utilisateur sans favoris** → Suggestions populaires
2. **Utilisateur avec favoris** → Suggestions personnalisées
3. **Utilisateur avec voyages** → Exclusion des lieux visités
4. **Erreur d'authentification** → Message d'erreur approprié

### **Validation des Données**
- **Authentification** : Token JWT requis
- **Permissions** : Utilisateur connecté uniquement
- **Données** : Format JSON standardisé
- **Erreurs** : Gestion gracieuse des exceptions

## 🚀 Optimisations Futures

### **Améliorations Possibles**
1. **Machine Learning** : Analyse des préférences utilisateur
2. **Géolocalisation** : Suggestions basées sur la position
3. **Saisonnalité** : Suggestions selon la période de l'année
4. **Collaboratif** : Suggestions basées sur les utilisateurs similaires
5. **Historique** : Prise en compte des clics sur les suggestions

### **Performance**
- **Cache** : Mise en cache des suggestions populaires
- **Pagination** : Chargement progressif des suggestions
- **Indexation** : Optimisation des requêtes base de données

## 📝 Messages Utilisateur

### **Messages Explicatifs**
- **Sans favoris** : "Découvrez des destinations populaires"
- **1 pays favori** : "Basé sur vos favoris en [Pays]"
- **2+ pays favoris** : "Basé sur vos favoris en [Pays1] et [Pays2]"

### **Messages d'Interface**
- **Chargement** : "Chargement des suggestions..."
- **Erreur** : "Erreur lors du chargement des suggestions"
- **Vide** : "Aucune suggestion pour le moment"
- **Encouragement** : "Ajoutez des lieux à vos favoris pour recevoir des suggestions personnalisées"

## 🔒 Sécurité

### **Authentification**
- **JWT Token** : Validation obligatoire
- **Permissions** : Utilisateur authentifié uniquement
- **Isolation** : Chaque utilisateur voit ses propres suggestions

### **Validation des Données**
- **Input** : Validation des paramètres de requête
- **Output** : Échappement des données utilisateur
- **Rate Limiting** : Protection contre l'abus

## 📚 Références

- **Documentation Django REST Framework** : [DRF APIView](https://www.django-rest-framework.org/api-guide/views/)
- **Documentation React** : [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- **Architecture TravelMap** : Voir `docs/frontend_backend_integration.md`
- **Modèles de données** : Voir `docs/models.md` 