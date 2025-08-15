# Documentation des Cartes - TravelMap

## Vue d'ensemble

TravelMap utilise **Leaflet.js** comme bibliothèque de cartographie pour afficher deux types de cartes différents :

1. **Carte locale** (`Map.jsx`) : Affiche un lieu spécifique avec un marqueur
2. **Carte mondiale** (`WorldMap.jsx`) : Affiche le monde entier avec coloration des pays visités

## Architecture Technique

### Technologies utilisées
- **Leaflet.js** : Bibliothèque de cartographie open-source
- **OpenStreetMap** : Données cartographiques gratuites
- **GeoJSON** : Format de données géographiques pour les frontières des pays

### Structure des composants
```
src/components/
├── Map.jsx          # Carte locale pour les lieux
└── WorldMap.jsx     # Carte mondiale pour les profils
```

## 1. Carte Locale (Map.jsx)

### Utilisation
Utilisée dans le composant `Lieu.jsx` pour afficher un lieu spécifique avec ses coordonnées.

### Fonctionnalités
- **Marqueur unique** : Affiche la position exacte du lieu
- **Popup informatif** : Nom de la ville et du pays
- **Zoom adaptatif** : Zoom par défaut à 13 (niveau ville)
- **Tuiles OpenStreetMap** : Fond de carte gratuit et détaillé

### Props acceptées
```jsx
<Map
  latitude={lieuDetails.latitude}      // Coordonnée latitude
  longitude={lieuDetails.longitude}    // Coordonnée longitude
  nom_ville={lieuDetails.nom_ville}    // Nom de la ville
  pays_nom={lieuDetails.pays?.nom}     // Nom du pays
  height="400px"                       // Hauteur de la carte
  width="100%"                         // Largeur de la carte
  zoom={12}                           // Niveau de zoom
  showMarker={true}                   // Afficher le marqueur
/>
```

### Implémentation technique
```jsx
// Création de la carte centrée sur les coordonnées
const map = L.map(mapRef.current).setView([latitude, longitude], zoom);

// Ajout des tuiles OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetMap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

// Ajout du marqueur avec popup
if (showMarker) {
  const marker = L.marker([latitude, longitude]).addTo(map);
  marker.bindPopup(`<b>${nom_ville}</b><br>${pays_nom}`);
}
```

### Cas d'usage
- **Page Lieu** : Affichage de la carte d'un lieu visité
- **Création de voyage** : Visualisation de la destination
- **Détails d'activité** : Localisation précise d'une activité

---

## 2. Carte Mondiale (WorldMap.jsx)

### Utilisation
Utilisée dans `UserPublicProfile.jsx` pour afficher une vue mondiale avec coloration des pays visités.

### Fonctionnalités
- **Vue mondiale** : Carte centrée sur le monde entier
- **Coloration des pays** : Rouge pour visités, gris pour non visités
- **Interactivité** : Popups au clic, effets hover
- **Légende** : Explication des couleurs utilisées
- **Responsive** : Adaptation mobile avec zoom limité

### Props acceptées
```jsx
<WorldMap
  paysVisites={userProfile.pays_visites}  // Array des pays visités
  height="400px"                          // Hauteur de la carte
  width="100%"                            // Largeur de la carte
  className=""                            // Classes CSS additionnelles
/>
```

### Structure des données d'entrée
```json
{
  "pays_visites": [
    {
      "code_iso": "FR",
      "nom": "France"
    },
    {
      "code_iso": "DE", 
      "nom": "Allemagne"
    }
  ]
}
```

### Implémentation technique

#### 1. Récupération des données géographiques
```jsx
// Utilisation de Natural Earth Data (codes ISO standardisés)
const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
```

#### 2. Logique de coloration
```jsx
// Création d'un Set des codes ISO visités
const visitedCountryCodes = new Set(
  paysVisites.map(pays => pays.code_iso?.toLowerCase())
);

// Mapping personnalisé pour gérer les variations de codes
const countryCodeMapping = {
  'fra': ['fra', 'fr', 'france'],
  'deu': ['deu', 'de', 'germany'],
  // ... autres pays
};

// Fonction de coloration avec fallback
const getCountryColor = (countryCode) => {
  const normalizedCode = countryCode.toLowerCase();
  
  // Vérification directe
  if (visitedCountryCodes.has(normalizedCode)) {
    return '#ef4444'; // Rouge
  }
  
  // Vérification via mapping
  for (const [standardCode, variations] of Object.entries(countryCodeMapping)) {
    if (variations.includes(normalizedCode) && visitedCountryCodes.has(standardCode)) {
      return '#ef4444'; // Rouge
    }
  }
  
  return '#6b7280'; // Gris
};
```

#### 3. Application du style GeoJSON
```jsx
const style = (feature) => {
  // Extraction du code ISO depuis les propriétés GeoJSON
  let countryCode = feature.properties.ISO_A2 || 
                   feature.properties.ISO_A3 || 
                   feature.properties.ADM0_A3 || 
                   feature.properties.ADM0_A2;
  
  const fillColor = getCountryColor(countryCode);
  
  return {
    fillColor: fillColor,
    weight: 1,
    opacity: 0.8,
    color: fillColor === '#ef4444' ? '#dc2626' : '#4b5563',
    fillOpacity: 0.7,
  };
};
```

#### 4. Gestion des événements
```jsx
const onEachFeature = (feature, layer) => {
  const countryName = feature.properties.ADMIN || feature.properties.NAME;
  const countryCode = feature.properties.ISO_A2 || feature.properties.ISO_A3;
  const isVisited = visitedCountryCodes.has(countryCode.toLowerCase());
  
  // Popup informatif
  const popupContent = `
    <div style="text-align: center;">
      <strong>${countryName}</strong><br>
      <span style="color: ${isVisited ? '#ef4444' : '#6b7280'};">
        ${isVisited ? '✅ Visité' : '❌ Non visité'}
      </span>
    </div>
  `;
  
  layer.bindPopup(popupContent);
  
  // Effets hover
  layer.on({
    mouseover: (e) => { /* Style hover */ },
    mouseout: (e) => { /* Retour au style normal */ }
  });
};
```

### Cas d'usage
- **Profil utilisateur** : Visualisation des pays visités
- **Statistiques de voyage** : Vue d'ensemble géographique
- **Partage social** : Montrer ses destinations aux autres utilisateurs

---

## 3. Gestion des Données Géographiques

### Sources de données
1. **OpenStreetMap** : Tuiles de base (gratuites)
2. **Natural Earth Data** : Frontières des pays (GeoJSON)
3. **API TravelMap** : Coordonnées des lieux et pays visités

### Format des données
- **Coordonnées** : Latitude/Longitude (WGS84)
- **Codes ISO** : Standards à 2 ou 3 lettres (FR, FRA, DE, DEU)
- **GeoJSON** : Format standard pour les géométries

### Gestion des erreurs
- **Fallback** : Retour au fichier GeoJSON original si Natural Earth échoue
- **Validation** : Vérification des coordonnées (lat: -90 à 90, lon: -180 à 180)
- **Loading states** : Indicateurs visuels pendant le chargement

---

## 4. Optimisations et Performance

### Techniques utilisées
- **Lazy loading** : Chargement des données GeoJSON à la demande
- **Memoization** : Mise en cache des instances de carte
- **Cleanup** : Suppression propre des instances Leaflet
- **Responsive** : Adaptation automatique aux différentes tailles d'écran

### Limitations
- **Zoom max** : 8 pour la carte mondiale (performance)
- **Zoom min** : 2 pour la carte mondiale (lisibilité)
- **Taille des données** : GeoJSON mondial ~1MB

---

## 5. Maintenance et Évolutions

### Points d'attention
1. **Codes ISO** : Vérifier la correspondance entre API et GeoJSON
2. **Sources de données** : Maintenir les URLs des fichiers GeoJSON
3. **Performance** : Surveiller le temps de chargement sur mobile
4. **Compatibilité** : Tester sur différents navigateurs

### Améliorations possibles
- **Cache local** : Stockage des données GeoJSON en localStorage
- **Lazy rendering** : Affichage progressif des pays
- **Animations** : Transitions fluides entre états
- **Filtres** : Possibilité de filtrer par continent/région

---

## 6. Exemples d'utilisation

### Dans un composant Lieu
```jsx
import Map from './components/Map';

// Affichage d'un lieu spécifique
<Map
  latitude={lieu.latitude}
  longitude={lieu.longitude}
  nom_ville={lieu.nom_ville}
  pays_nom={lieu.pays.nom}
  height="400px"
  zoom={12}
  showMarker={true}
/>
```

### Dans un composant Profil
```jsx
import WorldMap from './components/WorldMap';

// Affichage des pays visités
<WorldMap
  paysVisites={userProfile.pays_visites}
  height="400px"
  width="100%"
/>
```

---

## 7. Dépannage

### Problèmes courants

#### Carte ne s'affiche pas
- Vérifier que les coordonnées sont valides
- Contrôler la console pour les erreurs JavaScript
- Vérifier la connexion internet (OpenStreetMap)

#### Pays non colorés
- Vérifier les logs de debug dans la console
- Contrôler la correspondance des codes ISO
- Vérifier la structure des données `pays_visites`

#### Performance lente
- Réduire le niveau de zoom maximum
- Utiliser des données GeoJSON simplifiées
- Implémenter un système de cache

### Logs de debug
Les composants incluent des logs détaillés pour faciliter le débogage :
- Codes ISO des pays visités
- Propriétés disponibles dans le GeoJSON
- Correspondances trouvées/non trouvées

---

## Conclusion

Le système de cartes de TravelMap offre une expérience utilisateur riche avec :
- **Cartes locales** précises pour les lieux spécifiques
- **Cartes mondiales** interactives pour les profils utilisateurs
- **Gestion robuste** des données géographiques
- **Interface responsive** et accessible

Cette architecture permet une visualisation géographique complète des voyages et destinations, enrichissant l'expérience utilisateur de l'application. 