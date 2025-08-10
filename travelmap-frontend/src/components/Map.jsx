import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = ({ 
  latitude, 
  longitude, 
  nom_ville, 
  pays_nom, 
  height = '300px',
  width = '100%',
  zoom = 13,
  showMarker = true,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return;

    // Créer la carte
    const map = L.map(mapRef.current).setView([parseFloat(latitude), parseFloat(longitude)], zoom);

    // Ajouter la couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Ajouter un marqueur si demandé
    if (showMarker) {
      const marker = L.marker([parseFloat(latitude), parseFloat(longitude)]).addTo(map);
      
      // Popup avec les informations du lieu
      if (nom_ville && pays_nom) {
        marker.bindPopup(`<b>${nom_ville}</b><br>${pays_nom}`);
      } else if (nom_ville) {
        marker.bindPopup(`<b>${nom_ville}</b>`);
      }
    }

    // Sauvegarder l'instance de la carte
    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, nom_ville, pays_nom, zoom, showMarker]);

  // Mettre à jour la vue si les coordonnées changent
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.setView([parseFloat(latitude), parseFloat(longitude)], zoom);
    }
  }, [latitude, longitude, zoom]);

  if (!latitude || !longitude) {
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
          <div>📍</div>
          <div>Coordonnées non disponibles</div>
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

export default Map; 