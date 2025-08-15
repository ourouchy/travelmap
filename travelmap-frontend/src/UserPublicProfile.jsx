import React, { useState, useEffect } from 'react';
import WorldMap from './components/WorldMap';
import './App.css';

const UserPublicProfile = ({ userId, onNavigateBack, setCurrentPage }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Fonction pour construire l'URL complète de l'image de profil
  const getProfileImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    
    // Si c'est déjà une URL complète, la retourner
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Construire l'URL complète avec le serveur backend
    if (imageUrl.startsWith('/media/')) {
      return `http://localhost:8000${imageUrl}`;
    } else if (imageUrl.startsWith('media/')) {
      return `http://localhost:8000/${imageUrl}`;
    } else {
      return `http://localhost:8000/media/${imageUrl}`;
    }
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/users/${userId}/profile/`);
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        setError('Profil non trouvé');
      }
    } catch (err) {
      setError('Erreur lors du chargement du profil');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    onNavigateBack();
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button onClick={handleBackClick} className="back-button">
          Retour
        </button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container">
        <div className="error">Profil non trouvé</div>
        <button onClick={handleBackClick} className="back-button">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header avec bouton retour */}
      <div className="profile-header">
        <button onClick={handleBackClick} className="back-button">
          ← Retour
        </button>
        <h1>Profil de {userProfile.first_name} {userProfile.last_name}</h1>
      </div>

      {/* Informations de base */}
      <div className="profile-section">
        <div className="profile-avatar">
          <img 
            src={getProfileImageUrl(userProfile.profile_image_url)} 
            alt={`${userProfile.first_name} ${userProfile.last_name}`}
            className="avatar-image"
          />
        </div>
        
        <div className="profile-info">
          <h2>{userProfile.first_name} {userProfile.last_name}</h2>
          <p className="username">@{userProfile.username}</p>
          {userProfile.bio && (
            <p className="bio">{userProfile.bio}</p>
          )}
          <p className="member-since">
            Membre depuis {new Date(userProfile.date_joined).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="profile-section">
        <h3>Statistiques</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">🎯 {userProfile.score_total}</div>
            <div className="stat-label">Score total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">✈️ {userProfile.nombre_voyages}</div>
            <div className="stat-label">Voyages</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">🎭 {userProfile.nombre_activites_creees}</div>
            <div className="stat-label">Activités créées</div>
          </div>
        </div>
      </div>

      {/* Pays visités - Remplacé par la carte mondiale */}
      {userProfile.pays_visites && userProfile.pays_visites.length > 0 && (
        <div className="profile-section">
          <h3>🌍 Carte des pays visités ({userProfile.pays_visites.length})</h3>
          <div className="world-map-container">
            <WorldMap 
              paysVisites={userProfile.pays_visites}
              height="400px"
              width="100%"
            />
          </div>
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color visited"></div>
              <span>Pays visités ({userProfile.pays_visites.length})</span>
            </div>
            <div className="legend-item">
              <div className="legend-color not-visited"></div>
              <span>Pays non visités</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="profile-actions">
        <button 
          onClick={() => setCurrentPage('Index')} 
          className="action-button"
        >
          Voir les voyages
        </button>
        <button 
          onClick={() => setCurrentPage('Activites')} 
          className="action-button"
        >
          Voir les activités
        </button>
      </div>
    </div>
  );
};

export default UserPublicProfile; 