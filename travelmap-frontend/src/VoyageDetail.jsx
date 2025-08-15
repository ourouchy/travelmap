import React, { useState, useEffect } from 'react';
import Map from './components/Map';

const VoyageDetail = ({ voyageId, onNavigateBack, onNavigateToLieu, setViewingUserId, setCurrentPage }) => {
  const [voyage, setVoyage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    const fetchVoyageDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/api/voyages/${voyageId}/detail_public/`);
        
        if (response.ok) {
          const data = await response.json();
          setVoyage(data);
        } else {
          setError('Erreur lors du chargement des détails du voyage');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    if (voyageId) {
      fetchVoyageDetails();
    }
  }, [voyageId]);

  const images = voyage?.medias?.filter(m => m.type_media === 'image') || [];
  const videos = voyage?.medias?.filter(m => m.type_media === 'video') || [];
  const allMedias = [...images, ...videos];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openMediaModal = (media) => {
    const index = allMedias.findIndex(m => m.id === media.id);
    setSelectedMedia(media);
    setCurrentMediaIndex(index);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
    setCurrentMediaIndex(0);
  };

  const navigateMedia = (direction) => {
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentMediaIndex === 0 ? allMedias.length - 1 : currentMediaIndex - 1;
    } else {
      newIndex = currentMediaIndex === allMedias.length - 1 ? 0 : currentMediaIndex + 1;
    }
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(allMedias[newIndex]);
  };

  const handleLieuClick = (lieuId, lieuData) => {
  if (onNavigateToLieu) {
    onNavigateToLieu(lieuId, lieuData);
  }
};

const handleUserClick = (userId) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || {});
  if (userId === currentUser.id) {
    setCurrentPage('Profile');
  } else {
    setViewingUserId(userId);
    setCurrentPage('UserPublicProfile');
  }
};

  if (isLoading) {
    return (
      <div className="loading-message">
        <div>Chargement des détails du voyage...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <div>{error}</div>
      </div>
    );
  }

  if (!voyage) {
    return (
      <div className="error-message">
        <div>Voyage non trouvé</div>
      </div>
    );
  }

  return (
    <div>
      {/* Bouton de retour */}
      <div className="button-group">
        <button
          onClick={onNavigateBack}
          className="cancel"
        >
          ← Retour
        </button>
      </div>

      {/* En-tête avec carte */}
      <div className="card">
        <Map
          latitude={voyage.lieu.latitude}
          longitude={voyage.lieu.longitude}
          nom_ville={voyage.lieu.nom_ville}
          pays_nom={voyage.lieu.pays?.nom}
          height="400px"
          width="100%"
          zoom={12}
          showMarker={true}
        />
        
        <div className="dashboard-header">
          <div>
            <h1 className="clickable" onClick={() => handleLieuClick(voyage.lieu.id, voyage.lieu)} >{voyage.lieu.nom_ville}</h1>
            <p>{voyage.lieu.pays.nom}</p>
          </div>
          <div>
            {voyage.note && (
              <div className="dashboard-rating">
                ⭐ {voyage.note}/5
              </div>
            )}
            <h2>Voyage de <span 
              className="clickable"
              onClick={() => handleUserClick(voyage.utilisateur?.id)}
              title="Cliquer pour voir le profil">
              {voyage.utilisateur?.username || 'Utilisateur'}
            </span></h2>

            <p className="voyage-country">Créé le {formatDate(voyage.date_creation)}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {/* Informations du voyage */}
      <div className="card">
        <h2>Détails du voyage</h2>
        
        <div className="form-grid">
          <div>
            <strong>Date de début :</strong> {formatDate(voyage.date_debut)}
          </div>
          <div>
            <strong>Date de fin :</strong> {voyage.date_fin ? formatDate(voyage.date_fin) : 'Non spécifiée'}
          </div>
        </div>

        {voyage.commentaire && (
          <div>
            <h3>Commentaire</h3>
            <div className="voyage-comment">
              <p>
                "{voyage.commentaire}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Médias */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="card">
          <h2>Médias</h2>
          
          {/* Images */}
          {images.length > 0 && (
            <div className="media-preview-section">
              <h3 className="section-header">Photos ({images.length})</h3>
              <div className="media-preview-grid">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="media-preview-item card-hover"
                    onClick={() => openMediaModal(image)}
                  >
                    <img
                      src={image.fichier_url}
                      alt={image.titre || `Image ${index + 1}`}
                      className="media-preview-image"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vidéos */}
          {videos.length > 0 && (
            <div className="media-preview-section">
              <h3 className="section-header">Vidéos ({videos.length})</h3>
              <div className="media-preview-grid">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="media-preview-item card-hover"
                    onClick={() => openMediaModal(video)}
                  >
                    <video
                      src={video.fichier_url}
                      className="media-preview-video-placeholder"
                      controls
                      preload="metadata"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal pour afficher les médias en grand */}
      {selectedMedia && (
        <div className="media-modal-overlay" onClick={closeMediaModal}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <div className="media-modal-header">
              <button
                onClick={closeMediaModal}
                className="close"
              >
                ✕
              </button>
            </div>
            
            <div className="media-modal-content">
              {allMedias.length > 1 && (
                <button 
                  className="media-modal-nav media-modal-nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMedia('prev');
                  }}
                >
                  <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
                    <path d="M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z" transform="scale(-1, 1)"/>
                  </svg>
                </button>
              )}
              
              <div className="media-modal-display">
                {selectedMedia.type_media === 'image' ? (
                  <img
                    src={selectedMedia.fichier_url}
                    alt={selectedMedia.titre || 'Image'}
                    className="media-modal-image"
                  />
                ) : (
                  <video
                    src={selectedMedia.fichier_url}
                    controls
                    autoPlay
                    className="media-modal-video"
                  />
                )}
              </div>
              
              {allMedias.length > 1 && (
                <button 
                  className="media-modal-nav media-modal-nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMedia('next');
                  }}
                >
                  <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
                    <path d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"/>
                  </svg>
                </button>
              )}
            </div>
            
            {selectedMedia.titre && (
              <div className="media-modal-footer">
                {selectedMedia.titre} ({currentMediaIndex + 1}/{allMedias.length})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoyageDetail;