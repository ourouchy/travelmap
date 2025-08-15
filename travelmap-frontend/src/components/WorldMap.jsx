import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WorldMap = ({ 
  paysVisites = [], 
  height = '400px',
  width = '100%',
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [worldData, setWorldData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Créer un Set des codes ISO des pays visités pour une recherche rapide
  const visitedCountryCodes = new Set(
    paysVisites.map(pays => pays.code_iso?.toLowerCase())
  );

  // Mapping personnalisé pour les pays avec des codes ISO différents
  const countryCodeMapping = {
    // France - peut avoir différents codes selon la source
    'fra': ['fra', 'fr', 'france'],
    'deu': ['deu', 'de', 'germany'],
    'esp': ['esp', 'es', 'spain'],
    'jpn': ['jpn', 'jp', 'japan'],
    'mar': ['mar', 'ma', 'morocco'],
    // Ajouter d'autres pays si nécessaire
  };

  // Debug: afficher les codes ISO des pays visités
  console.log('Pays visités:', paysVisites);
  console.log('Codes ISO visités:', Array.from(visitedCountryCodes));

  // Fonction de coloration des pays
  const getCountryColor = (countryCode) => {
    if (!countryCode) return '#6b7280'; // Gris par défaut
    
    const normalizedCode = countryCode.toLowerCase();
    
    // Vérifier d'abord la correspondance directe
    if (visitedCountryCodes.has(normalizedCode)) {
      console.log(`✅ Pays visité trouvé directement: ${countryCode} -> Rouge`);
      return '#ef4444'; // Rouge pour visité
    }
    
    // Vérifier le mapping personnalisé
    for (const [standardCode, variations] of Object.entries(countryCodeMapping)) {
      if (variations.includes(normalizedCode)) {
        if (visitedCountryCodes.has(standardCode)) {
          console.log(`✅ Pays visité trouvé via mapping: ${countryCode} -> ${standardCode} -> Rouge`);
          return '#ef4444'; // Rouge pour visité
        }
      }
    }
    
    // Debug: afficher le code du pays en cours de traitement
    console.log(`❌ Pays non visité: ${countryCode} (normalisé: ${normalizedCode}) -> Gris`);
    return '#6b7280'; // Gris pour non visité
  };

  // Fonction de style appliquée à chaque feature GeoJSON
  const style = (feature) => {
    // Essayer différentes propriétés pour le code ISO selon la source de données
    let countryCode = '';
    
    // Natural Earth Data utilise généralement 'ISO_A2' ou 'ISO_A3'
    if (feature.properties.ISO_A2) {
      countryCode = feature.properties.ISO_A2;
    } else if (feature.properties.ISO_A3) {
      countryCode = feature.properties.ISO_A3;
    } else if (feature.properties.ISO) {
      countryCode = feature.properties.ISO;
    } else if (feature.properties.iso_a2) {
      countryCode = feature.properties.iso_a2;
    } else if (feature.properties.iso_a3) {
      countryCode = feature.properties.iso_a3;
    } else if (feature.properties.iso) {
      countryCode = feature.properties.iso;
    } else if (feature.properties.ADM0_A3) {
      countryCode = feature.properties.ADM0_A3;
    } else if (feature.properties.ADM0_A2) {
      countryCode = feature.properties.ADM0_A2;
    }
    
    // Debug: afficher les propriétés du feature pour les premiers pays
    if (feature.properties.ADMIN || feature.properties.NAME) {
      const countryName = feature.properties.ADMIN || feature.properties.NAME;
      console.log(`Feature: ${countryName}, Code trouvé: ${countryCode}, Propriétés:`, feature.properties);
    }
    
    const fillColor = getCountryColor(countryCode);
    
    return {
      fillColor: fillColor,
      weight: 1,
      opacity: 0.8,
      color: fillColor === '#ef4444' ? '#dc2626' : '#4b5563', // Bordure plus foncée
      fillOpacity: 0.7,
    };
  };

  // Gestion des événements sur chaque pays
  const onEachFeature = (feature, layer) => {
    const countryName = feature.properties.NAME || feature.properties.ADMIN || feature.properties.name || 'Pays inconnu';
    const countryCode = feature.properties.ISO_A3 || feature.properties.ISO_A2 || feature.properties.ISO || '';
    const isVisited = visitedCountryCodes.has(countryCode.toLowerCase());
    
    // Popup avec informations du pays
    const popupContent = `
      <div style="text-align: center;">
        <strong>${countryName}</strong><br>
        <span style="color: ${isVisited ? '#ef4444' : '#6b7280'};">
          ${isVisited ? '✅ Visité' : '❌ Non visité'}
        </span>
      </div>
    `;
    
    layer.bindPopup(popupContent);
    
    // Effet hover
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style(feature));
      }
    });
  };

  // Récupération des données GeoJSON du monde
  useEffect(() => {
    const fetchWorldData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Utiliser un fichier GeoJSON mondial avec les frontières des pays
        // Essayer Natural Earth Data qui a des codes ISO standardisés
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
        
        if (!response.ok) {
          // Fallback vers le fichier original si celui-ci ne fonctionne pas
          const fallbackResponse = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
          if (!fallbackResponse.ok) {
            throw new Error('Erreur lors du chargement des données géographiques');
          }
          const fallbackData = await fallbackResponse.json();
          setWorldData(fallbackData);
          
          // Debug: afficher la structure du premier feature pour comprendre les propriétés
          if (fallbackData.features && fallbackData.features.length > 0) {
            console.log('Premier feature GeoJSON (fallback):', fallbackData.features[0]);
            console.log('Propriétés disponibles (fallback):', Object.keys(fallbackData.features[0].properties));
          }
          return;
        }
        
        const data = await response.json();
        setWorldData(data);
        
        // Debug: afficher la structure du premier feature pour comprendre les propriétés
        if (data.features && data.features.length > 0) {
          console.log('Premier feature GeoJSON (Natural Earth):', data.features[0]);
          console.log('Propriétés disponibles (Natural Earth):', Object.keys(data.features[0].properties));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données géographiques:', err);
        setError('Erreur lors du chargement de la carte mondiale');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorldData();
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || !worldData) return;

    // Créer la carte centrée sur le monde
    const map = L.map(mapRef.current).setView([20, 0], 2);

    // Ajouter la couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetMap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 8,
      minZoom: 2
    }).addTo(map);

    // Créer la couche GeoJSON avec le style personnalisé
    const geoJsonLayer = L.geoJSON(worldData, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    // Debug: afficher le nombre de features créées
    console.log(`Carte créée avec ${geoJsonLayer.getLayers().length} pays`);

    // Sauvegarder l'instance de la carte
    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [worldData, paysVisites]);

  // Mise à jour de la carte quand les pays visités changent
  useEffect(() => {
    if (mapInstanceRef.current && worldData) {
      // Supprimer l'ancienne couche GeoJSON
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Recréer la couche avec les nouvelles données
      const geoJsonLayer = L.geoJSON(worldData, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(mapInstanceRef.current);
    }
  }, [paysVisites, worldData]);

  if (isLoading) {
    return (
      <div 
        style={{ 
          height, 
          width, 
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}
        className={className}
      >
        <div style={{ color: '#666', textAlign: 'center' }}>
          <div>🌍</div>
          <div>Chargement de la carte mondiale...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ 
          height, 
          width, 
          backgroundColor: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}
        className={className}
      >
        <div style={{ color: '#dc2626', textAlign: 'center' }}>
          <div>❌</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width, 
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
      className={className}
    />
  );
};

export default WorldMap; 