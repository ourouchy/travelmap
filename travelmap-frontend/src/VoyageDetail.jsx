import React, { useState, useEffect } from 'react';
import Map from './components/Map';

const VoyageDetail = ({ voyageId, onNavigateBack, setViewingUserId, setCurrentPage }) => {
  const [voyage, setVoyage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

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

  if (isLoading) {
    return (
      <div className="voyage-detail-loading">
        <div>Chargement des détails du voyage...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voyage-detail-error">
        <div>{error}</div>
      </div>
    );
  }

  if (!voyage) {
    return (
      <div className="voyage-detail-error">
        <div>Voyage non trouvé</div>
      </div>
    );
  }

  const images = voyage.medias?.filter(m => m.type_media === 'image') || [];
  const videos = voyage.medias?.filter(m => m.type_media === 'video') || [];

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
    setSelectedMedia(media);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  return (
    <div className="voyage-detail-root">
      {/* En-tête avec carte */}
      <div className="voyage-detail-map-header">
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
        
        {/* Overlay avec informations du voyage */}
        <div className="voyage-detail-map-overlay">
          <h1 className="voyage-detail-title">
            Voyage à {voyage.lieu.nom_ville}
          </h1>
          <p className="voyage-detail-author">
            par{' '}
            <span 
              className="voyage-detail-author-link"
              onClick={() => {
                if (voyage.utilisateur?.id) {
                  setViewingUserId(voyage.utilisateur.id);
                  setCurrentPage('UserPublicProfile');
                }
              }}
              title="Cliquer pour voir le profil"
            >
              {voyage.utilisateur.username}
            </span>
          </p>
          {voyage.note && (
            <div className="voyage-detail-note">
              ⭐ {voyage.note}/5
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="voyage-detail-content">
        {/* Informations du voyage */}
        <div className="voyage-detail-section">
          <h2 className="voyage-detail-section-title">Détails du voyage</h2>
          <div className="voyage-detail-dates-note">
            <div>
              <strong>Date de début :</strong> {formatDate(voyage.date_debut)}
            </div>
            <div>
              <strong>Date de fin :</strong> {voyage.date_fin ? formatDate(voyage.date_fin) : 'Non spécifiée'}
            </div>
            <div>
              <strong>Note :</strong> {voyage.note} ⭐
            </div>
          </div>
          {voyage.commentaire && (
            <div className="voyage-detail-comment">
              <h3>Commentaire</h3>
              <p>
                "{voyage.commentaire}"
              </p>
            </div>
          )}
          
          {/* Bouton de retour */}
          <div className="voyage-detail-back-btn-container">
            <button
              className="voyage-detail-back-btn"
              onClick={onNavigateBack}
            >
              ← Retour
            </button>
          </div>
        </div>

        {/* Médias */}
        {(images.length > 0 || videos.length > 0) && (
          <div className="voyage-detail-section">
            <h2 className="voyage-detail-section-title">Médias</h2>
            {/* Images */}
            {images.length > 0 && (
              <div className="voyage-detail-media-block">
                <h3>Photos ({images.length})</h3>
                <div className="voyage-detail-media-grid voyage-detail-media-grid-images">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="voyage-detail-media-thumb"
                      onClick={() => openMediaModal(image)}
                    >
                      <img
                        src={image.fichier_url}
                        alt={image.titre || `Image ${index + 1}`}
                        className="voyage-detail-media-img"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Vidéos */}
            {videos.length > 0 && (
              <div className="voyage-detail-media-block">
                <h3>Vidéos ({videos.length})</h3>
                <div className="voyage-detail-media-grid voyage-detail-media-grid-videos">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="voyage-detail-media-thumb"
                      onClick={() => openMediaModal(video)}
                    >
                      <video
                        src={video.fichier_url}
                        className="voyage-detail-media-video"
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

        {/* Informations du lieu */}
        <div className="voyage-detail-section">
          <h2 className="voyage-detail-section-title">Lieu visité</h2>
          <div className="voyage-detail-lieu-grid">
            <div>
              <strong>Ville :</strong> {voyage.lieu.nom_ville}
            </div>
            <div>
              <strong>Pays :</strong> {voyage.lieu.pays.nom}
            </div>
            <div>
              <strong>Coordonnées :</strong> {voyage.lieu.latitude}, {voyage.lieu.longitude}
            </div>
            <div>
              <strong>Date de création :</strong> {formatDate(voyage.lieu.date_creation)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour afficher les médias en grand */}
      {selectedMedia && (
        <div
          className="voyage-detail-media-modal"
          onClick={closeMediaModal}
        >
          <div className="voyage-detail-media-modal-content">
            <button
              className="voyage-detail-media-modal-close"
              onClick={closeMediaModal}
            >
              ✕
            </button>
            {selectedMedia.type_media === 'image' ? (
              <img
                src={selectedMedia.fichier_url}
                alt={selectedMedia.titre || 'Image'}
                className="voyage-detail-media-modal-img"
              />
            ) : (
              <video
                src={selectedMedia.fichier_url}
                controls
                autoPlay
                className="voyage-detail-media-modal-video"
              />
            )}
            {selectedMedia.titre && (
              <div className="voyage-detail-media-modal-title">
                {selectedMedia.titre}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoyageDetail;