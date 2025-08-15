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

  const getProfileImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
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
      <div className="card profile">
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card profile">
        <div className="error">{error}</div>
        <button onClick={handleBackClick} className="auth-button">
          Retour
        </button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="card profile">
        <div className="error">Profil non trouvé</div>
        <button onClick={handleBackClick} className="auth-button">
          Retour
        </button>
      </div>
    );
  }

  return (
<div>
    <div className="button-group">
        <button className="cancel" onClick={onNavigateBack}>← Retour</button>

      </div>
    <div className="card profile">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <h1>Profil de {userProfile.first_name} {userProfile.last_name}</h1>
      
      <div className="profile-avatar-wrapper">
        <div className="profile-avatar-large">
          <img 
            src={getProfileImageUrl(userProfile.profile_image_url)} 
            alt={`${userProfile.first_name} ${userProfile.last_name}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
            }}
          />
        </div>
      </div>

      <div className="form-group">
        <h3>Biographie</h3>
        <div className="profile-bio-content">
          {userProfile.bio || "Cet utilisateur n'a pas encore de biographie..."}
        </div>
      </div>

      <div className="form-group">
        <h3>Informations du compte</h3>
        <div className="user-info">
          <label className="form-label">Nom d'utilisateur</label>
          <div className="input profile-info-field">
            @{userProfile.username}
          </div>
          
          <label className="form-label">Membre depuis</label>
          <div className="input profile-info-field">
            {new Date(userProfile.date_joined).toLocaleDateString('fr-FR')}
          </div>

          <label className="form-label">
            <span style={{ marginRight: '0.5rem' }}>🎯</span>
            Score total
          </label>
          <div className="input profile-info-field score-field">
            <span style={{ 
              fontSize: '1.2em', 
              fontWeight: 'bold', 
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🏆</span>
              {userProfile.score_total} points
            </span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <h3>Statistiques</h3>
            <div>✈️ {userProfile.nombre_voyages} Voyages</div>
            <div>🎭 {userProfile.nombre_activites_creees} Activités créées</div>
      </div>

      {userProfile.pays_visites && userProfile.pays_visites.length > 0 && (
        <div className="form-group">
          <h3>🌍 Carte des pays visités ({userProfile.pays_visites.length})</h3>
          <div className="world-map-container">
            <WorldMap 
              paysVisites={userProfile.pays_visites}
              height="400px"
              width="100%"
            />
          </div>
              <span>Pays visités ({userProfile.pays_visites.length})</span>
        </div>
      )}

      <div className="actions" >
        <button 
          onClick={() => setCurrentPage('Index')}>
          Voir les voyages
        </button>
        <button 
          onClick={() => setCurrentPage('Activites')}>
          Voir les activités
        </button>
      </div>
    </div>
    </div>
  );
};

export default UserPublicProfile;